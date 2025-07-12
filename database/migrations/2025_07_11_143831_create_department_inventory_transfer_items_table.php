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
        Schema::create('department_inventory_transfer_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('transfer_id');
            $table->unsignedBigInteger('department_request_item_id'); // references the original request item
            $table->unsignedBigInteger('inventory_item_id');
            $table->decimal('quantity_requested', 10, 2);
            $table->decimal('quantity_approved', 10, 2)->nullable();
            $table->decimal('quantity_transferred', 10, 2)->default(0);
            $table->decimal('quantity_received', 10, 2)->default(0);
            $table->decimal('unit_cost', 15, 2)->default(0);
            $table->decimal('total_cost', 15, 2)->default(0);
            $table->string('batch_number')->nullable();
            $table->date('expiry_date')->nullable();
            $table->text('notes')->nullable();
            $table->enum('status', ['pending', 'approved', 'transferred', 'received', 'cancelled'])->default('pending');
            $table->timestamps();

            $table->foreign('transfer_id', 'dept_inv_transfer_items_transfer_id_fk')
                  ->references('id')->on('department_inventory_transfers')->onDelete('cascade');
            $table->foreign('department_request_item_id', 'dept_inv_transfer_items_req_item_id_fk')
                  ->references('id')->on('department_request_items')->onDelete('cascade');
            $table->foreign('inventory_item_id', 'dept_inv_transfer_items_inv_item_id_fk')
                  ->references('id')->on('inventory_items');

            $table->index(['transfer_id', 'status'], 'dept_inv_transfer_items_transfer_status_idx');
            $table->index(['inventory_item_id', 'status'], 'dept_inv_transfer_items_item_status_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('department_inventory_transfer_items');
    }
};
