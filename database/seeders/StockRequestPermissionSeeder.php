<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Permission;
use App\Models\Role;

class StockRequestPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create Stock Request Permissions
        $permissions = [
            [
                'name' => 'inventory.stock-requests.view',
                'display_name' => 'View Permintaan Stok',
                'description' => 'Can view Permintaan Stok',
                'module' => 'Inventory - Stock Request',
            ],
            [
                'name' => 'inventory.stock-requests.create',
                'display_name' => 'Create Stock Request',
                'description' => 'Can create Permintaan Stok',
                'module' => 'Inventory - Stock Request',
            ],
            [
                'name' => 'inventory.stock-requests.edit',
                'display_name' => 'Edit Stock Request',
                'description' => 'Can edit draft Permintaan Stok',
                'module' => 'Inventory - Stock Request',
            ],
            [
                'name' => 'inventory.stock-requests.delete',
                'display_name' => 'Delete Stock Request',
                'description' => 'Can delete draft Permintaan Stok',
                'module' => 'Inventory - Stock Request',
            ],
            [
                'name' => 'inventory.stock-requests.submit',
                'display_name' => 'Submit Stock Request',
                'description' => 'Can submit Permintaan Stok for approval',
                'module' => 'Inventory - Stock Request',
            ],
            [
                'name' => 'inventory.stock-requests.approve',
                'display_name' => 'Approve Stock Request',
                'description' => 'Can approve or reject Permintaan Stok',
                'module' => 'Inventory - Stock Request',
            ],
            [
                'name' => 'inventory.stock-requests.complete',
                'display_name' => 'Complete Stock Request',
                'description' => 'Can complete Permintaan Stok (issue items)',
                'module' => 'Inventory - Stock Request',
            ],
            [
                'name' => 'inventory.stock-requests.cancel',
                'display_name' => 'Cancel Stock Request',
                'description' => 'Can cancel Permintaan Stok',
                'module' => 'Inventory - Stock Request',
            ],
        ];

        foreach ($permissions as $permissionData) {
            Permission::updateOrCreate(
                ['name' => $permissionData['name']],
                $permissionData
            );
        }

        $this->command->info('Stock Request permissions created successfully.');

        // Assign permissions to roles
        $this->assignPermissionsToRoles();
    }

    protected function assignPermissionsToRoles()
    {
        // Admin role - all permissions
        $adminRole = Role::where('name', 'admin')->first();
        if ($adminRole) {
            $allPermissions = Permission::where('name', 'like', 'inventory.stock-requests.%')->pluck('id');
            $adminRole->permissions()->syncWithoutDetaching($allPermissions);
            $this->command->info('Admin role: All stock request permissions assigned.');
        }

        // Logistics role - all permissions
        $logisticsRole = Role::where('name', 'logistics')->first();
        if ($logisticsRole) {
            $logisticsPermissions = Permission::where('name', 'like', 'inventory.stock-requests.%')->pluck('id');
            $logisticsRole->permissions()->syncWithoutDetaching($logisticsPermissions);
            $this->command->info('Logistics role: All stock request permissions assigned.');
        }

        // Department Users - view, create, edit, submit, cancel
        $userRole = Role::where('name', 'user')->first();
        if ($userRole) {
            $userPermissions = Permission::whereIn('name', [
                'inventory.stock-requests.view',
                'inventory.stock-requests.create',
                'inventory.stock-requests.edit',
                'inventory.stock-requests.delete',
                'inventory.stock-requests.submit',
                'inventory.stock-requests.cancel',
            ])->pluck('id');
            $userRole->permissions()->syncWithoutDetaching($userPermissions);
            $this->command->info('User role: Basic stock request permissions assigned.');
        }
    }
}

