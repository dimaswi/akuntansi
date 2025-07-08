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
        Schema::create('bank_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_transaksi', 30)->unique();
            $table->date('tanggal_transaksi');
            $table->date('tanggal_efektif')->nullable(); // Tanggal efektif di bank
            $table->enum('jenis_transaksi', [
                'setoran', 
                'penarikan', 
                'transfer_masuk', 
                'transfer_keluar',
                'kliring_masuk',
                'kliring_keluar',
                'bunga_bank',
                'biaya_admin',
                'pajak_bunga'
            ]);
            $table->foreignId('bank_account_id')->constrained('bank_accounts')->onDelete('cascade');
            $table->decimal('jumlah', 15, 2);
            $table->text('keterangan');
            $table->string('nomor_referensi', 100)->nullable(); // Nomor slip, cek, dll
            $table->string('pihak_terkait', 200)->nullable(); // Nama penerima/pengirim
            $table->foreignId('daftar_akun_lawan_id')->constrained('daftar_akun')->onDelete('cascade');
            $table->foreignId('jurnal_id')->nullable()->constrained('jurnal')->onDelete('set null');
            $table->enum('status', ['draft', 'posted', 'reconciled', 'cancelled'])->default('draft');
            $table->boolean('is_reconciled')->default(false);
            $table->date('tanggal_rekonsiliasi')->nullable();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->timestamp('posted_at')->nullable();
            $table->foreignId('posted_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            
            $table->index(['nomor_transaksi', 'status']);
            $table->index(['bank_account_id', 'tanggal_transaksi']);
            $table->index(['tanggal_transaksi', 'jenis_transaksi']);
            $table->index('jurnal_id');
            $table->index('is_reconciled');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bank_transactions');
    }
};
