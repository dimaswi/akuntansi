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
        Schema::create('stock_transfers', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_transfer')->unique();
            $table->date('tanggal_transfer');
            $table->foreignId('item_id')->constrained('items')->onDelete('restrict');
            $table->foreignId('from_department_id')->nullable()->constrained('departments')->onDelete('restrict');
            $table->foreignId('to_department_id')->constrained('departments')->onDelete('restrict');
            $table->integer('quantity');
            $table->text('keterangan')->nullable();
            $table->enum('status', ['draft', 'approved', 'received'])->default('draft');
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('received_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('received_at')->nullable();
            $table->timestamps();

            $table->index('tanggal_transfer');
            $table->index('from_department_id');
            $table->index('to_department_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_transfers');
    }
};
