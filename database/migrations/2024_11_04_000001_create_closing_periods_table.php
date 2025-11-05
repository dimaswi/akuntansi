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
        // Tabel untuk settings global tutup buku
        Schema::create('closing_period_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->enum('type', ['boolean', 'string', 'integer', 'date'])->default('string');
            $table->text('description')->nullable();
            $table->string('group')->default('general'); // general, cutoff, validation, approval, notification, emergency
            $table->timestamps();
            
            $table->index('key');
            $table->index('group');
        });

        // Tabel untuk tracking periode tutup buku
        Schema::create('closing_periods', function (Blueprint $table) {
            $table->id();
            $table->string('period_code')->unique(); // e.g., 2024-01, 2024-Q1, 2024-W01
            $table->string('period_name'); // e.g., "Januari 2024", "Q1 2024"
            $table->enum('period_type', ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'])->default('monthly');
            $table->date('period_start');
            $table->date('period_end');
            $table->date('cutoff_date'); // Deadline untuk soft close
            $table->date('hard_close_date')->nullable(); // Deadline untuk hard close
            $table->enum('status', ['open', 'soft_close', 'hard_close'])->default('open');
            $table->foreignId('soft_closed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('soft_closed_at')->nullable();
            $table->foreignId('hard_closed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('hard_closed_at')->nullable();
            $table->foreignId('reopened_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reopened_at')->nullable();
            $table->text('reopen_reason')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->index('period_code');
            $table->index(['period_start', 'period_end']);
            $table->index('status');
            $table->index('cutoff_date');
        });

        // Tabel untuk log revisi setelah soft close
        Schema::create('journal_revision_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('closing_period_id')->constrained('closing_periods')->cascadeOnDelete();
            $table->string('journal_type'); // jurnal_umum, jurnal_kas_masuk, jurnal_kas_keluar, etc.
            $table->unsignedBigInteger('journal_id');
            $table->enum('action', ['create', 'update', 'delete'])->default('update');
            $table->text('reason'); // Alasan revisi
            $table->json('old_data')->nullable();
            $table->json('new_data')->nullable();
            $table->decimal('impact_amount', 15, 2)->default(0); // Nominal perubahan
            $table->foreignId('revised_by')->constrained('users')->cascadeOnDelete();
            $table->timestamp('revised_at');
            $table->enum('approval_status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->text('approval_notes')->nullable();
            $table->timestamps();
            
            $table->index(['journal_type', 'journal_id']);
            $table->index('closing_period_id');
            $table->index('revised_by');
            $table->index('approval_status');
        });

        // Tabel untuk checklist kelengkapan data sebelum close
        Schema::create('period_checklists', function (Blueprint $table) {
            $table->id();
            $table->foreignId('closing_period_id')->constrained('closing_periods')->cascadeOnDelete();
            $table->string('checklist_item'); // jurnal_balance, bank_reconciliation, cash_opname, inventory_count, etc.
            $table->boolean('is_completed')->default(false);
            $table->foreignId('completed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('completed_at')->nullable();
            $table->text('notes')->nullable();
            $table->json('validation_data')->nullable(); // Data tambahan untuk validasi
            $table->timestamps();
            
            $table->index('closing_period_id');
            $table->index(['checklist_item', 'is_completed']);
        });

        // Tabel untuk template periode (untuk auto-create)
        Schema::create('period_templates', function (Blueprint $table) {
            $table->id();
            $table->string('template_name');
            $table->enum('period_type', ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom']);
            $table->integer('cutoff_days')->default(5); // Berapa hari setelah akhir periode
            $table->integer('hard_close_days')->nullable(); // Berapa hari setelah cutoff
            $table->json('required_checklists')->nullable(); // Array checklist yang wajib
            $table->boolean('is_active')->default(true);
            $table->boolean('is_default')->default(false);
            $table->text('description')->nullable();
            $table->timestamps();
            
            $table->index('period_type');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('period_checklists');
        Schema::dropIfExists('journal_revision_logs');
        Schema::dropIfExists('period_templates');
        Schema::dropIfExists('closing_periods');
        Schema::dropIfExists('closing_period_settings');
    }
};
