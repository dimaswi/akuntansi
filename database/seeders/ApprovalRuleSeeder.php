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

        // Cash Transaction Rules
        ApprovalRule::create([
            'name' => 'Cash Transaction - High Value',
            'entity_type' => 'cash_transaction',
            'approval_type' => 'transaction',
            'is_active' => true,
            'min_amount' => 5000000, // 5 juta ke atas
            'max_amount' => null,
            'approval_levels' => 1,
            'approver_roles' => ['supervisor_keuangan', 'manager_keuangan'],
            'escalation_hours' => 24,
            'auto_approve_weekends' => false,
            'conditions' => [
                'requires_supervisor' => true,
                'max_daily_total' => 50000000, // 50 juta per hari
            ],
        ]);

        ApprovalRule::create([
            'name' => 'Cash Transaction - Very High Value',
            'entity_type' => 'cash_transaction',
            'approval_type' => 'transaction',
            'is_active' => true,
            'min_amount' => 25000000, // 25 juta ke atas
            'max_amount' => null,
            'approval_levels' => 2,
            'approver_roles' => ['manager_keuangan'],
            'escalation_hours' => 12,
            'auto_approve_weekends' => false,
            'conditions' => [
                'requires_manager' => true,
                'requires_documentation' => true,
            ],
        ]);

        // Bank Transaction Rules
        ApprovalRule::create([
            'name' => 'Bank Transaction - High Value',
            'entity_type' => 'bank_transaction',
            'approval_type' => 'transaction',
            'is_active' => true,
            'min_amount' => 10000000, // 10 juta ke atas
            'max_amount' => null,
            'approval_levels' => 1,
            'approver_roles' => ['supervisor_keuangan', 'manager_keuangan'],
            'escalation_hours' => 24,
            'auto_approve_weekends' => false,
            'conditions' => [
                'requires_supervisor' => true,
            ],
        ]);

        ApprovalRule::create([
            'name' => 'Bank Transaction - Very High Value',
            'entity_type' => 'bank_transaction',
            'approval_type' => 'transaction',
            'is_active' => true,
            'min_amount' => 50000000, // 50 juta ke atas
            'max_amount' => null,
            'approval_levels' => 2,
            'approver_roles' => ['manager_keuangan'],
            'escalation_hours' => 12,
            'auto_approve_weekends' => false,
            'conditions' => [
                'requires_manager' => true,
                'requires_board_approval' => true,
            ],
        ]);

        // Giro Transaction Rules
        ApprovalRule::create([
            'name' => 'Giro Transaction - High Value',
            'entity_type' => 'giro_transaction',
            'approval_type' => 'transaction',
            'is_active' => true,
            'min_amount' => 15000000, // 15 juta ke atas
            'max_amount' => null,
            'approval_levels' => 1,
            'approver_roles' => ['supervisor_keuangan', 'manager_keuangan'],
            'escalation_hours' => 48, // Giro butuh waktu lebih lama
            'auto_approve_weekends' => false,
            'conditions' => [
                'requires_bank_verification' => true,
                'requires_supervisor' => true,
            ],
        ]);

        ApprovalRule::create([
            'name' => 'Giro Transaction - Very High Value',
            'entity_type' => 'giro_transaction',
            'approval_type' => 'transaction',
            'is_active' => true,
            'min_amount' => 100000000, // 100 juta ke atas
            'max_amount' => null,
            'approval_levels' => 2,
            'approver_roles' => ['manager_keuangan'],
            'escalation_hours' => 24,
            'auto_approve_weekends' => false,
            'conditions' => [
                'requires_manager' => true,
                'requires_legal_review' => true,
                'requires_board_approval' => true,
            ],
        ]);

        // Journal Posting Rules
        ApprovalRule::create([
            'name' => 'Journal Posting - Batch Approval',
            'entity_type' => 'journal_posting',
            'approval_type' => 'journal_posting',
            'is_active' => true,
            'min_amount' => 1000000, // 1 juta ke atas
            'max_amount' => null,
            'approval_levels' => 1,
            'approver_roles' => ['supervisor_keuangan', 'manager_keuangan'],
            'escalation_hours' => 24,
            'auto_approve_weekends' => false,
            'conditions' => [
                'requires_accounting_review' => true,
            ],
        ]);

        // Monthly Closing Rules
        ApprovalRule::create([
            'name' => 'Monthly Closing Approval',
            'entity_type' => 'monthly_closing',
            'approval_type' => 'monthly_closing',
            'is_active' => true,
            'min_amount' => null,
            'max_amount' => null,
            'approval_levels' => 2,
            'approver_roles' => ['manager_keuangan'],
            'escalation_hours' => 72,
            'auto_approve_weekends' => false,
            'conditions' => [
                'requires_manager' => true,
                'requires_reconciliation' => true,
                'requires_variance_analysis' => true,
            ],
        ]);
    }
}
