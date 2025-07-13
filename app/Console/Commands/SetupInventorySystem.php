<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;

class SetupInventorySystem extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'inventory:setup {--force : Force run without confirmation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Setup complete inventory system with permissions and roles';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🏥 INVENTORY SYSTEM SETUP');
        $this->info('============================');
        $this->newLine();

        if (!$this->option('force')) {
            if (!$this->confirm('This will create inventory permissions and roles. Continue?')) {
                $this->info('Setup cancelled.');
                return 0;
            }
        }

        $this->info('🚀 Starting inventory system setup...');
        $this->newLine();

        // Run inventory seeder
        $this->info('📋 Setting up permissions and roles...');
        try {
            Artisan::call('db:seed', [
                '--class' => 'Database\\Seeders\\InventorySeeder',
                '--force' => true
            ]);
            $this->info('✅ Permissions and roles created successfully!');
        } catch (\Exception $e) {
            $this->error('❌ Failed to create permissions and roles: ' . $e->getMessage());
            return 1;
        }

        $this->newLine();
        $this->info('🎯 INVENTORY SYSTEM READY!');
        $this->info('============================');
        $this->newLine();

        // Display available roles
        $this->info('📋 Available Inventory Roles:');
        $this->table(
            ['Role', 'Display Name', 'Description'],
            [
                ['inventory_manager', 'Inventory Manager', 'Full inventory management access'],
                ['pharmacy_manager', 'Pharmacy Manager', 'Pharmacy inventory with controlled substances'],
                ['inventory_staff', 'Inventory Staff', 'Basic inventory operations'],
                ['inventory_viewer', 'Inventory Viewer', 'View-only access'],
                ['department_head', 'Department Head', 'Department-specific inventory access'],
            ]
        );

        $this->newLine();
        $this->info('📝 Next Steps:');
        $this->info('1. Assign roles to users:');
        $this->info('   php artisan tinker');
        $this->info('   User::find(1)->assignRole(\'inventory_manager\')');
        $this->newLine();
        $this->info('2. Access inventory features:');
        $this->info('   • Items: /items');
        $this->info('   • Departments: /departments');
        $this->info('   • Categories: /item-categories');
        $this->newLine();
        $this->info('3. Test permissions in your application');

        return 0;
    }
}
