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
        Schema::create('inventory_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_number', 50)->unique();
            $table->date('transaction_date');
            $table->enum('transaction_type', ['purchase_receive', 'requisition_issue', 'adjustment', 'transfer', 'return']);
            
            $table->foreignId('item_id')->constrained('items')->onDelete('cascade');
            $table->foreignId('department_id')->nullable()->constrained('departments')->onDelete('set null');
            
            // Quantity Movement
            $table->decimal('quantity', 15, 3);
            $table->decimal('unit_cost', 15, 2);
            $table->decimal('total_cost', 15, 2);
            
            // Reference ke source transaction
            $table->string('reference_type', 50)->nullable()->comment('purchase, requisition, etc');
            $table->unsignedBigInteger('reference_id')->nullable();
            
            // Balance Tracking (untuk perpetual inventory)
            $table->decimal('balance_before', 15, 3)->default(0);
            $table->decimal('balance_after', 15, 3)->default(0);
            
            // Link ke Jurnal (jika ada financial impact)
            $table->foreignId('jurnal_id')->nullable()->constrained('jurnal')->onDelete('set null');
            
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();
            
            // Indexes
            $table->index('transaction_date');
            $table->index('transaction_type');
            $table->index(['reference_type', 'reference_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_transactions');
    }
};
