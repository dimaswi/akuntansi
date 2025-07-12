<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Inventory\InventoryCategory;
use App\Models\Inventory\InventoryLocation;
use App\Models\Inventory\InventorySupplier;
use App\Models\Inventory\InventoryItem;
use App\Models\Inventory\PharmacyItemDetail;
use App\Models\Inventory\GeneralItemDetail;
use App\Models\Inventory\InventoryStock;

class InventorySeeder extends Seeder
{
    public function run(): void
    {
        // Create Categories
        $pharmacyCategory = InventoryCategory::create([
            'code' => 'PHARM',
            'name' => 'Pharmacy Items',
            'description' => 'Pharmaceutical products and medicines',
            'category_type' => 'pharmacy',
            'is_active' => true,
        ]);

        $antibioticsCategory = InventoryCategory::create([
            'code' => 'ANTI',
            'name' => 'Antibiotics',
            'description' => 'Antibiotic medications',
            'category_type' => 'pharmacy',
            'parent_id' => $pharmacyCategory->id,
            'is_active' => true,
        ]);

        $generalCategory = InventoryCategory::create([
            'code' => 'GEN',
            'name' => 'General Supplies',
            'description' => 'General medical and office supplies',
            'category_type' => 'general',
            'is_active' => true,
        ]);

        $medicalEquipmentCategory = InventoryCategory::create([
            'code' => 'MDEQ',
            'name' => 'Medical Equipment',
            'description' => 'Medical devices and equipment',
            'category_type' => 'general',
            'parent_id' => $generalCategory->id,
            'is_active' => true,
        ]);

        // Create Locations
        $mainWarehouse = InventoryLocation::create([
            'code' => 'WH-MAIN',
            'name' => 'Main Warehouse',
            'description' => 'Primary storage facility',
            'location_type' => 'warehouse',
            'is_active' => true,
            'contact_person' => 'John Doe',
            'phone' => '+6281234567890',
            'address' => 'Jl. Industri No. 123, Jakarta',
        ]);

        $pharmacy = InventoryLocation::create([
            'code' => 'PHARM-01',
            'name' => 'Main Pharmacy',
            'description' => 'Hospital main pharmacy',
            'location_type' => 'pharmacy',
            'is_active' => true,
            'contact_person' => 'Jane Smith',
            'phone' => '+6281234567891',
            'address' => 'Building A, Floor 1',
        ]);

        $department = InventoryLocation::create([
            'code' => 'DEPT-ICU',
            'name' => 'ICU Department',
            'description' => 'Intensive Care Unit',
            'location_type' => 'department',
            'is_active' => true,
            'contact_person' => 'Dr. Ahmad',
            'phone' => '+6281234567892',
            'address' => 'Building B, Floor 3',
        ]);

        // Create Suppliers
        $supplier1 = InventorySupplier::create([
            'code' => 'SUP-001',
            'name' => 'PT Kimia Farma',
            'contact_person' => 'Budi Santoso',
            'email' => 'budi@kimiafarma.co.id',
            'phone' => '+6221234567890',
            'address' => 'Jl. Veteran No. 9, Jakarta Pusat 10110, Indonesia',
            'tax_id' => '01.234.567.8-901.000',
            'supplier_type' => 'pharmacy',
            'pbf_license_number' => 'PBF-001/2024',
            'cold_chain_capable' => true,
            'narcotic_license' => true,
            'payment_terms_days' => 30,
            'credit_limit' => 500000000,
            'is_active' => true,
            'notes' => 'Primary pharmaceutical supplier',
        ]);

        $supplier2 = InventorySupplier::create([
            'code' => 'SUP-002',
            'name' => 'PT Medical Equipment Indonesia',
            'contact_person' => 'Sarah Wijaya',
            'email' => 'sarah@medequip.co.id',
            'phone' => '+6221234567891',
            'address' => 'Jl. Raya Bogor No. 45, Jakarta Timur 13920, Indonesia',
            'tax_id' => '01.234.567.8-902.000',
            'supplier_type' => 'general',
            'cold_chain_capable' => false,
            'narcotic_license' => false,
            'payment_terms_days' => 45,
            'credit_limit' => 300000000,
            'is_active' => true,
            'notes' => 'Medical equipment and devices supplier',
        ]);

        // Create Pharmacy Items
        $amoxicillin = InventoryItem::create([
            'category_id' => $antibioticsCategory->id,
            'code' => 'AMX-500',
            'name' => 'Amoxicillin 500mg Capsule',
            'description' => 'Broad-spectrum antibiotic',
            'inventory_type' => 'pharmacy',
            'unit_of_measure' => 'capsule',
            'pack_size' => 100,
            'reorder_level' => 1000,
            'max_level' => 5000,
            'safety_stock' => 500,
            'standard_cost' => 150,
            'is_active' => true,
            'requires_approval' => false,
            'is_controlled_substance' => false,
            'requires_prescription' => true,
        ]);

        PharmacyItemDetail::create([
            'inventory_item_id' => $amoxicillin->id,
            'bpom_registration' => 'DKL1234567890A1',
            'manufacturer' => 'PT Pharma Indonesia',
            'generic_name' => 'Amoxicillin',
            'strength' => '500mg',
            'dosage_form' => 'Capsule',
            'drug_classification' => 'keras',
            'atc_code' => 'J01CA04',
            'contraindications' => 'Penicillin allergy, severe renal impairment',
            'drug_interactions' => ['Warfarin', 'Methotrexate', 'Oral contraceptives'],
            'storage_temp_min' => 15.0,
            'storage_temp_max' => 25.0,
            'minimum_expiry_months' => 18,
        ]);

        // Create General Items
        $syringe = InventoryItem::create([
            'category_id' => $medicalEquipmentCategory->id,
            'code' => 'SYR-5ML',
            'name' => 'Disposable Syringe 5ml',
            'description' => 'Sterile disposable syringe with needle',
            'inventory_type' => 'general',
            'unit_of_measure' => 'piece',
            'pack_size' => 100,
            'reorder_level' => 5000,
            'max_level' => 20000,
            'safety_stock' => 2000,
            'standard_cost' => 2500,
            'is_active' => true,
            'requires_approval' => false,
            'is_controlled_substance' => false,
            'requires_prescription' => false,
        ]);

        GeneralItemDetail::create([
            'inventory_item_id' => $syringe->id,
            'is_consumable' => true,
            'is_returnable' => false,
            'requires_maintenance' => false,
            'warranty_months' => null,
            'usage_instructions' => 'Single use only. Dispose after use according to medical waste guidelines.',
            'department_restrictions' => ['ICU', 'Emergency', 'Surgery', 'General Ward'],
        ]);

        // Create Stock Records
        InventoryStock::create([
            'item_id' => $amoxicillin->id,
            'location_id' => $mainWarehouse->id,
            'current_quantity' => 2500,
            'available_quantity' => 2500,
            'reserved_quantity' => 0,
            'average_cost' => 150,
            'total_value' => 375000,
            'last_movement_at' => now(),
        ]);

        InventoryStock::create([
            'item_id' => $amoxicillin->id,
            'location_id' => $pharmacy->id,
            'current_quantity' => 500,
            'available_quantity' => 450,
            'reserved_quantity' => 50,
            'average_cost' => 150,
            'total_value' => 75000,
            'last_movement_at' => now(),
        ]);

        InventoryStock::create([
            'item_id' => $syringe->id,
            'location_id' => $mainWarehouse->id,
            'current_quantity' => 15000,
            'available_quantity' => 15000,
            'reserved_quantity' => 0,
            'average_cost' => 2500,
            'total_value' => 37500000,
            'last_movement_at' => now(),
        ]);

        InventoryStock::create([
            'item_id' => $syringe->id,
            'location_id' => $department->id,
            'current_quantity' => 1000,
            'available_quantity' => 800,
            'reserved_quantity' => 200,
            'average_cost' => 2500,
            'total_value' => 2500000,
            'last_movement_at' => now(),
        ]);

        $this->command->info('Inventory seeder completed successfully!');
    }
}
