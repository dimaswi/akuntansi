<?php

namespace App\Services\Inventory;

use App\Models\Inventory\StockOpname;
use App\Models\Inventory\StockOpnameItem;
use App\Models\Inventory\ItemStock;
use App\Models\Inventory\StockAdjustment;
use Illuminate\Support\Facades\DB;

class StockOpnameService
{
    /**
     * Create new stock opname with items from department stock
     */
    public function create(int $departmentId, string $opnameDate, int $createdBy, ?string $notes = null): StockOpname
    {
        $opnameNumber = StockOpname::generateOpnameNumber($opnameDate);

        $opname = StockOpname::create([
            'opname_number' => $opnameNumber,
            'department_id' => $departmentId,
            'opname_date' => $opnameDate,
            'status' => 'draft',
            'notes' => $notes,
            'created_by' => $createdBy,
        ]);

        // Get all items that have stock in this department
        $stocks = ItemStock::where('department_id', $departmentId)
            ->where('quantity_on_hand', '>', 0)
            ->with('item')
            ->get();

        foreach ($stocks as $stock) {
            StockOpnameItem::create([
                'stock_opname_id' => $opname->id,
                'item_id' => $stock->item_id,
                'system_quantity' => $stock->quantity_on_hand,
                'physical_quantity' => 0, // User will fill this
                'variance' => 0,
                'unit_price' => $stock->item->last_purchase_cost ?? $stock->item->standard_cost ?? 0,
                'variance_value' => 0,
            ]);
        }

        $opname->update(['total_items_counted' => $stocks->count()]);

        return $opname->fresh(['items.item', 'department']);
    }

    /**
     * Update physical quantities and calculate variances
     */
    public function updatePhysicalCounts(StockOpname $opname, array $items): void
    {
        DB::beginTransaction();
        try {
            $totalVarianceValue = 0;

            foreach ($items as $itemData) {
                $opnameItem = StockOpnameItem::findOrFail($itemData['id']);
                
                $physicalQuantity = $itemData['physical_quantity'];
                $variance = $physicalQuantity - $opnameItem->system_quantity;
                $varianceValue = $variance * $opnameItem->unit_price;

                $opnameItem->update([
                    'physical_quantity' => $physicalQuantity,
                    'variance' => $variance,
                    'variance_value' => $varianceValue,
                    'notes' => $itemData['notes'] ?? null,
                ]);

                $totalVarianceValue += $varianceValue;
            }

            $opname->update([
                'total_variance_value' => $totalVarianceValue,
            ]);

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Submit opname for approval
     */
    public function submit(StockOpname $opname): void
    {
        if ($opname->status !== 'draft') {
            throw new \Exception('Hanya opname dengan status draft yang dapat disubmit');
        }

        // Validate all items have physical count
        $uncounted = $opname->items()->where('physical_quantity', 0)->count();
        if ($uncounted > 0) {
            throw new \Exception("Masih ada {$uncounted} item yang belum dihitung fisiknya");
        }

        $opname->update(['status' => 'submitted']);
    }

    /**
     * Approve opname and create adjustments for variances
     */
    public function approve(StockOpname $opname, int $approvedBy): void
    {
        if ($opname->status !== 'submitted') {
            throw new \Exception('Hanya opname dengan status submitted yang dapat diapprove');
        }

        DB::beginTransaction();
        try {
            // Create stock adjustments for items with variance
            $itemsWithVariance = $opname->items()
                ->where('variance', '!=', 0)
                ->with('item')
                ->get();

            foreach ($itemsWithVariance as $opnameItem) {
                // Update item stock quantity
                $stock = ItemStock::where('item_id', $opnameItem->item_id)
                    ->where('department_id', $opname->department_id)
                    ->first();

                if ($stock) {
                    $stock->quantity_on_hand = $opnameItem->physical_quantity;
                    $stock->save();
                }

                // Create adjustment record for audit trail
                $adjustmentType = $opnameItem->variance > 0 ? 'addition' : 'reduction';
                
                StockAdjustment::create([
                    'nomor_adjustment' => $this->generateAdjustmentNumber($opname->opname_date),
                    'tanggal_adjustment' => $opname->opname_date,
                    'tipe_adjustment' => $adjustmentType,
                    'item_id' => $opnameItem->item_id,
                    'quantity' => abs($opnameItem->variance),
                    'unit_price' => $opnameItem->unit_price,
                    'keterangan' => "Stock Opname Adjustment - {$opname->opname_number}\nPhysical: {$opnameItem->physical_quantity}, System: {$opnameItem->system_quantity}\n{$opnameItem->notes}",
                    'status' => 'approved', // Auto-approved from opname
                    'approved_by' => $approvedBy,
                    'approved_at' => now(),
                ]);
            }

            $opname->update([
                'status' => 'approved',
                'approved_by' => $approvedBy,
                'approved_at' => now(),
            ]);

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Reject opname
     */
    public function reject(StockOpname $opname, int $rejectedBy, string $reason): void
    {
        if ($opname->status !== 'submitted') {
            throw new \Exception('Hanya opname dengan status submitted yang dapat direject');
        }

        $opname->update([
            'status' => 'rejected',
            'rejection_reason' => $reason,
            'approved_by' => $rejectedBy,
            'approved_at' => now(),
        ]);
    }

    /**
     * Generate adjustment number for opname-based adjustments
     */
    private function generateAdjustmentNumber(string $tanggal): string
    {
        $date = \Carbon\Carbon::parse($tanggal);
        $year = $date->format('Y');
        $month = $date->format('m');
        
        $prefix = "ADJ-OPN/{$year}/{$month}/";
        
        $lastAdjustment = StockAdjustment::where('nomor_adjustment', 'like', $prefix . '%')
            ->orderBy('nomor_adjustment', 'desc')
            ->first();
        
        if ($lastAdjustment) {
            $lastNumber = (int) substr($lastAdjustment->nomor_adjustment, -4);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }
        
        return $prefix . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
    }
}
