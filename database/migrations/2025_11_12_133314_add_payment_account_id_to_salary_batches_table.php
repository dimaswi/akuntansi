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
        Schema::table('salary_batches', function (Blueprint $table) {
            $table->unsignedBigInteger('payment_account_id')->nullable()->after('description');
            $table->foreign('payment_account_id')->references('id')->on('daftar_akun')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('salary_batches', function (Blueprint $table) {
            $table->dropForeign(['payment_account_id']);
            $table->dropColumn('payment_account_id');
        });
    }
};
