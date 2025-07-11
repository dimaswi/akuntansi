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
        Schema::create('monthly_closings', function (Blueprint $table) {
            $table->id();
            $table->integer('periode_tahun'); // 2024, 2025, etc
            $table->integer('periode_bulan'); // 1-12
            $table->date('tanggal_cut_off'); // Tanggal cut off untuk periode ini
            $table->enum('status', ['draft', 'pending_approval', 'approved', 'closed', 'reopened'])->default('draft');
            
            // User tracking
            $table->foreignId('initiated_by')->constrained('users');
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->foreignId('reopened_by')->nullable()->constrained('users');
            
            // Timestamps
            $table->timestamp('closed_at')->nullable();
            $table->timestamp('reopened_at')->nullable();
            
            // Notes and details
            $table->text('closing_notes')->nullable();
            $table->text('reopen_reason')->nullable();
            $table->json('auto_adjustments')->nullable(); // Auto adjustments yang dibuat
            $table->json('closing_summary')->nullable(); // Summary data saat closing
            
            $table->timestamps();
            
            // Indexes
            $table->unique(['periode_tahun', 'periode_bulan']); // One closing per month
            $table->index(['status']);
            $table->index(['tanggal_cut_off']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('monthly_closings');
    }
};
