<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asset_budget_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asset_budget_id')->constrained('asset_budgets')->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained('asset_categories')->nullOnDelete();
            $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->string('item_name');
            $table->text('description')->nullable();
            $table->integer('quantity')->default(1);
            $table->decimal('estimated_unit_cost', 15, 2)->default(0);
            $table->decimal('estimated_total_cost', 15, 2)->default(0);
            $table->enum('priority', ['high', 'medium', 'low'])->default('medium');
            $table->enum('status', [
                'pending',
                'partially_realized',
                'realized',
                'rolled_over',
                'cancelled',
            ])->default('pending');
            $table->integer('realized_quantity')->default(0);
            $table->decimal('realized_amount', 15, 2)->default(0);
            $table->date('realized_at')->nullable();
            $table->foreignId('rolled_from_id')->nullable()->constrained('asset_budget_items')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['asset_budget_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asset_budget_items');
    }
};
