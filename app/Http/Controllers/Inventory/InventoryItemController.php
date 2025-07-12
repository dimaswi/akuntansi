<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Inventory\InventoryItem;
use App\Models\Inventory\InventoryCategory;
use App\Models\Inventory\PharmacyItemDetail;
use App\Models\Inventory\GeneralItemDetail;
use App\Models\DepartmentInventoryLocation;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class InventoryItemController extends Controller
{
    /**
     * Check if user has permission
     */
    private function userHasPermission($user, $permission)
    {
        $userWithRole = User::with('role.permissions')->find($user->id);
        return $userWithRole->hasPermission($permission);
    }

    public function index(Request $request)
    {
        $user = User::with('department')->find(Auth::id());
        
        // Check if user can view all departments or only own department
        $canViewAllDepartments = $this->userHasPermission($user, 'inventory.item.view.all.departments');
        
        $query = InventoryItem::with(['category', 'stocks', 'pharmacyDetails', 'generalDetails'])
            ->select('inventory_items.*')
            ->leftJoin('inventory_stocks', 'inventory_items.id', '=', 'inventory_stocks.item_id')
            ->selectRaw('COALESCE(SUM(inventory_stocks.current_quantity), 0) as current_stock')
            ->selectRaw('COALESCE(SUM(inventory_stocks.available_quantity), 0) as available_stock')
            ->selectRaw('COALESCE(SUM(inventory_stocks.reserved_quantity), 0) as reserved_stock')
            ->groupBy('inventory_items.id');

        // Filter berdasarkan departemen jika user tidak memiliki akses ke semua departemen
        if (!$canViewAllDepartments && $user->department_id) {
            // Hanya tampilkan item yang ada di departemen user
            $departmentItemIds = DepartmentInventoryLocation::where('department_id', $user->department_id)
                ->pluck('inventory_item_id')
                ->toArray();
            
            if (!empty($departmentItemIds)) {
                $query->whereIn('inventory_items.id', $departmentItemIds);
            } else {
                // Jika departemen belum punya item, tampilkan kosong
                $query->whereRaw('1 = 0');
            }
        }

        // Apply filters
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category') && $request->category !== 'all') {
            $query->where('category_id', $request->category);
        }

        if ($request->filled('type') && $request->type !== 'all') {
            $query->where('inventory_type', $request->type);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            switch ($request->status) {
                case 'low':
                    $query->havingRaw('current_stock <= inventory_items.reorder_level');
                    break;
                case 'out':
                    $query->havingRaw('current_stock = 0');
                    break;
                case 'over':
                    $query->havingRaw('current_stock >= inventory_items.max_level');
                    break;
                case 'normal':
                    $query->havingRaw('current_stock > inventory_items.reorder_level AND current_stock < inventory_items.max_level');
                    break;
            }
        }

        $items = $query->orderBy('code')->paginate(20);

        // Transform data for frontend
        $items->getCollection()->transform(function ($item) use ($user, $canViewAllDepartments) {
            $departmentInfo = null;
            
            // Jika user hanya bisa lihat departemen sendiri, ambil info department stock
            if (!$canViewAllDepartments && $user->department_id) {
                $departmentStock = DepartmentInventoryLocation::with('department')
                    ->where('inventory_item_id', $item->id)
                    ->where('department_id', $user->department_id)
                    ->first();
                
                if ($departmentStock) {
                    $departmentInfo = [
                        'department_name' => $departmentStock->department->name,
                        'department_code' => $departmentStock->department->code,
                        'department_stock' => $departmentStock->current_stock,
                        'department_reserved' => $departmentStock->reserved_stock,
                        'department_available' => $departmentStock->current_stock - $departmentStock->reserved_stock,
                        'min_stock' => $departmentStock->minimum_stock,
                        'max_stock' => $departmentStock->maximum_stock,
                    ];
                }
            }
            
            return [
                'id' => $item->id,
                'name' => $item->name,
                'code' => $item->code,
                'description' => $item->description,
                'category_id' => $item->category_id,
                'category' => $item->category,
                'type' => $item->inventory_type,
                'unit' => $item->unit_of_measure,
                'standard_cost' => $item->standard_cost,
                'pack_size' => $item->pack_size,
                'status' => $item->is_active ? 'active' : 'inactive',
                'current_stock' => (int) $item->current_stock,
                'available_stock' => (int) $item->available_stock,
                'reserved_stock' => (int) $item->reserved_stock,
                'reorder_level' => (int) $item->reorder_level,
                'max_level' => (int) $item->max_level,
                'safety_stock' => (int) $item->safety_stock,
                'last_updated' => $item->updated_at->format('Y-m-d H:i:s'),
                'pharmacy_details' => $item->pharmacyDetails ? [
                    'generic_name' => $item->pharmacyDetails->generic_name,
                    'brand_name' => $item->pharmacyDetails->brand_name,
                    'strength' => $item->pharmacyDetails->strength,
                    'dosage_form' => $item->pharmacyDetails->dosage_form,
                    'manufacturer' => $item->pharmacyDetails->manufacturer,
                    'registration_number' => $item->pharmacyDetails->registration_number,
                    'therapeutic_class' => $item->pharmacyDetails->therapeutic_class,
                ] : null,
                'general_details' => $item->generalDetails ? [
                    'brand' => $item->generalDetails->brand,
                    'model' => $item->generalDetails->model,
                    'warranty_period' => $item->generalDetails->warranty_period,
                    'serial_number' => $item->generalDetails->serial_number,
                ] : null,
                'department_info' => $departmentInfo,
            ];
        });

        $categories = InventoryCategory::active()->orderBy('name')->get(['id', 'name', 'code']);

        return Inertia::render('Inventory/Items/Index', [
            'items' => $items,
            'categories' => $categories,
            'suppliers' => [], // Add suppliers if needed
            'filters' => $request->only(['search', 'category', 'type', 'status']),
            'can_view_all_departments' => $canViewAllDepartments,
            'user_department' => $user->department ?? null,
        ]);
    }

    public function create()
    {
        $categories = InventoryCategory::active()->orderBy('name')->get(['id', 'name', 'code']);

        return Inertia::render('Inventory/Items/Create', [
            'categories' => $categories
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:inventory_categories,id',
            'code' => 'required|string|max:50|unique:inventory_items',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'inventory_type' => 'required|in:pharmacy,general',
            'unit_of_measure' => 'required|string|max:20',
            'pack_size' => 'nullable|integer|min:1',
            'reorder_level' => 'required|numeric|min:0',
            'max_level' => 'nullable|numeric|min:0',
            'safety_stock' => 'nullable|numeric|min:0',
            'standard_cost' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
            'requires_approval' => 'boolean',
            'is_controlled_substance' => 'boolean',
            'requires_prescription' => 'boolean',
            'specifications' => 'nullable|array',
            
            // Pharmacy specific fields
            'generic_name' => 'nullable|string|max:255',
            'brand_name' => 'nullable|string|max:255',
            'strength' => 'nullable|string|max:100',
            'dosage_form' => 'nullable|string|max:100',
            'route_of_administration' => 'nullable|string|max:100',
            'manufacturer' => 'nullable|string|max:255',
            'registration_number' => 'nullable|string|max:100',
            'therapeutic_class' => 'nullable|string|max:255',
            'indication' => 'nullable|string',
            'contraindication' => 'nullable|array',
            'side_effects' => 'nullable|array',
            'dosage_instructions' => 'nullable|string',
            'storage_conditions' => 'nullable|string',
            'pregnancy_category' => 'nullable|string|max:10',
            'is_narcotic' => 'boolean',
            'is_psychotropic' => 'boolean',
            'max_dispensing_quantity' => 'nullable|numeric|min:0',
            
            // General item specific fields
            'brand' => 'nullable|string|max:255',
            'model' => 'nullable|string|max:255',
            'serial_number' => 'nullable|string|max:255',
            'warranty_period' => 'nullable|integer|min:0',
            'warranty_start_date' => 'nullable|date',
            'supplier_part_number' => 'nullable|string|max:255',
            'manufacturer_part_number' => 'nullable|string|max:255',
            'color' => 'nullable|string|max:100',
            'size' => 'nullable|string|max:100',
            'weight' => 'nullable|numeric|min:0',
            'dimensions' => 'nullable|array',
            'material' => 'nullable|string|max:255',
            'country_of_origin' => 'nullable|string|max:255',
            'certification' => 'nullable|array',
            'maintenance_schedule' => 'nullable|array',
            'operating_instructions' => 'nullable|string',
            'safety_requirements' => 'nullable|array',
        ]);

        DB::transaction(function () use ($validated) {
            // Create main item
            $itemData = collect($validated)->only([
                'category_id', 'code', 'name', 'description', 'inventory_type',
                'unit_of_measure', 'pack_size', 'reorder_level', 'max_level',
                'safety_stock', 'standard_cost', 'is_active', 'requires_approval',
                'is_controlled_substance', 'requires_prescription', 'specifications'
            ])->toArray();

            $item = InventoryItem::create($itemData);

            // Create type-specific details
            if ($validated['inventory_type'] === 'pharmacy') {
                $pharmacyData = collect($validated)->only([
                    'generic_name', 'brand_name', 'strength', 'dosage_form',
                    'route_of_administration', 'manufacturer', 'registration_number',
                    'therapeutic_class', 'indication', 'contraindication',
                    'side_effects', 'dosage_instructions', 'storage_conditions',
                    'pregnancy_category', 'is_narcotic', 'is_psychotropic',
                    'prescription_required', 'max_dispensing_quantity'
                ])->filter()->toArray();

                if (!empty($pharmacyData)) {
                    $pharmacyData['inventory_item_id'] = $item->id;
                    PharmacyItemDetail::create($pharmacyData);
                }
            } elseif ($validated['inventory_type'] === 'general') {
                $generalData = collect($validated)->only([
                    'brand', 'model', 'serial_number', 'warranty_period',
                    'warranty_start_date', 'supplier_part_number', 'manufacturer_part_number',
                    'color', 'size', 'weight', 'dimensions', 'material',
                    'country_of_origin', 'certification', 'maintenance_schedule',
                    'operating_instructions', 'safety_requirements'
                ])->filter()->toArray();

                if (!empty($generalData)) {
                    $generalData['inventory_item_id'] = $item->id;
                    GeneralItemDetail::create($generalData);
                }
            }
        });

        return redirect()->route('inventory.items.index')
            ->with('success', 'Item created successfully.');
    }

    public function show(InventoryItem $item)
    {
        $item->load([
            'category',
            'pharmacyDetails',
            'generalDetails',
            'stocks.location',
            'movements' => function ($query) {
                $query->orderBy('movement_date', 'desc')->limit(10);
            },
            'movements.createdBy',
            'batches' => function ($query) {
                $query->where('status', 'active')->orderBy('expiry_date');
            }
        ]);

        return Inertia::render('Inventory/Items/Show', [
            'item' => $item
        ]);
    }

    public function edit(InventoryItem $item)
    {
        $item->load(['pharmacyDetails', 'generalDetails']);
        $categories = InventoryCategory::active()->orderBy('name')->get(['id', 'name', 'code']);

        return Inertia::render('Inventory/Items/Edit', [
            'item' => $item,
            'categories' => $categories
        ]);
    }

    public function update(Request $request, InventoryItem $item)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:inventory_categories,id',
            'code' => 'required|string|max:50|unique:inventory_items,code,' . $item->id,
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'unit_of_measure' => 'required|string|max:20',
            'pack_size' => 'nullable|integer|min:1',
            'reorder_level' => 'required|numeric|min:0',
            'max_level' => 'nullable|numeric|min:0',
            'safety_stock' => 'nullable|numeric|min:0',
            'standard_cost' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
            'requires_approval' => 'boolean',
            'is_controlled_substance' => 'boolean',
            'requires_prescription' => 'boolean',
            'specifications' => 'nullable|array',
        ]);

        DB::transaction(function () use ($validated, $item, $request) {
            $item->update($validated);

            // Update type-specific details if provided
            if ($item->inventory_type === 'pharmacy' && $request->has('pharmacy_details')) {
                $item->pharmacyDetails()?->update($request->pharmacy_details);
            } elseif ($item->inventory_type === 'general' && $request->has('general_details')) {
                $item->generalDetails()?->update($request->general_details);
            }
        });

        return redirect()->route('inventory.items.index')
            ->with('success', 'Item updated successfully.');
    }

    public function destroy(InventoryItem $item)
    {
        // Check if item has current stock
        $hasStock = DB::table('inventory_stocks')
            ->where('item_id', $item->id)
            ->where('current_quantity', '>', 0)
            ->exists();

        if ($hasStock) {
            return back()->withErrors([
                'delete' => 'Cannot delete item with existing stock.'
            ]);
        }

        if ($item->movements()->exists()) {
            return back()->withErrors([
                'delete' => 'Cannot delete item with movement history.'
            ]);
        }

        DB::transaction(function () use ($item) {
            $item->pharmacyDetails()?->delete();
            $item->generalDetails()?->delete();
            $item->delete();
        });

        return redirect()->route('inventory.items.index')
            ->with('success', 'Item deleted successfully.');
    }

    public function getLowStockItems()
    {
        $items = InventoryItem::select('inventory_items.*')
            ->leftJoin('inventory_stocks', 'inventory_items.id', '=', 'inventory_stocks.item_id')
            ->selectRaw('COALESCE(SUM(inventory_stocks.current_quantity), 0) as current_stock')
            ->with(['category', 'stocks.location'])
            ->where('inventory_items.is_active', true)
            ->groupBy('inventory_items.id')
            ->havingRaw('current_stock <= inventory_items.reorder_level')
            ->get();

        return response()->json($items);
    }

    public function search(Request $request)
    {
        $query = $request->get('q');
        
        $items = InventoryItem::where('is_active', true)
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('code', 'like', "%{$query}%");
            })
            ->limit(10)
            ->get(['id', 'code', 'name', 'inventory_type']);

        return response()->json($items);
    }
}
