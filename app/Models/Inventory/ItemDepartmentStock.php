<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ItemDepartmentStock extends Model
{
    use HasFactory;

    protected $table = 'item_department_stocks';

    protected $fillable = [
        'item_id',
        'department_id',
        'current_stock',
        'reserved_stock',
        'available_stock',
        'minimum_stock',
        'maximum_stock',
    ];

    protected $casts = [
        'current_stock' => 'decimal:2',
        'reserved_stock' => 'decimal:2',
        'available_stock' => 'decimal:2',
        'minimum_stock' => 'decimal:2',
        'maximum_stock' => 'decimal:2',
    ];

    // Relations
    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    // Scopes
    public function scopeForDepartment($query, $departmentId)
    {
        return $query->where('department_id', $departmentId);
    }

    public function scopeForItem($query, $itemId)
    {
        return $query->where('item_id', $itemId);
    }

    public function scopeLowStock($query)
    {
        return $query->whereRaw('current_stock <= minimum_stock');
    }

    public function scopeAvailable($query)
    {
        return $query->where('available_stock', '>', 0);
    }

    // Helper Methods
    public function updateAvailableStock()
    {
        $this->available_stock = $this->current_stock - $this->reserved_stock;
        $this->save();
    }

    public function reserveStock($quantity)
    {
        if ($this->available_stock >= $quantity) {
            $this->reserved_stock += $quantity;
            $this->updateAvailableStock();
            return true;
        }
        return false;
    }

    public function releaseReservedStock($quantity)
    {
        $this->reserved_stock = max(0, $this->reserved_stock - $quantity);
        $this->updateAvailableStock();
    }

    public function addStock($quantity)
    {
        $this->current_stock += $quantity;
        $this->updateAvailableStock();
    }

    public function reduceStock($quantity)
    {
        if ($this->available_stock >= $quantity) {
            $this->current_stock -= $quantity;
            $this->updateAvailableStock();
            return true;
        }
        return false;
    }

    public function isLowStock(): bool
    {
        return $this->current_stock <= $this->minimum_stock;
    }

    public function isOverStock(): bool
    {
        return $this->current_stock > $this->maximum_stock;
    }

    public function getStockStatusAttribute(): string
    {
        if ($this->isLowStock()) {
            return 'low';
        } elseif ($this->isOverStock()) {
            return 'over';
        }
        return 'normal';
    }
}
