<?php

namespace App\Traits;

use App\Models\Approval;
use App\Models\ApprovalRule;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use App\Events\ApprovalRequested;

trait Approvable
{
    public function approvals(): MorphMany
    {
        return $this->morphMany(Approval::class, 'approvable');
    }

    public function pendingApprovals(): MorphMany
    {
        return $this->approvals()->where('status', 'pending');
    }

    public function approvedApprovals(): MorphMany
    {
        return $this->approvals()->where('status', 'approved');
    }

    public function rejectedApprovals(): MorphMany
    {
        return $this->approvals()->where('status', 'rejected');
    }

    public function requiresApproval(string $approvalType = 'transaction'): bool
    {
        $entityType = $this->getApprovalEntityType();
        $amount = $this->getApprovalAmount();
        
        $rule = ApprovalRule::findApplicableRule($entityType, $approvalType, $amount);
        
        return $rule && $rule->requiresApproval($amount);
    }

    public function requestApproval(
        User $user, 
        string $approvalType = 'transaction', 
        string $notes = null
    ): ?Approval {
        // Check if approval is required
        if (!$this->requiresApproval($approvalType)) {
            return null;
        }

        // Find applicable rule
        $entityType = $this->getApprovalEntityType();
        $amount = $this->getApprovalAmount();
        $rule = ApprovalRule::findApplicableRule($entityType, $approvalType, $amount);

        if (!$rule) {
            return null;
        }

        // Create approval request
        $approval = $this->approvals()->create([
            'approval_type' => $approvalType,
            'status' => 'pending',
            'amount' => $amount,
            'approval_rules' => [
                'rule_id' => $rule->id,
                'approval_levels' => $rule->approval_levels,
                'approver_roles' => $rule->getApproverRoles(),
            ],
            'approval_level' => 1,
            'requires_approval' => true,
            'expires_at' => $rule->getEscalationDeadline(),
            'requested_by' => $user->id,
            'request_notes' => $notes,
        ]);

        // Broadcast approval request event
        if ($approval) {
            broadcast(new ApprovalRequested($approval));
        }

        return $approval;
    }

    public function hasApproval(string $approvalType = 'transaction'): bool
    {
        return $this->approvals()
            ->where('approval_type', $approvalType)
            ->where('status', 'approved')
            ->exists();
    }

    public function hasPendingApproval(string $approvalType = 'transaction'): bool
    {
        return $this->approvals()
            ->where('approval_type', $approvalType)
            ->where('status', 'pending')
            ->exists();
    }

    public function getLatestApproval(string $approvalType = 'transaction'): ?Approval
    {
        return $this->approvals()
            ->where('approval_type', $approvalType)
            ->latest()
            ->first();
    }

    public function canBeApprovedBy(User $user, string $approvalType = 'transaction'): bool
    {
        $approval = $this->getLatestApproval($approvalType);
        
        return $approval && $approval->canBeApprovedBy($user);
    }

    public function approve(User $user, string $approvalType = 'transaction', string $notes = null): bool
    {
        $approval = $this->getLatestApproval($approvalType);
        
        if (!$approval || !$approval->isPending()) {
            return false;
        }

        return $approval->approve($user, $notes);
    }

    public function reject(User $user, string $approvalType = 'transaction', string $reason = null): bool
    {
        $approval = $this->getLatestApproval($approvalType);
        
        if (!$approval || !$approval->isPending()) {
            return false;
        }

        return $approval->reject($user, $reason);
    }

    // Abstract methods that must be implemented by models using this trait
    abstract protected function getApprovalEntityType(): string;
    abstract protected function getApprovalAmount(): float;
}
