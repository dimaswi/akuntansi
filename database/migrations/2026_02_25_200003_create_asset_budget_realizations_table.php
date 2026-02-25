<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asset_budget_realizations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('budget_item_id')->constrained('asset_budget_items')->cascadeOnDelete();
            $table->foreignId('asset_id')->nullable()->constrained('assets')->nullOnDelete();
            $table->foreignId('purchase_id')->nullable()->constrained('purchases')->nullOnDelete();
            $table->integer('quantity')->default(1);
            $table->decimal('actual_cost', 15, 2)->default(0);
            $table->date('realization_date');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();

            $table->index(['budget_item_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asset_budget_realizations');
    }
};
