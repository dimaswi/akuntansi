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
        // Inventory Categories
        Schema::create('inventory_categories', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedBigInteger('parent_id')->nullable();
            $table->enum('category_type', ['pharmacy', 'general', 'medical_equipment'])->default('general');
            $table->boolean('is_active')->default(true);
            $table->boolean('requires_batch_tracking')->default(false);
            $table->boolean('requires_expiry_tracking')->default(false);
            $table->json('storage_requirements')->nullable(); // temperature, humidity, etc
            $table->timestamps();

            $table->foreign('parent_id')->references('id')->on('inventory_categories')->onDelete('set null');
            $table->index(['category_type', 'is_active']);
        });

        // Inventory Items (Unified for both pharmacy and general)
        Schema::create('inventory_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('category_id');
            $table->string('code', 30)->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('inventory_type', ['pharmacy', 'general'])->default('general');
            $table->string('unit_of_measure', 20); // pcs, box, bottle, tablet, ml, etc
            $table->integer('pack_size')->default(1); // units per pack
            $table->decimal('reorder_level', 10, 2)->default(0);
            $table->decimal('max_level', 10, 2)->default(0);
            $table->decimal('safety_stock', 10, 2)->default(0);
            $table->decimal('standard_cost', 15, 2)->default(0);
            $table->decimal('last_purchase_cost', 15, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->boolean('requires_approval')->default(false);
            $table->boolean('is_controlled_substance')->default(false); // for pharmacy
            $table->boolean('requires_prescription')->default(false); // for pharmacy
            $table->json('specifications')->nullable(); // additional specs
            $table->timestamps();

            $table->foreign('category_id')->references('id')->on('inventory_categories');
            $table->index(['inventory_type', 'is_active']);
            $table->index(['code', 'is_active']);
        });

        // Pharmacy-specific item details
        Schema::create('pharmacy_item_details', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('inventory_item_id');
            $table->string('bpom_registration', 50)->nullable();
            $table->string('manufacturer')->nullable();
            $table->string('generic_name')->nullable();
            $table->string('strength')->nullable(); // 500mg, 10ml, etc
            $table->string('dosage_form')->nullable(); // tablet, capsule, syrup, injection
            $table->enum('drug_classification', ['narkotika', 'psikotropika', 'keras', 'bebas_terbatas', 'bebas'])->nullable();
            $table->string('atc_code', 10)->nullable(); // Anatomical Therapeutic Chemical code
            $table->text('contraindications')->nullable();
            $table->json('drug_interactions')->nullable();
            $table->decimal('storage_temp_min', 5, 2)->nullable(); // Celsius
            $table->decimal('storage_temp_max', 5, 2)->nullable(); // Celsius
            $table->integer('minimum_expiry_months')->default(18); // minimum months before expiry for purchase
            $table->timestamps();

            $table->foreign('inventory_item_id')->references('id')->on('inventory_items')->onDelete('cascade');
        });

        // General inventory item details
        Schema::create('general_item_details', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('inventory_item_id');
            $table->boolean('is_consumable')->default(true);
            $table->boolean('is_returnable')->default(false);
            $table->boolean('requires_maintenance')->default(false);
            $table->integer('warranty_months')->nullable();
            $table->text('usage_instructions')->nullable();
            $table->json('department_restrictions')->nullable(); // which departments can use
            $table->timestamps();

            $table->foreign('inventory_item_id')->references('id')->on('inventory_items')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('general_item_details');
        Schema::dropIfExists('pharmacy_item_details');
        Schema::dropIfExists('inventory_items');
        Schema::dropIfExists('inventory_categories');
    }
};
