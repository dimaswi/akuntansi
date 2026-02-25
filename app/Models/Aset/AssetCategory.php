<?php

namespace App\Models\Aset;

use App\Models\Akuntansi\DaftarAkun;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AssetCategory extends Model
{
    protected $table = 'asset_categories';

    protected $fillable = [
        'code',
        'name',
        'description',
        'default_useful_life_years',
        'default_depreciation_method',
        'default_salvage_percentage',
        'account_asset_id',
        'account_depreciation_id',
        'account_expense_id',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'default_useful_life_years' => 'integer',
        'default_salvage_percentage' => 'decimal:2',
    ];

    // ─── Relationships ─────────────────────────────────────

    public function assets(): HasMany
    {
        return $this->hasMany(Asset::class, 'category_id');
    }

    public function accountAsset(): BelongsTo
    {
        return $this->belongsTo(DaftarAkun::class, 'account_asset_id');
    }

    public function accountDepreciation(): BelongsTo
    {
        return $this->belongsTo(DaftarAkun::class, 'account_depreciation_id');
    }

    public function accountExpense(): BelongsTo
    {
        return $this->belongsTo(DaftarAkun::class, 'account_expense_id');
    }

    // ─── Scopes ────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // ─── Helpers ───────────────────────────────────────────

    public static function generateCode(): string
    {
        $last = static::orderByDesc('id')->first();
        $nextNum = $last ? ((int) substr($last->code, -3)) + 1 : 1;
        return 'CAT-' . str_pad($nextNum, 3, '0', STR_PAD_LEFT);
    }
}
