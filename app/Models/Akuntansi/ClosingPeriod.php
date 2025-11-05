<?php

namespace App\Models\Akuntansi;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ClosingPeriod extends Model
{
    protected $table = 'closing_periods';

    protected $fillable = [
        'period_code',
        'period_name',
        'period_type',
        'period_start',
        'period_end',
        'cutoff_date',
        'hard_close_date',
        'status',
        'soft_closed_by',
        'soft_closed_at',
        'hard_closed_by',
        'hard_closed_at',
        'reopened_by',
        'reopened_at',
        'reopen_reason',
        'notes',
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
        'cutoff_date' => 'date',
        'hard_close_date' => 'date',
        'soft_closed_at' => 'datetime',
        'hard_closed_at' => 'datetime',
        'reopened_at' => 'datetime',
    ];

    // Relasi ke user yang soft close
    public function softClosedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'soft_closed_by');
    }

    // Relasi ke user yang hard close
    public function hardClosedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'hard_closed_by');
    }

    // Relasi ke user yang reopen
    public function reopenedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reopened_by');
    }

    // Relasi ke revision logs
    public function revisionLogs(): HasMany
    {
        return $this->hasMany(JournalRevisionLog::class, 'closing_period_id');
    }

    // Relasi ke checklists
    public function checklists(): HasMany
    {
        return $this->hasMany(PeriodChecklist::class, 'closing_period_id');
    }

    // Scope untuk periode yang open
    public function scopeOpen($query)
    {
        return $query->where('status', 'open');
    }

    // Scope untuk periode yang soft close
    public function scopeSoftClosed($query)
    {
        return $query->where('status', 'soft_close');
    }

    // Scope untuk periode yang hard close
    public function scopeHardClosed($query)
    {
        return $query->where('status', 'hard_close');
    }

    // Check apakah periode sudah lewat cutoff
    public function isPastCutoff(): bool
    {
        return now()->greaterThan($this->cutoff_date);
    }

    // Check apakah periode sudah lewat hard close date
    public function isPastHardClose(): bool
    {
        return $this->hard_close_date && now()->greaterThan($this->hard_close_date);
    }

    // Check apakah tanggal ada dalam periode ini
    public function containsDate($date): bool
    {
        $checkDate = is_string($date) ? \Carbon\Carbon::parse($date) : $date;
        return $checkDate->between($this->period_start, $this->period_end);
    }

    // Status badge color
    public function getStatusBadgeAttribute(): string
    {
        return match($this->status) {
            'open' => 'green',
            'soft_close' => 'yellow',
            'hard_close' => 'red',
            default => 'gray',
        };
    }

    // Status label
    public function getStatusLabelAttribute(): string
    {
        return match($this->status) {
            'open' => 'Terbuka',
            'soft_close' => 'Soft Close',
            'hard_close' => 'Hard Close',
            default => 'Unknown',
        };
    }
}
