<?php

namespace App\Models\Akuntansi;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JournalRevisionLog extends Model
{
    protected $table = 'journal_revision_logs';

    protected $fillable = [
        'closing_period_id',
        'journal_type',
        'journal_id',
        'action',
        'reason',
        'old_data',
        'new_data',
        'impact_amount',
        'revised_by',
        'revised_at',
        'approval_status',
        'approved_by',
        'approved_at',
        'approval_notes',
    ];

    protected $casts = [
        'old_data' => 'array',
        'new_data' => 'array',
        'impact_amount' => 'decimal:2',
        'revised_at' => 'datetime',
        'approved_at' => 'datetime',
    ];

    // Relasi ke closing period
    public function closingPeriod(): BelongsTo
    {
        return $this->belongsTo(ClosingPeriod::class, 'closing_period_id');
    }

    // Relasi ke user yang revisi
    public function revisedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'revised_by');
    }

    // Relasi ke user yang approve
    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    // Scope untuk pending approval
    public function scopePending($query)
    {
        return $query->where('approval_status', 'pending');
    }

    // Scope untuk approved
    public function scopeApproved($query)
    {
        return $query->where('approval_status', 'approved');
    }

    // Scope untuk rejected
    public function scopeRejected($query)
    {
        return $query->where('approval_status', 'rejected');
    }

    // Check apakah butuh approval berdasarkan threshold
    public function needsApproval(): bool
    {
        $threshold = ClosingPeriodSetting::get('material_threshold', 1000000);
        return abs($this->impact_amount) >= $threshold;
    }

    // Get journal model dynamically
    public function getJournalAttribute()
    {
        return Jurnal::find($this->journal_id);
    }

    // Status badge
    public function getStatusBadgeAttribute(): string
    {
        return match($this->approval_status) {
            'pending' => 'yellow',
            'approved' => 'green',
            'rejected' => 'red',
            default => 'gray',
        };
    }

    // Status label
    public function getStatusLabelAttribute(): string
    {
        return match($this->approval_status) {
            'pending' => 'Menunggu Approval',
            'approved' => 'Disetujui',
            'rejected' => 'Ditolak',
            default => 'Unknown',
        };
    }
}
