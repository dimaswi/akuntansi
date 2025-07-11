<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;
use App\Events\ApprovalRequested;
use App\Events\ApprovalApproved;
use App\Events\ApprovalRejected;

class Approval extends Model
{
    use HasFactory;

    protected $fillable = [
        'approvable_type',
        'approvable_id',
        'approval_type',
        'status',
        'amount',
        'approval_rules',
        'approval_level',
        'requires_approval',
        'expires_at',
        'requested_by',
        'approved_by',
        'approved_at',
        'request_notes',
        'approval_notes',
        'rejection_reason',
        'escalated_to',
        'escalated_at',
    ];

    protected $casts = [
        'approval_rules' => 'array',
        'requires_approval' => 'boolean',
        'expires_at' => 'datetime',
        'approved_at' => 'datetime',
        'escalated_at' => 'datetime',
        'amount' => 'decimal:2',
    ];

    public function approvable(): MorphTo
    {
        return $this->morphTo();
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function escalatedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'escalated_to');
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

    public function scopeExpired($query)
    {
        return $query->where('expires_at', '<', now())
                    ->where('status', 'pending');
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where(function ($q) use ($userId) {
            $q->where('requested_by', $userId)
              ->orWhere('approved_by', $userId)
              ->orWhere('escalated_to', $userId);
        });
    }

    // Helper methods
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }

    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at < now() && $this->isPending();
    }

    public function canBeApprovedBy(User $user): bool
    {
        // Check if user has permission to approve this type
        $permissionMap = [
            'transaction' => 'approval.cash-transactions.approve',
            'journal_posting' => 'approval.journal-posting.approve',
            'monthly_closing' => 'approval.monthly-closing.approve',
        ];

        $permission = $permissionMap[$this->approval_type] ?? null;
        
        return $permission && $user->can($permission);
    }

    public function approve(User $user, string $notes = null): bool
    {
        if (!$this->canBeApprovedBy($user)) {
            return false;
        }

        $this->update([
            'status' => 'approved',
            'approved_by' => $user->id,
            'approved_at' => now(),
            'approval_notes' => $notes,
        ]);

        // Broadcast approval event
        broadcast(new ApprovalApproved($this));

        return true;
    }

    public function reject(User $user, string $reason): bool
    {
        if (!$this->canBeApprovedBy($user)) {
            return false;
        }

        $this->update([
            'status' => 'rejected',
            'approved_by' => $user->id,
            'approved_at' => now(),
            'rejection_reason' => $reason,
        ]);

        // Broadcast rejection event
        broadcast(new ApprovalRejected($this));

        return true;
    }

    public function escalate(User $user): bool
    {
        $this->update([
            'status' => 'escalated',
            'escalated_to' => $user->id,
            'escalated_at' => now(),
        ]);

        return true;
    }
}
