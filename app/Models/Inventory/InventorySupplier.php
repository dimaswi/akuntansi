<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InventorySupplier extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'contact_person',
        'email',
        'phone',
        'address',
        'tax_id',
        'supplier_type',
        'pbf_license_number',
        'cold_chain_capable',
        'narcotic_license',
        'payment_terms_days',
        'credit_limit',
        'is_active',
        'notes',
    ];

    protected $casts = [
        'credit_limit' => 'decimal:2',
        'is_active' => 'boolean',
        'cold_chain_capable' => 'boolean',
        'narcotic_license' => 'boolean',
        'payment_terms_days' => 'integer',
    ];

    // Relationships
    public function batches(): HasMany
    {
        return $this->hasMany(InventoryBatch::class, 'supplier_id');
    }

    public function requisitions(): HasMany
    {
        return $this->hasMany(InventoryRequisition::class, 'supplier_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopePharmacy($query)
    {
        return $query->whereIn('supplier_type', ['pharmacy', 'both']);
    }

    public function scopeGeneral($query)
    {
        return $query->whereIn('supplier_type', ['general', 'both']);
    }

    public function scopeColdChain($query)
    {
        return $query->where('cold_chain_capable', true);
    }

    public function scopeNarcoticLicense($query)
    {
        return $query->where('narcotic_license', true);
    }

    // Helper Methods
    public function getDisplayNameAttribute(): string
    {
        return $this->code . ' - ' . $this->name;
    }

    public function getPaymentTermsAttribute(): string
    {
        return $this->payment_terms_days . ' days';
    }

    public function getTotalPurchases(): float
    {
        return $this->batches()->sum('purchase_cost');
    }

    public function getActiveBatchesCount(): int
    {
        return $this->batches()->where('status', 'active')->count();
    }

    public function hasOutstandingRequisitions(): bool
    {
        return $this->requisitions()
            ->whereIn('status', ['pending', 'approved', 'in_progress'])
            ->exists();
    }

    public function canSupplyPharmacy(): bool
    {
        return in_array($this->supplier_type, ['pharmacy', 'both']);
    }

    public function canSupplyGeneral(): bool
    {
        return in_array($this->supplier_type, ['general', 'both']);
    }

    public function hasNarcoticLicense(): bool
    {
        return $this->narcotic_license;
    }
}
