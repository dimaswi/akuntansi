<?php

namespace App\Models\Akuntansi;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PeriodChecklist extends Model
{
    protected $table = 'period_checklists';

    protected $fillable = [
        'closing_period_id',
        'checklist_item',
        'is_completed',
        'completed_by',
        'completed_at',
        'notes',
        'validation_data',
    ];

    protected $casts = [
        'is_completed' => 'boolean',
        'completed_at' => 'datetime',
        'validation_data' => 'array',
    ];

    // Relasi ke closing period
    public function closingPeriod(): BelongsTo
    {
        return $this->belongsTo(ClosingPeriod::class, 'closing_period_id');
    }

    // Relasi ke user yang complete
    public function completedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'completed_by');
    }

    // Scope untuk completed
    public function scopeCompleted($query)
    {
        return $query->where('is_completed', true);
    }

    // Scope untuk incomplete
    public function scopeIncomplete($query)
    {
        return $query->where('is_completed', false);
    }
}
