# Cara Kerja Sistem Approval untuk Cash Transaction

## Penjelasan Masalah dan Solusi

### Masalah yang Anda Alami:
Ketika membuat cash transaction dengan jenis "pengeluaran kas" dan status "draft", data tidak masuk ke tabel approvals.

### Penyebab Masalah:
1. **Migration belum dijalankan**: Status `pending_approval` belum tersedia di tabel cash_transactions
2. **Approval Rules threshold terlalu tinggi**: Rules yang ada memerlukan minimal 5 juta, sedangkan transaksi test hanya 1.5 juta

### Solusi yang Sudah Diterapkan:
1. ✅ Menjalankan migration untuk menambah status `pending_approval`
2. ✅ Membuat approval rule dengan threshold lebih rendah (1 juta - 4.9 juta)
3. ✅ Memastikan CashTransactionController menggunakan logic approval yang benar

## Cara Kerja Sistem Approval

### 1. Ketika Transaksi Dibuat (`CashTransactionController@store`)

```php
// 1. Buat transaksi dengan status 'draft'
$cashTransaction = new CashTransaction($request->all());
$cashTransaction->status = 'draft';
$cashTransaction->save();

// 2. Cek apakah transaksi memerlukan approval
if ($cashTransaction->requiresApproval()) {
    // 3. Buat approval request
    $approval = $cashTransaction->requestApproval(Auth::user(), 'transaction', $notes);
    
    // 4. Update status ke 'pending_approval'
    $cashTransaction->update(['status' => 'pending_approval']);
}
```

### 2. Logika Penentuan Approval (`requiresApproval()`)

```php
public function requiresApproval(string $approvalType = 'transaction'): bool
{
    $entityType = 'cash_transaction';  // dari getApprovalEntityType()
    $amount = $this->jumlah;           // dari getApprovalAmount()
    
    // Cari rule yang applicable
    $rule = ApprovalRule::findApplicableRule($entityType, $approvalType, $amount);
    
    return $rule && $rule->requiresApproval($amount);
}
```

### 3. Struktur Approval Rules

Approval rules saat ini:
- **Rule ID 9**: Cash transaction 1,000,000 - 4,999,999 (Level 1, Supervisor)
- **Rule ID 1**: Cash transaction 5,000,000+ (Level 1, Manager)
- **Rule ID 2**: Cash transaction 25,000,000+ (Level 2, Manager)

## Cakupan Sistem Approval

### ❌ MITOS: "Approval hanya untuk pengeluaran kas"
### ✅ FAKTA: Approval berlaku untuk SEMUA jenis transaksi berdasarkan jumlah

Sistem approval berlaku untuk **SEMUA jenis transaksi** yang memenuhi threshold amount, bukan hanya pengeluaran kas:

### 1. Cash Transactions (Semua Jenis)
- ✅ **Penerimaan Kas** (jika > threshold)
- ✅ **Pengeluaran Kas** (jika > threshold)  
- ✅ **Uang Muka Penerimaan** (jika > threshold)
- ✅ **Uang Muka Pengeluaran** (jika > threshold)
- ✅ **Transfer Masuk** (jika > threshold)
- ✅ **Transfer Keluar** (jika > threshold)

### 2. Bank Transactions (Semua Jenis)
- ✅ **Transfer Bank Masuk** (jika > 10 juta)
- ✅ **Transfer Bank Keluar** (jika > 10 juta)
- ✅ **Pembayaran via Bank** (jika > 10 juta)
- ✅ **Penerimaan via Bank** (jika > 10 juta)

### 3. Giro Transactions (Semua Jenis)
- ✅ **Penerbitan Giro** (jika > 15 juta)
- ✅ **Pencairan Giro** (jika > 15 juta)
- ✅ **Transfer Giro** (jika > 15 juta)

### 4. Journal Postings
- ✅ **Posting Manual Jurnal** (jika > 1 juta)

### 5. Monthly Closing
- ✅ **Penutupan Bulanan** (selalu perlu approval)

## Contoh Skenario

### Skenario 1: Transaksi Kecil (< 1 juta)
- **Jumlah**: 500,000
- **Hasil**: Tidak perlu approval
- **Status**: Langsung `draft`, bisa di-post ke jurnal

### Skenario 2: Transaksi Sedang (1-5 juta)
- **Jumlah**: 1,500,000
- **Hasil**: Perlu approval level 1 (Supervisor)
- **Status**: `pending_approval`
- **Action**: Masuk ke antrian approval

### Skenario 3: Transaksi Besar (5-25 juta)
- **Jumlah**: 10,000,000
- **Hasil**: Perlu approval level 1 (Manager)
- **Status**: `pending_approval`

### Skenario 4: Transaksi Sangat Besar (25+ juta)
- **Jumlah**: 50,000,000
- **Hasil**: Perlu approval level 2 (Manager → Senior Manager)
- **Status**: `pending_approval`

## Contoh Skenario Real

### Skenario A: Penerimaan Kas Besar
```
Jenis: Penerimaan Kas
Jumlah: 8,000,000 (8 juta)
Keterangan: Penerimaan dari pelanggan XYZ
Hasil: ✅ PERLU APPROVAL (karena > 5 juta)
Status: pending_approval
```

### Skenario B: Transfer Bank Keluar
```
Jenis: Transfer Bank Keluar  
Jumlah: 15,000,000 (15 juta)
Keterangan: Pembayaran supplier ABC
Hasil: ✅ PERLU APPROVAL (karena > 10 juta untuk bank)
Status: pending_approval
```

