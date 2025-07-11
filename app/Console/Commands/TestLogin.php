<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class TestLogin extends Command
{
    protected $signature = 'test:login {nip}';
    protected $description = 'Test login with NIP and check permissions';

    public function handle()
    {
        $nip = $this->argument('nip');
        
        $user = User::where('nip', $nip)->with(['role.permissions'])->first();
        
        if (!$user) {
            $this->error("User with NIP '{$nip}' not found.");
            return 1;
        }
        
        $this->info("Login test for user: {$user->name}");
        $this->info("NIP: {$user->nip}");
        $roleName = $user->role ? $user->role->display_name : 'No Role';
        $this->info("Role: {$roleName}");
        
        // Check password
        if (Hash::check('12345', $user->password)) {
            $this->info("✓ Password '12345' is correct");
        } else {
            $this->warn("✗ Password '12345' is incorrect");
        }
        
        // Check permissions for navigation
        $permissions = $user->getAllPermissions();
        $approvalPermissions = [
            'approval.cash-transactions.approve',
            'approval.journal-posting.approve',
            'approval.monthly-closing.approve'
        ];
        
        $hasAnyApproval = !empty(array_intersect($approvalPermissions, $permissions));
        
        $this->info("\nNavigation check:");
        if ($hasAnyApproval) {
            $this->info("✓ Approvals menu SHOULD be visible");
            $this->info("User has these approval permissions:");
            foreach ($approvalPermissions as $permission) {
                if (in_array($permission, $permissions)) {
                    $this->line("  ✓ {$permission}");
                }
            }
        } else {
            $this->warn("✗ Approvals menu will NOT be visible");
            $this->warn("User has no approval permissions");
        }
        
        $this->info("\nTo test in browser:");
        $this->info("1. Go to http://localhost:8000/login");
        $this->info("2. Login with NIP: {$user->nip}");
        $this->info("3. Password: 12345");
        $this->info("4. Check if Approvals menu appears in navigation");
        
        return 0;
    }
}
