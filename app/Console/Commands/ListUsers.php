<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class ListUsers extends Command
{
    protected $signature = 'list:users';
    protected $description = 'List all users with their roles';

    public function handle()
    {
        $users = User::with('role')->get();
        
        $this->info('Available users:');
        
        foreach ($users as $user) {
            $roleName = $user->role ? $user->role->display_name : 'No role';
            $this->line("- {$user->name} ({$user->email}) - {$roleName}");
        }
        
        return 0;
    }
}
