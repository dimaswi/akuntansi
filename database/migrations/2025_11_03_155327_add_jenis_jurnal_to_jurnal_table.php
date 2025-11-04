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
        Schema::table('jurnal', function (Blueprint $table) {
            // Check if column doesn't exist before adding
            if (!Schema::hasColumn('jurnal', 'jenis_jurnal')) {
                $table->enum('jenis_jurnal', ['umum', 'kas', 'bank', 'giro', 'penyesuaian'])
                      ->default('umum')
                      ->after('status')
                      ->comment('Jenis jurnal: umum, kas, bank, giro, penyesuaian');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('jurnal', function (Blueprint $table) {
            if (Schema::hasColumn('jurnal', 'jenis_jurnal')) {
                $table->dropColumn('jenis_jurnal');
            }
        });
    }
};
