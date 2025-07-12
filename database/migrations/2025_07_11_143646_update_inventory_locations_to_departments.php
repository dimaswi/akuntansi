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
        Schema::table('inventory_locations', function (Blueprint $table) {
            // Add department relationship
            $table->unsignedBigInteger('department_id')->nullable()->after('parent_location_id');
            $table->foreign('department_id')->references('id')->on('departments')->onDelete('set null');
            
            // Add index for department lookups
            $table->index(['department_id', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inventory_locations', function (Blueprint $table) {
            $table->dropForeign(['department_id']);
            $table->dropIndex(['department_id', 'is_active']);
            $table->dropColumn('department_id');
        });
    }
};
