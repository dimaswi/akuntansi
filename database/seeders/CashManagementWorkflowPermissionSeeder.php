<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class CashManagementWorkflowPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * This seeder adds permissions for the new separated Cash Management vs Accounting workflow
     */
    public function run(): void
    {
        // New permissions for separated workflow
        $newPermissions = [
            // Base Kas permissions (compatibility)
            ['name' => 'kas.view', 'display_name' => 'Lihat Kas', 'description' => 'Dapat melihat modul kas', 'module' => 'cash_management'],
            ['name' => 'kas.cash-transaction.view', 'display_name' => 'View Cash Transaction', 'description' => 'Dapat melihat transaksi kas', 'module' => 'cash_management'],
            ['name' => 'kas.bank-transaction.view', 'display_name' => 'View Bank Transaction', 'description' => 'Dapat melihat transaksi bank', 'module' => 'cash_management'],
            ['name' => 'kas.giro-transaction.view', 'display_name' => 'View Giro Transaction', 'description' => 'Dapat melihat transaksi giro', 'module' => 'cash_management'],
            ['name' => 'kas.giro-transaction.create', 'display_name' => 'Create Giro Transaction', 'description' => 'Dapat membuat transaksi giro baru', 'module' => 'cash_management'],
            ['name' => 'kas.giro-transaction.edit', 'display_name' => 'Edit Giro Transaction', 'description' => 'Dapat edit transaksi giro', 'module' => 'cash_management'],
            ['name' => 'kas.giro-transaction.delete', 'display_name' => 'Delete Giro Transaction', 'description' => 'Dapat hapus transaksi giro', 'module' => 'cash_management'],
            ['name' => 'kas.giro-transaction.post', 'display_name' => 'Post Giro Transaction', 'description' => 'Dapat posting giro ke bank', 'module' => 'cash_management'],
            ['name' => 'kas.giro-transaction.clear', 'display_name' => 'Clear Giro Transaction', 'description' => 'Dapat pencairan giro', 'module' => 'cash_management'],
            ['name' => 'kas.giro-transaction.reject', 'display_name' => 'Reject Giro Transaction', 'description' => 'Dapat tolak giro', 'module' => 'cash_management'],
            
            // Cash Management Operations (Daily operations by Kasir/Bendahara)
            ['name' => 'kas.cash-management.view', 'display_name' => 'Lihat Cash Management', 'description' => 'Dapat melihat dashboard dan laporan arus kas', 'module' => 'cash_management'],
            ['name' => 'kas.cash-management.daily-entry', 'display_name' => 'Input Kas Harian', 'description' => 'Dapat input transaksi kas/bank/giro harian (draft)', 'module' => 'cash_management'],
            ['name' => 'kas.cash-management.monitoring', 'display_name' => 'Monitoring Saldo', 'description' => 'Dapat melihat saldo kas/bank real-time', 'module' => 'cash_management'],
            ['name' => 'kas.cash-management.reconcile', 'display_name' => 'Rekonsiliasi Bank', 'description' => 'Dapat melakukan rekonsiliasi bank', 'module' => 'cash_management'],
            
            // Journal Posting (Periodic operations by Akuntan)
            ['name' => 'akuntansi.journal-posting.view', 'display_name' => 'Lihat Posting Jurnal', 'description' => 'Dapat melihat transaksi draft untuk posting', 'module' => 'accounting'],
            ['name' => 'akuntansi.journal-posting.post', 'display_name' => 'Post ke Jurnal', 'description' => 'Dapat posting transaksi kas/bank/giro ke jurnal', 'module' => 'accounting'],
            ['name' => 'akuntansi.journal-posting.mapping', 'display_name' => 'Mapping Akun', 'description' => 'Dapat mapping transaksi kas ke akun yang tepat', 'module' => 'accounting'],
            ['name' => 'akuntansi.journal-posting.batch', 'display_name' => 'Batch Posting', 'description' => 'Dapat melakukan posting batch multiple transaksi', 'module' => 'accounting'],
            
            // Financial Reports (Management level)
            ['name' => 'laporan.cash-flow.view', 'display_name' => 'Laporan Arus Kas', 'description' => 'Dapat melihat laporan arus kas dari cash management', 'module' => 'reports'],
            ['name' => 'laporan.giro-report.view', 'display_name' => 'Laporan Giro', 'description' => 'Dapat melihat laporan posisi dan analisis giro', 'module' => 'reports'],
            ['name' => 'laporan.financial-statements.view', 'display_name' => 'Laporan Keuangan', 'description' => 'Dapat melihat laporan keuangan formal dari jurnal', 'module' => 'reports'],
            ['name' => 'laporan.variance-analysis.view', 'display_name' => 'Analisis Varians', 'description' => 'Dapat melihat analisis perbedaan kas vs akuntansi', 'module' => 'reports'],
            
            // Approval & Control (Supervisor level) - SIMPLIFIED
            ['name' => 'approval.outgoing-transactions.approve', 'display_name' => 'Approve Transaksi Keluar', 'description' => 'Dapat menyetujui transaksi keluar kas/bank/giro', 'module' => 'approval'],
            
            // Legacy permissions still used by routes/components
            ['name' => 'kas.cash-transaction.delete', 'display_name' => 'Delete Cash Transaction', 'description' => 'Dapat menghapus transaksi kas', 'module' => 'cash_management'],
            ['name' => 'kas.bank-transaction.delete', 'display_name' => 'Delete Bank Transaction', 'description' => 'Dapat menghapus transaksi bank', 'module' => 'cash_management'],
            ['name' => 'kas.bank-account.view', 'display_name' => 'View Bank Account', 'description' => 'Dapat melihat rekening bank', 'module' => 'cash_management'],
            ['name' => 'kas.bank-account.create', 'display_name' => 'Create Bank Account', 'description' => 'Dapat membuat rekening bank', 'module' => 'cash_management'],
            ['name' => 'kas.bank-account.edit', 'display_name' => 'Edit Bank Account', 'description' => 'Dapat edit rekening bank', 'module' => 'cash_management'],
            ['name' => 'kas.bank-account.delete', 'display_name' => 'Delete Bank Account', 'description' => 'Dapat hapus rekening bank', 'module' => 'cash_management'],
        ];

        // Create new permissions
        foreach ($newPermissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission['name']],
                $permission
            );
        }

        // Create or update roles for the new workflow
        $this->createOrUpdateRoles();
        
        // Assign permissions to roles
        $this->assignPermissionsToRoles();
    }

    private function createOrUpdateRoles()
    {
        // Kasir - Cash Management Operations
        Role::firstOrCreate(
            ['name' => 'kasir'],
            [
                'display_name' => 'Kasir',
                'description' => 'Staff kasir yang menangani transaksi kas harian'
            ]
        );

        // Bendahara - Treasury Operations
        Role::firstOrCreate(
            ['name' => 'bendahara'],
            [
                'display_name' => 'Bendahara',
                'description' => 'Bendahara yang menangani cash management dan bank'
            ]
        );

        // Akuntan - Accounting & Bookkeeping
        Role::firstOrCreate(
            ['name' => 'akuntan'],
            [
                'display_name' => 'Akuntan',
                'description' => 'Akuntan yang menangani jurnal dan pembukuan formal'
            ]
        );

        // Supervisor Keuangan - Financial Control
        Role::firstOrCreate(
            ['name' => 'supervisor_keuangan'],
            [
                'display_name' => 'Supervisor Keuangan',
                'description' => 'Supervisor yang mengawasi operasional keuangan'
            ]
        );

        // Manager Keuangan - Strategic Financial Management
        Role::firstOrCreate(
            ['name' => 'manager_keuangan'],
            [
                'display_name' => 'Manager Keuangan',
                'description' => 'Manager keuangan dengan akses penuh laporan'
            ]
        );
    }

    private function assignPermissionsToRoles()
    {
        // KASIR - Daily Cash Operations
        $kasirRole = Role::where('name', 'kasir')->first();
        if ($kasirRole) {
            $kasirPermissions = Permission::whereIn('name', [
                'dashboard.view',
                'kas.view',
                'kas.cash-transaction.view',
                'kas.cash-management.view',
                'kas.cash-management.daily-entry',
                'kas.cash-management.monitoring',
                'laporan.cash-flow.view',
            ])->get();
            
            // Detach all permissions first, then attach new ones
            $kasirRole->permissions()->detach();
            $kasirRole->permissions()->attach($kasirPermissions->pluck('id'));
        }

        // BENDAHARA - Treasury & Bank Management
        $bendaharaRole = Role::where('name', 'bendahara')->first();
        if ($bendaharaRole) {
            $bendaharaPermissions = Permission::whereIn('name', [
                'dashboard.view',
                'kas.view',
                'kas.cash-transaction.view',
                'kas.bank-transaction.view',
                'kas.giro-transaction.view',
                'kas.giro-transaction.create',
                'kas.giro-transaction.edit',
                'kas.giro-transaction.post',
                'kas.giro-transaction.clear',
                'kas.cash-management.view',
                'kas.cash-management.daily-entry',
                'kas.cash-management.monitoring',
                'kas.cash-management.reconcile',
                'kas.bank-account.view',
                'kas.bank-account.create',
                'kas.bank-account.edit',
                'laporan.cash-flow.view',
                'laporan.giro-report.view',
            ])->get();
            
            $bendaharaRole->permissions()->detach();
            $bendaharaRole->permissions()->attach($bendaharaPermissions->pluck('id'));
        }

        // AKUNTAN - Accounting & Journal Posting
        $akuntanRole = Role::where('name', 'akuntan')->first();
        if ($akuntanRole) {
            $akuntanPermissions = Permission::whereIn('name', [
                'dashboard.view',
                'akuntansi.view',
                'akuntansi.daftar-akun.view',
                'akuntansi.daftar-akun.create',
                'akuntansi.daftar-akun.edit',
                'akuntansi.jurnal.view',
                'akuntansi.jurnal.create',
                'akuntansi.jurnal.edit',
                'akuntansi.jurnal.post',
                'akuntansi.journal-posting.view',
                'akuntansi.journal-posting.post',
                'akuntansi.journal-posting.mapping',
                'akuntansi.journal-posting.batch',
                'akuntansi.buku-besar.view',
                'akuntansi.laporan.view',
                'laporan.financial-statements.view',
                'laporan.variance-analysis.view',
                // Read-only access to cash management for reference
                'kas.cash-management.view',
            ])->get();
            
            $akuntanRole->permissions()->detach();
            $akuntanRole->permissions()->attach($akuntanPermissions->pluck('id'));
        }

        // SUPERVISOR KEUANGAN - Financial Control & Approval
        $supervisorRole = Role::where('name', 'supervisor_keuangan')->first();
        if ($supervisorRole) {
            $supervisorPermissions = Permission::whereIn('name', [
                'dashboard.view',
                // All kas permissions
                'kas.view',
                'kas.cash-transaction.view',
                'kas.bank-transaction.view', 
                'kas.giro-transaction.view',
                'kas.giro-transaction.create',
                'kas.giro-transaction.edit',
                'kas.giro-transaction.delete',
                'kas.giro-transaction.post',
                'kas.giro-transaction.clear',
                'kas.giro-transaction.reject',
                // All cash management permissions
                'kas.cash-management.view',
                'kas.cash-management.daily-entry',
                'kas.cash-management.monitoring',
                'kas.cash-management.reconcile',
                'kas.cash-transaction.delete',
                'kas.bank-transaction.delete',
                'kas.bank-account.view',
                'kas.bank-account.create',
                'kas.bank-account.edit',
                'kas.bank-account.delete',
                // All accounting permissions
                'akuntansi.view',
                'akuntansi.jurnal.view',
                'akuntansi.journal-posting.view',
                'akuntansi.journal-posting.post',
                'akuntansi.buku-besar.view',
                'akuntansi.laporan.view',
                // All reports
                'laporan.cash-flow.view',
                'laporan.giro-report.view',
                'laporan.financial-statements.view',
                'laporan.variance-analysis.view',
                // Simplified approval permissions
                'approval.outgoing-transactions.approve',
            ])->get();
            
            $supervisorRole->permissions()->detach();
            $supervisorRole->permissions()->attach($supervisorPermissions->pluck('id'));
        }

        // MANAGER KEUANGAN - Strategic View + Full Access
        $managerRole = Role::where('name', 'manager_keuangan')->first();
        if ($managerRole) {
            // Manager gets all financial-related permissions
            $managerPermissions = Permission::where('module', 'cash_management')
                ->orWhere('module', 'accounting')
                ->orWhere('module', 'reports')
                ->orWhere('module', 'approval')
                ->orWhere('name', 'like', 'kas.%')
                ->orWhere('name', 'like', 'akuntansi.%')
                ->orWhere('name', 'like', 'laporan.%')
                ->orWhere('name', 'dashboard.view')
                ->get();
                
            $managerRole->permissions()->detach();
            $managerRole->permissions()->attach($managerPermissions->pluck('id'));
        }

        // ADMIN - Full access (unchanged)
        $adminRole = Role::where('name', 'admin')->first();
        if ($adminRole) {
            $allPermissions = Permission::all();
            $adminRole->permissions()->detach();
            $adminRole->permissions()->attach($allPermissions->pluck('id'));
        }
    }
}
