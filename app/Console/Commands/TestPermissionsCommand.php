<?php

namespace App\Console\Commands;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Console\Command;

class TestPermissionsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:permissions';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test permissions for cash flow reports and kas module';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('=== TESTING PERMISSIONS ===');
        $this->newLine();

        // Test permissions existence
        $this->testPermissionsExistence();
        $this->newLine();

        // Test role permissions
        $this->testRolePermissions();
        $this->newLine();

        // Test sample user
        $this->testSampleUser();
        
        $this->info('=== TEST COMPLETED ===');
    }

    private function testPermissionsExistence()
    {
        $this->info('Checking permissions existence:');
        
        $permissions = [
            'kas.view',
            'kas.cash-transaction.view',
            'kas.bank-transaction.view',
            'kas.giro-transaction.view',
            'kas.cash-management.view',
            'laporan.cash-flow.view'
        ];

        foreach ($permissions as $permName) {
            $perm = Permission::where('name', $permName)->first();
            $status = $perm ? '✅' : '❌';
            $this->line("  {$status} {$permName}");
        }
    }

    private function testRolePermissions()
    {
        $this->info('Checking role permissions:');
        
        $roles = ['kasir', 'bendahara', 'supervisor_keuangan', 'manager_keuangan'];

        foreach ($roles as $roleName) {
            $this->info("--- {$roleName} ---");
            $role = Role::where('name', $roleName)->first();
            
            if ($role) {
                $hasKasView = $role->permissions()->where('name', 'kas.view')->exists();
                $hasReportView = $role->permissions()->where('name', 'laporan.cash-flow.view')->exists();
                
                $this->line("  kas.view: " . ($hasKasView ? '✅' : '❌'));
                $this->line("  laporan.cash-flow.view: " . ($hasReportView ? '✅' : '❌'));
                
                // Show all permissions for this role
                $permCount = $role->permissions()->count();
                $this->line("  Total permissions: {$permCount}");
            } else {
                $this->error("  Role not found ❌");
            }
        }
    }

    private function testSampleUser()
    {
        $this->info('Testing sample user:');
        
        $user = User::first();
        if ($user && $user->role) {
            $this->line("User: {$user->name}");
            $this->line("Role: {$user->role->name}");
            
            $canKasView = $user->hasPermission('kas.view');
            $canReportView = $user->hasPermission('laporan.cash-flow.view');
            
            $this->line("Can access kas.view: " . ($canKasView ? '✅' : '❌'));
            $this->line("Can access laporan.cash-flow.view: " . ($canReportView ? '✅' : '❌'));
            
            // Test with Laravel's can method too
            $canKasViewLaravel = $user->can('kas.view');
            $canReportViewLaravel = $user->can('laporan.cash-flow.view');
            
            $this->line("Laravel can() kas.view: " . ($canKasViewLaravel ? '✅' : '❌'));
            $this->line("Laravel can() laporan.cash-flow.view: " . ($canReportViewLaravel ? '✅' : '❌'));
        } else {
            $this->error("No user found or user has no role");
        }
    }
}
