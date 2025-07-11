<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Role;
use Illuminate\Console\Command;

class AssignRoleToUser extends Command
{
    protected $signature = 'assign:role {email} {role}';
    protected $description = 'Assign a role to a user';

    public function handle()
    {
        $email = $this->argument('email');
        $roleName = $this->argument('role');
        
        $user = User::where('email', $email)->first();
        $role = Role::where('name', $roleName)->first();
        
        if (!$user) {
            $this->error("User with email '{$email}' not found.");
            return 1;
        }
        
        if (!$role) {
            $this->error("Role '{$roleName}' not found.");
            return 1;
        }
        
        $user->role_id = $role->id;
        $user->save();
        
        $this->info("Successfully assigned role '{$role->display_name}' to user '{$user->name}'");
        
        return 0;
    }
}
