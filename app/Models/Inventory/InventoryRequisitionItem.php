<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryRequisitionItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'requisition_id',
        'item_id',
        'requested_quantity',
        'approved_quantity',
        'unit_cost',
        'total_cost',
        'purpose',
        'notes',
        'status',
    ];

    protected $casts = [
        'requested_quantity' => 'decimal:2',
        'approved_quantity' => 'decimal:2',
        'unit_cost' => 'decimal:2',
        'total_cost' => 'decimal:2',
    ];

    // Relationships
    public function requisition(): BelongsTo
    {
        return $this->belongsTo(InventoryRequisition::class, 'requisition_id');
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(InventoryItem::class, 'item_id');
    }

    // Scopes
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    // Helper Methods
    public function approve(float $quantity = null): bool
    {
        if ($this->status === 'pending') {
            $this->approved_quantity = $quantity ?? $this->requested_quantity;
            $this->total_cost = $this->approved_quantity * $this->unit_cost;
            $this->status = 'approved';
            return $this->save();
        }
        return false;
    }

    public function reject(): bool
    {
        if ($this->status === 'pending') {
            $this->approved_quantity = 0;
            $this->total_cost = 0;
            $this->status = 'rejected';
            return $this->save();
        }
        return false;
    }

    public function isFullyApproved(): bool
    {
        return $this->approved_quantity >= $this->requested_quantity;
    }

    public function isPartiallyApproved(): bool
    {
        return $this->approved_quantity > 0 && $this->approved_quantity < $this->requested_quantity;
    }

    public function getApprovalPercentage(): float
    {
        if ($this->requested_quantity == 0) {
            return 0;
        }
        
        return ($this->approved_quantity / $this->requested_quantity) * 100;
    }

    public function getVarianceQuantity(): float
    {
        return $this->approved_quantity - $this->requested_quantity;
    }

    public function getVarianceCost(): float
    {
        return $this->getVarianceQuantity() * $this->unit_cost;
    }

    public function updateCost(): void
    {
        $this->total_cost = $this->approved_quantity * $this->unit_cost;
        $this->save();
    }

    public function getStatusClass(): string
    {
        return match($this->status) {
            'pending' => 'warning',
            'approved' => 'success', 
            'rejected' => 'danger',
            default => 'secondary'
        };
    }

    public function getFormattedStatus(): string
    {
        return ucwords($this->status);
    }
}
