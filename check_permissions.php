<?php

<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
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
=======
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
require 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Permission;

echo "=== CHECKING PERMISSIONS WITHOUT MODULE ===\n";
$permissionsWithoutModule = Permission::whereNull('module')
    ->orWhere('module', '')
    ->get(['id', 'name', 'module']);

echo "Total permissions without module: " . $permissionsWithoutModule->count() . "\n\n";

foreach ($permissionsWithoutModule as $permission) {
    echo "ID: {$permission->id} - Name: {$permission->name} - Module: " . ($permission->module ?: 'NULL') . "\n";
}

echo "\n=== ANALYZING PERMISSION PATTERNS ===\n";
$patterns = [
    'department' => Permission::where('name', 'like', 'department%')->count(),
    'user' => Permission::where('name', 'like', 'user%')->count(),
    'role' => Permission::where('name', 'like', 'role%')->count(),
    'kas' => Permission::where('name', 'like', 'kas%')->count(),
    'akuntansi' => Permission::where('name', 'like', 'akuntansi%')->count(),
];

foreach ($patterns as $pattern => $count) {
    echo "Permissions starting with '{$pattern}': {$count}\n";
<<<<<<< Updated upstream
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
}
