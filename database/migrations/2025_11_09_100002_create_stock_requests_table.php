<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_requests', function (Blueprint $table) {
            $table->id();
            $table->string('request_number', 50)->unique(); // SREQ-YYYYMMDD-XXXX
            $table->foreignId('department_id')->constrained('departments')->onDelete('cascade');
            $table->foreignId('requested_by')->constrained('users')->onDelete('cascade');
            
            $table->date('request_date');
            $table->date('required_date')->nullable();
            
            $table->enum('status', [
                'draft',        // Baru dibuat, belum submit
                'submitted',    // Sudah submit, menunggu approval
                'approved',     // Diapprove, siap diproses
                'rejected',     // Ditolak
                'completed',    // Selesai diproses (stock sudah ditransfer)
                'cancelled'     // Dibatalkan
            ])->default('draft');
            
            $table->enum('priority', ['low', 'normal', 'high', 'urgent'])->default('normal');
            
            $table->text('purpose')->nullable(); // Tujuan penggunaan barang
            $table->text('notes')->nullable();
            
            // Approval tracking
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->text('rejection_reason')->nullable();
            
            // Completion tracking
            $table->timestamp('completed_at')->nullable();
            $table->foreignId('completed_by')->nullable()->constrained('users')->nullOnDelete();
            
            // Jurnal link (optional - jika di-post ke akuntansi)
            $table->foreignId('jurnal_id')->nullable()->constrained('jurnal')->nullOnDelete();
            $table->boolean('jurnal_posted')->default(false);
            $table->timestamp('jurnal_posted_at')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index(['department_id', 'status']);
            $table->index(['requested_by', 'status']);
            $table->index('request_date');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_requests');
    }
};
