<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class ShowUsers extends Command
{
    protected $signature = 'show:users';
    protected $description = 'Show all users with details';

    public function handle()
    {
        $users = User::with('role')->get();
        
        $this->info('Users in database:');
        
        foreach ($users as $user) {
            $this->line("ID: {$user->id}");
            $this->line("Name: {$user->name}");
            $this->line("Email: " . ($user->email ?: 'No email'));
            $this->line("Role: " . ($user->role ? $user->role->display_name : 'No Role'));
            $this->line("Role ID: " . ($user->role_id ?: 'NULL'));
            $this->line("---");
        }
        
        return 0;
    }
}
