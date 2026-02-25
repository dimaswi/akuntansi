<?php

namespace App\Models\Aset;

use App\Models\Akuntansi\Jurnal;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssetDepreciation extends Model
{
    protected $table = 'asset_depreciations';

    protected $fillable = [
        'asset_id',
        'period_date',
        'period_number',
        'depreciation_amount',
        'accumulated_depreciation',
        'book_value',
        'method',
        'jurnal_id',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'period_date' => 'date',
        'period_number' => 'integer',
        'depreciation_amount' => 'decimal:2',
        'accumulated_depreciation' => 'decimal:2',
        'book_value' => 'decimal:2',
    ];

    // ─── Relationships ─────────────────────────────────────

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class, 'asset_id');
    }

    public function jurnal(): BelongsTo
    {
        return $this->belongsTo(Jurnal::class, 'jurnal_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
