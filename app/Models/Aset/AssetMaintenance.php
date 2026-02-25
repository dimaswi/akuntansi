<?php

namespace App\Models\Aset;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssetMaintenance extends Model
{
    protected $table = 'asset_maintenances';

    protected $fillable = [
        'maintenance_number',
        'asset_id',
        'type',
        'description',
        'scheduled_date',
        'completed_date',
        'cost',
        'vendor',
        'vendor_contact',
        'status',
        'notes',
        'result',
        'created_by',
    ];

    protected $casts = [
        'scheduled_date' => 'date',
        'completed_date' => 'date',
        'cost' => 'decimal:2',
    ];

    // ─── Relationships ─────────────────────────────────────

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class, 'asset_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // ─── Helpers ───────────────────────────────────────────

    public static function generateNumber(): string
    {
        $year = date('Y');
        $prefix = "MNT-{$year}-";
        $last = static::where('maintenance_number', 'like', $prefix . '%')
            ->orderByDesc('maintenance_number')->first();
        $nextNum = $last ? ((int) substr($last->maintenance_number, -4)) + 1 : 1;
        return $prefix . str_pad($nextNum, 4, '0', STR_PAD_LEFT);
    }
}
