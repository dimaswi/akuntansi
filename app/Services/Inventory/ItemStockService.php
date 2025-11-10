<?php

namespace App\Services\Inventory;

use App\Models\Inventory\Item;
use App\Models\Inventory\ItemStock;
use App\Models\Inventory\Department;
use App\Models\Inventory\InventoryTransaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Service untuk manage stock di Central Warehouse dan Department
 */
class ItemStockService
{
    /**
     * Get central warehouse stock untuk item
     */
    public function getCentralStock(int $itemId): ?ItemStock
    {
        return ItemStock::getCentralStock($itemId);
    }

    /**
     * Get department stock untuk item
     */
    public function getDepartmentStock(int $itemId, int $departmentId): ?ItemStock
    {
        return ItemStock::getDepartmentStock($itemId, $departmentId);
    }

    /**
     * Get or create central stock
     */
    public function getOrCreateCentralStock(int $itemId): ItemStock
    {
        return ItemStock::getOrCreateCentralStock($itemId);
    }

    /**
     * Get or create department stock
     */
    public function getOrCreateDepartmentStock(int $itemId, int $departmentId): ItemStock
    {
        return ItemStock::getOrCreateDepartmentStock($itemId, $departmentId);
    }

    /**
     * Add stock to central warehouse (from purchase receive)
     */
    public function addToCentral(int $itemId, float $quantity, float $unitCost, int $userId, string $referenceType = null, int $referenceId = null, string $notes = null): InventoryTransaction
    {
        return DB::transaction(function() use ($itemId, $quantity, $unitCost, $userId, $referenceType, $referenceId, $notes) {
            $stock = $this->getOrCreateCentralStock($itemId);
            $balanceBefore = $stock->quantity_on_hand;
            
            // Add stock
            $stock->addStock($quantity, $unitCost);
            $balanceAfter = $stock->quantity_on_hand;
            
            // Create inventory transaction
            $transaction = InventoryTransaction::create([
                'transaction_number' => InventoryTransaction::generateTransactionNumber('RCV'),
                'transaction_date' => now(),
                'transaction_type' => 'purchase_receive',
                'warehouse_location' => 'central',
                'item_id' => $itemId,
                'department_id' => null, // Central = null
                'quantity' => $quantity,
                'unit_cost' => $unitCost,
                'total_cost' => $quantity * $unitCost,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'notes' => $notes ?? "Penerimaan barang ke gudang pusat",
                'created_by' => $userId,
            ]);
            
            Log::info("Stock added to central warehouse", [
                'item_id' => $itemId,
                'quantity' => $quantity,
                'transaction_id' => $transaction->id,
            ]);
            
            return $transaction;
        });
    }

    /**
     * Issue stock from central to department (stock transfer)
     */
    public function issueFromCentral(int $itemId, int $toDepartmentId, float $quantity, int $userId, string $referenceType = null, int $referenceId = null, string $notes = null): array
    {
        return DB::transaction(function() use ($itemId, $toDepartmentId, $quantity, $userId, $referenceType, $referenceId, $notes) {
            $centralStock = $this->getOrCreateCentralStock($itemId);
            $deptStock = $this->getOrCreateDepartmentStock($itemId, $toDepartmentId);
            
            // Check availability
            if ($centralStock->available_quantity < $quantity) {
                throw new \Exception("Stok di gudang pusat tidak mencukupi. Available: {$centralStock->available_quantity}, Required: {$quantity}");
            }
            
            $centralBalanceBefore = $centralStock->quantity_on_hand;
            $deptBalanceBefore = $deptStock->quantity_on_hand;
            
            // Reduce from central
            $centralStock->reduceStock($quantity);
            $centralBalanceAfter = $centralStock->quantity_on_hand;
            
            // Add to department (use central's last cost)
            $deptStock->addStock($quantity, $centralStock->last_unit_cost);
            $deptBalanceAfter = $deptStock->quantity_on_hand;
            
            $unitCost = $centralStock->last_unit_cost;
            $totalCost = $quantity * $unitCost;
            
            // Create outbound transaction (from central)
            $outboundTrx = InventoryTransaction::create([
                'transaction_number' => InventoryTransaction::generateTransactionNumber('ISU'),
                'transaction_date' => now(),
                'transaction_type' => 'stock_issue',
                'warehouse_location' => 'central',
                'item_id' => $itemId,
                'department_id' => null,
                'from_department_id' => null,
                'to_department_id' => $toDepartmentId,
                'quantity' => $quantity,
                'unit_cost' => $unitCost,
                'total_cost' => $totalCost,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'balance_before' => $centralBalanceBefore,
                'balance_after' => $centralBalanceAfter,
                'notes' => $notes ?? "Pengeluaran dari gudang pusat",
                'created_by' => $userId,
            ]);
            
            // Create inbound transaction (to department)
            $inboundTrx = InventoryTransaction::create([
                'transaction_number' => InventoryTransaction::generateTransactionNumber('RCV'),
                'transaction_date' => now(),
                'transaction_type' => 'stock_receive',
                'warehouse_location' => 'department',
                'item_id' => $itemId,
                'department_id' => $toDepartmentId,
                'from_department_id' => null,
                'to_department_id' => $toDepartmentId,
                'quantity' => $quantity,
                'unit_cost' => $unitCost,
                'total_cost' => $totalCost,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'balance_before' => $deptBalanceBefore,
                'balance_after' => $deptBalanceAfter,
                'notes' => $notes ?? "Penerimaan dari gudang pusat",
                'created_by' => $userId,
            ]);
            
            Log::info("Stock transferred from central to department", [
                'item_id' => $itemId,
                'to_department_id' => $toDepartmentId,
                'quantity' => $quantity,
                'outbound_trx_id' => $outboundTrx->id,
                'inbound_trx_id' => $inboundTrx->id,
            ]);
            
            return [
                'outbound_transaction' => $outboundTrx,
                'inbound_transaction' => $inboundTrx,
                'total_cost' => $totalCost,
            ];
        });
    }

