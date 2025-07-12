<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GeneralItemDetail extends Model
{
    use HasFactory;

    protected $fillable = [
        'inventory_item_id',
        'is_consumable',
        'is_returnable',
        'requires_maintenance',
        'warranty_months',
        'usage_instructions',
        'department_restrictions',
    ];

    protected $casts = [
        'is_consumable' => 'boolean',
        'is_returnable' => 'boolean',
        'requires_maintenance' => 'boolean',
        'warranty_months' => 'integer',
        'department_restrictions' => 'array',
    ];

    // Relationships
    public function inventoryItem(): BelongsTo
    {
        return $this->belongsTo(InventoryItem::class, 'inventory_item_id');
    }

    // Helper Methods
    public function isConsumable(): bool
    {
        return $this->is_consumable;
    }

    public function isReturnable(): bool
    {
        return $this->is_returnable;
    }

    public function requiresMaintenance(): bool
    {
        return $this->requires_maintenance;
    }

    public function hasWarranty(): bool
    {
        return $this->warranty_months > 0;
    }

    public function getWarrantyDuration(): string
    {
        if (!$this->warranty_months) {
            return 'No warranty';
        }
        
        if ($this->warranty_months >= 12) {
            $years = intval($this->warranty_months / 12);
            $months = $this->warranty_months % 12;
            
            $duration = $years . ' year' . ($years > 1 ? 's' : '');
            if ($months > 0) {
                $duration .= ' ' . $months . ' month' . ($months > 1 ? 's' : '');
            }
            
            return $duration;
        }
        
        return $this->warranty_months . ' month' . ($this->warranty_months > 1 ? 's' : '');
    }

    public function getDepartmentRestrictions(): array
    {
        return $this->department_restrictions ?? [];
    }

    public function canBeUsedByDepartment(string $department): bool
    {
        $restrictions = $this->getDepartmentRestrictions();
        
        if (empty($restrictions)) {
            return true; // No restrictions means all departments can use
        }
        
        return in_array($department, $restrictions);
    }
}
