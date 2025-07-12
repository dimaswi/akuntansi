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
        Schema::create('department_requests', function (Blueprint $table) {
            $table->id();
            $table->string('request_number', 50)->unique();
            $table->unsignedBigInteger('department_id');
            $table->unsignedBigInteger('requested_by');
            $table->date('request_date');
            $table->date('needed_date');
            $table->enum('priority', ['low', 'normal', 'high', 'urgent'])->default('normal');
            $table->enum('status', ['draft', 'submitted', 'approved', 'rejected', 'partially_fulfilled', 'fulfilled', 'cancelled'])->default('draft');
            $table->text('purpose')->nullable(); // tujuan penggunaan
            $table->text('justification')->nullable(); // justifikasi kebutuhan
            $table->text('notes')->nullable();
            $table->decimal('total_estimated_cost', 15, 2)->default(0);
            $table->decimal('approved_budget', 15, 2)->nullable();
            
            // Approval workflow
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->text('approval_notes')->nullable();
            
            // Fulfillment tracking
            $table->unsignedBigInteger('fulfilled_by')->nullable();
            $table->timestamp('fulfilled_at')->nullable();
            $table->decimal('actual_cost', 15, 2)->nullable();
            
            $table->timestamps();

            $table->foreign('department_id')->references('id')->on('departments');
            $table->foreign('requested_by')->references('id')->on('users');
            $table->foreign('approved_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('fulfilled_by')->references('id')->on('users')->onDelete('set null');
            
            $table->index(['department_id', 'status']);
            $table->index(['request_date', 'status']);
            $table->index(['needed_date', 'priority']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('department_requests');
    }
};