    /**
     * Return stock from department to central
     */
    public function returnToCentral(int $itemId, int $fromDepartmentId, float $quantity, int $userId, string $reason = null, string $notes = null): array
    {
        return DB::transaction(function() use ($itemId, $fromDepartmentId, $quantity, $userId, $reason, $notes) {
            $deptStock = $this->getOrCreateDepartmentStock($itemId, $fromDepartmentId);
            $centralStock = $this->getOrCreateCentralStock($itemId);
            
            // Check availability
            if ($deptStock->available_quantity < $quantity) {
                throw new \Exception("Stok di department tidak mencukupi. Available: {$deptStock->available_quantity}, Required: {$quantity}");
            }
            
            $deptBalanceBefore = $deptStock->quantity_on_hand;
            $centralBalanceBefore = $centralStock->quantity_on_hand;
            
            $unitCost = $deptStock->last_unit_cost;
            $totalCost = $quantity * $unitCost;
            
            // Reduce from department
            $deptStock->reduceStock($quantity);
            $deptBalanceAfter = $deptStock->quantity_on_hand;
            
            // Add to central (use department's cost)
            $centralStock->addStock($quantity, $unitCost);
            $centralBalanceAfter = $centralStock->quantity_on_hand;
            
            $fullNotes = $notes ?? "Return dari department";
            if ($reason) {
                $fullNotes .= " - Alasan: {$reason}";
            }
            
            // Create outbound transaction (from department)
            $outboundTrx = InventoryTransaction::create([
                'transaction_number' => InventoryTransaction::generateTransactionNumber('RET'),
                'transaction_date' => now(),
                'transaction_type' => 'return_to_central',
                'warehouse_location' => 'department',
                'item_id' => $itemId,
                'department_id' => $fromDepartmentId,
                'from_department_id' => $fromDepartmentId,
                'to_department_id' => null,
                'quantity' => $quantity,
                'unit_cost' => $unitCost,
                'total_cost' => $totalCost,
                'reference_type' => 'manual_return',
                'reference_id' => null,
                'balance_before' => $deptBalanceBefore,
                'balance_after' => $deptBalanceAfter,
                'notes' => $fullNotes,
                'created_by' => $userId,
            ]);
            
            // Create inbound transaction (to central)
            $inboundTrx = InventoryTransaction::create([
                'transaction_number' => InventoryTransaction::generateTransactionNumber('RCV'),
                'transaction_date' => now(),
                'transaction_type' => 'return_to_central',
                'warehouse_location' => 'central',
                'item_id' => $itemId,
                'department_id' => null,
                'from_department_id' => $fromDepartmentId,
                'to_department_id' => null,
                'quantity' => $quantity,
                'unit_cost' => $unitCost,
                'total_cost' => $totalCost,
                'reference_type' => 'manual_return',
                'reference_id' => null,
                'balance_before' => $centralBalanceBefore,
                'balance_after' => $centralBalanceAfter,
                'notes' => $fullNotes,
                'created_by' => $userId,
            ]);
            
            Log::info("Stock returned from department to central", [
                'item_id' => $itemId,
                'from_department_id' => $fromDepartmentId,
                'quantity' => $quantity,
                'reason' => $reason,
            ]);
            
            return [
                'outbound_transaction' => $outboundTrx,
                'inbound_transaction' => $inboundTrx,
                'total_cost' => $totalCost,
            ];
        });
    }

