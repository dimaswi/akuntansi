<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Department;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        // Create sample departments
        Department::create([
            'code' => 'FIN',
            'name' => 'Finance Department',
            'description' => 'Handles all financial operations',
            'monthly_budget_limit' => 50000000,
            'is_active' => true,
            'can_request_items' => true,
        ]);

        Department::create([
            'code' => 'HR',
            'name' => 'Human Resources',
            'description' => 'Manages human resources and personnel',
            'monthly_budget_limit' => 25000000,
            'is_active' => true,
            'can_request_items' => true,
        ]);

        Department::create([
            'code' => 'IT',
            'name' => 'Information Technology',
            'description' => 'IT support and infrastructure',
            'monthly_budget_limit' => 75000000,
            'is_active' => true,
            'can_request_items' => true,
        ]);

        Department::create([
            'code' => 'MKT',
            'name' => 'Marketing Department',
            'description' => 'Marketing and promotion activities',
            'monthly_budget_limit' => 30000000,
            'is_active' => true,
            'can_request_items' => true,
        ]);

        Department::create([
            'code' => 'OPS',
            'name' => 'Operations Department',
            'description' => 'Daily operations and logistics',
            'monthly_budget_limit' => 40000000,
            'is_active' => true,
            'can_request_items' => true,
        ]);
    }
}
