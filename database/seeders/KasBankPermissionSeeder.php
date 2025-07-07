<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class KasBankPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Define Kas & Bank permissions
        $permissions = [
            // Kas Management
            ['name' => 'kas.view', 'display_name' => 'Lihat Kas', 'description' => 'Dapat melihat data kas', 'module' => 'kas'],
            
            // Cash Transaction Management
            ['name' => 'kas.cash-transaction.view', 'display_name' => 'Lihat Transaksi Kas', 'description' => 'Dapat melihat transaksi kas', 'module' => 'kas'],
            ['name' => 'kas.cash-transaction.create', 'display_name' => 'Buat Transaksi Kas', 'description' => 'Dapat membuat transaksi kas', 'module' => 'kas'],
            ['name' => 'kas.cash-transaction.edit', 'display_name' => 'Edit Transaksi Kas', 'description' => 'Dapat mengedit transaksi kas', 'module' => 'kas'],
            ['name' => 'kas.cash-transaction.delete', 'display_name' => 'Hapus Transaksi Kas', 'description' => 'Dapat menghapus transaksi kas', 'module' => 'kas'],
            ['name' => 'kas.cash-transaction.post', 'display_name' => 'Posting Transaksi Kas', 'description' => 'Dapat melakukan posting transaksi kas', 'module' => 'kas'],

            // Bank Account Management
            ['name' => 'kas.bank-account.view', 'display_name' => 'Lihat Rekening Bank', 'description' => 'Dapat melihat data rekening bank', 'module' => 'kas'],
            ['name' => 'kas.bank-account.create', 'display_name' => 'Buat Rekening Bank', 'description' => 'Dapat membuat rekening bank', 'module' => 'kas'],
            ['name' => 'kas.bank-account.edit', 'display_name' => 'Edit Rekening Bank', 'description' => 'Dapat mengedit rekening bank', 'module' => 'kas'],
            ['name' => 'kas.bank-account.delete', 'display_name' => 'Hapus Rekening Bank', 'description' => 'Dapat menghapus rekening bank', 'module' => 'kas'],

            // Bank Transaction Management
            ['name' => 'kas.bank-transaction.view', 'display_name' => 'Lihat Transaksi Bank', 'description' => 'Dapat melihat transaksi bank', 'module' => 'kas'],
            ['name' => 'kas.bank-transaction.create', 'display_name' => 'Buat Transaksi Bank', 'description' => 'Dapat membuat transaksi bank', 'module' => 'kas'],
            ['name' => 'kas.bank-transaction.edit', 'display_name' => 'Edit Transaksi Bank', 'description' => 'Dapat mengedit transaksi bank', 'module' => 'kas'],
            ['name' => 'kas.bank-transaction.delete', 'display_name' => 'Hapus Transaksi Bank', 'description' => 'Dapat menghapus transaksi bank', 'module' => 'kas'],
            ['name' => 'kas.bank-transaction.post', 'display_name' => 'Posting Transaksi Bank', 'description' => 'Dapat melakukan posting transaksi bank', 'module' => 'kas'],
            ['name' => 'kas.bank-transaction.reconcile', 'display_name' => 'Rekonsiliasi Bank', 'description' => 'Dapat melakukan rekonsiliasi bank', 'module' => 'kas'],

            // Giro Transaction Management
            ['name' => 'kas.giro-transaction.view', 'display_name' => 'Lihat Transaksi Giro', 'description' => 'Dapat melihat transaksi giro', 'module' => 'kas'],
            ['name' => 'kas.giro-transaction.create', 'display_name' => 'Buat Transaksi Giro', 'description' => 'Dapat membuat transaksi giro', 'module' => 'kas'],
            ['name' => 'kas.giro-transaction.edit', 'display_name' => 'Edit Transaksi Giro', 'description' => 'Dapat mengedit transaksi giro', 'module' => 'kas'],
            ['name' => 'kas.giro-transaction.delete', 'display_name' => 'Hapus Transaksi Giro', 'description' => 'Dapat menghapus transaksi giro', 'module' => 'kas'],
            ['name' => 'kas.giro-transaction.post', 'display_name' => 'Posting Transaksi Giro', 'description' => 'Dapat melakukan posting transaksi giro', 'module' => 'kas'],
            ['name' => 'kas.giro-transaction.clear', 'display_name' => 'Cairkan Giro', 'description' => 'Dapat mencairkan giro', 'module' => 'kas'],
            ['name' => 'kas.giro-transaction.reject', 'display_name' => 'Tolak Giro', 'description' => 'Dapat menolak giro', 'module' => 'kas'],
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
        $kasirRole = Role::where('name', 'kasir')->first();
        $keuanganRole = Role::where('name', 'keuangan')->first();

        if ($adminRole) {
            // Admin gets all permissions
            $allPermissions = Permission::whereIn('name', array_column($permissions, 'name'))->get();
            $adminRole->syncPermissions($allPermissions);
        }

        if ($kasirRole) {
            // Kasir gets cash transaction permissions
            $kasirPermissions = Permission::whereIn('name', [
                'kas.view',
                'kas.cash-transaction.view',
                'kas.cash-transaction.create',
                'kas.cash-transaction.edit',
            ])->get();
            $kasirRole->syncPermissions($kasirRole->permissions->merge($kasirPermissions)->unique('id'));
        }

        if ($keuanganRole) {
            // Keuangan gets full kas & bank permissions
            $keuanganPermissions = Permission::whereIn('name', array_column($permissions, 'name'))->get();
            $keuanganRole->syncPermissions($keuanganRole->permissions->merge($keuanganPermissions)->unique('id'));
        }
    }
}
