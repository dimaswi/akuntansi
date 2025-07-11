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
        // Inventory Locations (Warehouses, Departments, etc)
        Schema::create('inventory_locations', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('location_type', ['warehouse', 'pharmacy', 'department', 'sub_department'])->default('warehouse');
            $table->unsignedBigInteger('parent_location_id')->nullable();
            $table->string('address')->nullable();
            $table->string('contact_person')->nullable();
            $table->string('phone')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_main_warehouse')->default(false);
            $table->json('storage_capabilities')->nullable(); // temperature control, security level, etc
            $table->timestamps();

            $table->foreign('parent_location_id')->references('id')->on('inventory_locations')->onDelete('set null');
            $table->index(['location_type', 'is_active']);
        });

        // Current Stock Levels
        Schema::create('inventory_stocks', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('item_id');
            $table->unsignedBigInteger('location_id');
            $table->decimal('current_quantity', 12, 2)->default(0);
            $table->decimal('reserved_quantity', 12, 2)->default(0); // allocated but not yet issued
            $table->decimal('available_quantity', 12, 2)->default(0); // current - reserved
            $table->decimal('average_cost', 15, 4)->default(0); // for FIFO/LIFO calculation
            $table->decimal('total_value', 15, 2)->default(0); // quantity * average_cost
            $table->timestamp('last_movement_at')->nullable();
            $table->timestamps();

            $table->foreign('item_id')->references('id')->on('inventory_items');
            $table->foreign('location_id')->references('id')->on('inventory_locations');
            $table->unique(['item_id', 'location_id']);
            $table->index(['location_id', 'current_quantity']);
        });

        // Stock Movement Transactions
        Schema::create('inventory_movements', function (Blueprint $table) {
            $table->id();
            $table->string('movement_number', 30)->unique();
            $table->unsignedBigInteger('item_id');
            $table->unsignedBigInteger('location_id');
            $table->enum('movement_type', [
                'stock_in', 'stock_out', 'transfer_in', 'transfer_out', 
                'adjustment_plus', 'adjustment_minus', 'return', 'disposal'
            ]);
            $table->enum('transaction_type', [
                'purchase_receipt', 'sales_issue', 'department_requisition', 
                'inter_location_transfer', 'stock_adjustment', 'stock_count',
                'expired_disposal', 'damage_writeoff', 'return_to_supplier'
            ]);
            $table->decimal('quantity', 12, 2);
            $table->decimal('unit_cost', 15, 4)->default(0);
            $table->decimal('total_cost', 15, 2)->default(0);
            $table->string('batch_number', 50)->nullable();
            $table->date('expiry_date')->nullable();
            $table->date('movement_date');
            $table->string('reference_type')->nullable(); // purchase_order, requisition, etc
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->text('notes')->nullable();
            $table->unsignedBigInteger('created_by');
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();

            $table->foreign('item_id')->references('id')->on('inventory_items');
            $table->foreign('location_id')->references('id')->on('inventory_locations');
            $table->foreign('created_by')->references('id')->on('users');
            $table->foreign('approved_by')->references('id')->on('users');
            $table->index(['movement_date', 'movement_type']);
            $table->index(['reference_type', 'reference_id']);
        });

        // Batch/Lot Tracking for Pharmacy Items
        Schema::create('inventory_batches', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('item_id');
            $table->unsignedBigInteger('location_id');
            $table->string('batch_number', 50);
            $table->date('expiry_date')->nullable();
            $table->date('manufacturing_date')->nullable();
            $table->string('supplier_batch_number', 50)->nullable();
            $table->decimal('current_quantity', 12, 2)->default(0);
            $table->decimal('original_quantity', 12, 2);
            $table->decimal('unit_cost', 15, 4);
            $table->string('supplier_name')->nullable();
            $table->text('quality_notes')->nullable();
            $table->enum('status', ['active', 'quarantine', 'expired', 'recalled'])->default('active');
            $table->timestamps();

            $table->foreign('item_id')->references('id')->on('inventory_items');
            $table->foreign('location_id')->references('id')->on('inventory_locations');
            $table->unique(['item_id', 'location_id', 'batch_number', 'expiry_date'], 'unique_batch_per_location');
            $table->index(['expiry_date', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_batches');
        Schema::dropIfExists('inventory_movements');
        Schema::dropIfExists('inventory_stocks');
        Schema::dropIfExists('inventory_locations');
    }
};
