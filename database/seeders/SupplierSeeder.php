<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SupplierSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('suppliers')->insert([
            [
                'name' => 'PT. Sumber ATK',
                'address' => 'Jl. Raya No. 1',
                'phone' => '0211234567',
                'email' => 'info@sumberatk.com',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'CV. Logistik Jaya',
                'address' => 'Jl. Industri No. 2',
                'phone' => '0217654321',
                'email' => 'logistik@jaya.com',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
