<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Role;
use Illuminate\Console\Command;

class SetupTestUser extends Command
{
    protected $signature = 'setup:test-user';
    protected $description = 'Setup test user for approval testing';

    public function handle()
    {
        // Find supervisor role
        $supervisorRole = Role::where('name', 'supervisor_keuangan')->first();
        
        if (!$supervisorRole) {
            $this->error('Supervisor Keuangan role not found.');
            return 1;
        }
        
        // Update user 2 (Manager User) with NIP and supervisor role
        $user = User::find(2);
        if ($user) {
            if (!$user->nip) {
                $user->nip = 'SUP001';
            }
            $user->role_id = $supervisorRole->id;
            $user->save();
            
            $this->info("Updated user: {$user->name}");
            $this->info("NIP: {$user->nip}");
            $this->info("Role: {$supervisorRole->display_name}");
            
            // Show permissions
            $permissions = $supervisorRole->permissions->pluck('name')->toArray();
            $approvalPermissions = array_filter($permissions, function($perm) {
                return str_contains($perm, 'approval.');
            });
            
            if ($approvalPermissions) {
                $this->info("Approval permissions:");
                foreach ($approvalPermissions as $perm) {
                    $this->line("✓ {$perm}");
                }
            }
        }
        
        return 0;
    }
}
