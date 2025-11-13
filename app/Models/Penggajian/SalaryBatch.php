<?php

namespace App\Models\Penggajian;

use App\Models\User;
use App\Models\Akuntansi\Journal;
use App\Models\Akuntansi\Jurnal;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class SalaryBatch extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'batch_number',
        'period_month',
        'period_year',
        'description',
        'payment_account_id',
        'total_employees',
        'total_pendapatan',
        'total_potongan',
        'total_gaji_bersih',
        'status',
        'journal_id',
        'created_by',
        'posted_by',
        'posted_at',
    ];

    protected $casts = [
        'period_month' => 'integer',
        'period_year' => 'integer',
        'total_employees' => 'integer',
        'total_pendapatan' => 'decimal:2',
        'total_potongan' => 'decimal:2',
        'total_gaji_bersih' => 'decimal:2',
        'posted_at' => 'datetime',
    ];

    protected $appends = ['period_display', 'can_edit', 'can_post'];

    /**
     * Generate batch number otomatis
     */
    public static function generateBatchNumber(int $year, int $month): string
    {
        $prefix = "SALARY-{$year}-" . str_pad($month, 2, '0', STR_PAD_LEFT) . "-";
        
        $lastBatch = self::where('batch_number', 'like', $prefix . '%')
            ->orderBy('batch_number', 'desc')
            ->first();
        
        if ($lastBatch) {
            $lastNumber = (int) substr($lastBatch->batch_number, -3);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }
        
        return $prefix . str_pad($newNumber, 3, '0', STR_PAD_LEFT);
    }

    /**
     * Calculate totals from details
     */
    public function calculateTotals(): void
    {
        $details = $this->details;
        
        $this->total_employees = $details->count();
        $this->total_pendapatan = $details->sum('total_pendapatan');
        $this->total_potongan = $details->sum('total_potongan');
        $this->total_gaji_bersih = $details->sum('gaji_bersih');
        
        $this->save();
    }

    /**
     * Get period display (e.g., "November 2025")
     */
    public function getPeriodDisplayAttribute(): string
    {
        $months = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
        ];
        
        return $months[$this->period_month] . ' ' . $this->period_year;
    }

    /**
     * Check if batch can be edited
     */
    public function getCanEditAttribute(): bool
    {
        return $this->status === 'draft';
    }

    /**
     * Check if batch can be posted to journal
     */
    public function getCanPostAttribute(): bool
    {
        return $this->status === 'draft' && $this->total_employees > 0;
    }

    // Relationships
    public function details(): HasMany
    {
        return $this->hasMany(SalaryDetail::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function poster(): BelongsTo
    {
        return $this->belongsTo(User::class, 'posted_by');
    }

    public function journal(): BelongsTo
    {
        return $this->belongsTo(Jurnal::class);
    }

    public function paymentAccount(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Akuntansi\DaftarAkun::class, 'payment_account_id');
    }
}
