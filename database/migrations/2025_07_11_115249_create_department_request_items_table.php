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
        Schema::create('department_request_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('request_id');
            $table->unsignedBigInteger('item_id')->nullable(); // nullable untuk custom items
            $table->string('item_name'); // untuk custom items yang belum ada di inventory
            $table->string('item_description')->nullable();
            $table->decimal('quantity_requested', 10, 2);
            $table->string('unit_of_measure', 20);
            $table->decimal('estimated_unit_cost', 15, 2)->default(0);
            $table->decimal('estimated_total_cost', 15, 2)->default(0);
            
            // Approval details
            $table->decimal('quantity_approved', 10, 2)->nullable();
            $table->decimal('approved_unit_cost', 15, 2)->nullable();
            $table->decimal('approved_total_cost', 15, 2)->nullable();
            $table->text('approval_notes')->nullable();
            
            // Fulfillment tracking
            $table->decimal('quantity_fulfilled', 10, 2)->default(0);
            $table->decimal('actual_unit_cost', 15, 2)->nullable();
            $table->decimal('actual_total_cost', 15, 2)->nullable();
            $table->date('fulfilled_date')->nullable();
            $table->text('fulfillment_notes')->nullable();
            
            // Status per item
            $table->enum('status', ['pending', 'approved', 'rejected', 'partially_fulfilled', 'fulfilled'])->default('pending');
            
            $table->timestamps();

            $table->foreign('request_id')->references('id')->on('department_requests')->onDelete('cascade');
            $table->foreign('item_id')->references('id')->on('inventory_items')->onDelete('set null');
            
            $table->index(['request_id', 'status']);
            $table->index(['item_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('department_request_items');
    }
};
