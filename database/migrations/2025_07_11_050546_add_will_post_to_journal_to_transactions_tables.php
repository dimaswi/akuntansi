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
        // Add will_post_to_journal field to cash_transactions table
        Schema::table('cash_transactions', function (Blueprint $table) {
            $table->boolean('will_post_to_journal')->default(false)->after('status');
        });

        // Add will_post_to_journal field to bank_transactions table
        Schema::table('bank_transactions', function (Blueprint $table) {
            $table->boolean('will_post_to_journal')->default(false)->after('status');
        });

        // Add will_post_to_journal field to giro_transactions table
        Schema::table('giro_transactions', function (Blueprint $table) {
            $table->boolean('will_post_to_journal')->default(false)->after('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove will_post_to_journal field from cash_transactions table
        Schema::table('cash_transactions', function (Blueprint $table) {
            $table->dropColumn('will_post_to_journal');
        });

        // Remove will_post_to_journal field from bank_transactions table
        Schema::table('bank_transactions', function (Blueprint $table) {
            $table->dropColumn('will_post_to_journal');
        });

        // Remove will_post_to_journal field from giro_transactions table
        Schema::table('giro_transactions', function (Blueprint $table) {
            $table->dropColumn('will_post_to_journal');
        });
    }
};
