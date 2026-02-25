<?php

namespace App\Models\Aset;

use App\Models\Inventory\Department;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AssetBudgetItem extends Model
{
    protected $table = 'asset_budget_items';

    protected $fillable = [
        'asset_budget_id',
        'category_id',
        'department_id',
        'item_name',
        'description',
        'quantity',
        'estimated_unit_cost',
        'estimated_total_cost',
        'priority',
        'status',
        'realized_quantity',
        'realized_amount',
        'realized_at',
        'rolled_from_id',
        'notes',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'estimated_unit_cost' => 'decimal:2',
        'estimated_total_cost' => 'decimal:2',
        'realized_quantity' => 'integer',
        'realized_amount' => 'decimal:2',
        'realized_at' => 'date',
    ];

    // ─── Relationships ─────────────────────────────────────

    public function budget(): BelongsTo
    {
        return $this->belongsTo(AssetBudget::class, 'asset_budget_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(AssetCategory::class, 'category_id');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    public function realizations(): HasMany
    {
        return $this->hasMany(AssetBudgetRealization::class, 'budget_item_id');
    }

    public function rolledFrom(): BelongsTo
    {
        return $this->belongsTo(self::class, 'rolled_from_id');
    }

    public function rolledTo(): HasMany
    {
        return $this->hasMany(self::class, 'rolled_from_id');
    }

    // ─── Helpers ───────────────────────────────────────────

    public function getRemainingQuantityAttribute(): int
    {
        return $this->quantity - $this->realized_quantity;
    }

    public function recalculateRealization(): void
    {
        $this->realized_quantity = $this->realizations()->sum('quantity');
        $this->realized_amount = $this->realizations()->sum('actual_cost');

        if ($this->realized_quantity >= $this->quantity) {
            $this->status = 'realized';
            $this->realized_at = $this->realized_at ?? now()->toDateString();
        } elseif ($this->realized_quantity > 0) {
            $this->status = 'partially_realized';
        }

        $this->save();
    }
}
