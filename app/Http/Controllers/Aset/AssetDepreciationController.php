<?php

namespace App\Http\Controllers\Aset;

use App\Http\Controllers\Controller;
use App\Models\Aset\Asset;
use App\Models\Aset\AssetCategory;
use App\Models\Aset\AssetDepreciation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class AssetDepreciationController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->only(['search', 'category_id', 'period_month', 'period_year', 'perPage']);
        $perPage = $filters['perPage'] ?? 15;

        $depreciations = AssetDepreciation::query()
            ->with(['asset:id,code,name,category_id,acquisition_cost,useful_life_months,depreciation_method', 'asset.category:id,name'])
            ->when($filters['search'] ?? null, function ($q, $s) {
                $q->whereHas('asset', function ($query) use ($s) {
                    $query->where('name', 'like', "%{$s}%")->orWhere('code', 'like', "%{$s}%");
                });
            })
            ->when($filters['category_id'] ?? null, function ($q, $v) {
                $q->whereHas('asset', fn ($query) => $query->where('category_id', $v));
            })
            ->when($filters['period_year'] ?? null, function ($q, $y) use ($filters) {
                $month = $filters['period_month'] ?? null;
                if ($month) {
                    $q->whereYear('period_date', $y)->whereMonth('period_date', $month);
                } else {
                    $q->whereYear('period_date', $y);
                }
            })
            ->orderByDesc('period_date')
            ->orderBy('asset_id')
            ->paginate($perPage)
            ->withQueryString();

        // Summary
        $totalDepreciationThisMonth = AssetDepreciation::whereYear('period_date', now()->year)
            ->whereMonth('period_date', now()->month)
            ->sum('depreciation_amount');

        return Inertia::render('aset/depreciations/index', [
            'depreciations' => $depreciations,
            'filters' => $filters,
            'categories' => AssetCategory::active()->orderBy('name')->get(['id', 'name']),
            'totalDepreciationThisMonth' => (float) $totalDepreciationThisMonth,
        ]);
    }

    /**
     * Show form to calculate/run depreciation for a period
     */
    public function calculate()
    {
        $currentPeriod = now()->endOfMonth();

        // Get assets eligible for depreciation
        $eligibleAssets = Asset::where('status', 'active')
            ->whereRaw('current_book_value > salvage_value')
            ->with(['category:id,code,name', 'latestDepreciation'])
            ->orderBy('code')
            ->get()
            ->map(function ($asset) use ($currentPeriod) {
                // Hitung bulan tertinggal — cek semua bulan dari depreciation_start_date
                $startDate = $asset->depreciation_start_date ?? $asset->acquisition_date;
                $missedMonths = 0;

                if ($startDate && !$asset->isUsageBasedMethod()) {
                    $checkMonth = Carbon::parse($startDate)->startOfMonth();
                    $endMonth = $currentPeriod->copy()->startOfMonth();
                    $existingPeriods = $asset->depreciations()
                        ->pluck('period_date')
                        ->map(fn ($d) => Carbon::parse($d)->format('Y-m'))
                        ->toArray();

                    while ($checkMonth->lte($endMonth)) {
                        if (!in_array($checkMonth->format('Y-m'), $existingPeriods)) {
                            $missedMonths++;
                        }
                        $checkMonth->addMonthNoOverflow();
                    }
                    // Jangan melebihi sisa umur manfaat
                    $missedMonths = min($missedMonths, $asset->getRemainingLifeMonths());
                }

                return [
                    'id' => $asset->id,
                    'code' => $asset->code,
                    'name' => $asset->name,
                    'category' => $asset->category?->name,
                    'acquisition_cost' => (float) $asset->acquisition_cost,
                    'current_book_value' => (float) $asset->current_book_value,
                    'salvage_value' => (float) $asset->salvage_value,
                    'depreciation_method' => $asset->depreciation_method,
                    'is_usage_based' => $asset->isUsageBasedMethod(),
                    'estimated_service_hours' => $asset->estimated_service_hours,
                    'estimated_total_production' => $asset->estimated_total_production,
                    'monthly_depreciation' => round($asset->calculateMonthlyDepreciation(), 2),
                    'remaining_life_months' => $asset->getRemainingLifeMonths(),
                    'depreciation_percentage' => round($asset->getDepreciationPercentage(), 2),
                    'is_fully_depreciated' => $asset->isFullyDepreciated(),
                    'missed_months' => $missedMonths,
                    'last_depreciation_date' => $asset->latestDepreciation?->period_date?->format('Y-m-d'),
                ];
            });

        return Inertia::render('aset/depreciations/calculate', [
            'eligibleAssets' => $eligibleAssets,
            'defaultPeriod' => $currentPeriod->format('Y-m-d'),
        ]);
    }

    /**
     * Run depreciation calculation for a specific period.
     * Automatically catches up missed months for each asset.
     */
    public function runDepreciation(Request $request)
    {
        $validated = $request->validate([
            'period_date' => 'required|date',
            'asset_ids' => 'required|array|min:1',
            'asset_ids.*' => 'exists:assets,id',
            'usage_data' => 'nullable|array',
            'usage_data.*' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $targetPeriod = Carbon::parse($validated['period_date'])->endOfMonth();

        $results = [];
        $totalPeriods = 0;

        DB::transaction(function () use ($validated, $targetPeriod, &$results, &$totalPeriods) {
            $assets = Asset::whereIn('id', $validated['asset_ids'])
                ->where('status', 'active')
                ->whereRaw('current_book_value > salvage_value')
                ->with('latestDepreciation')
                ->get();

            $usageData = $validated['usage_data'] ?? [];

            foreach ($assets as $asset) {
                // Untuk metode berbasis pemakaian, hanya proses 1 periode
                if ($asset->isUsageBasedMethod()) {
                    $usage = (float) ($usageData[$asset->id] ?? 0);
                    if ($usage <= 0) continue;

                    $existing = AssetDepreciation::where('asset_id', $asset->id)
                        ->whereYear('period_date', $targetPeriod->year)
                        ->whereMonth('period_date', $targetPeriod->month)
                        ->exists();
                    if ($existing) continue;

                    $depreciationAmount = $asset->calculateUsageDepreciation($usage);
                    if ($depreciationAmount <= 0) continue;

                    if (($asset->current_book_value - $depreciationAmount) < $asset->salvage_value) {
                        $depreciationAmount = $asset->current_book_value - $asset->salvage_value;
                    }

                    $periodNumber = $asset->depreciations()->count() + 1;
                    $newAccumulated = $asset->accumulated_depreciation + $depreciationAmount;
                    $newBookValue = $asset->current_book_value - $depreciationAmount;

                    AssetDepreciation::create([
                        'asset_id' => $asset->id,
                        'period_date' => $targetPeriod,
                        'period_number' => $periodNumber,
                        'depreciation_amount' => $depreciationAmount,
                        'accumulated_depreciation' => $newAccumulated,
                        'book_value' => $newBookValue,
                        'method' => $asset->depreciation_method,
                        'notes' => $validated['notes'] ?? null,
                        'created_by' => Auth::id(),
                    ]);

                    $asset->update([
                        'accumulated_depreciation' => $newAccumulated,
                        'current_book_value' => $newBookValue,
                    ]);

                    $results[] = ['asset_code' => $asset->code, 'amount' => $depreciationAmount, 'periods' => 1];
                    $totalPeriods += 1;
                    continue;
                }

                // ── Metode berbasis waktu: delete & rebuild dari depreciation_start_date ──
                $startDate = $asset->depreciation_start_date ?? $asset->acquisition_date;
                if (!$startDate) continue;

                // Ambil semua record yang sudah ada (untuk preserve jurnal_id, notes, created_by)
                $existingRecords = AssetDepreciation::where('asset_id', $asset->id)
                    ->orderBy('period_date')
                    ->get()
                    ->keyBy(fn ($r) => Carbon::parse($r->period_date)->format('Y-m'));

                // Hitung akumulasi awal (migrasi) = akumulasi aset saat ini - total record penyusutan
                $totalExistingDepreciation = (float) $existingRecords->sum('depreciation_amount');
                $initialAccumulated = (float) $asset->accumulated_depreciation - $totalExistingDepreciation;
                if ($initialAccumulated < 0) $initialAccumulated = 0;

                // Hapus semua record lama — akan di-rebuild ulang dari awal
                AssetDepreciation::where('asset_id', $asset->id)->delete();

                // Rebuild dari depreciation_start_date sampai target period
                $currentBookValue = (float) $asset->acquisition_cost - $initialAccumulated;
                $currentAccumulated = $initialAccumulated;
                $salvageValue = (float) $asset->salvage_value;

                $loopMonth = Carbon::parse($startDate)->startOfMonth();
                $targetMonth = $targetPeriod->copy()->startOfMonth();
                $assetAmount = 0;
                $newPeriodCount = 0;
                $periodNumber = 0;

                while ($loopMonth->lte($targetMonth) && $currentBookValue > $salvageValue) {
                    $periodEnd = $loopMonth->copy()->endOfMonth();
                    $key = $loopMonth->format('Y-m');
                    $periodNumber++;

                    // Set nilai terkini pada asset agar calculateMonthlyDepreciation() akurat
                    $asset->current_book_value = $currentBookValue;
                    $asset->accumulated_depreciation = $currentAccumulated;

                    $depreciationAmount = round($asset->calculateMonthlyDepreciation(), 2);
                    if ($depreciationAmount <= 0) break;

                    if (($currentBookValue - $depreciationAmount) < $salvageValue) {
                        $depreciationAmount = round($currentBookValue - $salvageValue, 2);
                    }
                    if ($depreciationAmount <= 0) break;

                    $currentAccumulated += $depreciationAmount;
                    $currentBookValue -= $depreciationAmount;

                    // Preserve jurnal_id/notes/created_by dari record lama jika ada
                    $oldRecord = $existingRecords->get($key);

                    AssetDepreciation::create([
                        'asset_id' => $asset->id,
                        'period_date' => $periodEnd,
                        'period_number' => $periodNumber,
                        'depreciation_amount' => $depreciationAmount,
                        'accumulated_depreciation' => round($currentAccumulated, 2),
                        'book_value' => round($currentBookValue, 2),
                        'method' => $asset->depreciation_method,
                        'jurnal_id' => $oldRecord?->jurnal_id,
                        'notes' => $oldRecord?->notes ?? ($validated['notes'] ?? null),
                        'created_by' => $oldRecord?->created_by ?? Auth::id(),
                    ]);

                    // Hanya hitung periode yang benar-benar baru
                    if (!$existingRecords->has($key)) {
                        $assetAmount += $depreciationAmount;
                        $newPeriodCount++;
                    }

                    $loopMonth->addMonthNoOverflow();
                }

                // Update asset final state
                $asset->update([
                    'accumulated_depreciation' => round($currentAccumulated, 2),
                    'current_book_value' => round($currentBookValue, 2),
                ]);

                if ($newPeriodCount > 0) {
                    $results[] = [
                        'asset_code' => $asset->code,
                        'amount' => round($assetAmount, 2),
                        'periods' => $newPeriodCount,
                    ];
                    $totalPeriods += $newPeriodCount;
                }
            }
        });

        $totalAmount = collect($results)->sum('amount');
        $assetCount = count($results);

        $message = $totalPeriods > $assetCount
            ? sprintf(
                'Penyusutan berhasil dihitung untuk %d aset (%d periode, termasuk bulan tertinggal). Total: Rp %s',
                $assetCount,
                $totalPeriods,
                number_format($totalAmount, 0, ',', '.')
            )
            : sprintf(
                'Penyusutan berhasil dihitung untuk %d aset. Total: Rp %s',
                $assetCount,
                number_format($totalAmount, 0, ',', '.')
            );

        return redirect()->route('aset.depreciations.index')
            ->with('success', $message);
    }
}
