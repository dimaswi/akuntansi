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
        // Department Requisitions
        Schema::create('inventory_requisitions', function (Blueprint $table) {
            $table->id();
            $table->string('requisition_number', 30)->unique();
            $table->unsignedBigInteger('department_id'); // references to departments table (to be created)
            $table->unsignedBigInteger('location_id'); // requesting location
            $table->date('request_date');
            $table->date('required_date')->nullable();
            $table->enum('priority_level', ['normal', 'urgent', 'emergency'])->default('normal');
            $table->enum('status', ['draft', 'pending_approval', 'approved', 'partially_fulfilled', 'fulfilled', 'rejected', 'cancelled'])->default('draft');
            $table->text('request_notes')->nullable();
            $table->decimal('total_estimated_cost', 15, 2)->default(0);
            $table->decimal('total_actual_cost', 15, 2)->default(0);
            $table->unsignedBigInteger('requested_by');
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->unsignedBigInteger('fulfilled_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('fulfilled_at')->nullable();
            $table->text('approval_notes')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamps();

            $table->foreign('location_id')->references('id')->on('inventory_locations');
            $table->foreign('requested_by')->references('id')->on('users');
            $table->foreign('approved_by')->references('id')->on('users');
            $table->foreign('fulfilled_by')->references('id')->on('users');
            $table->index(['status', 'request_date']);
            $table->index(['department_id', 'status']);
        });

        // Requisition Items
        Schema::create('inventory_requisition_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('requisition_id');
            $table->unsignedBigInteger('item_id');
            $table->decimal('quantity_requested', 12, 2);
            $table->decimal('quantity_approved', 12, 2)->default(0);
            $table->decimal('quantity_fulfilled', 12, 2)->default(0);
            $table->decimal('unit_cost', 15, 4)->default(0);
            $table->decimal('total_cost', 15, 2)->default(0);
            $table->text('request_notes')->nullable();
            $table->text('approval_notes')->nullable();
            $table->text('fulfillment_notes')->nullable();
            $table->enum('status', ['pending', 'approved', 'partially_fulfilled', 'fulfilled', 'rejected'])->default('pending');
            $table->timestamps();

            $table->foreign('requisition_id')->references('id')->on('inventory_requisitions')->onDelete('cascade');
            $table->foreign('item_id')->references('id')->on('inventory_items');
            $table->index(['requisition_id', 'status']);
        });

        // Stock Count/Opname
        Schema::create('inventory_stock_counts', function (Blueprint $table) {
            $table->id();
            $table->string('count_number', 30)->unique();
            $table->unsignedBigInteger('location_id');
            $table->date('count_date');
            $table->enum('count_type', ['full_count', 'cycle_count', 'spot_count', 'annual_count'])->default('cycle_count');
            $table->enum('status', ['planned', 'in_progress', 'completed', 'approved', 'posted'])->default('planned');
            $table->text('count_notes')->nullable();
            $table->decimal('total_variance_value', 15, 2)->default(0);
            $table->integer('total_items_counted')->default(0);
            $table->integer('items_with_variance')->default(0);
            $table->unsignedBigInteger('counted_by');
            $table->unsignedBigInteger('verified_by')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();

            $table->foreign('location_id')->references('id')->on('inventory_locations');
            $table->foreign('counted_by')->references('id')->on('users');
            $table->foreign('verified_by')->references('id')->on('users');
            $table->foreign('approved_by')->references('id')->on('users');
            $table->index(['count_date', 'status']);
        });

        // Stock Count Items
        Schema::create('inventory_stock_count_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('stock_count_id');
            $table->unsignedBigInteger('item_id');
            $table->string('batch_number', 50)->nullable();
            $table->date('expiry_date')->nullable();
            $table->decimal('system_quantity', 12, 2); // quantity in system
            $table->decimal('counted_quantity', 12, 2)->nullable(); // physical count
            $table->decimal('variance_quantity', 12, 2)->default(0); // counted - system
            $table->decimal('unit_cost', 15, 4)->default(0);
            $table->decimal('variance_value', 15, 2)->default(0); // variance_quantity * unit_cost
            $table->enum('variance_type', ['none', 'overage', 'shortage'])->default('none');
            $table->text('count_notes')->nullable();
            $table->text('variance_reason')->nullable();
            $table->boolean('adjustment_posted')->default(false);
            $table->timestamps();

            $table->foreign('stock_count_id')->references('id')->on('inventory_stock_counts')->onDelete('cascade');
            $table->foreign('item_id')->references('id')->on('inventory_items');
            $table->index(['stock_count_id', 'variance_type']);
        });

        // Suppliers (for purchasing)
        Schema::create('inventory_suppliers', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique();
            $table->string('name');
            $table->text('address')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('contact_person')->nullable();
            $table->string('tax_id', 50)->nullable(); // NPWP
            $table->enum('supplier_type', ['general', 'pharmacy', 'both'])->default('general');
            $table->string('pbf_license_number', 50)->nullable(); // for pharmacy suppliers
            $table->boolean('cold_chain_capable')->default(false);
            $table->boolean('narcotic_license')->default(false);
            $table->integer('payment_terms_days')->default(30);
            $table->decimal('credit_limit', 15, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['supplier_type', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_suppliers');
        Schema::dropIfExists('inventory_stock_count_items');
        Schema::dropIfExists('inventory_stock_counts');
        Schema::dropIfExists('inventory_requisition_items');
        Schema::dropIfExists('inventory_requisitions');
    }
};
