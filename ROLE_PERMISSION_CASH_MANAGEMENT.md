# Role dan Permission - Cash Management Workflow

## Prinsip Segregation of Duties

Pemisahan tugas (segregation of duties) dalam workflow Cash Management vs Accounting:

1. **Cash Management** = Operasional harian kas/bank (real-time)
2. **Accounting/Bookkeeping** = Pembukuan formal (periodic/batch)
3. **Approval & Control** = Pengawasan dan persetujuan (management)

## Role Hierarki

### 1. KASIR
**Target User:** Staff kasir operasional
**Fokus:** Input transaksi kas harian (cash only)

**Permissions:**
- `kas.cash-management.view` - Lihat dashboard cash management
- `kas.cash-management.daily-entry` - Input transaksi kas harian (draft)
- `kas.cash-management.monitoring` - Monitoring saldo kas real-time
- `laporan.cash-flow.view` - Lihat laporan arus kas
- `dashboard.view` - Akses dashboard utama

**Batasan:**
- ❌ Tidak bisa input transaksi bank
- ❌ Tidak bisa posting ke jurnal
- ❌ Tidak bisa delete transaksi
- ❌ Tidak bisa rekonsiliasi bank

---

### 2. BENDAHARA
**Target User:** Bendahara/treasury staff
**Fokus:** Cash & bank management (treasury operations)

**Permissions:**
- `kas.cash-management.view` - Lihat dashboard cash management
- `kas.cash-management.daily-entry` - Input transaksi kas & bank harian (draft)
- `kas.cash-management.monitoring` - Monitoring saldo kas/bank real-time
- `kas.cash-management.reconcile` - Rekonsiliasi bank
- `kas.bank-account.view` - Lihat rekening bank
- `kas.bank-account.create` - Buat rekening bank baru
- `kas.bank-account.edit` - Edit rekening bank
- `laporan.cash-flow.view` - Lihat laporan arus kas
- `dashboard.view` - Akses dashboard utama

**Batasan:**
- ❌ Tidak bisa posting ke jurnal
- ❌ Tidak bisa delete transaksi
- ❌ Tidak bisa delete rekening bank

---

### 3. AKUNTAN
**Target User:** Staff akuntansi/bookkeeper
**Fokus:** Journal posting & formal accounting

**Permissions:**
- `akuntansi.view` - Akses modul akuntansi
- `akuntansi.daftar-akun.view` - Lihat chart of accounts
- `akuntansi.daftar-akun.create` - Buat akun baru
- `akuntansi.daftar-akun.edit` - Edit akun
- `akuntansi.jurnal.view` - Lihat jurnal
- `akuntansi.jurnal.create` - Buat jurnal manual
- `akuntansi.jurnal.edit` - Edit jurnal
- `akuntansi.jurnal.post` - Post jurnal
- `akuntansi.journal-posting.view` - Lihat halaman batch posting
- `akuntansi.journal-posting.post` - Post transaksi kas ke jurnal
- `akuntansi.journal-posting.mapping` - Mapping akun untuk posting
- `akuntansi.journal-posting.batch` - Batch posting multiple transaksi
- `akuntansi.buku-besar.view` - Lihat buku besar
- `akuntansi.laporan.view` - Lihat laporan akuntansi
- `laporan.financial-statements.view` - Laporan keuangan formal
- `laporan.variance-analysis.view` - Analisis varians kas vs akuntansi
- `kas.cash-management.view` - Read-only akses cash management (untuk referensi)
- `dashboard.view` - Akses dashboard utama

**Batasan:**
- ❌ Tidak bisa input transaksi kas/bank baru
- ❌ Tidak bisa edit/delete transaksi kas/bank
- ❌ Read-only pada cash management

---

### 4. SUPERVISOR KEUANGAN
**Target User:** Supervisor/team lead keuangan
**Fokus:** Control, approval, dan monitoring

