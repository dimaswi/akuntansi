<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Model;

class Item extends Model
{
    protected $table = 'items';
    protected $fillable = [
        'category_id',
        'department_id',
        'supplier_id',
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
        'specifications'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'requires_approval' => 'boolean',
        'is_controlled_substance' => 'boolean',
        'requires_prescription' => 'boolean',
        'specifications' => 'json',
        'pack_size' => 'integer',
        'reorder_level' => 'decimal:2',
        'max_level' => 'decimal:2',
        'safety_stock' => 'decimal:2',
        'standard_cost' => 'decimal:2',
        'last_purchase_cost' => 'decimal:2',
    ];

    public function category()
    {
        return $this->belongsTo(ItemCategory::class, 'category_id');
    }

    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class, 'supplier_id');
    }

    // Relasi ke detail farmasi dan umum
    public function pharmacyDetail()
    {
        return $this->hasOne(PharmacyItemDetail::class, 'item_id');
    }

    public function generalDetail()
    {
        return $this->hasOne(GeneralItemDetail::class, 'item_id');
    }

    // Relasi dengan stock per departemen
    public function departmentStocks()
    {
        return $this->hasMany(ItemDepartmentStock::class);
    }

    public function stockForDepartment($departmentId)
    {
        return $this->departmentStocks()->where('department_id', $departmentId)->first();
    }

    public function getAvailableStockForDepartment($departmentId)
    {
        $stock = $this->stockForDepartment($departmentId);
        return $stock ? $stock->available_stock : 0;
    }

    public function getCurrentStockForDepartment($departmentId)
    {
        $stock = $this->stockForDepartment($departmentId);
        return $stock ? $stock->current_stock : 0;
    }

    // Scope untuk filter aktif/nonaktif
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
    public function scopeInactive($query)
    {
        return $query->where('is_active', false);
    }
}
