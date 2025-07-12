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
        Schema::create('department_stock_movements', function (Blueprint $table) {
            $table->id();
            $table->string('movement_number')->unique(); // auto-generated
            $table->unsignedBigInteger('department_id');
            $table->unsignedBigInteger('inventory_item_id');
            $table->enum('movement_type', ['stock_opname', 'adjustment', 'transfer_in', 'transfer_out', 'usage', 'return', 'disposal']);
            $table->decimal('quantity_before', 12, 2);
            $table->decimal('quantity_change', 12, 2); // bisa positif atau negatif
            $table->decimal('quantity_after', 12, 2);
            $table->decimal('unit_cost', 15, 2)->default(0);
            $table->decimal('total_cost', 15, 2)->default(0);
            $table->string('batch_number')->nullable();
            $table->date('expiry_date')->nullable();
            $table->text('reference_number')->nullable(); // nomor referensi (PO, transfer, dll)
            $table->text('notes')->nullable();
            $table->unsignedBigInteger('created_by');
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();

            // Foreign keys
            $table->foreign('department_id', 'dept_stock_mov_dept_id_fk')
                  ->references('id')->on('departments')->onDelete('cascade');
            $table->foreign('inventory_item_id', 'dept_stock_mov_item_id_fk')
                  ->references('id')->on('inventory_items')->onDelete('cascade');
            $table->foreign('created_by', 'dept_stock_mov_created_by_fk')
                  ->references('id')->on('users');
            $table->foreign('approved_by', 'dept_stock_mov_approved_by_fk')
                  ->references('id')->on('users');

            // Indexes
            $table->index(['department_id', 'movement_type'], 'dept_stock_mov_dept_type_idx');
            $table->index(['inventory_item_id', 'created_at'], 'dept_stock_mov_item_date_idx');
            $table->index(['movement_type', 'created_at'], 'dept_stock_mov_type_date_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('department_stock_movements');
    }
};
