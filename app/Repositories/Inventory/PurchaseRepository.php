<?php

namespace App\Repositories\Inventory;

use App\Models\Inventory\Purchase;
use App\Models\Inventory\PurchaseItem;
use App\Models\Inventory\StockMovement;
use App\Models\Inventory\Item;
use App\Services\Inventory\ItemStockService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class PurchaseRepository implements PurchaseRepositoryInterface
{
    public function all()
    {
        return Purchase::with(['supplier', 'creator', 'items.item'])
            ->orderBy('purchase_date', 'desc')
            ->get();
    }

    public function find($id)
    {
        return Purchase::with(['supplier', 'creator', 'approver', 'items.item'])
            ->findOrFail($id);
    }

    public function create(array $data)
    {
        DB::beginTransaction();
        try {
            // Generate purchase number if not provided
            if (!isset($data['purchase_number'])) {
                $data['purchase_number'] = Purchase::generatePurchaseNumber();
            }

            $purchase = Purchase::create($data);
            
            // Add items if provided
            if (isset($data['items']) && is_array($data['items'])) {
                foreach ($data['items'] as $itemData) {
                    $this->addItem($purchase->id, $itemData);
                }
            }

            $this->calculateTotals($purchase->id);
            
            DB::commit();
            return $purchase->fresh(['supplier', 'items.item']);
        } catch (\Exception $e) {
            DB::rollback();
            throw $e;
        }
    }

    public function update($id, array $data)
    {
        DB::beginTransaction();
        try {
            $purchase = Purchase::findOrFail($id);
            
            // Check if purchase can be edited
            if (!$purchase->canBeEdited()) {
                throw new \Exception('Purchase cannot be edited in current status: ' . $purchase->status);
            }

            $purchase->update($data);
            
            // Update items if provided
            if (isset($data['items']) && is_array($data['items'])) {
                // Remove existing items
                $purchase->items()->delete();
                
                // Add new items
                foreach ($data['items'] as $itemData) {
                    $this->addItem($purchase->id, $itemData);
                }
            }

            $this->calculateTotals($purchase->id);
            
            DB::commit();
            return $purchase->fresh(['supplier', 'items.item']);
        } catch (\Exception $e) {
            DB::rollback();
            throw $e;
        }
    }

    public function delete($id)
    {
        DB::beginTransaction();
        try {
            $purchase = Purchase::findOrFail($id);
            
            // Check if purchase can be deleted
            if (!$purchase->canBeEdited()) {
                throw new \Exception('Purchase cannot be deleted in current status: ' . $purchase->status);
            }

            // Delete items first
            $purchase->items()->delete();
            
            // Delete purchase
            $purchase->delete();
            
            DB::commit();
            return true;
        } catch (\Exception $e) {
            DB::rollback();
            throw $e;
        }
    }

    public function paginate(array $filters = [])
    {
        $query = Purchase::with(['supplier', 'creator']);

        // Apply filters
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('purchase_number', 'LIKE', "%{$search}%")
                  ->orWhereHas('supplier', function ($sq) use ($search) {
                      $sq->where('name', 'LIKE', "%{$search}%");
                  });
            });
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['supplier_id'])) {
            $query->where('supplier_id', $filters['supplier_id']);
        }

        if (!empty($filters['date_from'])) {
            $query->whereDate('purchase_date', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->whereDate('purchase_date', '<=', $filters['date_to']);
        }

        $perPage = $filters['perPage'] ?? 15;
        
        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }

    public function search($query, $limit = 10)
    {
        return Purchase::with(['supplier'])
            ->where(function ($q) use ($query) {
                $q->where('purchase_number', 'LIKE', "%{$query}%")
                  ->orWhereHas('supplier', function ($sq) use ($query) {
                      $sq->where('name', 'LIKE', "%{$query}%");
                  });
            })
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    public function findByNumber($number)
    {
        return Purchase::with(['supplier', 'creator', 'items.item'])
            ->where('purchase_number', $number)
            ->first();
    }

    public function getByStatus($status)
    {
        return Purchase::with(['supplier', 'creator'])
            ->where('status', $status)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function getByDepartment($departmentId)
    {
        return Purchase::with(['supplier', 'creator'])
            ->where('department_id', $departmentId)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function getBySupplier($supplierId)
    {
        return Purchase::with(['creator'])
            ->where('supplier_id', $supplierId)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function getPendingApprovals()
    {
        return Purchase::with(['supplier', 'creator'])
            ->where('status', 'pending')
            ->orderBy('created_at', 'asc')
            ->get();
    }

    public function getReadyToReceive()
    {
        return Purchase::with(['supplier', 'items.item'])
            ->whereIn('status', ['ordered', 'partial'])
            ->orderBy('expected_delivery_date', 'asc')
            ->get();
    }

    public function addItem($purchaseId, array $itemData)
    {
        $purchase = Purchase::findOrFail($purchaseId);
        
        if (!$purchase->canBeEdited()) {
            throw new \Exception('Cannot add items to purchase in current status: ' . $purchase->status);
        }

        $itemData['purchase_id'] = $purchaseId;
        $itemData['total_price'] = $itemData['quantity_ordered'] * $itemData['unit_price'];
        
        return PurchaseItem::create($itemData);
    }

    public function removeItem($purchaseId, $itemId)
    {
        $purchase = Purchase::findOrFail($purchaseId);
        
        if (!$purchase->canBeEdited()) {
            throw new \Exception('Cannot remove items from purchase in current status: ' . $purchase->status);
        }

        $purchaseItem = PurchaseItem::where('purchase_id', $purchaseId)
            ->where('item_id', $itemId)
            ->firstOrFail();
        
        return $purchaseItem->delete();
    }

    public function updateItemQuantity($purchaseId, $itemId, $quantity)
    {
        $purchase = Purchase::findOrFail($purchaseId);
        
        if (!$purchase->canBeEdited()) {
            throw new \Exception('Cannot update item quantity for purchase in current status: ' . $purchase->status);
        }

        $purchaseItem = PurchaseItem::where('purchase_id', $purchaseId)
            ->where('item_id', $itemId)
            ->firstOrFail();
        
        $purchaseItem->update([
            'quantity_ordered' => $quantity,
            'total_price' => $quantity * $purchaseItem->unit_price
        ]);

        return $purchaseItem;
    }

    public function approve($purchaseId, $approverId)
    {
        DB::beginTransaction();
        try {
            $purchase = Purchase::findOrFail($purchaseId);
            
            if (!$purchase->canBeApproved()) {
                throw new \Exception('Purchase cannot be approved in current status: ' . $purchase->status);
            }

            $purchase->update([
                'status' => 'approved',
                'approved_by' => $approverId,
                'approved_at' => now(),
            ]);

            DB::commit();
            return $purchase;
        } catch (\Exception $e) {
            DB::rollback();
            throw $e;
        }
    }

    public function receiveItem($purchaseItemId, $receivedQuantity, array $additionalData = [])
    {
        DB::beginTransaction();
        try {
            $purchaseItem = PurchaseItem::with(['purchase', 'item'])->findOrFail($purchaseItemId);
            $purchase = $purchaseItem->purchase;
            
            if (!$purchase->canReceiveItems()) {
                throw new \Exception('Cannot receive items for purchase in current status: ' . $purchase->status);
            }

            // Update received quantity
            $purchaseItem->quantity_received += $receivedQuantity;
            
            // Update batch and expiry if provided
            if (isset($additionalData['batch_number'])) {
                $purchaseItem->batch_number = $additionalData['batch_number'];
            }
            if (isset($additionalData['expiry_date'])) {
                $purchaseItem->expiry_date = $additionalData['expiry_date'];
            }
            
            $purchaseItem->updateStatus();

            // Create stock movement
            $stockMovement = StockMovement::createFromPurchase(
                $purchaseItem, 
                $receivedQuantity, 
                $purchaseItem->unit_price,
                Auth::id() ?? $purchase->created_by
            );

            // ============================================================
            // NEW FLOW: Receive to CENTRAL WAREHOUSE (not department)
            // ============================================================
            $itemStockService = app(ItemStockService::class);
            
            // Add stock to central warehouse
            $itemStockService->addToCentral(
                itemId: $purchaseItem->item_id,
                quantity: $receivedQuantity,
                unitCost: $purchaseItem->unit_price,
                userId: Auth::id() ?? $purchase->created_by,
                referenceType: Purchase::class,
                referenceId: $purchase->id,
                notes: "Purchase receive from PO #{$purchase->purchase_number}"
            );

            // Check if all items are fully received
            $this->updatePurchaseStatus($purchase->id);

            DB::commit();
            return $purchaseItem;
        } catch (\Exception $e) {
            DB::rollback();
            throw $e;
        }
    }

    public function calculateTotals($purchaseId)
    {
        $purchase = Purchase::findOrFail($purchaseId);
        $purchase->calculateTotals();
        return $purchase;
    }

    protected function updatePurchaseStatus($purchaseId)
    {
        $purchase = Purchase::with('items')->findOrFail($purchaseId);
        
        $totalItems = $purchase->items->count();
        $completedItems = $purchase->items->where('item_status', 'completed')->count();
        $partialItems = $purchase->items->where('item_status', 'partial')->count();

        if ($completedItems === $totalItems) {
            $purchase->update([
                'status' => 'completed',
                'completed_at' => now(),
                'actual_delivery_date' => now()->toDateString()
            ]);
        } elseif ($partialItems > 0 || $completedItems > 0) {
            $purchase->update(['status' => 'partial']);
        }
    }
}
