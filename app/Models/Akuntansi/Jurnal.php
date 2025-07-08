<?php

namespace App\Models\Akuntansi;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Jurnal extends Model
{
    protected $table = 'jurnal';

    protected $fillable = [
        'nomor_jurnal',
        'tanggal_transaksi',
        'jenis_referensi',
        'nomor_referensi',
        'keterangan',
        'total_debit',
        'total_kredit',
        'status',
        'dibuat_oleh',
        'diposting_oleh',
        'tanggal_posting'
    ];

    protected $casts = [
        'tanggal_transaksi' => 'date',
        'total_debit' => 'decimal:2',
        'total_kredit' => 'decimal:2',
        'tanggal_posting' => 'datetime'
    ];

    // Relasi ke user yang membuat
    public function dibuatOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dibuat_oleh');
    }

    // Relasi ke user yang posting
    public function dipostingOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'diposting_oleh');
    }

    // Relasi ke detail jurnal
    public function details(): HasMany
    {
        return $this->hasMany(DetailJurnal::class, 'jurnal_id');
    }

    // Scope untuk jurnal yang sudah diposting
    public function scopePosted($query)
    {
        return $query->where('status', 'posted');
    }

    // Scope untuk jurnal draft
    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    // Scope berdasarkan periode
    public function scopePeriode($query, $startDate, $endDate)
    {
        return $query->whereBetween('transaction_date', [$startDate, $endDate]);
    }

    // Check if jurnal is balanced
    public function isBalanced()
    {
        return $this->total_debit == $this->total_credit;
    }

    // Generate nomor jurnal otomatis
    public static function generateJournalNumber($date = null)
    {
        $date = $date ?: now();
        $year = $date->format('Y');
        $month = $date->format('m');
        
        $lastJournal = static::whereYear('transaction_date', $year)
            ->whereMonth('transaction_date', $month)
            ->orderBy('journal_number', 'desc')
            ->first();

        if ($lastJournal) {
            // Extract number from last journal
            $parts = explode('-', $lastJournal->journal_number);
            $lastNumber = intval(end($parts));
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return "JE-{$year}-{$month}-" . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
    }

    // Post jurnal
    public function post($userId)
    {
        if (!$this->isBalanced()) {
            throw new \Exception('Jurnal tidak balance. Debit harus sama dengan Credit.');
        }

        $this->update([
            'status' => 'posted',
            'posted_by' => $userId,
            'posted_at' => now()
        ]);
    }

    // Reverse jurnal
    public function reverse($userId, $description = null)
    {
        if ($this->status !== 'posted') {
            throw new \Exception('Hanya jurnal yang sudah diposting yang bisa di-reverse.');
        }

        // Create reverse jurnal
        $reverseJurnal = static::create([
            'journal_number' => static::generateJournalNumber(),
            'transaction_date' => now()->toDateString(),
            'reference_type' => 'reversal',
            'reference_number' => $this->journal_number,
            'description' => $description ?: "Reversal dari {$this->journal_number}",
            'total_debit' => $this->total_credit,
            'total_credit' => $this->total_debit,
            'status' => 'posted',
            'created_by' => $userId,
            'posted_by' => $userId,
            'posted_at' => now()
        ]);

        // Create reverse details
        foreach ($this->details as $detail) {
            $reverseJurnal->details()->create([
                'chart_of_account_id' => $detail->chart_of_account_id,
                'debit_amount' => $detail->credit_amount,
                'credit_amount' => $detail->debit_amount,
                'description' => "Reversal - {$detail->description}"
            ]);
        }

        // Mark original as reversed
        $this->update(['status' => 'reversed']);

        return $reverseJurnal;
    }
}
