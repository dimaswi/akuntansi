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
        Schema::create('cash_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_transaksi', 30)->unique();
            $table->date('tanggal_transaksi');
            $table->enum('jenis_transaksi', [
                'penerimaan', 
                'pengeluaran', 
                'uang_muka_penerimaan', 
                'uang_muka_pengeluaran',
                'transfer_masuk',
                'transfer_keluar'
            ]);
            $table->decimal('jumlah', 15, 2);
            $table->text('keterangan');
            $table->string('pihak_terkait', 200)->nullable(); // Nama penerima/pemberi
            $table->string('referensi', 100)->nullable(); // Nomor referensi external
            $table->foreignId('daftar_akun_kas_id')->constrained('daftar_akun')->onDelete('cascade');
            $table->foreignId('daftar_akun_lawan_id')->constrained('daftar_akun')->onDelete('cascade');
            $table->foreignId('jurnal_id')->nullable()->constrained('jurnal')->onDelete('set null');
            $table->enum('status', ['draft', 'posted', 'cancelled'])->default('draft');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->timestamp('posted_at')->nullable();
            $table->foreignId('posted_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            
            $table->index(['nomor_transaksi', 'status']);
            $table->index(['tanggal_transaksi', 'jenis_transaksi']);
            $table->index('jurnal_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cash_transactions');
    }
};