    /**
     * Stock adjustment (for stock opname/correction)
     */
    public function adjustStock(int $itemId, ?int $departmentId, float $actualQuantity, int $userId, string $reason, string $notes = null): InventoryTransaction
    {
        return DB::transaction(function() use ($itemId, $departmentId, $actualQuantity, $userId, $reason, $notes) {
            // Get stock
            if ($departmentId === null) {
                $stock = $this->getOrCreateCentralStock($itemId);
                $location = 'central';
                $locationName = 'Gudang Pusat';
            } else {
                $stock = $this->getOrCreateDepartmentStock($itemId, $departmentId);
                $location = 'department';
                $department = Department::find($departmentId);
                $locationName = "Department {$department->name}";
            }
            
            $balanceBefore = $stock->quantity_on_hand;
            $difference = $actualQuantity - $balanceBefore;
            $adjustmentType = $difference > 0 ? 'Penambahan' : 'Pengurangan';
            
            // Adjust stock directly (bypass add/reduce methods for adjustment)
            $stock->quantity_on_hand = $actualQuantity;
            $stock->updateAvailableQuantity();
            $stock->updateTotalValue();
            $stock->last_updated_at = now();
            $stock->save();
            
            $balanceAfter = $stock->quantity_on_hand;
            
            $fullNotes = "Stock Adjustment - {$adjustmentType} di {$locationName}. Alasan: {$reason}";
            if ($notes) {
                $fullNotes .= " | {$notes}";
            }
            
            // Create adjustment transaction
            $transaction = InventoryTransaction::create([
                'transaction_number' => InventoryTransaction::generateTransactionNumber('ADJ'),
                'transaction_date' => now(),
                'transaction_type' => 'stock_adjustment',
                'warehouse_location' => $location,
                'item_id' => $itemId,
                'department_id' => $departmentId,
                'quantity' => abs($difference),
                'unit_cost' => $stock->average_unit_cost,
                'total_cost' => abs($difference) * $stock->average_unit_cost,
                'reference_type' => 'stock_opname',
                'reference_id' => null,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'notes' => $fullNotes,
                'created_by' => $userId,
            ]);
            
            Log::info("Stock adjusted", [
                'item_id' => $itemId,
                'department_id' => $departmentId,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'difference' => $difference,
                'reason' => $reason,
            ]);
            
            return $transaction;
        });
    }

    /**
     * Reserve stock (untuk pending Permintaan Stok)
     */
    public function reserveStock(int $itemId, ?int $departmentId, float $quantity): void
    {
        if ($departmentId === null) {
            $stock = $this->getOrCreateCentralStock($itemId);
        } else {
            $stock = $this->getOrCreateDepartmentStock($itemId, $departmentId);
        }
        
        $stock->reserveStock($quantity);
    }

    /**
     * Release reserved stock
     */
    public function releaseReservedStock(int $itemId, ?int $departmentId, float $quantity): void
    {
        if ($departmentId === null) {
            $stock = $this->getOrCreateCentralStock($itemId);
        } else {
            $stock = $this->getOrCreateDepartmentStock($itemId, $departmentId);
        }
        
        $stock->releaseReservedStock($quantity);
    }

    /**
     * Get low stock items di central warehouse
     */
    public function getLowStockItemsCentral(): array
    {
        $lowStockItems = ItemStock::with('item')
            ->whereNull('department_id')
            ->get()
            ->filter(function($stock) {
                return $stock->quantity_on_hand <= $stock->item->reorder_level;
            });
        
        return $lowStockItems->map(function($stock) {
            return [
                'item' => $stock->item,
                'current_stock' => $stock->quantity_on_hand,
                'reorder_level' => $stock->item->reorder_level,
                'status' => $stock->quantity_on_hand <= 0 ? 'out_of_stock' : 'low_stock',
            ];
        })->toArray();
    }

    /**
     * Get stock summary by item
     */
    public function getStockSummary(int $itemId): array
    {
        $centralStock = $this->getCentralStock($itemId);
        $departmentStocks = ItemStock::where('item_id', $itemId)
            ->whereNotNull('department_id')
            ->with('department')
            ->get();
        
        $totalStock = ($centralStock ? $centralStock->quantity_on_hand : 0) + $departmentStocks->sum('quantity_on_hand');
        
        return [
            'item_id' => $itemId,
            'central_stock' => $centralStock ? [
                'quantity_on_hand' => $centralStock->quantity_on_hand,
                'reserved_quantity' => $centralStock->reserved_quantity,
                'available_quantity' => $centralStock->available_quantity,
                'average_unit_cost' => $centralStock->average_unit_cost,
                'total_value' => $centralStock->total_value,
            ] : null,
            'department_stock_details' => $departmentStocks->map(function($stock) {
                return [
                    'department_id' => $stock->department_id,
                    'department_name' => $stock->department->name,
                    'quantity_on_hand' => $stock->quantity_on_hand,
                    'available_quantity' => $stock->available_quantity,
                    'total_value' => $stock->total_value,
                ];
            })->toArray(),
            'total_stock' => $totalStock,
        ];
    }
}
