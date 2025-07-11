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
        Schema::table('cash_transactions', function (Blueprint $table) {
            // Change enum to include pending_approval
            $table->enum('status', ['draft', 'pending_approval', 'posted', 'cancelled'])->default('draft')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cash_transactions', function (Blueprint $table) {
            // Revert back to original enum
            $table->enum('status', ['draft', 'posted', 'cancelled'])->default('draft')->change();
        });
    }
};
