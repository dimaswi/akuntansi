<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('departments')->insert([
            ['name' => 'Logistik', 'code' => 'LOG', 'level' => 1, 'parent_id' => null, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Keuangan', 'code' => 'KEU', 'level' => 1, 'parent_id' => null, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Produksi', 'code' => 'PRO', 'level' => 2, 'parent_id' => 1, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Pemasaran', 'code' => 'PEM', 'level' => 2, 'parent_id' => 1, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}
