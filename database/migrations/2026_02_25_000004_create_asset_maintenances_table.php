<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asset_maintenances', function (Blueprint $table) {
            $table->id();
            $table->string('maintenance_number', 30)->unique(); // MNT-2026-0001
            $table->foreignId('asset_id')->constrained('assets')->cascadeOnDelete();

            $table->enum('type', [
                'preventive',
                'corrective',
                'emergency',
            ]);
            $table->text('description');
            $table->date('scheduled_date');
            $table->date('completed_date')->nullable();
            $table->decimal('cost', 15, 2)->default(0);
            $table->string('vendor')->nullable();
            $table->string('vendor_contact')->nullable();

            $table->enum('status', [
                'scheduled',
                'in_progress',
                'completed',
                'cancelled',
            ])->default('scheduled');

            $table->text('notes')->nullable();
            $table->text('result')->nullable(); // hasil maintenance
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();

            $table->index(['asset_id', 'status']);
            $table->index(['scheduled_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asset_maintenances');
    }
};
