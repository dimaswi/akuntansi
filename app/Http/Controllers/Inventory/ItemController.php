<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Repositories\Inventory\ItemRepositoryInterface;
use App\Models\Inventory\ItemCategory;
use App\Models\Inventory\Department;
use App\Models\Inventory\Supplier;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;

class ItemController extends Controller
{
    protected ItemRepositoryInterface $itemRepository;

    public function __construct(ItemRepositoryInterface $itemRepository)
    {
        $this->itemRepository = $itemRepository;
    }
    /**
     * Display a listing of items
     */
    public function index(Request $request)
    {
        $user = $request->user()->load(['department', 'role']); // Load department and role relationships
        
        // Check if user has logistics role
        $isLogistics = $user->isLogistics();
        
        $filters = [
            'search' => $request->get('search'),
            'inventory_type' => $request->get('inventory_type'),
            'category_id' => $request->get('category_id'),
            'department_id' => $isLogistics ? $request->get('department_id') : $user->department_id, // Logistics can see all, others filtered by their department
            'supplier_id' => $request->get('supplier_id'),
            'is_active' => $request->get('is_active') === '1' ? true : ($request->get('is_active') === '0' ? false : null),
            'requires_approval' => $request->get('requires_approval') === '1' ? true : null,
            'is_controlled_substance' => $request->get('is_controlled_substance') === '1' ? true : null,
            'perPage' => $request->get('perPage', 15),
            'is_logistics' => $isLogistics, // Pass this to repository
        ];

        $items = $this->itemRepository->paginate($filters, $filters['perPage']);

        return Inertia::render('inventory/items/index', [
            'items' => $items,
            'filters' => $filters,
            'categories' => ItemCategory::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'departments' => Department::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'suppliers' => Supplier::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'isLogistics' => $isLogistics, // Pass to frontend
        ]);
    }


