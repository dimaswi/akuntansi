<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->boot();

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;

echo "=== PERMISSION CHECK ===\n\n";

// Check permissions
$permissions = [
    'kas.view',
    'kas.cash-transaction.view',
    'kas.bank-transaction.view',
    'kas.giro-transaction.view',
    'kas.cash-management.view',
    'laporan.cash-flow.view'
];

foreach ($permissions as $permName) {
    $perm = Permission::where('name', $permName)->first();
    $status = $perm ? '✅' : '❌';
    echo "{$status} {$permName}\n";
}

echo "\n=== ROLE PERMISSIONS CHECK ===\n\n";

$roles = ['kasir', 'bendahara', 'supervisor_keuangan', 'manager_keuangan'];

foreach ($roles as $roleName) {
    echo "--- {$roleName} ---\n";
    $role = Role::where('name', $roleName)->first();
    if ($role) {
        $hasKasView = $role->permissions()->where('name', 'kas.view')->exists();
        $hasReportView = $role->permissions()->where('name', 'laporan.cash-flow.view')->exists();
        
        echo "  kas.view: " . ($hasKasView ? '✅' : '❌') . "\n";
        echo "  laporan.cash-flow.view: " . ($hasReportView ? '✅' : '❌') . "\n";
    } else {
        echo "  Role not found ❌\n";
    }
    echo "\n";
}

echo "=== SAMPLE USER CHECK ===\n\n";
$user = User::first();
if ($user && $user->role) {
    echo "User: {$user->name}\n";
    echo "Role: {$user->role->name}\n";
    echo "Can access kas.view: " . ($user->can('kas.view') ? '✅' : '❌') . "\n";
    echo "Can access laporan.cash-flow.view: " . ($user->can('laporan.cash-flow.view') ? '✅' : '❌') . "\n";
} else {
    echo "No user found or user has no role\n";
}
