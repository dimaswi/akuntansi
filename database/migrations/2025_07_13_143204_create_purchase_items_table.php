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
        Schema::create('purchase_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_id')->constrained('purchases')->onDelete('cascade');
            $table->foreignId('item_id')->constrained('items');
            
            $table->decimal('quantity_ordered', 10, 2); // jumlah yang dipesan
            $table->decimal('quantity_received', 10, 2)->default(0); // jumlah yang sudah diterima
            $table->decimal('unit_price', 15, 2); // harga per unit
            $table->decimal('total_price', 15, 2); // quantity * unit_price
            
            $table->string('batch_number')->nullable(); // nomor batch jika ada
            $table->date('expiry_date')->nullable(); // tanggal kadaluwarsa jika ada
            $table->text('notes')->nullable(); // catatan khusus item
            
            $table->enum('item_status', [
                'pending',   // belum diterima
                'partial',   // sebagian diterima
                'completed', // sudah diterima semua
                'cancelled'  // dibatalkan
            ])->default('pending');
            
            $table->timestamp('received_at')->nullable(); // kapan diterima
            $table->timestamps();
            
            $table->index(['purchase_id', 'item_status']);
            $table->index(['item_id', 'item_status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_items');
    }
};
