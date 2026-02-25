<?php

namespace App\Models\Aset;

use App\Models\Akuntansi\Jurnal;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssetDisposal extends Model
{
    protected $table = 'asset_disposals';

    protected $fillable = [
        'disposal_number',
        'asset_id',
        'disposal_date',
        'disposal_method',
        'disposal_price',
        'book_value_at_disposal',
        'gain_loss',
        'buyer_info',
        'reason',
        'status',
        'jurnal_id',
        'approved_by',
        'approved_at',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'disposal_date' => 'date',
        'disposal_price' => 'decimal:2',
        'book_value_at_disposal' => 'decimal:2',
        'gain_loss' => 'decimal:2',
        'approved_at' => 'datetime',
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

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // ─── Helpers ───────────────────────────────────────────

    public static function generateNumber(): string
    {
        $year = date('Y');
        $prefix = "DSP-{$year}-";
        $last = static::where('disposal_number', 'like', $prefix . '%')
            ->orderByDesc('disposal_number')->first();
        $nextNum = $last ? ((int) substr($last->disposal_number, -4)) + 1 : 1;
        return $prefix . str_pad($nextNum, 4, '0', STR_PAD_LEFT);
    }

    public function calculateGainLoss(): float
    {
        return $this->disposal_price - $this->book_value_at_disposal;
    }
}
