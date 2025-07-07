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
        Schema::create('detail_jurnal', function (Blueprint $table) {
            $table->id();
            $table->foreignId('jurnal_id')->constrained('jurnal')->onDelete('cascade');
            $table->foreignId('daftar_akun_id')->constrained('daftar_akun');
            $table->decimal('jumlah_debit', 15, 2)->default(0);
            $table->decimal('jumlah_kredit', 15, 2)->default(0);
            $table->text('keterangan')->nullable();
            $table->timestamps();

            $table->index(['jurnal_id', 'daftar_akun_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('detail_jurnal');
    }
};
