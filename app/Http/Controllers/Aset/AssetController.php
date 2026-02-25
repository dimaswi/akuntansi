<?php

namespace App\Http\Controllers\Aset;

use App\Http\Controllers\Controller;
use App\Models\Aset\Asset;
use App\Models\Aset\AssetCategory;
use App\Models\Inventory\Department;
use App\Models\Inventory\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AssetController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->only([
            'search', 'category_id', 'department_id', 'status', 'condition', 'perPage',
        ]);
        $perPage = $filters['perPage'] ?? 10;

        $assets = Asset::query()
            ->with(['category:id,code,name', 'department:id,name', 'supplier:id,name'])
            ->when($filters['search'] ?? null, function ($q, $s) {
                $q->where(function ($query) use ($s) {
                    $query->where('name', 'like', "%{$s}%")
                        ->orWhere('code', 'like', "%{$s}%")
                        ->orWhere('serial_number', 'like', "%{$s}%")
                        ->orWhere('brand', 'like', "%{$s}%");
                });
            })
            ->when($filters['category_id'] ?? null, fn ($q, $v) => $q->where('category_id', $v))
            ->when($filters['department_id'] ?? null, fn ($q, $v) => $q->where('department_id', $v))
            ->when($filters['status'] ?? null, fn ($q, $v) => $q->where('status', $v))
            ->when($filters['condition'] ?? null, fn ($q, $v) => $q->where('condition', $v))
            ->orderByDesc('created_at')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('aset/assets/index', [
            'assets' => $assets,
            'filters' => $filters,
            'categories' => AssetCategory::active()->orderBy('name')->get(['id', 'name']),
            'departments' => Department::where('is_active', true)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function create()
    {
        return Inertia::render('aset/assets/create', [
            'categories' => AssetCategory::active()->orderBy('name')->get(['id', 'code', 'name', 'default_useful_life_years', 'default_depreciation_method', 'default_salvage_percentage']),
            'departments' => Department::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'suppliers' => Supplier::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'generatedCode' => Asset::generateCode(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:30|unique:assets,code',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category_id' => 'required|exists:asset_categories,id',
            'department_id' => 'nullable|exists:departments,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'location' => 'nullable|string|max:255',
            'brand' => 'nullable|string|max:100',
            'model' => 'nullable|string|max:100',
            'serial_number' => 'nullable|string|max:100',
            'plate_number' => 'nullable|string|max:20',
            'acquisition_date' => 'required|date',
            'acquisition_type' => 'required|in:purchase,donation,transfer_in,leasing,self_built',
            'acquisition_cost' => 'required|numeric|min:0',
            'useful_life_months' => 'required|integer|min:1',
            'salvage_value' => 'required|numeric|min:0',
            'depreciation_method' => 'required|in:straight_line,declining_balance,double_declining,sum_of_years_digits,service_hours,productive_output',
            'estimated_service_hours' => 'nullable|required_if:depreciation_method,service_hours|integer|min:1',
            'estimated_total_production' => 'nullable|required_if:depreciation_method,productive_output|integer|min:1',
            'depreciation_start_date' => 'required|date',
            'condition' => 'required|in:excellent,good,fair,poor,damaged',
            'warranty_expiry_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'specifications' => 'nullable|array',
            'initial_accumulated_depreciation' => 'nullable|numeric|min:0',
        ]);

        $initialDepreciation = (float) ($validated['initial_accumulated_depreciation'] ?? 0);
        unset($validated['initial_accumulated_depreciation']);

        // Validasi: akumulasi awal tidak boleh melebihi nilai yang bisa disusutkan
        $maxDepreciable = $validated['acquisition_cost'] - $validated['salvage_value'];
        if ($initialDepreciation > $maxDepreciable) {
            return back()->with('error', 'Akumulasi penyusutan awal tidak boleh melebihi nilai yang dapat disusutkan (harga perolehan - nilai residu).');
        }

        $validated['current_book_value'] = $validated['acquisition_cost'] - $initialDepreciation;
        $validated['accumulated_depreciation'] = $initialDepreciation;
        $validated['status'] = 'active';
        $validated['created_by'] = Auth::id();

        DB::transaction(function () use ($validated) {
            Asset::create($validated);
        });

        return redirect()->route('aset.assets.index')
            ->with('success', 'Aset berhasil ditambahkan.');
    }

    public function show(Asset $asset)
    {
        $asset->load([
            'category:id,code,name',
            'department:id,name',
            'supplier:id,name',
            'creator:id,name',
            'depreciations' => fn ($q) => $q->orderByDesc('period_date')->limit(24),
            'maintenances' => fn ($q) => $q->orderByDesc('scheduled_date')->limit(10),
            'transfers' => fn ($q) => $q->with(['fromDepartment:id,name', 'toDepartment:id,name'])->orderByDesc('transfer_date')->limit(10),
            'disposals' => fn ($q) => $q->orderByDesc('disposal_date')->limit(5),
        ]);

        return Inertia::render('aset/assets/show', [
            'asset' => $asset,
        ]);
    }

    public function edit(Asset $asset)
    {
        $asset->load(['category', 'department', 'supplier']);
        $hasDepreciations = $asset->depreciations()->exists();

        return Inertia::render('aset/assets/edit', [
            'asset' => $asset,
            'categories' => AssetCategory::active()->orderBy('name')->get(['id', 'code', 'name', 'default_useful_life_years', 'default_depreciation_method', 'default_salvage_percentage']),
            'departments' => Department::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'suppliers' => Supplier::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'hasDepreciations' => $hasDepreciations,
        ]);
    }

    public function update(Request $request, Asset $asset)
    {
        $rules = [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category_id' => 'required|exists:asset_categories,id',
            'department_id' => 'nullable|exists:departments,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'location' => 'nullable|string|max:255',
            'brand' => 'nullable|string|max:100',
            'model' => 'nullable|string|max:100',
            'serial_number' => 'nullable|string|max:100',
            'plate_number' => 'nullable|string|max:20',
            'condition' => 'required|in:excellent,good,fair,poor,damaged',
            'warranty_expiry_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'specifications' => 'nullable|array',
            // depreciation_start_date selalu bisa diubah (untuk koreksi tanggal mulai)
            'depreciation_start_date' => 'nullable|date',
        ];

        // Jika belum ada penyusutan, boleh ubah field keuangan
        $hasDepreciations = $asset->depreciations()->exists();
        if (!$hasDepreciations) {
            $rules = array_merge($rules, [
                'acquisition_date' => 'nullable|date',
                'acquisition_type' => 'nullable|in:purchase,donation,transfer_in,leasing,self_built',
                'acquisition_cost' => 'nullable|numeric|min:0',
                'useful_life_months' => 'nullable|integer|min:1',
                'salvage_value' => 'nullable|numeric|min:0',
                'depreciation_method' => 'nullable|in:straight_line,declining_balance,double_declining,sum_of_years_digits,service_hours,productive_output',
                'estimated_service_hours' => 'nullable|integer|min:1',
                'estimated_total_production' => 'nullable|integer|min:1',
                'initial_accumulated_depreciation' => 'nullable|numeric|min:0',
            ]);
        }

        $validated = $request->validate($rules);

        // Hitung ulang current_book_value jika field keuangan diubah
        if (!$hasDepreciations && isset($validated['acquisition_cost'])) {
            $initialDep = (float) ($validated['initial_accumulated_depreciation'] ?? 0);
            unset($validated['initial_accumulated_depreciation']);

            $maxDepreciable = $validated['acquisition_cost'] - ($validated['salvage_value'] ?? $asset->salvage_value);
            if ($initialDep > $maxDepreciable) {
                return back()->with('error', 'Akumulasi penyusutan awal melebihi nilai yang dapat disusutkan.');
            }

            $validated['current_book_value'] = $validated['acquisition_cost'] - $initialDep;
            $validated['accumulated_depreciation'] = $initialDep;
        }

        $asset->update($validated);

        return redirect()->route('aset.assets.show', $asset)
            ->with('success', 'Aset berhasil diperbarui.');
    }

    public function destroy(Asset $asset)
    {
        if ($asset->depreciations()->exists()) {
            return back()->with('error', 'Aset tidak bisa dihapus karena sudah memiliki riwayat penyusutan.');
        }

        $asset->delete();

        return redirect()->route('aset.assets.index')
            ->with('success', 'Aset berhasil dihapus.');
    }

    /**
     * API: search assets
     */
    public function api(Request $request)
    {
        $search = $request->get('search', '');

        $assets = Asset::active()
            ->when($search, function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            })
            ->with('department:id,name')
            ->orderBy('name')
            ->limit(50)
            ->get(['id', 'code', 'name', 'department_id', 'current_book_value', 'status']);

        return response()->json(['data' => $assets]);
    }
}
