<?php

namespace App\Http\Controllers\Department;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\DepartmentInventoryTransfer;
use App\Models\DepartmentInventoryTransferItem;
use App\Models\DepartmentRequest;
use App\Models\DepartmentRequestItem;
use App\Models\Inventory\InventoryItem;
use App\Models\Inventory\InventoryLocation;
use App\Models\Inventory\InventoryStock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DepartmentInventoryTransferController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $query = DepartmentInventoryTransfer::with([
            'fromDepartment',
            'toDepartment',
            'departmentRequest',
            'approvedBy',
            'transferredBy',
            'receivedBy',
            'items.inventoryItem'
        ]);

        // Filter berdasarkan departemen user jika bukan admin
        if (!$user->isAdmin()) {
            $userDepartmentId = $user->department_id;
            $query->where(function ($q) use ($userDepartmentId) {
                $q->where('from_department_id', $userDepartmentId)
                  ->orWhere('to_department_id', $userDepartmentId);
            });
        }

        // Apply filters
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('from_department') && $request->from_department !== 'all') {
            $query->where('from_department_id', $request->from_department);
        }

        if ($request->filled('to_department') && $request->to_department !== 'all') {
            $query->where('to_department_id', $request->to_department);
        }

        $transfers = $query->orderBy('created_at', 'desc')->paginate(15);
        $departments = Department::active()->orderBy('name')->get(['id', 'name', 'code']);

        return Inertia::render('Department/InventoryTransfers/Index', [
            'transfers' => $transfers,
            'departments' => $departments,
            'filters' => $request->only(['status', 'from_department', 'to_department'])
        ]);
    }

    public function show(DepartmentInventoryTransfer $transfer)
    {
        $user = Auth::user();
        
        // Check permissions
        if (!$user->isAdmin() && 
            $user->department_id !== $transfer->from_department_id &&
            $user->department_id !== $transfer->to_department_id) {
            abort(403, 'Unauthorized access to this transfer.');
        }

        $transfer->load([
            'fromDepartment',
            'toDepartment',
            'fromLocation',
            'toLocation',
            'departmentRequest',
            'approvedBy',
            'transferredBy',
            'receivedBy',
            'items.inventoryItem',
            'items.departmentRequestItem'
        ]);

        return Inertia::render('Department/InventoryTransfers/Show', [
            'transfer' => $transfer,
            'canApprove' => $transfer->canBeApproved() && 
                          ($user->isAdmin() || $user->hasPermission('approve_inventory_transfers')),
            'canTransfer' => $transfer->canBeTransferred() && 
                           ($user->isAdmin() || $user->department_id === $transfer->from_department_id),
            'canReceive' => $transfer->canBeReceived() && 
                          ($user->isAdmin() || $user->department_id === $transfer->to_department_id),
            'canCancel' => $transfer->canBeCancelled() && 
                         ($user->isAdmin() || $user->department_id === $transfer->from_department_id)
        ]);
    }

    public function createFromRequest(DepartmentRequest $departmentRequest)
    {
        $user = Auth::user();

        // Validate that the request is approved
        if ($departmentRequest->status !== 'approved') {
            return back()->withErrors(['error' => 'Hanya permintaan yang telah disetujui yang dapat dibuat transfer.']);
        }

        // Check if user has permission
        if (!$user->isAdmin() && !$user->hasPermission('create_inventory_transfers')) {
            return back()->withErrors(['error' => 'Anda tidak memiliki izin untuk membuat transfer inventory.']);
        }

        // Check if transfer already exists for this request
        $existingTransfer = DepartmentInventoryTransfer::where('department_request_id', $departmentRequest->id)->first();
        if ($existingTransfer) {
            return redirect()->route('department-inventory-transfers.show', $existingTransfer)
                ->with('info', 'Transfer sudah ada untuk permintaan ini.');
        }

        // Get departments that have inventory for requested items
        $requestItems = $departmentRequest->items()->with('inventoryItem')->get();
        $availableDepartments = $this->findDepartmentsWithStock($requestItems);

        $departmentRequest->load(['department', 'items.inventoryItem']);

        return Inertia::render('Department/InventoryTransfers/Create', [
            'departmentRequest' => $departmentRequest,
            'availableDepartments' => $availableDepartments,
            'requestItems' => $requestItems
        ]);
    }

    private function findDepartmentsWithStock($requestItems): array
    {
        $availableDepartments = [];

        foreach ($requestItems as $requestItem) {
            if ($requestItem->inventoryItem) {
                $stocks = InventoryStock::where('item_id', $requestItem->inventoryItem->id)
                    ->where('available_quantity', '>', 0)
                    ->with('location.department')
                    ->get();

                foreach ($stocks as $stock) {
                    if ($stock->location && $stock->location->department) {
                        $deptId = $stock->location->department->id;
                        if (!isset($availableDepartments[$deptId])) {
                            $availableDepartments[$deptId] = [
                                'department' => $stock->location->department,
                                'items' => []
                            ];
                        }
                        $availableDepartments[$deptId]['items'][] = [
                            'inventory_item' => $requestItem->inventoryItem,
                            'available_quantity' => $stock->available_quantity,
                            'location' => $stock->location
                        ];
                    }
                }
            }
        }

        return array_values($availableDepartments);
    }
}
