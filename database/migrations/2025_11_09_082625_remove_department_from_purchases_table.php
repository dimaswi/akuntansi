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
        Schema::table('purchases', function (Blueprint $table) {
            // Drop foreign key first
            $table->dropForeign(['department_id']);
            
            // Drop index
            $table->dropIndex(['department_id', 'status']);
            
            // Drop column
            $table->dropColumn('department_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            // Add column back
            $table->foreignId('department_id')->after('supplier_id')->constrained('departments');
            
            // Add index back
            $table->index(['department_id', 'status']);
        });
    }
};