    /**
     * Show the form for creating a new item
     */
    public function create()
    {
        return Inertia::render('inventory/items/create', [
            'categories' => ItemCategory::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'departments' => Department::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'suppliers' => Supplier::where('is_active', true)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Store a newly created item
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:30|unique:items,code',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category_id' => 'required|exists:item_categories,id',
            'department_id' => 'nullable|exists:departments,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'inventory_type' => 'required|in:pharmacy,general',
            'unit_of_measure' => 'required|string|max:20',
            'pack_size' => 'required|integer|min:1',
            'reorder_level' => 'required|numeric|min:0',
            'max_level' => 'required|numeric|min:0',
            'safety_stock' => 'required|numeric|min:0',
            'standard_cost' => 'required|numeric|min:0',
            'last_purchase_cost' => 'nullable|numeric|min:0',
            'is_active' => 'required|boolean',
            'requires_approval' => 'boolean',
            'is_controlled_substance' => 'boolean',
            'requires_prescription' => 'boolean',
            'specifications' => 'nullable|array',
            
            // Pharmacy specific fields
            'bpom_registration' => 'required_if:inventory_type,pharmacy|nullable|string|max:50',
            'manufacturer' => 'nullable|string',
            'generic_name' => 'nullable|string',
            'strength' => 'nullable|string',
            'dosage_form' => 'nullable|string',
            'drug_classification' => 'nullable|in:narkotika,psikotropika,keras,bebas_terbatas,bebas',
            'atc_code' => 'nullable|string|max:10',
            'contraindications' => 'nullable|string',
            'drug_interactions' => 'nullable|array',
            'storage_temp_min' => 'nullable|numeric',
            'storage_temp_max' => 'nullable|numeric',
            'minimum_expiry_months' => 'nullable|integer|min:1',
            
            // General specific fields
            'is_consumable' => 'boolean',
            'is_returnable' => 'boolean',
            'requires_maintenance' => 'boolean',
            'warranty_months' => 'nullable|integer|min:0',
            'usage_instructions' => 'nullable|string',
            'department_restrictions' => 'nullable|array',
        ]);

        // Separate main item data from detail data
        $itemData = collect($validated)->except([
            'bpom_registration', 'manufacturer', 'generic_name', 'strength', 'dosage_form',
            'drug_classification', 'atc_code', 'contraindications', 'drug_interactions',
            'storage_temp_min', 'storage_temp_max', 'minimum_expiry_months',
            'is_consumable', 'is_returnable', 'requires_maintenance', 'warranty_months',
            'usage_instructions', 'department_restrictions'
        ])->toArray();

        $detailData = [];
        if ($validated['inventory_type'] === 'pharmacy') {
            $detailData = collect($validated)->only([
                'bpom_registration', 'manufacturer', 'generic_name', 'strength', 'dosage_form',
                'drug_classification', 'atc_code', 'contraindications', 'drug_interactions',
                'storage_temp_min', 'storage_temp_max', 'minimum_expiry_months'
            ])->toArray();
        } elseif ($validated['inventory_type'] === 'general') {
            $detailData = collect($validated)->only([
                'is_consumable', 'is_returnable', 'requires_maintenance', 'warranty_months',
                'usage_instructions', 'department_restrictions'
            ])->toArray();
        }

        try {
            $this->itemRepository->createWithDetails($itemData, $detailData);
            return redirect()->route('items.index')->with('success', 'Item berhasil ditambahkan.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Gagal menambahkan item: ' . $e->getMessage()]);
        }
    }

    /**
     * Display the specified item
     */
    public function show(int $id)
    {
        $item = $this->itemRepository->find($id);
        
        if (!$item) {
            abort(404);
        }

        return Inertia::render('inventory/items/show', [
            'item' => $item,
        ]);
    }

    /**
     * Show the form for editing the specified item
     */
    public function edit(int $id)
    {
        $item = $this->itemRepository->find($id);
        
        if (!$item) {
            abort(404);
        }

        return Inertia::render('inventory/items/edit', [
            'item' => $item,
            'categories' => ItemCategory::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'departments' => Department::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'suppliers' => Supplier::where('is_active', true)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Update the specified item
     */
    public function update(Request $request, int $id): RedirectResponse
    {
        $item = $this->itemRepository->find($id);
        
        if (!$item) {
            abort(404);
        }

        $validated = $request->validate([
            'code' => 'required|string|max:30|unique:items,code,' . $id,
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category_id' => 'required|exists:item_categories,id',
            'department_id' => 'nullable|exists:departments,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'inventory_type' => 'required|in:pharmacy,general',
            'unit_of_measure' => 'required|string|max:20',
            'pack_size' => 'required|integer|min:1',
            'reorder_level' => 'required|numeric|min:0',
            'max_level' => 'required|numeric|min:0',
            'safety_stock' => 'required|numeric|min:0',
            'standard_cost' => 'required|numeric|min:0',
            'last_purchase_cost' => 'nullable|numeric|min:0',
            'is_active' => 'required|boolean',
            'requires_approval' => 'boolean',
            'is_controlled_substance' => 'boolean',
            'requires_prescription' => 'boolean',
            'specifications' => 'nullable|array',
            
            // Pharmacy specific fields
            'bpom_registration' => 'required_if:inventory_type,pharmacy|nullable|string|max:50',
            'manufacturer' => 'nullable|string',
            'generic_name' => 'nullable|string',
            'strength' => 'nullable|string',
            'dosage_form' => 'nullable|string',
            'drug_classification' => 'nullable|in:narkotika,psikotropika,keras,bebas_terbatas,bebas',
            'atc_code' => 'nullable|string|max:10',
            'contraindications' => 'nullable|string',
            'drug_interactions' => 'nullable|array',
            'storage_temp_min' => 'nullable|numeric',
            'storage_temp_max' => 'nullable|numeric',
            'minimum_expiry_months' => 'nullable|integer|min:1',
            
            // General specific fields
            'is_consumable' => 'boolean',
            'is_returnable' => 'boolean',
            'requires_maintenance' => 'boolean',
            'warranty_months' => 'nullable|integer|min:0',
            'usage_instructions' => 'nullable|string',
            'department_restrictions' => 'nullable|array',
        ]);

        // Separate main item data from detail data
        $itemData = collect($validated)->except([
            'bpom_registration', 'manufacturer', 'generic_name', 'strength', 'dosage_form',
            'drug_classification', 'atc_code', 'contraindications', 'drug_interactions',
            'storage_temp_min', 'storage_temp_max', 'minimum_expiry_months',
            'is_consumable', 'is_returnable', 'requires_maintenance', 'warranty_months',
            'usage_instructions', 'department_restrictions'
        ])->toArray();

        $detailData = [];
        if ($validated['inventory_type'] === 'pharmacy') {
            $detailData = collect($validated)->only([
                'bpom_registration', 'manufacturer', 'generic_name', 'strength', 'dosage_form',
                'drug_classification', 'atc_code', 'contraindications', 'drug_interactions',
                'storage_temp_min', 'storage_temp_max', 'minimum_expiry_months'
            ])->toArray();
        } elseif ($validated['inventory_type'] === 'general') {
            $detailData = collect($validated)->only([
                'is_consumable', 'is_returnable', 'requires_maintenance', 'warranty_months',
                'usage_instructions', 'department_restrictions'
            ])->toArray();
        }

        try {
            $this->itemRepository->updateWithDetails($id, $itemData, $detailData);
            return redirect()->route('items.index')->with('success', 'Item berhasil diupdate.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Gagal mengupdate item: ' . $e->getMessage()]);
        }
    }

    /**
     * Remove the specified item
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $deleted = $this->itemRepository->delete($id);
            
            if (!$deleted) {
                return response()->json(['error' => 'Item tidak ditemukan.'], 404);
            }

            return response()->json(['message' => 'Item berhasil dihapus.']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Gagal menghapus item: ' . $e->getMessage()], 500);
        }
    }

    /**
     * API endpoint for searchable dropdown
     */
    public function api(Request $request): JsonResponse
    {
        try {
            $search = $request->get('search', '');
            $limit = $request->get('limit', 50);
            $departmentId = $request->get('department_id') ?? $request->user()->department_id; // Use user's department if not specified

            $items = $this->itemRepository->search($search, $limit, $departmentId);

            // Format response for dropdown
            $formattedItems = $items->map(function ($item) use ($departmentId) {
                $data = [
                    'id' => $item->id,
                    'code' => $item->code,
                    'name' => $item->name,
                    'unit_of_measure' => $item->unit_of_measure,
                    'reorder_level' => $item->reorder_level,
                    'safety_stock' => $item->safety_stock,
                    'is_active' => $item->is_active,
                ];

                // Add department stock information if department_id is provided
                if ($departmentId) {
                    $stock = $item->departmentStock($departmentId);
                    $data['department_stock'] = [
                        'current_stock' => $stock ? $stock->quantity_on_hand : 0,
                        'available_stock' => $stock ? $stock->available_quantity : 0,
                        'reserved_stock' => $stock ? $stock->reserved_quantity : 0,
                        'minimum_stock' => $item->reorder_level,
                        'stock_status' => $stock && $stock->quantity_on_hand > 0 ? 'in_stock' : 'no_stock',
                    ];
                }

                return $data;
            });

            return response()->json($formattedItems);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch items: ' . $e->getMessage()], 500);
        }
    }

    /**
     * API endpoint for searching items with stock information per department
     */
    public function searchWithStock(Request $request): JsonResponse
    {
        try {
            $search = $request->get('search', '');
            $departmentId = $request->get('department_id') ?? $request->user()->department_id;
            $limit = $request->get('limit', 50);

            if (!$departmentId) {
                return response()->json(['error' => 'Department ID is required'], 400);
            }

            $items = $this->itemRepository->search($search, $limit, $departmentId);

            $formattedItems = $items->map(function ($item) use ($departmentId) {
                $stock = $item->departmentStock($departmentId);
                
                return [
                    'id' => $item->id,
                    'code' => $item->code,
                    'name' => $item->name,
                    'unit_of_measure' => $item->unit_of_measure,
                    'current_stock' => $stock ? $stock->quantity_on_hand : 0,
                    'available_stock' => $stock ? $stock->available_quantity : 0,
                    'reserved_stock' => $stock ? $stock->reserved_quantity : 0,
                    'minimum_stock' => $item->reorder_level,
                    'maximum_stock' => $item->safety_stock,
                    'stock_status' => $stock && $stock->quantity_on_hand > 0 ? 'in_stock' : 'no_stock',
                    'is_low_stock' => $stock ? ($stock->quantity_on_hand <= $item->reorder_level) : true,
                ];
            });

            return response()->json($formattedItems);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch items with stock: ' . $e->getMessage()], 500);
        }
    }
}
