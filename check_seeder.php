<?php

use App\Models\Role;
use App\Models\Permission;
use App\Models\User;

// Check seeded data
echo "=== DATABASE SEEDING VERIFICATION ===" . PHP_EOL;
echo "Roles: " . Role::count() . PHP_EOL;
echo "Permissions: " . Permission::count() . PHP_EOL;
echo "Users: " . User::count() . PHP_EOL;
echo PHP_EOL;

echo "=== ROLES ===" . PHP_EOL;
Role::all()->each(function($role) {
    echo "- {$role->name} ({$role->display_name})" . PHP_EOL;
});
echo PHP_EOL;

echo "=== USERS ===" . PHP_EOL;
User::with('role')->get()->each(function($user) {
    echo "- {$user->name} ({$user->nip}) - Role: " . ($user->role->display_name ?? 'No Role') . PHP_EOL;
});
echo PHP_EOL;

echo "=== PERMISSIONS SAMPLE ===" . PHP_EOL;
Permission::take(5)->get()->each(function($permission) {
    echo "- {$permission->name} ({$permission->display_name})" . PHP_EOL;
});
echo "... and " . (Permission::count() - 5) . " more permissions" . PHP_EOL;
