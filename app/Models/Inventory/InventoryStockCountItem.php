<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryStockCountItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'stock_count_id',
        'item_id',
        'location_id',
        'batch_id',
        'system_quantity',
        'counted_quantity',
        'variance_quantity',
        'unit_cost',
        'variance_value',
        'reason_code',
        'notes',
        'counted_by',
        'counted_at',
        'verified_by',
        'verified_at',
        'status',
    ];

    protected $casts = [
        'system_quantity' => 'decimal:2',
        'counted_quantity' => 'decimal:2',
        'variance_quantity' => 'decimal:2',
        'unit_cost' => 'decimal:2',
        'variance_value' => 'decimal:2',
        'counted_at' => 'datetime',
        'verified_at' => 'datetime',
    ];

    // Relationships
    public function stockCount(): BelongsTo
    {
        return $this->belongsTo(InventoryStockCount::class, 'stock_count_id');
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(InventoryItem::class, 'item_id');
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(InventoryLocation::class, 'location_id');
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(InventoryBatch::class, 'batch_id');
    }

    public function countedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'counted_by');
    }

    public function verifiedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'verified_by');
    }

    // Scopes
    public function scopeCounted($query)
    {
        return $query->whereNotNull('counted_quantity');
    }

    public function scopeUncounted($query)
    {
        return $query->whereNull('counted_quantity');
    }

    public function scopeWithVariance($query)
    {
        return $query->where('variance_quantity', '!=', 0);
    }

    public function scopePositiveVariance($query)
    {
        return $query->where('variance_quantity', '>', 0);
    }

    public function scopeNegativeVariance($query)
    {
        return $query->where('variance_quantity', '<', 0);
    }

    public function scopeVerified($query)
    {
        return $query->whereNotNull('verified_at');
    }

    // Helper Methods
    public function recordCount(float $quantity, $userId): bool
    {
        if ($this->status === 'pending') {
            $this->counted_quantity = $quantity;
            $this->counted_by = $userId;
            $this->counted_at = now();
            $this->calculateVariance();
            $this->status = 'counted';
            return $this->save();
        }
        return false;
    }

    public function verify($userId): bool
    {
        if ($this->status === 'counted') {
            $this->verified_by = $userId;
            $this->verified_at = now();
            $this->status = 'verified';
            return $this->save();
        }
        return false;
    }

    public function calculateVariance(): void
    {
        if ($this->counted_quantity !== null) {
            $this->variance_quantity = $this->counted_quantity - $this->system_quantity;
            $this->variance_value = $this->variance_quantity * $this->unit_cost;
        }
    }

    public function applyAdjustment(): bool
    {
        if ($this->variance_quantity == 0 || $this->status !== 'verified') {
            return false;
        }

        // Find the stock record
        $stock = InventoryStock::where('item_id', $this->item_id)
            ->where('location_id', $this->location_id)
            ->first();

        if (!$stock) {
            return false;
        }

        // Create movement record
        $movementType = $this->variance_quantity > 0 ? 'adjustment_plus' : 'adjustment_minus';
        
        InventoryMovement::create([
            'movement_number' => $this->generateMovementNumber($movementType),
            'item_id' => $this->item_id,
            'location_id' => $this->location_id,
            'movement_type' => $movementType,
            'reference_type' => 'stock_count',
            'reference_id' => $this->stock_count_id,
            'quantity' => abs($this->variance_quantity),
            'unit_cost' => $this->unit_cost,
            'total_cost' => abs($this->variance_value),
            'batch_id' => $this->batch_id,
            'notes' => "Stock count adjustment - {$this->reason_code}",
            'movement_date' => now(),
            'created_by' => $this->verified_by,
            'status' => 'completed',
        ]);

        // Update stock
        $stock->current_quantity = $this->counted_quantity;
        $stock->available_quantity = $stock->current_quantity - $stock->reserved_quantity;
        $stock->updateValue();

        // Update batch if applicable
        if ($this->batch_id) {
            $batch = InventoryBatch::find($this->batch_id);
            if ($batch) {
                $batch->current_quantity = $this->counted_quantity;
                $batch->save();
            }
        }

        return true;
    }

    public function hasVariance(): bool
    {
        return $this->variance_quantity != 0;
    }

    public function isPositiveVariance(): bool
    {
        return $this->variance_quantity > 0;
    }

    public function isNegativeVariance(): bool
    {
        return $this->variance_quantity < 0;
    }

    public function getVariancePercentage(): float
    {
        if ($this->system_quantity == 0) {
            return $this->counted_quantity > 0 ? 100 : 0;
        }
        
        return ($this->variance_quantity / $this->system_quantity) * 100;
    }

    public function getStatusClass(): string
    {
        return match($this->status) {
            'pending' => 'warning',
            'counted' => 'info',
            'verified' => 'success',
            'adjusted' => 'dark',
            default => 'secondary'
        };
    }

    public function getVarianceClass(): string
    {
        if ($this->variance_quantity > 0) {
            return 'success';
        } elseif ($this->variance_quantity < 0) {
            return 'danger';
        }
        return 'secondary';
    }

    public function getFormattedStatus(): string
    {
        return ucwords($this->status);
    }

    public function isCounted(): bool
    {
        return $this->counted_quantity !== null;
    }

    public function isVerified(): bool
    {
        return $this->verified_at !== null;
    }

    public function canBeCounted(): bool
    {
        return $this->status === 'pending';
    }

    public function canBeVerified(): bool
    {
        return $this->status === 'counted';
    }

    private function generateMovementNumber(string $type): string
    {
        $prefix = $type === 'adjustment_plus' ? 'AP' : 'AM';
        $date = now();
        $year = $date->format('y');
        $month = $date->format('m');
        
        // Get last number for this type and month
        $lastMovement = InventoryMovement::where('movement_number', 'like', "{$prefix}/{$year}/{$month}/%")
            ->orderBy('movement_number', 'desc')
            ->first();

        $newNum = 1;
        if ($lastMovement) {
            $parts = explode('/', $lastMovement->movement_number);
            $newNum = intval(end($parts)) + 1;
        }

        return sprintf('%s/%s/%s/%04d', $prefix, $year, $month, $newNum);
    }
}
