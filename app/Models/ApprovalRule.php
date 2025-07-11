<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ApprovalRule extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'entity_type',
        'approval_type',
        'is_active',
        'min_amount',
        'max_amount',
        'approval_levels',
        'approver_roles',
        'escalation_hours',
        'auto_approve_weekends',
        'conditions',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'min_amount' => 'decimal:2',
        'max_amount' => 'decimal:2',
        'approver_roles' => 'array',
        'auto_approve_weekends' => 'boolean',
        'conditions' => 'array',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForEntity($query, string $entityType)
    {
        return $query->where('entity_type', $entityType);
    }

    public function scopeForApprovalType($query, string $approvalType)
    {
        return $query->where('approval_type', $approvalType);
    }

    public function appliesToAmount(float $amount): bool
    {
        $withinMin = !$this->min_amount || $amount >= $this->min_amount;
        $withinMax = !$this->max_amount || $amount <= $this->max_amount;
        
        return $withinMin && $withinMax;
    }

    public function getApproverRoles(): array
    {
        return $this->approver_roles ?? [];
    }

    public function requiresApproval(float $amount): bool
    {
        if (!$this->is_active) {
            return false;
        }

        // Check amount threshold
        if (!$this->appliesToAmount($amount)) {
            return false;
        }

        // Check if this rule is for outgoing transactions only
        $conditions = $this->conditions ?? [];
        if (isset($conditions['only_outgoing']) && $conditions['only_outgoing']) {
            // This rule is specifically for outgoing transactions
            // The isOutgoingTransaction() check is done in the trait
            return true;
        }

        return true;
    }

    public static function findApplicableRule(string $entityType, string $approvalType, float $amount): ?self
    {
        return static::active()
            ->forEntity($entityType)
            ->forApprovalType($approvalType)
            ->get()
            ->first(function ($rule) use ($amount) {
                return $rule->appliesToAmount($amount);
            });
    }

    public function getEscalationDeadline(): \Carbon\Carbon
    {
        return now()->addHours($this->escalation_hours);
    }
}
