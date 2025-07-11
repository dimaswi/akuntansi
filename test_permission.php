<?php

use App\Models\User;

$user = User::first();
if ($user) {
    $hasPermission = $user->can('monthly-closing.view');
    echo "User {$user->name} CAN access monthly closing: " . ($hasPermission ? 'YES' : 'NO') . "\n";
    echo "User role: " . $user->role->name . "\n";
} else {
    echo "No users found\n";
}
