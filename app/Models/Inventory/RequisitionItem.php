<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class RequisitionItem extends Model
{
    use HasFactory;

    protected $table = 'requisition_items';

    protected $fillable = [
        'requisition_id',
        'item_id',
        'quantity_requested',
        'quantity_approved',
        'estimated_unit_cost',
        'estimated_total_cost',
        'purpose',
        'notes',
        'approval_notes',
        'status',
    ];

    protected $casts = [
        'quantity_requested' => 'decimal:2',
        'quantity_approved' => 'decimal:2',
        'estimated_unit_cost' => 'decimal:2',
        'estimated_total_cost' => 'decimal:2',
    ];

    // Relations
    public function requisition(): BelongsTo
    {
        return $this->belongsTo(Requisition::class);
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    // Scopes
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    // Accessors & Mutators
    public function getStatusLabelAttribute(): string
    {
        return match($this->status) {
            'pending' => 'Pending',
            'approved' => 'Approved',
            'rejected' => 'Rejected',
            'partial' => 'Partial',
            default => 'Unknown',
        };
    }

    // Helper Methods
    public function getTotalEstimatedCost(): float
    {
        return $this->quantity_requested * ($this->estimated_unit_cost ?? 0);
    }

    public function getApprovedTotalCost(): float
    {
        return $this->quantity_approved * ($this->estimated_unit_cost ?? 0);
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isPartial(): bool
    {
        return $this->status === 'partial';
    }
}
