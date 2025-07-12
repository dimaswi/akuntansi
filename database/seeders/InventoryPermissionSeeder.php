<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Permission;
use App\Models\Role;

class InventoryPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create Inventory Permissions
        $permissions = [
            // Dashboard
            ['name' => 'inventory.dashboard.view', 'display_name' => 'View Inventory Dashboard', 'description' => 'View inventory dashboard', 'module' => 'inventory'],
            
            // Categories
            ['name' => 'inventory.categories.view', 'display_name' => 'View Categories', 'description' => 'View inventory categories', 'module' => 'inventory'],
            ['name' => 'inventory.categories.create', 'display_name' => 'Create Categories', 'description' => 'Create inventory categories', 'module' => 'inventory'],
            ['name' => 'inventory.categories.edit', 'display_name' => 'Edit Categories', 'description' => 'Edit inventory categories', 'module' => 'inventory'],
            ['name' => 'inventory.categories.delete', 'display_name' => 'Delete Categories', 'description' => 'Delete inventory categories', 'module' => 'inventory'],
            
            // Items
            ['name' => 'inventory.items.view', 'display_name' => 'View Items', 'description' => 'View inventory items', 'module' => 'inventory'],
            ['name' => 'inventory.items.create', 'display_name' => 'Create Items', 'description' => 'Create inventory items', 'module' => 'inventory'],
            ['name' => 'inventory.items.edit', 'display_name' => 'Edit Items', 'description' => 'Edit inventory items', 'module' => 'inventory'],
            ['name' => 'inventory.items.delete', 'display_name' => 'Delete Items', 'description' => 'Delete inventory items', 'module' => 'inventory'],
            ['name' => 'inventory.items.view-cost', 'display_name' => 'View Item Costs', 'description' => 'View item costs and pricing', 'module' => 'inventory'],
            
            // Stock Management
            ['name' => 'inventory.stock.view', 'display_name' => 'View Stock', 'description' => 'View stock levels', 'module' => 'inventory'],
            ['name' => 'inventory.stock.adjust', 'display_name' => 'Adjust Stock', 'description' => 'Adjust stock quantities', 'module' => 'inventory'],
            ['name' => 'inventory.stock.transfer', 'display_name' => 'Transfer Stock', 'description' => 'Transfer stock between locations', 'module' => 'inventory'],
            ['name' => 'inventory.stock.reserve', 'display_name' => 'Reserve Stock', 'description' => 'Reserve stock for departments', 'module' => 'inventory'],
            
            // Stock Movements
            ['name' => 'inventory.movements.view', 'display_name' => 'View Movements', 'description' => 'View stock movements', 'module' => 'inventory'],
            ['name' => 'inventory.movements.create', 'display_name' => 'Create Movements', 'description' => 'Create stock movements', 'module' => 'inventory'],
            ['name' => 'inventory.movements.approve', 'display_name' => 'Approve Movements', 'description' => 'Approve stock movements', 'module' => 'inventory'],
            ['name' => 'inventory.movements.complete', 'display_name' => 'Complete Movements', 'description' => 'Complete stock movements', 'module' => 'inventory'],
            
            // Locations
            ['name' => 'inventory.locations.view', 'display_name' => 'View Locations', 'description' => 'View inventory locations', 'module' => 'inventory'],
            ['name' => 'inventory.locations.create', 'display_name' => 'Create Locations', 'description' => 'Create inventory locations', 'module' => 'inventory'],
            ['name' => 'inventory.locations.edit', 'display_name' => 'Edit Locations', 'description' => 'Edit inventory locations', 'module' => 'inventory'],
            ['name' => 'inventory.locations.delete', 'display_name' => 'Delete Locations', 'description' => 'Delete inventory locations', 'module' => 'inventory'],
            
            // Suppliers
            ['name' => 'inventory.suppliers.view', 'display_name' => 'View Suppliers', 'description' => 'View suppliers', 'module' => 'inventory'],
            ['name' => 'inventory.suppliers.create', 'display_name' => 'Create Suppliers', 'description' => 'Create suppliers', 'module' => 'inventory'],
            ['name' => 'inventory.suppliers.edit', 'display_name' => 'Edit Suppliers', 'description' => 'Edit suppliers', 'module' => 'inventory'],
            ['name' => 'inventory.suppliers.delete', 'display_name' => 'Delete Suppliers', 'description' => 'Delete suppliers', 'module' => 'inventory'],
            
            // Requisitions
            ['name' => 'inventory.requisitions.view', 'display_name' => 'View Requisitions', 'description' => 'View inventory requisitions', 'module' => 'inventory'],
            ['name' => 'inventory.requisitions.create', 'display_name' => 'Create Requisitions', 'description' => 'Create inventory requisitions', 'module' => 'inventory'],
            ['name' => 'inventory.requisitions.edit', 'display_name' => 'Edit Requisitions', 'description' => 'Edit inventory requisitions', 'module' => 'inventory'],
            ['name' => 'inventory.requisitions.approve', 'display_name' => 'Approve Requisitions', 'description' => 'Approve inventory requisitions', 'module' => 'inventory'],
            ['name' => 'inventory.requisitions.reject', 'display_name' => 'Reject Requisitions', 'description' => 'Reject inventory requisitions', 'module' => 'inventory'],
            ['name' => 'inventory.requisitions.complete', 'display_name' => 'Complete Requisitions', 'description' => 'Complete inventory requisitions', 'module' => 'inventory'],
            
            // Stock Count (Opname)
            ['name' => 'inventory.stock-count.view', 'display_name' => 'View Stock Count', 'description' => 'View stock count sessions', 'module' => 'inventory'],
            ['name' => 'inventory.stock-count.create', 'display_name' => 'Create Stock Count', 'description' => 'Create stock count sessions', 'module' => 'inventory'],
            ['name' => 'inventory.stock-count.perform', 'display_name' => 'Perform Stock Count', 'description' => 'Perform stock counting', 'module' => 'inventory'],
            ['name' => 'inventory.stock-count.verify', 'display_name' => 'Verify Stock Count', 'description' => 'Verify stock count results', 'module' => 'inventory'],
            ['name' => 'inventory.stock-count.approve', 'display_name' => 'Approve Stock Count', 'description' => 'Approve stock count adjustments', 'module' => 'inventory'],
            ['name' => 'inventory.stock-count.finalize', 'display_name' => 'Finalize Stock Count', 'description' => 'Finalize stock count sessions', 'module' => 'inventory'],
            
            // Batches (Pharmacy)
            ['name' => 'inventory.batches.view', 'display_name' => 'View Batches', 'description' => 'View inventory batches', 'module' => 'inventory'],
            ['name' => 'inventory.batches.create', 'display_name' => 'Create Batches', 'description' => 'Create inventory batches', 'module' => 'inventory'],
            ['name' => 'inventory.batches.edit', 'display_name' => 'Edit Batches', 'description' => 'Edit inventory batches', 'module' => 'inventory'],
            ['name' => 'inventory.batches.expire', 'display_name' => 'Expire Batches', 'description' => 'Mark batches as expired', 'module' => 'inventory'],
            
            // Reports
            ['name' => 'inventory.reports.stock-summary', 'display_name' => 'Stock Summary Report', 'description' => 'View stock summary reports', 'module' => 'inventory'],
            ['name' => 'inventory.reports.low-stock', 'display_name' => 'Low Stock Report', 'description' => 'View low stock reports', 'module' => 'inventory'],
            ['name' => 'inventory.reports.movement-history', 'display_name' => 'Movement History Report', 'description' => 'View movement history reports', 'module' => 'inventory'],
            ['name' => 'inventory.reports.valuation', 'display_name' => 'Valuation Report', 'description' => 'View inventory valuation reports', 'module' => 'inventory'],
            ['name' => 'inventory.reports.expiry', 'display_name' => 'Expiry Report', 'description' => 'View expiry reports', 'module' => 'inventory'],
            ['name' => 'inventory.reports.requisition-summary', 'display_name' => 'Requisition Summary Report', 'description' => 'View requisition summary reports', 'module' => 'inventory'],
            
            // Advanced Operations
            ['name' => 'inventory.admin.settings', 'display_name' => 'Inventory Settings', 'description' => 'Manage inventory system settings', 'module' => 'inventory'],
            ['name' => 'inventory.admin.backup', 'display_name' => 'Backup Inventory', 'description' => 'Backup inventory data', 'module' => 'inventory'],
            ['name' => 'inventory.admin.import', 'display_name' => 'Import Inventory', 'description' => 'Import inventory data', 'module' => 'inventory'],
            ['name' => 'inventory.admin.export', 'display_name' => 'Export Inventory', 'description' => 'Export inventory data', 'module' => 'inventory'],
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission['name']],
                [
                    'display_name' => $permission['display_name'],
                    'description' => $permission['description'],
                    'module' => $permission['module']
                ]
            );
        }

        // Get or create roles
        $adminRole = Role::firstOrCreate(
            ['name' => 'admin'], 
            ['display_name' => 'Administrator', 'description' => 'System Administrator']
        );
        
        $managerRole = Role::firstOrCreate(
            ['name' => 'manager'], 
            ['display_name' => 'Manager', 'description' => 'Department Manager']
        );
        
        $pharmacistRole = Role::firstOrCreate(
            ['name' => 'pharmacist'], 
            ['display_name' => 'Pharmacist', 'description' => 'Pharmacy Staff']
        );
        
        $warehouseRole = Role::firstOrCreate(
            ['name' => 'warehouse_staff'], 
            ['display_name' => 'Warehouse Staff', 'description' => 'Warehouse Personnel']
        );
        
        $doctorRole = Role::firstOrCreate(
            ['name' => 'doctor'], 
            ['display_name' => 'Doctor', 'description' => 'Medical Doctor']
        );
        
        $nurseRole = Role::firstOrCreate(
            ['name' => 'nurse'], 
            ['display_name' => 'Nurse', 'description' => 'Nursing Staff']
        );

        // Admin gets all inventory permissions
        $adminPermissions = Permission::where('name', 'like', 'inventory.%')->pluck('id');
        $adminRole->permissions()->syncWithoutDetaching($adminPermissions);

        // Manager gets most permissions except system admin functions
        $managerPermissions = Permission::where('name', 'like', 'inventory.%')
            ->where('name', 'not like', 'inventory.admin.%')
            ->pluck('id');
        $managerRole->permissions()->syncWithoutDetaching($managerPermissions);

        // Pharmacist gets pharmacy-specific permissions
        $pharmacistPermissions = Permission::whereIn('name', [
            'inventory.dashboard.view',
            'inventory.items.view',
            'inventory.items.create',
            'inventory.items.edit',
            'inventory.stock.view',
            'inventory.stock.adjust',
            'inventory.movements.view',
            'inventory.movements.create',
            'inventory.batches.view',
            'inventory.batches.create',
            'inventory.batches.edit',
            'inventory.batches.expire',
            'inventory.requisitions.view',
            'inventory.requisitions.create',
            'inventory.stock-count.view',
            'inventory.stock-count.perform',
            'inventory.reports.stock-summary',
            'inventory.reports.low-stock',
            'inventory.reports.expiry',
        ])->pluck('id');
        $pharmacistRole->permissions()->syncWithoutDetaching($pharmacistPermissions);

        // Warehouse Staff gets stock management permissions
        $warehousePermissions = Permission::whereIn('name', [
            'inventory.dashboard.view',
            'inventory.items.view',
            'inventory.stock.view',
            'inventory.stock.adjust',
            'inventory.stock.transfer',
            'inventory.movements.view',
            'inventory.movements.create',
            'inventory.movements.complete',
            'inventory.locations.view',
            'inventory.requisitions.view',
            'inventory.requisitions.complete',
            'inventory.stock-count.view',
            'inventory.stock-count.perform',
            'inventory.stock-count.verify',
            'inventory.reports.stock-summary',
            'inventory.reports.movement-history',
        ])->pluck('id');
        $warehouseRole->permissions()->syncWithoutDetaching($warehousePermissions);

        // Doctor gets requisition and viewing permissions
        $doctorPermissions = Permission::whereIn('name', [
            'inventory.dashboard.view',
            'inventory.items.view',
            'inventory.stock.view',
            'inventory.requisitions.view',
            'inventory.requisitions.create',
            'inventory.batches.view',
            'inventory.reports.stock-summary',
            'inventory.reports.low-stock',
        ])->pluck('id');
        $doctorRole->permissions()->syncWithoutDetaching($doctorPermissions);

        // Nurse gets basic requisition permissions
        $nursePermissions = Permission::whereIn('name', [
            'inventory.dashboard.view',
            'inventory.items.view',
            'inventory.stock.view',
            'inventory.requisitions.view',
            'inventory.requisitions.create',
            'inventory.reports.stock-summary',
        ])->pluck('id');
        $nurseRole->permissions()->syncWithoutDetaching($nursePermissions);

        echo "Inventory permissions created successfully!\n";
        echo "Total permissions created: " . count($permissions) . "\n";
        echo "Role permissions assigned successfully!\n";
    }
}
