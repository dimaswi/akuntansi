<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asset_budgets', function (Blueprint $table) {
            $table->id();
            $table->string('code', 30)->unique(); // RAB-2026-001
            $table->year('fiscal_year');
            $table->string('title');
            $table->text('description')->nullable();
            $table->decimal('total_budget', 15, 2)->default(0);
            $table->decimal('total_realized', 15, 2)->default(0);
            $table->enum('status', ['draft', 'submitted', 'approved', 'closed'])->default('draft');
            $table->foreignId('submitted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->datetime('submitted_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->datetime('approved_at')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['fiscal_year', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asset_budgets');
    }
};
