<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryLocation extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'description',
        'location_type',
        'parent_location_id',
        'department_id',
        'is_active',
        'contact_person',
        'phone',
        'address',
        'is_main_warehouse',
        'storage_capabilities',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_main_warehouse' => 'boolean',
        'storage_capabilities' => 'array',
    ];

    // Relationships
    public function department(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Department::class);
    }

    public function parentLocation(): BelongsTo
    {
        return $this->belongsTo(InventoryLocation::class, 'parent_location_id');
    }

    public function childLocations()
    {
        return $this->hasMany(InventoryLocation::class, 'parent_location_id');
    }

    public function stocks()
    {
        return $this->hasMany(InventoryStock::class, 'location_id');
    }

    public function movements()
    {
        return $this->hasMany(InventoryMovement::class, 'location_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeWarehouse($query)
    {
        return $query->where('location_type', 'warehouse');
    }

    public function scopePharmacy($query)
    {
        return $query->where('location_type', 'pharmacy');
    }

    public function scopeDepartment($query)
    {
        return $query->where('location_type', 'department');
    }

    // Helper Methods
    public function getDisplayNameAttribute(): string
    {
        return $this->code . ' - ' . $this->name;
    }

    public function getTotalStockValue(): float
    {
        return $this->stocks()->sum('total_value');
    }

    public function getItemCount(): int
    {
        return $this->stocks()->distinct('item_id')->count();
    }
}
