<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assets', function (Blueprint $table) {
            $table->id();
            $table->string('code', 30)->unique(); // AST-2026-0001
            $table->string('name');
            $table->text('description')->nullable();

            $table->foreignId('category_id')->constrained('asset_categories');
            $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();

            // Detail Aset
            $table->string('location')->nullable();
            $table->string('brand')->nullable();
            $table->string('model')->nullable();
            $table->string('serial_number')->nullable();
            $table->string('plate_number')->nullable(); // untuk kendaraan

            // Informasi Pembelian
            $table->date('acquisition_date');
            $table->enum('acquisition_type', [
                'purchase',
                'donation',
                'transfer_in',
                'leasing',
                'self_built',
            ])->default('purchase');
            $table->decimal('acquisition_cost', 15, 2);
            $table->foreignId('purchase_id')->nullable()->constrained('purchases')->nullOnDelete();

            // Penyusutan
            $table->integer('useful_life_months');
            $table->decimal('salvage_value', 15, 2)->default(0);
            $table->enum('depreciation_method', [
                'straight_line',
                'declining_balance',
                'double_declining',
            ])->default('straight_line');
            $table->decimal('current_book_value', 15, 2);
            $table->decimal('accumulated_depreciation', 15, 2)->default(0);
            $table->date('depreciation_start_date');

            // Status
            $table->enum('status', [
                'active',
                'maintenance',
                'disposed',
                'inactive',
            ])->default('active');
            $table->enum('condition', [
                'excellent',
                'good',
                'fair',
                'poor',
                'damaged',
            ])->default('good');

            // Informasi Tambahan
            $table->date('warranty_expiry_date')->nullable();
            $table->string('photo')->nullable();
            $table->text('notes')->nullable();
            $table->json('specifications')->nullable(); // spesifikasi tambahan

            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'category_id']);
            $table->index(['department_id', 'status']);
            $table->index(['acquisition_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assets');
    }
};
