<?php

namespace App\Models\Kas;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Akuntansi\DaftarAkun;
use App\Models\Akuntansi\Jurnal;
use App\Models\User;
use App\Traits\Approvable;

class BankTransaction extends Model
{
    use HasFactory, Approvable;

    protected $fillable = [
        'nomor_transaksi',
        'tanggal_transaksi',
        'tanggal_efektif',
        'jenis_transaksi',
        'kategori_transaksi',
        'bank_account_id',
        'jumlah',
        'keterangan',
        'nomor_referensi',
        'pihak_terkait',
        'daftar_akun_lawan_id',
        'jurnal_id',
        'status',
        'will_post_to_journal',
        'is_reconciled',
        'tanggal_rekonsiliasi',
        'user_id',
        'posted_at',
        'posted_by',
    ];

    protected $casts = [
        'tanggal_transaksi' => 'date',
        'tanggal_efektif' => 'date',
        'tanggal_rekonsiliasi' => 'date',
        'jumlah' => 'decimal:2',
        'is_reconciled' => 'boolean',
        'posted_at' => 'datetime',
    ];

    public function bankAccount()
    {
        return $this->belongsTo(BankAccount::class);
    }

    public function daftarAkunLawan()
    {
        return $this->belongsTo(DaftarAkun::class, 'daftar_akun_lawan_id');
    }

    public function jurnal()
    {
        return $this->belongsTo(Jurnal::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function postedBy()
    {
        return $this->belongsTo(User::class, 'posted_by');
    }

    public function scopePosted($query)
    {
        return $query->where('status', 'posted');
    }

    public function scopeReconciled($query)
    {
        return $query->where('is_reconciled', true);
    }

    public function scopeUnreconciled($query)
    {
        return $query->where('is_reconciled', false);
    }

    public function scopeMasuk($query)
    {
        return $query->whereIn('jenis_transaksi', ['setoran', 'transfer_masuk', 'kliring_masuk', 'bunga_bank']);
    }

    public function scopeKeluar($query)
    {
        return $query->whereIn('jenis_transaksi', ['penarikan', 'transfer_keluar', 'kliring_keluar', 'biaya_admin', 'pajak_bunga']);
    }

    public function generateNomorTransaksi()
    {
        $prefix = match($this->jenis_transaksi) {
            'setoran' => 'BM',
            'penarikan' => 'BK',
            'transfer_masuk' => 'BTM',
            'transfer_keluar' => 'BTK',
            'kliring_masuk' => 'KM',
            'kliring_keluar' => 'KK',
            'bunga_bank' => 'BB',
            'biaya_admin' => 'BA',
            'pajak_bunga' => 'PB',
            default => 'BANK'
        };

        $tahun = date('Y');
        $bulan = date('m');
        
        $lastNumber = self::where('nomor_transaksi', 'like', "$prefix/$tahun/$bulan/%")
            ->orderBy('nomor_transaksi', 'desc')
            ->first();

        if ($lastNumber) {
            $lastNum = (int) substr($lastNumber->nomor_transaksi, -4);
            $newNum = $lastNum + 1;
        } else {
            $newNum = 1;
        }

        return sprintf('%s/%s/%s/%04d', $prefix, $tahun, $bulan, $newNum);
    }

    protected function getApprovalEntityType(): string
    {
        return 'bank_transaction';
    }

    /**
     * Check if this is an outgoing transaction (pengeluaran)
     */
    public function isOutgoingTransaction(): bool
    {
        return in_array($this->jenis_transaksi, [
            'pengeluaran',
            'transfer_keluar'
        ]);
    }

    protected function getApprovalAmount(): float
    {
        return (float) $this->jumlah;
    }
}
