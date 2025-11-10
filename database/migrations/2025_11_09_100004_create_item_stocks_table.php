<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('item_stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->constrained('items')->onDelete('cascade');
            $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();
            // NULL department_id = Central Warehouse
            
            $table->decimal('quantity_on_hand', 15, 3)->default(0); // Stok fisik
            $table->decimal('reserved_quantity', 15, 3)->default(0); // Reserved untuk pending requests
            $table->decimal('available_quantity', 15, 3)->default(0); // on_hand - reserved
            
            $table->decimal('last_unit_cost', 15, 2)->default(0); // Unit cost terakhir (untuk costing)
            $table->decimal('average_unit_cost', 15, 2)->default(0); // Weighted average cost
            $table->decimal('total_value', 15, 2)->default(0); // Total nilai stock (qty * avg cost)
            
            $table->timestamp('last_updated_at')->nullable();
            $table->timestamps();
            
            // Unique constraint
            $table->unique(['item_id', 'department_id']);
            
            // Indexes
            $table->index('item_id');
            $table->index('department_id');
            $table->index('quantity_on_hand');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('item_stocks');
    }
};
