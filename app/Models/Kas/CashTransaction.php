<?php

namespace App\Models\Kas;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Akuntansi\DaftarAkun;
use App\Models\Akuntansi\Jurnal;
use App\Models\User;

class CashTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'nomor_transaksi',
        'tanggal_transaksi',
        'jenis_transaksi',
        'kategori_transaksi',
        'jumlah',
        'keterangan',
        'pihak_terkait',
        'referensi',
        'daftar_akun_kas_id',
        'daftar_akun_lawan_id',
        'jurnal_id',
        'status',
        'user_id',
        'posted_at',
        'posted_by',
    ];

    protected $casts = [
        'tanggal_transaksi' => 'date',
        'jumlah' => 'decimal:2',
        'posted_at' => 'datetime',
    ];

    public function daftarAkunKas()
    {
        return $this->belongsTo(DaftarAkun::class, 'daftar_akun_kas_id');
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

    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    public function scopePenerimaan($query)
    {
        return $query->whereIn('jenis_transaksi', ['penerimaan', 'uang_muka_penerimaan', 'transfer_masuk']);
    }

    public function scopePengeluaran($query)
    {
        return $query->whereIn('jenis_transaksi', ['pengeluaran', 'uang_muka_pengeluaran', 'transfer_keluar']);
    }

    public function generateNomorTransaksi()
    {
        $prefix = match($this->jenis_transaksi) {
            'penerimaan' => 'KM',
            'pengeluaran' => 'KK',
            'uang_muka_penerimaan' => 'UMP',
            'uang_muka_pengeluaran' => 'UMK',
            'transfer_masuk' => 'TM',
            'transfer_keluar' => 'TK',
            default => 'KAS'
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
}
