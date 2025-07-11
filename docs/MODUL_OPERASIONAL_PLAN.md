# Perencanaan Modul Operasional

## Overview
Untuk melengkapi sistem akuntansi rumah sakit, kita perlu implementasi modul-modul operasional yang akan otomatis menghasilkan jurnal entries:

## Modul yang akan dibuat:

### 1. PENJUALAN (Sales/Revenue)
**Fungsi**: Mengelola transaksi pendapatan rumah sakit
- Penjualan layanan medis
- Penjualan obat/farmasi
- Penjualan layanan rawat inap/jalan
- Invoice dan pembayaran

**Jurnal Otomatis**:
```
Dr. Kas/Piutang Dagang    XXX
    Cr. Pendapatan Layanan       XXX
    Cr. PPN Keluaran (jika ada)  XXX
```

### 2. PEMBELIAN (Purchase)
**Fungsi**: Mengelola transaksi pembelian
- Pembelian obat-obatan
- Pembelian alat medis
- Pembelian supplies
- Purchase orders dan payment

**Jurnal Otomatis**:
```
Dr. Persediaan/Expense    XXX
Dr. PPN Masukan          XXX
    Cr. Kas/Hutang Dagang      XXX
```

### 3. KAS (Cash Management)
**Fungsi**: Mengelola transaksi kas harian
- Kas masuk/keluar
- Petty cash
- Cash receipts/payments
- Kas opname

**Jurnal Otomatis**:
```
Dr. Kas                  XXX
    Cr. Various Accounts       XXX
atau
Dr. Various Accounts     XXX
    Cr. Kas                    XXX
```

### 4. BANK (Bank Management)
**Fungsi**: Mengelola transaksi perbankan
- Transfer masuk/keluar
- Pembayaran via bank
- Reconciliation
- Bank statements

**Jurnal Otomatis**:
```
Dr. Bank/Rekening        XXX
    Cr. Various Accounts       XXX
atau
Dr. Various Accounts     XXX
    Cr. Bank/Rekening          XXX
```

## Database Schema

### Tables to Create:
1. **customers** - Data pasien/pelanggan
2. **sales** - Header penjualan
3. **sale_items** - Detail item penjualan
4. **suppliers** - Data supplier
5. **purchases** - Header pembelian
6. **purchase_items** - Detail item pembelian
7. **cash_transactions** - Transaksi kas
8. **bank_accounts** - Master rekening bank
9. **bank_transactions** - Transaksi bank

## Integration Points:
1. **Auto Journal Generation** - Setiap transaksi otomatis buat jurnal
2. **Chart of Accounts Integration** - Link ke akun yang tepat
3. **Financial Reports Integration** - Data masuk ke laporan keuangan
4. **User Permissions** - Role-based access control

## Implementation Order:
1. Database migrations
2. Models and relationships
3. Controllers and business logic
4. Frontend pages
5. Integration testing

Let's start implementation!
