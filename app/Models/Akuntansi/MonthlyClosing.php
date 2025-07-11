<?php

namespace App\Models\Akuntansi;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\User;
use App\Traits\Approvable;
use Carbon\Carbon;

class MonthlyClosing extends Model
{
    use HasFactory, Approvable;

    protected $fillable = [
        'periode_tahun',
        'periode_bulan',
        'tanggal_cut_off',
        'status',
        'initiated_by',
        'approved_by',
        'closed_at',
        'reopened_by',
        'reopened_at',
        'reopen_reason',
        'closing_notes',
        'auto_adjustments',
        'closing_summary'
    ];

    protected $casts = [
        'tanggal_cut_off' => 'date',
        'closed_at' => 'datetime',
        'reopened_at' => 'datetime',
        'auto_adjustments' => 'json',
        'closing_summary' => 'json'
    ];

    // Status: draft, pending_approval, approved, closed, reopened
    const STATUS_DRAFT = 'draft';
    const STATUS_PENDING_APPROVAL = 'pending_approval';
    const STATUS_APPROVED = 'approved';
    const STATUS_CLOSED = 'closed';
    const STATUS_REOPENED = 'reopened';

    // Relationships
    public function initiatedBy()
    {
        return $this->belongsTo(User::class, 'initiated_by');
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function reopenedBy()
    {
        return $this->belongsTo(User::class, 'reopened_by');
    }

    // Approvable trait requirements
    protected function getApprovalEntityType(): string
    {
        return 'monthly_closing';
    }

    protected function getApprovalAmount(): float
    {
        return 0; // Monthly closing tidak berdasarkan amount
    }

    // Scopes
    public function scopeForPeriod($query, $year, $month)
    {
        return $query->where('periode_tahun', $year)
                    ->where('periode_bulan', $month);
    }

    public function scopeClosed($query)
    {
        return $query->where('status', self::STATUS_CLOSED);
    }

    public function scopeOpen($query)
    {
        return $query->whereIn('status', [self::STATUS_DRAFT, self::STATUS_PENDING_APPROVAL, self::STATUS_APPROVED, self::STATUS_REOPENED]);
    }

    // Methods
    public function getPeriodeAttribute()
    {
        return Carbon::createFromDate($this->periode_tahun, $this->periode_bulan, 1)->format('F Y');
    }

    public function isClosed()
    {
        return $this->status === self::STATUS_CLOSED;
    }

    public function canBeReopened()
    {
        return $this->status === self::STATUS_CLOSED;
    }

    public function canBeApproved()
    {
        return $this->status === self::STATUS_PENDING_APPROVAL;
    }

    public function getPendingTransactionsCount()
    {
        // Count transaksi yang masih draft atau pending approval di periode ini
        $startDate = Carbon::createFromDate($this->periode_tahun, $this->periode_bulan, 1)->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();

        $cashPending = \App\Models\Kas\CashTransaction::whereBetween('tanggal_transaksi', [$startDate, $endDate])
            ->whereIn('status', ['draft', 'pending_approval'])
            ->count();

        $bankPending = \App\Models\Kas\BankTransaction::whereBetween('tanggal_transaksi', [$startDate, $endDate])
            ->whereIn('status', ['draft', 'pending_approval'])
            ->count();

        $giroPending = \App\Models\Kas\GiroTransaction::whereBetween('tanggal_giro', [$startDate, $endDate])
            ->whereIn('status', ['draft', 'pending_approval'])
            ->count();

        return $cashPending + $bankPending + $giroPending;
    }

    public function generateClosingSummary()
    {
        $startDate = Carbon::createFromDate($this->periode_tahun, $this->periode_bulan, 1)->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();

        // Summary transaksi kas
        $cashSummary = \App\Models\Kas\CashTransaction::whereBetween('tanggal_transaksi', [$startDate, $endDate])
            ->selectRaw('
                status,
                COUNT(*) as count,
                SUM(CASE WHEN jenis_transaksi IN ("penerimaan", "uang_muka_penerimaan", "transfer_masuk") THEN jumlah ELSE 0 END) as penerimaan,
                SUM(CASE WHEN jenis_transaksi NOT IN ("penerimaan", "uang_muka_penerimaan", "transfer_masuk") THEN jumlah ELSE 0 END) as pengeluaran
            ')
            ->groupBy('status')
            ->get();

        // Summary transaksi bank
        $bankSummary = \App\Models\Kas\BankTransaction::whereBetween('tanggal_transaksi', [$startDate, $endDate])
            ->selectRaw('
                status,
                COUNT(*) as count,
                SUM(CASE WHEN jenis_transaksi IN ("setoran", "transfer_masuk", "kliring_masuk", "bunga_bank") THEN jumlah ELSE 0 END) as setoran,
                SUM(CASE WHEN jenis_transaksi NOT IN ("setoran", "transfer_masuk", "kliring_masuk", "bunga_bank") THEN jumlah ELSE 0 END) as penarikan
            ')
            ->groupBy('status')
            ->get();

        // Summary transaksi giro
        $giroSummary = \App\Models\Kas\GiroTransaction::whereBetween('tanggal_giro', [$startDate, $endDate])
            ->selectRaw('
                status,
                COUNT(*) as count,
                SUM(CASE WHEN jenis_giro = "masuk" THEN jumlah ELSE 0 END) as giro_masuk,
                SUM(CASE WHEN jenis_giro = "keluar" THEN jumlah ELSE 0 END) as giro_keluar
            ')
            ->groupBy('status')
            ->get();

        return [
            'periode' => $this->periode,
            'cash_summary' => $cashSummary,
            'bank_summary' => $bankSummary,
            'giro_summary' => $giroSummary,
            'total_transactions' => $cashSummary->sum('count') + $bankSummary->sum('count') + $giroSummary->sum('count'),
            'pending_count' => $this->getPendingTransactionsCount(),
            'generated_at' => now()
        ];
    }
}
