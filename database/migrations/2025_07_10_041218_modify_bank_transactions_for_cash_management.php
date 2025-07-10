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
        Schema::table('bank_transactions', function (Blueprint $table) {
            // Add kategori_transaksi column for cash management
            $table->string('kategori_transaksi', 100)->nullable()->after('jenis_transaksi');
            
            // Make daftar_akun_lawan_id nullable since it will be set during journal posting
            $table->foreignId('daftar_akun_lawan_id')->nullable()->change();
            
            // Update jenis_transaksi enum to simplified version
            $table->enum('jenis_transaksi', [
                'penerimaan',
                'pengeluaran', 
                'transfer_masuk', 
                'transfer_keluar'
            ])->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bank_transactions', function (Blueprint $table) {
            $table->dropColumn('kategori_transaksi');
            
            $table->foreignId('daftar_akun_lawan_id')->nullable(false)->change();
            
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
            ])->change();
        });
    }
};
