<?php

require 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== CHECKING USER PERMISSIONS ===\n";

// Check admin role permissions
$adminRole = DB::selectOne("SELECT id FROM roles WHERE name = 'admin'");
if ($adminRole) {
    $adminPermissions = DB::select("
        SELECT p.name 
        FROM permissions p 
        JOIN role_permission rp ON p.id = rp.permission_id 
        WHERE rp.role_id = ? AND p.name LIKE 'department.stock%'
        ORDER BY p.name
    ", [$adminRole->id]);
    
    echo "Admin role department.stock permissions:\n";
    foreach ($adminPermissions as $perm) {
        echo "  - {$perm->name}\n";
    }
    
    echo "\nTotal admin permissions: " . DB::selectOne("SELECT COUNT(*) as count FROM role_permission WHERE role_id = ?", [$adminRole->id])->count . "\n";
}

// Check users with admin role
$adminUsers = DB::select("SELECT id, name, email FROM users WHERE role_id = ?", [$adminRole->id]);
echo "\nUsers with admin role:\n";
foreach ($adminUsers as $user) {
    echo "  - ID: {$user->id}, Name: {$user->name}, Email: {$user->email}\n";
}

// Check if all department permissions exist
echo "\n=== DEPARTMENT STOCK PERMISSIONS ===\n";
$departmentStockPermissions = DB::select("SELECT name FROM permissions WHERE name LIKE 'department.stock%' ORDER BY name");
foreach ($departmentStockPermissions as $perm) {
    echo "  ✓ {$perm->name}\n";
}

echo "\nTotal department.stock permissions: " . count($departmentStockPermissions) . "\n";
