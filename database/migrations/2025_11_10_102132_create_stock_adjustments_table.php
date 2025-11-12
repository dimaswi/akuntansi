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
        Schema::create('stock_adjustments', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_adjustment', 50)->unique()->comment('Format: ADJ/YYYY/MM/XXXX');
            $table->date('tanggal_adjustment');
            $table->enum('tipe_adjustment', ['shortage', 'overage'])->comment('shortage=kekurangan, overage=kelebihan');
            $table->foreignId('item_id')->constrained('items')->onDelete('restrict');
            $table->integer('quantity')->comment('Jumlah selisih (absolut, positif)');
            $table->decimal('unit_price', 15, 2)->default(0)->comment('Harga per unit dari items.harga_beli');
            $table->decimal('total_amount', 15, 2)->virtualAs('quantity * unit_price')->comment('Total nilai adjustment');
            $table->text('keterangan')->nullable();
            $table->enum('status', ['draft', 'approved'])->default('draft')->comment('draft=belum diproses, approved=stok sudah diupdate');
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable();
            $table->boolean('jurnal_posted')->default(false);
            $table->foreignId('jurnal_id')->nullable()->constrained('jurnal')->onDelete('set null');
            $table->timestamps();
            
            $table->index(['tanggal_adjustment', 'status']);
            $table->index(['status', 'jurnal_posted']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_adjustments');
    }
};
