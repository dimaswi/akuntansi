<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Role;
use Illuminate\Console\Command;

class TestUserNavigation extends Command
{
    protected $signature = 'test:user-navigation {email}';
    protected $description = 'Test navigation for a specific user';

    public function handle()
    {
        $email = $this->argument('email');
        
        $user = User::where('email', $email)->first();
        
        if (!$user) {
            $this->error("User with email '{$email}' not found.");
            return 1;
        }
        
        $this->info("Testing navigation for user: {$user->name} ({$user->email})");
        
        if ($user->role) {
            $this->info("Role: {$user->role->display_name}");
            
            $permissions = $user->role->permissions->pluck('name')->toArray();
            
            $approvalPermissions = array_filter($permissions, function($permission) {
                return strpos($permission, 'approval.') === 0;
            });
            
            $this->info("Approval permissions:");
            if (empty($approvalPermissions)) {
                $this->warn("- No approval permissions");
                $this->warn("- Approvals menu will NOT be visible");
            } else {
                foreach ($approvalPermissions as $permission) {
                    $this->line("- {$permission}");
                }
                $this->info("- Approvals menu WILL be visible");
            }
        } else {
            $this->warn("User has no role assigned.");
        }
        
        return 0;
    }
}