**Permissions:**
- **All cash management permissions** (view, daily-entry, monitoring, reconcile)
- **All accounting permissions** (view, journal-posting)
- **All reports** (cash-flow, financial-statements, variance-analysis)
- **Additional permissions:**
  - `kas.cash-transaction.delete` - Delete transaksi kas
  - `kas.bank-transaction.delete` - Delete transaksi bank
  - `kas.bank-account.delete` - Delete rekening bank
  - `approval.cash-transactions.approve` - Approve transaksi kas besar
  - `approval.journal-posting.approve` - Approve posting jurnal
- `dashboard.view` - Akses dashboard utama

**Role:** Control layer dengan full operational access + approval authority

---

### 5. MANAGER KEUANGAN
**Target User:** Manager keuangan
**Fokus:** Strategic oversight + full access

**Permissions:**
- **ALL financial-related permissions**
- **All cash management permissions**
- **All accounting permissions** 
- **All reports**
- **All approval permissions**
- `approval.monthly-closing.approve` - Approve penutupan bulanan

**Role:** Strategic level dengan akses penuh untuk decision making

---

### 6. ADMIN
**Target User:** System administrator
**Fokus:** System management

**Permissions:**
- **ALL permissions** (unchanged from original setup)

## Workflow Permission Flow

### 1. Daily Cash Operations
```
Kasir/Bendahara → Input transaksi (draft) → Monitoring saldo
↓
Status: "draft" (belum masuk jurnal)
```

**Required Permissions:**
- `kas.cash-management.daily-entry`
- `kas.cash-management.monitoring`

---

### 2. Periodic Journal Posting
```
Akuntan → Review draft transactions → Mapping accounts → Batch posting → Jurnal
↓
Status: "posted" (sudah masuk jurnal)
```

**Required Permissions:**
- `akuntansi.journal-posting.view`
- `akuntansi.journal-posting.mapping`
- `akuntansi.journal-posting.batch`
- `akuntansi.journal-posting.post`

---

### 3. Approval Flow (Optional)
```
Supervisor/Manager → Review high-value transactions → Approve
↓
Additional control for large amounts
```

**Required Permissions:**
- `approval.cash-transactions.approve`
- `approval.journal-posting.approve`

## Routes Permission Mapping

### Cash Management Routes
```php
// Dashboard
Route::get('kas') → 'kas.cash-management.view'

// Daily Operations
Route::get('kas/cash-transactions') → 'kas.cash-management.view'
Route::post('kas/cash-transactions') → 'kas.cash-management.daily-entry'
Route::get('kas/bank-transactions') → 'kas.cash-management.view'
Route::post('kas/bank-transactions') → 'kas.cash-management.daily-entry'

// Bank Management
Route::post('kas/bank-transactions/{id}/reconcile') → 'kas.cash-management.reconcile'
```

### Journal Posting Routes
```php
// Batch Posting
Route::get('kas/cash-transactions/post-to-journal') → 'akuntansi.journal-posting.view'
Route::post('kas/cash-transactions/post-to-journal') → 'akuntansi.journal-posting.post'
Route::get('kas/bank-transactions/post-to-journal') → 'akuntansi.journal-posting.view'
Route::post('kas/bank-transactions/post-to-journal') → 'akuntansi.journal-posting.post'
```

## Frontend Permission Checks

### Dashboard (kas/index.tsx)
```typescript
// Quick Actions
hasPermission('kas.cash-management.daily-entry') // Create buttons
hasPermission('kas.bank-account.create') // Bank account button

// Navigation
hasPermission('kas.cash-management.view') // Menu items
hasPermission('kas.bank-account.view') // Bank account menu
```

### Transaction Pages
```typescript
// Create/Edit Actions
hasPermission('kas.cash-management.daily-entry')

// Delete Actions  
hasPermission('kas.cash-transaction.delete')
hasPermission('kas.bank-transaction.delete')

// Posting Actions
hasPermission('akuntansi.journal-posting.view')
hasPermission('akuntansi.journal-posting.post')
```

## Database Schema

