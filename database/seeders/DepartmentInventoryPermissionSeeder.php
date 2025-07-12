<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission;
use App\Models\Role;

class DepartmentInventoryPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Department Inventory Permissions
        $permissions = [
            // Department Stock Management
            [
                'name' => 'department.stock.view',
                'display_name' => 'Lihat Stok Departemen',
                'description' => 'Dapat melihat stok barang di departemen sendiri'
            ],
            [
                'name' => 'department.stock.view.all',
                'display_name' => 'Lihat Semua Stok Departemen',
                'description' => 'Dapat melihat stok barang di semua departemen'
            ],
            [
                'name' => 'department.stock.create',
                'display_name' => 'Tambah Stok Departemen',
                'description' => 'Dapat menambah item ke stok departemen'
            ],
            [
                'name' => 'department.stock.edit',
                'display_name' => 'Edit Stok Departemen',
                'description' => 'Dapat mengubah data stok departemen'
            ],
            [
                'name' => 'department.stock.delete',
                'display_name' => 'Hapus Stok Departemen',
                'description' => 'Dapat menghapus item dari stok departemen'
            ],
            
            // Stock Opname
            [
                'name' => 'department.stock.opname',
                'display_name' => 'Stock Opname',
                'description' => 'Dapat melakukan stock opname di departemen'
            ],
            [
                'name' => 'department.stock.opname.all',
                'display_name' => 'Stock Opname Semua Departemen',
                'description' => 'Dapat melakukan stock opname di semua departemen'
            ],
            
            // Stock Movement
            [
                'name' => 'department.stock.movement.view',
                'display_name' => 'Lihat Pergerakan Stok',
                'description' => 'Dapat melihat history pergerakan stok departemen'
            ],
            [
                'name' => 'department.stock.movement.view.all',
                'display_name' => 'Lihat Semua Pergerakan Stok',
                'description' => 'Dapat melihat history pergerakan stok semua departemen'
            ],
            [
                'name' => 'department.stock.movement.create',
                'display_name' => 'Buat Pergerakan Stok',
                'description' => 'Dapat membuat pergerakan stok (adjustment, transfer, dll)'
            ],
            
            // Department Request Enhanced
            [
                'name' => 'department.request.view.all',
                'display_name' => 'Lihat Semua Request Departemen',
                'description' => 'Dapat melihat request dari semua departemen'
            ],
            [
                'name' => 'department.request.transfer.create',
                'display_name' => 'Buat Request Transfer',
                'description' => 'Dapat membuat permintaan transfer antar departemen'
            ],
            [
                'name' => 'department.request.transfer.approve',
                'display_name' => 'Approve Request Transfer',
                'description' => 'Dapat menyetujui permintaan transfer antar departemen'
            ],
            [
                'name' => 'department.request.procurement.create',
                'display_name' => 'Buat Request Procurement',
                'description' => 'Dapat membuat permintaan pengadaan barang baru'
            ],
            [
                'name' => 'department.request.procurement.approve',
                'display_name' => 'Approve Request Procurement',
                'description' => 'Dapat menyetujui permintaan pengadaan barang baru'
            ],
            
            // Inventory Item Department Filter
            [
                'name' => 'inventory.item.view.own.department',
                'display_name' => 'Lihat Item Departemen Sendiri',
                'description' => 'Dapat melihat item inventory yang ada di departemen sendiri'
            ],
            [
                'name' => 'inventory.item.view.all.departments',
                'display_name' => 'Lihat Item Semua Departemen',
                'description' => 'Dapat melihat item inventory dari semua departemen'
            ],
            
            // Reports
            [
                'name' => 'department.stock.report.view',
                'display_name' => 'Lihat Laporan Stok Departemen',
                'description' => 'Dapat melihat laporan stok departemen sendiri'
            ],
            [
                'name' => 'department.stock.report.view.all',
                'display_name' => 'Lihat Semua Laporan Stok',
                'description' => 'Dapat melihat laporan stok semua departemen'
            ],
            [
                'name' => 'department.stock.report.export',
                'display_name' => 'Export Laporan Stok',
                'description' => 'Dapat mengexport laporan stok departemen'
            ],
        ];

        // Create permissions
        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission['name']],
                [
                    'display_name' => $permission['display_name'],
                    'description' => $permission['description']
                ]
            );
        }

        // Assign permissions to roles
        $this->assignPermissionsToRoles();
    }

    private function assignPermissionsToRoles()
    {
        // Admin gets all permissions
        $adminRole = Role::where('name', 'admin')->first();
        if ($adminRole) {
            $allPermissions = Permission::whereIn('name', [
                'department.stock.view.all',
                'department.stock.create',
                'department.stock.edit',
                'department.stock.delete',
                'department.stock.opname.all',
                'department.stock.movement.view.all',
                'department.stock.movement.create',
                'department.request.view.all',
                'department.request.transfer.approve',
                'department.request.procurement.approve',
                'inventory.item.view.all.departments',
                'department.stock.report.view.all',
                'department.stock.report.export',
            ])->get();
            
            foreach ($allPermissions as $permission) {
                $adminRole->permissions()->syncWithoutDetaching($permission->id);
            }
        }

        // Manager Department gets department-specific permissions
        $managerRole = Role::where('name', 'manager')->first();
        if ($managerRole) {
            $managerPermissions = Permission::whereIn('name', [
                'department.stock.view',
                'department.stock.create',
                'department.stock.edit',
                'department.stock.opname',
                'department.stock.movement.view',
                'department.stock.movement.create',
                'department.request.view.all',
                'department.request.transfer.create',
                'department.request.transfer.approve',
                'department.request.procurement.create',
                'department.request.procurement.approve',
                'inventory.item.view.all.departments',
                'department.stock.report.view',
                'department.stock.report.export',
            ])->get();
            
            foreach ($managerPermissions as $permission) {
                $managerRole->permissions()->syncWithoutDetaching($permission->id);
            }
        }

        // Staff Department gets basic permissions
        $staffRole = Role::where('name', 'staff')->first();
        if ($staffRole) {
            $staffPermissions = Permission::whereIn('name', [
                'department.stock.view',
                'department.stock.movement.view',
                'department.request.transfer.create',
                'department.request.procurement.create',
                'inventory.item.view.own.department',
                'department.stock.report.view',
            ])->get();
            
            foreach ($staffPermissions as $permission) {
                $staffRole->permissions()->syncWithoutDetaching($permission->id);
            }
        }

        // User (basic) gets limited permissions
        $userRole = Role::where('name', 'user')->first();
        if ($userRole) {
            $userPermissions = Permission::whereIn('name', [
                'department.stock.view',
                'department.request.transfer.create',
                'department.request.procurement.create',
                'inventory.item.view.own.department',
            ])->get();
            
            foreach ($userPermissions as $permission) {
                $userRole->permissions()->syncWithoutDetaching($permission->id);
            }
        }
    }
}
