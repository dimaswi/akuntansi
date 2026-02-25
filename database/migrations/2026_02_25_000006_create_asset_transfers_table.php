<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asset_transfers', function (Blueprint $table) {
            $table->id();
            $table->string('transfer_number', 30)->unique(); // ATR-2026-0001
            $table->foreignId('asset_id')->constrained('assets');

            $table->foreignId('from_department_id')->constrained('departments');
            $table->foreignId('to_department_id')->constrained('departments');
            $table->date('transfer_date');
            $table->text('reason')->nullable();

            $table->enum('status', [
                'pending',
                'approved',
                'completed',
                'cancelled',
            ])->default('pending');

            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();

            $table->index(['asset_id', 'status']);
            $table->index(['from_department_id']);
            $table->index(['to_department_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asset_transfers');
    }
};
