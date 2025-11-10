<?php

namespace App\Services\Inventory;

use App\Models\Inventory\StockRequest;
use App\Models\Inventory\StockRequestItem;
use App\Models\Inventory\ItemStock;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Service untuk handle Stock Request workflow
 */
class StockRequestService
{
    public function __construct(
        protected ItemStockService $itemStockService
    ) {}

    /**
     * Create new stock request (draft)
     */
    public function createDraft(int $departmentId, int $requestedBy, array $items, string $priority = 'normal', string $notes = null): StockRequest
    {
        return DB::transaction(function() use ($departmentId, $requestedBy, $items, $priority, $notes) {
            // Create stock request
            $stockRequest = StockRequest::create([
                'request_number' => StockRequest::generateRequestNumber(),
                'request_date' => now(),
                'department_id' => $departmentId,
                'requested_by' => $requestedBy,
                'status' => 'draft',
                'priority' => $priority,
                'notes' => $notes,
            ]);
            
            // Add items
            foreach ($items as $item) {
                StockRequestItem::create([
                    'stock_request_id' => $stockRequest->id,
                    'item_id' => $item['item_id'],
                    'quantity_requested' => $item['quantity_requested'],
                    'notes' => $item['notes'] ?? null,
                ]);
            }
            
            Log::info("Stock request draft created", [
                'stock_request_id' => $stockRequest->id,
                'request_number' => $stockRequest->request_number,
                'department_id' => $departmentId,
            ]);
            
            return $stockRequest->load('items.item');
        });
    }

    /**
     * Submit stock request for approval
     */
    public function submit(StockRequest $stockRequest): StockRequest
    {
        if (!$stockRequest->canSubmit()) {
            throw new \Exception("Stock request tidak bisa disubmit. Status: {$stockRequest->status}");
        }
        
        return DB::transaction(function() use ($stockRequest) {
            // Reserve stock immediately upon submission (not waiting for approval)
            foreach ($stockRequest->items as $requestItem) {
                if ($requestItem->quantity_requested > 0) {
                    try {
                        Log::info("Attempting to reserve stock", [
                            'item_id' => $requestItem->item_id,
                            'quantity' => $requestItem->quantity_requested,
                        ]);
                        
                        // Reserve stock di central warehouse
                        $this->itemStockService->reserveStock(
                            $requestItem->item_id, 
                            null, // null = central warehouse
                            $requestItem->quantity_requested
                        );
                        
                        Log::info("Stock reserved successfully", [
                            'item_id' => $requestItem->item_id,
                            'quantity' => $requestItem->quantity_requested,
                        ]);
                    } catch (\Exception $e) {
                        Log::error("Failed to reserve stock", [
                            'item_id' => $requestItem->item_id,
                            'error' => $e->getMessage(),
                        ]);
                        throw $e; // Re-throw to rollback transaction
                    }
                }
            }
            
            $stockRequest->update([
                'status' => 'submitted',
                'submitted_at' => now(),
            ]);
            
            Log::info("Stock request submitted and stock reserved", [
                'stock_request_id' => $stockRequest->id,
                'request_number' => $stockRequest->request_number,
            ]);
            
            return $stockRequest->fresh();
        });
    }

