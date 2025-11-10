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
        Schema::dropIfExists('requisition_items');
        Schema::dropIfExists('requisitions');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Tidak perlu recreate karena sistem tidak menggunakan requisition lagi
    }
};
