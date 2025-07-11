# Role & Permission untuk Cash Management Workflow

## 🔐 Perubahan Role & Permission

Dengan adanya pemisahan **Cash Management** dari **Accounting**, sistem role dan permission telah disesuaikan untuk mendukung **segregation of duties** yang lebih baik.

---

## 👥 Role Baru & Updated

### 1. **KASIR** 
*Daily Cash Operations*
```
Fokus: Input transaksi kas harian
Akses: Cash management (create/edit), laporan arus kas
Tidak Bisa: Posting jurnal, edit master data akuntansi
```

### 2. **BENDAHARA** 
*Treasury & Bank Management*
```
Fokus: Manajemen kas dan bank operasional
Akses: Full cash management, rekonsiliasi bank
Tidak Bisa: Posting jurnal, laporan keuangan formal
```

### 3. **AKUNTAN** 
*Accounting & Bookkeeping*
```
Fokus: Jurnal dan pembukuan formal
Akses: Posting jurnal, buku besar, laporan keuangan
Dapat Lihat: Cash transactions (read-only untuk referensi)
```

### 4. **SUPERVISOR KEUANGAN** 
*Financial Control & Approval*
```
Fokus: Pengawasan dan approval
Akses: Semua cash + accounting, approval workflows
Khusus: Approve transaksi besar, monthly closing
```

### 5. **MANAGER KEUANGAN** 
*Strategic Financial Management*
```
Fokus: Strategic oversight dan decision making
Akses: Full access ke semua laporan dan analytics
Khusus: Variance analysis, executive dashboards
```

---

## 🔑 Permission Matrix

### **Cash Management Permissions:**
| Permission | Kasir | Bendahara | Akuntan | Supervisor | Manager |
|------------|-------|-----------|---------|------------|---------|
| `kas.cash-management.view` | ✅ | ✅ | ✅* | ✅ | ✅ |
| `kas.cash-management.daily-entry` | ✅ | ✅ | ❌ | ✅ | ✅ |
| `kas.cash-management.monitoring` | ✅ | ✅ | ❌ | ✅ | ✅ |
| `kas.cash-management.reconcile` | ❌ | ✅ | ❌ | ✅ | ✅ |

*\* Read-only untuk referensi*

### **Accounting Permissions:**
| Permission | Kasir | Bendahara | Akuntan | Supervisor | Manager |
|------------|-------|-----------|---------|------------|---------|
| `akuntansi.journal-posting.view` | ❌ | ❌ | ✅ | ✅ | ✅ |
| `akuntansi.journal-posting.post` | ❌ | ❌ | ✅ | ✅ | ✅ |
| `akuntansi.journal-posting.mapping` | ❌ | ❌ | ✅ | ✅ | ✅ |
| `akuntansi.journal-posting.batch` | ❌ | ❌ | ✅ | ✅ | ✅ |

### **Reports Permissions:**
| Permission | Kasir | Bendahara | Akuntan | Supervisor | Manager |
|------------|-------|-----------|---------|------------|---------|
| `laporan.cash-flow.view` | ✅ | ✅ | ❌ | ✅ | ✅ |
| `laporan.financial-statements.view` | ❌ | ❌ | ✅ | ✅ | ✅ |
| `laporan.variance-analysis.view` | ❌ | ❌ | ✅ | ✅ | ✅ |

### **Approval Permissions:**
| Permission | Kasir | Bendahara | Akuntan | Supervisor | Manager |
|------------|-------|-----------|---------|------------|---------|
| `approval.cash-transactions.approve` | ❌ | ❌ | ❌ | ✅ | ✅ |
| `approval.journal-posting.approve` | ❌ | ❌ | ❌ | ✅ | ✅ |
| `approval.monthly-closing.approve` | ❌ | ❌ | ❌ | ✅ | ✅ |

---

## 🏢 Contoh Implementasi Organisasi

### **Small Company:**
```
CEO/Owner → Manager Keuangan (full access)
├── Bendahara (cash management)
└── Akuntan (bookkeeping)
```

