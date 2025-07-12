<?php

namespace App\Http\Controllers\Department;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\DepartmentRequest;
use App\Models\DepartmentRequestItem;
use App\Models\DepartmentInventoryLocation;
use App\Models\Inventory\InventoryItem;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class DepartmentRequestController extends Controller
{
    /**
     * Check if user has permission
     */
    private function userHasPermission($user, $permission)
    {
        $userWithRole = User::with('role.permissions')->find($user->id);
        return $userWithRole->hasPermission($permission);
    }

    /**
     * Check if user is admin
     */
    private function isUserAdmin($user)
    {
        $userWithRole = User::with('role')->find($user->id);
        return $userWithRole->role && $userWithRole->role->name === 'admin';
    }

    public function index(Request $request)
    {
        $user = User::with('department')->find(Auth::id());
        $canViewAllDepartments = $this->isUserAdmin($user) || $this->userHasPermission($user, 'department.request.view.all');
        
        $query = DepartmentRequest::with([
            'department',
            'targetDepartment',
            'requestedBy',
            'approvedBy',
            'items'
        ]);

        // Filter berdasarkan departemen jika user tidak memiliki akses ke semua departemen
        if (!$canViewAllDepartments && $user->department_id) {
            $query->where('department_id', $user->department_id);
        }

        // Apply filters
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('request_number', 'like', "%{$search}%")
                  ->orWhere('purpose', 'like', "%{$search}%")
                  ->orWhereHas('department', function ($dq) use ($search) {
                      $dq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('department') && $request->department !== 'all') {
            $query->where('department_id', $request->department);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('priority') && $request->priority !== 'all') {
            $query->where('priority', $request->priority);
        }

        if ($request->filled('date_from')) {
            $query->where('request_date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->where('request_date', '<=', $request->date_to);
        }

        $requests = $query->orderBy('created_at', 'desc')->paginate(15);

        // Get departments list - admin sees all, others see only their department
        if ($canViewAllDepartments) {
            $departments = Department::active()->canRequestItems()
                ->orderBy('name')
                ->get(['id', 'name', 'code']);
        } else {
            $departments = $user->department_id ? 
                Department::where('id', $user->department_id)
                    ->where('is_active', true)
                    ->get(['id', 'name', 'code']) 
                : collect();
        }

        return Inertia::render('Department/Requests/Index', [
            'requests' => $requests,
            'departments' => $departments,
            'filters' => $request->only(['search', 'department', 'status', 'priority', 'date_from', 'date_to']),
            'canCreateRequest' => Auth::user()->department && Auth::user()->department->can_request_items,
            'can_view_all_departments' => $canViewAllDepartments,
            'user_department' => $user->department_id ? $user->department : null
        ]);
    }

    public function create()
    {
        $user = User::with('department')->find(Auth::id());
        $userDepartment = $user->department;
        
        if (!$userDepartment || !$userDepartment->can_request_items) {
            return redirect()->route('department-requests.index')
                ->withErrors(['error' => 'Anda tidak memiliki izin untuk membuat permintaan.']);
        }

        $canViewAllItems = $this->isUserAdmin($user) || $this->userHasPermission($user, 'inventory.item.view.all.departments');
        
        // Filter inventory items berdasarkan permission
        if ($canViewAllItems) {
            // Admin bisa lihat semua item
            $inventoryItems = InventoryItem::active()
                ->with('category')
                ->orderBy('name')
                ->get(['id', 'name', 'code', 'unit_of_measure', 'standard_cost', 'category_id']);
        } else {
            // User hanya bisa lihat item yang ada di departemen sendiri
            $departmentItemIds = DepartmentInventoryLocation::where('department_id', $user->department_id)
                ->pluck('inventory_item_id')
                ->toArray();
            
            $inventoryItems = InventoryItem::active()
                ->with('category')
                ->whereIn('id', $departmentItemIds)
                ->orderBy('name')
                ->get(['id', 'name', 'code', 'unit_of_measure', 'standard_cost', 'category_id']);
        }

        // Get departments untuk transfer requests
        $canViewAllDepartments = $this->isUserAdmin($user) || $this->userHasPermission($user, 'department.request.view.all');
        
        if ($canViewAllDepartments) {
            // Admin bisa pilih semua departemen
            $departments = Department::active()
                ->where('id', '!=', $userDepartment->id)
                ->orderBy('name')
                ->get(['id', 'name', 'code']);
        } else {
            // User biasa hanya bisa request dari departemen lain yang aktif
            $departments = Department::active()
                ->where('id', '!=', $userDepartment->id)
                ->where('can_request_items', true)
                ->orderBy('name')
                ->get(['id', 'name', 'code']);
        }

        return Inertia::render('Department/Requests/Create', [
            'department' => $userDepartment,
            'inventoryItems' => $inventoryItems,
            'departments' => $departments,
            'can_view_all_items' => $canViewAllItems,
            'can_view_all_departments' => $canViewAllDepartments
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'department_id' => 'required|exists:departments,id',
            'request_type' => 'required|in:procurement,transfer',
            'target_department_id' => 'nullable|exists:departments,id|different:department_id',
            'purpose' => 'required|string|max:500',
            'priority' => 'required|in:low,medium,high',
            'needed_date' => 'required|date|after_or_equal:today',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'nullable|exists:inventory_items,id',
            'items.*.custom_item_name' => 'nullable|string|max:255',
            'items.*.description' => 'nullable|string|max:500',
            'items.*.quantity_requested' => 'required|numeric|min:1',
            'items.*.estimated_cost' => 'required|numeric|min:0'
        ]);

        // Validate transfer requests
        if ($validated['request_type'] === 'transfer') {
            if (!$validated['target_department_id']) {
                return back()->withErrors(['target_department_id' => 'Departemen tujuan harus dipilih untuk permintaan transfer.']);
            }
            
            // For transfer requests, all items must be from inventory (have item_id)
            foreach ($validated['items'] as $item) {
                if (!$item['item_id']) {
                    return back()->withErrors(['items' => 'Permintaan transfer hanya dapat menggunakan barang dari inventori.']);
                }
            }
        } else {
            // For procurement requests, validate that each item has either item_id or custom_item_name
            foreach ($validated['items'] as $item) {
                if (!$item['item_id'] && !$item['custom_item_name']) {
                    return back()->withErrors(['items' => 'Setiap item harus memiliki nama barang dari inventory atau nama custom.']);
                }
            }
        }

        // Check if user can create request for this department
        /** @var \App\Models\User $user */
        $user = Auth::user();
        $department = Department::findOrFail($validated['department_id']);
        
        if (!$user->isAdmin() && $user->department_id !== $department->id) {
            return back()->withErrors(['department_id' => 'Anda tidak dapat membuat permintaan untuk departemen lain.']);
        }

        if (!$department->can_request_items) {
            return back()->withErrors(['department_id' => 'Departemen ini tidak diizinkan membuat permintaan barang.']);
        }

        try {
            DB::beginTransaction();

            $departmentRequest = DepartmentRequest::create([
                'department_id' => $validated['department_id'],
                'request_type' => $validated['request_type'],
                'target_department_id' => $validated['target_department_id'] ?? null,
                'requested_by' => $user->id,
                'purpose' => $validated['purpose'],
                'priority' => $validated['priority'],
                'needed_date' => $validated['needed_date'],
                'notes' => $validated['notes'] ?? null,
                'status' => 'draft',
                'request_date' => now(),
            ]);

            foreach ($validated['items'] as $itemData) {
                $inventoryItem = null;
                if ($itemData['item_id']) {
                    $inventoryItem = InventoryItem::find($itemData['item_id']);
                }
                
                DepartmentRequestItem::create([
                    'request_id' => $departmentRequest->id,
                    'item_id' => $itemData['item_id'],
                    'item_name' => $inventoryItem ? $inventoryItem->name : ($itemData['custom_item_name'] ?? 'Custom Item'),
                    'item_description' => $itemData['description'],
                    'quantity_requested' => $itemData['quantity_requested'],
                    'unit_of_measure' => $inventoryItem ? $inventoryItem->unit_of_measure : 'pcs',
                    'estimated_unit_cost' => $inventoryItem ? $inventoryItem->standard_cost : ($itemData['estimated_cost'] / $itemData['quantity_requested']),
                    'estimated_total_cost' => $itemData['estimated_cost'],
                ]);
            }

            // Update total cost
            $departmentRequest->updateTotalCost();

            DB::commit();

            return redirect()->route('department-requests.show', $departmentRequest)
                ->with('success', 'Permintaan berhasil dibuat.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Gagal menyimpan permintaan: ' . $e->getMessage()]);
        }
    }

    public function show(DepartmentRequest $departmentRequest)
    {
        // Check if user can view this request
        /** @var \App\Models\User $user */
        $user = Auth::user();
        if (!$user->isAdmin() && 
            $user->department_id !== $departmentRequest->department_id &&
            $user->id !== $departmentRequest->requested_by) {
            abort(403, 'Anda tidak memiliki izin untuk melihat permintaan ini.');
        }

        $departmentRequest->load([
            'department',
            'requestedBy',
            'approvedBy',
            'items.inventoryItem.category'
        ]);

        return Inertia::render('Department/Requests/Show', [
            'request' => $departmentRequest,
            'canEdit' => $departmentRequest->canBeEdited() && 
                        ($user->isAdmin() || $user->id === $departmentRequest->requested_by),
            'canApprove' => $departmentRequest->canBeApproved() && 
                          ($user->isAdmin() || $user->hasPermission('approve_department_requests')),
            'canFulfill' => $departmentRequest->status === 'approved' && 
                          ($user->isAdmin() || $user->hasPermission('fulfill_department_requests'))
        ]);
    }

    public function edit(DepartmentRequest $departmentRequest)
    {
        // Check if user can edit this request
        /** @var \App\Models\User $user */
        $user = Auth::user();
        if (!$departmentRequest->canBeEdited() || 
            (!$user->isAdmin() && $user->id !== $departmentRequest->requested_by)) {
            return redirect()->route('department-requests.show', $departmentRequest)
                ->withErrors(['error' => 'Permintaan tidak dapat diedit.']);
        }

        $departmentRequest->load(['department', 'items.inventoryItem']);

        $inventoryItems = InventoryItem::active()
            ->with('category')
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'unit_of_measure', 'standard_cost', 'category_id']);

        return Inertia::render('Department/Requests/Edit', [
            'request' => $departmentRequest,
            'inventoryItems' => $inventoryItems
        ]);
    }

    public function update(Request $request, DepartmentRequest $departmentRequest)
    {
        // Check if user can edit this request
        /** @var \App\Models\User $user */
        $user = Auth::user();
        if (!$departmentRequest->canBeEdited() || 
            (!$user->isAdmin() && $user->id !== $departmentRequest->requested_by)) {
            return back()->withErrors(['error' => 'Permintaan tidak dapat diedit.']);
        }

        $validated = $request->validate([
            'purpose' => 'required|string|max:500',
            'priority' => 'required|in:low,medium,high',
            'needed_date' => 'required|date|after_or_equal:today',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'nullable|exists:inventory_items,id',
            'items.*.custom_item_name' => 'nullable|string|max:255',
            'items.*.description' => 'nullable|string|max:500',
            'items.*.quantity_requested' => 'required|numeric|min:1',
            'items.*.estimated_cost' => 'required|numeric|min:0'
        ]);

        // Validate that each item has either item_id or custom_item_name
        foreach ($validated['items'] as $item) {
            if (!$item['item_id'] && !$item['custom_item_name']) {
                return back()->withErrors(['items' => 'Setiap item harus memiliki nama barang dari inventory atau nama custom.']);
            }
        }

        try {
            DB::beginTransaction();

            $departmentRequest->update([
                'purpose' => $validated['purpose'],
                'priority' => $validated['priority'],
                'needed_date' => $validated['needed_date'],
                'notes' => $validated['notes'] ?? null,
            ]);

            // Delete existing items and create new ones
            $departmentRequest->items()->delete();

            foreach ($validated['items'] as $itemData) {
                $inventoryItem = null;
                if ($itemData['item_id']) {
                    $inventoryItem = InventoryItem::find($itemData['item_id']);
                }
                
                DepartmentRequestItem::create([
                    'request_id' => $departmentRequest->id,
                    'item_id' => $itemData['item_id'],
                    'item_name' => $inventoryItem ? $inventoryItem->name : ($itemData['custom_item_name'] ?? 'Custom Item'),
                    'item_description' => $itemData['description'],
                    'quantity_requested' => $itemData['quantity_requested'],
                    'unit_of_measure' => $inventoryItem ? $inventoryItem->unit_of_measure : 'pcs',
                    'estimated_unit_cost' => $inventoryItem ? $inventoryItem->standard_cost : ($itemData['estimated_cost'] / $itemData['quantity_requested']),
                    'estimated_total_cost' => $itemData['estimated_cost'],
                ]);
            }

            // Update total cost
            $departmentRequest->updateTotalCost();

            DB::commit();

            return redirect()->route('department-requests.show', $departmentRequest)
                ->with('success', 'Permintaan berhasil diperbarui.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Gagal memperbarui permintaan: ' . $e->getMessage()]);
        }
    }

    public function destroy(DepartmentRequest $departmentRequest)
    {
        // Check if user can delete this request
        /** @var \App\Models\User $user */
        $user = Auth::user();
        if (!$departmentRequest->canBeEdited() || 
            (!$user->isAdmin() && $user->id !== $departmentRequest->requested_by)) {
            return back()->withErrors(['error' => 'Permintaan tidak dapat dihapus.']);
        }

        try {
            $departmentRequest->delete();
            return redirect()->route('department-requests.index')
                ->with('success', 'Permintaan berhasil dihapus.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Gagal menghapus permintaan: ' . $e->getMessage()]);
        }
    }

    public function submit(DepartmentRequest $departmentRequest)
    {
        // Check if user can submit this request
        /** @var \App\Models\User $user */
        $user = Auth::user();
        if ($departmentRequest->status !== 'draft' || 
            (!$user->isAdmin() && $user->id !== $departmentRequest->requested_by)) {
            return back()->withErrors(['error' => 'Permintaan tidak dapat disubmit.']);
        }

        try {
            $departmentRequest->update([
                'status' => 'submitted',
                'submitted_at' => now(),
            ]);

            return back()->with('success', 'Permintaan berhasil disubmit untuk approval.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Gagal submit permintaan: ' . $e->getMessage()]);
        }
    }

    public function approve(Request $request, DepartmentRequest $departmentRequest)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        if (!$departmentRequest->canBeApproved() || 
            !$user->hasPermission('approve_department_requests')) {
            return back()->withErrors(['error' => 'Anda tidak memiliki izin untuk approve permintaan ini.']);
        }

        $validated = $request->validate([
            'approval_notes' => 'nullable|string|max:500'
        ]);

        try {
            $departmentRequest->update([
                'status' => 'approved',
                'approved_by' => $user->id,
                'approved_at' => now(),
                'approval_notes' => $validated['approval_notes'] ?? null,
            ]);

            return back()->with('success', 'Permintaan berhasil diapprove.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Gagal approve permintaan: ' . $e->getMessage()]);
        }
    }

    public function reject(Request $request, DepartmentRequest $departmentRequest)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        if (!$departmentRequest->canBeApproved() || 
            !$user->hasPermission('approve_department_requests')) {
            return back()->withErrors(['error' => 'Anda tidak memiliki izin untuk reject permintaan ini.']);
        }

        $validated = $request->validate([
            'approval_notes' => 'required|string|max:500'
        ]);

        try {
            $departmentRequest->update([
                'status' => 'rejected',
                'approved_by' => $user->id,
                'approved_at' => now(),
                'approval_notes' => $validated['approval_notes'],
            ]);

            return back()->with('success', 'Permintaan berhasil direject.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Gagal reject permintaan: ' . $e->getMessage()]);
        }
    }

    public function fulfill(Request $request, DepartmentRequest $departmentRequest)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        if ($departmentRequest->status !== 'approved' || 
            !$user->hasPermission('fulfill_department_requests')) {
            return back()->withErrors(['error' => 'Anda tidak memiliki izin untuk fulfill permintaan ini.']);
        }

        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.quantity_fulfilled' => 'required|numeric|min:0',
            'fulfillment_notes' => 'nullable|string|max:500'
        ]);

        try {
            DB::beginTransaction();

            foreach ($validated['items'] as $itemId => $itemData) {
                $requestItem = DepartmentRequestItem::find($itemId);
                if ($requestItem && $requestItem->request_id === $departmentRequest->id) {
                    $requestItem->update([
                        'quantity_fulfilled' => $itemData['quantity_fulfilled'],
                        'fulfillment_date' => now(),
                    ]);
                }
            }

            $departmentRequest->update([
                'status' => 'fulfilled',
                'fulfilled_by' => $user->id,
                'fulfilled_at' => now(),
                'fulfillment_notes' => $validated['fulfillment_notes'] ?? null,
            ]);

            DB::commit();

            return back()->with('success', 'Permintaan berhasil difulfill.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Gagal fulfill permintaan: ' . $e->getMessage()]);
        }
    }

    public function getItemsByDepartment(Request $request)
    {
        $user = User::with('department')->find(Auth::id());
        $departmentId = $request->department_id;
        $requestType = $request->request_type ?? 'procurement';
        
        if (!$departmentId) {
            return response()->json(['items' => []]);
        }
        
        $canViewAllItems = $this->isUserAdmin($user) || $this->userHasPermission($user, 'inventory.item.view.all.departments');
        
        if ($requestType === 'transfer') {
            // For transfer requests, get items available in the target department
            $query = DepartmentInventoryLocation::with(['inventoryItem.category'])
                ->where('department_id', $departmentId)
                ->where('is_active', true)
                ->withStock(); // Only items with available stock
                
            // Filter berdasarkan permission user
            if (!$canViewAllItems && $user->department_id) {
                // User hanya bisa lihat item yang ada di departemen sendiri
                $userDepartmentItemIds = DepartmentInventoryLocation::where('department_id', $user->department_id)
                    ->pluck('inventory_item_id')
                    ->toArray();
                
                $query->whereIn('inventory_item_id', $userDepartmentItemIds);
            }
                
            $items = $query->get()
                ->map(function ($location) {
                    return [
                        'id' => $location->inventoryItem->id,
                        'name' => $location->inventoryItem->name,
                        'code' => $location->inventoryItem->code,
                        'unit_of_measure' => $location->inventoryItem->unit_of_measure,
                        'standard_cost' => $location->average_cost, // Use department's average cost
                        'available_stock' => $location->getAvailableStock(),
                        'category_id' => $location->inventoryItem->category_id,
                        'category' => $location->inventoryItem->category
                    ];
                });
        } else {
            // For procurement requests, filter based on user permission
            if ($canViewAllItems) {
                // Admin bisa lihat semua item
                $items = InventoryItem::active()
                    ->with('category')
                    ->orderBy('name')
                    ->get(['id', 'name', 'code', 'unit_of_measure', 'standard_cost', 'category_id']);
            } else {
                // User hanya bisa lihat item yang ada di departemen sendiri
                $departmentItemIds = DepartmentInventoryLocation::where('department_id', $user->department_id)
                    ->pluck('inventory_item_id')
                    ->toArray();
                
                $items = InventoryItem::active()
                    ->with('category')
                    ->whereIn('id', $departmentItemIds)
                    ->orderBy('name')
                    ->get(['id', 'name', 'code', 'unit_of_measure', 'standard_cost', 'category_id']);
            }
            
            $items = $items->map(function ($item) {
                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'code' => $item->code,
                    'unit_of_measure' => $item->unit_of_measure,
                    'standard_cost' => $item->standard_cost,
                    'available_stock' => null, // Not applicable for procurement
                    'category_id' => $item->category_id,
                        'category' => $item->category
                    ];
                });
        }
        
        return response()->json(['items' => $items]);
    }
}
