<?php

namespace Database\Seeders;

use App\Models\Approval;
use App\Models\User;
use Carbon\Month;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RolePermissionSeeder::class,
            UserSeeder::class,
            DaftarAkunSeeder::class,
            KasBankAkunSeeder::class,
            BankAccountSeeder::class,
            MonthlyClosingSeeder::class,
            ApprovalRuleSeeder::class,
            CashManagementWorkflowPermissionSeeder::class,
            JurnalSeeder::class,
        ]);
    }
}
