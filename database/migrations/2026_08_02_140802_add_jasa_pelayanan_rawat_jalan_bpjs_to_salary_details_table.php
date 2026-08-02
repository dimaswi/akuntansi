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
        Schema::table('salary_details', function (Blueprint $table) {
            $table->decimal('jasa_pelayanan_rawat_jalan_bpjs', 15, 2)->default(0)->after('jasa_pelayanan_rawat_jalan');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('salary_details', function (Blueprint $table) {
            $table->dropColumn('jasa_pelayanan_rawat_jalan_bpjs');
        });
    }
};
