<?php

require 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== FIXING ROLES AND PERMISSIONS ===\n";

try {
    DB::beginTransaction();
    
    // 1. Fix duplicate roles
    echo "1. Checking duplicate roles...\n";
    $roles = DB::select("SELECT name, COUNT(*) as count FROM roles GROUP BY name HAVING count > 1");
    
    foreach ($roles as $role) {
        echo "Found duplicate role: {$role->name} ({$role->count} times)\n";
        
        // Keep the first one, delete the rest
        $duplicateRoles = DB::select("SELECT id FROM roles WHERE name = ? ORDER BY id", [$role->name]);
        $keepId = $duplicateRoles[0]->id;
        
        for ($i = 1; $i < count($duplicateRoles); $i++) {
            $deleteId = $duplicateRoles[$i]->id;
            echo "  Deleting role ID: {$deleteId}\n";
            
            // Update users that have this role
            DB::update("UPDATE users SET role_id = ? WHERE role_id = ?", [$keepId, $deleteId]);
            
            // Delete role_permission entries
            DB::delete("DELETE FROM role_permission WHERE role_id = ?", [$deleteId]);
            
            // Delete the role
            DB::delete("DELETE FROM roles WHERE id = ?", [$deleteId]);
        }
    }
    
    // 2. Check permissions without module
    echo "\n2. Checking permissions without module...\n";
    $emptyModulePermissions = DB::select("SELECT id, name FROM permissions WHERE module IS NULL OR module = ''");
    
    echo "Permissions without module: " . count($emptyModulePermissions) . "\n";
    
    foreach ($emptyModulePermissions as $permission) {
        // Determine module from permission name
        $name = $permission->name;
        $module = 'system'; // default
        
        if (str_starts_with($name, 'department')) {
            $module = 'department';
        } elseif (str_starts_with($name, 'user')) {
            $module = 'user';
        } elseif (str_starts_with($name, 'role')) {
            $module = 'role';
        } elseif (str_starts_with($name, 'kas')) {
            $module = 'kas';
        } elseif (str_starts_with($name, 'akuntansi')) {
            $module = 'akuntansi';
        } elseif (str_starts_with($name, 'inventory')) {
            $module = 'inventory';
        } elseif (str_starts_with($name, 'master')) {
            $module = 'master';
        }
        
        echo "  Updating permission: {$name} -> module: {$module}\n";
        DB::update("UPDATE permissions SET module = ? WHERE id = ?", [$module, $permission->id]);
    }
    
    // 3. Ensure admin role has all permissions
    echo "\n3. Ensuring admin role has all permissions...\n";
    $adminRole = DB::selectOne("SELECT id FROM roles WHERE name = 'admin'");
    
    if ($adminRole) {
        $allPermissions = DB::select("SELECT id FROM permissions");
        $adminPermissions = DB::select("SELECT permission_id FROM role_permission WHERE role_id = ?", [$adminRole->id]);
        $existingPermissionIds = array_column($adminPermissions, 'permission_id');
        
        foreach ($allPermissions as $permission) {
            if (!in_array($permission->id, $existingPermissionIds)) {
                echo "  Adding permission ID {$permission->id} to admin role\n";
                DB::insert("INSERT INTO role_permission (role_id, permission_id) VALUES (?, ?)", [$adminRole->id, $permission->id]);
            }
        }
    }
    
    // 4. Summary
    echo "\n=== SUMMARY ===\n";
    echo "Total roles: " . DB::selectOne("SELECT COUNT(*) as count FROM roles")->count . "\n";
    echo "Total permissions: " . DB::selectOne("SELECT COUNT(*) as count FROM permissions")->count . "\n";
    echo "Permissions without module: " . DB::selectOne("SELECT COUNT(*) as count FROM permissions WHERE module IS NULL OR module = ''")->count . "\n";
    
    $roleList = DB::select("SELECT name FROM roles ORDER BY name");
    echo "Roles: " . implode(', ', array_column($roleList, 'name')) . "\n";
    
    DB::commit();
    echo "\n✅ All fixes completed successfully!\n";
    
} catch (Exception $e) {
    DB::rollBack();
    echo "\n❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
