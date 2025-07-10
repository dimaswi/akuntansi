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
        Schema::table('cash_transactions', function (Blueprint $table) {
            // Cek apakah kolom kategori_transaksi belum ada
            if (!Schema::hasColumn('cash_transactions', 'kategori_transaksi')) {
                $table->string('kategori_transaksi', 100)->after('jenis_transaksi');
            }
            
            // Ubah daftar_akun_lawan_id menjadi nullable (karena akan diisi saat posting)
            $table->unsignedBigInteger('daftar_akun_lawan_id')->nullable()->change();
            
            // Ubah enum jenis_transaksi untuk menyederhanakan workflow
            $table->enum('jenis_transaksi', ['penerimaan', 'pengeluaran'])->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cash_transactions', function (Blueprint $table) {
            // Hapus kolom kategori_transaksi
            $table->dropColumn('kategori_transaksi');
            
            // Kembalikan daftar_akun_lawan_id menjadi not null
            $table->unsignedBigInteger('daftar_akun_lawan_id')->nullable(false)->change();
            
            // Kembalikan enum jenis_transaksi
            $table->enum('jenis_transaksi', [
                'penerimaan', 'pengeluaran', 'uang_muka_penerimaan',
                'uang_muka_pengeluaran', 'transfer_masuk', 'transfer_keluar'
            ])->change();
        });
    }
};
