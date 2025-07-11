<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\ApprovalRule;

echo "Creating new approval rule with lower threshold...\n";

// Create a new approval rule with lower threshold for testing
$rule = new ApprovalRule([
    'name' => 'Cash Transaction Low Threshold',
    'entity_type' => 'cash_transaction',
    'approval_type' => 'transaction',
    'min_amount' => 1000000, // 1 million
    'max_amount' => 4999999, // up to just under 5 million
    'approval_levels' => 1,
    'approver_roles' => ['supervisor'],
    'escalation_hours' => 24,
    'auto_approve_weekends' => false,
    'is_active' => true
]);

$rule->save();

echo "New rule created with ID: " . $rule->id . "\n";
echo "Min amount: " . number_format((float)$rule->min_amount) . "\n";
echo "Max amount: " . number_format((float)$rule->max_amount) . "\n";