    /**
     * Approve stock request
     */
    public function approve(StockRequest $stockRequest, int $approvedBy, array $itemApprovals): StockRequest
    {
        if (!$stockRequest->canApprove()) {
            throw new \Exception("Stock request tidak bisa diapprove. Status: {$stockRequest->status}");
        }
        
        return DB::transaction(function() use ($stockRequest, $approvedBy, $itemApprovals) {
            // Update item approvals - $itemApprovals is [stock_request_item_id => quantity_approved]
            foreach ($itemApprovals as $stockRequestItemId => $approvedQty) {
                $requestItem = $stockRequest->items()->where('id', $stockRequestItemId)->first();
                if ($requestItem) {
                    // Get stock info for unit cost
                    $centralStock = $this->itemStockService->getCentralStock($requestItem->item_id);
                    
                    // Calculate the DIFFERENCE if already approved before
                    $previousApprovedQty = $requestItem->quantity_approved ?? 0;
                    $newApprovedQty = min($approvedQty, $requestItem->quantity_requested);
                    
                    $requestItem->update([
                        'quantity_approved' => $newApprovedQty,
                        'unit_cost' => $centralStock ? $centralStock->average_unit_cost : 0,
                        'total_cost' => $newApprovedQty * ($centralStock ? $centralStock->average_unit_cost : 0),
                    ]);
                    
                    // Adjust reserved stock if approved quantity is less than requested
                    $qtyDifference = $requestItem->quantity_requested - $newApprovedQty;
                    if ($qtyDifference > 0) {
                        // Release the portion that was not approved
                        $this->itemStockService->releaseReservedStock(
                            $requestItem->item_id, 
                            null, 
                            $qtyDifference
                        );
                    }
                }
            }
            
            // Update stock request
            $stockRequest->update([
                'status' => 'approved',
                'approved_by' => $approvedBy,
                'approved_at' => now(),
            ]);
            
            Log::info("Stock request approved", [
                'stock_request_id' => $stockRequest->id,
                'request_number' => $stockRequest->request_number,
                'approved_by' => $approvedBy,
            ]);
            
            return $stockRequest->fresh('items.item');
        });
    }

    /**
     * Reject stock request
     */
    public function reject(StockRequest $stockRequest, int $rejectedBy, string $rejectionReason): StockRequest
    {
        if (!$stockRequest->canApprove()) {
            throw new \Exception("Stock request tidak bisa direject. Status: {$stockRequest->status}");
        }
        
        return DB::transaction(function() use ($stockRequest, $rejectedBy, $rejectionReason) {
            // Release ALL reserved stock when rejected
            foreach ($stockRequest->items as $requestItem) {
                if ($requestItem->quantity_requested > 0) {
                    $this->itemStockService->releaseReservedStock(
                        $requestItem->item_id, 
                        null, 
                        $requestItem->quantity_requested
                    );
                }
            }
            
            $stockRequest->update([
                'status' => 'rejected',
                'approved_by' => $rejectedBy,
                'approved_at' => now(),
                'notes' => ($stockRequest->notes ? $stockRequest->notes . "\n\n" : '') . "REJECTED: {$rejectionReason}",
            ]);
            
            Log::info("Stock request rejected and stock released", [
                'stock_request_id' => $stockRequest->id,
                'request_number' => $stockRequest->request_number,
                'rejected_by' => $rejectedBy,
                'reason' => $rejectionReason,
            ]);
            
            return $stockRequest->fresh();
        });
    }

    /**
     * Complete stock request (issue items to department)
     */
    public function complete(StockRequest $stockRequest, int $completedBy, array $issuedQuantities = []): StockRequest
    {
        if (!$stockRequest->canComplete()) {
            throw new \Exception("Stock request tidak bisa dicomplete. Status: {$stockRequest->status}");
        }
        
        return DB::transaction(function() use ($stockRequest, $completedBy, $issuedQuantities) {
            foreach ($stockRequest->items as $requestItem) {
                $itemId = $requestItem->item_id;
                $quantityToIssue = $issuedQuantities[$itemId] ?? $requestItem->quantity_approved;
                
                if ($quantityToIssue > 0) {
                    // Release reserved stock (use approved quantity, which was already reserved)
                    $this->itemStockService->releaseReservedStock($itemId, null, $requestItem->quantity_approved);
                    
                    // Issue stock from central to department
                    $transfer = $this->itemStockService->issueFromCentral(
                        itemId: $itemId,
                        toDepartmentId: $stockRequest->department_id,
                        quantity: $quantityToIssue,
                        userId: $completedBy,
                        referenceType: StockRequest::class,
                        referenceId: $stockRequest->id,
                        notes: "Stock Request #{$stockRequest->request_number}"
                    );
                    
                    // Update request item
                    $requestItem->update([
                        'quantity_issued' => $quantityToIssue,
                    ]);
                }
            }
            
            // Update stock request
            $stockRequest->update([
                'status' => 'completed',
                'completed_by' => $completedBy,
                'completed_at' => now(),
            ]);
            
            Log::info("Stock request completed", [
                'stock_request_id' => $stockRequest->id,
                'request_number' => $stockRequest->request_number,
                'completed_by' => $completedBy,
            ]);
            
            return $stockRequest->fresh('items.item');
        });
    }

