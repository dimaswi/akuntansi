<?php

use App\Models\Permission;
use App\Models\Role;

echo "=== Cash Flow Report Permission Check ===\n";

// Check if permission exists
$permission = Permission::where('name', 'laporan.cash-flow.view')->first();
if ($permission) {
    echo "✅ Permission 'laporan.cash-flow.view' exists\n";
    echo "   Display Name: {$permission->display_name}\n";
    echo "   Description: {$permission->description}\n";
} else {
    echo "❌ Permission 'laporan.cash-flow.view' NOT found\n";
}

echo "\n=== Role Access Check ===\n";

// Check which roles have this permission
$roles = ['kasir', 'bendahara', 'akuntan', 'supervisor_keuangan', 'manager_keuangan'];

foreach ($roles as $roleName) {
    $role = Role::where('name', $roleName)->first();
    if ($role) {
        $hasPermission = $role->permissions()->where('name', 'laporan.cash-flow.view')->exists();
        $status = $hasPermission ? '✅' : '❌';
        echo "{$status} {$role->display_name} ({$roleName})\n";
    } else {
        echo "❌ Role '{$roleName}' not found\n";
    }
}

echo "\n=== All Report Permissions ===\n";
$reportPermissions = Permission::where('name', 'like', 'laporan.%')->get();
foreach ($reportPermissions as $perm) {
    echo "- {$perm->name}: {$perm->display_name}\n";
}
