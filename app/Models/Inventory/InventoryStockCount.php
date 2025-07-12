<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InventoryStockCount extends Model
{
    use HasFactory;

    protected $fillable = [
        'count_number',
        'location_id',
        'count_date',
        'count_type',
        'initiated_by',
        'supervised_by',
        'notes',
        'total_items_counted',
        'total_variance_value',
        'status',
        'approved_by',
        'approved_at',
        'finalized_by',
        'finalized_at',
    ];

    protected $casts = [
        'count_date' => 'datetime',
        'total_variance_value' => 'decimal:2',
        'approved_at' => 'datetime',
        'finalized_at' => 'datetime',
    ];

    // Relationships
    public function location(): BelongsTo
    {
        return $this->belongsTo(InventoryLocation::class, 'location_id');
    }

    public function initiatedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'initiated_by');
    }

    public function supervisedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'supervised_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'approved_by');
    }

    public function finalizedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'finalized_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(InventoryStockCountItem::class, 'stock_count_id');
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeInProgress($query)
    {
        return $query->where('status', 'in_progress');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeFinalized($query)
    {
        return $query->where('status', 'finalized');
    }

    public function scopeCyclic($query)
    {
        return $query->where('count_type', 'cyclic');
    }

    public function scopeAnnual($query)
    {
        return $query->where('count_type', 'annual');
    }

    public function scopeSpot($query)
    {
        return $query->where('count_type', 'spot');
    }

    // Helper Methods
    public function start(): bool
    {
        if ($this->status === 'pending') {
            $this->status = 'in_progress';
            return $this->save();
        }
        return false;
    }

    public function complete(): bool
    {
        if ($this->status === 'in_progress') {
            $this->calculateTotals();
            $this->status = 'completed';
            return $this->save();
        }
        return false;
    }

    public function approve($userId): bool
    {
        if ($this->status === 'completed') {
            $this->approved_by = $userId;
            $this->approved_at = now();
            $this->status = 'approved';
            return $this->save();
        }
        return false;
    }

    public function finalize($userId): bool
    {
        if ($this->status === 'approved') {
            $this->finalizedBy = $userId;
            $this->finalized_at = now();
            $this->status = 'finalized';
            
            // Apply all adjustments
            $this->applyAdjustments();
            
            return $this->save();
        }
        return false;
    }

    public function calculateTotals(): void
    {
        $this->total_items_counted = $this->items()->count();
        $this->total_variance_value = $this->items()->sum('variance_value');
        $this->save();
    }

    public function applyAdjustments(): void
    {
        foreach ($this->items()->whereNotNull('variance_quantity')->get() as $item) {
            if ($item->variance_quantity != 0) {
                $item->applyAdjustment();
            }
        }
    }

    public function getPositiveVarianceCount(): int
    {
        return $this->items()->where('variance_quantity', '>', 0)->count();
    }

    public function getNegativeVarianceCount(): int
    {
        return $this->items()->where('variance_quantity', '<', 0)->count();
    }

    public function getNoVarianceCount(): int
    {
        return $this->items()->where('variance_quantity', '=', 0)->count();
    }

    public function getPositiveVarianceValue(): float
    {
        return $this->items()->where('variance_quantity', '>', 0)->sum('variance_value');
    }

    public function getNegativeVarianceValue(): float
    {
        return $this->items()->where('variance_quantity', '<', 0)->sum('variance_value');
    }

    public function hasVariances(): bool
    {
        return $this->items()->where('variance_quantity', '!=', 0)->exists();
    }

    public function getCompletionPercentage(): float
    {
        $totalItems = $this->items()->count();
        
        if ($totalItems == 0) {
            return 0;
        }
        
        $countedItems = $this->items()->whereNotNull('counted_quantity')->count();
        
        return ($countedItems / $totalItems) * 100;
    }

    public function getStatusClass(): string
    {
        return match($this->status) {
            'pending' => 'warning',
            'in_progress' => 'info',
            'completed' => 'primary',
            'approved' => 'success',
            'finalized' => 'dark',
            default => 'secondary'
        };
    }

    public function getFormattedStatus(): string
    {
        return ucwords(str_replace('_', ' ', $this->status));
    }

    public function getFormattedType(): string
    {
        return ucwords($this->count_type);
    }

    public function canBeModified(): bool
    {
        return in_array($this->status, ['pending', 'in_progress']);
    }

    public function canBeCompleted(): bool
    {
        return $this->status === 'in_progress' && $this->getCompletionPercentage() >= 100;
    }

    public function canBeApproved(): bool
    {
        return $this->status === 'completed';
    }

    public function canBeFinalized(): bool
    {
        return $this->status === 'approved';
    }
}
