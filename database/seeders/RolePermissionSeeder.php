<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create Permissions
        $permissions = [
            // User Management
            ['name' => 'user.view', 'display_name' => 'Lihat User', 'description' => 'Dapat melihat daftar user', 'module' => 'User Management'],
            ['name' => 'user.create', 'display_name' => 'Tambah User', 'description' => 'Dapat menambah user baru', 'module' => 'User Management'],
            ['name' => 'user.edit', 'display_name' => 'Edit User', 'description' => 'Dapat mengedit data user', 'module' => 'User Management'],
            ['name' => 'user.delete', 'display_name' => 'Hapus User', 'description' => 'Dapat menghapus user', 'module' => 'User Management'],
            
            // Role Management
            ['name' => 'role.view', 'display_name' => 'Lihat Role', 'description' => 'Dapat melihat daftar role', 'module' => 'Role Management'],
            ['name' => 'role.create', 'display_name' => 'Tambah Role', 'description' => 'Dapat menambah role baru', 'module' => 'Role Management'],
            ['name' => 'role.edit', 'display_name' => 'Edit Role', 'description' => 'Dapat mengedit role', 'module' => 'Role Management'],
            ['name' => 'role.delete', 'display_name' => 'Hapus Role', 'description' => 'Dapat menghapus role', 'module' => 'Role Management'],
            
            // Permission Management
            ['name' => 'permission.view', 'display_name' => 'Lihat Permission', 'description' => 'Dapat melihat daftar permission', 'module' => 'Permission Management'],
            ['name' => 'permission.create', 'display_name' => 'Tambah Permission', 'description' => 'Dapat menambah permission baru', 'module' => 'Permission Management'],
            ['name' => 'permission.edit', 'display_name' => 'Edit Permission', 'description' => 'Dapat mengedit permission', 'module' => 'Permission Management'],
            ['name' => 'permission.delete', 'display_name' => 'Hapus Permission', 'description' => 'Dapat menghapus permission', 'module' => 'Permission Management'],
            
            // Dashboard
            ['name' => 'dashboard.view', 'display_name' => 'Lihat Dashboard', 'description' => 'Dapat mengakses dashboard', 'module' => 'Dashboard'],
            
            // Settings
            ['name' => 'settings.view', 'display_name' => 'Lihat Settings', 'description' => 'Dapat melihat pengaturan', 'module' => 'Settings'],
            ['name' => 'settings.edit', 'display_name' => 'Edit Settings', 'description' => 'Dapat mengedit pengaturan', 'module' => 'Settings'],
            
            // Akuntansi - Daftar Akun
            ['name' => 'akuntansi.daftar-akun.view', 'display_name' => 'Lihat Daftar Akun', 'description' => 'Dapat melihat daftar akun', 'module' => 'Akuntansi'],
            ['name' => 'akuntansi.daftar-akun.create', 'display_name' => 'Tambah Daftar Akun', 'description' => 'Dapat menambah akun baru', 'module' => 'Akuntansi'],
            ['name' => 'akuntansi.daftar-akun.edit', 'display_name' => 'Edit Daftar Akun', 'description' => 'Dapat mengedit akun', 'module' => 'Akuntansi'],
            ['name' => 'akuntansi.daftar-akun.delete', 'display_name' => 'Hapus Daftar Akun', 'description' => 'Dapat menghapus akun', 'module' => 'Akuntansi'],
            
            // Akuntansi - Jurnal
            ['name' => 'akuntansi.jurnal.view', 'display_name' => 'Lihat Jurnal', 'description' => 'Dapat melihat jurnal', 'module' => 'Akuntansi'],
            ['name' => 'akuntansi.jurnal.create', 'display_name' => 'Tambah Jurnal', 'description' => 'Dapat menambah jurnal baru', 'module' => 'Akuntansi'],
            ['name' => 'akuntansi.jurnal.edit', 'display_name' => 'Edit Jurnal', 'description' => 'Dapat mengedit jurnal', 'module' => 'Akuntansi'],
            ['name' => 'akuntansi.jurnal.delete', 'display_name' => 'Hapus Jurnal', 'description' => 'Dapat menghapus jurnal', 'module' => 'Akuntansi'],
            ['name' => 'akuntansi.jurnal.post', 'display_name' => 'Post Jurnal', 'description' => 'Dapat memposting jurnal', 'module' => 'Akuntansi'],
            ['name' => 'akuntansi.jurnal.reverse', 'display_name' => 'Reverse Jurnal', 'description' => 'Dapat membalik jurnal', 'module' => 'Akuntansi'],
            
            // Akuntansi - Buku Besar
            ['name' => 'akuntansi.buku-besar.view', 'display_name' => 'Lihat Buku Besar', 'description' => 'Dapat melihat buku besar', 'module' => 'Akuntansi'],
            ['name' => 'akuntansi.buku-besar.export', 'display_name' => 'Export Buku Besar', 'description' => 'Dapat mengexport buku besar', 'module' => 'Akuntansi'],
            
            // Akuntansi - Laporan Keuangan
            ['name' => 'akuntansi.laporan.view', 'display_name' => 'Lihat Laporan Keuangan', 'description' => 'Dapat melihat laporan keuangan', 'module' => 'Akuntansi'],
            ['name' => 'akuntansi.laporan.export', 'display_name' => 'Export Laporan Keuangan', 'description' => 'Dapat mengexport laporan keuangan', 'module' => 'Akuntansi'],
            
            // Akuntansi - General
            ['name' => 'akuntansi.view', 'display_name' => 'Lihat Akuntansi', 'description' => 'Dapat mengakses modul akuntansi', 'module' => 'Akuntansi'],
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission['name']],
                $permission
            );
        }

        // Create Roles
        $adminRole = Role::firstOrCreate(
            ['name' => 'admin'],
            [
                'display_name' => 'Administrator',
                'description' => 'Administrator dengan akses penuh ke semua fitur sistem'
            ]
        );

        $managerRole = Role::firstOrCreate(
            ['name' => 'manager'],
            [
                'display_name' => 'Manager',
                'description' => 'Manager dengan akses terbatas ke fitur manajemen'
            ]
        );

        $userRole = Role::firstOrCreate(
            ['name' => 'user'],
            [
                'display_name' => 'User',
                'description' => 'User biasa dengan akses terbatas'
            ]
        );

        // Assign permissions to Admin (all permissions)
        $allPermissions = Permission::all();
        $adminRole->permissions()->sync($allPermissions->pluck('id'));

        // Assign permissions to Manager (limited permissions)
        $managerPermissions = Permission::whereIn('name', [
            'user.view', 'user.create', 'user.edit',
            'dashboard.view',
            'settings.view',
            'akuntansi.view',
            'akuntansi.daftar-akun.view', 'akuntansi.daftar-akun.create', 'akuntansi.daftar-akun.edit',
            'akuntansi.jurnal.view', 'akuntansi.jurnal.create', 'akuntansi.jurnal.edit', 'akuntansi.jurnal.post',
            'akuntansi.buku-besar.view', 'akuntansi.buku-besar.export',
            'akuntansi.laporan.view', 'akuntansi.laporan.export'
        ])->pluck('id');
        $managerRole->permissions()->sync($managerPermissions);

        // Assign permissions to User (very limited permissions)
        $userPermissions = Permission::whereIn('name', [
            'dashboard.view',
            'akuntansi.view',
            'akuntansi.buku-besar.view',
            'akuntansi.laporan.view'
        ])->pluck('id');
        $userRole->permissions()->sync($userPermissions);

        $this->command->info('Roles and permissions created successfully!');
    }
}
