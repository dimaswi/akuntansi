<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Role;
use App\Models\Inventory\Department;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class CreateLogisticsUser extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'user:create-logistics {nip} {name} {password}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a user with logistics role';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $nip = $this->argument('nip');
        $name = $this->argument('name');
        $password = $this->argument('password');

        // Get logistics role
        $logisticsRole = Role::where('name', 'logistics')->first();
        if (!$logisticsRole) {
            $this->error('Logistics role not found. Please run RolePermissionSeeder first.');
            return 1;
        }

        // Get logistics department (optional)
        $logisticsDepartment = Department::where(function($query) {
            $query->where('name', 'like', '%logistic%')
                  ->orWhere('name', 'like', '%logistik%')
                  ->orWhere('code', 'like', '%log%');
        })->first();

        // Create user
        $user = User::create([
            'name' => $name,
            'nip' => $nip,
            'password' => Hash::make($password),
            'role_id' => $logisticsRole->id,
            'department_id' => $logisticsDepartment?->id,
        ]);

        $this->info("Logistics user created successfully:");
        $this->info("NIP: {$user->nip}");
        $this->info("Name: {$user->name}");
        $this->info("Role: {$logisticsRole->display_name}");
        $this->info("Department: " . ($logisticsDepartment ? $logisticsDepartment->name : 'None'));

        return 0;
    }
}
