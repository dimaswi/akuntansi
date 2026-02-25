<?php

namespace App\Http\Controllers\Aset;

use App\Http\Controllers\Controller;
use App\Models\Aset\Asset;
use App\Models\Aset\AssetCategory;
use App\Models\Aset\AssetDepreciation;
use App\Models\Inventory\Department;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AssetReportController extends Controller
{
    /**
     * Asset register / daftar aset
     */
    public function register(Request $request)
    {
        $filters = $request->only(['search', 'category_id', 'department_id', 'status', 'condition', 'perPage']);
        $perPage = $filters['perPage'] ?? 20;

        $query = Asset::query()
            ->with(['category:id,code,name', 'department:id,name'])
            ->when($filters['search'] ?? null, function ($q, $s) {
                $q->where(function ($query) use ($s) {
                    $query->where('code', 'like', "%{$s}%")
                        ->orWhere('name', 'like', "%{$s}%");
                });
            })
            ->when($filters['category_id'] ?? null, fn ($q, $v) => $q->where('category_id', $v))
            ->when($filters['department_id'] ?? null, fn ($q, $v) => $q->where('department_id', $v))
            ->when($filters['status'] ?? null, fn ($q, $v) => $q->where('status', $v))
            ->when($filters['condition'] ?? null, fn ($q, $v) => $q->where('condition', $v))
            ->orderBy('code');

        // Summary from the full filtered query (before pagination)
        $summaryQuery = clone $query;
        $summary = [
            'total_assets' => $summaryQuery->count(),
            'total_cost' => (float) $summaryQuery->sum('acquisition_cost'),
            'total_depreciation' => (float) $summaryQuery->sum('accumulated_depreciation'),
            'total_book_value' => (float) $summaryQuery->sum('current_book_value'),
        ];

        $assets = $query->paginate($perPage)->withQueryString();

        return Inertia::render('aset/reports/register', [
            'assets' => $assets,
            'filters' => $filters,
            'summary' => $summary,
            'categories' => AssetCategory::active()->orderBy('name')->get(['id', 'name']),
            'departments' => Department::where('is_active', true)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Depreciation report
     */
    public function depreciation(Request $request)
    {
        $filters = $request->only(['year', 'month', 'search', 'perPage']);
        $year = $filters['year'] ?? now()->year;
        $month = $filters['month'] ?? null;
        $perPage = $filters['perPage'] ?? 20;

        $query = AssetDepreciation::query()
            ->with(['asset:id,code,name,category_id,acquisition_cost,useful_life_months,current_book_value,accumulated_depreciation,depreciation_method,status', 'asset.category:id,name'])
            ->whereYear('period_date', $year);

        if ($month) {
            $query->whereMonth('period_date', $month);
        }

        $depreciations = $query->orderBy('period_date')
            ->orderBy('asset_id')
            ->get();

        // Group by asset
        $grouped = $depreciations->groupBy('asset_id')->map(function ($items) {
            $asset = $items->first()->asset;
            $monthlyMap = [];
            $totalYear = 0;
            foreach ($items as $d) {
                $m = (int) $d->period_date->format('m');
                $monthlyMap[$m] = ($monthlyMap[$m] ?? 0) + (float) $d->depreciation_amount;
                $totalYear += (float) $d->depreciation_amount;
            }
            return [
                'asset_id' => $asset->id,
                'asset_code' => $asset->code,
                'asset_name' => $asset->name,
                'category_name' => $asset->category?->name ?? '-',
                'depreciation_method' => $asset->depreciation_method ?? 'straight_line',
                'acquisition_cost' => (float) $asset->acquisition_cost,
                'useful_life' => $asset->useful_life_months,
                'accumulated_depreciation' => (float) $asset->accumulated_depreciation,
                'book_value' => (float) $asset->current_book_value,
                'asset_status' => $asset->status,
                'depreciations' => collect($monthlyMap)->map(fn ($amount, $m) => [
                    'period_date' => sprintf('%d-%02d-01', now()->year, $m),
                    'amount' => $amount,
                ])->values()->toArray(),
                'total_year' => $totalYear,
            ];
        })->values();

        // Search filter
        if ($filters['search'] ?? null) {
            $search = strtolower($filters['search']);
            $grouped = $grouped->filter(function ($item) use ($search) {
                return str_contains(strtolower($item['asset_code']), $search)
                    || str_contains(strtolower($item['asset_name']), $search);
            })->values();
        }

        // Summary
        $summary = [
            'total_depreciation_year' => $grouped->sum('total_year'),
            'total_accumulated' => $grouped->sum('accumulated_depreciation'),
            'total_book_value' => $grouped->sum('book_value'),
        ];

        // Manual pagination
        $page = $request->get('page', 1);
        $total = $grouped->count();
        $sliced = $grouped->slice(($page - 1) * $perPage, $perPage)->values();
        $paginated = new \Illuminate\Pagination\LengthAwarePaginator(
            $sliced, $total, $perPage, $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        // Available years
        $years = AssetDepreciation::selectRaw('DISTINCT YEAR(period_date) as y')
            ->orderByDesc('y')
            ->pluck('y');
        if ($years->isEmpty()) {
            $years = collect([(int) now()->year]);
        }

        return Inertia::render('aset/reports/depreciation', [
            'items' => $paginated,
            'filters' => $filters,
            'years' => $years,
            'summary' => $summary,
        ]);
    }
}
