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
        Schema::table('department_requests', function (Blueprint $table) {
            // Add transfer type field
            $table->enum('request_type', ['procurement', 'transfer'])->default('procurement')->after('department_id');
            
            // Add target department for transfer requests
            $table->unsignedBigInteger('target_department_id')->nullable()->after('request_type');
            
            // Add foreign key constraint
            $table->foreign('target_department_id')
                  ->references('id')
                  ->on('departments')
                  ->onDelete('set null');
                  
            // Add index for performance
            $table->index(['request_type', 'status']);
            $table->index(['target_department_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('department_requests', function (Blueprint $table) {
            $table->dropForeign(['target_department_id']);
            $table->dropIndex(['request_type', 'status']);
            $table->dropIndex(['target_department_id', 'status']);
            $table->dropColumn(['request_type', 'target_department_id']);
        });
    }
};
