# Cash Management vs Accounting Workflow

## Konsep Pemisahan Sistem

Sistem akuntansi ini telah dimodifikasi untuk memisahkan **Cash Management** dari **Accounting Bookkeeping** untuk memberikan fleksibilitas operasional yang lebih baik.

## 🏦 Cash Management Module

### Fungsi Utama:
- **Tracking arus kas harian** (cash in/out)
- **Monitoring saldo bank real-time**
- **Rekonsiliasi bank**
- **Laporan arus kas operasional**
- **Manajemen kategori transaksi**

### Workflow:
1. **Input Transaksi Kas/Bank** → Status: `draft`
2. **Generate Laporan Arus Kas** → Dari data transaksi kas
3. **Monitoring Saldo** → Update real-time
4. **Rekonsiliasi Bank** → Matching dengan statement bank

### Fitur Baru:
- ✅ **Kategori Transaksi** (menggantikan akun lawan)
- ✅ **Simplified Jenis Transaksi** (penerimaan, pengeluaran, transfer)
- ✅ **Real-time Balance Tracking**
- ✅ **Cash Flow Reports**

---

## 📚 Accounting Module

### Fungsi Utama:
- **Jurnal umum** (double entry bookkeeping)
- **Buku besar** dan **trial balance**
- **Laporan keuangan formal** (Neraca, Laba Rugi)
- **Compliance** dan **audit trail**

### Workflow:
1. **Review Transaksi Kas** → Filter status `draft`
2. **Mapping ke Akun** → Tentukan akun lawan yang tepat
3. **Posting ke Jurnal** → Status: `posted` + auto generate jurnal
4. **Generate Financial Statements** → Dari data jurnal

---

## 🔄 Integration Workflow

### Step-by-Step Process:

#### 1. Daily Cash Operations
```
Kasir/Bendahara:
├── Input transaksi kas masuk/keluar
├── Pilih kategori transaksi (pendapatan_operasional, biaya_operasional, dll)
├── Monitoring saldo real-time
└── Generate laporan arus kas harian
```

#### 2. Periodic Accounting (Weekly/Monthly)
```
Akuntan:
├── Review transaksi kas status 'draft'
├── Batch posting ke jurnal:
│   ├── Pilih transaksi yang akan diposting
│   ├── Mapping ke akun yang tepat
│   └── Post ke jurnal (auto generate double entry)
├── Review jurnal dan trial balance
└── Generate laporan keuangan formal
```

#### 3. Reconciliation & Control
```
Manager/Controller:
├── Reconcile cash vs accounting
├── Review variance dan discrepancies
├── Approve monthly closing
└── Sign off laporan keuangan
```

---

## 💻 Technical Implementation

### Database Changes:
- ✅ **bank_transactions.kategori_transaksi** (new field)
- ✅ **bank_transactions.daftar_akun_lawan_id** (nullable)
- ✅ **Simplified enum jenis_transaksi**

### New Routes:
```php
GET  /kas/bank-transactions/post-to-journal     // Form posting batch
POST /kas/bank-transactions/process-journal-posting  // Process posting
```

### New Pages:
- ✅ **cash-management/bank-transactions/create.tsx** (simplified)
- ✅ **cash-management/bank-transactions/post-to-journal.tsx** (new)

---

## 🎯 Benefits

### ✅ Operational Benefits:
- **Faster daily cash operations** (no complex accounting required)
- **Real-time cash monitoring**
- **Simplified data entry** for non-accounting staff
- **Better segregation of duties**

### ✅ Accounting Benefits:
- **Flexible journal mapping**
- **Batch processing** for efficiency
- **Better control** over accounting entries
- **Audit trail** yang jelas

### ✅ Management Benefits:
- **Real-time cash visibility**
- **Formal accounting compliance**
- **Dual verification** (cash vs accounting)
- **Scalable workflow**

---

## 📊 Reports Available

### Cash Management Reports:
- **Daily Cash Flow** (dari transaksi kas)
- **Bank Balance Summary** (real-time)
- **Cash Category Analysis** (per kategori)
- **Bank Reconciliation** (bank vs system)

### Accounting Reports:
- **General Ledger** (dari jurnal)
- **Trial Balance** (dari jurnal)
- **Income Statement** (dari jurnal)
- **Balance Sheet** (dari jurnal)
- **Cash vs Accounting Variance** (comparison)

---

## 🔧 Migration Guide

### Existing Data:
1. **Backup existing bank_transactions**
2. **Run migration** untuk add kategori_transaksi
3. **Update existing records** dengan kategori default
4. **Test workflow** dengan data baru

### User Training:
1. **Kasir/Bendahara:** Focus pada cash management workflow
2. **Akuntan:** Focus pada posting dan jurnal workflow
3. **Manager:** Understanding both workflows dan reconciliation

---

## 🚀 Next Steps

### Phase 1: ✅ Core Implementation
- [x] Database migration
- [x] Basic CRUD for cash transactions
- [x] Posting to journal functionality
- [x] UI/UX for separated workflows

### Phase 2: 🔄 Enhancement
- [ ] Advanced cash flow analytics
- [ ] Automated account mapping rules
- [ ] Bank integration (auto import)
- [ ] Mobile app for field cash transactions

### Phase 3: 📈 Advanced Features
- [ ] AI-powered categorization
- [ ] Predictive cash flow
- [ ] Multi-currency support
- [ ] Advanced reconciliation algorithms

---

## 📞 Support

Untuk pertanyaan teknis atau training, silakan hubungi tim development atau baca dokumentasi lebih lanjut di folder `/docs`.
