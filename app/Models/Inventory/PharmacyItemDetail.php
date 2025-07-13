<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Model;

class PharmacyItemDetail extends Model
{
    protected $table = 'pharmacy_item_details';
    protected $fillable = [
        'item_id',
        'bpom_registration',
        'manufacturer',
        'generic_name',
        'strength',
        'dosage_form',
        'drug_classification',
        'atc_code',
        'contraindications',
        'drug_interactions',
        'storage_temp_min',
        'storage_temp_max',
        'minimum_expiry_months'
    ];

    protected $casts = [
        'drug_interactions' => 'json',
        'storage_temp_min' => 'decimal:2',
        'storage_temp_max' => 'decimal:2',
        'minimum_expiry_months' => 'integer',
    ];

    public function item()
    {
        return $this->belongsTo(Item::class, 'item_id');
    }
}
