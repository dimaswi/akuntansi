<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asset_disposals', function (Blueprint $table) {
            $table->id();
            $table->string('disposal_number', 30)->unique(); // DSP-2026-0001
            $table->foreignId('asset_id')->constrained('assets');

            $table->date('disposal_date');
            $table->enum('disposal_method', [
                'sale',
                'scrap',
                'donation',
                'trade_in',
                'write_off',
            ]);

            $table->decimal('disposal_price', 15, 2)->default(0);
            $table->decimal('book_value_at_disposal', 15, 2);
            $table->decimal('gain_loss', 15, 2)->default(0); // laba/rugi pelepasan

            $table->string('buyer_info')->nullable(); // pembeli/penerima
            $table->text('reason');

            $table->enum('status', [
                'pending',
                'approved',
                'completed',
                'cancelled',
            ])->default('pending');

            $table->foreignId('jurnal_id')->nullable()->constrained('jurnal')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();

            $table->index(['status', 'disposal_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asset_disposals');
    }
};
