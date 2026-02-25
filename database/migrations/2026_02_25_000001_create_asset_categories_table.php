<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asset_categories', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->integer('default_useful_life_years')->default(5);
            $table->enum('default_depreciation_method', [
                'straight_line',
                'declining_balance',
                'double_declining',
            ])->default('straight_line');
            $table->decimal('default_salvage_percentage', 5, 2)->default(0); // % dari harga beli

            // Integrasi akun akuntansi
            $table->foreignId('account_asset_id')->nullable()->constrained('daftar_akun')->nullOnDelete();
            $table->foreignId('account_depreciation_id')->nullable()->constrained('daftar_akun')->nullOnDelete();
            $table->foreignId('account_expense_id')->nullable()->constrained('daftar_akun')->nullOnDelete();

            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asset_categories');
    }
};