### **Medium Company:**
```
Finance Director → Manager Keuangan
├── Supervisor Keuangan (control & approval)
│   ├── Bendahara (treasury)
│   ├── Kasir (daily ops)
│   └── Akuntan (accounting)
```

### **Large Company:**
```
CFO → Manager Keuangan
├── Treasury Manager → Supervisor Keuangan
│   ├── Senior Bendahara
│   ├── Kasir Cabang A
│   └── Kasir Cabang B
└── Accounting Manager → Supervisor Keuangan
    ├── Senior Akuntan
    ├── Junior Akuntan
    └── Tax Specialist
```

---

## 🔄 Workflow dengan Role Baru

### **Daily Workflow:**
```
08:00 - Kasir: Input kas masuk dari penjualan
09:00 - Bendahara: Input transfer bank masuk
10:00 - Kasir: Input pengeluaran kas kecil
11:00 - Bendahara: Monitoring saldo bank real-time
12:00 - Supervisor: Review transaksi besar (approval)
```

### **Weekly Workflow:**
```
Senin - Akuntan: Review transaksi draft minggu lalu
Selasa - Akuntan: Mapping dan posting ke jurnal
Rabu - Akuntan: Generate trial balance
Kamis - Supervisor: Approve posting jurnal
Jumat - Manager: Review variance cash vs accounting
```

### **Monthly Workflow:**
```
Minggu 4 - Bendahara: Rekonsiliasi bank
Minggu 4 - Akuntan: Posting semua transaksi draft
Minggu 4 - Supervisor: Review dan approve closing
Minggu 4 - Manager: Generate laporan keuangan bulanan
```

---

## ⚙️ Setup & Migration

### **1. Run Permission Seeder:**
```bash
php artisan db:seed --class=CashManagementWorkflowPermissionSeeder
```

### **2. Assign Users to New Roles:**
```php
// Example: Assign user to new roles
$user = User::find(1);
$user->assignRole('bendahara');

$user2 = User::find(2);
$user2->assignRole('akuntan');
```

### **3. Verify Permissions:**
```php
// Check if user can post to journal
if ($user->can('akuntansi.journal-posting.post')) {
    // Show posting interface
}

// Check if user can only do cash management
if ($user->can('kas.cash-management.daily-entry') && 
    !$user->can('akuntansi.journal-posting.post')) {
    // Show simplified cash interface
}
```

---

## 🚦 Security Benefits

### **✅ Segregation of Duties:**
- **Kasir** tidak bisa posting jurnal
- **Akuntan** tidak bisa input kas langsung
- **Approval** terpisah dari operasional

### **✅ Audit Trail:**
- Setiap role memiliki jejak aktivitas yang jelas
- Pemisahan tanggungjawab yang dapat diaudit
- Kontrol akses yang granular

### **✅ Operational Security:**
- Tidak ada single point of failure
- Multiple level approval untuk transaksi besar
- Read-only access untuk cross-reference

---

## 📊 Monitoring & Analytics

### **Per Role Analytics:**
```sql
-- Activity by role
SELECT r.display_name, COUNT(*) as transaction_count
FROM users u
JOIN user_roles ur ON u.id = ur.user_id  
JOIN roles r ON ur.role_id = r.id
JOIN bank_transactions bt ON u.id = bt.user_id
GROUP BY r.display_name;
```

### **Permission Usage:**
```sql
-- Most used permissions
SELECT permission_name, COUNT(*) as usage_count
FROM audit_logs 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
GROUP BY permission_name
ORDER BY usage_count DESC;
```

---

## 🔄 Next Steps

1. **Test semua role** dengan user berbeda
2. **Training team** sesuai role masing-masing  
3. **Monitor usage** permission baru
4. **Adjust** jika ada permission yang kurang/berlebih
5. **Document** SOP per role untuk operational guidelines

Role dan permission baru ini memberikan **kontrol yang lebih baik** dan **operasional yang lebih efisien** sesuai dengan pemisahan Cash Management vs Accounting!
