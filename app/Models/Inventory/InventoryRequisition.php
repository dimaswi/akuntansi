<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InventoryRequisition extends Model
{
    use HasFactory;

    protected $fillable = [
        'requisition_number',
        'department_id',
        'requested_by',
        'request_date',
        'required_date',
        'priority',
        'purpose',
        'notes',
        'total_estimated_cost',
        'supplier_id',
        'approved_by',
        'approved_at',
        'rejected_by',
        'rejected_at',
        'rejection_reason',
        'completed_by',
        'completed_at',
        'status',
    ];

    protected $casts = [
        'request_date' => 'datetime',
        'required_date' => 'datetime',
        'total_estimated_cost' => 'decimal:2',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    // Relationships
    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'requested_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'approved_by');
    }

    public function rejectedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'rejected_by');
    }

    public function completedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'completed_by');
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(InventorySupplier::class, 'supplier_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(InventoryRequisitionItem::class, 'requisition_id');
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeInProgress($query)
    {
        return $query->where('status', 'in_progress');
    }

    public function scopeHighPriority($query)
    {
        return $query->where('priority', 'high');
    }

    public function scopeOverdue($query)
    {
        return $query->where('required_date', '<', now())
                    ->whereIn('status', ['pending', 'approved', 'in_progress']);
    }

    // Helper Methods
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

    public function reject($userId, $reason): bool
    {
        if (in_array($this->status, ['pending', 'approved'])) {
            $this->rejected_by = $userId;
            $this->rejected_at = now();
            $this->rejection_reason = $reason;
            $this->status = 'rejected';
            return $this->save();
        }
        return false;
    }

    public function startProgress(): bool
    {
        if ($this->status === 'approved') {
            $this->status = 'in_progress';
            return $this->save();
        }
        return false;
    }

    public function complete($userId): bool
    {
        if ($this->status === 'in_progress') {
            $this->completed_by = $userId;
            $this->completed_at = now();
            $this->status = 'completed';
            return $this->save();
        }
        return false;
    }

    public function isOverdue(): bool
    {
        return $this->required_date < now() && 
               in_array($this->status, ['pending', 'approved', 'in_progress']);
    }

    public function getDaysUntilRequired(): int
    {
        return now()->diffInDays($this->required_date, false);
    }

    public function getPriorityClass(): string
    {
        return match($this->priority) {
            'high' => 'danger',
            'medium' => 'warning',
            'low' => 'info',
            default => 'secondary'
        };
    }

    public function getStatusClass(): string
    {
        return match($this->status) {
            'pending' => 'warning',
            'approved' => 'info',
            'in_progress' => 'primary',
            'completed' => 'success',
            'rejected' => 'danger',
            default => 'secondary'
        };
    }

    public function getTotalItemsCount(): int
    {
        return $this->items()->sum('requested_quantity');
    }

    public function getFormattedStatus(): string
    {
        return ucwords(str_replace('_', ' ', $this->status));
    }

    public function canBeModified(): bool
    {
        return $this->status === 'pending';
    }

    public function canBeApproved(): bool
    {
        return $this->status === 'pending';
    }

    public function canBeRejected(): bool
    {
        return in_array($this->status, ['pending', 'approved']);
    }
}
