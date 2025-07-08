# Laporan Keuangan Module

## Overview
Modul Laporan Keuangan menyediakan berbagai laporan keuangan standar yang diperlukan untuk analisis keuangan dan pelaporan akuntansi. Modul ini telah diintegrasikan dengan sistem akuntansi dan menggunakan data dari jurnal dan buku besar.

## Features
1. **Neraca (Balance Sheet)** - Laporan posisi keuangan
2. **Laba Rugi (Income Statement)** - Laporan pendapatan dan beban
3. **Arus Kas (Cash Flow)** - Laporan pergerakan kas
4. **Perubahan Ekuitas (Statement of Changes in Equity)** - Laporan perubahan modal

## Routes
- `/akuntansi/laporan` - Index laporan keuangan
- `/akuntansi/laporan/neraca` - Laporan Neraca
- `/akuntansi/laporan/laba-rugi` - Laporan Laba Rugi
- `/akuntansi/laporan/arus-kas` - Laporan Arus Kas
- `/akuntansi/laporan/perubahan-ekuitas` - Laporan Perubahan Ekuitas
- `/akuntansi/laporan/export` - Export laporan (Coming Soon)

## Permissions
- `akuntansi.laporan.view` - Melihat laporan keuangan
- `akuntansi.laporan.export` - Export laporan keuangan

## Backend Implementation

### Controller: LaporanKeuanganController
File: `app/Http/Controllers/Akuntansi/LaporanKeuanganController.php`

#### Methods:
1. **index()** - Dashboard laporan keuangan
2. **neraca(Request $request)** - Generate laporan neraca
3. **labaRugi(Request $request)** - Generate laporan laba rugi
4. **arusKas(Request $request)** - Generate laporan arus kas
5. **perubahanEkuitas(Request $request)** - Generate laporan perubahan ekuitas
6. **export(Request $request)** - Export functionality (stub)

#### Private Helper Methods:
- `hitungSaldoAkun($akunList, $tanggal)` - Hitung saldo akun per tanggal
- `hitungSaldoAkunPeriode($akunList, $periodeAwal, $periodeAkhir)` - Hitung saldo periode
- `hitungLabaRugiBerjalan($tanggal)` - Hitung laba rugi berjalan
- `hitungLabaRugiPeriode($periodeAwal, $periodeAkhir)` - Hitung laba rugi periode
- `getDetailEkuitas($akunEkuitas, $periodeAwal, $periodeAkhir)` - Detail perubahan ekuitas

## Frontend Implementation

### Pages:
1. **Index** - `resources/js/pages/akuntansi/laporan-keuangan/index.tsx`
2. **Neraca** - `resources/js/pages/akuntansi/laporan-keuangan/neraca.tsx`
3. **Laba Rugi** - `resources/js/pages/akuntansi/laporan-keuangan/laba-rugi.tsx`
4. **Arus Kas** - `resources/js/pages/akuntansi/laporan-keuangan/arus-kas.tsx`
5. **Perubahan Ekuitas** - `resources/js/pages/akuntansi/laporan-keuangan/perubahan-ekuitas.tsx`

### Key Features:
- Modern responsive UI dengan Tailwind CSS
- Interactive date/period filters
- Real-time calculation
- Currency formatting (IDR)
- Export buttons (functionality pending)
- Balance verification for Neraca
- Detailed breakdown for each report

## Database Integration

### Models Used:
- `DaftarAkun` - Chart of accounts
- `Jurnal` - Journal entries
- `DetailJurnal` - Journal entry details

### Data Flow:
1. Ambil data dari `DetailJurnal` dengan filter tanggal/periode
2. Join dengan `Jurnal` untuk validasi status 'posted'
3. Group by akun dan jenis akun
4. Hitung saldo berdasarkan normal balance (debit/kredit)
5. Format dan kirim ke frontend

## Logic Implementation

### Neraca (Balance Sheet):
- **Aset**: Debit - Kredit (normal debit)
- **Kewajiban**: Kredit - Debit (normal kredit)
- **Ekuitas**: Kredit - Debit + Laba Rugi Berjalan
- **Balance Check**: Aset = Kewajiban + Ekuitas

### Laba Rugi (Income Statement):
- **Pendapatan**: Kredit - Debit (normal kredit)
- **Beban**: Debit - Kredit (normal debit)
- **Laba/Rugi**: Pendapatan - Beban

### Arus Kas (Cash Flow):
- Filter akun kas/bank berdasarkan nama atau kode
- **Kas Masuk**: Debit
- **Kas Keluar**: Kredit
- **Net Cash Flow**: Kas Masuk - Kas Keluar

### Perubahan Ekuitas (Changes in Equity):
- **Saldo Awal**: Ekuitas sebelum periode
- **Laba/Rugi Periode**: Hasil operasi periode berjalan
- **Tambahan Investasi**: Penambahan modal
- **Penarikan**: Dividen atau prive
- **Saldo Akhir**: Saldo Awal + L/R + Investasi - Penarikan

## Navigation Integration
Menu laporan keuangan sudah diintegrasikan di app header dengan submenu akuntansi:
- Dashboard → Akuntansi → Laporan Keuangan

## Status
✅ **Completed:**
- Backend controller implementation
- Frontend pages implementation
- Routes and permissions setup
- Database integration
- Navigation integration
- Modern responsive UI

🔄 **Pending:**
- Export functionality (Excel/PDF)
- Advanced filtering options
- Period comparison features
- Graphical reports/charts

## Testing
Untuk testing modul laporan keuangan:
1. Pastikan ada data jurnal yang sudah di-post
2. Akses `/akuntansi/laporan`
3. Test setiap jenis laporan dengan filter tanggal/periode yang berbeda
4. Verifikasi perhitungan dengan data manual

## Usage Examples

### Generate Neraca:
```
GET /akuntansi/laporan/neraca?tanggal=2025-07-07
```

### Generate Laba Rugi:
```
GET /akuntansi/laporan/laba-rugi?periode_dari=2025-07-01&periode_sampai=2025-07-31
```

### Generate Arus Kas:
```
GET /akuntansi/laporan/arus-kas?periode_dari=2025-07-01&periode_sampai=2025-07-31
```

### Generate Perubahan Ekuitas:
```
GET /akuntansi/laporan/perubahan-ekuitas?periode_dari=2025-01-01&periode_sampai=2025-12-31
```

---

**Last Updated**: July 7, 2025
**Version**: 1.0.0
