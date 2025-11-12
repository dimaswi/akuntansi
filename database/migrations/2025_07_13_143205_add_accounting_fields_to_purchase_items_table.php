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
        Schema::table('purchase_items', function (Blueprint $table) {
            if (!Schema::hasColumn('purchase_items', 'inventory_account_id')) {
                $table->unsignedBigInteger('inventory_account_id')->nullable()->after('notes')->comment('Account Inventory (Aset)');
            }
            if (!Schema::hasColumn('purchase_items', 'expense_account_id')) {
                $table->unsignedBigInteger('expense_account_id')->nullable()->after('inventory_account_id')->comment('Account Expense (jika direct expense)');
            }
            if (!Schema::hasColumn('purchase_items', 'allocation_type')) {
                $table->enum('allocation_type', ['inventory', 'expense', 'asset'])->default('inventory')->after('expense_account_id');
            }
            if (!Schema::hasColumn('purchase_items', 'actual_unit_cost')) {
                $table->decimal('actual_unit_cost', 15, 2)->nullable()->after('unit_price')->comment('Harga setelah discount/adjustment');
            }
            if (!Schema::hasColumn('purchase_items', 'landed_cost')) {
                $table->decimal('landed_cost', 15, 2)->nullable()->after('actual_unit_cost')->comment('Termasuk shipping, tax, etc');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchase_items', function (Blueprint $table) {
            $table->dropColumn([
                'inventory_account_id',
                'expense_account_id',
                'allocation_type',
                'actual_unit_cost',
                'landed_cost',
            ]);
        });
    }
};
