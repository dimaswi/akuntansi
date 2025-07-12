<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\DepartmentRequest;
use App\Models\User;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class DepartmentSampleDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create sample departments
        $departments = [
            [
                'code' => 'IT',
                'name' => 'Information Technology',
                'description' => 'Departemen Teknologi Informasi',
                'location' => 'Lantai 3',
                'monthly_budget_limit' => 50000000,
                'is_active' => true,
                'can_request_items' => true,
            ],
            [
                'code' => 'HR',
                'name' => 'Human Resources',
                'description' => 'Departemen Sumber Daya Manusia',
                'location' => 'Lantai 2',
                'monthly_budget_limit' => 30000000,
                'is_active' => true,
                'can_request_items' => true,
            ],
            [
                'code' => 'FIN',
                'name' => 'Finance',
                'description' => 'Departemen Keuangan',
                'location' => 'Lantai 1',
                'monthly_budget_limit' => 25000000,
                'is_active' => true,
                'can_request_items' => true,
            ],
            [
                'code' => 'OPS',
                'name' => 'Operations',
                'description' => 'Departemen Operasional',
                'location' => 'Lantai 1',
                'monthly_budget_limit' => 40000000,
                'is_active' => true,
                'can_request_items' => true,
            ],
        ];

        foreach ($departments as $dept) {
            Department::firstOrCreate(
                ['code' => $dept['code']],
                $dept
            );
        }

        // Get first user as default requester
        $user = User::first();
        if (!$user) {
            return;
        }

        // Create sample department requests
        $requests = [
            [
                'request_number' => 'REQ-2025-001',
                'department_id' => Department::where('code', 'IT')->first()->id,
                'requested_by' => $user->id,
                'request_date' => Carbon::now()->subDays(30),
                'needed_date' => Carbon::now()->addDays(7),
                'priority' => 'high',
                'status' => 'approved',
                'purpose' => 'Pengadaan laptop untuk developer baru',
                'justification' => 'Diperlukan untuk mendukung pengembangan aplikasi',
                'total_estimated_cost' => 15000000,
                'approved_budget' => 14000000,
                'approved_by' => $user->id,
                'approved_at' => Carbon::now()->subDays(25),
            ],
            [
                'request_number' => 'REQ-2025-002',
                'department_id' => Department::where('code', 'HR')->first()->id,
                'requested_by' => $user->id,
                'request_date' => Carbon::now()->subDays(20),
                'needed_date' => Carbon::now()->addDays(10),
                'priority' => 'normal',
                'status' => 'submitted',
                'purpose' => 'Pengadaan furniture untuk ruang meeting',
                'justification' => 'Ruang meeting baru memerlukan furniture',
                'total_estimated_cost' => 8000000,
            ],
            [
                'request_number' => 'REQ-2025-003',
                'department_id' => Department::where('code', 'FIN')->first()->id,
                'requested_by' => $user->id,
                'request_date' => Carbon::now()->subDays(15),
                'needed_date' => Carbon::now()->addDays(5),
                'priority' => 'urgent',
                'status' => 'fulfilled',
                'purpose' => 'Pengadaan software akuntansi',
                'justification' => 'Software lama sudah tidak didukung',
                'total_estimated_cost' => 12000000,
                'approved_budget' => 12000000,
                'approved_by' => $user->id,
                'approved_at' => Carbon::now()->subDays(10),
                'fulfilled_by' => $user->id,
                'fulfilled_at' => Carbon::now()->subDays(5),
                'actual_cost' => 11500000,
            ],
            [
                'request_number' => 'REQ-2025-004',
                'department_id' => Department::where('code', 'OPS')->first()->id,
                'requested_by' => $user->id,
                'request_date' => Carbon::now()->subDays(10),
                'needed_date' => Carbon::now()->addDays(15),
                'priority' => 'low',
                'status' => 'draft',
                'purpose' => 'Pengadaan alat kebersihan',
                'justification' => 'Stok alat kebersihan menipis',
                'total_estimated_cost' => 3000000,
            ],
            [
                'request_number' => 'REQ-2025-005',
                'department_id' => Department::where('code', 'IT')->first()->id,
                'requested_by' => $user->id,
                'request_date' => Carbon::now()->subDays(5),
                'needed_date' => Carbon::now()->addDays(20),
                'priority' => 'normal',
                'status' => 'rejected',
                'purpose' => 'Upgrade server storage',
                'justification' => 'Kapasitas storage hampir penuh',
                'total_estimated_cost' => 25000000,
                'approved_by' => $user->id,
                'approved_at' => Carbon::now()->subDays(2),
                'approval_notes' => 'Budget tidak mencukupi, ditunda ke quarter berikutnya',
            ],
        ];

        foreach ($requests as $request) {
            DepartmentRequest::firstOrCreate(
                ['request_number' => $request['request_number']],
                $request
            );
        }
    }
}
