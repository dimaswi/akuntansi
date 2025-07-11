# Simplified Approval System

## Overview
Sistem approval yang disederhanakan hanya untuk **transaksi keluar** pada modul kas dan bank. Sistem ini menghilangkan kompleksitas approval rules yang rumit dan fokus pada kebutuhan dasar approval untuk pengeluaran.

## 🎯 Scope Simplification

### Before (Complex)
- Multiple approval types (transaction, journal_posting, monthly_closing)
- Complex rules dengan amount thresholds
- Multi-level approvals
- Weekend auto-approve
- Complex conditions dan escalation

### After (Simple)
- **Hanya approval untuk transaksi keluar**
- **Single level approval**
- **Fixed threshold sederhana**
- **Hanya untuk kas keluar, bank keluar, giro keluar**

## 📋 New Approval Rules

### Simple Rule: Transaksi Keluar Only
```sql
-- Hanya transaksi dengan jenis:
kas: 'pengeluaran', 'uang_muka_pengeluaran', 'transfer_keluar'
bank: 'pengeluaran', 'transfer_keluar'  
giro: 'keluar'
```

### Threshold
- **Semua transaksi keluar > Rp 1.000.000** butuh approval
- **Single approval level** (supervisor_keuangan atau manager_keuangan)
- **No escalation** - simple approve/reject

## 🔧 Technical Changes

### 1. ApprovalRule Seeder Update
```php
// Hapus semua rules kompleks
// Hanya buat 3 rules sederhana:
// - cash_transaction_keluar
// - bank_transaction_keluar  
// - giro_transaction_keluar
```

### 2. Approvable Trait Update
```php
// Method baru: isOutgoingTransaction()
// Update requiresApproval() logic
// Sederhanakan requestApproval()
```

### 3. Controller Updates
```php
// CashTransactionController
// BankTransactionController
// GiroTransactionController
// - Hanya check jenis transaksi = keluar
// - Auto-request approval if > threshold
```

### 4. Frontend Updates
```tsx
// Show approval status hanya untuk transaksi keluar
// Sederhanakan approval card component
// Update notification system
```

## 🚀 Implementation Steps

### Step 1: Update ApprovalRule Seeder
- Hapus rules kompleks
- Buat 3 rules sederhana untuk transaksi keluar

### Step 2: Update Approvable Trait
- Add method `isOutgoingTransaction()`
- Simplify `requiresApproval()` logic
- Update approval request logic

### Step 3: Update Transaction Controllers
- Modify create/update methods
- Add outgoing transaction check
- Auto-request approval for qualifying transactions

### Step 4: Update Frontend
- Simplify approval display
- Update notification system
- Remove complex approval workflows

### Step 5: Documentation
- Update user guide
- Update API documentation
- Create migration guide

## 🎯 Business Benefits

### Simplified Workflow
```
Create Transaksi Keluar → Check Amount → Auto Request Approval (if > 1M) → Simple Approve/Reject
```

### Reduced Complexity
- **No multi-level approvals**
- **No weekend/holiday logic**
- **No complex conditions**
- **No escalation workflows**

### Clear Scope
- **Only outgoing transactions need approval**
- **Single threshold for all transaction types**
- **Consistent approval process**

## ⚠️ Breaking Changes

### Removed Features
- Multi-level approval workflows
- Complex approval rules dengan conditions
- Weekend auto-approve
- Escalation workflows
- Journal posting approvals
- Monthly closing approvals

### Migration Impact
- Existing complex approval rules akan dihapus
- Pending approvals dengan rules lama akan dibatalkan
- Users perlu retrain untuk workflow baru

## 🧪 Testing Plan

### Unit Tests
- Test `isOutgoingTransaction()` method
- Test approval requirement logic
- Test threshold calculations

### Integration Tests  
- Test full approval workflow
- Test notification system
- Test UI updates

### User Acceptance Tests
- Test with real transaction scenarios
- Verify simplified workflow
- Confirm approval notifications

---
**Created**: July 11, 2025  
**Author**: Development Team  
**Status**: 🚧 Implementation in Progress
