<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add monthly closing permissions
        $monthlyClosingPermissions = [
            [
                'name' => 'monthly-closing.view',
                'display_name' => 'Lihat Monthly Closing',
                'description' => 'View monthly closing list and details',
                'module' => 'monthly-closing',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'monthly-closing.create',
                'display_name' => 'Buat Monthly Closing',
                'description' => 'Initiate monthly closing process',
                'module' => 'monthly-closing',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'monthly-closing.approve',
                'display_name' => 'Approve Monthly Closing',
                'description' => 'Approve monthly closing requests',
                'module' => 'monthly-closing',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'monthly-closing.close',
                'display_name' => 'Tutup Monthly Closing',
                'description' => 'Execute final monthly closing',
                'module' => 'monthly-closing',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'monthly-closing.reopen',
                'display_name' => 'Buka Kembali Monthly Closing',
                'description' => 'Reopen closed monthly periods',
                'module' => 'monthly-closing',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'monthly-closing.manage',
                'display_name' => 'Kelola Monthly Closing',
                'description' => 'Full monthly closing management access',
                'module' => 'monthly-closing',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'cut-off.bypass',
                'display_name' => 'Bypass Cut-off',
                'description' => 'Bypass cut-off restrictions for urgent transactions',
                'module' => 'monthly-closing',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'cut-off.manage',
                'display_name' => 'Kelola Cut-off',
                'description' => 'Manage cut-off dates and restrictions',
                'module' => 'monthly-closing',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        // Add approval permissions
        $approvalPermissions = [
            [
                'name' => 'approval.cash-transactions.approve',
                'display_name' => 'Approve Cash Transactions',
                'description' => 'Approve cash transactions',
                'module' => 'approvals',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'approval.journal-posting.approve',
                'display_name' => 'Approve Journal Posting',
                'description' => 'Approve journal posting',
                'module' => 'approvals',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'approval.monthly-closing.approve',
                'display_name' => 'Approve Monthly Closing',
                'description' => 'Approve monthly closing requests',
                'module' => 'approvals',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'approvals.view',
                'display_name' => 'Lihat Approvals',
                'description' => 'View pending approvals',
                'module' => 'approvals',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'approvals.delegate',
                'display_name' => 'Delegate Approval',
                'description' => 'Delegate approval to others',
                'module' => 'approvals',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'approvals.bulk-approve',
                'display_name' => 'Bulk Approve',
                'description' => 'Bulk approve multiple transactions',
                'module' => 'approvals',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'approvals.override',
                'display_name' => 'Override Approval',
                'description' => 'Override approval requirements',
                'module' => 'approvals',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        // Insert permissions
        DB::table('permissions')->insert(array_merge($monthlyClosingPermissions, $approvalPermissions));
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove monthly closing permissions
        $monthlyClosingPermissionNames = [
            'monthly-closing.view',
            'monthly-closing.create',
            'monthly-closing.approve',
            'monthly-closing.close',
            'monthly-closing.reopen',
            'monthly-closing.manage',
            'cut-off.bypass',
            'cut-off.manage',
        ];

        // Remove approval permissions
        $approvalPermissionNames = [
            'approval.cash-transactions.approve',
            'approval.journal-posting.approve',
            'approval.monthly-closing.approve',
            'approvals.view',
            'approvals.delegate',
            'approvals.bulk-approve',
            'approvals.override',
        ];

        DB::table('permissions')->whereIn('name', array_merge($monthlyClosingPermissionNames, $approvalPermissionNames))->delete();
    }
};
