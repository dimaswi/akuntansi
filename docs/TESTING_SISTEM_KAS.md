# TESTING SISTEM TRANSAKSI KAS BARU

## Skenario Testing

### 1. Test Penerimaan Kas (Harus Menambah Saldo)

**Sebelum:**
- Saldo Kas: Rp 1.000.000

**Input Transaksi:**
- Jenis: Penerimaan
- Kategori: Penjualan Barang/Jasa
- Jumlah: Rp 500.000
- Akun Kas: Kas di Tangan

**Hasil yang Diharapkan:**
- Saldo Kas: Rp 1.500.000
- Jurnal:
  - Debit: Kas di Tangan Rp 500.000
  - Kredit: Pendapatan Penjualan Rp 500.000

### 2. Test Pengeluaran Kas (Harus Mengurangi Saldo)

**Sebelum:**
- Saldo Kas: Rp 1.500.000

**Input Transaksi:**
- Jenis: Pengeluaran
- Kategori: Gaji Karyawan
- Jumlah: Rp 300.000
- Akun Kas: Kas di Tangan

**Hasil yang Diharapkan:**
- Saldo Kas: Rp 1.200.000
- Jurnal:
  - Debit: Biaya Gaji Rp 300.000
  - Kredit: Kas di Tangan Rp 300.000

### 3. Test Kategori Lain

**Penerimaan - Piutang:**
- Kategori: Penerimaan Piutang
- Akun Lawan: Piutang Usaha (1.1.2.01)

**Pengeluaran - Operasional:**
- Kategori: Biaya Operasional
- Akun Lawan: Biaya Operasional (5.3.1.01)

## Langkah Testing

1. **Buka halaman transaksi kas**
   ```
   http://localhost/akuntansi/kas/cash-transactions/create
   ```

2. **Test UI Kategori:**
   - Pilih "Penerimaan" → Lihat kategori penerimaan
   - Pilih "Pengeluaran" → Lihat kategori pengeluaran
   - Pastikan dropdown berubah sesuai jenis transaksi

3. **Test Penyimpanan:**
   - Isi form dengan data test
   - Simpan transaksi
   - Periksa data tersimpan dengan kategori yang benar

4. **Test Posting:**
   - Post transaksi yang telah dibuat
   - Periksa jurnal yang terbentuk
   - Pastikan akun lawan sesuai mapping

5. **Test Edit:**
   - Edit transaksi
   - Ubah kategori
   - Simpan dan periksa akun lawan ter-update

## Checklist Testing

- [ ] UI kategori muncul dengan benar
- [ ] Dropdown kategori berubah berdasarkan jenis transaksi
- [ ] Transaksi tersimpan dengan kategori yang benar
- [ ] Akun lawan otomatis ter-mapping
- [ ] Jurnal terbentuk dengan benar saat posting
- [ ] Saldo kas ter-update dengan benar
- [ ] Edit transaksi berfungsi dengan baik
- [ ] Pesan sukses/error muncul dengan tepat

## Troubleshooting

**Jika saldo kas tidak berubah:**
- Pastikan transaksi sudah di-post
- Periksa jurnal yang terbentuk
- Pastikan akun kas yang dipilih benar

**Jika akun lawan tidak sesuai:**
- Periksa mapping di method `getAkunLawan()`
- Pastikan akun default sudah dibuat
- Periksa kode akun yang digunakan

**Jika kategori tidak muncul:**
- Periksa data `kategoriTransaksi` di controller
- Pastikan frontend menerima data dengan benar
- Periksa kondisi jenis transaksi
