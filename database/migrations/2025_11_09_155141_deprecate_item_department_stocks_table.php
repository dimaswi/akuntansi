<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Deprecate old item_department_stocks table
     * All stock now managed via item_stocks (with department_id nullable for central)
     */
    public function up(): void
    {
        // Drop old table - data should be migrated to item_stocks first if needed
        Schema::dropIfExists('item_department_stocks');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Recreate table if rollback needed
        Schema::create('item_department_stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->constrained('items')->onDelete('cascade');
            $table->foreignId('department_id')->constrained('departments')->onDelete('cascade');
            $table->decimal('current_stock', 10, 2)->default(0);
            $table->decimal('reserved_stock', 10, 2)->default(0);
            $table->decimal('available_stock', 10, 2)->default(0);
            $table->decimal('minimum_stock', 10, 2)->default(0);
            $table->decimal('maximum_stock', 10, 2)->default(0);
            $table->timestamps();
            $table->unique(['item_id', 'department_id']);
            $table->index(['department_id', 'current_stock']);
            $table->index(['item_id', 'current_stock']);
        });
    }
};
