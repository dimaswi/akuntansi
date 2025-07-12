<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DepartmentInventoryLocation extends Model
{
    use HasFactory;

    protected $fillable = [
        'department_id',
        'inventory_item_id',
        'current_stock',
        'minimum_stock',
        'maximum_stock',
        'reserved_stock',
        'average_cost',
        'location_code',
        'rack_position',
        'notes',
        'is_active'
    ];

    protected $casts = [
        'current_stock' => 'decimal:2',
        'minimum_stock' => 'decimal:2',
        'maximum_stock' => 'decimal:2',
        'reserved_stock' => 'decimal:2',
        'average_cost' => 'decimal:2',
        'is_active' => 'boolean'
    ];

    // Relationships
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function inventoryItem(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Inventory\InventoryItem::class);
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(DepartmentStockMovement::class, 'inventory_item_id', 'inventory_item_id')
                    ->where('department_id', $this->department_id);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeWithStock($query)
    {
        return $query->where('current_stock', '>', 0);
    }

    public function scopeLowStock($query)
    {
        return $query->whereColumn('current_stock', '<=', 'minimum_stock');
    }

    public function scopeOverStock($query)
    {
        return $query->whereColumn('current_stock', '>', 'maximum_stock');
    }

    public function scopeByDepartment($query, $departmentId)
    {
        return $query->where('department_id', $departmentId);
    }

    // Helper methods
    public function getAvailableStock()
    {
        return $this->current_stock - $this->reserved_stock;
    }

    public function isLowStock(): bool
    {
        return $this->current_stock <= $this->minimum_stock;
    }

    public function isOverStock(): bool
    {
        return $this->current_stock > $this->maximum_stock;
    }

    public function canFulfillQuantity($quantity): bool
    {
        return $this->getAvailableStock() >= $quantity;
    }

    public function updateStock($quantity, $type = 'adjustment', $notes = null)
    {
        $previousStock = $this->current_stock;
        $this->current_stock += $quantity;
        $this->save();

        // Create stock movement record
        DepartmentStockMovement::create([
            'movement_number' => $this->generateMovementNumber(),
            'department_id' => $this->department_id,
            'inventory_item_id' => $this->inventory_item_id,
            'movement_type' => $type,
            'quantity_before' => $previousStock,
            'quantity_change' => $quantity,
            'quantity_after' => $this->current_stock,
            'unit_cost' => $this->average_cost,
            'total_cost' => abs($quantity) * $this->average_cost,
            'notes' => $notes,
            'created_by' => auth()->id()
        ]);

        return $this;
    }

    public function reserveStock($quantity)
    {
        if (!$this->canFulfillQuantity($quantity)) {
            throw new \Exception('Insufficient available stock');
        }

        $this->reserved_stock += $quantity;
        $this->save();

        return $this;
    }

    public function releaseReservedStock($quantity)
    {
        $this->reserved_stock = max(0, $this->reserved_stock - $quantity);
        $this->save();

        return $this;
    }

    private function generateMovementNumber(): string
    {
        $prefix = 'MOV';
        $date = now()->format('Ymd');
        $count = DepartmentStockMovement::whereDate('created_at', now())->count() + 1;
        
        return $prefix . $date . str_pad($count, 4, '0', STR_PAD_LEFT);
    }
}
