<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pharmacy_item_details', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('item_id');
            $table->string('bpom_registration', 50)->nullable();
            $table->string('manufacturer')->nullable();
            $table->string('generic_name')->nullable();
            $table->string('strength')->nullable();
            $table->string('dosage_form')->nullable();
            $table->enum('drug_classification', ['narkotika', 'psikotropika', 'keras', 'bebas_terbatas', 'bebas'])->nullable();
            $table->string('atc_code', 10)->nullable();
            $table->text('contraindications')->nullable();
            $table->json('drug_interactions')->nullable();
            $table->decimal('storage_temp_min', 5, 2)->nullable();
            $table->decimal('storage_temp_max', 5, 2)->nullable();
            $table->integer('minimum_expiry_months')->default(18);
            $table->timestamps();
            $table->foreign('item_id')->references('id')->on('items')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pharmacy_item_details');
    }
};
