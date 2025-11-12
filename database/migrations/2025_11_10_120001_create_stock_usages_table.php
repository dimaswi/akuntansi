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
        if (Schema::hasTable('stock_usages')) {
            return;
        }
        
        Schema::create('stock_usages', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_usage')->unique();
            $table->date('tanggal_usage');
            $table->foreignId('item_id')->constrained('items')->onDelete('restrict');
            $table->foreignId('department_id')->constrained('departments')->onDelete('restrict');
            $table->integer('quantity');
            $table->decimal('unit_price', 15, 2);
            $table->text('keterangan')->nullable();
            $table->enum('status', ['draft', 'approved'])->default('draft');
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable();
            $table->boolean('jurnal_posted')->default(false);
            $table->foreignId('jurnal_id')->nullable()->constrained('jurnal')->onDelete('set null');
            $table->timestamps();

            $table->index('tanggal_usage');
            $table->index('department_id');
            $table->index('status');
            $table->index('jurnal_posted');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_usages');
    }
};
