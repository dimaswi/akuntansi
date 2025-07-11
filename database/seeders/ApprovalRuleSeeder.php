<?php

namespace Database\Seeders;

use App\Models\ApprovalRule;
use Illuminate\Database\Seeder;

class ApprovalRuleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clear existing rules
        ApprovalRule::truncate();

        // SIMPLIFIED APPROVAL RULES
        // Hanya untuk transaksi KELUAR dengan threshold sederhana
        
        // Cash Transaction Keluar - Simple Rule
        ApprovalRule::create([
            'name' => 'Cash Outgoing Transaction Approval',
            'entity_type' => 'cash_transaction',
            'approval_type' => 'transaction',
            'is_active' => true,
            'min_amount' => 1000000, // 1 juta ke atas
            'max_amount' => null,
            'approval_levels' => 1,
            'approver_roles' => ['supervisor_keuangan', 'manager_keuangan'],
            'escalation_hours' => 24,
            'auto_approve_weekends' => false,
            'conditions' => [
                'only_outgoing' => true, // Hanya untuk transaksi keluar
                'transaction_types' => ['pengeluaran', 'uang_muka_pengeluaran', 'transfer_keluar']
            ],
        ]);

        // Bank Transaction Keluar - Simple Rule
        ApprovalRule::create([
            'name' => 'Bank Outgoing Transaction Approval',
            'entity_type' => 'bank_transaction',
            'approval_type' => 'transaction',
            'is_active' => true,
            'min_amount' => 1000000, // 1 juta ke atas
            'max_amount' => null,
            'approval_levels' => 1,
            'approver_roles' => ['supervisor_keuangan', 'manager_keuangan'],
            'escalation_hours' => 24,
            'auto_approve_weekends' => false,
            'conditions' => [
                'only_outgoing' => true,
                'transaction_types' => ['pengeluaran', 'transfer_keluar']
            ],
        ]);

        // Giro Transaction Keluar - Simple Rule
        ApprovalRule::create([
            'name' => 'Giro Outgoing Transaction Approval',
            'entity_type' => 'giro_transaction',
            'approval_type' => 'transaction',
            'is_active' => true,
            'min_amount' => 1000000, // 1 juta ke atas
            'max_amount' => null,
            'approval_levels' => 1,
            'approver_roles' => ['supervisor_keuangan', 'manager_keuangan'],
            'escalation_hours' => 24,
            'auto_approve_weekends' => false,
            'conditions' => [
                'only_outgoing' => true,
                'transaction_types' => ['keluar']
            ],
        ]);
    }
}
