<?php

namespace App\Models\Kas;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Akuntansi\DaftarAkun;
use App\Models\User;

class BankAccount extends Model
{
    use HasFactory;

    protected $fillable = [
        'kode_rekening',
        'nama_bank',
        'nama_rekening',
        'nomor_rekening',
        'cabang',
        'saldo_awal',
        'saldo_berjalan',
        'daftar_akun_id',
        'jenis_rekening',
        'keterangan',
        'is_aktif',
    ];

    protected $casts = [
        'saldo_awal' => 'decimal:2',
        'saldo_berjalan' => 'decimal:2',
        'is_aktif' => 'boolean',
    ];

    public function daftarAkun()
    {
        return $this->belongsTo(DaftarAkun::class);
    }

    public function bankTransactions()
    {
        return $this->hasMany(BankTransaction::class);
    }

    public function giroTransactions()
    {
        return $this->hasMany(GiroTransaction::class);
    }

    public function scopeAktif($query)
    {
        return $query->where('is_aktif', true);
    }

    public function updateSaldoBerjalan()
    {
        $totalMasuk = $this->bankTransactions()
            ->whereIn('jenis_transaksi', ['setoran', 'transfer_masuk', 'kliring_masuk', 'bunga_bank'])
            ->where('status', 'posted')
            ->sum('jumlah');

        $totalKeluar = $this->bankTransactions()
            ->whereIn('jenis_transaksi', ['penarikan', 'transfer_keluar', 'kliring_keluar', 'biaya_admin', 'pajak_bunga'])
            ->where('status', 'posted')
            ->sum('jumlah');

        $this->saldo_berjalan = $this->saldo_awal + $totalMasuk - $totalKeluar;
        $this->save();

        return $this->saldo_berjalan;
    }

    /**
     * Get balance from COA (Chart of Accounts)
     * Returns the balance calculated from detail_jurnal if linked to COA
     */
    public function getSaldoFromCoa()
    {
        if ($this->daftar_akun_id && $this->daftarAkun) {
            return $this->daftarAkun->getBalance();
        }
        
        return null;
    }
}
