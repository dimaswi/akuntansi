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
        Schema::table('purchases', function (Blueprint $table) {
            if (!Schema::hasColumn('purchases', 'jurnal_posted')) {
                $table->boolean('jurnal_posted')->default(false)->after('total_amount');
            }
            if (!Schema::hasColumn('purchases', 'jurnal_id')) {
                $table->foreignId('jurnal_id')->nullable()->constrained('jurnal')->after('jurnal_posted');
            }
            if (!Schema::hasColumn('purchases', 'ap_outstanding')) {
                $table->decimal('ap_outstanding', 15, 2)->default(0)->after('jurnal_id');
            }
        });
        
        Schema::table('purchases', function (Blueprint $table) {
            if (!Schema::hasIndex('purchases', 'purchases_jurnal_posted_index')) {
                $table->index('jurnal_posted');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            $table->dropForeign(['jurnal_id']);
            $table->dropColumn(['jurnal_posted', 'jurnal_id', 'ap_outstanding']);
        });
    }
};