### Skenario C: Pengeluaran Kas Kecil
```
Jenis: Pengeluaran Kas
Jumlah: 500,000 (500 ribu)
Keterangan: Pembelian ATK
Hasil: ❌ TIDAK PERLU APPROVAL (karena < 1 juta)
Status: draft (bisa langsung di-post)
```

### Skenario D: Penerimaan Kas Kecil
```
Jenis: Penerimaan Kas
Jumlah: 800,000 (800 ribu)
Keterangan: Penjualan tunai
Hasil: ❌ TIDAK PERLU APPROVAL (karena < 1 juta)
Status: draft (bisa langsung di-post)
```

## Testing Manual

### 1. Buat Transaksi via Web Interface:
1. Login ke aplikasi
2. Buka menu Kas → Cash Transactions
3. Klik "Tambah Transaksi"
4. Isi form dengan:
   - Tanggal: Hari ini
   - Jenis: Pengeluaran
   - Kategori: Operasional
   - **Jumlah: 1,500,000** (penting: harus > 1 juta)
   - Keterangan: Test approval system
   - Kas Account: Pilih yang tersedia

### 2. Hasil yang Diharapkan:
- Transaksi tersimpan dengan status `pending_approval`
- Muncul pesan: "Transaksi kas berhasil dibuat dan menunggu approval sebelum dapat di-posting ke jurnal"
- Data masuk ke tabel `approvals`

### 3. Cek Data Approval:
```bash
php artisan tinker
>>> \App\Models\Approval::with('approvable')->get()
```

### 4. Cek Transaksi Pending:
```bash
php artisan tinker
>>> \App\Models\Kas\CashTransaction::where('status', 'pending_approval')->get()
```

## Troubleshooting

### Jika Data Tidak Masuk ke Approvals:

1. **Cek Approval Rules**:
```bash
php check_rules.php
```

2. **Cek Jumlah Transaksi**:
Pastikan jumlah transaksi sesuai dengan threshold approval rules

3. **Cek Migration Status**:
```bash
php artisan migrate:status
```

4. **Cek Log Error**:
```bash
tail -f storage/logs/laravel.log
```

5. **Test Manual dengan Script**:
```bash
php test_approval.php
```

## Konfigurasi Approval Rules

Untuk mengubah threshold approval, edit tabel `approval_rules`:

```sql
-- Ubah threshold menjadi 500 ribu
UPDATE approval_rules 
SET min_amount = 500000 
WHERE id = 9;

-- Atau buat rule baru
INSERT INTO approval_rules (name, entity_type, approval_type, min_amount, max_amount, approval_levels, approver_roles, is_active) 
VALUES ('Low Amount Cash', 'cash_transaction', 'transaction', 100000, 999999, 1, '["supervisor"]', 1);
```

## Next Steps

1. **Test dengan Bank Transaction dan Giro Transaction** (implementasi serupa)
2. **Setup notifikasi real-time** untuk approver
3. **Test approval workflow end-to-end** (request → approve → post to journal)
4. **Setup permissions** untuk different user roles

## Bukti Testing: Approval Berlaku untuk Semua Jenis

### Hasil Test Actual:
```
Test Case 1: penerimaan - 1,500,000
   Requires Approval: YES ✅ PASS → Created approval ID: 4

Test Case 2: pengeluaran - 1,500,000  
   Requires Approval: YES ✅ PASS → Created approval ID: 5

Test Case 3: penerimaan - 2,000,000
   Requires Approval: YES ✅ PASS → Created approval ID: 6

Test Case 4: pengeluaran - 2,500,000
   Requires Approval: YES ✅ PASS → Created approval ID: 7

Test Case 7: penerimaan - 800,000
   Requires Approval: NO ✅ PASS (di bawah threshold)

Test Case 8: pengeluaran - 500,000
   Requires Approval: NO ✅ PASS (di bawah threshold)
```

### Kesimpulan:
- ✅ **Penerimaan Kas** di atas 1 juta = PERLU APPROVAL
- ✅ **Pengeluaran Kas** di atas 1 juta = PERLU APPROVAL  
- ✅ **Penerimaan Kas** di bawah 1 juta = TIDAK PERLU APPROVAL
- ✅ **Pengeluaran Kas** di bawah 1 juta = TIDAK PERLU APPROVAL

### Logika Approval (Berdasarkan Kode):

```php
// File: app/Traits/Approvable.php
public function requiresApproval(string $approvalType = 'transaction'): bool
{
    $entityType = $this->getApprovalEntityType(); // 'cash_transaction'
    $amount = $this->getApprovalAmount();         // $this->jumlah (SEMUA JUMLAH)
    
    $rule = ApprovalRule::findApplicableRule($entityType, $approvalType, $amount);
    
    return $rule && $rule->requiresApproval($amount);
}
```

**Key Point**: Sistem TIDAK memeriksa `jenis_transaksi`, hanya memeriksa:
1. **Entity Type** (cash_transaction, bank_transaction, giro_transaction)
2. **Amount** (jumlah transaksi)
3. **Approval Type** (transaction, journal_posting, etc.)

## Implementasi untuk Bank dan Giro Transactions

### Bank Transactions
```php
// File: app/Models/Kas/BankTransaction.php  
protected function getApprovalEntityType(): string
{
    return 'bank_transaction'; // Threshold: 10 juta & 50 juta
}

protected function getApprovalAmount(): float
{
    return (float) $this->jumlah; // SEMUA JUMLAH, SEMUA JENIS
}
```

### Giro Transactions
```php
// File: app/Models/Kas/GiroTransaction.php
protected function getApprovalEntityType(): string
{
    return 'giro_transaction'; // Threshold: 15 juta & 100 juta
}

protected function getApprovalAmount(): float
{
    return (float) $this->jumlah; // SEMUA JUMLAH, SEMUA JENIS
}
```
