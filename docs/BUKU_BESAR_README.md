# Modul Buku Besar - README

## Overview
Modul Buku Besar menyediakan fitur untuk melihat saldo dan mutasi akun berdasarkan transaksi jurnal yang telah diposting.

## Features
1. **Index Buku Besar** - Ringkasan semua akun dengan saldo awal, mutasi, dan saldo akhir
2. **Detail Buku Besar** - Detail transaksi per akun dengan saldo berjalan
3. **Filter berdasarkan:**
   - Periode tanggal
   - Akun spesifik
   - Jenis akun (Aset, Kewajiban, Ekuitas, Pendapatan, Beban)
4. **Export** functionality (Coming soon)

## Files Created

### Backend
- `app/Http/Controllers/Akuntansi/BukuBesarController.php` - Main controller
- Routes added to `routes/akuntansi.php`
- Permissions added to `database/seeders/RolePermissionSeeder.php`

### Frontend
- `resources/js/pages/akuntansi/buku-besar/index.tsx` - Index page
- `resources/js/pages/akuntansi/buku-besar/show.tsx` - Detail page
- Types added to `resources/js/types/index.d.ts`

### Routes
- `GET /akuntansi/buku-besar` - Index
- `GET /akuntansi/buku-besar/{akunId}` - Detail
- `GET /akuntansi/buku-besar/export` - Export (future)

### Permissions
- `akuntansi.buku-besar.view` - View buku besar
- `akuntansi.buku-besar.export` - Export buku besar

## Usage
1. Pastikan ada data jurnal yang sudah diposting
2. Akses menu "Buku Besar" dari halaman utama akuntansi
3. Gunakan filter untuk menyaring data sesuai kebutuhan
4. Klik "Lihat Detail" untuk melihat transaksi detail per akun

## Business Logic
- Saldo awal dihitung dari transaksi sebelum periode filter
- Akun normal debet (Aset, Beban): Saldo = Debet - Kredit
- Akun normal kredit (Kewajiban, Ekuitas, Pendapatan): Saldo = Kredit - Debet
- Saldo berjalan dihitung berdasarkan saldo awal + mutasi dalam periode

## Next Steps
1. Implementasi export ke Excel/PDF
2. Tambah fitur pencetakan
3. Grafik trend saldo akun
4. Integrasi dengan laporan keuangan
