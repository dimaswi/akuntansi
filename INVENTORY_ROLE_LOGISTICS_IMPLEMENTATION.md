# Implementasi Role Logistics untuk Sistem Inventory

## Ringkasan Perubahan

Sistem inventory telah diubah untuk menggunakan **role logistics** sebagai ganti **department logistics** untuk kontrol akses. Hal ini memberikan fleksibilitas yang lebih baik dalam manajemen pengguna dan permission.

## Perubahan Backend

### 1. User Model
- **File:** `app/Models/User.php`
- **Perubahan:** Menambahkan method `isLogistics()` untuk mengecek role logistics
```php
public function isLogistics(): bool
{
    return $this->hasRole('logistics');
}
```

### 2. Controller Updates

#### ItemController
- **File:** `app/Http/Controllers/Inventory/ItemController.php`
- **Perubahan:** 
  - Menggunakan `$user->isLogistics()` untuk mengecek akses
  - Logistics role dapat melihat semua items dari semua department
  - Non-logistics hanya melihat items dari department mereka

#### RequisitionController
- **File:** `app/Http/Controllers/Inventory/RequisitionController.php`
- **Perubahan:**
  - Logistics dapat melihat semua requisitions
  - Non-logistics hanya melihat requisitions dari department mereka

#### PurchaseController
- **File:** `app/Http/Controllers/Inventory/PurchaseController.php`
- **Perubahan:**
  - Logistics dapat melihat semua purchases
  - Non-logistics hanya melihat purchases dari department mereka

#### ItemCategoryController
- **File:** `app/Http/Controllers/Inventory/ItemCategoryController.php`
- **Perubahan:**
  - Hanya logistics yang dapat create/edit/delete categories
  - Non-logistics hanya dapat view

#### SupplierController
- **File:** `app/Http/Controllers/Inventory/SupplierController.php`
- **Perubahan:**
  - Hanya logistics yang dapat create/edit/delete suppliers
  - Non-logistics hanya dapat view

#### DepartmentController
- **File:** `app/Http/Controllers/Inventory/DepartmentController.php`
- **Perubahan:**
  - Hanya logistics yang dapat create/edit/delete departments
  - Non-logistics hanya dapat view

### 3. Repository Updates

#### ItemRepository
- **File:** `app/Repositories/Inventory/ItemRepository.php`
- **Perubahan:**
  - Filtering berdasarkan `item_department_stocks` table
  - Support `is_logistics` flag untuk kontrol akses
  - Logistics dapat melihat semua items, non-logistics hanya yang ada di department mereka

## Perubahan Frontend

### 1. Items Index
- **File:** `resources/js/pages/inventory/items/index.tsx`
- **Perubahan:**
  - Menampilkan column Department hanya untuk logistics
  - Tombol "Tambah Item" hanya untuk logistics
  - Filter Department hanya muncul untuk logistics
  - Menampilkan current stock dari `item_department_stocks`

### 2. Suppliers Index
- **File:** `resources/js/pages/inventory/suppliers/index.tsx`
- **Perubahan:**
  - Tombol "Tambah Supplier" hanya untuk logistics
  - Message empty state disesuaikan dengan role

### 3. Requisitions Index
- **File:** `resources/js/pages/inventory/requisitions/index.tsx`
- **Perubahan:**
  - Menambahkan support `isLogistics` prop
  - Semua department masih bisa create requisition

## Role dan Permission

### Role Logistics
- **Name:** `logistics`
- **Permissions yang dimiliki:**
  - `inventory.items.manage`
  - `inventory.categories.manage`
  - `inventory.suppliers.manage`
  - `inventory.departments.manage`
  - `inventory.purchases.manage`
  - `inventory.requisitions.approve`

### Testing User
User logistics telah dibuat untuk testing:
- **Name:** Logistics User
- **NIP:** LOGS001
- **Role:** logistics
- **Department:** Logistics (ID: sesuai database)

## Keuntungan Menggunakan Role

1. **Fleksibilitas:** User dapat dipindah department tanpa kehilangan permission logistics
2. **Scalability:** Mudah menambah role baru seperti `warehouse_manager`, `inventory_admin`, dll
3. **Security:** Permission lebih granular dan dapat dikontrol per role
4. **Maintainability:** Lebih mudah maintain karena tidak tergantung nama department

## Items yang Ditampilkan

### Untuk User Logistics:
- Melihat semua items dari semua department
- Dapat filter berdasarkan department tertentu
- Dapat create/edit/delete items, suppliers, categories, departments

### Untuk User Non-Logistics:
- Hanya melihat items yang ada stock di department mereka (dari table `item_department_stocks`)
- Tidak ada filter department (otomatis filtered)
- Hanya dapat view dan create requisition

## Database Schema

### Table: item_department_stocks
Digunakan untuk tracking stock per department:
- `item_id` - Foreign key ke items table
- `department_id` - Foreign key ke departments table  
- `current_stock` - Stock saat ini
- `minimum_stock` - Stock minimum
- `maximum_stock` - Stock maximum
- `reserved_stock` - Stock yang direserve
- `available_stock` - Stock yang tersedia

Setiap item harus memiliki record di table ini untuk setiap department yang boleh menggunakan item tersebut.

## Migration dan Seeder

### ItemDepartmentStockSeeder
- Membuat records stock untuk semua kombinasi item-department
- Logistics department mendapat initial stock
- Department lain dimulai dengan stock 0

## Testing

1. Login sebagai user dengan role logistics - bisa melihat semua items dan ada filter department
2. Login sebagai user department biasa - hanya melihat items dari department mereka
3. Coba access create/edit forms - hanya logistics yang bisa akses supplier/category/department forms

## Next Steps

1. Update remaining inventory pages (purchases, item categories, departments)
2. Implement proper permission middleware di routes
3. Add unit tests untuk role-based access
4. Consider adding more granular permissions jika diperlukan
