<?php

namespace App\Models;

use App\Models\Inventory\InventoryItem;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DepartmentInventoryTransferItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'transfer_id',
        'department_request_item_id',
        'inventory_item_id',
        'quantity_requested',
        'quantity_approved',
        'quantity_transferred',
        'quantity_received',
        'unit_cost',
        'total_cost',
        'batch_number',
        'expiry_date',
        'notes',
        'status'
    ];

    protected $casts = [
        'quantity_requested' => 'decimal:2',
        'quantity_approved' => 'decimal:2',
        'quantity_transferred' => 'decimal:2',
        'quantity_received' => 'decimal:2',
        'unit_cost' => 'decimal:2',
        'total_cost' => 'decimal:2',
        'expiry_date' => 'date'
    ];

    // Status constants
    const STATUS_PENDING = 'pending';
    const STATUS_APPROVED = 'approved';
    const STATUS_TRANSFERRED = 'transferred';
    const STATUS_RECEIVED = 'received';
    const STATUS_CANCELLED = 'cancelled';

    // Relationships
    public function transfer(): BelongsTo
    {
        return $this->belongsTo(DepartmentInventoryTransfer::class, 'transfer_id');
    }

    public function departmentRequestItem(): BelongsTo
    {
        return $this->belongsTo(DepartmentRequestItem::class, 'department_request_item_id');
    }

    public function inventoryItem(): BelongsTo
    {
        return $this->belongsTo(InventoryItem::class, 'inventory_item_id');
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeApproved($query)
    {
        return $query->where('status', self::STATUS_APPROVED);
    }

    public function scopeTransferred($query)
    {
        return $query->where('status', self::STATUS_TRANSFERRED);
    }

    public function scopeReceived($query)
    {
        return $query->where('status', self::STATUS_RECEIVED);
    }

    // Helper methods
    public function isFullyTransferred(): bool
    {
        return $this->quantity_transferred >= $this->quantity_approved;
    }

    public function isFullyReceived(): bool
    {
        return $this->quantity_received >= $this->quantity_transferred;
    }
}
