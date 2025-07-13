<?php

namespace App\Repositories\Inventory;

use App\Models\Inventory\Requisition;
use App\Models\Inventory\RequisitionItem;
use App\Models\Inventory\ItemDepartmentStock;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class RequisitionRepository implements RequisitionRepositoryInterface
{
    /**
     * Get all requisitions
     */
    public function all(): Collection
    {
        return Requisition::with(['department', 'requestedBy', 'reviewedBy', 'approvedBy', 'items.item'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Find requisition by ID
     */
    public function find(int $id): ?Requisition
    {
        return Requisition::with(['department', 'requestedBy', 'reviewedBy', 'approvedBy', 'items.item'])
            ->find($id);
    }

    /**
     * Create a new requisition
     */
    public function create(array $data): Requisition
    {
        if (!isset($data['requisition_number'])) {
            $data['requisition_number'] = $this->generateRequisitionNumber();
        }

        return Requisition::create($data);
    }

    /**
     * Update a requisition
     */
    public function update(int $id, array $data): bool
    {
        $requisition = Requisition::find($id);
        if (!$requisition) {
            return false;
        }

        return $requisition->update($data);
    }

    /**
     * Delete a requisition
     */
    public function delete(int $id): bool
    {
        $requisition = Requisition::find($id);
        if (!$requisition) {
            return false;
        }

        // Only allow deletion of draft requisitions
        if ($requisition->status !== 'draft') {
            return false;
        }

        return $requisition->delete();
    }

    /**
     * Get paginated requisitions with filters
     */
    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Requisition::with(['department', 'requestedBy', 'reviewedBy', 'approvedBy'])
            ->orderBy('created_at', 'desc');

        // Apply filters
        if (!empty($filters['search'])) {
            $query->where(function (Builder $q) use ($filters) {
                $q->where('requisition_number', 'like', '%' . $filters['search'] . '%')
                  ->orWhere('purpose', 'like', '%' . $filters['search'] . '%')
                  ->orWhere('notes', 'like', '%' . $filters['search'] . '%');
            });
        }

        if (!empty($filters['department_id'])) {
            $query->where('department_id', $filters['department_id']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['priority'])) {
            $query->where('priority', $filters['priority']);
        }

        if (!empty($filters['requested_by'])) {
            $query->where('requested_by', $filters['requested_by']);
        }

        if (!empty($filters['date_from'])) {
            $query->where('requisition_date', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->where('requisition_date', '<=', $filters['date_to']);
        }

        return $query->paginate($perPage);
    }

    /**
     * Get requisitions by department
     */
    public function getByDepartment(int $departmentId): Collection
    {
        return Requisition::with(['requestedBy', 'items.item'])
            ->where('department_id', $departmentId)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Get requisitions by status
     */
    public function getByStatus(string $status): Collection
    {
        return Requisition::with(['department', 'requestedBy', 'items.item'])
            ->where('status', $status)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Get pending requisitions for approval
     */
    public function getPendingApprovals(): Collection
    {
        return Requisition::with(['department', 'requestedBy', 'items.item'])
            ->whereIn('status', ['submitted', 'reviewed'])
            ->orderBy('created_at', 'asc')
            ->get();
    }

    /**
     * Search requisitions by number or purpose
     */
    public function search(string $query, int $limit = 50): Collection
    {
        $queryBuilder = Requisition::with(['department', 'requestedBy'])
            ->orderBy('created_at', 'desc');

        if (!empty($query)) {
            $queryBuilder->where(function (Builder $q) use ($query) {
                $q->where('requisition_number', 'like', '%' . $query . '%')
                  ->orWhere('purpose', 'like', '%' . $query . '%')
                  ->orWhere('notes', 'like', '%' . $query . '%');
            });
        }

        return $queryBuilder->limit($limit)->get();
    }

    /**
     * Submit requisition for approval
     */
    public function submit(int $id): bool
    {
        $requisition = Requisition::find($id);
        if (!$requisition || !$requisition->canSubmit()) {
            return false;
        }

        return $requisition->update([
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);
    }

    /**
     * Approve requisition
     */
    public function approve(int $id, int $approvedBy, array $itemApprovals = []): bool
    {
        DB::beginTransaction();
        try {
            $requisition = Requisition::with(['department', 'items'])->find($id);
            if (!$requisition || !$requisition->canApprove()) {
                DB::rollBack();
                return false;
            }

            // Update requisition status
            $requisition->update([
                'status' => 'approved',
                'approved_by' => $approvedBy,
                'approved_at' => now(),
            ]);

            // Process item approvals and stock management
            if (!empty($itemApprovals)) {
                foreach ($itemApprovals as $itemApproval) {
                    $quantityApproved = $itemApproval['quantity_approved'];
                    
                    // Update requisition item
                    RequisitionItem::where('requisition_id', $id)
                        ->where('item_id', $itemApproval['item_id'])
                        ->update([
                            'quantity_approved' => $quantityApproved,
                            'approval_notes' => $itemApproval['approval_notes'] ?? null,
                            'status' => $quantityApproved > 0 ? 'approved' : 'rejected',
                        ]);

                    // Transfer stock from logistics to requesting department if approved
                    if ($quantityApproved > 0) {
                        $this->transferStockToRequestingDepartment(
                            $itemApproval['item_id'],
                            $requisition->department_id,
                            $quantityApproved
                        );
                    }
                }
            } else {
                // If no specific item approvals, approve all items and transfer stocks
                foreach ($requisition->items as $item) {
                    RequisitionItem::where('requisition_id', $id)
                        ->where('item_id', $item->item_id)
                        ->update([
                            'quantity_approved' => $item->quantity_requested,
                            'status' => 'approved',
                        ]);

                    // Transfer stock
                    $this->transferStockToRequestingDepartment(
                        $item->item_id,
                        $requisition->department_id,
                        $item->quantity_requested
                    );
                }
            }

            // Calculate new estimated total
            $this->updateEstimatedTotal($id);

            DB::commit();
            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            return false;
        }
    }

    /**
     * Reject requisition
     */
    public function reject(int $id, int $rejectedBy, string $reason): bool
    {
        $requisition = Requisition::find($id);
        if (!$requisition || !$requisition->canReject()) {
            return false;
        }

        return $requisition->update([
            'status' => 'rejected',
            'reviewed_by' => $rejectedBy,
            'reviewed_at' => now(),
            'rejection_reason' => $reason,
        ]);
    }

    /**
     * Cancel requisition
     */
    public function cancel(int $id): bool
    {
        $requisition = Requisition::find($id);
        if (!$requisition || !$requisition->canCancel()) {
            return false;
        }

        return $requisition->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
        ]);
    }

    /**
     * Get requisition statistics
     */
    public function getStatistics(array $filters = []): array
    {
        $query = Requisition::query();

        // Apply date filter if provided
        if (!empty($filters['date_from'])) {
            $query->where('requisition_date', '>=', $filters['date_from']);
        }
        if (!empty($filters['date_to'])) {
            $query->where('requisition_date', '<=', $filters['date_to']);
        }

        $stats = [
            'total' => $query->count(),
            'draft' => (clone $query)->where('status', 'draft')->count(),
            'submitted' => (clone $query)->where('status', 'submitted')->count(),
            'reviewed' => (clone $query)->where('status', 'reviewed')->count(),
            'approved' => (clone $query)->where('status', 'approved')->count(),
            'rejected' => (clone $query)->where('status', 'rejected')->count(),
            'cancelled' => (clone $query)->where('status', 'cancelled')->count(),
            'total_estimated_value' => (clone $query)->sum('estimated_total'),
        ];

        return $stats;
    }

    /**
     * Generate requisition number
     */
    public function generateRequisitionNumber(): string
    {
        $prefix = 'REQ';
        $date = Carbon::now()->format('Ymd');
        
        $lastNumber = Requisition::where('requisition_number', 'like', $prefix . '-' . $date . '-%')
            ->orderBy('requisition_number', 'desc')
            ->first();

        if ($lastNumber) {
            $lastSequence = intval(substr($lastNumber->requisition_number, -3));
            $sequence = str_pad($lastSequence + 1, 3, '0', STR_PAD_LEFT);
        } else {
            $sequence = '001';
        }

        return $prefix . '-' . $date . '-' . $sequence;
    }

    /**
     * Create requisition with items
     */
    public function createWithItems(array $requisitionData, array $items): Requisition
    {
        DB::beginTransaction();
        try {
            $requisition = $this->create($requisitionData);

            foreach ($items as $item) {
                $item['requisition_id'] = $requisition->id;
                RequisitionItem::create($item);
            }

            $this->updateEstimatedTotal($requisition->id);

            DB::commit();
            return $requisition->load(['items.item']);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Update requisition with items
     */
    public function updateWithItems(int $id, array $requisitionData, array $items): bool
    {
        DB::beginTransaction();
        try {
            $requisition = Requisition::find($id);
            if (!$requisition || !$requisition->isEditable()) {
                DB::rollBack();
                return false;
            }

            // Update requisition
            $requisition->update($requisitionData);

            // Delete existing items
            RequisitionItem::where('requisition_id', $id)->delete();

            // Create new items
            foreach ($items as $item) {
                $item['requisition_id'] = $id;
                RequisitionItem::create($item);
            }

            $this->updateEstimatedTotal($id);

            DB::commit();
            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            return false;
        }
    }

    /**
     * Get requisitions for dropdown
     */
    public function forDropdown(array $filters = []): Collection
    {
        $query = Requisition::select(['id', 'requisition_number', 'status', 'requisition_date'])
            ->orderBy('requisition_number', 'desc');

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['department_id'])) {
            $query->where('department_id', $filters['department_id']);
        }

        return $query->limit(100)->get();
    }

    /**
     * Update estimated total for requisition
     */
    private function updateEstimatedTotal(int $requisitionId): void
    {
        $total = RequisitionItem::where('requisition_id', $requisitionId)
            ->sum(DB::raw('quantity_requested * COALESCE(estimated_unit_cost, 0)'));

        Requisition::where('id', $requisitionId)->update(['estimated_total' => $total]);
    }

    /**
     * Transfer stock from logistics department to requesting department
     */
    protected function transferStockToRequestingDepartment(int $itemId, int $requestingDepartmentId, float $quantity): bool
    {
        // Get logistics department (assuming it has name 'Logistics' or code 'LOG')
        $logisticsDepartment = \App\Models\Inventory\Department::where(function($query) {
            $query->where('name', 'like', '%logistic%')
                  ->orWhere('code', 'like', '%log%');
        })->first();

        if (!$logisticsDepartment) {
            throw new \Exception('Logistics department not found');
        }

        // Don't transfer if requesting department is logistics itself
        if ($requestingDepartmentId == $logisticsDepartment->id) {
            return true;
        }

        // Get logistics stock
        $logisticsStock = ItemDepartmentStock::firstOrCreate(
            ['item_id' => $itemId, 'department_id' => $logisticsDepartment->id],
            ['current_stock' => 0, 'reserved_stock' => 0, 'available_stock' => 0]
        );

        // Check if logistics has enough stock
        if ($logisticsStock->available_stock < $quantity) {
            throw new \Exception("Insufficient stock in logistics department. Available: {$logisticsStock->available_stock}, Required: {$quantity}");
        }

        // Get or create requesting department stock
        $requestingStock = ItemDepartmentStock::firstOrCreate(
            ['item_id' => $itemId, 'department_id' => $requestingDepartmentId],
            ['current_stock' => 0, 'reserved_stock' => 0, 'available_stock' => 0]
        );

        // Transfer stock
        $logisticsStock->reduceStock($quantity);
        $requestingStock->addStock($quantity);

        return true;
    }

    /**
     * Check logistics department stock availability
     */
    public function checkLogisticsStockAvailability(int $requisitionId): array
    {
        $requisition = Requisition::with(['items.item', 'department'])->find($requisitionId);
        if (!$requisition) {
            return [];
        }

        $logisticsDepartment = \App\Models\Inventory\Department::where(function($query) {
            $query->where('name', 'like', '%logistic%')
                  ->orWhere('code', 'like', '%log%');
        })->first();

        if (!$logisticsDepartment) {
            return [];
        }

        $stockCheck = [];
        foreach ($requisition->items as $item) {
            $stock = ItemDepartmentStock::where('item_id', $item->item_id)
                ->where('department_id', $logisticsDepartment->id)
                ->first();

            $stockCheck[] = [
                'item_id' => $item->item_id,
                'item_name' => $item->item->name,
                'requested_quantity' => $item->quantity_requested,
                'available_stock' => $stock ? $stock->available_stock : 0,
                'sufficient' => $stock ? ($stock->available_stock >= $item->quantity_requested) : false,
            ];
        }

        return $stockCheck;
    }
}
