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
        Schema::create('giro_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_giro', 50)->unique();
            $table->date('tanggal_terima'); // Tanggal giro diterima/dikeluarkan
            $table->date('tanggal_jatuh_tempo'); // Tanggal jatuh tempo giro
            $table->date('tanggal_cair')->nullable(); // Tanggal giro dicairkan
            $table->enum('jenis_giro', ['masuk', 'keluar']); // Giro yang diterima atau dikeluarkan
            $table->enum('status_giro', [
                'diterima', 
                'diserahkan_ke_bank', 
                'cair', 
                'tolak', 
                'batal'
            ])->default('diterima');
            $table->foreignId('bank_account_id')->constrained('bank_accounts')->onDelete('cascade');
            $table->decimal('jumlah', 15, 2);
            $table->string('nama_penerbit', 200); // Nama yang mengeluarkan giro
            $table->string('bank_penerbit', 100); // Bank penerbit giro
            $table->text('keterangan');
            $table->string('nomor_referensi', 100)->nullable(); // Nomor dokumen terkait
            $table->foreignId('daftar_akun_giro_id')->constrained('daftar_akun')->onDelete('cascade'); // Akun Giro di Tangan / Giro yang Belum Disetor
            $table->foreignId('daftar_akun_lawan_id')->constrained('daftar_akun')->onDelete('cascade');
            $table->foreignId('jurnal_terima_id')->nullable()->constrained('jurnal')->onDelete('set null'); // Jurnal saat terima giro
            $table->foreignId('jurnal_cair_id')->nullable()->constrained('jurnal')->onDelete('set null'); // Jurnal saat giro cair
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->timestamp('posted_at')->nullable();
            $table->foreignId('posted_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            
            $table->index(['nomor_giro', 'status_giro']);
            $table->index(['bank_account_id', 'tanggal_jatuh_tempo']);
            $table->index(['jenis_giro', 'status_giro']);
            $table->index('tanggal_jatuh_tempo');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('giro_transactions');
    }
};
