<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;

class RoleNotificationSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Define default notification settings per role
        $roleSettings = [
            'Super Admin' => [
                'kas_post_to_jurnal' => true,
                'jurnal_created' => true,
                'closing_period' => true,
                'revision_approval' => true,
                'period_reminder' => true,
                'system' => true,
            ],
            'Admin' => [
                'kas_post_to_jurnal' => true,
                'jurnal_created' => true,
                'closing_period' => true,
                'revision_approval' => true,
                'period_reminder' => true,
                'system' => true,
            ],
            'Akuntan' => [
                'kas_post_to_jurnal' => true,
                'jurnal_created' => true,
                'closing_period' => true,
                'revision_approval' => false,
                'period_reminder' => true,
                'system' => false,
            ],
            'Supervisor' => [
                'kas_post_to_jurnal' => true,
                'jurnal_created' => true,
                'closing_period' => true,
                'revision_approval' => true,
                'period_reminder' => true,
                'system' => false,
            ],
            'Manager Keuangan' => [
                'kas_post_to_jurnal' => false,
                'jurnal_created' => false,
                'closing_period' => true,
                'revision_approval' => true,
                'period_reminder' => true,
                'system' => false,
            ],
            'Direktur' => [
                'kas_post_to_jurnal' => false,
                'jurnal_created' => false,
                'closing_period' => true,
                'revision_approval' => true,
                'period_reminder' => true,
                'system' => true,
            ],
            'Logistik' => [
                'kas_post_to_jurnal' => false,
                'jurnal_created' => false,
                'closing_period' => false,
                'revision_approval' => false,
                'period_reminder' => false,
                'system' => true,
            ],
            'Warehouse Staff' => [
                'kas_post_to_jurnal' => false,
                'jurnal_created' => false,
                'closing_period' => false,
                'revision_approval' => false,
                'period_reminder' => false,
                'system' => true,
            ],
            'Purchasing' => [
                'kas_post_to_jurnal' => false,
                'jurnal_created' => false,
                'closing_period' => false,
                'revision_approval' => false,
                'period_reminder' => false,
                'system' => true,
            ],
        ];

        // Update each role with notification settings
        foreach ($roleSettings as $roleName => $settings) {
            $role = Role::where('name', $roleName)->first();
            
            if ($role) {
                $role->update([
                    'notification_settings' => $settings
                ]);
                
                $this->command->info("✓ Updated notification settings for role: {$roleName}");
            } else {
                $this->command->warn("⚠ Role not found: {$roleName}");
            }
        }

        $this->command->info('Notification settings seeding completed!');
    }
}
