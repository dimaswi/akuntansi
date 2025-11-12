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
        Schema::table('purchase_payments', function (Blueprint $table) {
            // Drop old bank_account_id column
            $table->dropColumn('bank_account_id');
            
            // Add new kode_akun_bank column (references COA)
            $table->string('kode_akun_bank', 20)->nullable()->after('payment_method')->comment('Kode akun bank dari COA');
            $table->index('kode_akun_bank');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchase_payments', function (Blueprint $table) {
            // Drop new column
            $table->dropIndex(['kode_akun_bank']);
            $table->dropColumn('kode_akun_bank');
            
            // Restore old column
            $table->foreignId('bank_account_id')->nullable()->after('payment_method');
        });
    }
};
