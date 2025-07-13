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
        Schema::create('requisition_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('requisition_id')->constrained('requisitions')->onDelete('cascade');
            $table->foreignId('item_id')->constrained('items')->onDelete('restrict');
            $table->decimal('quantity_requested', 10, 2);
            $table->decimal('quantity_approved', 10, 2)->default(0);
            $table->decimal('estimated_unit_cost', 15, 2)->nullable();
            $table->decimal('estimated_total_cost', 15, 2)->nullable();
            $table->text('purpose')->nullable();
            $table->text('notes')->nullable();
            $table->text('approval_notes')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected', 'partial'])->default('pending');
            $table->timestamps();

            $table->index(['requisition_id', 'status']);
            $table->index('item_id');
            $table->unique(['requisition_id', 'item_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('requisition_items');
    }
};
