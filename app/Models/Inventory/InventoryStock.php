<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryStock extends Model
{
    use HasFactory;

    protected $fillable = [
        'item_id',
        'location_id',
        'current_quantity',
        'available_quantity',
        'reserved_quantity',
        'average_cost',
        'total_value',
        'last_movement_at',
    ];

    protected $casts = [
        'current_quantity' => 'decimal:2',
        'available_quantity' => 'decimal:2',
        'reserved_quantity' => 'decimal:2',
        'average_cost' => 'decimal:4',
        'total_value' => 'decimal:2',
        'last_movement_at' => 'timestamp',
    ];

    // Relationships
    public function item(): BelongsTo
    {
        return $this->belongsTo(InventoryItem::class, 'item_id');
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(InventoryLocation::class, 'location_id');
    }

    public function lastUpdatedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'updated_by');
    }

    // Scopes
    public function scopeWithStock($query)
    {
        return $query->where('current_quantity', '>', 0);
    }

    public function scopeZeroStock($query)
    {
        return $query->where('current_quantity', '=', 0);
    }

    public function scopeNegativeStock($query)
    {
        return $query->where('current_quantity', '<', 0);
    }

    public function scopeBelowReorder($query)
    {
        return $query->whereHas('item', function ($itemQuery) {
            $itemQuery->whereRaw('current_quantity <= reorder_level');
        });
    }

    // Helper Methods
    public function updateValue(): void
    {
        $this->total_value = $this->current_quantity * $this->average_cost;
        $this->save();
    }

    public function adjustQuantity(float $quantity, string $reason = null, $userId = null): void
    {
        $this->current_quantity += $quantity;
        $this->available_quantity = $this->current_quantity - $this->reserved_quantity;
        $this->last_movement_at = now();
        
        $this->updateValue();
    }

    public function reserveStock(float $quantity): bool
    {
        if ($this->available_quantity >= $quantity) {
            $this->reserved_quantity += $quantity;
            $this->available_quantity -= $quantity;
            $this->save();
            return true;
        }
        return false;
    }

    public function releaseReservation(float $quantity): void
    {
        $this->reserved_quantity = max(0, $this->reserved_quantity - $quantity);
        $this->available_quantity = $this->current_quantity - $this->reserved_quantity;
        $this->save();
    }

    public function isInStock(): bool
    {
        return $this->current_quantity > 0;
    }

    public function isAvailable(float $quantity = null): bool
    {
        if ($quantity === null) {
            return $this->available_quantity > 0;
        }
        return $this->available_quantity >= $quantity;
    }
}
