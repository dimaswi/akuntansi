<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Expand enum: tambah sum_of_years_digits, service_hours, productive_output
        DB::statement("ALTER TABLE asset_categories MODIFY COLUMN default_depreciation_method ENUM('straight_line','declining_balance','double_declining','sum_of_years_digits','service_hours','productive_output') NOT NULL DEFAULT 'straight_line'");

        DB::statement("ALTER TABLE assets MODIFY COLUMN depreciation_method ENUM('straight_line','declining_balance','double_declining','sum_of_years_digits','service_hours','productive_output') NOT NULL DEFAULT 'straight_line'");

        // Kolom tambahan untuk metode berbasis pemakaian
        Schema::table('assets', function (Blueprint $table) {
            $table->integer('estimated_service_hours')->nullable()->after('depreciation_method')
                  ->comment('Total estimasi jam kerja selama masa manfaat');
            $table->integer('estimated_total_production')->nullable()->after('estimated_service_hours')
                  ->comment('Total estimasi unit produksi selama masa manfaat');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            $table->dropColumn(['estimated_service_hours', 'estimated_total_production']);
        });

        DB::statement("ALTER TABLE assets MODIFY COLUMN depreciation_method ENUM('straight_line','declining_balance','double_declining') NOT NULL DEFAULT 'straight_line'");
        DB::statement("ALTER TABLE asset_categories MODIFY COLUMN default_depreciation_method ENUM('straight_line','declining_balance','double_declining') NOT NULL DEFAULT 'straight_line'");
    }
};
