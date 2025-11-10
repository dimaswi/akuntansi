<?php

namespace App\Models\Inventory;

use App\Models\User;
use App\Models\Akuntansi\Jurnal;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryTransaction extends Model
{
    protected $fillable = [
        'transaction_number',
        'transaction_date',
        'transaction_type',
        'warehouse_location',
        'item_id',
        'department_id',
        'from_department_id',
        'to_department_id',
        'quantity',
        'unit_cost',
        'total_cost',
        'reference_type',
        'reference_id',
        'balance_before',
        'balance_after',
        'jurnal_id',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'transaction_date' => 'date',
        'quantity' => 'decimal:3',
        'unit_cost' => 'decimal:2',
        'total_cost' => 'decimal:2',
        'balance_before' => 'decimal:3',
        'balance_after' => 'decimal:3',
    ];

    // Relations
    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function jurnal(): BelongsTo
    {
        return $this->belongsTo(Jurnal::class, 'jurnal_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function fromDepartment(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'from_department_id');
    }

    public function toDepartment(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'to_department_id');
    }

    // Scopes
    public function scopeByItem($query, $itemId)
    {
        return $query->where('item_id', $itemId);
    }

    public function scopeByDepartment($query, $departmentId)
    {
        return $query->where('department_id', $departmentId);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('transaction_type', $type);
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('transaction_date', [$startDate, $endDate]);
    }

    // Generate transaction number
    public static function generateTransactionNumber($type = 'INV'): string
    {
        $date = now();
        $year = $date->format('Y');
        $month = $date->format('m');
        
        $lastTransaction = static::whereYear('transaction_date', $year)
            ->whereMonth('transaction_date', $month)
            ->orderBy('transaction_number', 'desc')
            ->first();

        if ($lastTransaction) {
            $parts = explode('-', $lastTransaction->transaction_number);
            $lastNumber = intval(end($parts));
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return "{$type}-{$year}{$month}-" . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
    }

    // Helper methods
    public function isInbound(): bool
    {
        return in_array($this->transaction_type, ['purchase_receive', 'return_to_central', 'stock_receive']);
    }

    public function isOutbound(): bool
    {
        return in_array($this->transaction_type, ['stock_issue', 'disposal', 'requisition_issue']);
    }

    public function isCentral(): bool
    {
        return $this->warehouse_location === 'central';
    }

    public function isDepartment(): bool
    {
        return $this->warehouse_location === 'department';
    }
}
