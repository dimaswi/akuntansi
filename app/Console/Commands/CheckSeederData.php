<?php

namespace App\Console\Commands;

use App\Models\Role;
use App\Models\Permission;
use App\Models\User;
use Illuminate\Console\Command;

class CheckSeederData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'check:seeder';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check seeded data in database';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('=== DATABASE SEEDING VERIFICATION ===');
        $this->line("Roles: " . Role::count());
        $this->line("Permissions: " . Permission::count());
        $this->line("Users: " . User::count());
        $this->newLine();

        $this->info('=== ROLES ===');
        Role::all()->each(function($role) {
            $this->line("- {$role->name} ({$role->display_name})");
        });
        $this->newLine();

        $this->info('=== USERS ===');
        User::with('role')->get()->each(function($user) {
            $roleName = $user->role->display_name ?? 'No Role';
            $this->line("- {$user->name} ({$user->nip}) - Role: {$roleName}");
        });
        $this->newLine();

        $this->info('=== PERMISSIONS SAMPLE ===');
        Permission::take(5)->get()->each(function($permission) {
            $this->line("- {$permission->name} ({$permission->display_name})");
        });
        $remaining = Permission::count() - 5;
        if ($remaining > 0) {
            $this->line("... and {$remaining} more permissions");
        }
    }
}
