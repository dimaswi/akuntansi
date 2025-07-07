<?php

namespace App\Models\Kas;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Akuntansi\DaftarAkun;
use App\Models\Akuntansi\Jurnal;
use App\Models\User;

class GiroTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'nomor_giro',
        'tanggal_terima',
        'tanggal_jatuh_tempo',
        'tanggal_cair',
        'jenis_giro',
        'status_giro',
        'bank_account_id',
        'jumlah',
        'nama_penerbit',
        'bank_penerbit',
        'keterangan',
        'nomor_referensi',
        'daftar_akun_giro_id',
        'daftar_akun_lawan_id',
        'jurnal_terima_id',
        'jurnal_cair_id',
        'user_id',
        'posted_at',
        'posted_by',
    ];

    protected $casts = [
        'tanggal_terima' => 'date',
        'tanggal_jatuh_tempo' => 'date',
        'tanggal_cair' => 'date',
        'jumlah' => 'decimal:2',
        'posted_at' => 'datetime',
    ];

    public function bankAccount()
    {
        return $this->belongsTo(BankAccount::class);
    }

    public function daftarAkunGiro()
    {
        return $this->belongsTo(DaftarAkun::class, 'daftar_akun_giro_id');
    }

    public function daftarAkunLawan()
    {
        return $this->belongsTo(DaftarAkun::class, 'daftar_akun_lawan_id');
    }

    public function jurnalTerima()
    {
        return $this->belongsTo(Jurnal::class, 'jurnal_terima_id');
    }

    public function jurnalCair()
    {
        return $this->belongsTo(Jurnal::class, 'jurnal_cair_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function postedBy()
    {
        return $this->belongsTo(User::class, 'posted_by');
    }

    public function scopeGiroMasuk($query)
    {
        return $query->where('jenis_giro', 'masuk');
    }

    public function scopeGiroKeluar($query)
    {
        return $query->where('jenis_giro', 'keluar');
    }

    public function scopeJatuhTempo($query, $tanggal = null)
    {
        $tanggal = $tanggal ?: now()->toDateString();
        return $query->where('tanggal_jatuh_tempo', '<=', $tanggal)
                    ->whereIn('status_giro', ['diterima', 'diserahkan_ke_bank']);
    }

    public function scopeCair($query)
    {
        return $query->where('status_giro', 'cair');
    }

    public function scopePending($query)
    {
        return $query->whereIn('status_giro', ['diterima', 'diserahkan_ke_bank']);
    }

    public function isJatuhTempo()
    {
        return $this->tanggal_jatuh_tempo <= now()->toDate();
    }

    public function canBeCashed()
    {
        return $this->status_giro === 'diserahkan_ke_bank' && $this->isJatuhTempo();
    }
}
