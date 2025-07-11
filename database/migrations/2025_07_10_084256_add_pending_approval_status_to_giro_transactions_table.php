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
        Schema::table('giro_transactions', function (Blueprint $table) {
            // Modify status enum to include 'pending_approval'
            $table->enum('status', ['draft', 'pending_approval', 'posted', 'cancelled'])->default('draft')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('giro_transactions', function (Blueprint $table) {
            // Revert status enum to original values
            $table->enum('status', ['draft', 'posted', 'cancelled'])->default('draft')->change();
        });
    }
};
