<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\ApprovalRule;

echo "=== Current Approval Rules ===\n\n";

$rules = ApprovalRule::all();
foreach ($rules as $rule) {
    echo "Rule ID: " . $rule->id . "\n";
    echo "Entity Type: " . $rule->entity_type . "\n";
    echo "Approval Type: " . $rule->approval_type . "\n";
    echo "Min Amount: " . number_format((float)$rule->min_amount) . "\n";
    echo "Max Amount: " . ($rule->max_amount ? number_format((float)$rule->max_amount) : 'No limit') . "\n";
    echo "Required Role: " . $rule->required_role . "\n";
    echo "Active: " . ($rule->is_active ? 'Yes' : 'No') . "\n";
    echo "---\n";
}
