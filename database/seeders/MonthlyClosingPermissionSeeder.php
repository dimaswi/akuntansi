<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class MonthlyClosingPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions = [
            // Monthly Closing permissions
            [
                'name' => 'monthly-closing.view',
                'display_name' => 'Lihat Monthly Closing',
                'description' => 'View monthly closing list and details',
                'module' => 'monthly-closing'
            ],
            [
                'name' => 'monthly-closing.create',
                'display_name' => 'Buat Monthly Closing',
                'description' => 'Initiate monthly closing process',
                'module' => 'monthly-closing'
            ],
            [
                'name' => 'monthly-closing.approve',
                'display_name' => 'Approve Monthly Closing',
                'description' => 'Approve monthly closing requests',
                'module' => 'monthly-closing'
            ],
            [
                'name' => 'monthly-closing.close',
                'display_name' => 'Tutup Monthly Closing',
                'description' => 'Execute final monthly closing',
                'module' => 'monthly-closing'
            ],
            [
                'name' => 'monthly-closing.reopen',
                'display_name' => 'Buka Kembali Monthly Closing',
                'description' => 'Reopen closed monthly periods',
                'module' => 'monthly-closing'
            ],
            [
                'name' => 'monthly-closing.manage',
                'display_name' => 'Kelola Monthly Closing',
                'description' => 'Full monthly closing management access',
                'module' => 'monthly-closing'
            ],
            
            // Cut-off related permissions
            [
                'name' => 'cut-off.bypass',
                'display_name' => 'Bypass Cut-off',
                'description' => 'Bypass cut-off restrictions for urgent transactions',
                'module' => 'monthly-closing'
            ],
            [
                'name' => 'cut-off.manage',
                'display_name' => 'Kelola Cut-off',
                'description' => 'Manage cut-off dates and restrictions',
                'module' => 'monthly-closing'
            ]
        ];

        foreach ($permissions as $permission) {
            \App\Models\Permission::firstOrCreate(
                ['name' => $permission['name']],
                $permission
            );
        }

        // Assign permissions to roles
        $adminRole = \App\Models\Role::where('name', 'administrator')->first();
        $managerRole = \App\Models\Role::where('name', 'Manager')->first();
        $supervisorRole = \App\Models\Role::where('name', 'Supervisor')->first();
        $staffRole = \App\Models\Role::where('name', 'Staff')->first();

        if ($adminRole) {
            $adminPermissions = [
                'monthly-closing.view',
                'monthly-closing.create', 
                'monthly-closing.approve',
                'monthly-closing.close',
                'monthly-closing.reopen',
                'monthly-closing.manage',
                'cut-off.bypass',
                'cut-off.manage'
            ];

            foreach ($adminPermissions as $permissionName) {
                $permission = \App\Models\Permission::where('name', $permissionName)->first();
                if ($permission && !$adminRole->permissions->contains($permission->id)) {
                    $adminRole->permissions()->attach($permission->id);
                }
            }
        }

        if ($managerRole) {
            $managerPermissions = [
                'monthly-closing.view',
                'monthly-closing.create', 
                'monthly-closing.approve',
                'monthly-closing.close',
                'monthly-closing.reopen',
                'monthly-closing.manage',
                'cut-off.bypass',
                'cut-off.manage'
            ];

            foreach ($managerPermissions as $permissionName) {
                $permission = \App\Models\Permission::where('name', $permissionName)->first();
                if ($permission && !$managerRole->permissions->contains($permission->id)) {
                    $managerRole->permissions()->attach($permission->id);
                }
            }
        }

        if ($supervisorRole) {
            $supervisorPermissions = [
                'monthly-closing.view',
                'monthly-closing.create',
                'cut-off.bypass'
            ];

            foreach ($supervisorPermissions as $permissionName) {
                $permission = \App\Models\Permission::where('name', $permissionName)->first();
                if ($permission && !$supervisorRole->permissions->contains($permission->id)) {
                    $supervisorRole->permissions()->attach($permission->id);
                }
            }
        }

        if ($staffRole) {
            $staffPermissions = [
                'monthly-closing.view'
            ];

            foreach ($staffPermissions as $permissionName) {
                $permission = \App\Models\Permission::where('name', $permissionName)->first();
                if ($permission && !$staffRole->permissions->contains($permission->id)) {
                    $staffRole->permissions()->attach($permission->id);
                }
            }
        }

        echo "Monthly Closing permissions created and assigned successfully!\n";
    }
}
