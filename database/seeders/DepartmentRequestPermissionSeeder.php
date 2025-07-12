<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission;
use App\Models\Role;

class DepartmentRequestPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Department Request permissions
        $permissions = [
            // Basic CRUD permissions
            [
                'name' => 'department-requests.index',
                'display_name' => 'View Department Requests',
                'description' => 'Can view list of department requests',
                'module' => 'department-requests',
            ],
            [
                'name' => 'department-requests.show',
                'display_name' => 'View Department Request Details',
                'description' => 'Can view detailed information of a department request',
                'module' => 'department-requests',
            ],
            [
                'name' => 'department-requests.create',
                'display_name' => 'Create Department Requests',
                'description' => 'Can create new department requests',
                'module' => 'department-requests',
            ],
            [
                'name' => 'department-requests.edit',
                'display_name' => 'Edit Department Requests',
                'description' => 'Can edit department requests',
                'module' => 'department-requests',
            ],
            [
                'name' => 'department-requests.delete',
                'display_name' => 'Delete Department Requests',
                'description' => 'Can delete department requests',
                'module' => 'department-requests',
            ],
            
            // Workflow permissions
            [
                'name' => 'department-requests.submit',
                'display_name' => 'Submit Department Requests',
                'description' => 'Can submit department requests for approval',
                'module' => 'department-requests',
            ],
            [
                'name' => 'department-requests.approve',
                'display_name' => 'Approve Department Requests',
                'description' => 'Can approve department requests',
                'module' => 'department-requests',
            ],
            [
                'name' => 'department-requests.reject',
                'display_name' => 'Reject Department Requests',
                'description' => 'Can reject department requests',
                'module' => 'department-requests',
            ],
            [
                'name' => 'department-requests.fulfill',
                'display_name' => 'Fulfill Department Requests',
                'description' => 'Can mark department requests as fulfilled',
                'module' => 'department-requests',
            ],
            
            // Reports permissions
            [
                'name' => 'department-requests.reports',
                'display_name' => 'View Department Request Reports',
                'description' => 'Can view department request reports and analytics',
                'module' => 'department-requests',
            ],
            [
                'name' => 'department-requests.export',
                'display_name' => 'Export Department Request Reports',
                'description' => 'Can export department request reports to Excel/PDF',
                'module' => 'department-requests',
            ],
            
            // Advanced permissions
            [
                'name' => 'department-requests.manage-all',
                'display_name' => 'Manage All Department Requests',
                'description' => 'Can manage department requests from all departments',
                'module' => 'department-requests',
            ],
            [
                'name' => 'department-requests.view-costs',
                'display_name' => 'View Request Costs',
                'description' => 'Can view cost information in department requests',
                'module' => 'department-requests',
            ],
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission['name']],
                $permission
            );
        }

        // Assign permissions to roles
        $this->assignPermissionsToRoles();
    }

    private function assignPermissionsToRoles(): void
    {
        // Super Admin - all permissions
        $superAdminRole = Role::where('name', 'Super Admin')->first();
        if ($superAdminRole) {
            $allPermissions = Permission::where('module', 'department-requests')->pluck('id');
            $superAdminRole->permissions()->syncWithoutDetaching($allPermissions);
        }

        // Admin - most permissions except some advanced ones
        $adminRole = Role::where('name', 'Admin')->first();
        if ($adminRole) {
            $adminPermissions = Permission::where('module', 'department-requests')
                ->whereNotIn('name', ['department-requests.delete'])
                ->pluck('id');
            $adminRole->permissions()->syncWithoutDetaching($adminPermissions);
        }

        // Manager - approval and reporting permissions
        $managerRole = Role::where('name', 'Manager')->first();
        if ($managerRole) {
            $managerPermissions = Permission::where('module', 'department-requests')
                ->whereIn('name', [
                    'department-requests.index',
                    'department-requests.show',
                    'department-requests.create',
                    'department-requests.edit',
                    'department-requests.submit',
                    'department-requests.approve',
                    'department-requests.reject',
                    'department-requests.reports',
                    'department-requests.export',
                    'department-requests.view-costs',
                ])
                ->pluck('id');
            $managerRole->permissions()->syncWithoutDetaching($managerPermissions);
        }

        // Staff - basic permissions
        $staffRole = Role::where('name', 'Staff')->first();
        if ($staffRole) {
            $staffPermissions = Permission::where('module', 'department-requests')
                ->whereIn('name', [
                    'department-requests.index',
                    'department-requests.show',
                    'department-requests.create',
                    'department-requests.edit',
                    'department-requests.submit',
                ])
                ->pluck('id');
            $staffRole->permissions()->syncWithoutDetaching($staffPermissions);
        }

        // Warehouse - fulfillment permissions
        $warehouseRole = Role::where('name', 'Warehouse')->first();
        if ($warehouseRole) {
            $warehousePermissions = Permission::where('module', 'department-requests')
                ->whereIn('name', [
                    'department-requests.index',
                    'department-requests.show',
                    'department-requests.fulfill',
                    'department-requests.reports',
                ])
                ->pluck('id');
            $warehouseRole->permissions()->syncWithoutDetaching($warehousePermissions);
        }
    }
}
