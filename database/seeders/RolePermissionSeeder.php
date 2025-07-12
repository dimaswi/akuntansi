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
            
            // Inventory - Dashboard
            ['name' => 'inventory.dashboard.view', 'display_name' => 'Lihat Dashboard Inventory', 'description' => 'Dapat melihat dashboard inventory', 'module' => 'Inventory'],
            
            // Inventory - Categories
            ['name' => 'inventory.categories.view', 'display_name' => 'Lihat Kategori Inventory', 'description' => 'Dapat melihat kategori inventory', 'module' => 'Inventory'],
            ['name' => 'inventory.categories.create', 'display_name' => 'Tambah Kategori Inventory', 'description' => 'Dapat menambah kategori inventory', 'module' => 'Inventory'],
            ['name' => 'inventory.categories.edit', 'display_name' => 'Edit Kategori Inventory', 'description' => 'Dapat mengedit kategori inventory', 'module' => 'Inventory'],
            ['name' => 'inventory.categories.delete', 'display_name' => 'Hapus Kategori Inventory', 'description' => 'Dapat menghapus kategori inventory', 'module' => 'Inventory'],
            
            // Inventory - Items
            ['name' => 'inventory.items.view', 'display_name' => 'Lihat Item Inventory', 'description' => 'Dapat melihat item inventory', 'module' => 'Inventory'],
            ['name' => 'inventory.items.create', 'display_name' => 'Tambah Item Inventory', 'description' => 'Dapat menambah item inventory', 'module' => 'Inventory'],
            ['name' => 'inventory.items.edit', 'display_name' => 'Edit Item Inventory', 'description' => 'Dapat mengedit item inventory', 'module' => 'Inventory'],
            ['name' => 'inventory.items.delete', 'display_name' => 'Hapus Item Inventory', 'description' => 'Dapat menghapus item inventory', 'module' => 'Inventory'],
            
            // Inventory - Stock Count
            ['name' => 'inventory.stock-count.view', 'display_name' => 'Lihat Stock Count', 'description' => 'Dapat melihat stock count', 'module' => 'Inventory'],
            ['name' => 'inventory.stock-count.create', 'display_name' => 'Tambah Stock Count', 'description' => 'Dapat membuat stock count', 'module' => 'Inventory'],
            ['name' => 'inventory.stock-count.edit', 'display_name' => 'Edit Stock Count', 'description' => 'Dapat mengedit stock count', 'module' => 'Inventory'],
            ['name' => 'inventory.stock-count.delete', 'display_name' => 'Hapus Stock Count', 'description' => 'Dapat menghapus stock count', 'module' => 'Inventory'],
            ['name' => 'inventory.stock-count.approve', 'display_name' => 'Approve Stock Count', 'description' => 'Dapat menyetujui stock count', 'module' => 'Inventory'],
            
            // Inventory - Stock Movement
            ['name' => 'inventory.stock-movement.view', 'display_name' => 'Lihat Pergerakan Stock', 'description' => 'Dapat melihat pergerakan stock', 'module' => 'Inventory'],
            ['name' => 'inventory.stock-movement.create', 'display_name' => 'Tambah Pergerakan Stock', 'description' => 'Dapat membuat pergerakan stock', 'module' => 'Inventory'],
            ['name' => 'inventory.stock-movement.edit', 'display_name' => 'Edit Pergerakan Stock', 'description' => 'Dapat mengedit pergerakan stock', 'module' => 'Inventory'],
            ['name' => 'inventory.stock-movement.approve', 'display_name' => 'Approve Pergerakan Stock', 'description' => 'Dapat menyetujui pergerakan stock', 'module' => 'Inventory'],
            
            // Inventory - Requisitions
            ['name' => 'inventory.requisitions.view', 'display_name' => 'Lihat Permintaan Barang', 'description' => 'Dapat melihat permintaan barang', 'module' => 'Inventory'],
            ['name' => 'inventory.requisitions.create', 'display_name' => 'Tambah Permintaan Barang', 'description' => 'Dapat membuat permintaan barang', 'module' => 'Inventory'],
            ['name' => 'inventory.requisitions.edit', 'display_name' => 'Edit Permintaan Barang', 'description' => 'Dapat mengedit permintaan barang', 'module' => 'Inventory'],
            ['name' => 'inventory.requisitions.approve', 'display_name' => 'Approve Permintaan Barang', 'description' => 'Dapat menyetujui permintaan barang', 'module' => 'Inventory'],
            
            // Inventory Management
            ['name' => 'inventory.view', 'display_name' => 'Lihat Dashboard Inventori', 'description' => 'Dapat mengakses dashboard inventori', 'module' => 'Inventory'],
            
            // Inventory Items
            ['name' => 'inventory.item.view', 'display_name' => 'Lihat Item Inventori', 'description' => 'Dapat melihat daftar item inventori', 'module' => 'Inventory'],
            ['name' => 'inventory.item.create', 'display_name' => 'Tambah Item Inventori', 'description' => 'Dapat menambah item inventori baru', 'module' => 'Inventory'],
            ['name' => 'inventory.item.edit', 'display_name' => 'Edit Item Inventori', 'description' => 'Dapat mengedit item inventori', 'module' => 'Inventory'],
            ['name' => 'inventory.item.delete', 'display_name' => 'Hapus Item Inventori', 'description' => 'Dapat menghapus item inventori', 'module' => 'Inventory'],
            
            // Inventory Locations
            ['name' => 'inventory.location.view', 'display_name' => 'Lihat Lokasi Inventori', 'description' => 'Dapat melihat daftar lokasi inventori', 'module' => 'Inventory'],
            ['name' => 'inventory.location.create', 'display_name' => 'Tambah Lokasi Inventori', 'description' => 'Dapat menambah lokasi inventori baru', 'module' => 'Inventory'],
            ['name' => 'inventory.location.edit', 'display_name' => 'Edit Lokasi Inventori', 'description' => 'Dapat mengedit lokasi inventori', 'module' => 'Inventory'],
            ['name' => 'inventory.location.delete', 'display_name' => 'Hapus Lokasi Inventori', 'description' => 'Dapat menghapus lokasi inventori', 'module' => 'Inventory'],
            
            // Stock Movements
            ['name' => 'inventory.movement.view', 'display_name' => 'Lihat Perpindahan Stok', 'description' => 'Dapat melihat daftar perpindahan stok', 'module' => 'Inventory'],
            ['name' => 'inventory.movement.create', 'display_name' => 'Tambah Perpindahan Stok', 'description' => 'Dapat menambah perpindahan stok baru', 'module' => 'Inventory'],
            ['name' => 'inventory.movement.edit', 'display_name' => 'Edit Perpindahan Stok', 'description' => 'Dapat mengedit perpindahan stok', 'module' => 'Inventory'],
            ['name' => 'inventory.movement.delete', 'display_name' => 'Hapus Perpindahan Stok', 'description' => 'Dapat menghapus perpindahan stok', 'module' => 'Inventory'],
            ['name' => 'inventory.movement.approve', 'display_name' => 'Approve Perpindahan Stok', 'description' => 'Dapat menyetujui perpindahan stok', 'module' => 'Inventory'],
            
            // Inventory Reports
            ['name' => 'inventory.report.view', 'display_name' => 'Lihat Laporan Inventori', 'description' => 'Dapat melihat laporan inventori', 'module' => 'Inventory'],
            ['name' => 'inventory.report.export', 'display_name' => 'Export Laporan Inventori', 'description' => 'Dapat mengexport laporan inventori', 'module' => 'Inventory'],
            
            // Department Management
            ['name' => 'department.view', 'display_name' => 'Lihat Departemen', 'description' => 'Dapat melihat daftar departemen', 'module' => 'Department'],
            ['name' => 'department.create', 'display_name' => 'Tambah Departemen', 'description' => 'Dapat menambah departemen baru', 'module' => 'Department'],
            ['name' => 'department.edit', 'display_name' => 'Edit Departemen', 'description' => 'Dapat mengedit departemen', 'module' => 'Department'],
            ['name' => 'department.delete', 'display_name' => 'Hapus Departemen', 'description' => 'Dapat menghapus departemen', 'module' => 'Department'],
            
            // Department Request Management
            ['name' => 'department_requests.view', 'display_name' => 'Lihat Permintaan Departemen', 'description' => 'Dapat melihat permintaan departemen', 'module' => 'Department'],
            ['name' => 'department_requests.create', 'display_name' => 'Buat Permintaan Departemen', 'description' => 'Dapat membuat permintaan departemen', 'module' => 'Department'],
            ['name' => 'department_requests.edit', 'display_name' => 'Edit Permintaan Departemen', 'description' => 'Dapat mengedit permintaan departemen', 'module' => 'Department'],
            ['name' => 'department_requests.delete', 'display_name' => 'Hapus Permintaan Departemen', 'description' => 'Dapat menghapus permintaan departemen', 'module' => 'Department'],
            ['name' => 'approve_department_requests', 'display_name' => 'Approve Permintaan Departemen', 'description' => 'Dapat menyetujui atau menolak permintaan departemen', 'module' => 'Department'],
            ['name' => 'fulfill_department_requests', 'display_name' => 'Fulfill Permintaan Departemen', 'description' => 'Dapat melengkapi/memenuhi permintaan departemen', 'module' => 'Department'],
            
            // Department Inventory Transfer Management
            ['name' => 'view_inventory_transfers', 'display_name' => 'Lihat Transfer Inventori', 'description' => 'Dapat melihat daftar transfer inventori antar departemen', 'module' => 'Inventory Transfer'],
            ['name' => 'create_inventory_transfers', 'display_name' => 'Buat Transfer Inventori', 'description' => 'Dapat membuat transfer inventori antar departemen', 'module' => 'Inventory Transfer'],
            ['name' => 'approve_inventory_transfers', 'display_name' => 'Approve Transfer Inventori', 'description' => 'Dapat menyetujui transfer inventori', 'module' => 'Inventory Transfer'],
            ['name' => 'execute_inventory_transfers', 'display_name' => 'Eksekusi Transfer Inventori', 'description' => 'Dapat mengeksekusi transfer inventori yang sudah disetujui', 'module' => 'Inventory Transfer'],
            ['name' => 'receive_inventory_transfers', 'display_name' => 'Terima Transfer Inventori', 'description' => 'Dapat mengkonfirmasi penerimaan barang transfer', 'module' => 'Inventory Transfer'],
            ['name' => 'cancel_inventory_transfers', 'display_name' => 'Batalkan Transfer Inventori', 'description' => 'Dapat membatalkan transfer inventori', 'module' => 'Inventory Transfer'],
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
            'akuntansi.laporan.view', 'akuntansi.laporan.export',
            'inventory.view',
            'inventory.item.view', 'inventory.item.create', 'inventory.item.edit', 'inventory.item.delete',
            'inventory.location.view', 'inventory.location.create', 'inventory.location.edit', 'inventory.location.delete',
            'inventory.movement.view', 'inventory.movement.create', 'inventory.movement.edit', 'inventory.movement.approve',
            'inventory.report.view', 'inventory.report.export',
            'department.view', 'department.create', 'department.edit', 'department.delete',
            'department_requests.view', 'department_requests.create', 'department_requests.edit', 'department_requests.delete',
            'approve_department_requests', 'fulfill_department_requests'
        ])->pluck('id');
        $managerRole->permissions()->sync($managerPermissions);

        // Assign permissions to User (very limited permissions)
        $userPermissions = Permission::whereIn('name', [
            'dashboard.view',
            'akuntansi.view',
            'akuntansi.buku-besar.view',
            'akuntansi.laporan.view',
            'inventory.view',
            'inventory.item.view',
            'inventory.location.view',
            'inventory.movement.view',
            'inventory.report.view',
            'department.view',
            'department_requests.view', 'department_requests.create', 'department_requests.edit'
        ])->pluck('id');
        $userRole->permissions()->sync($userPermissions);

        $this->command->info('Roles and permissions created successfully!');
    }
}
