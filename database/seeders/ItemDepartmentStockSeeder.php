<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Inventory\Item;
use App\Models\Inventory\Department;
use App\Models\Inventory\ItemDepartmentStock;

class ItemDepartmentStockSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all items and departments
        $items = Item::all();
        $departments = Department::where('is_active', true)->get();
        
        // Get logistics department
        $logisticsDepartment = Department::where(function($query) {
            $query->where('name', 'like', '%logistic%')
                  ->orWhere('code', 'like', '%log%');
        })->first();

        if (!$logisticsDepartment) {
            // Create logistics department if not exists
            $logisticsDepartment = Department::create([
                'code' => 'LOG',
                'name' => 'Logistics',
                'level' => 1,
                'is_active' => true,
            ]);
            $this->command->info('Created Logistics department');
        }

        foreach ($items as $item) {
            foreach ($departments as $department) {
                // Create stock record for each item-department combination
                $stockData = [
                    'item_id' => $item->id,
                    'department_id' => $department->id,
                    'minimum_stock' => $item->reorder_level ?? 10,
                    'maximum_stock' => $item->max_level ?? 100,
                ];

                // Give initial stock only to logistics department
                if ($department->id === $logisticsDepartment->id) {
                    $stockData['current_stock'] = rand(50, 200); // Random initial stock
                } else {
                    $stockData['current_stock'] = 0; // Other departments start with 0
                }

                $stockData['reserved_stock'] = 0;
                $stockData['available_stock'] = $stockData['current_stock'];

                ItemDepartmentStock::firstOrCreate(
                    [
                        'item_id' => $item->id,
                        'department_id' => $department->id,
                    ],
                    $stockData
                );
            }
        }

        $this->command->info('Item department stocks seeded successfully!');
    }
}
