<?php

namespace App\Models;

use App\Models\Inventory\InventoryLocation;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DepartmentInventoryTransfer extends Model
{
    use HasFactory;

    protected $fillable = [
        'transfer_number',
        'department_request_id',
        'from_department_id',
        'to_department_id',
        'from_location_id',
        'to_location_id',
        'approved_by',
        'transferred_by',
        'received_by',
        'status',
        'notes',
        'rejection_reason',
        'approved_at',
        'transferred_at',
        'received_at'
    ];

    protected $casts = [
        'approved_at' => 'datetime',
        'transferred_at' => 'datetime',
        'received_at' => 'datetime'
    ];

    // Status constants
    const STATUS_PENDING = 'pending';
    const STATUS_APPROVED = 'approved';
    const STATUS_IN_TRANSIT = 'in_transit';
    const STATUS_COMPLETED = 'completed';
    const STATUS_CANCELLED = 'cancelled';

    // Relationships
    public function departmentRequest(): BelongsTo
    {
        return $this->belongsTo(DepartmentRequest::class, 'department_request_id');
    }

    public function fromDepartment(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'from_department_id');
    }

    public function toDepartment(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'to_department_id');
    }

    public function fromLocation(): BelongsTo
    {
        return $this->belongsTo(InventoryLocation::class, 'from_location_id');
    }

    public function toLocation(): BelongsTo
    {
        return $this->belongsTo(InventoryLocation::class, 'to_location_id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function transferredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'transferred_by');
    }

    public function receivedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(DepartmentInventoryTransferItem::class, 'transfer_id');
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

    public function scopeCompleted($query)
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }

    // Helper methods
    public function canBeApproved(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function canBeTransferred(): bool
    {
        return $this->status === self::STATUS_APPROVED;
    }

    public function canBeReceived(): bool
    {
        return $this->status === self::STATUS_IN_TRANSIT;
    }

    public function canBeCancelled(): bool
    {
        return in_array($this->status, [self::STATUS_PENDING, self::STATUS_APPROVED]);
    }

    // Auto generate transfer number
    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            if (empty($model->transfer_number)) {
                $model->transfer_number = static::generateTransferNumber();
            }
        });
    }

    private static function generateTransferNumber(): string
    {
        $prefix = 'TRF';
        $date = now()->format('Ym');
        
        $lastTransfer = static::where('transfer_number', 'like', "{$prefix}-{$date}-%")
            ->orderBy('transfer_number', 'desc')
            ->first();
        
        if ($lastTransfer) {
            $lastNumber = (int) substr($lastTransfer->transfer_number, -4);
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = 1;
        }
        
        return sprintf('%s-%s-%04d', $prefix, $date, $nextNumber);
    }
}
