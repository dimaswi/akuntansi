<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryMovement extends Model
{
    use HasFactory;

    protected $fillable = [
        'movement_number',
        'item_id',
        'location_id',
        'movement_type',
        'reference_type',
        'reference_id',
        'quantity',
        'unit_cost',
        'total_cost',
        'batch_id',
        'expiry_date',
        'notes',
        'movement_date',
        'created_by',
        'approved_by',
        'approved_at',
        'status',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'unit_cost' => 'decimal:2',
        'total_cost' => 'decimal:2',
        'movement_date' => 'datetime',
        'expiry_date' => 'date',
        'approved_at' => 'datetime',
    ];

    // Relationships
    public function item(): BelongsTo
    {
        return $this->belongsTo(InventoryItem::class, 'item_id');
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(InventoryLocation::class, 'location_id');
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(InventoryBatch::class, 'batch_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'approved_by');
    }

    // Scopes
    public function scopeStockIn($query)
    {
        return $query->where('movement_type', 'stock_in');
    }

    public function scopeStockOut($query)
    {
        return $query->where('movement_type', 'stock_out');
    }

    public function scopeTransferIn($query)
    {
        return $query->where('movement_type', 'transfer_in');
    }

    public function scopeTransferOut($query)
    {
        return $query->where('movement_type', 'transfer_out');
    }

    public function scopeAdjustment($query)
    {
        return $query->whereIn('movement_type', ['adjustment_plus', 'adjustment_minus']);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('movement_date', [$startDate, $endDate]);
    }

    // Helper Methods
    public function isInbound(): bool
    {
        return in_array($this->movement_type, ['stock_in', 'transfer_in', 'adjustment_plus']);
    }

    public function isOutbound(): bool
    {
        return in_array($this->movement_type, ['stock_out', 'transfer_out', 'adjustment_minus']);
    }

    public function getSignedQuantity(): float
    {
        return $this->isInbound() ? $this->quantity : -$this->quantity;
    }

    public function approve($userId): bool
    {
        if ($this->status === 'pending') {
            $this->approved_by = $userId;
            $this->approved_at = now();
            $this->status = 'approved';
            return $this->save();
        }
        return false;
    }

    public function complete(): bool
    {
        if ($this->status === 'approved') {
            $this->status = 'completed';
            return $this->save();
        }
        return false;
    }

    public function cancel(): bool
    {
        if (in_array($this->status, ['pending', 'approved'])) {
            $this->status = 'cancelled';
            return $this->save();
        }
        return false;
    }

    public function getFormattedMovementType(): string
    {
        return match($this->movement_type) {
            'stock_in' => 'Stock In',
            'stock_out' => 'Stock Out',
            'transfer_in' => 'Transfer In',
            'transfer_out' => 'Transfer Out',
            'adjustment_plus' => 'Adjustment (+)',
            'adjustment_minus' => 'Adjustment (-)',
            default => ucwords(str_replace('_', ' ', $this->movement_type))
        };
    }
}
