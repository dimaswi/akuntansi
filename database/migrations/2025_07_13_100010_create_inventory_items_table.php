<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('category_id');
            $table->unsignedBigInteger('supplier_id')->nullable();
            $table->string('code', 30)->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('inventory_type', ['pharmacy', 'general'])->default('general');
            $table->string('unit_of_measure', 20);
            $table->integer('pack_size')->default(1);
            $table->decimal('reorder_level', 10, 2)->default(0);
            $table->decimal('max_level', 10, 2)->default(0);
            $table->decimal('safety_stock', 10, 2)->default(0);
            $table->decimal('standard_cost', 15, 2)->default(0);
            $table->decimal('last_purchase_cost', 15, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->boolean('requires_approval')->default(false);
            $table->boolean('is_controlled_substance')->default(false);
            $table->boolean('requires_prescription')->default(false);
            $table->json('specifications')->nullable();
            $table->timestamps();
            $table->foreign('category_id')->references('id')->on('item_categories');
            $table->foreign('supplier_id')->references('id')->on('suppliers')->nullOnDelete();
            $table->index(['inventory_type', 'is_active']);
            $table->index(['code', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('items');
    }
};
