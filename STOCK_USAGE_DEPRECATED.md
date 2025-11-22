# Stock Usage Module - DEPRECATED

## Status: REMOVED ❌

Modul **Stock Usage** (Pemakaian Barang) telah dihapus dan digantikan dengan sistem **Stock Opname** yang lebih proper dan sesuai standar akuntansi.

---

## Alasan Penghapusan

1. **Tidak Ada Verifikasi Fisik**: Stock Usage hanya mencatat pemakaian tanpa melakukan perhitungan fisik barang
2. **Tidak Ada Deteksi Variance**: Tidak bisa mendeteksi perbedaan antara stok sistem vs realita fisik
3. **Tidak Ada Akuntabilitas Bulanan**: Tidak ada mekanisme untuk memastikan department melakukan stock count berkala
4. **Manual Adjustment**: Proses adjustment manual yang rentan kesalahan

---

## Pengganti: Stock Opname System

Stock Opname menggantikan Stock Usage dengan fitur:

### ✅ Fitur Utama
- **Physical Count**: Perhitungan fisik barang di department
- **Variance Detection**: Otomatis mendeteksi selisih (surplus/shortage)
- **Auto Adjustment**: Otomatis membuat stock adjustment saat approve
- **Monthly Requirement**: Wajib dilakukan setiap bulan sebelum bisa request/transfer
- **Dual Approval**: Bisa diapprove oleh Logistics ATAU Department Head

### 📊 Workflow
1. Department create Stock Opname → System load current stock
2. Input physical count → System calculate variance
3. Submit untuk approval
4. Logistics/Dept Head approve → Auto create adjustment
5. Department bisa request/transfer setelah opname approved

### 🔐 Permissions Created
```
inventory.stock-opnames.view           - Lihat Stock Opname
inventory.stock-opnames.create         - Tambah Stock Opname
inventory.stock-opnames.edit           - Edit Stock Opname
inventory.stock-opnames.delete         - Hapus Stock Opname
inventory.stock-opnames.submit         - Submit Stock Opname
inventory.stock-opnames.approve        - Approve/Reject Stock Opname
inventory.stock-opnames.update-counts  - Update Physical Counts
```

---

## Files Removed

### Backend
- ✅ `app/Http/Controllers/Inventory/StockUsageController.php`
- ✅ `app/Models/Inventory/StockUsage.php`
- ✅ `app/Services/Inventory/StockUsageAccountingService.php`

### Frontend
- ✅ `resources/js/pages/inventory/stock-usages/index.tsx`
- ✅ `resources/js/pages/inventory/stock-usages/create.tsx`
- ✅ `resources/js/pages/inventory/stock-usages/edit.tsx`
- ✅ `resources/js/pages/inventory/stock-usages/show.tsx`
- ✅ `resources/js/pages/inventory/stock-usages/post-to-journal.tsx`

### Routes
- ✅ All `/stock-usages` routes removed from `routes/inventory.php`

### Navigation
- ✅ Menu "Pemakaian Barang" removed from `app-header.tsx`

---

## Database Migration Note

⚠️ **IMPORTANT**: Migration file masih ada untuk backward compatibility:
- `database/migrations/2025_11_10_120001_create_stock_usages_table.php`

**Jika ada data `stock_usages` di production:**
1. Export data untuk archive
2. Buat migration untuk drop table (jika sudah tidak diperlukan)
3. Atau biarkan table untuk reference historis

**Jika fresh installation:**
- Migration akan tetap ada tapi tidak terpakai
- Tidak akan ada dampak karena module code sudah dihapus

---

## Migration Path

### Untuk Existing Users
1. **Export stock_usages data** (optional, untuk archive)
   ```sql
   SELECT * FROM stock_usages ORDER BY tanggal_usage DESC;
   ```

2. **Mulai gunakan Stock Opname**
   - Setiap department buat Stock Opname pertama
   - Input physical count
   - Approve untuk sync stock

3. **Setelah semua department menggunakan Stock Opname**
   - Bisa drop table `stock_usages` (optional)

### Drop Table Script (Optional)
```php
// Create migration: php artisan make:migration drop_stock_usages_table
public function up(): void
{
    Schema::dropIfExists('stock_usages');
}

public function down(): void
{
    // Cannot restore - data will be lost
    throw new Exception('Cannot rollback dropping stock_usages table');
}
```

---

## Documentation

**Dokumentasi lengkap Stock Opname:**
- 📖 Technical: `STOCK_OPNAME_IMPLEMENTATION.md`
- 📘 User Guide: `STOCK_OPNAME_USER_GUIDE.md`

**URL:**
- Stock Opname Index: `/stock-opnames`
- Create: `/stock-opnames/create`
- Detail: `/stock-opnames/{id}`

---

## Timeline

- **Created**: November 2025 (Stock Usage)
- **Deprecated**: December 2025
- **Replaced By**: Stock Opname System
- **Status**: ❌ REMOVED

---

## Support

Jika ada pertanyaan tentang transisi dari Stock Usage ke Stock Opname:
1. Baca `STOCK_OPNAME_USER_GUIDE.md`
2. Lihat FAQ di user guide
3. Untuk technical details, lihat `STOCK_OPNAME_IMPLEMENTATION.md`
