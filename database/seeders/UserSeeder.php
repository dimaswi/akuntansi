<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Pastikan role sudah ada
        $adminRole = Role::where('name', 'admin')->first();
        $managerRole = Role::where('name', 'manager')->first();
        $userRole = Role::where('name', 'user')->first();

        // Create Users
        $users = [
            [
                'name' => 'Dimas Wisnu Wirawan',
                'nip' => '2023.01.02.03',
                'password' => bcrypt('12345'),
                'role_id' => $adminRole?->id,
            ],
            [
                'name' => 'Manager User',
                'nip' => '2023.01.02.04',
                'password' => bcrypt('12345'),
                'role_id' => $managerRole?->id,
            ],
            [
                'name' => 'Regular User',
                'nip' => '2023.01.02.05',
                'password' => bcrypt('12345'),
                'role_id' => $userRole?->id,
            ]
        ];

        foreach ($users as $userData) {
            User::firstOrCreate(
                ['nip' => $userData['nip']],
                $userData
            );
        }

        $this->command->info('Users created successfully!');
    }
}
