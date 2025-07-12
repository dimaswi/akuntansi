<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PharmacyItemDetail extends Model
{
    use HasFactory;

    protected $fillable = [
        'inventory_item_id',
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
        'minimum_expiry_months',
    ];

    protected $casts = [
        'drug_interactions' => 'array',
        'storage_temp_min' => 'decimal:2',
        'storage_temp_max' => 'decimal:2',
        'minimum_expiry_months' => 'integer',
    ];

    // Relationships
    public function inventoryItem(): BelongsTo
    {
        return $this->belongsTo(InventoryItem::class, 'inventory_item_id');
    }

    // Helper Methods
    public function getFullNameAttribute(): string
    {
        $parts = array_filter([
            $this->generic_name,
            $this->strength,
            $this->dosage_form
        ]);
        
        return implode(' ', $parts);
    }

    public function isControlledSubstance(): bool
    {
        return in_array($this->drug_classification, ['narkotika', 'psikotropika']);
    }

    public function getControlledCategory(): ?string
    {
        return match($this->drug_classification) {
            'narkotika' => 'Narcotic',
            'psikotropika' => 'Psychotropic',
            'keras' => 'Prescription Only',
            'bebas_terbatas' => 'Limited OTC',
            'bebas' => 'OTC',
            default => null
        };
    }

    public function getStorageRequirements(): string
    {
        $requirements = [];
        
        if ($this->storage_temp_min || $this->storage_temp_max) {
            $temp = '';
            if ($this->storage_temp_min && $this->storage_temp_max) {
                $temp = "Store at {$this->storage_temp_min}°C - {$this->storage_temp_max}°C";
            } elseif ($this->storage_temp_max) {
                $temp = "Store below {$this->storage_temp_max}°C";
            } elseif ($this->storage_temp_min) {
                $temp = "Store above {$this->storage_temp_min}°C";
            }
            $requirements[] = $temp;
        }
        
        if ($this->isControlledSubstance()) {
            $requirements[] = 'Secure storage required';
        }
        
        return implode(', ', array_filter($requirements));
    }

    public function hasMinimumExpiry(\Carbon\Carbon $expiryDate): bool
    {
        $minimumDate = now()->addMonths($this->minimum_expiry_months);
        return $expiryDate->gte($minimumDate);
    }
}
