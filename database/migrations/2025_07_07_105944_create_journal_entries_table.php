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
        Schema::create('jurnal', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_jurnal')->unique(); // JE-2025-0001
            $table->date('tanggal_transaksi');
            $table->string('jenis_referensi')->nullable(); // invoice, payment, dll
            $table->string('nomor_referensi')->nullable();
            $table->text('keterangan');
            $table->decimal('total_debit', 15, 2);
            $table->decimal('total_kredit', 15, 2);
            $table->enum('status', ['draft', 'posted', 'reversed'])->default('draft');
            $table->foreignId('dibuat_oleh')->constrained('users');
            $table->foreignId('diposting_oleh')->nullable()->constrained('users');
            $table->timestamp('tanggal_posting')->nullable();
            $table->timestamps();

            $table->index(['tanggal_transaksi', 'status']);
            $table->index('nomor_referensi');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('jurnal');
    }
};
