<?php

require 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Role;

echo "=== CHECKING ROLES ===\n";
$roles = Role::all(['id', 'name']);
echo "Total roles: " . $roles->count() . "\n\n";

foreach ($roles as $role) {
    echo "ID: {$role->id} - Name: {$role->name}\n";
}

echo "\n=== CHECKING DUPLICATES ===\n";
$duplicates = Role::select('name')
    ->groupBy('name')
    ->havingRaw('COUNT(*) > 1')
    ->get();

if ($duplicates->count() > 0) {
    echo "Found duplicate role names:\n";
    foreach ($duplicates as $duplicate) {
        echo "- {$duplicate->name}\n";
        $roleInstances = Role::where('name', $duplicate->name)->get(['id', 'name', 'created_at']);
        foreach ($roleInstances as $instance) {
            echo "  ID: {$instance->id}, Created: {$instance->created_at}\n";
        }
    }
} else {
    echo "No duplicate role names found.\n";
}
