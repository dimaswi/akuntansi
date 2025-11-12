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
        if (Schema::hasTable('purchase_payments')) {
            return;
        }
        
        Schema::create('purchase_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_id')->constrained('purchases')->onDelete('cascade');
            $table->string('payment_number', 50)->unique();
            $table->date('payment_date');
            $table->enum('payment_method', ['cash', 'bank_transfer', 'giro', 'credit_card'])->default('bank_transfer');
            $table->foreignId('bank_account_id')->nullable()->comment('Jika payment via bank');
            $table->decimal('amount', 15, 2);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->text('notes')->nullable();
            
            // Link ke Jurnal
            $table->foreignId('jurnal_id')->nullable()->constrained('jurnal')->onDelete('set null');
            $table->boolean('jurnal_posted')->default(false);
            
            // Tracking
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable();
            
            $table->timestamps();
            
            // Indexes
            $table->index('payment_date');
            $table->index('payment_method');
            $table->index('jurnal_posted');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_payments');
    }
};
