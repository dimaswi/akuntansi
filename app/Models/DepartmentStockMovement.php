<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DepartmentStockMovement extends Model
{
    use HasFactory;

    protected $fillable = [
        'movement_number',
        'department_id',
        'inventory_item_id',
        'movement_type',
        'quantity_before',
        'quantity_change',
        'quantity_after',
        'unit_cost',
        'total_cost',
        'batch_number',
        'expiry_date',
        'reference_number',
        'notes',
        'created_by',
        'approved_by',
        'approved_at'
    ];

    protected $casts = [
        'quantity_before' => 'decimal:2',
        'quantity_change' => 'decimal:2',
        'quantity_after' => 'decimal:2',
        'unit_cost' => 'decimal:2',
        'total_cost' => 'decimal:2',
        'expiry_date' => 'date',
        'approved_at' => 'datetime'
    ];

    // Movement type constants
    const TYPE_STOCK_OPNAME = 'stock_opname';
    const TYPE_ADJUSTMENT = 'adjustment';
    const TYPE_TRANSFER_IN = 'transfer_in';
    const TYPE_TRANSFER_OUT = 'transfer_out';
    const TYPE_USAGE = 'usage';
    const TYPE_RETURN = 'return';
    const TYPE_DISPOSAL = 'disposal';

    // Relationships
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function inventoryItem(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Inventory\InventoryItem::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    // Scopes
    public function scopeByDepartment($query, $departmentId)
    {
        return $query->where('department_id', $departmentId);
    }

    public function scopeByMovementType($query, $type)
    {
        return $query->where('movement_type', $type);
    }

    public function scopeByItem($query, $itemId)
    {
        return $query->where('inventory_item_id', $itemId);
    }

    public function scopeApproved($query)
    {
        return $query->whereNotNull('approved_by');
    }

    public function scopePending($query)
    {
        return $query->whereNull('approved_by');
    }

    // Helper methods
    public function isApproved(): bool
    {
        return !is_null($this->approved_by);
    }

    public function isIncoming(): bool
    {
        return $this->quantity_change > 0;
    }

    public function isOutgoing(): bool
    {
        return $this->quantity_change < 0;
    }

    public function getMovementTypeLabel(): string
    {
        $labels = [
            self::TYPE_STOCK_OPNAME => 'Stok Opname',
            self::TYPE_ADJUSTMENT => 'Penyesuaian',
            self::TYPE_TRANSFER_IN => 'Transfer Masuk',
            self::TYPE_TRANSFER_OUT => 'Transfer Keluar',
            self::TYPE_USAGE => 'Pemakaian',
            self::TYPE_RETURN => 'Retur',
            self::TYPE_DISPOSAL => 'Disposal'
        ];

        return $labels[$this->movement_type] ?? $this->movement_type;
    }
}
