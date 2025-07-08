<?php

namespace App\Models\Akuntansi;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DaftarAkun extends Model
{
    protected $table = 'daftar_akun';

    protected $fillable = [
        'kode_akun',
        'nama_akun',
        'jenis_akun',
        'sub_jenis',
        'saldo_normal',
        'induk_akun_id',
        'level',
        'is_aktif',
        'keterangan'
    ];

    protected $casts = [
        'is_aktif' => 'boolean',
        'level' => 'integer'
    ];

    // Relasi ke parent account
    public function indukAkun(): BelongsTo
    {
        return $this->belongsTo(DaftarAkun::class, 'induk_akun_id');
    }

    // Relasi ke child accounts
    public function subAkun(): HasMany
    {
        return $this->hasMany(DaftarAkun::class, 'induk_akun_id');
    }

    // Relasi ke journal entry details
    public function detailJurnal(): HasMany
    {
        return $this->hasMany(DetailJurnal::class, 'daftar_akun_id');
    }

    // Scope untuk account aktif
    public function scopeAktif($query)
    {
        return $query->where('is_aktif', true);
    }

    // Scope berdasarkan jenis akun
    public function scopeJenisAkun($query, $jenis)
    {
        return $query->where('jenis_akun', $jenis);
    }

    // Get full account code dengan parent
    public function getFullKodeAttribute()
    {
        $codes = [];
        $current = $this;
        
        while ($current) {
            array_unshift($codes, $current->kode_akun);
            $current = $current->indukAkun;
        }
        
        return implode('.', $codes);
    }

    // Get account hierarchy name
    public function getFullNamaAttribute()
    {
        $names = [];
        $current = $this;
        
        while ($current) {
            array_unshift($names, $current->nama_akun);
            $current = $current->indukAkun;
        }
        
        return implode(' > ', $names);
    }

    // Check if account is debit normal balance
    public function isDebit()
    {
        return $this->saldo_normal === 'debit';
    }

    // Check if account is credit normal balance
    public function isKredit()
    {
        return $this->saldo_normal === 'kredit';
    }

    // Get balance for period
    public function getBalance($startDate = null, $endDate = null)
    {
        $query = $this->detailJurnal()
            ->whereHas('jurnal', function($q) use ($startDate, $endDate) {
                $q->where('status', 'posted');
                if ($startDate) {
                    $q->where('tanggal_transaksi', '>=', $startDate);
                }
                if ($endDate) {
                    $q->where('tanggal_transaksi', '<=', $endDate);
                }
            });

        $totalDebit = $query->sum('jumlah_debit');
        $totalCredit = $query->sum('jumlah_kredit');

        // Return balance based on normal balance
        if ($this->isDebit()) {
            return $totalDebit - $totalCredit;
        } else {
            return $totalCredit - $totalDebit;
        }
    }
}
