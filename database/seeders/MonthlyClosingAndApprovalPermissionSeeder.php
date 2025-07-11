<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MonthlyClosingAndApprovalPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get roles
        $adminRole = Role::where('name', 'admin')->first();
        $akuntansiRole = Role::where('name', 'akuntansi')->first();
        $supervisorRole = Role::where('name', 'supervisor')->first();
        $managerRole = Role::where('name', 'manager')->first();

        // Create additional roles if they don't exist
        if (!$supervisorRole) {
            $supervisorRole = Role::create([
                'name' => 'supervisor',
                'display_name' => 'Supervisor',
                'description' => 'Supervisor with approval authority'
            ]);
        }

        if (!$managerRole) {
            $managerRole = Role::create([
                'name' => 'manager',
                'display_name' => 'Manager',
                'description' => 'Manager with high-level approval authority'
            ]);
        }

        // Get monthly closing permissions
        $monthlyClosingPermissions = Permission::whereIn('name', [
            'monthly-closing.view',
            'monthly-closing.create',
            'monthly-closing.approve',
            'monthly-closing.close',
            'monthly-closing.reopen',
            'monthly-closing.manage',
            'cut-off.bypass',
            'cut-off.manage',
        ])->get();

        // Get approval permissions
        $approvalPermissions = Permission::whereIn('name', [
            'approval.cash-transactions.approve',
            'approval.journal-posting.approve',
            'approval.monthly-closing.approve',
            'approvals.view',
            'approvals.delegate',
            'approvals.bulk-approve',
            'approvals.override',
        ])->get();

        // Assign permissions to roles
        if ($adminRole) {
            $this->assignPermissionsToRole($adminRole, array_merge(
                $monthlyClosingPermissions->toArray(),
                $approvalPermissions->toArray()
            ));
        }

        if ($akuntansiRole) {
            // Akuntansi can view and create monthly closing, view approvals
            $akuntansiPermissionNames = [
                'monthly-closing.view',
                'monthly-closing.create',
                'approvals.view',
            ];
            $akuntansiPermissions = Permission::whereIn('name', $akuntansiPermissionNames)->get();
            $this->assignPermissionsToRole($akuntansiRole, $akuntansiPermissions->toArray());
        }

        if ($supervisorRole) {
            // Supervisor can approve, delegate, and close monthly closing
            $supervisorPermissionNames = [
                'monthly-closing.view',
                'monthly-closing.create',
                'monthly-closing.approve',
                'monthly-closing.close',
                'approval.cash-transactions.approve',
                'approval.journal-posting.approve',
                'approvals.view',
                'approvals.delegate',
            ];
            $supervisorPermissions = Permission::whereIn('name', $supervisorPermissionNames)->get();
            $this->assignPermissionsToRole($supervisorRole, $supervisorPermissions->toArray());
        }

        if ($managerRole) {
            // Manager has all permissions including reopen and override
            $managerPermissionNames = [
                'monthly-closing.view',
                'monthly-closing.create',
                'monthly-closing.approve',
                'monthly-closing.close',
                'monthly-closing.reopen',
                'monthly-closing.manage',
                'approval.cash-transactions.approve',
                'approval.journal-posting.approve',
                'approval.monthly-closing.approve',
                'approvals.view',
                'approvals.delegate',
                'approvals.bulk-approve',
                'approvals.override',
                'cut-off.bypass',
                'cut-off.manage',
            ];
            $managerPermissions = Permission::whereIn('name', $managerPermissionNames)->get();
            $this->assignPermissionsToRole($managerRole, $managerPermissions->toArray());
        }

        $this->command->info('Monthly closing and approval permissions have been assigned to roles successfully.');
    }

    /**
     * Assign permissions to role
     */
    private function assignPermissionsToRole(Role $role, array $permissions): void
    {
        foreach ($permissions as $permission) {
            // Check if permission is already assigned
            $exists = DB::table('role_permission')
                ->where('role_id', $role->id)
                ->where('permission_id', $permission['id'])
                ->exists();

            if (!$exists) {
                DB::table('role_permission')->insert([
                    'role_id' => $role->id,
                    'permission_id' => $permission['id'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        $this->command->info("Assigned permissions to role: {$role->name}");
    }
}
