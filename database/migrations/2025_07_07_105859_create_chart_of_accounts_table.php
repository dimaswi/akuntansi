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
        Schema::create('daftar_akun', function (Blueprint $table) {
            $table->id();
            $table->string('kode_akun', 20)->unique(); // 1100, 2100, dll
            $table->string('nama_akun'); // Kas dan Bank, Hutang Usaha, dll
            $table->enum('jenis_akun', [
                'aset', 'kewajiban', 'modal', 'pendapatan', 'beban'
            ]);
            $table->enum('sub_jenis', [
                'aset_lancar', 'aset_tetap', 'aset_lainnya',
                'kewajiban_lancar', 'kewajiban_jangka_panjang',
                'modal_saham', 'laba_ditahan',
                'pendapatan_usaha', 'pendapatan_lainnya',
                'harga_pokok_penjualan', 'beban_usaha', 'beban_lainnya'
            ]);
            $table->enum('saldo_normal', ['debit', 'kredit']);
            $table->unsignedBigInteger('induk_akun_id')->nullable();
            $table->integer('level')->default(1); // 1=akun utama, 2=sub akun, dll
            $table->boolean('is_aktif')->default(true);
            $table->text('keterangan')->nullable();
            $table->timestamps();

            $table->foreign('induk_akun_id')->references('id')->on('daftar_akun')->onDelete('cascade');
            $table->index(['jenis_akun', 'is_aktif']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daftar_akun');
    }
};
