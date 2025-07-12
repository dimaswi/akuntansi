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
        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedBigInteger('parent_id')->nullable();
            $table->unsignedBigInteger('manager_id')->nullable();
            $table->string('location')->nullable();
            $table->json('budget_allocation')->nullable(); // budget per kategori
            $table->boolean('is_active')->default(true);
            $table->boolean('can_request_items')->default(true);
            $table->decimal('monthly_budget_limit', 15, 2)->default(0);
            $table->timestamps();

            $table->foreign('parent_id')->references('id')->on('departments')->onDelete('set null');
            $table->foreign('manager_id')->references('id')->on('users')->onDelete('set null');
            $table->index(['is_active', 'can_request_items']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('departments');
    }
};