    /**
     * Cancel stock request
     */
    public function cancel(StockRequest $stockRequest, int $cancelledBy, string $cancellationReason): StockRequest
    {
        if (!$stockRequest->canCancel()) {
            throw new \Exception("Stock request tidak bisa dicancel. Status: {$stockRequest->status}");
        }
        
        return DB::transaction(function() use ($stockRequest, $cancelledBy, $cancellationReason) {
            // Release reserved stock based on current status
            if (in_array($stockRequest->status, ['submitted', 'approved'])) {
                foreach ($stockRequest->items as $requestItem) {
                    // If approved, release approved quantity; if submitted, release requested quantity
                    $qtyToRelease = $stockRequest->status === 'approved' 
                        ? $requestItem->quantity_approved 
                        : $requestItem->quantity_requested;
                    
                    if ($qtyToRelease > 0) {
                        $this->itemStockService->releaseReservedStock(
                            $requestItem->item_id, 
                            null, 
                            $qtyToRelease
                        );
                    }
                }
            }
            
            $stockRequest->update([
                'status' => 'cancelled',
                'notes' => ($stockRequest->notes ? $stockRequest->notes . "\n\n" : '') . "CANCELLED by User#{$cancelledBy}: {$cancellationReason}",
            ]);
            
            Log::info("Stock request cancelled and reserved stock released", [
                'stock_request_id' => $stockRequest->id,
                'request_number' => $stockRequest->request_number,
                'cancelled_by' => $cancelledBy,
                'reason' => $cancellationReason,
            ]);
            
            return $stockRequest->fresh();
        });
    }

    /**
     * Update draft stock request
     */
    public function updateDraft(StockRequest $stockRequest, array $data): StockRequest
    {
        if (!$stockRequest->canEdit()) {
            throw new \Exception("Stock request tidak bisa diedit. Status: {$stockRequest->status}");
        }
        
        return DB::transaction(function() use ($stockRequest, $data) {
            // Update main data
            $stockRequest->update([
                'priority' => $data['priority'] ?? $stockRequest->priority,
                'notes' => $data['notes'] ?? $stockRequest->notes,
            ]);
            
            // Update items if provided
            if (isset($data['items'])) {
                // Delete existing items
                $stockRequest->items()->delete();
                
                // Add new items
                foreach ($data['items'] as $item) {
                    StockRequestItem::create([
                        'stock_request_id' => $stockRequest->id,
                        'item_id' => $item['item_id'],
                        'quantity_requested' => $item['quantity_requested'],
                        'notes' => $item['notes'] ?? null,
                    ]);
                }
            }
            
            Log::info("Stock request draft updated", [
                'stock_request_id' => $stockRequest->id,
                'request_number' => $stockRequest->request_number,
            ]);
            
            return $stockRequest->fresh('items.item');
        });
    }

    /**
     * Get pending Permintaan Stok untuk approval
     */
    public function getPendingRequests(?int $departmentId = null)
    {
        $query = StockRequest::with(['department', 'requestedByUser', 'items.item'])
            ->whereIn('status', ['submitted'])
            ->orderBy('priority', 'desc')
            ->orderBy('request_date', 'asc');
        
        if ($departmentId) {
            $query->where('department_id', $departmentId);
        }
        
        return $query->get();
    }

    /**
     * Get stock request statistics
     */
    public function getStatistics(?int $departmentId = null): array
    {
        $query = StockRequest::query();
        
        if ($departmentId) {
            $query->where('department_id', $departmentId);
        }
        
        return [
            'draft' => (clone $query)->where('status', 'draft')->count(),
            'submitted' => (clone $query)->where('status', 'submitted')->count(),
            'approved' => (clone $query)->where('status', 'approved')->count(),
            'completed' => (clone $query)->where('status', 'completed')->count(),
            'rejected' => (clone $query)->where('status', 'rejected')->count(),
            'cancelled' => (clone $query)->where('status', 'cancelled')->count(),
        ];
    }
}
