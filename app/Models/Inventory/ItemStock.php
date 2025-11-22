<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ItemStock extends Model
{
    protected $fillable = [
        'item_id',
        'department_id',
        'quantity_on_hand',
        'reserved_quantity',
        'available_quantity',
        'last_unit_cost',
        'average_unit_cost',
        'total_value',
        'last_updated_at',
    ];

    protected $casts = [
        'quantity_on_hand' => 'float',
        'reserved_quantity' => 'float',
        'available_quantity' => 'float',
        'last_unit_cost' => 'decimal:2',
        'average_unit_cost' => 'decimal:2',
        'total_value' => 'decimal:2',
        'last_updated_at' => 'datetime',
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
    public function scopeCentral($query)
    {
        return $query->whereNull('department_id');
    }

    public function scopeDepartment($query, $departmentId)
    {
        return $query->where('department_id', $departmentId);
    }

    public function scopeLowStock($query)
    {
        return $query->whereColumn('quantity_on_hand', '<', 'item.reorder_level');
    }

    // Helper methods
    public function isCentral(): bool
    {
        return $this->department_id === null;
    }

    public function addStock(float $quantity, float $unitCost = null): void
    {
        \Log::info('ItemStock::addStock called', [
            'item_id' => $this->item_id,
            'department_id' => $this->department_id,
            'quantity' => $quantity,
            'unitCost' => $unitCost,
            'before_quantity' => $this->quantity_on_hand,
            'before_avg_cost' => $this->average_unit_cost,
            'before_total_value' => $this->total_value,
        ]);
        
        $this->quantity_on_hand += $quantity;
        
        if ($unitCost !== null) {
            // Update weighted average cost
            $totalValue = ($this->quantity_on_hand - $quantity) * $this->average_unit_cost;
            $newValue = $quantity * $unitCost;
            $this->average_unit_cost = ($totalValue + $newValue) / $this->quantity_on_hand;
            
            $this->last_unit_cost = $unitCost;
        }
        
        $this->updateAvailableQuantity();
        $this->updateTotalValue();
        $this->last_updated_at = now();
        $this->save();
        
        \Log::info('ItemStock::addStock completed', [
            'item_id' => $this->item_id,
            'department_id' => $this->department_id,
            'after_quantity' => $this->quantity_on_hand,
            'after_avg_cost' => $this->average_unit_cost,
            'after_total_value' => $this->total_value,
        ]);
    }

    public function reduceStock(float $quantity): void
    {
        if ($this->available_quantity < $quantity) {
            throw new \Exception("Stok tidak mencukupi. Available: {$this->available_quantity}, Required: {$quantity}");
        }
        
        $this->quantity_on_hand -= $quantity;
        $this->updateAvailableQuantity();
        $this->updateTotalValue();
        $this->last_updated_at = now();
        $this->save();
    }

    public function reserveStock(float $quantity): void
    {
        if ($this->available_quantity < $quantity) {
            throw new \Exception("Stok tidak mencukupi untuk direserve. Available: {$this->available_quantity}, Required: {$quantity}");
        }
        
        $this->reserved_quantity += $quantity;
        $this->updateAvailableQuantity();
        $this->save();
    }

    public function releaseReservedStock(float $quantity): void
    {
        $this->reserved_quantity -= $quantity;
        if ($this->reserved_quantity < 0) {
            $this->reserved_quantity = 0;
        }
        
        $this->updateAvailableQuantity();
        $this->save();
    }

    protected function updateAvailableQuantity(): void
    {
        $this->available_quantity = $this->quantity_on_hand - $this->reserved_quantity;
        if ($this->available_quantity < 0) {
            $this->available_quantity = 0;
        }
    }

    protected function updateTotalValue(): void
    {
        $this->total_value = $this->quantity_on_hand * $this->average_unit_cost;
    }

    // Static helpers
    public static function getCentralStock($itemId): ?self
    {
        return static::where('item_id', $itemId)
            ->whereNull('department_id')
            ->first();
    }

    public static function getDepartmentStock($itemId, $departmentId): ?self
    {
        return static::where('item_id', $itemId)
            ->where('department_id', $departmentId)
            ->first();
    }

    public static function getOrCreateCentralStock($itemId): self
    {
        return static::firstOrCreate(
            ['item_id' => $itemId, 'department_id' => null],
            [
                'quantity_on_hand' => 0,
                'reserved_quantity' => 0,
                'available_quantity' => 0,
                'last_unit_cost' => 0,
                'average_unit_cost' => 0,
                'total_value' => 0,
            ]
        );
    }

    public static function getOrCreateDepartmentStock($itemId, $departmentId): self
    {
        return static::firstOrCreate(
            ['item_id' => $itemId, 'department_id' => $departmentId],
            [
                'quantity_on_hand' => 0,
                'reserved_quantity' => 0,
                'available_quantity' => 0,
                'last_unit_cost' => 0,
                'average_unit_cost' => 0,
                'total_value' => 0,
            ]
        );
    }
}
