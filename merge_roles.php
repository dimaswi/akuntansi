<?php

require 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== CHECKING ROLES ===\n";

// Check duplicate roles
$roles = DB::select("SELECT id, name FROM roles ORDER BY id");

echo "Current roles:\n";
foreach ($roles as $role) {
    echo "ID: {$role->id}, Name: {$role->name}\n";
}

// Check if admin and administrator both exist
$adminCount = DB::selectOne("SELECT COUNT(*) as count FROM roles WHERE name IN ('admin', 'administrator')")->count;
echo "\nAdmin/Administrator roles count: {$adminCount}\n";

if ($adminCount > 1) {
    echo "\nFound duplicate admin roles, will merge them...\n";
    
    $adminRole = DB::selectOne("SELECT id FROM roles WHERE name = 'admin'");
    $administratorRole = DB::selectOne("SELECT id FROM roles WHERE name = 'administrator'");
    
    if ($adminRole && $administratorRole) {
        echo "Admin role ID: {$adminRole->id}\n";
        echo "Administrator role ID: {$administratorRole->id}\n";
        
        // Update users from administrator to admin
        DB::update("UPDATE users SET role_id = ? WHERE role_id = ?", [$adminRole->id, $administratorRole->id]);
        
        // Copy permissions from administrator to admin (if any)
        $adminPermissions = DB::select("SELECT permission_id FROM role_permission WHERE role_id = ?", [$adminRole->id]);
        $administratorPermissions = DB::select("SELECT permission_id FROM role_permission WHERE role_id = ?", [$administratorRole->id]);
        
        $adminPermissionIds = array_column($adminPermissions, 'permission_id');
        
        foreach ($administratorPermissions as $perm) {
            if (!in_array($perm->permission_id, $adminPermissionIds)) {
                DB::insert("INSERT INTO role_permission (role_id, permission_id) VALUES (?, ?)", [$adminRole->id, $perm->permission_id]);
            }
        }
        
        // Delete administrator role
        DB::delete("DELETE FROM role_permission WHERE role_id = ?", [$administratorRole->id]);
        DB::delete("DELETE FROM roles WHERE id = ?", [$administratorRole->id]);
        
        echo "✅ Merged administrator role into admin role\n";
    }
}

echo "\n=== FINAL ROLES ===\n";
$finalRoles = DB::select("SELECT id, name FROM roles ORDER BY id");
foreach ($finalRoles as $role) {
    echo "ID: {$role->id}, Name: {$role->name}\n";
}
