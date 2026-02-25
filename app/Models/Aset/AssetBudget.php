<?php

namespace App\Models\Aset;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class AssetBudget extends Model
{
    use SoftDeletes;

    protected $table = 'asset_budgets';

    protected $fillable = [
        'code',
        'fiscal_year',
        'title',
        'description',
        'total_budget',
        'total_realized',
        'status',
        'submitted_by',
        'submitted_at',
        'approved_by',
        'approved_at',
        'created_by',
    ];

    protected $casts = [
        'fiscal_year' => 'integer',
        'total_budget' => 'decimal:2',
        'total_realized' => 'decimal:2',
        'submitted_at' => 'datetime',
        'approved_at' => 'datetime',
    ];

    // ─── Relationships ─────────────────────────────────────

    public function items(): HasMany
    {
        return $this->hasMany(AssetBudgetItem::class, 'asset_budget_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function submitter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    // ─── Helpers ───────────────────────────────────────────

    public static function generateCode(?int $year = null): string
    {
        $year = $year ?? (int) date('Y');
        $last = static::where('fiscal_year', $year)->orderByDesc('id')->first();
        $nextNum = 1;
        if ($last && preg_match('/(\d+)$/', $last->code, $m)) {
            $nextNum = (int) $m[1] + 1;
        }
        return 'RAB-' . $year . '-' . str_pad($nextNum, 3, '0', STR_PAD_LEFT);
    }

    public function recalculateTotals(): void
    {
        $this->total_budget = $this->items()->sum('estimated_total_cost');
        $this->total_realized = $this->items()->sum('realized_amount');
        $this->save();
    }

    public function getRealizationPercentageAttribute(): float
    {
        if ((float) $this->total_budget <= 0) {
            return 0;
        }
        return round(((float) $this->total_realized / (float) $this->total_budget) * 100, 1);
    }

    public function getRemainingBudgetAttribute(): float
    {
        return (float) $this->total_budget - (float) $this->total_realized;
    }
}