### Permissions Table
```sql
-- Cash Management
kas.cash-management.view
kas.cash-management.daily-entry
kas.cash-management.monitoring
kas.cash-management.reconcile

-- Journal Posting
akuntansi.journal-posting.view
akuntansi.journal-posting.post
akuntansi.journal-posting.mapping
akuntansi.journal-posting.batch

-- Reports
laporan.cash-flow.view
laporan.financial-statements.view
laporan.variance-analysis.view

-- Approval
approval.cash-transactions.approve
approval.journal-posting.approve
approval.monthly-closing.approve

-- Legacy (for backward compatibility)
kas.cash-transaction.delete
kas.bank-transaction.delete
kas.bank-account.*
```

### Roles Table
```sql
kasir
bendahara
akuntan
supervisor_keuangan
manager_keuangan
admin
```

## Testing Guidelines

### 1. Test Role Isolation
- Kasir tidak bisa akses posting jurnal
- Akuntan tidak bisa input transaksi baru
- Bendahara tidak bisa posting jurnal

### 2. Test Workflow Integrity
- Draft transactions tidak masuk jurnal
- Batch posting berfungsi dengan benar
- Permission dicheck di frontend dan backend

### 3. Test Edge Cases
- User dengan multiple roles
- Permission inheritance
- Route protection

## Migration Guide

### Existing Users
1. Assign role berdasarkan job function
2. Test akses sesuai role baru
3. Training untuk workflow baru

### Permission Updates
1. Run `CashManagementWorkflowPermissionSeeder`
2. Clear cache dengan `php artisan cache:clear`
3. Verify permission assignment

## Support & Troubleshooting

### Common Issues
1. **"Access denied"** → Check user role assignment
2. **"Page not found"** → Check route permission
3. **"Button not visible"** → Check frontend permission

### Debug Commands
```bash
# Check user permissions
php artisan tinker
>>> $user = User::find(1);
>>> $user->role->permissions->pluck('name');

# Reseed permissions
php artisan db:seed --class=CashManagementWorkflowPermissionSeeder

# Clear cache
php artisan cache:clear
php artisan config:clear
```

## Implementation Notes

### Cash Flow Reports Permission

Permission `laporan.cash-flow.view` telah diimplementasikan untuk mengakses laporan arus kas dengan workflow baru:

**Controller:** `CashFlowReportController`
- Permission check: `auth()->user()->can('laporan.cash-flow.view')`
- Route middleware: `permission:laporan.cash-flow.view`

**Route:** `/kas/reports/cash-flow`
- Method: GET
- Middleware: auth, verified, permission:laporan.cash-flow.view

**Role Access:**
- ✅ Kasir: Read-only access to cash flow reports
- ✅ Bendahara: Read-only access to cash flow reports  
- ✅ Supervisor Keuangan: Full access to all reports
- ✅ Manager Keuangan: Full access to all reports
- ❌ Akuntan: No direct access (focus on journal-based reports)

**Features Available:**
- Status filtering: draft, posted, all
- Type filtering: cash, bank, both
- Daily breakdown with transaction details
- Summary by status and account
- Export functionality (if implemented)

### Permission Structure

```php
// Report permissions in seeder
'laporan.cash-flow.view' => 'Laporan Arus Kas'
'laporan.financial-statements.view' => 'Laporan Keuangan'  
'laporan.variance-analysis.view' => 'Analisis Varians'
```

### Navigation Integration

**Menu Location:** Kas & Bank → Laporan Arus Kas
- Route: `/kas/reports/cash-flow`
- Icon: TrendingUp (Lucide)
- Permission: `laporan.cash-flow.view`

**Navigation File:** `resources/js/components/app-header.tsx`
```tsx
{
    title: 'Laporan Arus Kas',
    href: '/kas/reports/cash-flow',
    icon: TrendingUp,
    permission: 'laporan.cash-flow.view',
}
```

### Laravel Gate Integration

**File:** `app/Providers/AppServiceProvider.php`
- Automatically registers all database permissions as Laravel Gates
- Enables use of Laravel's `can()` method alongside custom `hasPermission()`
- Supports both `auth()->user()->can('permission')` and `auth()->user()->hasPermission('permission')`

### Fixed Issues

