<?php

namespace Database\Seeders;

use App\Models\Akuntansi\Jurnal;
use App\Models\Inventory\Department;
use App\Models\Inventory\Supplier;
use App\Models\User;
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
            // BankAccountSeeder::class,
            DaftarAkunSeeder::class,
            DepartmentSeeder::class,
            // JurnalSeeder::class,
            KasBankAkunSeeder::class,
            RolePermissionSeeder::class,
            SupplierSeeder::class,
            UserSeeder::class,
        ]);
    }
}
