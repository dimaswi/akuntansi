<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Make department_id nullable for purchase transactions (central warehouse)
     */
    public function up(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            // Drop foreign key first
            $table->dropForeign(['department_id']);
            
            // Make nullable
            $table->foreignId('department_id')->nullable()->change()->constrained('departments');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            // Restore to NOT NULL
            $table->dropForeign(['department_id']);
            $table->foreignId('department_id')->nullable(false)->change()->constrained('departments');
        });
    }
};
