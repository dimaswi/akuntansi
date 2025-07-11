<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class DebugNavigation extends Command
{
    protected $signature = 'debug:navigation';
    protected $description = 'Debug navigation permissions and sharing';

    public function handle()
    {
        $this->info('Navigation Debug Check');
        $this->info('======================');
        
        // 1. Check middleware sharing
        $this->info('1. Checking HandleInertiaRequests middleware...');
        $middlewareFile = app_path('Http/Middleware/HandleInertiaRequests.php');
        
        if (file_exists($middlewareFile)) {
            $content = file_get_contents($middlewareFile);
            
            if (strpos($content, 'getAllPermissions') !== false) {
                $this->info('   ✓ getAllPermissions() method found in middleware');
            } else {
                $this->error('   ✗ getAllPermissions() method NOT found in middleware');
            }
            
            if (strpos($content, "'permissions' => \$user ? \$user->getAllPermissions() : []") !== false) {
                $this->info('   ✓ Permissions sharing configuration found');
            } else {
                $this->warn('   ⚠ Permissions sharing configuration may be incorrect');
            }
        }
        
        // 2. Check navigation configuration
        $this->info('\n2. Checking navigation configuration...');
        $navigationFile = resource_path('js/components/app-header.tsx');
        
        if (file_exists($navigationFile)) {
            $content = file_get_contents($navigationFile);
            
            if (strpos($content, 'Approvals') !== false) {
                $this->info('   ✓ Approvals menu item found');
            } else {
                $this->error('   ✗ Approvals menu item NOT found');
            }
            
            if (strpos($content, 'hasAnyPermission') !== false) {
                $this->info('   ✓ hasAnyPermission logic found');
            } else {
                $this->error('   ✗ hasAnyPermission logic NOT found');
            }
        }
        
        // 3. Check permission hook
        $this->info('\n3. Checking permission hook...');
        $hookFile = resource_path('js/hooks/use-permission.ts');
        
        if (file_exists($hookFile)) {
            $content = file_get_contents($hookFile);
            
            if (strpos($content, 'hasAnyPermission') !== false) {
                $this->info('   ✓ hasAnyPermission function found in hook');
            } else {
                $this->error('   ✗ hasAnyPermission function NOT found in hook');
            }
        }
        
        // 4. Check user setup
        $this->info('\n4. Checking test user setup...');
        $user = \App\Models\User::where('nip', '2023.01.02.04')->with(['role.permissions'])->first();
        
        if ($user) {
            $this->info("   ✓ Test user found: {$user->name}");
            $this->info("   ✓ Role: {$user->role->display_name}");
            
            $permissions = $user->getAllPermissions();
            $approvalPerms = array_filter($permissions, fn($p) => str_contains($p, 'approval.'));
            
            if (!empty($approvalPerms)) {
                $this->info('   ✓ User has approval permissions:');
                foreach ($approvalPerms as $perm) {
                    $this->info("     - {$perm}");
                }
            } else {
                $this->error('   ✗ User has NO approval permissions');
            }
        } else {
            $this->error('   ✗ Test user NOT found');
        }
        
        $this->info('\n5. Manual Test Instructions:');
        $this->info('   1. Open browser: http://localhost:8000');
        $this->info('   2. Login with NIP: 2023.01.02.04, Password: 12345');
        $this->info('   3. Open browser DevTools (F12)');
        $this->info('   4. Check Console tab for debug messages');
        $this->info('   5. Look for: "Debug - Has any approval permission: true"');
        $this->info('   6. If true but menu not visible, check browser console for errors');
        
        return 0;
    }
}
