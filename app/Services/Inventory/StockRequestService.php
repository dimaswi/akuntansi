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
     * Alur baru: Tidak reserve stock saat submit, biarkan user tetap bisa submit
     * meski stok tidak cukup. Logistik akan memberikan catatan dan approve partial jika perlu.
     */
    public function submit(StockRequest $stockRequest): StockRequest
    {
        if (!$stockRequest->canSubmit()) {
            throw new \Exception("Stock request tidak bisa disubmit. Status: {$stockRequest->status}");
        }
        
        return DB::transaction(function() use ($stockRequest) {
            // Tidak perlu reserve stock saat submit
            // Stok akan di-reserve saat approve oleh logistik
            
            $stockRequest->update([
                'status' => 'submitted',
                'submitted_at' => now(),
            ]);
            
            Log::info("Stock request submitted (without stock reservation)", [
                'stock_request_id' => $stockRequest->id,
                'request_number' => $stockRequest->request_number,
            ]);
            
            return $stockRequest->fresh();
        });
    }

    /**
     * Approve stock request (partial approval supported)
     * Alur baru: Reserve stock saat approve, bukan saat submit
     * 
     * @param StockRequest $stockRequest
     * @param int $approvedBy
     * @param array $itemApprovals Array of ['id' => stock_request_item_id, 'quantity_approved' => qty, 'approval_notes' => notes]
     * @return StockRequest
     */
    public function approve(StockRequest $stockRequest, int $approvedBy, array $itemApprovals): StockRequest
    {
        if (!$stockRequest->canApprove()) {
            throw new \Exception("Stock request tidak bisa diapprove. Status: {$stockRequest->status}");
        }
        
        return DB::transaction(function() use ($stockRequest, $approvedBy, $itemApprovals) {
            $hasPartialApproval = false;
            $totalApproved = 0;
            $totalRequested = 0;
            
            // Update item approvals
            foreach ($itemApprovals as $itemApproval) {
                $stockRequestItemId = $itemApproval['id'] ?? null;
                $approvedQty = $itemApproval['quantity_approved'] ?? 0;
                $approvalNotes = $itemApproval['approval_notes'] ?? null;
                
                if (!$stockRequestItemId) continue;
                
                $requestItem = $stockRequest->items()->where('id', $stockRequestItemId)->first();
                if (!$requestItem) continue;
                
                $totalRequested += $requestItem->quantity_requested;
                
                // Get stock info for unit cost
                $centralStock = $this->itemStockService->getCentralStock($requestItem->item_id);
                $availableStock = $centralStock ? $centralStock->available_quantity : 0;
                
                // Calculate the actual approved qty (cannot exceed available stock or requested)
                $previousApprovedQty = $requestItem->quantity_approved ?? 0;
                $maxApprovable = $requestItem->quantity_requested - $previousApprovedQty;
                
                // Limit by available stock if stock exists
                if ($centralStock && $approvedQty > $availableStock) {
                    $approvedQty = $availableStock;
                    // Auto-set approval notes if stock is insufficient
                    if (!$approvalNotes) {
                        $approvalNotes = "Stok hanya tersedia {$availableStock} dari {$maxApprovable} yang diminta";
                    }
                }
                
                // Ensure not exceeding max approvable
                $approvedQty = min($approvedQty, $maxApprovable);
                $newTotalApproved = $previousApprovedQty + $approvedQty;
                $totalApproved += $newTotalApproved;
                
                // Check if partial approval
                if ($newTotalApproved < $requestItem->quantity_requested) {
                    $hasPartialApproval = true;
                }
                
                // Reserve stock for the approved quantity (only for new approval)
                if ($approvedQty > 0 && $centralStock) {
                    try {
                        $this->itemStockService->reserveStock(
                            $requestItem->item_id,
                            null, // central warehouse
                            $approvedQty
                        );
                        
                        Log::info("Stock reserved on approval", [
                            'item_id' => $requestItem->item_id,
                            'quantity' => $approvedQty,
                        ]);
                    } catch (\Exception $e) {
                        // If reserve fails, set approved qty to 0 and add note
                        $approvedQty = 0;
                        $newTotalApproved = $previousApprovedQty;
                        $approvalNotes = ($approvalNotes ? $approvalNotes . ". " : "") . "Gagal reserve stok: " . $e->getMessage();
                        $hasPartialApproval = true;
                        
                        Log::warning("Failed to reserve stock on approval", [
                            'item_id' => $requestItem->item_id,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }
                
                $requestItem->update([
                    'quantity_approved' => $newTotalApproved,
                    'unit_cost' => $centralStock ? $centralStock->average_unit_cost : 0,
                    'total_cost' => $newTotalApproved * ($centralStock ? $centralStock->average_unit_cost : 0),
                    'approval_notes' => $approvalNotes,
                ]);
            }
            
            // Update stock request status
            $stockRequest->update([
                'status' => 'approved',
                'approved_by' => $approvedBy,
                'approved_at' => now(),
            ]);
            
            Log::info("Stock request approved", [
                'stock_request_id' => $stockRequest->id,
                'request_number' => $stockRequest->request_number,
                'approved_by' => $approvedBy,
                'partial_approval' => $hasPartialApproval,
                'total_approved' => $totalApproved,
                'total_requested' => $totalRequested,
            ]);
            
            return $stockRequest->fresh('items.item');
        });
    }

    /**
     * Reject stock request
     * Karena stok tidak di-reserve saat submit, tidak perlu release
     */
    public function reject(StockRequest $stockRequest, int $rejectedBy, string $rejectionReason): StockRequest
    {
        if (!$stockRequest->canApprove()) {
            throw new \Exception("Stock request tidak bisa direject. Status: {$stockRequest->status}");
        }
        
        return DB::transaction(function() use ($stockRequest, $rejectedBy, $rejectionReason) {
            // Jika sudah ada yang di-approve sebelumnya (partial), release stok yang sudah di-reserve
            foreach ($stockRequest->items as $requestItem) {
                if (($requestItem->quantity_approved ?? 0) > 0) {
                    try {
                        $this->itemStockService->releaseReservedStock(
                            $requestItem->item_id, 
                            null, 
                            $requestItem->quantity_approved
                        );
                    } catch (\Exception $e) {
                        Log::warning("Failed to release reserved stock on rejection", [
                            'item_id' => $requestItem->item_id,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }
            }
            
            $stockRequest->update([
                'status' => 'rejected',
                'approved_by' => $rejectedBy,
                'approved_at' => now(),
                'rejection_reason' => $rejectionReason,
            ]);
            
            Log::info("Stock request rejected", [
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
     * Hanya issue item yang memiliki stok tersedia
     */
    public function complete(StockRequest $stockRequest, int $completedBy, array $issuedQuantities = []): StockRequest
    {
        if (!$stockRequest->canComplete()) {
            throw new \Exception("Stock request tidak bisa dicomplete. Status: {$stockRequest->status}");
        }
        
        return DB::transaction(function() use ($stockRequest, $completedBy, $issuedQuantities) {
            $hasIssuedItems = false;
            $pendingItems = [];
            
            foreach ($stockRequest->items as $requestItem) {
                $itemId = $requestItem->item_id;
                $quantityToIssue = $issuedQuantities[$itemId] ?? $requestItem->quantity_approved;
                
                if ($quantityToIssue <= 0) {
                    // Item is pending, skip
                    continue;
                }
                
                // Check if stock is available
                $centralStock = $this->itemStockService->getCentralStock($itemId);
                $stockOnHand = $centralStock ? $centralStock->quantity_on_hand : 0;
                
                if ($stockOnHand < $quantityToIssue) {
                    // Not enough stock - issue what's available or skip
                    if ($stockOnHand > 0) {
                        $quantityToIssue = $stockOnHand;
                    } else {
                        // No stock at all, mark as pending
                        $pendingItems[] = $requestItem->item->name ?? "Item #{$itemId}";
                        $requestItem->update([
                            'quantity_issued' => 0,
                            'approval_notes' => ($requestItem->approval_notes ? $requestItem->approval_notes . ". " : "") . "Belum bisa diissue - stok kosong saat complete"
                        ]);
                        continue;
                    }
                }
                
                // Release reserved stock if any was reserved
                if ($requestItem->quantity_approved > 0) {
                    try {
                        $this->itemStockService->releaseReservedStock($itemId, null, $requestItem->quantity_approved);
                    } catch (\Exception $e) {
                        // Ignore release error - stock might not have been reserved
                        Log::warning("Failed to release reserved stock on complete", [
                            'item_id' => $itemId,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }
                
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
                
                $hasIssuedItems = true;
            }
            
            // Update stock request status
            $stockRequest->update([
                'status' => 'completed',
                'completed_by' => $completedBy,
                'completed_at' => now(),
            ]);
            
            Log::info("Stock request completed", [
                'stock_request_id' => $stockRequest->id,
                'request_number' => $stockRequest->request_number,
                'completed_by' => $completedBy,
                'has_issued_items' => $hasIssuedItems,
                'pending_items' => $pendingItems,
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
