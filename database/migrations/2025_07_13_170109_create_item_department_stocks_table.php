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
        Schema::create('item_department_stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->constrained('items')->onDelete('cascade');
            $table->foreignId('department_id')->constrained('departments')->onDelete('cascade');
            $table->decimal('current_stock', 10, 2)->default(0);
            $table->decimal('reserved_stock', 10, 2)->default(0); // Stock yang sudah di-requisition tapi belum disetujui
            $table->decimal('available_stock', 10, 2)->default(0); // current_stock - reserved_stock
            $table->decimal('minimum_stock', 10, 2)->default(0); // Minimum stock level per departemen
            $table->decimal('maximum_stock', 10, 2)->default(0); // Maximum stock level per departemen
            $table->timestamps();
            
            // Unique constraint: satu item hanya bisa ada satu record per departemen
            $table->unique(['item_id', 'department_id']);
            
            // Indexes for better performance
            $table->index(['department_id', 'current_stock']);
            $table->index(['item_id', 'current_stock']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('item_department_stocks');
    }
};
