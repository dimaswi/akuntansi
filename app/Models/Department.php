<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Department extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'description',
        'parent_id',
        'manager_id',
        'location',
        'budget_allocation',
        'is_active',
        'can_request_items',
        'monthly_budget_limit',
    ];

    protected $casts = [
        'budget_allocation' => 'array',
        'is_active' => 'boolean',
        'can_request_items' => 'boolean',
        'monthly_budget_limit' => 'decimal:2',
    ];

    /**
     * Get the parent department
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'parent_id');
    }

    /**
     * Get the child departments
     */
    public function children(): HasMany
    {
        return $this->hasMany(Department::class, 'parent_id');
    }

    /**
     * Get the department manager
     */
    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    /**
     * Get department requests
     */
    public function departmentRequests(): HasMany
    {
        return $this->hasMany(DepartmentRequest::class);
    }

    /**
     * Get the inventory locations belonging to this department
     */
    public function inventoryLocations(): HasMany
    {
        return $this->hasMany(\App\Models\Inventory\InventoryLocation::class);
    }

    /**
     * Get the main inventory location for this department
     */
    public function mainInventoryLocation()
    {
        return $this->inventoryLocations()->where('is_main_warehouse', true)->first();
    }

    /**
     * Get outgoing transfers from this department
     */
    public function outgoingTransfers(): HasMany
    {
        return $this->hasMany(DepartmentInventoryTransfer::class, 'from_department_id');
    }

    /**
     * Get incoming transfers to this department
     */
    public function incomingTransfers(): HasMany
    {
        return $this->hasMany(DepartmentInventoryTransfer::class, 'to_department_id');
    }

    /**
     * Scope for active departments
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Get full department hierarchy name
     */
    public function getFullNameAttribute(): string
    {
        $names = [];
        $department = $this;
        
        while ($department) {
            array_unshift($names, $department->name);
            $department = $department->parent;
        }
        
        return implode(' > ', $names);
    }

    public function requests(): HasMany
    {
        return $this->hasMany(DepartmentRequest::class);
    }

    public function pendingRequests(): HasMany
    {
        return $this->hasMany(DepartmentRequest::class)->where('status', 'submitted');
    }

    public function approvedRequests(): HasMany
    {
        return $this->hasMany(DepartmentRequest::class)->where('status', 'approved');
    }

    // Scopes untuk request items
    public function scopeCanRequestItems($query)
    {
        return $query->where('can_request_items', true);
    }

    // Helper methods
    public function getMonthlyRequestsTotal($year = null, $month = null): float
    {
        $year = $year ?? now()->year;
        $month = $month ?? now()->month;
        
        return $this->requests()
            ->whereYear('request_date', $year)
            ->whereMonth('request_date', $month)
            ->sum('total_estimated_cost');
    }

    public function getRemainingBudget($year = null, $month = null): float
    {
        $totalSpent = $this->getMonthlyRequestsTotal($year, $month);
        return max(0, $this->monthly_budget_limit - $totalSpent);
    }
}
