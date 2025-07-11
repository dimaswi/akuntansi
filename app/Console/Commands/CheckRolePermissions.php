<?php

namespace App\Console\Commands;

use App\Models\Role;
use Illuminate\Console\Command;

class CheckRolePermissions extends Command
{
    protected $signature = 'check:role-permissions {role}';
    protected $description = 'Check permissions for a specific role';

    public function handle()
    {
        $roleName = $this->argument('role');
        
        $role = Role::where('name', $roleName)->first();
        
        if (!$role) {
            $this->error("Role '{$roleName}' not found.");
            return 1;
        }
        
        $this->info("Permissions for role '{$role->name}' ({$role->display_name}):");
        
        $permissions = $role->permissions->pluck('name')->toArray();
        
        if (empty($permissions)) {
            $this->warn('No permissions assigned to this role.');
        } else {
            foreach ($permissions as $permission) {
                $this->line("- {$permission}");
            }
        }
        
        return 0;
    }
}
