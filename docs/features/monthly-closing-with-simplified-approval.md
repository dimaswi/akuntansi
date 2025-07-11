# Monthly Closing Workflow with Simplified Approval System

## Overview
Monthly closing workflow yang telah diperbarui dengan sistem approval yang disederhanakan. Sistem ini sekarang hanya memerlukan approval untuk **transaksi keluar** pada modul kas dan bank.

## 🔄 Updated Workflow

### 1. Daily Operations (Unchanged)
```
Kasir/Bendahara → Input transaksi → Auto-check approval requirement
```

**For Outgoing Transactions (> 1M):**
- Auto-request approval
- Status: `pending_approval` 
- Blocked from monthly closing until approved

**For Incoming Transactions:**
- No approval required
- Status: `draft`
- Ready for normal processing

### 2. Approval Process (Simplified)
```
Supervisor/Manager → Review pending approvals → Simple approve/reject
```

**Approval Scope:**
- ✅ Kas keluar > Rp 1.000.000
- ✅ Bank keluar > Rp 1.000.000  
- ✅ Giro keluar > Rp 1.000.000
- ❌ All incoming transactions (no approval needed)

### 3. Monthly Closing (Enhanced)
```
Monthly Closing → Check pending approvals → Validate outgoing transactions only
```

**Blocking Conditions:**
- Outgoing transactions with `status = 'pending_approval'`
- Outgoing transactions with `status = 'draft'` AND `will_post_to_journal = true`

**Non-blocking:**
- All incoming transactions (regardless of status)
- Outgoing transactions with `will_post_to_journal = false`
- Approved outgoing transactions

## 🎯 Approval Logic

### Transaction Types Requiring Approval

#### Cash Transactions
```php
['pengeluaran', 'uang_muka_pengeluaran', 'transfer_keluar']
```

#### Bank Transactions  
```php
['pengeluaran', 'transfer_keluar']
```

#### Giro Transactions
```php
['keluar']
```

### Approval Threshold
- **Fixed threshold**: Rp 1.000.000
- **Single level approval**
- **No complex rules or escalation**

## 📊 Monthly Closing Integration

### Validation Checks
MonthlyClosingController now performs enhanced validation:

```php
// Check outgoing transactions pending approval
$pendingApprovals = [];

// Cash outgoing pending approval
$pendingApprovals['cash'] = CashTransaction::whereBetween('tanggal_transaksi', [$startDate, $endDate])
    ->where('status', 'pending_approval')
    ->where(function($query) {
        $query->where('jenis_transaksi', 'pengeluaran')
              ->orWhere('jenis_transaksi', 'uang_muka_pengeluaran')
              ->orWhere('jenis_transaksi', 'transfer_keluar');
    })
    ->count();

// Similar for bank and giro...
```

### Cut-off Rules (Updated)

| Transaction Type | Direction | Status | will_post_to_journal | Blocks Closing? |
|-----------------|-----------|--------|---------------------|-----------------|
| Cash | Incoming | Any | Any | ❌ **NO** |
| Cash | Outgoing | pending_approval | Any | ✅ **YES** |
| Cash | Outgoing | draft | true | ✅ **YES** |
| Cash | Outgoing | draft | false | ❌ **NO** |
| Cash | Outgoing | approved/posted | Any | ❌ **NO** |
| Bank | Incoming | Any | Any | ❌ **NO** |
| Bank | Outgoing | pending_approval | Any | ✅ **YES** |
| Bank | Outgoing | draft | true | ✅ **YES** |
| Bank | Outgoing | draft | false | ❌ **NO** |
| Bank | Outgoing | approved/posted | Any | ❌ **NO** |
| Giro | Incoming | Any | Any | ❌ **NO** |
| Giro | Outgoing | pending_approval | Any | ✅ **YES** |
| Giro | Outgoing | draft | true | ✅ **YES** |
| Giro | Outgoing | draft | false | ❌ **NO** |
| Giro | Outgoing | approved/posted | Any | ❌ **NO** |

## 🔧 Technical Implementation

### Model Updates
Each transaction model now implements `isOutgoingTransaction()`:

```php
// CashTransaction.php
public function isOutgoingTransaction(): bool
{
    return in_array($this->jenis_transaksi, [
        'pengeluaran',
        'uang_muka_pengeluaran', 
        'transfer_keluar'
    ]);
}

// BankTransaction.php  
public function isOutgoingTransaction(): bool
{
    return in_array($this->jenis_transaksi, [
        'pengeluaran',
        'transfer_keluar'
    ]);
}

// GiroTransaction.php
public function isOutgoingTransaction(): bool
{
    return $this->jenis_giro === 'keluar';
}
```

### Approval Trait Updates
```php
public function requiresApproval(string $approvalType = 'transaction'): bool
{
    // SIMPLIFIED: Only outgoing transactions
    if (!$this->isOutgoingTransaction()) {
        return false;
    }

    $entityType = $this->getApprovalEntityType();
    $amount = $this->getApprovalAmount();
    
    $rule = ApprovalRule::findApplicableRule($entityType, $approvalType, $amount);
    
    return $rule && $rule->requiresApproval($amount);
}
```

### Permission Simplified
Old permissions removed:
- ❌ `approval.cash-transactions.approve`
- ❌ `approval.journal-posting.approve`
- ❌ `approval.monthly-closing.approve`

New unified permission:
- ✅ `approval.outgoing-transactions.approve`

## 🎨 Frontend Impact

### Approval Display
- Approval cards only show for outgoing transactions
- Simplified approval workflow
- Clear indication of blocking vs non-blocking transactions

### Monthly Closing UI
Enhanced display showing:
- **Safe transactions**: Incoming + non-journal outgoing
- **Blocking transactions**: Pending approvals + journal-bound drafts
- **Clear categorization** for better decision making

## 📈 Business Benefits

### Simplified Workflow
1. **Clear scope**: Only outgoing transactions need approval
2. **Reduced complexity**: Single threshold, single level
3. **Better performance**: Fewer approval checks
4. **Clearer monthly closing**: Only relevant transactions block

### Improved User Experience
1. **Less confusion**: Clear rules for when approval is needed
2. **Faster processing**: Incoming transactions flow freely
3. **Better visibility**: Monthly closing shows exactly what's blocking

### Enhanced Control
1. **Focused approval**: Only on transactions that matter (outgoing)
2. **Flexible reporting**: Separate reporting transactions from journal transactions
3. **Consistent rules**: Same logic across cash, bank, and giro

## 🧪 Testing Results

### Outgoing Transaction Test
```
Transaction: TK-KELUAR-TEST-001
Type: pengeluaran  
Amount: Rp 10.000.000
Is outgoing: YES
Requires approval: YES ✅
```

### Incoming Transaction Test  
```
Transaction: TK-MASUK-TEST-001
Type: penerimaan
Amount: Rp 10.000.000  
Is outgoing: NO
Requires approval: NO ✅
```

## 🔄 Migration Impact

### Existing Approvals
- Complex approval rules replaced with simple outgoing-only rules
- Existing pending approvals remain valid
- Old permissions deprecated but still functional during transition

### Database Changes
- Approval rules simplified to 3 basic rules
- Permission structure updated
- No breaking changes to existing data

### User Training Required
- Users need to understand new simplified approval scope
- Monthly closing workflow updated
- Approval interface simplified

---
**Updated**: July 11, 2025  
**Author**: Development Team  
**Status**: ✅ Implemented & Tested
