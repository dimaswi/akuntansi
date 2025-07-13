<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Model;

class GeneralItemDetail extends Model
{
    protected $table = 'general_item_details';
    protected $fillable = [
        'item_id',
        'is_consumable',
        'is_returnable',
        'requires_maintenance',
        'warranty_months',
        'usage_instructions',
        'department_restrictions'
    ];

    protected $casts = [
        'is_consumable' => 'boolean',
        'is_returnable' => 'boolean',
        'requires_maintenance' => 'boolean',
        'warranty_months' => 'integer',
        'department_restrictions' => 'json',
    ];

    public function item()
    {
        return $this->belongsTo(Item::class, 'item_id');
    }
}
