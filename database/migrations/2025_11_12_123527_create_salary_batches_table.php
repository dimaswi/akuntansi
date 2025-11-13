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
        Schema::create('salary_batches', function (Blueprint $table) {
            $table->id();
            $table->string('batch_number')->unique();
            $table->integer('period_month'); // 1-12
            $table->integer('period_year'); // 2025
            $table->string('description')->nullable();
            $table->integer('total_employees')->default(0);
            $table->decimal('total_pendapatan', 15, 2)->default(0);
            $table->decimal('total_potongan', 15, 2)->default(0);
            $table->decimal('total_gaji_bersih', 15, 2)->default(0);
            $table->enum('status', ['draft', 'posted'])->default('draft');
            $table->unsignedBigInteger('payment_account_id'); // Akun untuk pembayaran gaji (kredit)
            $table->unsignedBigInteger('journal_id')->nullable();
            $table->unsignedBigInteger('created_by');
            $table->unsignedBigInteger('posted_by')->nullable();
            $table->timestamp('posted_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('payment_account_id')->references('id')->on('daftar_akun')->onDelete('restrict');
            $table->foreign('journal_id')->references('id')->on('jurnal')->onDelete('set null');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('posted_by')->references('id')->on('users')->onDelete('set null');
            
            $table->index(['period_year', 'period_month']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('salary_batches');
    }
};
