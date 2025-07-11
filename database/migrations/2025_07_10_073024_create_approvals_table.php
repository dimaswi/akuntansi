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
        Schema::create('approvals', function (Blueprint $table) {
            $table->id();
            $table->morphs('approvable'); // approvable_type, approvable_id
            $table->string('approval_type'); // 'transaction', 'journal_posting', 'monthly_closing'
            $table->enum('status', ['pending', 'approved', 'rejected', 'escalated'])->default('pending');
            $table->decimal('amount', 15, 2)->nullable(); // For threshold-based approval
            $table->json('approval_rules')->nullable(); // Rules that apply to this approval
            
            // Approval workflow
            $table->integer('approval_level')->default(1); // 1, 2, 3 for multi-level
            $table->boolean('requires_approval')->default(true);
            $table->timestamp('expires_at')->nullable(); // Auto-escalation
            
            // User tracking
            $table->foreignId('requested_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable();
            
            // Comments and notes
            $table->text('request_notes')->nullable();
            $table->text('approval_notes')->nullable();
            $table->text('rejection_reason')->nullable();
            
            // Escalation
            $table->foreignId('escalated_to')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('escalated_at')->nullable();
            
            $table->timestamps();
            
            // Indexes
            $table->index(['status', 'approval_level']);
            $table->index(['requested_by', 'status']);
            $table->index(['approved_by', 'approved_at']);
            $table->index(['expires_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('approvals');
    }
};
