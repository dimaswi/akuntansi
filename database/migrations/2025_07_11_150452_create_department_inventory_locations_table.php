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
        Schema::create('department_inventory_locations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('department_id');
            $table->unsignedBigInteger('inventory_item_id');
            $table->decimal('current_stock', 12, 2)->default(0);
            $table->decimal('minimum_stock', 12, 2)->default(0);
            $table->decimal('maximum_stock', 12, 2)->default(0);
            $table->decimal('reserved_stock', 12, 2)->default(0); // untuk pending requests
            $table->decimal('average_cost', 15, 2)->default(0);
            $table->string('location_code')->nullable(); // kode lokasi dalam departemen
            $table->string('rack_position')->nullable(); // posisi rak
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            // Foreign keys
            $table->foreign('department_id', 'dept_inv_loc_dept_id_fk')
                  ->references('id')->on('departments')->onDelete('cascade');
            $table->foreign('inventory_item_id', 'dept_inv_loc_item_id_fk')
                  ->references('id')->on('inventory_items')->onDelete('cascade');

            // Unique constraint - satu item hanya bisa ada satu lokasi per departemen
            $table->unique(['department_id', 'inventory_item_id'], 'dept_inv_loc_unique');
            
            // Indexes
            $table->index(['department_id', 'is_active'], 'dept_inv_loc_dept_active_idx');
            $table->index(['inventory_item_id', 'current_stock'], 'dept_inv_loc_item_stock_idx');
            $table->index(['current_stock', 'minimum_stock'], 'dept_inv_loc_stock_level_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('department_inventory_locations');
    }
};
