<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventory_transactions', function (Blueprint $table) {
            // Tambah kolom untuk warehouse location
            $table->enum('warehouse_location', ['central', 'department'])
                ->default('central')
                ->after('transaction_type');
            
            // Tambah kolom untuk tracking transfer
            $table->foreignId('from_department_id')
                ->nullable()
                ->after('department_id')
                ->constrained('departments')
                ->nullOnDelete();
            
            $table->foreignId('to_department_id')
                ->nullable()
                ->after('from_department_id')
                ->constrained('departments')
                ->nullOnDelete();
            
            // Update enum transaction_type
            $table->dropColumn('transaction_type');
        });
        
        // Add back transaction_type with new values
        Schema::table('inventory_transactions', function (Blueprint $table) {
            $table->enum('transaction_type', [
                'purchase_receive',     // Penerimaan dari supplier ke Central
                'stock_issue',          // Pengeluaran dari Central ke Department
                'stock_receive',        // Penerimaan di Department dari Central
                'stock_adjustment',     // Koreksi stok Central/Department
                'return_to_central',    // Return dari Department ke Central
                'disposal',             // Pembuangan barang rusak
                'requisition_issue',    // Legacy (backward compat)
                'adjustment',           // Legacy (backward compat)
                'transfer',             // Legacy (backward compat)
                'return'                // Legacy (backward compat)
            ])->after('transaction_date');
        });
    }

    public function down(): void
    {
        Schema::table('inventory_transactions', function (Blueprint $table) {
            $table->dropForeign(['from_department_id']);
            $table->dropForeign(['to_department_id']);
            $table->dropColumn(['warehouse_location', 'from_department_id', 'to_department_id']);
            
            // Restore original transaction_type
            $table->dropColumn('transaction_type');
        });
        
        Schema::table('inventory_transactions', function (Blueprint $table) {
            $table->enum('transaction_type', [
                'purchase_receive', 
                'requisition_issue', 
                'adjustment', 
                'transfer', 
                'return'
            ])->after('transaction_date');
        });
    }
};
