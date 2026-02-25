<?php

namespace App\Models\Aset;

use App\Models\Inventory\Department;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssetTransfer extends Model
{
    protected $table = 'asset_transfers';

    protected $fillable = [
        'transfer_number',
        'asset_id',
        'from_department_id',
        'to_department_id',
        'transfer_date',
        'reason',
        'status',
        'approved_by',
        'approved_at',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'transfer_date' => 'date',
        'approved_at' => 'datetime',
    ];

    // ─── Relationships ─────────────────────────────────────

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class, 'asset_id');
    }

    public function fromDepartment(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'from_department_id');
    }

    public function toDepartment(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'to_department_id');
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
        $prefix = "ATR-{$year}-";
        $last = static::where('transfer_number', 'like', $prefix . '%')
            ->orderByDesc('transfer_number')->first();
        $nextNum = $last ? ((int) substr($last->transfer_number, -4)) + 1 : 1;
        return $prefix . str_pad($nextNum, 4, '0', STR_PAD_LEFT);
    }
}
