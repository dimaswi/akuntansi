# API Changes - Simplified Approval System

## Overview
Dokumentasi perubahan API untuk sistem approval yang disederhanakan. Fokus hanya pada transaksi keluar dengan logic yang lebih sederhana.

## 🔄 API Endpoints Updated

### Approval Routes
**Before:**
```php
// Multiple permission checks
Route::get('approvals', [ApprovalController::class, 'index'])
    ->middleware(['permission:approval.cash-transactions.approve,approval.journal-posting.approve,approval.monthly-closing.approve']);
```

**After:**
```php
// Single unified permission
Route::get('approvals', [ApprovalController::class, 'index'])
    ->middleware(['permission:approval.outgoing-transactions.approve']);
```

### Transaction Creation APIs
Enhanced validation for auto-approval request:

```php
// POST /kas/cash-transactions
// POST /kas/bank-transactions  
// POST /kas/giro-transactions

// New logic: Auto-check if outgoing + amount > threshold
if ($transaction->isOutgoingTransaction() && $transaction->requiresApproval()) {
    $approval = $transaction->requestApproval(Auth::user(), 'transaction', $notes);
    $transaction->update(['status' => 'pending_approval']);
}
```

## 📊 API Response Changes

### Approval List Response
```json
{
  "data": [
    {
      "id": 1,
      "approval_type": "transaction",
      "status": "pending",
      "amount": 10000000,
      "approvable": {
        "type": "App\\Models\\Kas\\CashTransaction",
        "id": 123,
        "jenis_transaksi": "pengeluaran",
        "is_outgoing": true
      }
    }
  ],
  "summary": {
    "pending_count": 5,
    "expired_count": 0,
    "my_approvals_today": 3
  }
}
```

### Monthly Closing Validation Response
Enhanced response with outgoing transaction breakdown:

```json
{
  "can_close": false,
  "blocking_issues": {
    "outgoing_pending_approval": {
      "cash": 2,
      "bank": 1, 
      "giro": 0,
      "total": 3
    },
    "outgoing_draft_for_journal": {
      "cash": 1,
      "bank": 2,
      "giro": 1,
      "total": 4
    }
  },
  "safe_transactions": {
    "incoming_all_types": {
      "cash": 15,
      "bank": 8,
      "giro": 2,
      "total": 25
    },
    "outgoing_reporting_only": {
      "cash": 5,
      "bank": 3,
      "giro": 1,
      "total": 9
    }
  },
  "validation_details": {
    "message": "Monthly closing blocked by 7 outgoing transactions requiring attention",
    "instructions": "Please approve pending transactions or complete journal posting for draft transactions"
  }
}
```

## 🔧 Model API Changes

### New Methods Added

#### All Transaction Models
```php
/**
 * Check if transaction is outgoing (keluar)
 * @return bool
 */
public function isOutgoingTransaction(): bool;
```

#### Enhanced Approvable Trait
```php
/**
 * Simplified approval requirement check
 * Only outgoing transactions with amount > threshold
 */
public function requiresApproval(string $approvalType = 'transaction'): bool;
```

### Updated Scopes
```php
// CashTransaction
$cashOutgoing = CashTransaction::outgoing()->get(); // pengeluaran, uang_muka_pengeluaran, transfer_keluar
$cashIncoming = CashTransaction::incoming()->get(); // penerimaan, uang_muka_penerimaan, transfer_masuk

// BankTransaction  
$bankOutgoing = BankTransaction::outgoing()->get(); // pengeluaran, transfer_keluar
$bankIncoming = BankTransaction::incoming()->get(); // penerimaan, transfer_masuk

// GiroTransaction
$giroOutgoing = GiroTransaction::where('jenis_giro', 'keluar')->get();
$giroIncoming = GiroTransaction::where('jenis_giro', 'masuk')->get();
```

## 📈 Database API Changes

