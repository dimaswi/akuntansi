<?php

namespace App\Models\Aset;

use App\Models\Inventory\Purchase;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssetBudgetRealization extends Model
{
    protected $table = 'asset_budget_realizations';

    protected $fillable = [
        'budget_item_id',
        'asset_id',
        'purchase_id',
        'quantity',
        'actual_cost',
        'realization_date',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'actual_cost' => 'decimal:2',
        'realization_date' => 'date',
    ];

    // ─── Relationships ─────────────────────────────────────

    public function budgetItem(): BelongsTo
    {
        return $this->belongsTo(AssetBudgetItem::class, 'budget_item_id');
    }

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class, 'asset_id');
    }

    public function purchase(): BelongsTo
    {
        return $this->belongsTo(Purchase::class, 'purchase_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
