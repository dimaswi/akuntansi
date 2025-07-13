# INVENTORY PERMISSION SYSTEM DOCUMENTATION

## Overview
Sistem permission inventory dirancang untuk memberikan kontrol akses yang granular terhadap semua fitur inventory management. Sistem ini mendukung baik inventory umum maupun inventory farmasi dengan permission khusus untuk obat-obatan terkontrol.

## Permission Groups

### 1. Inventory Management
Permissions untuk mengelola item inventory utama:

- **inventory.view**: Melihat daftar dan detail items
- **inventory.create**: Menambah item baru
- **inventory.edit**: Mengubah data item
- **inventory.delete**: Menghapus item
- **inventory.location.manage**: Mengelola lokasi penyimpanan item

### 2. Inventory Reporting
Permissions untuk laporan dan monitoring:

- **inventory.report.view**: Melihat laporan inventory
- **inventory.report.export**: Mengekspor laporan
- **inventory.stock.alert**: Melihat dan mengelola alert stok rendah

### 3. Department Management
Permissions untuk mengelola departemen:

- **department.view**: Melihat daftar departemen
- **department.create**: Menambah departemen baru
- **department.edit**: Mengubah data departemen
- **department.delete**: Menghapus departemen

### 4. Category Management
Permissions untuk mengelola kategori item:

- **item_category.view**: Melihat daftar kategori
- **item_category.create**: Menambah kategori baru
- **item_category.edit**: Mengubah data kategori
- **item_category.delete**: Menghapus kategori

### 5. Supplier Management
Permissions untuk mengelola supplier:

- **supplier.view**: Melihat daftar supplier
- **supplier.create**: Menambah supplier baru
- **supplier.edit**: Mengubah data supplier
- **supplier.delete**: Menghapus supplier

### 6. Pharmacy Management (Khusus Farmasi)
Permissions khusus untuk inventory farmasi:

- **pharmacy.controlled_substance.manage**: Mengelola obat terkontrol (narkotika/psikotropika)
- **pharmacy.prescription.manage**: Mengelola item yang memerlukan resep
- **pharmacy.bpom.manage**: Mengelola data registrasi BPOM

### 7. Inventory Transactions
Permissions untuk transaksi inventory:

- **inventory.transaction.view**: Melihat riwayat transaksi
- **inventory.transaction.create**: Membuat transaksi baru
- **inventory.transaction.approve**: Menyetujui transaksi
- **inventory.adjustment.create**: Membuat penyesuaian stok
- **inventory.adjustment.approve**: Menyetujui penyesuaian stok

### 8. Inventory Valuation
Permissions untuk valuasi inventory:

- **inventory.valuation.view**: Melihat valuasi inventory
- **inventory.cost.manage**: Mengelola harga cost item

## Predefined Roles

### 1. Inventory Manager
**Role**: `inventory_manager`
**Access**: Full access ke semua fitur inventory
**Permissions**: Semua permission inventory

### 2. Pharmacy Manager
**Role**: `pharmacy_manager`
**Access**: Khusus mengelola inventory farmasi
**Permissions**:
- Semua permission pharmacy.*
- inventory.view, create, edit, location.manage
- Viewing permissions untuk master data
- Transaction permissions (create, tidak approve)

### 3. Inventory Staff
**Role**: `inventory_staff`
**Access**: Operasional harian inventory
**Permissions**:
- inventory.view, create, edit, location.manage
- Viewing permissions untuk reports dan master data
- Transaction create (tidak approve)

### 4. Inventory Viewer
**Role**: `inventory_viewer`
**Access**: View-only access
**Permissions**:
- Semua *.view permissions
- Tidak ada create, edit, delete permissions

### 5. Department Head
**Role**: `department_head`
**Access**: Inventory untuk departemen tertentu
**Permissions**:
- inventory.view, create, edit
- department.view, edit (untuk departemennya)
- Viewing permissions untuk reports

## Implementation Examples

### Menggunakan Permission di Controller
```php
// Basic permission check
$this->middleware('permission:inventory.view');

// Advanced pharmacy permission check
$this->middleware('inventory.permission:inventory.edit,pharmacy');
```

### Menggunakan Permission di Blade/React
```php
// Dalam controller
$canEdit = auth()->user()->hasPermissionTo('inventory.edit');

// Dalam React component
{user.permissions.includes('inventory.create') && (
    <Button onClick={createItem}>Add Item</Button>
)}
```

