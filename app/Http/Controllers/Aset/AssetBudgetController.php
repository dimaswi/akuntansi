<?php

namespace App\Http\Controllers\Aset;

use App\Http\Controllers\Controller;
use App\Models\Aset\Asset;
use App\Models\Aset\AssetBudget;
use App\Models\Aset\AssetBudgetItem;
use App\Models\Aset\AssetBudgetRealization;
use App\Models\Aset\AssetCategory;
use App\Models\Inventory\Department;
use App\Models\Inventory\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AssetBudgetController extends Controller
{
    // ─── LIST RAB ──────────────────────────────────────────

    public function index(Request $request)
    {
        $filters = $request->only(['search', 'fiscal_year', 'status', 'perPage']);
        $perPage = $filters['perPage'] ?? 10;

        $budgets = AssetBudget::query()
            ->with(['creator:id,name', 'approver:id,name'])
            ->withCount('items')
            ->when($filters['search'] ?? null, function ($q, $s) {
                $q->where(function ($query) use ($s) {
                    $query->where('code', 'like', "%{$s}%")
                        ->orWhere('title', 'like', "%{$s}%");
                });
            })
            ->when($filters['fiscal_year'] ?? null, fn ($q, $v) => $q->where('fiscal_year', $v))
            ->when($filters['status'] ?? null, fn ($q, $v) => $q->where('status', $v))
            ->orderByDesc('fiscal_year')
            ->orderByDesc('created_at')
            ->paginate($perPage)
            ->withQueryString();

        $availableYears = AssetBudget::selectRaw('DISTINCT fiscal_year')
            ->orderByDesc('fiscal_year')
            ->pluck('fiscal_year');

        return Inertia::render('aset/budgets/index', [
            'budgets' => $budgets,
            'filters' => $filters,
            'availableYears' => $availableYears,
        ]);
    }

    // ─── CREATE RAB ────────────────────────────────────────

    public function create()
    {
        $year = (int) date('Y');

        return Inertia::render('aset/budgets/create', [
            'categories' => AssetCategory::active()->orderBy('name')->get(['id', 'name']),
            'departments' => Department::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'generatedCode' => AssetBudget::generateCode($year),
            'defaultYear' => $year,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:30|unique:asset_budgets,code',
            'fiscal_year' => 'required|integer|min:2020|max:2099',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.category_id' => 'nullable|exists:asset_categories,id',
            'items.*.department_id' => 'nullable|exists:departments,id',
            'items.*.item_name' => 'required|string|max:255',
            'items.*.description' => 'nullable|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.estimated_unit_cost' => 'required|numeric|min:0',
            'items.*.priority' => 'required|in:high,medium,low',
            'items.*.notes' => 'nullable|string',
        ]);

        DB::transaction(function () use ($validated) {
            $budget = AssetBudget::create([
                'code' => $validated['code'],
                'fiscal_year' => $validated['fiscal_year'],
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'status' => 'draft',
                'created_by' => Auth::id(),
            ]);

            foreach ($validated['items'] as $item) {
                $budget->items()->create([
                    'category_id' => $item['category_id'] ?: null,
                    'department_id' => $item['department_id'] ?: null,
                    'item_name' => $item['item_name'],
                    'description' => $item['description'] ?? null,
                    'quantity' => $item['quantity'],
                    'estimated_unit_cost' => $item['estimated_unit_cost'],
                    'estimated_total_cost' => $item['quantity'] * $item['estimated_unit_cost'],
                    'priority' => $item['priority'],
                    'notes' => $item['notes'] ?? null,
                    'status' => 'pending',
                ]);
            }

            $budget->recalculateTotals();
        });

        return redirect()->route('aset.budgets.index')
            ->with('success', 'RAB berhasil dibuat.');
    }

    // ─── SHOW RAB ──────────────────────────────────────────

    public function show(AssetBudget $budget)
    {
        $budget->load([
            'items' => fn ($q) => $q->with([
                'category:id,name',
                'department:id,name',
                'realizations' => fn ($r) => $r->with(['asset:id,code,name', 'creator:id,name'])->orderByDesc('realization_date'),
                'rolledFrom.budget:id,code,fiscal_year',
            ])->orderBy('id'),
            'creator:id,name',
            'submitter:id,name',
            'approver:id,name',
        ]);

        return Inertia::render('aset/budgets/show', [
            'budget' => $budget,
        ]);
    }

    // ─── EDIT RAB ──────────────────────────────────────────

    public function edit(AssetBudget $budget)
    {
        if ($budget->status !== 'draft') {
            return back()->with('error', 'Hanya RAB berstatus draft yang dapat diedit.');
        }

        $budget->load('items');

        return Inertia::render('aset/budgets/edit', [
            'budget' => $budget,
            'categories' => AssetCategory::active()->orderBy('name')->get(['id', 'name']),
            'departments' => Department::where('is_active', true)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(Request $request, AssetBudget $budget)
    {
        if ($budget->status !== 'draft') {
            return back()->with('error', 'Hanya RAB berstatus draft yang dapat diedit.');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.id' => 'nullable|integer',
            'items.*.category_id' => 'nullable|exists:asset_categories,id',
            'items.*.department_id' => 'nullable|exists:departments,id',
            'items.*.item_name' => 'required|string|max:255',
            'items.*.description' => 'nullable|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.estimated_unit_cost' => 'required|numeric|min:0',
            'items.*.priority' => 'required|in:high,medium,low',
            'items.*.notes' => 'nullable|string',
        ]);

        DB::transaction(function () use ($validated, $budget) {
            $budget->update([
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
            ]);

            $keepIds = collect($validated['items'])->pluck('id')->filter()->toArray();
            $budget->items()->whereNotIn('id', $keepIds)->where('status', 'pending')->delete();

            foreach ($validated['items'] as $item) {
                $data = [
                    'category_id' => $item['category_id'] ?: null,
                    'department_id' => $item['department_id'] ?: null,
                    'item_name' => $item['item_name'],
                    'description' => $item['description'] ?? null,
                    'quantity' => $item['quantity'],
                    'estimated_unit_cost' => $item['estimated_unit_cost'],
                    'estimated_total_cost' => $item['quantity'] * $item['estimated_unit_cost'],
                    'priority' => $item['priority'],
                    'notes' => $item['notes'] ?? null,
                ];

                if (!empty($item['id'])) {
                    $budget->items()->where('id', $item['id'])->update($data);
                } else {
                    $budget->items()->create(array_merge($data, ['status' => 'pending']));
                }
            }

            $budget->recalculateTotals();
        });

        return redirect()->route('aset.budgets.show', $budget)
            ->with('success', 'RAB berhasil diperbarui.');
    }

    // ─── DELETE RAB ────────────────────────────────────────

    public function destroy(AssetBudget $budget)
    {
        if ($budget->status !== 'draft') {
            return back()->with('error', 'Hanya RAB berstatus draft yang dapat dihapus.');
        }

        DB::transaction(function () use ($budget) {
            // Restore source items that were rolled over into this budget
            $rolledFromIds = $budget->items()
                ->whereNotNull('rolled_from_id')
                ->pluck('rolled_from_id');

            if ($rolledFromIds->isNotEmpty()) {
                AssetBudgetItem::whereIn('id', $rolledFromIds)
                    ->where('status', 'rolled_over')
                    ->each(function (AssetBudgetItem $sourceItem) {
                        // Restore to appropriate status based on realization
                        if ($sourceItem->realized_quantity > 0) {
                            $sourceItem->status = 'partially_realized';
                        } else {
                            $sourceItem->status = 'pending';
                        }
                        $sourceItem->save();
                    });

                // Re-check if source budget should be re-opened
                $sourceBudgetIds = AssetBudgetItem::whereIn('id', $rolledFromIds)->pluck('asset_budget_id')->unique();
                foreach ($sourceBudgetIds as $sourceBudgetId) {
                    $sourceBudget = AssetBudget::find($sourceBudgetId);
                    if ($sourceBudget && $sourceBudget->status === 'closed') {
                        $hasPending = $sourceBudget->items()
                            ->whereIn('status', ['pending', 'partially_realized'])
                            ->exists();
                        if ($hasPending) {
                            $sourceBudget->update(['status' => 'approved']);
                        }
                    }
                }
            }

            $budget->items()->delete();
            $budget->delete();
        });

        return redirect()->route('aset.budgets.index')
            ->with('success', 'RAB berhasil dihapus.');
    }

    // ─── SUBMIT RAB ───────────────────────────────────────

    public function submit(AssetBudget $budget)
    {
        if ($budget->status !== 'draft') {
            return back()->with('error', 'RAB sudah disubmit.');
        }

        $budget->update([
            'status' => 'submitted',
            'submitted_by' => Auth::id(),
            'submitted_at' => now(),
        ]);

        return back()->with('success', 'RAB berhasil disubmit untuk persetujuan.');
    }

    // ─── APPROVE RAB ──────────────────────────────────────

    public function approve(AssetBudget $budget)
    {
        if ($budget->status !== 'submitted') {
            return back()->with('error', 'RAB harus berstatus submitted untuk disetujui.');
        }

        $budget->update([
            'status' => 'approved',
            'approved_by' => Auth::id(),
            'approved_at' => now(),
        ]);

        return back()->with('success', 'RAB berhasil disetujui.');
    }

    // ─── REALIZE ITEM (FORM) ──────────────────────────────

    public function realizeForm(AssetBudgetItem $item)
    {
        $item->load(['budget:id,code,fiscal_year,title,status', 'category:id,name', 'department:id,name']);

        if (!in_array($item->budget->status, ['approved'])) {
            return back()->with('error', 'RAB harus berstatus approved untuk realisasi.');
        }

        if (in_array($item->status, ['realized', 'rolled_over', 'cancelled'])) {
            return back()->with('error', 'Item ini tidak bisa direalisasi.');
        }

        return Inertia::render('aset/budgets/realize', [
            'budgetItem' => $item,
            'remainingQty' => $item->remaining_quantity,
            'categories' => AssetCategory::active()->orderBy('name')
                ->get(['id', 'code', 'name', 'default_useful_life_years', 'default_depreciation_method', 'default_salvage_percentage']),
            'departments' => Department::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'suppliers' => Supplier::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'generatedAssetCode' => Asset::generateCode(),
        ]);
    }

    // ─── REALIZE ITEM (STORE) ─────────────────────────────

    public function realizeStore(Request $request, AssetBudgetItem $item)
    {
        if (!in_array($item->budget->status, ['approved'])) {
            return back()->with('error', 'RAB harus berstatus approved untuk realisasi.');
        }

        if (in_array($item->status, ['realized', 'rolled_over', 'cancelled'])) {
            return back()->with('error', 'Item ini tidak bisa direalisasi.');
        }

        $validated = $request->validate([
            'quantity' => 'required|integer|min:1|max:' . $item->remaining_quantity,
            'actual_cost' => 'required|numeric|min:0',
            'realization_date' => 'required|date',
            'notes' => 'nullable|string',
            // Asset creation data
            'create_asset' => 'required|boolean',
            'asset_code' => 'required_if:create_asset,true|nullable|string|max:30|unique:assets,code',
            'asset_name' => 'required_if:create_asset,true|nullable|string|max:255',
            'asset_category_id' => 'required_if:create_asset,true|nullable|exists:asset_categories,id',
            'asset_department_id' => 'nullable|exists:departments,id',
            'asset_supplier_id' => 'nullable|exists:suppliers,id',
            'asset_location' => 'nullable|string|max:255',
            'asset_brand' => 'nullable|string|max:100',
            'asset_model' => 'nullable|string|max:100',
            'asset_serial_number' => 'nullable|string|max:100',
            'asset_useful_life_months' => 'required_if:create_asset,true|nullable|integer|min:1',
            'asset_salvage_value' => 'required_if:create_asset,true|nullable|numeric|min:0',
            'asset_depreciation_method' => 'required_if:create_asset,true|nullable|in:straight_line,declining_balance,double_declining,sum_of_years_digits,service_hours,productive_output',
            'asset_condition' => 'nullable|in:excellent,good,fair,poor,damaged',
        ]);

        DB::transaction(function () use ($validated, $item) {
            $asset = null;

            if ($validated['create_asset']) {
                $asset = Asset::create([
                    'code' => $validated['asset_code'],
                    'name' => $validated['asset_name'],
                    'category_id' => $validated['asset_category_id'],
                    'department_id' => $validated['asset_department_id'] ?? null,
                    'supplier_id' => $validated['asset_supplier_id'] ?? null,
                    'location' => $validated['asset_location'] ?? null,
                    'brand' => $validated['asset_brand'] ?? null,
                    'model' => $validated['asset_model'] ?? null,
                    'serial_number' => $validated['asset_serial_number'] ?? null,
                    'acquisition_date' => $validated['realization_date'],
                    'acquisition_type' => 'purchase',
                    'acquisition_cost' => $validated['actual_cost'],
                    'useful_life_months' => $validated['asset_useful_life_months'],
                    'salvage_value' => $validated['asset_salvage_value'] ?? 0,
                    'depreciation_method' => $validated['asset_depreciation_method'],
                    'current_book_value' => $validated['actual_cost'],
                    'accumulated_depreciation' => 0,
                    'depreciation_start_date' => $validated['realization_date'],
                    'status' => 'active',
                    'condition' => $validated['asset_condition'] ?? 'good',
                    'created_by' => Auth::id(),
                ]);
            }

            AssetBudgetRealization::create([
                'budget_item_id' => $item->id,
                'asset_id' => $asset?->id,
                'quantity' => $validated['quantity'],
                'actual_cost' => $validated['actual_cost'],
                'realization_date' => $validated['realization_date'],
                'notes' => $validated['notes'] ?? null,
                'created_by' => Auth::id(),
            ]);

            $item->recalculateRealization();
            $item->budget->recalculateTotals();
        });

        return redirect()->route('aset.budgets.show', $item->asset_budget_id)
            ->with('success', 'Realisasi berhasil dicatat.');
    }

    // ─── ROLLOVER RAB ─────────────────────────────────────

    public function rolloverForm(AssetBudget $budget)
    {
        if (!in_array($budget->status, ['approved', 'closed'])) {
            return back()->with('error', 'Hanya RAB approved/closed yang dapat di-rollover.');
        }

        $unrealizedItems = $budget->items()
            ->with(['category:id,name', 'department:id,name'])
            ->whereIn('status', ['pending', 'partially_realized'])
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'item_name' => $item->item_name,
                    'description' => $item->description,
                    'category' => $item->category,
                    'department' => $item->department,
                    'category_id' => $item->category_id,
                    'department_id' => $item->department_id,
                    'original_quantity' => $item->quantity,
                    'realized_quantity' => $item->realized_quantity,
                    'remaining_quantity' => $item->remaining_quantity,
                    'estimated_unit_cost' => (float) $item->estimated_unit_cost,
                    'priority' => $item->priority,
                    'notes' => $item->notes,
                    'selected' => true,
                ];
            });

        $nextYear = $budget->fiscal_year + 1;

        return Inertia::render('aset/budgets/rollover', [
            'sourceBudget' => $budget->only('id', 'code', 'fiscal_year', 'title'),
            'unrealizedItems' => $unrealizedItems,
            'nextYear' => $nextYear,
            'generatedCode' => AssetBudget::generateCode($nextYear),
        ]);
    }

    public function rolloverStore(Request $request, AssetBudget $budget)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:30|unique:asset_budgets,code',
            'fiscal_year' => 'required|integer|min:2020|max:2099',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.source_item_id' => 'nullable|integer',
            'items.*.category_id' => 'nullable|exists:asset_categories,id',
            'items.*.department_id' => 'nullable|exists:departments,id',
            'items.*.item_name' => 'required|string|max:255',
            'items.*.description' => 'nullable|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.estimated_unit_cost' => 'required|numeric|min:0',
            'items.*.priority' => 'required|in:high,medium,low',
            'items.*.notes' => 'nullable|string',
        ]);

        DB::transaction(function () use ($validated, $budget) {
            $newBudget = AssetBudget::create([
                'code' => $validated['code'],
                'fiscal_year' => $validated['fiscal_year'],
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'status' => 'draft',
                'created_by' => Auth::id(),
            ]);

            foreach ($validated['items'] as $item) {
                $newBudget->items()->create([
                    'category_id' => $item['category_id'] ?: null,
                    'department_id' => $item['department_id'] ?: null,
                    'item_name' => $item['item_name'],
                    'description' => $item['description'] ?? null,
                    'quantity' => $item['quantity'],
                    'estimated_unit_cost' => $item['estimated_unit_cost'],
                    'estimated_total_cost' => $item['quantity'] * $item['estimated_unit_cost'],
                    'priority' => $item['priority'],
                    'notes' => $item['notes'] ?? null,
                    'rolled_from_id' => $item['source_item_id'] ?? null,
                    'status' => 'pending',
                ]);

                // Mark source item as rolled over
                if (!empty($item['source_item_id'])) {
                    AssetBudgetItem::where('id', $item['source_item_id'])->update(['status' => 'rolled_over']);
                }
            }

            $newBudget->recalculateTotals();

            // Close the source budget if all items resolved
            $pendingCount = $budget->items()->whereIn('status', ['pending', 'partially_realized'])->count();
            if ($pendingCount === 0) {
                $budget->update(['status' => 'closed']);
            }
        });

        return redirect()->route('aset.budgets.index')
            ->with('success', 'Rollover RAB berhasil. RAB baru telah dibuat.');
    }
}