1. **✅ Permission Creation**
   - Added missing base permissions: `kas.view`, `kas.cash-transaction.view`, etc.
   - All permissions now exist in database

2. **✅ Role Assignment**
   - All roles (kasir, bendahara, supervisor_keuangan, manager_keuangan) have correct permissions
   - Kasir and Bendahara can access cash flow reports
   - All navigation permissions properly assigned

3. **✅ Laravel Gate Integration**
   - AppServiceProvider registers all permissions as Gates
   - Both `hasPermission()` and `can()` methods work correctly

4. **✅ Navigation Menu**
   - Added "Laporan Arus Kas" menu item in Kas & Bank section
   - Proper permission check and icon integration

5. **✅ Route Protection**
   - Route properly protected with `permission:laporan.cash-flow.view` middleware
   - Controller has additional permission check

### Components Cleanup

**Removed:** `resources/js/components/ui/tabs.tsx`
- Component was not used in the current implementation
- Manual tab navigation is used in cash-flow.tsx instead
- Removed to prevent unused dependencies

### Testing

**Command:** `php artisan test:permissions`
- Tests all permission existence
- Verifies role assignments
- Validates both permission methods work correctly

### Debug Commands

## Giro Transaction Workflow Update

### Database Changes

**Migration:** `2025_07_10_061030_modify_giro_transactions_for_cash_management.php`

**New Fields:**
- `status` ENUM('draft', 'posted') - Workflow status for journal posting
- `posting_batch_data` JSON - Batch posting metadata
- `posting_notes` TEXT - Notes from posting process
- `daftar_akun_lawan_id` - Made nullable for flexibility

**Updated Model:** `GiroTransaction.php`
- Added new fillable fields
- Added casting for JSON field
- New scopes: `draft()`, `posted()`, `readyForPosting()`

### Controller Updates

**GiroTransactionController.php:**
- Added `showPostToJournal()` method for batch posting view
- Added `postToJournal()` method for batch posting to journal
- Workflow: draft → manual batch posting → journal entry
- Permission checks for journal posting operations

**New Controller:** `GiroReportController.php`
- Giro position and analysis reports
- Status breakdown (draft vs posted)
- Giro status tracking (diterima, diserahkan_ke_bank, cair, tolak, batal)
- Outstanding and matured giro analysis
- Daily breakdown with transaction details

### Route Updates

**New Routes:**
```php
// Batch posting (before parameterized routes)
GET /kas/giro-transactions/post-to-journal
POST /kas/giro-transactions/post-to-journal

// Reports
GET /kas/reports/giro
```

### Permission Updates

**New Permissions:**
```php
'kas.giro-transaction.create' => 'Create Giro Transaction'
'kas.giro-transaction.edit' => 'Edit Giro Transaction'  
'kas.giro-transaction.delete' => 'Delete Giro Transaction'
'kas.giro-transaction.post' => 'Post Giro Transaction'
'kas.giro-transaction.clear' => 'Clear Giro Transaction'
'kas.giro-transaction.reject' => 'Reject Giro Transaction'
'laporan.giro-report.view' => 'Laporan Giro'
```

**Role Assignments:**
- **Bendahara:** Full giro management + reports
- **Supervisor Keuangan:** All giro permissions + reports
- **Manager Keuangan:** Complete access via inheritance

### Navigation Integration

**Menu:** Kas & Bank → Laporan Giro
- Route: `/kas/reports/giro`
- Icon: FileBarChart (Lucide)
- Permission: `laporan.giro-report.view`

### Workflow Comparison

| Transaction Type | Draft Status | Posting Method | Journal Creation |
|-----------------|-------------|---------------|------------------|
| **Cash** | ✅ Draft | Manual Batch | Manual |
| **Bank** | ✅ Draft | Manual Batch | Manual |
| **Giro** | ✅ Draft | Manual Batch | Manual |

All three transaction types now follow consistent workflow:
1. Input as draft (daily operations)
2. Review and mapping (accounting)
3. Manual batch posting to journal (periodic)
4. Separate reporting for operational vs accounting views
