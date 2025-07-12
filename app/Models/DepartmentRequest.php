<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DepartmentRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'request_number',
        'department_id',
        'request_type',
        'target_department_id',
        'requested_by',
        'request_date',
        'needed_date',
        'priority',
        'status',
        'purpose',
        'justification',
        'notes',
        'total_estimated_cost',
        'approved_budget',
        'approved_by',
        'approved_at',
        'approval_notes',
        'fulfilled_by',
        'fulfilled_at',
        'actual_cost'
    ];

    protected $casts = [
        'request_date' => 'date',
        'needed_date' => 'date',
        'approved_at' => 'datetime',
        'fulfilled_at' => 'datetime',
        'total_estimated_cost' => 'decimal:2',
        'approved_budget' => 'decimal:2',
        'actual_cost' => 'decimal:2'
    ];

    // Status constants
    const STATUS_DRAFT = 'draft';
    const STATUS_SUBMITTED = 'submitted';
    const STATUS_APPROVED = 'approved';
    const STATUS_REJECTED = 'rejected';
    const STATUS_PARTIALLY_FULFILLED = 'partially_fulfilled';
    const STATUS_FULFILLED = 'fulfilled';
    const STATUS_CANCELLED = 'cancelled';

    // Priority constants
    const PRIORITY_LOW = 'low';
    const PRIORITY_NORMAL = 'normal';
    const PRIORITY_HIGH = 'high';
    const PRIORITY_URGENT = 'urgent';

    // Request type constants
    const TYPE_PROCUREMENT = 'procurement';
    const TYPE_TRANSFER = 'transfer';

    // Relationships
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function targetDepartment(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'target_department_id');
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function fulfilledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'fulfilled_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(DepartmentRequestItem::class, 'request_id');
    }

    // Scopes
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByPriority($query, $priority)
    {
        return $query->where('priority', $priority);
    }

    public function scopeByDepartment($query, $departmentId)
    {
        return $query->where('department_id', $departmentId);
    }

    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_SUBMITTED);
    }

    public function scopeApproved($query)
    {
        return $query->where('status', self::STATUS_APPROVED);
    }

    public function scopeUrgent($query)
    {
        return $query->where('priority', self::PRIORITY_URGENT);
    }

    // Accessors
    public function getStatusLabelAttribute(): string
    {
        return match($this->status) {
            self::STATUS_DRAFT => 'Draft',
            self::STATUS_SUBMITTED => 'Menunggu Persetujuan',
            self::STATUS_APPROVED => 'Disetujui',
            self::STATUS_REJECTED => 'Ditolak',
            self::STATUS_PARTIALLY_FULFILLED => 'Sebagian Dipenuhi',
            self::STATUS_FULFILLED => 'Dipenuhi',
            self::STATUS_CANCELLED => 'Dibatalkan',
            default => ucfirst($this->status)
        };
    }

    public function getPriorityLabelAttribute(): string
    {
        return match($this->priority) {
            self::PRIORITY_LOW => 'Rendah',
            self::PRIORITY_NORMAL => 'Normal',
            self::PRIORITY_HIGH => 'Tinggi',
            self::PRIORITY_URGENT => 'Mendesak',
            default => ucfirst($this->priority)
        };
    }

    public function getPriorityColorAttribute(): string
    {
        return match($this->priority) {
            self::PRIORITY_LOW => 'text-gray-600 bg-gray-100',
            self::PRIORITY_NORMAL => 'text-blue-600 bg-blue-100',
            self::PRIORITY_HIGH => 'text-orange-600 bg-orange-100',
            self::PRIORITY_URGENT => 'text-red-600 bg-red-100',
            default => 'text-gray-600 bg-gray-100'
        };
    }

    public function getStatusColorAttribute(): string
    {
        return match($this->status) {
            self::STATUS_DRAFT => 'text-gray-600 bg-gray-100',
            self::STATUS_SUBMITTED => 'text-yellow-600 bg-yellow-100',
            self::STATUS_APPROVED => 'text-green-600 bg-green-100',
            self::STATUS_REJECTED => 'text-red-600 bg-red-100',
            self::STATUS_PARTIALLY_FULFILLED => 'text-blue-600 bg-blue-100',
            self::STATUS_FULFILLED => 'text-purple-600 bg-purple-100',
            self::STATUS_CANCELLED => 'text-gray-600 bg-gray-100',
            default => 'text-gray-600 bg-gray-100'
        };
    }

    // Helper methods
    public function canBeEdited(): bool
    {
        return in_array($this->status, [self::STATUS_DRAFT]);
    }

    public function canBeSubmitted(): bool
    {
        return $this->status === self::STATUS_DRAFT && $this->items()->count() > 0;
    }

    public function canBeApproved(): bool
    {
        return $this->status === self::STATUS_SUBMITTED;
    }

    public function canBeFulfilled(): bool
    {
        return $this->status === self::STATUS_APPROVED;
    }

    public function canBeCancelled(): bool
    {
        return in_array($this->status, [self::STATUS_DRAFT, self::STATUS_SUBMITTED]);
    }

    public function updateTotalCost(): void
    {
        $this->total_estimated_cost = $this->items()->sum('estimated_total_cost');
        $this->save();
    }

    // Auto generate request number
    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            if (empty($model->request_number)) {
                $model->request_number = static::generateRequestNumber();
            }
        });
    }

    public static function generateRequestNumber(): string
    {
        $date = now()->format('Ym');
        $lastRequest = static::where('request_number', 'like', "REQ-{$date}%")
            ->orderBy('request_number', 'desc')
            ->first();
            
        if ($lastRequest) {
            $lastNumber = intval(substr($lastRequest->request_number, -4));
            $newNumber = str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
        } else {
            $newNumber = '0001';
        }
        
        return "REQ-{$date}-{$newNumber}";
    }
}
