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
        Schema::create('approval_rules', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Rule name
            $table->string('entity_type'); // 'cash_transaction', 'bank_transaction', 'giro_transaction'
            $table->string('approval_type'); // 'transaction', 'journal_posting', 'monthly_closing'
            $table->boolean('is_active')->default(true);
            
            // Threshold conditions
            $table->decimal('min_amount', 15, 2)->nullable();
            $table->decimal('max_amount', 15, 2)->nullable();
            
            // Approval levels required
            $table->integer('approval_levels')->default(1); // How many levels needed
            $table->json('approver_roles'); // ['supervisor_keuangan', 'manager_keuangan']
            
            // Timing
            $table->integer('escalation_hours')->default(24); // Auto-escalate after X hours
            $table->boolean('auto_approve_weekends')->default(false);
            
            // Conditions
            $table->json('conditions')->nullable(); // Additional conditions
            
            $table->timestamps();
            
            // Indexes
            $table->index(['entity_type', 'approval_type']);
            $table->index(['is_active']);
            $table->index(['min_amount', 'max_amount']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('approval_rules');
    }
};
