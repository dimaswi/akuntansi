<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_opnames', function (Blueprint $table) {
            $table->id();
            $table->string('opname_number', 50)->unique();
            $table->foreignId('department_id')->constrained('departments');
            $table->date('opname_date');
            $table->enum('status', ['draft', 'submitted', 'approved', 'rejected'])->default('draft');
            $table->text('notes')->nullable();
            $table->integer('total_items_counted')->default(0);
            $table->decimal('total_variance_value', 15, 2)->default(0);
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->timestamp('approved_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['department_id', 'opname_date']);
            $table->index('status');
        });

        Schema::create('stock_opname_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stock_opname_id')->constrained('stock_opnames')->onDelete('cascade');
            $table->foreignId('item_id')->constrained('items');
            $table->decimal('system_quantity', 10, 2); // Quantity dari item_stocks
            $table->decimal('physical_quantity', 10, 2); // Hasil hitung fisik
            $table->decimal('variance', 10, 2); // physical - system (bisa + atau -)
            $table->decimal('unit_price', 15, 2); // Harga per unit
            $table->decimal('variance_value', 15, 2); // variance * unit_price
            $table->text('notes')->nullable(); // Catatan untuk variance
            $table->timestamps();

            $table->index('stock_opname_id');
            $table->index('item_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_opname_items');
        Schema::dropIfExists('stock_opnames');
    }
};
