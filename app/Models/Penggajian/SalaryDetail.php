<?php

namespace App\Models\Penggajian;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalaryDetail extends Model
{
    protected $fillable = [
        'salary_batch_id',
        'user_id',
        'nip',
        'nama_pegawai',
        'nomor_whatsapp',
        // Pendapatan
        'gaji_pokok',
        'tunjangan_sia',
        'tunjangan_transportasi',
        'tunjangan_jabatan',
        'uang_jaga_utama',
        'uang_jaga_pratama',
        'jasa_pelayanan_pratama',
        'jasa_pelayanan_rawat_inap',
        'jasa_pelayanan_rawat_jalan',
        'tugas_tambahan',
        'total_pendapatan',
        // Potongan
        'pph_21',
        'infaq',
        'bpjs_kesehatan',
        'bpjs_ketenagakerjaan',
        'denda_absen',
        'arisan_keluarga',
        'denda_ngaji',
        'kasbon',
        'total_potongan',
        // Total
        'gaji_bersih',
    ];

    protected $casts = [
        'gaji_pokok' => 'decimal:2',
        'tunjangan_sia' => 'decimal:2',
        'tunjangan_transportasi' => 'decimal:2',
        'tunjangan_jabatan' => 'decimal:2',
        'uang_jaga_utama' => 'decimal:2',
        'uang_jaga_pratama' => 'decimal:2',
        'jasa_pelayanan_pratama' => 'decimal:2',
        'jasa_pelayanan_rawat_inap' => 'decimal:2',
        'jasa_pelayanan_rawat_jalan' => 'decimal:2',
        'tugas_tambahan' => 'decimal:2',
        'total_pendapatan' => 'decimal:2',
        'pph_21' => 'decimal:2',
        'infaq' => 'decimal:2',
        'bpjs_kesehatan' => 'decimal:2',
        'bpjs_ketenagakerjaan' => 'decimal:2',
        'denda_absen' => 'decimal:2',
        'arisan_keluarga' => 'decimal:2',
        'denda_ngaji' => 'decimal:2',
        'kasbon' => 'decimal:2',
        'total_potongan' => 'decimal:2',
        'gaji_bersih' => 'decimal:2',
    ];

    /**
     * Calculate totals before saving
     */
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($detail) {
            $detail->calculateTotals();
        });
    }

    /**
     * Calculate total pendapatan, potongan, and gaji bersih
     */
    public function calculateTotals(): void
    {
        $this->total_pendapatan = 
            $this->gaji_pokok +
            $this->tunjangan_sia +
            $this->tunjangan_transportasi +
            $this->tunjangan_jabatan +
            $this->uang_jaga_utama +
            $this->uang_jaga_pratama +
            $this->jasa_pelayanan_pratama +
            $this->jasa_pelayanan_rawat_inap +
            $this->jasa_pelayanan_rawat_jalan +
            $this->tugas_tambahan;

        $this->total_potongan =
            $this->pph_21 +
            $this->infaq +
            $this->bpjs_kesehatan +
            $this->bpjs_ketenagakerjaan +
            $this->denda_absen +
            $this->arisan_keluarga +
            $this->denda_ngaji +
            $this->kasbon;

        $this->gaji_bersih = $this->total_pendapatan - $this->total_potongan;
    }

    // Relationships
    public function salaryBatch(): BelongsTo
    {
        return $this->belongsTo(SalaryBatch::class, 'salary_batch_id');
    }

    // Alias untuk backward compatibility
    public function batch(): BelongsTo
    {
        return $this->salaryBatch();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
