<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InventoryBatch extends Model
{
    use HasFactory;

    protected $fillable = [
        'item_id',
        'batch_number',
        'expiry_date',
        'manufacture_date',
        'supplier_id',
        'purchase_cost',
        'selling_price',
        'initial_quantity',
        'current_quantity',
        'status',
        'notes',
    ];

    protected $casts = [
        'expiry_date' => 'date',
        'manufacture_date' => 'date',
        'purchase_cost' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'initial_quantity' => 'decimal:2',
        'current_quantity' => 'decimal:2',
    ];

    // Relationships
    public function item(): BelongsTo
    {
        return $this->belongsTo(InventoryItem::class, 'item_id');
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(InventorySupplier::class, 'supplier_id');
    }

    public function movements(): HasMany
    {
        return $this->hasMany(InventoryMovement::class, 'batch_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeExpired($query)
    {
        return $query->where('expiry_date', '<', now()->toDateString());
    }

    public function scopeExpiringSoon($query, $months = 6)
    {
        return $query->where('expiry_date', '<=', now()->addMonths($months)->toDateString())
                    ->where('expiry_date', '>=', now()->toDateString());
    }

    public function scopeWithStock($query)
    {
        return $query->where('current_quantity', '>', 0);
    }

    public function scopeZeroStock($query)
    {
        return $query->where('current_quantity', '=', 0);
    }

    // Helper Methods
    public function isExpired(): bool
    {
        return $this->expiry_date && $this->expiry_date < now()->toDateString();
    }

    public function isExpiringSoon($months = 6): bool
    {
        return $this->expiry_date && 
               $this->expiry_date <= now()->addMonths($months)->toDateString() &&
               $this->expiry_date >= now()->toDateString();
    }

    public function getDaysToExpiry(): ?int
    {
        if (!$this->expiry_date) {
            return null;
        }
        
        return now()->diffInDays($this->expiry_date, false);
    }

    public function hasStock(): bool
    {
        return $this->current_quantity > 0;
    }

    public function getUsedQuantity(): float
    {
        return $this->initial_quantity - $this->current_quantity;
    }

    public function getUsagePercentage(): float
    {
        if ($this->initial_quantity == 0) {
            return 0;
        }
        
        return ($this->getUsedQuantity() / $this->initial_quantity) * 100;
    }

    public function updateQuantity(float $quantity): void
    {
        $this->current_quantity += $quantity;
        
        if ($this->current_quantity <= 0) {
            $this->status = 'exhausted';
        }
        
        $this->save();
    }

    public function getStatusClass(): string
    {
        if ($this->isExpired()) {
            return 'danger';
        }
        
        if ($this->isExpiringSoon()) {
            return 'warning';
        }
        
        if (!$this->hasStock()) {
            return 'secondary';
        }
        
        return 'success';
    }

    public function getDisplayName(): string
    {
        return $this->batch_number . ' (Exp: ' . $this->expiry_date?->format('d/m/Y') . ')';
    }
}
