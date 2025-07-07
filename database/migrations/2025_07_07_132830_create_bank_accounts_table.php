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
        Schema::create('bank_accounts', function (Blueprint $table) {
            $table->id();
            $table->string('kode_rekening', 20)->unique();
            $table->string('nama_bank', 100);
            $table->string('nama_rekening', 150);
            $table->string('nomor_rekening', 50);
            $table->string('cabang', 100)->nullable();
            $table->decimal('saldo_awal', 15, 2)->default(0);
            $table->decimal('saldo_berjalan', 15, 2)->default(0);
            $table->foreignId('daftar_akun_id')->constrained('daftar_akun')->onDelete('cascade');
            $table->enum('jenis_rekening', ['giro', 'tabungan', 'deposito', 'kredit'])->default('giro');
            $table->text('keterangan')->nullable();
            $table->boolean('is_aktif')->default(true);
            $table->timestamps();
            
            $table->index(['kode_rekening', 'is_aktif']);
            $table->index('daftar_akun_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bank_accounts');
    }
};
