<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    protected $table = 'departments';
    protected $fillable = [
        'code', 'name', 'level', 'parent_id', 'is_active'
    ];

    public function parent()
    {
        return $this->belongsTo(Department::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Department::class, 'parent_id');
    }

    public function items()
    {
        return $this->hasMany(Item::class, 'department_id');
    }

    // Relasi dengan stock departemen
    public function itemStocks()
    {
        return $this->hasMany(ItemDepartmentStock::class);
    }

    public function stocksWithItems()
    {
        return $this->itemStocks()->with('item');
    }

    public function lowStockItems()
    {
        return $this->itemStocks()->lowStock()->with('item');
    }

    // Helper method untuk cek apakah departemen adalah logistics
    public function isLogistics(): bool
    {
        return strtolower($this->name) === 'logistics' || 
               strtolower($this->name) === 'logistik' || 
               strtolower($this->code) === 'log' ||
               strtolower($this->code) === 'logs';
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
