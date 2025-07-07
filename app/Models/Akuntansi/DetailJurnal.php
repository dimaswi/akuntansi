<?php

namespace App\Models\Akuntansi;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DetailJurnal extends Model
{
    protected $table = 'detail_jurnal';

    protected $fillable = [
        'jurnal_id',
        'daftar_akun_id',
        'jumlah_debit',
        'jumlah_kredit',
        'keterangan'
    ];

    protected $casts = [
        'jumlah_debit' => 'decimal:2',
        'jumlah_kredit' => 'decimal:2'
    ];

    // Relasi ke jurnal
    public function jurnal(): BelongsTo
    {
        return $this->belongsTo(Jurnal::class, 'jurnal_id');
    }

    // Relasi ke daftar akun
    public function daftarAkun(): BelongsTo
    {
        return $this->belongsTo(DaftarAkun::class, 'daftar_akun_id');
    }

    // Scope untuk debit entries
    public function scopeDebit($query)
    {
        return $query->where('jumlah_debit', '>', 0);
    }

    // Scope untuk credit entries
    public function scopeKredit($query)
    {
        return $query->where('jumlah_kredit', '>', 0);
    }

    // Get amount (debit atau kredit yang tidak nol)
    public function getJumlahAttribute()
    {
        return $this->jumlah_debit > 0 ? $this->jumlah_debit : $this->jumlah_kredit;
    }

    // Check if entry is debit
    public function isDebit()
    {
        return $this->jumlah_debit > 0;
    }

    // Check if entry is kredit
    public function isKredit()
    {
        return $this->jumlah_kredit > 0;
    }

    // Get entry type (debit/kredit)
    public function getJenisAttribute()
    {
        return $this->isDebit() ? 'debit' : 'kredit';
    }
}
