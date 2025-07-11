<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class NavigationTest extends Command
{
    protected $signature = 'test:navigation';
    protected $description = 'Verify navigation configuration';

    public function handle()
    {
        $this->info('Navigation Configuration Test');
        $this->info('================================');
        
        // Check if navigation item is configured correctly
        $navigationFile = resource_path('js/components/app-header.tsx');
        
        if (!file_exists($navigationFile)) {
            $this->error('Navigation file not found!');
            return 1;
        }
        
        $content = file_get_contents($navigationFile);
        
        // Check for Approvals menu item
        if (strpos($content, "title: 'Approvals'") !== false) {
            $this->info('✓ Approvals menu item found in navigation');
        } else {
            $this->error('✗ Approvals menu item NOT found in navigation');
        }
        
        // Check for permissions array
        if (strpos($content, 'permissions: [') !== false) {
            $this->info('✓ Permissions array configuration found');
        } else {
            $this->error('✗ Permissions array configuration NOT found');
        }
        
        // Check for specific approval permissions
        $requiredPermissions = [
            'approval.cash-transactions.approve',
            'approval.journal-posting.approve',
            'approval.monthly-closing.approve'
        ];
        
        foreach ($requiredPermissions as $permission) {
            if (strpos($content, $permission) !== false) {
                $this->info("✓ Permission '{$permission}' found");
            } else {
                $this->warn("✗ Permission '{$permission}' NOT found");
            }
        }
        
        // Check for hasAnyPermission logic
        if (strpos($content, 'hasAnyPermission') !== false) {
            $this->info('✓ hasAnyPermission logic found');
        } else {
            $this->error('✗ hasAnyPermission logic NOT found');
        }
        
        $this->info("\nTesting Instructions:");
        $this->info("1. Make sure servers are running:");
        $this->info("   - Laravel: php artisan serve");
        $this->info("   - Vite: npm run dev");
        $this->info("2. Open browser: http://localhost:8000");
        $this->info("3. Login with NIP: 2023.01.02.04, Password: 12345");
        $this->info("4. Check if 'Approvals' appears in main navigation");
        
        return 0;
    }
}
