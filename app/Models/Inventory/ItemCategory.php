<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Model;

class ItemCategory extends Model
{
    protected $table = 'item_categories';
    protected $fillable = [
        'code',
        'name',
        'description',
        'parent_id',
        'category_type',
        'is_active',
        'requires_batch_tracking',
        'requires_expiry_tracking',
        'storage_requirements'
    ];

    public function parent()
    {
        return $this->belongsTo(ItemCategory::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(ItemCategory::class, 'parent_id');
    }

    public function items()
    {
        return $this->hasMany(Item::class, 'category_id');
    }
}
