<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('item_categories', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedBigInteger('parent_id')->nullable();
            $table->enum('category_type', ['pharmacy', 'general', 'medical_equipment'])->default('general');
            $table->boolean('is_active')->default(true);
            $table->boolean('requires_batch_tracking')->default(false);
            $table->boolean('requires_expiry_tracking')->default(false);
            $table->json('storage_requirements')->nullable();
            $table->timestamps();
            $table->foreign('parent_id')->references('id')->on('item_categories')->onDelete('set null');
            $table->index(['category_type', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('item_categories');
    }
};
