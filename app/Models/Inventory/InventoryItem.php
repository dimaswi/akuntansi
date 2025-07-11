<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InventoryItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'code',
        'name',
        'description',
        'inventory_type',
        'unit_of_measure',
        'pack_size',
        'reorder_level',
        'max_level',
        'safety_stock',
        'standard_cost',
        'last_purchase_cost',
        'is_active',
        'requires_approval',
        'is_controlled_substance',
        'requires_prescription',
        'specifications',
    ];

    protected $casts = [
        'pack_size' => 'integer',
        'reorder_level' => 'decimal:2',
        'max_level' => 'decimal:2',
        'safety_stock' => 'decimal:2',
        'standard_cost' => 'decimal:2',
        'last_purchase_cost' => 'decimal:2',
        'is_active' => 'boolean',
        'requires_approval' => 'boolean',
        'is_controlled_substance' => 'boolean',
        'requires_prescription' => 'boolean',
        'specifications' => 'array',
    ];

    // Relationships
    public function category(): BelongsTo
    {
        return $this->belongsTo(InventoryCategory::class, 'category_id');
    }

    public function pharmacyDetails(): HasOne
    {
        return $this->hasOne(PharmacyItemDetail::class, 'inventory_item_id');
    }

    public function generalDetails(): HasOne
    {
        return $this->hasOne(GeneralItemDetail::class, 'inventory_item_id');
    }

    public function stocks(): HasMany
    {
        return $this->hasMany(InventoryStock::class, 'item_id');
    }

    public function movements(): HasMany
    {
        return $this->hasMany(InventoryMovement::class, 'item_id');
    }

    public function batches(): HasMany
    {
        return $this->hasMany(InventoryBatch::class, 'item_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopePharmacy($query)
    {
        return $query->where('inventory_type', 'pharmacy');
    }

    public function scopeGeneral($query)
    {
        return $query->where('inventory_type', 'general');
    }

    public function scopeControlledSubstance($query)
    {
        return $query->where('is_controlled_substance', true);
    }

    public function scopeRequiresApproval($query)
    {
        return $query->where('requires_approval', true);
    }

    public function scopeBelowReorderLevel($query)
    {
        return $query->whereHas('stocks', function ($stockQuery) {
            $stockQuery->whereRaw('current_quantity <= reorder_level');
        });
    }

    // Accessors
    public function getFullCodeAttribute(): string
    {
        return $this->category->code . '-' . $this->code;
    }

    public function getDisplayNameAttribute(): string
    {
        return $this->code . ' - ' . $this->name;
    }

    // Helper Methods
    public function isPharmacy(): bool
    {
        return $this->inventory_type === 'pharmacy';
    }

    public function isGeneral(): bool
    {
        return $this->inventory_type === 'general';
    }

    public function getCurrentStock($locationId = null): float
    {
        $query = $this->stocks();
        
        if ($locationId) {
            $query->where('location_id', $locationId);
        }
        
        return $query->sum('current_quantity');
    }

    public function getAvailableStock($locationId = null): float
    {
        $query = $this->stocks();
        
        if ($locationId) {
            $query->where('location_id', $locationId);
        }
        
        return $query->sum('available_quantity');
    }

    public function isBelowReorderLevel($locationId = null): bool
    {
        return $this->getCurrentStock($locationId) <= $this->reorder_level;
    }

    public function getStockValue($locationId = null): float
    {
        $query = $this->stocks();
        
        if ($locationId) {
            $query->where('location_id', $locationId);
        }
        
        return $query->sum('total_value');
    }

    public function getExpiringBatches($months = 6): \Illuminate\Database\Eloquent\Collection
    {
        return $this->batches()
            ->where('status', 'active')
            ->where('expiry_date', '<=', now()->addMonths($months))
            ->orderBy('expiry_date')
            ->get();
    }

    public function generateMovementNumber(string $type): string
    {
        $prefix = match($type) {
            'stock_in' => 'SI',
            'stock_out' => 'SO',
            'transfer_in' => 'TI',
            'transfer_out' => 'TO',
            'adjustment_plus' => 'AP',
            'adjustment_minus' => 'AM',
            default => 'MV'
        };

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
