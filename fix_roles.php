<?php

require 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Role;
use App\Models\User;

echo "=== FIXING ROLE ISSUES ===\n";

// Check which users use 'administrator' role
$adminRole = Role::where('name', 'administrator')->first();
$admin2Role = Role::where('name', 'admin')->first();

if ($adminRole && $admin2Role) {
    echo "Found both 'administrator' (ID: {$adminRole->id}) and 'admin' (ID: {$admin2Role->id}) roles\n";
    
    $adminUsers = User::where('role_id', $adminRole->id)->count();
    $admin2Users = User::where('role_id', $admin2Role->id)->count();
    
    echo "Users with 'administrator' role: {$adminUsers}\n";
    echo "Users with 'admin' role: {$admin2Users}\n";
    
    if ($admin2Users == 0) {
        echo "Deleting unused 'admin' role...\n";
        $admin2Role->delete();
        echo "Deleted successfully!\n";
    } elseif ($adminUsers == 0) {
        echo "Deleting unused 'administrator' role...\n";
        $adminRole->delete();
        echo "Deleted successfully!\n";
    } else {
        echo "Both roles have users. Need manual intervention.\n";
    }
} else {
    echo "No duplicate admin roles found.\n";
}

echo "\n=== FINAL ROLE CHECK ===\n";
$roles = Role::all(['id', 'name']);
foreach ($roles as $role) {
    $userCount = User::where('role_id', $role->id)->count();
    echo "ID: {$role->id} - Name: {$role->name} - Users: {$userCount}\n";
}