### Mengecek Permission Dinamis
```php
// Cek permission untuk controlled substance
if ($item->is_controlled_substance) {
    $this->authorize('pharmacy.controlled_substance.manage');
}

// Cek permission untuk prescription items
if ($item->requires_prescription) {
    $this->authorize('pharmacy.prescription.manage');
}
```

## Routes dengan Permission

### Items Routes
```php
Route::prefix('items')->name('items.')->group(function () {
    Route::get('/', [ItemController::class, 'index'])
        ->middleware('permission:inventory.view');
    Route::get('/create', [ItemController::class, 'create'])
        ->middleware('permission:inventory.create');
    Route::post('/', [ItemController::class, 'store'])
        ->middleware('inventory.permission:inventory.create,pharmacy');
    // ... dll
});
```

### Department Routes
```php
Route::prefix('departments')->name('departments.')->group(function () {
    Route::get('/', [DepartmentController::class, 'index'])
        ->middleware('permission:department.view');
    // ... dll
});
```

## Setup Instructions

### 1. Run Setup Command
```bash
php artisan inventory:setup
```

### 2. Assign Roles to Users
```bash
php artisan tinker
```
```php
// Assign inventory manager role
User::find(1)->assignRole('inventory_manager');

// Assign pharmacy manager role
User::find(2)->assignRole('pharmacy_manager');

// Assign multiple roles
$user = User::find(3);
$user->assignRole(['inventory_staff', 'department_head']);
```

### 3. Manual Permission Assignment
```php
// Direct permission assignment
$user->givePermissionTo('inventory.view');

// Remove permission
$user->revokePermissionTo('inventory.delete');

// Check permission
if ($user->hasPermissionTo('pharmacy.controlled_substance.manage')) {
    // User can manage controlled substances
}
```

## Security Considerations

1. **Controlled Substances**: Memerlukan permission khusus dan audit trail
2. **Prescription Items**: Hanya user dengan sertifikasi yang sesuai
3. **Cost Management**: Restricted ke finance dan senior management
4. **Transaction Approval**: Segregation of duties antara creator dan approver

## Troubleshooting

### Common Issues

1. **Permission Denied Error**
   - Check if user has required role/permission
   - Verify permission spelling in middleware
   - Clear permission cache: `php artisan permission:cache-reset`

2. **Pharmacy Permissions Not Working**
   - Ensure user has pharmacy.* permissions
   - Check if item is marked as controlled substance
   - Verify BPOM registration permissions

3. **Role Assignment Issues**
   - Check if role exists: `Role::where('name', 'role_name')->exists()`
   - Verify role has correct permissions: `$role->permissions`

### Cache Management
```bash
# Clear permission cache
php artisan permission:cache-reset

# Clear application cache
php artisan cache:clear

# Clear config cache
php artisan config:clear
```

## Testing Permissions

### Unit Tests Example
```php
public function test_user_can_view_inventory_with_permission()
{
    $user = User::factory()->create();
    $user->givePermissionTo('inventory.view');
    
    $response = $this->actingAs($user)->get('/items');
    
    $response->assertOk();
}

public function test_user_cannot_manage_controlled_substances_without_permission()
{
    $user = User::factory()->create();
    $user->givePermissionTo('inventory.edit');
    
    $item = Item::factory()->controlledSubstance()->create();
    
    $response = $this->actingAs($user)->put("/items/{$item->id}", [
        'is_controlled_substance' => true
    ]);
    
    $response->assertForbidden();
}
```

## API Endpoints

Semua API endpoints inventory menggunakan permission yang sama:

- `GET /api/items` - Requires: `inventory.view`
- `POST /api/items` - Requires: `inventory.create`
- `PUT /api/items/{id}` - Requires: `inventory.edit`
- `DELETE /api/items/{id}` - Requires: `inventory.delete`

## Best Practices

1. **Minimal Privilege**: Berikan permission minimal yang dibutuhkan
2. **Role-Based**: Gunakan roles daripada direct permission assignment
3. **Regular Audit**: Review permission assignments secara berkala
4. **Documentation**: Update dokumentasi saat menambah permission baru
5. **Testing**: Test semua permission scenarios dalam automated tests