### Approval Rules Query
**Before:** Complex rules with multiple conditions
```sql
SELECT * FROM approval_rules 
WHERE entity_type = 'cash_transaction' 
AND approval_type = 'transaction'
AND min_amount <= 10000000 
AND (max_amount IS NULL OR max_amount >= 10000000)
AND JSON_EXTRACT(conditions, '$.requires_supervisor') = true
AND JSON_EXTRACT(conditions, '$.max_daily_total') >= 50000000;
```

**After:** Simple unified rules
```sql
SELECT * FROM approval_rules 
WHERE entity_type = 'cash_transaction' 
AND approval_type = 'transaction'
AND min_amount <= 10000000
AND JSON_EXTRACT(conditions, '$.only_outgoing') = true;
```

### Monthly Closing Queries
Enhanced queries with outgoing transaction filtering:

```sql
-- Outgoing transactions pending approval
SELECT COUNT(*) FROM cash_transactions 
WHERE tanggal_transaksi BETWEEN ? AND ?
AND jenis_transaksi IN ('pengeluaran', 'uang_muka_pengeluaran', 'transfer_keluar')
AND status = 'pending_approval';

-- Outgoing draft transactions for journal
SELECT COUNT(*) FROM cash_transactions 
WHERE tanggal_transaksi BETWEEN ? AND ?
AND jenis_transaksi IN ('pengeluaran', 'uang_muka_pengeluaran', 'transfer_keluar')
AND status = 'draft'
AND will_post_to_journal = true;

-- Safe incoming transactions (never block)
SELECT COUNT(*) FROM cash_transactions 
WHERE tanggal_transaksi BETWEEN ? AND ?
AND jenis_transaksi IN ('penerimaan', 'uang_muka_penerimaan', 'transfer_masuk');
```

## 🎯 Permission API Changes

### Permission Check API
**Before:**
```php
// Multiple permission checks required
$user->can('approval.cash-transactions.approve') ||
$user->can('approval.journal-posting.approve') ||  
$user->can('approval.monthly-closing.approve')
```

**After:**
```php
// Single unified permission
$user->can('approval.outgoing-transactions.approve')
```

### Debug API Response
```json
{
  "user_permissions": {
    "approval_permissions_check": {
      "approval.outgoing-transactions.approve": true
    },
    "has_any_approval": true
  }
}
```

## 🧪 API Testing

### Test Endpoints

#### Create Outgoing Transaction
```bash
POST /kas/cash-transactions
{
  "jenis_transaksi": "pengeluaran",
  "jumlah": 10000000,
  "keterangan": "Test outgoing transaction"
}

Response:
{
  "success": true,
  "message": "Transaksi kas berhasil dibuat dan menunggu approval",
  "transaction": {
    "id": 123,
    "status": "pending_approval",
    "requires_approval": true,
    "is_outgoing": true
  }
}
```

#### Create Incoming Transaction
```bash
POST /kas/cash-transactions
{
  "jenis_transaksi": "penerimaan", 
  "jumlah": 10000000,
  "keterangan": "Test incoming transaction"
}

Response:
{
  "success": true,
  "message": "Transaksi kas berhasil dibuat",
  "transaction": {
    "id": 124,
    "status": "draft",
    "requires_approval": false,
    "is_outgoing": false
  }
}
```

#### Monthly Closing Validation
```bash
GET /kas/monthly-closing/validate?year=2025&month=7

Response:
{
  "can_close": false,
  "blocking_count": 3,
  "safe_count": 25,
  "breakdown": {
    "outgoing_pending_approval": 2,
    "outgoing_draft_for_journal": 1,
    "incoming_all_status": 20,
    "outgoing_reporting_only": 5
  }
}
```

## 🔄 Migration Notes

### Backward Compatibility
- Old permission names still work during transition
- Existing approval data remains valid
- API responses enhanced but not breaking

### Database Migration
```bash
# Update approval rules
php artisan db:seed --class=ApprovalRuleSeeder

# Update permissions  
php artisan db:seed --class=CashManagementWorkflowPermissionSeeder

# Clear caches
php artisan cache:clear
php artisan route:clear
```

---
**Created**: July 11, 2025  
**Author**: Development Team  
**Status**: ✅ Documented & Ready
