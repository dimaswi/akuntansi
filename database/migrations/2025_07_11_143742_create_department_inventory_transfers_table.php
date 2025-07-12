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
        Schema::create('department_inventory_transfers', function (Blueprint $table) {
            $table->id();
            $table->string('transfer_number', 50)->unique();
            $table->unsignedBigInteger('department_request_id'); // references department_requests
            $table->unsignedBigInteger('from_department_id');
            $table->unsignedBigInteger('to_department_id');
            $table->unsignedBigInteger('from_location_id');
            $table->unsignedBigInteger('to_location_id');
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->unsignedBigInteger('transferred_by')->nullable();
            $table->unsignedBigInteger('received_by')->nullable();
            $table->enum('status', ['pending', 'approved', 'in_transit', 'completed', 'cancelled'])->default('pending');
            $table->text('notes')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('transferred_at')->nullable();
            $table->timestamp('received_at')->nullable();
            $table->timestamps();

            $table->foreign('department_request_id')->references('id')->on('department_requests')->onDelete('cascade');
            $table->foreign('from_department_id')->references('id')->on('departments');
            $table->foreign('to_department_id')->references('id')->on('departments');
            $table->foreign('from_location_id')->references('id')->on('inventory_locations');
            $table->foreign('to_location_id')->references('id')->on('inventory_locations');
            $table->foreign('approved_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('transferred_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('received_by')->references('id')->on('users')->onDelete('set null');

            $table->index(['from_department_id', 'status']);
            $table->index(['to_department_id', 'status']);
            $table->index(['status', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('department_inventory_transfers');
    }
};
