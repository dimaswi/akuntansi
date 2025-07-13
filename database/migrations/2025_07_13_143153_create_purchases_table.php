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
        Schema::create('purchases', function (Blueprint $table) {
            $table->id();
            $table->string('purchase_number')->unique(); // PO-2025-001
            $table->foreignId('supplier_id')->constrained('suppliers');
            $table->foreignId('department_id')->constrained('departments'); // harus logistik
            $table->foreignId('created_by')->constrained('users'); // user yang buat
            $table->foreignId('approved_by')->nullable()->constrained('users'); // user yang approve
            
            $table->date('purchase_date');
            $table->date('expected_delivery_date')->nullable();
            $table->date('actual_delivery_date')->nullable();
            
            $table->enum('status', [
                'draft',        // baru dibuat
                'pending',      // menunggu approval
                'approved',     // sudah diapprove
                'ordered',      // sudah dipesan ke supplier
                'partial',      // sebagian sudah diterima
                'completed',    // selesai semua diterima
                'cancelled'     // dibatalkan
            ])->default('draft');
            
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('shipping_cost', 15, 2)->default(0);
            $table->decimal('total_amount', 15, 2)->default(0);
            
            $table->text('notes')->nullable();
            $table->json('delivery_address')->nullable(); // alamat pengiriman
            $table->string('payment_terms')->nullable(); // terms pembayaran
            
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('ordered_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            $table->index(['status', 'purchase_date']);
            $table->index(['supplier_id', 'status']);
            $table->index(['department_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchases');
    }
};
