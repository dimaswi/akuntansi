<?php

namespace App\Http\Controllers\Department;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\User;
use App\Models\DepartmentInventoryLocation;
use App\Models\DepartmentStockMovement;
use App\Models\Inventory\InventoryItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DepartmentStockController extends Controller
{
    /**
     * Check if user is admin
     */
    private function isUserAdmin($user)
    {
        $userWithRole = User::with('role')->find($user->id);
        return $userWithRole->role && $userWithRole->role->name === 'admin';
    }

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
        $user = Auth::user();
        $departmentId = $request->department_id ?? $user->department_id;
        
        if (!$departmentId) {
            return redirect()->back()->withErrors(['error' => 'Departemen tidak ditemukan.']);
        }

        $department = Department::findOrFail($departmentId);
        
        // Check permissions
        if (!$this->isUserAdmin($user) && $user->department_id !== $department->id) {
            abort(403, 'Anda tidak memiliki akses ke stok departemen ini.');
        }

        $query = DepartmentInventoryLocation::with(['inventoryItem.category', 'department'])
            ->where('department_id', $departmentId);

        // Apply filters
        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('inventoryItem', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category')) {
            $query->whereHas('inventoryItem', function ($q) use ($request) {
                $q->where('category_id', $request->category);
            });
        }

        if ($request->filled('stock_status')) {
            switch ($request->stock_status) {
                case 'low':
                    $query->lowStock();
                    break;
                case 'over':
                    $query->overStock();
                    break;
                case 'zero':
                    $query->where('current_stock', 0);
                    break;
                case 'available':
                    $query->withStock();
                    break;
            }
        }

        $stockLocations = $query->orderBy('current_stock', 'desc')
            ->paginate(20);

        $departments = Department::active()->orderBy('name')->get(['id', 'name']);
        $categories = \App\Models\Inventory\InventoryCategory::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Department/Stock/Index', [
            'stockLocations' => $stockLocations,
            'department' => $department,
            'departments' => $departments,
            'categories' => $categories,
            'filters' => $request->only(['search', 'category', 'stock_status']),
            'stats' => $this->getDepartmentStockStats($departmentId)
        ]);
    }

    public function create(Request $request)
    {
        $user = Auth::user();
        $departmentId = $request->department_id ?? $user->department_id;
        
        if (!$departmentId) {
            return redirect()->back()->withErrors(['error' => 'Departemen tidak ditemukan.']);
        }

        $department = Department::findOrFail($departmentId);
        
        if (!$this->isUserAdmin($user) && $user->department_id !== $department->id) {
            abort(403, 'Anda tidak memiliki akses untuk menambah stok di departemen ini.');
        }

        // Get inventory items yang belum ada di departemen ini
        $existingItemIds = DepartmentInventoryLocation::where('department_id', $departmentId)
            ->pluck('inventory_item_id');

        $inventoryItems = InventoryItem::active()
            ->with('category')
            ->whereNotIn('id', $existingItemIds)
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'unit_of_measure', 'standard_cost', 'category_id']);

        return Inertia::render('Department/Stock/Create', [
            'department' => $department,
            'inventoryItems' => $inventoryItems
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'department_id' => 'required|exists:departments,id',
            'inventory_item_id' => 'required|exists:inventory_items,id',
            'current_stock' => 'required|numeric|min:0',
            'minimum_stock' => 'required|numeric|min:0',
            'maximum_stock' => 'required|numeric|min:0|gte:minimum_stock',
            'average_cost' => 'required|numeric|min:0',
            'location_code' => 'nullable|string|max:50',
            'rack_position' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:500'
        ]);

        $user = Auth::user();
        
        if (!$this->isUserAdmin($user) && $user->department_id !== $validated['department_id']) {
            return back()->withErrors(['error' => 'Anda tidak memiliki akses untuk menambah stok di departemen ini.']);
        }

        // Check if location already exists
        $existingLocation = DepartmentInventoryLocation::where('department_id', $validated['department_id'])
            ->where('inventory_item_id', $validated['inventory_item_id'])
            ->first();

        if ($existingLocation) {
            return back()->withErrors(['inventory_item_id' => 'Item ini sudah ada di departemen.']);
        }

        try {
            DB::beginTransaction();

            $location = DepartmentInventoryLocation::create($validated);

            // Create initial stock movement if there's opening stock
            if ($validated['current_stock'] > 0) {
                DepartmentStockMovement::create([
                    'movement_number' => $this->generateMovementNumber(),
                    'department_id' => $validated['department_id'],
                    'inventory_item_id' => $validated['inventory_item_id'],
                    'movement_type' => DepartmentStockMovement::TYPE_STOCK_OPNAME,
                    'quantity_before' => 0,
                    'quantity_change' => $validated['current_stock'],
                    'quantity_after' => $validated['current_stock'],
                    'unit_cost' => $validated['average_cost'],
                    'total_cost' => $validated['current_stock'] * $validated['average_cost'],
                    'notes' => 'Stok awal - ' . ($validated['notes'] ?? ''),
                    'created_by' => $user->id
                ]);
            }

            DB::commit();

            return redirect()->route('department-stock.index', ['department_id' => $validated['department_id']])
                ->with('success', 'Lokasi stok berhasil ditambahkan.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Gagal menyimpan lokasi stok: ' . $e->getMessage()]);
        }
    }

    public function stockOpname(Request $request, DepartmentInventoryLocation $location)
    {
        $validated = $request->validate([
            'physical_count' => 'required|numeric|min:0',
            'notes' => 'nullable|string|max:500'
        ]);

        $user = Auth::user();
        
        if (!$this->isUserAdmin($user) && $user->department_id !== $location->department_id) {
            return back()->withErrors(['error' => 'Anda tidak memiliki akses untuk melakukan stok opname.']);
        }

        $difference = $validated['physical_count'] - $location->current_stock;
        
        if ($difference == 0) {
            return back()->with('info', 'Tidak ada perbedaan stok, tidak perlu penyesuaian.');
        }

        try {
            DB::beginTransaction();

            // Update stock
            $previousStock = $location->current_stock;
            $location->current_stock = $validated['physical_count'];
            $location->save();

            // Create movement record
            DepartmentStockMovement::create([
                'movement_number' => $this->generateMovementNumber(),
                'department_id' => $location->department_id,
                'inventory_item_id' => $location->inventory_item_id,
                'movement_type' => DepartmentStockMovement::TYPE_STOCK_OPNAME,
                'quantity_before' => $previousStock,
                'quantity_change' => $difference,
                'quantity_after' => $validated['physical_count'],
                'unit_cost' => $location->average_cost,
                'total_cost' => abs($difference) * $location->average_cost,
                'notes' => 'Stok Opname: ' . ($validated['notes'] ?? ''),
                'created_by' => $user->id
            ]);

            DB::commit();

            return back()->with('success', 'Stok opname berhasil disimpan.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Gagal menyimpan stok opname: ' . $e->getMessage()]);
        }
    }

    /**
     * Show stock opname page for a department
     */
    public function opnameIndex(Department $department)
    {
        $user = Auth::user();
        
        // Check permissions - hanya admin atau user dari department terkait yang bisa akses
        if ($user->department_id !== $department->id) {
            // Check if user has admin role
            $userWithRole = User::with('role')->find($user->id);
            if (!$userWithRole->role || $userWithRole->role->name !== 'admin') {
                abort(403, 'Anda tidak memiliki akses ke stok departemen ini.');
            }
        }

        $departmentStocks = DepartmentInventoryLocation::with(['inventoryItem.category'])
            ->where('department_id', $department->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Department/Stock/Opname', [
            'department' => $department,
            'departmentStocks' => $departmentStocks
        ]);
    }

    private function getDepartmentStockStats($departmentId)
    {
        $locations = DepartmentInventoryLocation::where('department_id', $departmentId);
        
        return [
            'total_items' => $locations->count(),
            'items_with_stock' => $locations->withStock()->count(),
            'low_stock_items' => $locations->lowStock()->count(),
            'zero_stock_items' => $locations->where('current_stock', 0)->count(),
            'total_stock_value' => $locations->get()->sum(function ($location) {
                return $location->current_stock * $location->average_cost;
            })
        ];
    }

    private function generateMovementNumber(): string
    {
        $prefix = 'MOV';
        $date = now()->format('Ymd');
        $count = DepartmentStockMovement::whereDate('created_at', now())->count() + 1;
        
        return $prefix . $date . str_pad($count, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Process stock opname data from opname form
     */
    public function processStockOpname(Request $request, Department $department)
    {
        $user = Auth::user();
        
        // Check permissions - hanya admin atau user dari department terkait yang bisa akses
        if ($user->department_id !== $department->id) {
            // Check if user has permission to view all departments
            if (!$this->userHasPermission($user, 'department.stock.view.all')) {
                abort(403, 'Anda tidak memiliki akses ke stok departemen ini.');
            }
        } else {
            // Check if user has permission to view own department stock
            if (!$this->userHasPermission($user, 'department.stock.view')) {
                abort(403, 'Anda tidak memiliki akses untuk melihat stok departemen.');
            }
        }

        $validated = $request->validate([
            'opname_data' => 'required|array|min:1',
            'opname_data.*.id' => 'required|exists:department_inventory_locations,id',
            'opname_data.*.physical_count' => 'required|integer|min:0',
            'opname_data.*.system_count' => 'required|integer',
            'opname_data.*.difference' => 'required|integer',
            'opname_data.*.notes' => 'nullable|string|max:500',
            'notes' => 'nullable|string|max:1000',
        ]);

        try {
            DB::beginTransaction();

            $totalProcessed = 0;
            $movements = [];

            foreach ($validated['opname_data'] as $opnameItem) {
                if ($opnameItem['difference'] == 0) {
                    continue; // Skip items with no difference
                }

                $location = DepartmentInventoryLocation::findOrFail($opnameItem['id']);
                
                // Validate that location belongs to the department
                if ($location->department_id !== $department->id) {
                    throw new \Exception("Invalid location for department");
                }

                // Update stock
                $previousStock = $location->current_stock;
                $location->current_stock = $opnameItem['physical_count'];
                $location->save();

                // Create movement record
                $movement = DepartmentStockMovement::create([
                    'movement_number' => $this->generateMovementNumber(),
                    'department_id' => $department->id,
                    'inventory_item_id' => $location->inventory_item_id,
                    'movement_type' => DepartmentStockMovement::TYPE_STOCK_OPNAME,
                    'quantity_before' => $previousStock,
                    'quantity_after' => $opnameItem['physical_count'],
                    'quantity_changed' => $opnameItem['difference'],
                    'notes' => $opnameItem['notes'] ?? null,
                    'created_by' => $user->id,
                ]);

                $movements[] = $movement;
                $totalProcessed++;
            }

            // Create a general note for this opname session if provided
            if (!empty($validated['notes'])) {
                DepartmentStockMovement::create([
                    'movement_number' => $this->generateMovementNumber(),
                    'department_id' => $department->id,
                    'inventory_item_id' => null, // General movement
                    'movement_type' => DepartmentStockMovement::TYPE_STOCK_OPNAME,
                    'quantity_before' => 0,
                    'quantity_after' => 0,
                    'quantity_changed' => 0,
                    'notes' => "Stock Opname Session: " . $validated['notes'],
                    'created_by' => $user->id,
                ]);
            }

            DB::commit();

            return redirect()->route('departments.stock.index', $department)
                ->with('success', "Stock opname berhasil! {$totalProcessed} item telah diperbarui.");

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Gagal menyimpan stock opname: ' . $e->getMessage()]);
        }
    }

    /**
     * Display stock for current user's department
     */
    public function myDepartmentStock(Request $request)
    {
        $user = Auth::user();
        
        if (!$user->department_id) {
            return redirect()->back()->withErrors(['error' => 'Anda belum terdaftar ke departemen manapun.']);
        }

        // If admin, show all departments with selection
        if ($this->isUserAdmin($user)) {
            $selectedDepartmentId = $request->get('department_id', $user->department_id);
            $departments = Department::all();
        } else {
            $selectedDepartmentId = $user->department_id;
            $departments = collect([Department::find($user->department_id)]);
        }

        $department = Department::findOrFail($selectedDepartmentId);
        
        // Redirect to specific department stock route
        return redirect()->route('departments.stock.index', ['department' => $department->id]);
    }

    /**
     * Display stock opname for current user's department
     */
    public function myDepartmentOpname(Request $request)
    {
        $user = Auth::user();
        
        if (!$user->department_id) {
            return redirect()->back()->withErrors(['error' => 'Anda belum terdaftar ke departemen manapun.']);
        }

        // If admin, show all departments with selection
        if ($this->isUserAdmin($user)) {
            $selectedDepartmentId = $request->get('department_id', $user->department_id);
            $departments = Department::all();
        } else {
            $selectedDepartmentId = $user->department_id;
            $departments = collect([Department::find($user->department_id)]);
        }

        $department = Department::findOrFail($selectedDepartmentId);
        
        // Redirect to specific department opname route
        return redirect()->route('departments.stock.opname', ['department' => $department->id]);
    }
}
