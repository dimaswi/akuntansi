<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class ReportsPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Define Reports permissions
        $permissions = [
            // Cash Flow Report
            ['name' => 'laporan.cash-flow.view', 'display_name' => 'Laporan Arus Kas', 'description' => 'Dapat melihat laporan arus kas dari cash management', 'module' => 'reports'],
            ['name' => 'laporan.cash-flow.export', 'display_name' => 'Export Laporan Arus Kas', 'description' => 'Dapat mengexport laporan arus kas', 'module' => 'reports'],
            
            // Giro Report
            ['name' => 'laporan.giro-report.view', 'display_name' => 'Laporan Giro', 'description' => 'Dapat melihat laporan giro', 'module' => 'reports'],
            ['name' => 'laporan.giro-report.export', 'display_name' => 'Export Laporan Giro', 'description' => 'Dapat mengexport laporan giro', 'module' => 'reports'],
            
            // Bank Reconciliation Report
            ['name' => 'laporan.bank-reconciliation.view', 'display_name' => 'Laporan Rekonsiliasi Bank', 'description' => 'Dapat melihat laporan rekonsiliasi bank', 'module' => 'reports'],
            ['name' => 'laporan.bank-reconciliation.export', 'display_name' => 'Export Laporan Rekonsiliasi Bank', 'description' => 'Dapat mengexport laporan rekonsiliasi bank', 'module' => 'reports'],
            
            // Financial Reports (General)
            ['name' => 'laporan.neraca.view', 'display_name' => 'Laporan Neraca', 'description' => 'Dapat melihat laporan neraca', 'module' => 'reports'],
            ['name' => 'laporan.laba-rugi.view', 'display_name' => 'Laporan Laba Rugi', 'description' => 'Dapat melihat laporan laba rugi', 'module' => 'reports'],
            ['name' => 'laporan.buku-besar.view', 'display_name' => 'Laporan Buku Besar', 'description' => 'Dapat melihat laporan buku besar', 'module' => 'reports'],
            ['name' => 'laporan.jurnal.view', 'display_name' => 'Laporan Jurnal', 'description' => 'Dapat melihat laporan jurnal', 'module' => 'reports'],
        ];

        // Create permissions
        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission['name']],
                $permission
            );
        }

        // Assign permissions to roles
        $adminRole = Role::where('name', 'administrator')->first();
        $keuanganRole = Role::where('name', 'keuangan')->first();
        $managerRole = Role::where('name', 'manager')->first();
        $supervisorRole = Role::where('name', 'supervisor')->first();

        if ($adminRole) {
            // Admin gets all permissions
            $allPermissions = Permission::whereIn('name', array_column($permissions, 'name'))->get();
            $adminRole->syncPermissions($adminRole->permissions->merge($allPermissions)->unique('id'));
        }

        if ($keuanganRole) {
            // Keuangan gets all report permissions
            $keuanganPermissions = Permission::whereIn('name', array_column($permissions, 'name'))->get();
            $keuanganRole->syncPermissions($keuanganRole->permissions->merge($keuanganPermissions)->unique('id'));
        }

        if ($managerRole) {
            // Manager gets view permissions for all reports
            $managerPermissions = Permission::whereIn('name', [
                'laporan.cash-flow.view',
                'laporan.giro-report.view', 
                'laporan.bank-reconciliation.view',
                'laporan.neraca.view',
                'laporan.laba-rugi.view',
                'laporan.buku-besar.view',
                'laporan.jurnal.view',
            ])->get();
            $managerRole->syncPermissions($managerRole->permissions->merge($managerPermissions)->unique('id'));
        }

        if ($supervisorRole) {
            // Supervisor gets basic report permissions
            $supervisorPermissions = Permission::whereIn('name', [
                'laporan.cash-flow.view',
                'laporan.giro-report.view',
                'laporan.jurnal.view',
            ])->get();
            $supervisorRole->syncPermissions($supervisorRole->permissions->merge($supervisorPermissions)->unique('id'));
        }
    }
}
