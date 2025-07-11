<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class DebugUserPermissions extends Command
{
    protected $signature = 'debug:user-permissions {userId}';
    protected $description = 'Debug user permissions for navigation';

    public function handle()
    {
        $userId = $this->argument('userId');
        
        $user = User::with(['role.permissions'])->find($userId);
        
        if (!$user) {
            $this->error("User with ID '{$userId}' not found.");
            return 1;
        }
        
        $this->info("User: {$user->name}");
        $this->info("NIP: {$user->nip}");
        
        if ($user->role) {
            $this->info("Role: {$user->role->name} ({$user->role->display_name})");
            
            $permissions = $user->getAllPermissions();
            
            $this->info("All permissions (" . count($permissions) . "):");
            foreach ($permissions as $permission) {
                $this->line("- {$permission}");
            }
            
            // Check specific approval permissions
            $approvalPermissions = [
                'approval.cash-transactions.approve',
                'approval.journal-posting.approve',
                'approval.monthly-closing.approve'
            ];
            
            $this->info("\nApproval permission check:");
            foreach ($approvalPermissions as $permission) {
                $hasPermission = in_array($permission, $permissions);
                $status = $hasPermission ? '✓' : '✗';
                $this->line("{$status} {$permission}");
            }
            
            // Test hasAnyPermission logic
            $hasAnyApproval = !empty(array_intersect($approvalPermissions, $permissions));
            $this->info("\nhas ANY approval permission: " . ($hasAnyApproval ? 'YES' : 'NO'));
            
        } else {
            $this->warn('No role assigned to this user.');
        }
        
        return 0;
    }
}
