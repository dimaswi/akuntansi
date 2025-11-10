<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_request_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stock_request_id')->constrained('stock_requests')->onDelete('cascade');
            $table->foreignId('item_id')->constrained('items')->onDelete('cascade');
            
            $table->decimal('quantity_requested', 15, 3); // Yang diminta
            $table->decimal('quantity_approved', 15, 3)->default(0); // Yang diapprove (bisa < requested)
            $table->decimal('quantity_issued', 15, 3)->default(0); // Yang sudah dikeluarkan
            
            $table->decimal('unit_cost', 15, 2)->default(0); // Biaya satuan (dari stock terakhir)
            $table->decimal('total_cost', 15, 2)->default(0); // Total biaya item ini
            
            $table->text('notes')->nullable();
            $table->text('approval_notes')->nullable(); // Catatan saat approve
            
            $table->timestamps();
            
            // Indexes
            $table->index('stock_request_id');
            $table->index('item_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_request_items');
    }
};
