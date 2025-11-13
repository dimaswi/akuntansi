<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('salary_details', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('salary_batch_id');
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('nip')->nullable();
            $table->string('nama_pegawai');
            $table->string('nomor_whatsapp')->nullable();

            // Komponen Pendapatan
            $table->decimal('gaji_pokok', 15, 2)->default(0);
            $table->decimal('tunjangan_sia', 15, 2)->default(0);
            $table->decimal('tunjangan_transportasi', 15, 2)->default(0);
            $table->decimal('tunjangan_jabatan', 15, 2)->default(0);
            $table->decimal('uang_jaga_utama', 15, 2)->default(0);
            $table->decimal('uang_jaga_pratama', 15, 2)->default(0);
            $table->decimal('jasa_pelayanan_pratama', 15, 2)->default(0);
            $table->decimal('jasa_pelayanan_rawat_inap', 15, 2)->default(0);
            $table->decimal('jasa_pelayanan_rawat_jalan', 15, 2)->default(0);
            $table->decimal('tugas_tambahan', 15, 2)->default(0);
            $table->decimal('total_pendapatan', 15, 2)->default(0);

            // Komponen Potongan
            $table->decimal('pph_21', 15, 2)->default(0);
            $table->decimal('infaq', 15, 2)->default(0);
            $table->decimal('bpjs_kesehatan', 15, 2)->default(0);
            $table->decimal('bpjs_ketenagakerjaan', 15, 2)->default(0);
            $table->decimal('denda_absen', 15, 2)->default(0);
            $table->decimal('arisan_keluarga', 15, 2)->default(0);
            $table->decimal('denda_ngaji', 15, 2)->default(0);
            $table->decimal('kasbon', 15, 2)->default(0);
            $table->decimal('total_potongan', 15, 2)->default(0);

            $table->decimal('gaji_bersih', 15, 2)->default(0);
            
            $table->timestamps();

            $table->foreign('salary_batch_id')->references('id')->on('salary_batches')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            
            $table->index('salary_batch_id');
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('salary_details');
    }
};
