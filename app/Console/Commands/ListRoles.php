<?php

namespace App\Console\Commands;

use App\Models\Role;
use App\Models\User;
use Illuminate\Console\Command;

class ListRoles extends Command
{
    protected $signature = 'list:roles {--users : Also list users}';
    protected $description = 'List all available roles';

    public function handle()
    {
        $roles = Role::all();
        
        $this->info('Available roles:');
        
        foreach ($roles as $role) {
            $this->line("- {$role->name} ({$role->display_name})");
        }
        
        if ($this->option('users')) {
            $this->info("\nUsers:");
            $users = User::with('role')->get();
            foreach ($users as $user) {
                $roleName = $user->role ? $user->role->display_name : 'No Role';
                $this->line("- {$user->name} ({$user->email}) - {$roleName}");
            }
        }
        
        return 0;
    }
}
