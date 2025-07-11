<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class CheckUserPermissions extends Command
{
    protected $signature = 'check:user-permissions {email}';
    protected $description = 'Check permissions for a specific user';

    public function handle()
    {
        $email = $this->argument('email');
        
        $user = User::where('email', $email)->first();
        
        if (!$user) {
            $this->error("User with email '{$email}' not found.");
            return 1;
        }
        
        $this->info("User: {$user->name} ({$user->email})");
        
        if ($user->role) {
            $this->info("Role: {$user->role->name} ({$user->role->display_name})");
            
            $permissions = $user->role->permissions->pluck('name')->toArray();
            
            if (empty($permissions)) {
                $this->warn('No permissions assigned to user role.');
            } else {
                $this->info('Permissions:');
                foreach ($permissions as $permission) {
                    $this->line("- {$permission}");
                }
                
                // Check specific approval permissions
                $approvalPermissions = [
                    'approval.cash-transactions.approve',
                    'approval.journal-posting.approve', 
                    'approval.monthly-closing.approve'
                ];
                
                $hasApprovalPermissions = array_intersect($approvalPermissions, $permissions);
                
                if ($hasApprovalPermissions) {
                    $this->info("\nApproval permissions found:");
                    foreach ($hasApprovalPermissions as $perm) {
                        $this->line("✓ {$perm}");
                    }
                } else {
                    $this->warn("\nNo approval permissions found.");
                }
            }
        } else {
            $this->warn('No role assigned to this user.');
        }
        
        return 0;
    }
}
