<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('general_item_details', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('item_id');
            $table->boolean('is_consumable')->default(false);
            $table->boolean('is_returnable')->default(false);
            $table->boolean('requires_maintenance')->default(false);
            $table->integer('warranty_months')->nullable();
            $table->text('usage_instructions')->nullable();
            $table->json('department_restrictions')->nullable();
            $table->timestamps();
            $table->foreign('item_id')->references('id')->on('items')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('general_item_details');
    }
};
