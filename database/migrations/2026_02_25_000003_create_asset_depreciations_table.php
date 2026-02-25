<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asset_depreciations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asset_id')->constrained('assets')->cascadeOnDelete();
            $table->date('period_date'); // tanggal periode penyusutan (akhir bulan)
            $table->integer('period_number'); // urutan periode ke-n
            $table->decimal('depreciation_amount', 15, 2);
            $table->decimal('accumulated_depreciation', 15, 2);
            $table->decimal('book_value', 15, 2);
            $table->string('method', 30); // metode yang digunakan
            $table->foreignId('jurnal_id')->nullable()->constrained('jurnal')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();

            $table->unique(['asset_id', 'period_date']);
            $table->index(['period_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asset_depreciations');
    }
};
