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
        Schema::table('giro_transactions', function (Blueprint $table) {
            // Add status for draft/posted workflow like cash and bank transactions
            $table->enum('status', ['draft', 'posted'])->default('draft')->after('status_giro');
            
            // Make daftar_akun_lawan_id nullable for flexibility
            $table->foreignId('daftar_akun_lawan_id')->nullable()->change();
            
            // Add workflow fields
            $table->json('posting_batch_data')->nullable()->after('posted_by'); // For batch posting
            $table->text('posting_notes')->nullable()->after('posting_batch_data'); // Notes for posting
            
            // Update index for new status column
            $table->index(['status', 'jenis_giro']);
            $table->index(['status', 'status_giro']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('giro_transactions', function (Blueprint $table) {
            $table->dropColumn(['status', 'posting_batch_data', 'posting_notes']);
            $table->dropIndex(['status', 'jenis_giro']);
            $table->dropIndex(['status', 'status_giro']);
            
            // Revert daftar_akun_lawan_id to not nullable
            $table->foreignId('daftar_akun_lawan_id')->nullable(false)->change();
        });
    }
};
