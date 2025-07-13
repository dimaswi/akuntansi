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
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->constrained('items');
            $table->foreignId('department_id')->constrained('departments');
            $table->foreignId('user_id')->constrained('users'); // user yang melakukan transaksi
            
            // Reference ke transaksi sumber (purchase, sale, adjustment, dll)
            $table->string('reference_type'); // App\Models\Inventory\Purchase, dll
            $table->unsignedBigInteger('reference_id'); // ID dari transaksi sumber
            $table->string('reference_number')->nullable(); // nomor dokumen (PO-001, etc)
            
            $table->enum('movement_type', [
                'in',     // stok masuk
                'out',    // stok keluar
                'adjustment' // adjustment stok
            ]);
            
            $table->enum('transaction_type', [
                'purchase',      // pembelian
                'sale',          // penjualan
                'return',        // retur
                'transfer',      // transfer antar departemen
                'adjustment',    // adjustment manual
                'damage',        // barang rusak
                'expired'        // barang kadaluwarsa
            ]);
            
            $table->decimal('quantity', 10, 2); // jumlah (+ untuk masuk, - untuk keluar)
            $table->decimal('unit_cost', 15, 2)->nullable(); // cost per unit
            $table->decimal('total_cost', 15, 2)->nullable(); // total cost
            
            $table->decimal('stock_before', 10, 2); // stok sebelum transaksi
            $table->decimal('stock_after', 10, 2);  // stok setelah transaksi
            
            $table->string('batch_number')->nullable();
            $table->date('expiry_date')->nullable();
            $table->text('notes')->nullable();
            
            $table->timestamp('movement_date'); // tanggal transaksi
            $table->timestamps();
            
            $table->index(['item_id', 'movement_date']);
            $table->index(['reference_type', 'reference_id']);
            $table->index(['movement_type', 'transaction_type']);
            $table->index(['department_id', 'movement_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};
