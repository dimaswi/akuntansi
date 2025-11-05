<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ClosingPeriodSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = Carbon::now();

        // ===== GENERAL SETTINGS =====
        $settings = [
            // General Settings
            [
                'key' => 'closing_module_enabled',
                'value' => 'false',
                'type' => 'boolean',
                'description' => 'Aktifkan/nonaktifkan fitur tutup buku secara keseluruhan',
                'group' => 'general',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'key' => 'closing_mode',
                'value' => 'soft_only',
                'type' => 'string',
                'description' => 'Mode tutup buku: disabled, soft_only, soft_and_hard',
                'group' => 'general',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'key' => 'auto_create_period',
                'value' => 'false',
                'type' => 'boolean',
                'description' => 'Otomatis membuat periode baru setiap awal bulan',
                'group' => 'general',
                'created_at' => $now,
                'updated_at' => $now,
            ],

            // Cut Off Settings
            [
                'key' => 'default_cutoff_days',
                'value' => '5',
                'type' => 'integer',
                'description' => 'Jumlah hari setelah akhir periode untuk soft close (default: 5 hari)',
                'group' => 'cutoff',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'key' => 'hard_close_days',
                'value' => '15',
                'type' => 'integer',
                'description' => 'Jumlah hari setelah soft close untuk hard close (default: 15 hari)',
                'group' => 'cutoff',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'key' => 'warning_days_before_cutoff',
                'value' => '3',
                'type' => 'integer',
                'description' => 'Berapa hari sebelum deadline untuk mengirim reminder',
                'group' => 'cutoff',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'key' => 'auto_soft_close',
                'value' => 'false',
                'type' => 'boolean',
                'description' => 'Otomatis soft close periode saat mencapai cutoff date',
                'group' => 'cutoff',
                'created_at' => $now,
                'updated_at' => $now,
            ],

            // Validation Settings
            [
                'key' => 'require_all_posted',
                'value' => 'true',
                'type' => 'boolean',
                'description' => 'Wajib semua jurnal sudah di-posting sebelum close',
                'group' => 'validation',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'key' => 'require_all_balanced',
                'value' => 'true',
                'type' => 'boolean',
                'description' => 'Wajib semua jurnal balance (debit = kredit)',
                'group' => 'validation',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'key' => 'require_bank_reconciliation',
                'value' => 'true',
                'type' => 'boolean',
                'description' => 'Wajib rekonsiliasi bank selesai',
                'group' => 'validation',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'key' => 'require_cash_opname',
                'value' => 'false',
                'type' => 'boolean',
                'description' => 'Wajib kas opname selesai',
                'group' => 'validation',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'key' => 'require_inventory_count',
                'value' => 'false',
                'type' => 'boolean',
                'description' => 'Wajib stock opname selesai',
                'group' => 'validation',
                'created_at' => $now,
                'updated_at' => $now,
            ],

            // Approval Settings
            [
                'key' => 'require_approval_after_soft_close',
                'value' => 'true',
                'type' => 'boolean',
                'description' => 'Revisi data setelah soft close butuh approval manager',
                'group' => 'approval',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'key' => 'material_threshold',
                'value' => '1000000',
                'type' => 'integer',
                'description' => 'Batas nilai material untuk revisi (Rp). Revisi di atas nilai ini wajib approval',
                'group' => 'approval',
                'created_at' => $now,
                'updated_at' => $now,
            ],

            // Notification Settings
            [
                'key' => 'send_reminder_notifications',
                'value' => 'true',
                'type' => 'boolean',
                'description' => 'Kirim notifikasi reminder ke user sebelum deadline',
                'group' => 'notification',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'key' => 'notification_email',
                'value' => 'finance@company.com',
                'type' => 'string',
                'description' => 'Email untuk menerima notifikasi penting',
                'group' => 'notification',
                'created_at' => $now,
                'updated_at' => $now,
            ],

            // Emergency Settings
            [
                'key' => 'allow_reopen_hard_close',
                'value' => 'false',
                'type' => 'boolean',
                'description' => 'Izinkan membuka kembali periode yang sudah hard close (hati-hati!)',
                'group' => 'emergency',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        DB::table('closing_period_settings')->insert($settings);

        // ===== PERIOD TEMPLATES =====
        $templates = [
            [
                'template_name' => 'Monthly Standard',
                'period_type' => 'monthly',
                'cutoff_days' => 5,
                'hard_close_days' => 15,
                'required_checklists' => json_encode([
                    'jurnal_balance',
                    'all_posted',
                    'bank_reconciliation',
                ]),
                'is_active' => true,
                'is_default' => true,
                'description' => 'Template standar untuk closing bulanan. Soft close H+5, hard close H+15.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'template_name' => 'Monthly Fast',
                'period_type' => 'monthly',
                'cutoff_days' => 3,
                'hard_close_days' => 10,
                'required_checklists' => json_encode([
                    'jurnal_balance',
                    'all_posted',
                ]),
                'is_active' => true,
                'is_default' => false,
                'description' => 'Template cepat untuk closing bulanan. Soft close H+3, hard close H+10.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'template_name' => 'Weekly Review',
                'period_type' => 'weekly',
                'cutoff_days' => 2,
                'hard_close_days' => null,
                'required_checklists' => json_encode([
                    'jurnal_balance',
                ]),
                'is_active' => true,
                'is_default' => false,
                'description' => 'Template untuk review mingguan. Hanya soft close, tanpa hard close.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'template_name' => 'Quarterly Report',
                'period_type' => 'quarterly',
                'cutoff_days' => 10,
                'hard_close_days' => 30,
                'required_checklists' => json_encode([
                    'jurnal_balance',
                    'all_posted',
                    'bank_reconciliation',
                    'cash_opname',
                    'inventory_count',
                ]),
                'is_active' => true,
                'is_default' => false,
                'description' => 'Template untuk closing kuartalan. Semua checklist wajib.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'template_name' => 'Year End',
                'period_type' => 'yearly',
                'cutoff_days' => 15,
                'hard_close_days' => 45,
                'required_checklists' => json_encode([
                    'jurnal_balance',
                    'all_posted',
                    'bank_reconciliation',
                    'cash_opname',
                    'inventory_count',
                ]),
                'is_active' => true,
                'is_default' => false,
                'description' => 'Template untuk closing akhir tahun. Waktu lebih panjang, checklist lengkap.',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        DB::table('period_templates')->insert($templates);

        $this->command->info('✓ Closing period settings and templates seeded successfully!');
        $this->command->info('✓ Module is DISABLED by default (closing_module_enabled = false)');
        $this->command->info('✓ Created 17 settings and 5 templates');
    }
}
