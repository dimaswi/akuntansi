<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create Permissions - Comprehensive list from all routes
        $permissions = [
            // ========== USER MANAGEMENT ==========
            ['name' => 'user.view', 'display_name' => 'Lihat User', 'description' => 'Dapat melihat daftar user', 'module' => 'User Management'],
            ['name' => 'user.create', 'display_name' => 'Tambah User', 'description' => 'Dapat menambah user baru', 'module' => 'User Management'],
            ['name' => 'user.edit', 'display_name' => 'Edit User', 'description' => 'Dapat mengedit data user', 'module' => 'User Management'],
            ['name' => 'user.delete', 'display_name' => 'Hapus User', 'description' => 'Dapat menghapus user', 'module' => 'User Management'],
            ['name' => 'user.toggle-status', 'display_name' => 'Toggle Status User', 'description' => 'Dapat mengubah status user', 'module' => 'User Management'],
            ['name' => 'user.department.manage', 'display_name' => 'Kelola User Department', 'description' => 'Dapat mengelola assignment user ke department', 'module' => 'User Management'],
            
            // ========== ROLE MANAGEMENT ==========
            ['name' => 'role.view', 'display_name' => 'Lihat Role', 'description' => 'Dapat melihat daftar role', 'module' => 'Role Management'],
            ['name' => 'role.create', 'display_name' => 'Tambah Role', 'description' => 'Dapat menambah role baru', 'module' => 'Role Management'],
            ['name' => 'role.edit', 'display_name' => 'Edit Role', 'description' => 'Dapat mengedit role', 'module' => 'Role Management'],
            ['name' => 'role.delete', 'display_name' => 'Hapus Role', 'description' => 'Dapat menghapus role', 'module' => 'Role Management'],
            
            // ========== PERMISSION MANAGEMENT ==========
            ['name' => 'permission.view', 'display_name' => 'Lihat Permission', 'description' => 'Dapat melihat daftar permission', 'module' => 'Permission Management'],
            ['name' => 'permission.create', 'display_name' => 'Tambah Permission', 'description' => 'Dapat menambah permission baru', 'module' => 'Permission Management'],
            ['name' => 'permission.edit', 'display_name' => 'Edit Permission', 'description' => 'Dapat mengedit permission', 'module' => 'Permission Management'],
            ['name' => 'permission.delete', 'display_name' => 'Hapus Permission', 'description' => 'Dapat menghapus permission', 'module' => 'Permission Management'],
            
            // ========== DASHBOARD ==========
            ['name' => 'dashboard.view', 'display_name' => 'Lihat Dashboard', 'description' => 'Dapat mengakses dashboard', 'module' => 'Dashboard'],
            
            // ========== SETTINGS ==========
            ['name' => 'settings.view', 'display_name' => 'Lihat Settings', 'description' => 'Dapat melihat pengaturan', 'module' => 'Settings'],
            ['name' => 'settings.edit', 'display_name' => 'Edit Settings', 'description' => 'Dapat mengedit pengaturan', 'module' => 'Settings'],
            
            // ========== AKUNTANSI MODULE ==========
            ['name' => 'akuntansi.view', 'display_name' => 'Lihat Akuntansi', 'description' => 'Dapat mengakses modul akuntansi', 'module' => 'Akuntansi'],
            
            // Akuntansi - Daftar Akun
            ['name' => 'akuntansi.daftar-akun.view', 'display_name' => 'Lihat Daftar Akun', 'description' => 'Dapat melihat daftar akun', 'module' => 'Akuntansi'],
            ['name' => 'akuntansi.daftar-akun.create', 'display_name' => 'Tambah Daftar Akun', 'description' => 'Dapat menambah akun baru', 'module' => 'Akuntansi'],
            ['name' => 'akuntansi.daftar-akun.edit', 'display_name' => 'Edit Daftar Akun', 'description' => 'Dapat mengedit akun', 'module' => 'Akuntansi'],
            ['name' => 'akuntansi.daftar-akun.delete', 'display_name' => 'Hapus Daftar Akun', 'description' => 'Dapat menghapus akun', 'module' => 'Akuntansi'],
            ['name' => 'akuntansi.daftar-akun.import', 'display_name' => 'Import Daftar Akun', 'description' => 'Dapat mengimport daftar akun', 'module' => 'Akuntansi'],
            ['name' => 'akuntansi.daftar-akun.export', 'display_name' => 'Export Daftar Akun', 'description' => 'Dapat mengexport daftar akun', 'module' => 'Akuntansi'],
            ['name' => 'akuntansi.daftar-akun.activate', 'display_name' => 'Aktivasi Daftar Akun', 'description' => 'Dapat mengaktifkan akun', 'module' => 'Akuntansi'],
            ['name' => 'akuntansi.daftar-akun.deactivate', 'display_name' => 'Deaktivasi Daftar Akun', 'description' => 'Dapat menonaktifkan akun', 'module' => 'Akuntansi'],
            
            // Akuntansi - Jurnal
            ['name' => 'akuntansi.jurnal.view', 'display_name' => 'Lihat Jurnal', 'description' => 'Dapat melihat jurnal', 'module' => 'Akuntansi'],
            ['name' => 'akuntansi.jurnal.create', 'display_name' => 'Tambah Jurnal', 'description' => 'Dapat menambah jurnal baru', 'module' => 'Akuntansi'],
            ['name' => 'akuntansi.jurnal.edit', 'display_name' => 'Edit Jurnal', 'description' => 'Dapat mengedit jurnal', 'module' => 'Akuntansi'],
            ['name' => 'akuntansi.jurnal.delete', 'display_name' => 'Hapus Jurnal', 'description' => 'Dapat menghapus jurnal', 'module' => 'Akuntansi'],
            ['name' => 'akuntansi.jurnal.post', 'display_name' => 'Post Jurnal', 'description' => 'Dapat memposting jurnal', 'module' => 'Akuntansi'],
            ['name' => 'akuntansi.jurnal.reverse', 'display_name' => 'Reverse Jurnal', 'description' => 'Dapat membalik jurnal', 'module' => 'Akuntansi'],
            
            // Akuntansi - Jurnal Penyesuaian
            ['name' => 'akuntansi.jurnal-penyesuaian.view', 'display_name' => 'Lihat Jurnal Penyesuaian', 'description' => 'Dapat melihat jurnal penyesuaian', 'module' => 'Akuntansi'],
            ['name' => 'akuntansi.jurnal-penyesuaian.create', 'display_name' => 'Tambah Jurnal Penyesuaian', 'description' => 'Dapat menambah jurnal penyesuaian', 'module' => 'Akuntansi'],
            ['name' => 'akuntansi.jurnal-penyesuaian.edit', 'display_name' => 'Edit Jurnal Penyesuaian', 'description' => 'Dapat mengedit jurnal penyesuaian', 'module' => 'Akuntansi'],
            ['name' => 'akuntansi.jurnal-penyesuaian.delete', 'display_name' => 'Hapus Jurnal Penyesuaian', 'description' => 'Dapat menghapus jurnal penyesuaian', 'module' => 'Akuntansi'],
            ['name' => 'akuntansi.jurnal-penyesuaian.post', 'display_name' => 'Post Jurnal Penyesuaian', 'description' => 'Dapat memposting jurnal penyesuaian', 'module' => 'Akuntansi'],
            
            // Akuntansi - Journal Posting (dari Kas/Bank ke Jurnal)
            ['name' => 'akuntansi.journal-posting.view', 'display_name' => 'Lihat Journal Posting', 'description' => 'Dapat melihat halaman posting ke jurnal', 'module' => 'Akuntansi'],
            ['name' => 'akuntansi.journal-posting.post', 'display_name' => 'Post to Journal', 'description' => 'Dapat memposting transaksi kas/bank ke jurnal', 'module' => 'Akuntansi'],
            
            // Akuntansi - Buku Besar
            ['name' => 'akuntansi.buku-besar.view', 'display_name' => 'Lihat Buku Besar', 'description' => 'Dapat melihat buku besar', 'module' => 'Akuntansi'],
            ['name' => 'akuntansi.buku-besar.export', 'display_name' => 'Export Buku Besar', 'description' => 'Dapat mengexport buku besar', 'module' => 'Akuntansi'],
            
            // Akuntansi - Laporan Keuangan
            ['name' => 'akuntansi.laporan.view', 'display_name' => 'Lihat Laporan Keuangan', 'description' => 'Dapat melihat laporan keuangan', 'module' => 'Akuntansi'],
            ['name' => 'akuntansi.laporan.export', 'display_name' => 'Export Laporan Keuangan', 'description' => 'Dapat mengexport laporan keuangan', 'module' => 'Akuntansi'],
            
            // ========== TUTUP BUKU & CUT OFF ==========
            ['name' => 'closing-period.view', 'display_name' => 'Lihat Periode Tutup Buku', 'description' => 'Dapat melihat daftar periode tutup buku', 'module' => 'Tutup Buku'],
            ['name' => 'closing-period.create', 'display_name' => 'Buat Periode Tutup Buku', 'description' => 'Dapat membuat periode tutup buku baru', 'module' => 'Tutup Buku'],
            ['name' => 'closing-period.edit', 'display_name' => 'Edit Periode Tutup Buku', 'description' => 'Dapat mengedit periode tutup buku', 'module' => 'Tutup Buku'],
            ['name' => 'closing-period.delete', 'display_name' => 'Hapus Periode Tutup Buku', 'description' => 'Dapat menghapus periode tutup buku', 'module' => 'Tutup Buku'],
            ['name' => 'closing-period.soft-close', 'display_name' => 'Soft Close Periode', 'description' => 'Dapat melakukan soft close periode', 'module' => 'Tutup Buku'],
            ['name' => 'closing-period.hard-close', 'display_name' => 'Hard Close Periode', 'description' => 'Dapat melakukan hard close periode', 'module' => 'Tutup Buku'],
            ['name' => 'closing-period.reopen', 'display_name' => 'Buka Kembali Periode', 'description' => 'Dapat membuka kembali periode yang sudah ditutup (emergency)', 'module' => 'Tutup Buku'],
            ['name' => 'closing-period.manage-settings', 'display_name' => 'Kelola Settings Tutup Buku', 'description' => 'Dapat mengelola konfigurasi tutup buku & cut off', 'module' => 'Tutup Buku'],
            ['name' => 'closing-period.approve-revision', 'display_name' => 'Approve Revisi Periode', 'description' => 'Dapat menyetujui revisi setelah soft close', 'module' => 'Tutup Buku'],
            ['name' => 'closing-period.view-dashboard', 'display_name' => 'Lihat Dashboard Kelengkapan', 'description' => 'Dapat melihat dashboard kelengkapan data periode', 'module' => 'Tutup Buku'],
            
            // ========== INVENTORY MODULE ==========
            ['name' => 'inventory.view', 'display_name' => 'Lihat Inventory', 'description' => 'Dapat mengakses modul inventory', 'module' => 'Inventory'],
            
            // Inventory - Items
            ['name' => 'inventory.items.view', 'display_name' => 'Lihat Items', 'description' => 'Dapat melihat daftar items', 'module' => 'Inventory'],
            ['name' => 'inventory.items.create', 'display_name' => 'Tambah Items', 'description' => 'Dapat menambah item baru', 'module' => 'Inventory'],
            ['name' => 'inventory.items.edit', 'display_name' => 'Edit Items', 'description' => 'Dapat mengedit items', 'module' => 'Inventory'],
            ['name' => 'inventory.items.delete', 'display_name' => 'Hapus Items', 'description' => 'Dapat menghapus items', 'module' => 'Inventory'],
            ['name' => 'inventory.items.upload-image', 'display_name' => 'Upload Gambar Item', 'description' => 'Dapat mengupload gambar item', 'module' => 'Inventory'],
            
            // Inventory - Categories
            ['name' => 'inventory.categories.view', 'display_name' => 'Lihat Categories', 'description' => 'Dapat melihat daftar categories', 'module' => 'Inventory'],
            ['name' => 'inventory.categories.create', 'display_name' => 'Tambah Categories', 'description' => 'Dapat menambah category baru', 'module' => 'Inventory'],
            ['name' => 'inventory.categories.edit', 'display_name' => 'Edit Categories', 'description' => 'Dapat mengedit categories', 'module' => 'Inventory'],
            ['name' => 'inventory.categories.delete', 'display_name' => 'Hapus Categories', 'description' => 'Dapat menghapus categories', 'module' => 'Inventory'],
            
            // Inventory - Departments
            ['name' => 'inventory.departments.view', 'display_name' => 'Lihat Departments', 'description' => 'Dapat melihat daftar departments', 'module' => 'Inventory'],
            ['name' => 'inventory.departments.create', 'display_name' => 'Tambah Departments', 'description' => 'Dapat menambah department baru', 'module' => 'Inventory'],
            ['name' => 'inventory.departments.edit', 'display_name' => 'Edit Departments', 'description' => 'Dapat mengedit departments', 'module' => 'Inventory'],
            ['name' => 'inventory.departments.delete', 'display_name' => 'Hapus Departments', 'description' => 'Dapat menghapus departments', 'module' => 'Inventory'],
            
            // Inventory - Suppliers
            ['name' => 'inventory.suppliers.view', 'display_name' => 'Lihat Suppliers', 'description' => 'Dapat melihat daftar suppliers', 'module' => 'Inventory'],
            ['name' => 'inventory.suppliers.create', 'display_name' => 'Tambah Suppliers', 'description' => 'Dapat menambah supplier baru', 'module' => 'Inventory'],
            ['name' => 'inventory.suppliers.edit', 'display_name' => 'Edit Suppliers', 'description' => 'Dapat mengedit suppliers', 'module' => 'Inventory'],
            ['name' => 'inventory.suppliers.delete', 'display_name' => 'Hapus Suppliers', 'description' => 'Dapat menghapus suppliers', 'module' => 'Inventory'],
            ['name' => 'inventory.suppliers.toggle-status', 'display_name' => 'Toggle Status Suppliers', 'description' => 'Dapat mengubah status suppliers', 'module' => 'Inventory'],
            
            // Inventory - Purchases
            ['name' => 'inventory.purchases.view', 'display_name' => 'Lihat Purchases', 'description' => 'Dapat melihat daftar purchases', 'module' => 'Inventory'],
            ['name' => 'inventory.purchases.create', 'display_name' => 'Tambah Purchases', 'description' => 'Dapat menambah purchase baru', 'module' => 'Inventory'],
            ['name' => 'inventory.purchases.edit', 'display_name' => 'Edit Purchases', 'description' => 'Dapat mengedit purchases', 'module' => 'Inventory'],
            ['name' => 'inventory.purchases.delete', 'display_name' => 'Hapus Purchases', 'description' => 'Dapat menghapus purchases', 'module' => 'Inventory'],
            ['name' => 'inventory.purchases.submit', 'display_name' => 'Submit Purchase', 'description' => 'Dapat submit purchase untuk approval', 'module' => 'Inventory'],
            ['name' => 'inventory.purchases.approve', 'display_name' => 'Approve Purchase', 'description' => 'Dapat approve purchase order', 'module' => 'Inventory'],
            ['name' => 'inventory.purchases.cancel', 'display_name' => 'Cancel Purchase', 'description' => 'Dapat cancel purchase order', 'module' => 'Inventory'],
            ['name' => 'inventory.purchases.receive', 'display_name' => 'Receive Purchase', 'description' => 'Dapat receive barang purchase', 'module' => 'Inventory'],
            ['name' => 'inventory.purchases.post-to-journal', 'display_name' => 'Post Purchase to Journal', 'description' => 'Dapat posting purchase ke jurnal', 'module' => 'Inventory'],
            ['name' => 'inventory.purchases.create-payment', 'display_name' => 'Create Purchase Payment', 'description' => 'Dapat membuat pembayaran purchase', 'module' => 'Inventory'],
            ['name' => 'inventory.purchases.view-ap', 'display_name' => 'View Accounts Payable', 'description' => 'Dapat melihat outstanding accounts payable', 'module' => 'Inventory'],
            
            // Inventory - Stock Requests (Central Warehouse System)
            ['name' => 'inventory.stock-requests.view', 'display_name' => 'Lihat Permintaan Stok', 'description' => 'Dapat melihat daftar permintaan stok', 'module' => 'Inventory'],
            ['name' => 'inventory.stock-requests.create', 'display_name' => 'Tambah Permintaan Stok', 'description' => 'Dapat membuat permintaan stok baru', 'module' => 'Inventory'],
            ['name' => 'inventory.stock-requests.edit', 'display_name' => 'Edit Permintaan Stok', 'description' => 'Dapat mengedit permintaan stok', 'module' => 'Inventory'],
            ['name' => 'inventory.stock-requests.delete', 'display_name' => 'Hapus Permintaan Stok', 'description' => 'Dapat menghapus permintaan stok', 'module' => 'Inventory'],
            ['name' => 'inventory.stock-requests.submit', 'display_name' => 'Submit Permintaan Stok', 'description' => 'Dapat submit permintaan stok untuk approval', 'module' => 'Inventory'],
            ['name' => 'inventory.stock-requests.approve', 'display_name' => 'Approve Permintaan Stok', 'description' => 'Dapat approve/reject permintaan stok', 'module' => 'Inventory'],
            ['name' => 'inventory.stock-requests.complete', 'display_name' => 'Complete Permintaan Stok', 'description' => 'Dapat menyelesaikan permintaan stok (issue items)', 'module' => 'Inventory'],
            ['name' => 'inventory.stock-requests.cancel', 'display_name' => 'Cancel Permintaan Stok', 'description' => 'Dapat membatalkan permintaan stok', 'module' => 'Inventory'],
            
            // Inventory - Stock Opname (Physical Stock Count)
            ['name' => 'inventory.stock-opnames.view', 'display_name' => 'Lihat Stock Opname', 'description' => 'Dapat melihat daftar stock opname', 'module' => 'Inventory'],
            ['name' => 'inventory.stock-opnames.create', 'display_name' => 'Tambah Stock Opname', 'description' => 'Dapat membuat stock opname baru', 'module' => 'Inventory'],
            ['name' => 'inventory.stock-opnames.edit', 'display_name' => 'Edit Stock Opname', 'description' => 'Dapat mengedit stock opname', 'module' => 'Inventory'],
            ['name' => 'inventory.stock-opnames.delete', 'display_name' => 'Hapus Stock Opname', 'description' => 'Dapat menghapus stock opname', 'module' => 'Inventory'],
            ['name' => 'inventory.stock-opnames.submit', 'display_name' => 'Submit Stock Opname', 'description' => 'Dapat submit stock opname untuk approval', 'module' => 'Inventory'],
            ['name' => 'inventory.stock-opnames.approve', 'display_name' => 'Approve Stock Opname', 'description' => 'Dapat approve/reject stock opname', 'module' => 'Inventory'],
            ['name' => 'inventory.stock-opnames.update-counts', 'display_name' => 'Update Physical Counts', 'description' => 'Dapat update hasil perhitungan fisik', 'module' => 'Inventory'],
            
            // Inventory - Requisitions (OLD - Keep for backward compatibility)
            ['name' => 'inventory.requisitions.view', 'display_name' => 'Lihat Requisitions', 'description' => 'Dapat melihat daftar requisitions', 'module' => 'Inventory'],
            ['name' => 'inventory.requisitions.create', 'display_name' => 'Tambah Requisitions', 'description' => 'Dapat menambah requisition baru', 'module' => 'Inventory'],
            ['name' => 'inventory.requisitions.edit', 'display_name' => 'Edit Requisitions', 'description' => 'Dapat mengedit requisitions', 'module' => 'Inventory'],
            ['name' => 'inventory.requisitions.delete', 'display_name' => 'Hapus Requisitions', 'description' => 'Dapat menghapus requisitions', 'module' => 'Inventory'],
            ['name' => 'inventory.requisitions.approve', 'display_name' => 'Approve Requisition', 'description' => 'Dapat approve requisition', 'module' => 'Inventory'],
            ['name' => 'inventory.requisitions.cancel', 'display_name' => 'Cancel Requisition', 'description' => 'Dapat cancel requisition', 'module' => 'Inventory'],
            
            // ========== KAS MODULE ==========
            ['name' => 'kas.view', 'display_name' => 'Lihat Kas', 'description' => 'Dapat mengakses modul kas', 'module' => 'Kas'],
            
            // Kas - Cash & Bank Management (Used in routes)
            ['name' => 'kas.cash-management.view', 'display_name' => 'Lihat Cash Management', 'description' => 'Dapat melihat dashboard kas, transaksi kas & bank', 'module' => 'Kas'],
            ['name' => 'kas.cash-management.daily-entry', 'display_name' => 'Entry Transaksi Kas/Bank Harian', 'description' => 'Dapat create/edit transaksi kas dan bank', 'module' => 'Kas'],
            ['name' => 'kas.cash-management.reconcile', 'display_name' => 'Rekonsiliasi Bank', 'description' => 'Dapat melakukan rekonsiliasi bank', 'module' => 'Kas'],
            
            // Kas - Delete Permissions (Separated per transaction type)
            ['name' => 'kas.cash-transaction.delete', 'display_name' => 'Hapus Transaksi Kas', 'description' => 'Dapat menghapus transaksi kas', 'module' => 'Kas'],
            ['name' => 'kas.bank-transaction.delete', 'display_name' => 'Hapus Transaksi Bank', 'description' => 'Dapat menghapus transaksi bank', 'module' => 'Kas'],
            
            // Kas - Bank Account (Master Data)
            ['name' => 'kas.bank-account.view', 'display_name' => 'Lihat Bank Account', 'description' => 'Dapat melihat daftar bank account', 'module' => 'Kas'],
            ['name' => 'kas.bank-account.create', 'display_name' => 'Tambah Bank Account', 'description' => 'Dapat menambah bank account', 'module' => 'Kas'],
            ['name' => 'kas.bank-account.edit', 'display_name' => 'Edit Bank Account', 'description' => 'Dapat mengedit bank account', 'module' => 'Kas'],
            ['name' => 'kas.bank-account.delete', 'display_name' => 'Hapus Bank Account', 'description' => 'Dapat menghapus bank account', 'module' => 'Kas'],
            
            // Kas - Giro Transaction
            ['name' => 'kas.giro-transaction.view', 'display_name' => 'Lihat Giro Transaction', 'description' => 'Dapat melihat giro transaction', 'module' => 'Kas'],
            ['name' => 'kas.giro-transaction.create', 'display_name' => 'Tambah Giro Transaction', 'description' => 'Dapat menambah giro transaction', 'module' => 'Kas'],
            ['name' => 'kas.giro-transaction.edit', 'display_name' => 'Edit Giro Transaction', 'description' => 'Dapat mengedit giro transaction', 'module' => 'Kas'],
            ['name' => 'kas.giro-transaction.delete', 'display_name' => 'Hapus Giro Transaction', 'description' => 'Dapat menghapus giro transaction', 'module' => 'Kas'],
            ['name' => 'kas.giro-transaction.post', 'display_name' => 'Post Giro Transaction', 'description' => 'Dapat post giro ke bank', 'module' => 'Kas'],
            ['name' => 'kas.giro-transaction.clear', 'display_name' => 'Clear Giro Transaction', 'description' => 'Dapat clear/cash giro transaction', 'module' => 'Kas'],
            ['name' => 'kas.giro-transaction.reject', 'display_name' => 'Reject Giro Transaction', 'description' => 'Dapat reject/bounce giro transaction', 'module' => 'Kas'],
            
            // Kas - Transfer
            ['name' => 'kas.transfer.view', 'display_name' => 'Lihat Transfer', 'description' => 'Dapat melihat transfer', 'module' => 'Kas'],
            ['name' => 'kas.transfer.create', 'display_name' => 'Tambah Transfer', 'description' => 'Dapat menambah transfer', 'module' => 'Kas'],
            ['name' => 'kas.transfer.edit', 'display_name' => 'Edit Transfer', 'description' => 'Dapat mengedit transfer', 'module' => 'Kas'],
            ['name' => 'kas.transfer.delete', 'display_name' => 'Hapus Transfer', 'description' => 'Dapat menghapus transfer', 'module' => 'Kas'],
            ['name' => 'kas.transfer.approve', 'display_name' => 'Approve Transfer', 'description' => 'Dapat approve transfer', 'module' => 'Kas'],
            ['name' => 'kas.transfer.reverse', 'display_name' => 'Reverse Transfer', 'description' => 'Dapat reverse transfer', 'module' => 'Kas'],
            
            // Laporan - Cash Flow
            ['name' => 'laporan.cash-flow.view', 'display_name' => 'Lihat Laporan Arus Kas', 'description' => 'Dapat melihat laporan arus kas', 'module' => 'Laporan'],
            ['name' => 'laporan.cash-flow.export', 'display_name' => 'Export Laporan Arus Kas', 'description' => 'Dapat export laporan arus kas', 'module' => 'Laporan'],
            
            // Laporan - Giro
            ['name' => 'laporan.giro-report.view', 'display_name' => 'Lihat Laporan Giro', 'description' => 'Dapat melihat laporan giro', 'module' => 'Laporan'],
            ['name' => 'laporan.giro-report.export', 'display_name' => 'Export Laporan Giro', 'description' => 'Dapat export laporan giro', 'module' => 'Laporan'],
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission['name']],
                $permission
            );
        }

        // Create Roles
        $adminRole = Role::firstOrCreate(
            ['name' => 'administrator'],
            [
                'display_name' => 'Administrator',
                'description' => 'Administrator dengan akses penuh ke semua fitur sistem'
            ]
        );
        // Assign permissions to Admin (all permissions)
        $allPermissions = Permission::all();
        $adminRole->permissions()->sync($allPermissions->pluck('id'));

        $this->command->info('Roles and permissions created successfully!');
    }
}
