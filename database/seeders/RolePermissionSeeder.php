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
            ['name' => 'akuntansi.view', 'display_name' => 'Lihat Dashboard Akuntansi', 'description' => 'Dapat mengakses dashboard akuntansi', 'module' => 'Akuntansi - Dashboard'],
            
            // Akuntansi - Daftar Akun
            ['name' => 'akuntansi.daftar-akun.view', 'display_name' => 'Lihat Daftar Akun', 'description' => 'Dapat melihat daftar akun', 'module' => 'Akuntansi - Daftar Akun'],
            ['name' => 'akuntansi.daftar-akun.create', 'display_name' => 'Tambah Daftar Akun', 'description' => 'Dapat menambah akun baru', 'module' => 'Akuntansi - Daftar Akun'],
            ['name' => 'akuntansi.daftar-akun.edit', 'display_name' => 'Edit Daftar Akun', 'description' => 'Dapat mengedit akun', 'module' => 'Akuntansi - Daftar Akun'],
            ['name' => 'akuntansi.daftar-akun.delete', 'display_name' => 'Hapus Daftar Akun', 'description' => 'Dapat menghapus akun', 'module' => 'Akuntansi - Daftar Akun'],
            ['name' => 'akuntansi.daftar-akun.import', 'display_name' => 'Import Daftar Akun', 'description' => 'Dapat mengimport daftar akun', 'module' => 'Akuntansi - Daftar Akun'],
            ['name' => 'akuntansi.daftar-akun.export', 'display_name' => 'Export Daftar Akun', 'description' => 'Dapat mengexport daftar akun', 'module' => 'Akuntansi - Daftar Akun'],
            ['name' => 'akuntansi.daftar-akun.activate', 'display_name' => 'Aktivasi Daftar Akun', 'description' => 'Dapat mengaktifkan akun', 'module' => 'Akuntansi - Daftar Akun'],
            ['name' => 'akuntansi.daftar-akun.deactivate', 'display_name' => 'Deaktivasi Daftar Akun', 'description' => 'Dapat menonaktifkan akun', 'module' => 'Akuntansi - Daftar Akun'],
            
            // Akuntansi - Jurnal
            ['name' => 'akuntansi.jurnal.view', 'display_name' => 'Lihat Jurnal', 'description' => 'Dapat melihat jurnal', 'module' => 'Akuntansi - Jurnal'],
            ['name' => 'akuntansi.jurnal.create', 'display_name' => 'Tambah Jurnal', 'description' => 'Dapat menambah jurnal baru', 'module' => 'Akuntansi - Jurnal'],
            ['name' => 'akuntansi.jurnal.edit', 'display_name' => 'Edit Jurnal', 'description' => 'Dapat mengedit jurnal', 'module' => 'Akuntansi - Jurnal'],
            ['name' => 'akuntansi.jurnal.delete', 'display_name' => 'Hapus Jurnal', 'description' => 'Dapat menghapus jurnal', 'module' => 'Akuntansi - Jurnal'],
            ['name' => 'akuntansi.jurnal.post', 'display_name' => 'Post Jurnal', 'description' => 'Dapat memposting jurnal', 'module' => 'Akuntansi - Jurnal'],
            ['name' => 'akuntansi.jurnal.reverse', 'display_name' => 'Reverse Jurnal', 'description' => 'Dapat membalik jurnal', 'module' => 'Akuntansi - Jurnal'],
            
            // Akuntansi - Jurnal Penyesuaian
            ['name' => 'akuntansi.jurnal-penyesuaian.view', 'display_name' => 'Lihat Jurnal Penyesuaian', 'description' => 'Dapat melihat jurnal penyesuaian', 'module' => 'Akuntansi - Jurnal Penyesuaian'],
            ['name' => 'akuntansi.jurnal-penyesuaian.create', 'display_name' => 'Tambah Jurnal Penyesuaian', 'description' => 'Dapat menambah jurnal penyesuaian', 'module' => 'Akuntansi - Jurnal Penyesuaian'],
            ['name' => 'akuntansi.jurnal-penyesuaian.edit', 'display_name' => 'Edit Jurnal Penyesuaian', 'description' => 'Dapat mengedit jurnal penyesuaian', 'module' => 'Akuntansi - Jurnal Penyesuaian'],
            ['name' => 'akuntansi.jurnal-penyesuaian.delete', 'display_name' => 'Hapus Jurnal Penyesuaian', 'description' => 'Dapat menghapus jurnal penyesuaian', 'module' => 'Akuntansi - Jurnal Penyesuaian'],
            ['name' => 'akuntansi.jurnal-penyesuaian.post', 'display_name' => 'Post Jurnal Penyesuaian', 'description' => 'Dapat memposting jurnal penyesuaian', 'module' => 'Akuntansi - Jurnal Penyesuaian'],
            
            // Akuntansi - Journal Posting (dari Kas/Bank ke Jurnal)
            ['name' => 'akuntansi.journal-posting.view', 'display_name' => 'Lihat Journal Posting', 'description' => 'Dapat melihat halaman posting ke jurnal', 'module' => 'Akuntansi - Journal Posting'],
            ['name' => 'akuntansi.journal-posting.post', 'display_name' => 'Post to Journal', 'description' => 'Dapat memposting transaksi kas/bank ke jurnal', 'module' => 'Akuntansi - Journal Posting'],
            
            // Akuntansi - Buku Besar
            ['name' => 'akuntansi.buku-besar.view', 'display_name' => 'Lihat Buku Besar', 'description' => 'Dapat melihat buku besar', 'module' => 'Akuntansi - Buku Besar'],
            ['name' => 'akuntansi.buku-besar.export', 'display_name' => 'Export Buku Besar', 'description' => 'Dapat mengexport buku besar', 'module' => 'Akuntansi - Buku Besar'],
            
            // Akuntansi - Laporan Keuangan
            ['name' => 'akuntansi.laporan.view', 'display_name' => 'Lihat Laporan Keuangan', 'description' => 'Dapat melihat laporan keuangan', 'module' => 'Akuntansi - Laporan Keuangan'],
            ['name' => 'akuntansi.laporan.export', 'display_name' => 'Export Laporan Keuangan', 'description' => 'Dapat mengexport laporan keuangan', 'module' => 'Akuntansi - Laporan Keuangan'],
            
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
            ['name' => 'inventory.dashboard.view', 'display_name' => 'Lihat Inventory Dashboard', 'description' => 'Dapat mengakses dashboard inventory', 'module' => 'Inventory - Dashboard'],
            
            // Inventory - Items
            ['name' => 'inventory.items.view', 'display_name' => 'Lihat Items', 'description' => 'Dapat melihat daftar items', 'module' => 'Items (Barang)'],
            ['name' => 'inventory.items.create', 'display_name' => 'Tambah Items', 'description' => 'Dapat menambah item baru', 'module' => 'Items (Barang)'],
            ['name' => 'inventory.items.edit', 'display_name' => 'Edit Items', 'description' => 'Dapat mengedit items', 'module' => 'Items (Barang)'],
            ['name' => 'inventory.items.delete', 'display_name' => 'Hapus Items', 'description' => 'Dapat menghapus items', 'module' => 'Items (Barang)'],
            ['name' => 'inventory.items.upload-image', 'display_name' => 'Upload Gambar Item', 'description' => 'Dapat mengupload gambar item', 'module' => 'Items (Barang)'],
            
            // Inventory - Categories
            ['name' => 'inventory.categories.view', 'display_name' => 'Lihat Categories', 'description' => 'Dapat melihat daftar categories', 'module' => 'Kategori Barang'],
            ['name' => 'inventory.categories.create', 'display_name' => 'Tambah Categories', 'description' => 'Dapat menambah category baru', 'module' => 'Kategori Barang'],
            ['name' => 'inventory.categories.edit', 'display_name' => 'Edit Categories', 'description' => 'Dapat mengedit categories', 'module' => 'Kategori Barang'],
            ['name' => 'inventory.categories.delete', 'display_name' => 'Hapus Categories', 'description' => 'Dapat menghapus categories', 'module' => 'Kategori Barang'],
            
            // Inventory - Departments
            ['name' => 'inventory.departments.view', 'display_name' => 'Lihat Departments', 'description' => 'Dapat melihat daftar departments', 'module' => 'Departemen'],
            ['name' => 'inventory.departments.create', 'display_name' => 'Tambah Departments', 'description' => 'Dapat menambah department baru', 'module' => 'Departemen'],
            ['name' => 'inventory.departments.edit', 'display_name' => 'Edit Departments', 'description' => 'Dapat mengedit departments', 'module' => 'Departemen'],
            ['name' => 'inventory.departments.delete', 'display_name' => 'Hapus Departments', 'description' => 'Dapat menghapus departments', 'module' => 'Departemen'],
            
            // Inventory - Suppliers
            ['name' => 'inventory.suppliers.view', 'display_name' => 'Lihat Suppliers', 'description' => 'Dapat melihat daftar suppliers', 'module' => 'Supplier'],
            ['name' => 'inventory.suppliers.create', 'display_name' => 'Tambah Suppliers', 'description' => 'Dapat menambah supplier baru', 'module' => 'Supplier'],
            ['name' => 'inventory.suppliers.edit', 'display_name' => 'Edit Suppliers', 'description' => 'Dapat mengedit suppliers', 'module' => 'Supplier'],
            ['name' => 'inventory.suppliers.delete', 'display_name' => 'Hapus Suppliers', 'description' => 'Dapat menghapus suppliers', 'module' => 'Supplier'],
            ['name' => 'inventory.suppliers.toggle-status', 'display_name' => 'Toggle Status Suppliers', 'description' => 'Dapat mengubah status suppliers', 'module' => 'Supplier'],
            
            // Inventory - Purchases
            ['name' => 'inventory.purchases.view', 'display_name' => 'Lihat Purchases', 'description' => 'Dapat melihat daftar purchases', 'module' => 'Pembelian'],
            ['name' => 'inventory.purchases.create', 'display_name' => 'Tambah Purchases', 'description' => 'Dapat menambah purchase baru', 'module' => 'Pembelian'],
            ['name' => 'inventory.purchases.edit', 'display_name' => 'Edit Purchases', 'description' => 'Dapat mengedit purchases', 'module' => 'Pembelian'],
            ['name' => 'inventory.purchases.delete', 'display_name' => 'Hapus Purchases', 'description' => 'Dapat menghapus purchases', 'module' => 'Pembelian'],
            ['name' => 'inventory.purchases.submit', 'display_name' => 'Submit Purchase', 'description' => 'Dapat submit purchase untuk approval', 'module' => 'Pembelian'],
            ['name' => 'inventory.purchases.approve', 'display_name' => 'Approve Purchase', 'description' => 'Dapat approve purchase order', 'module' => 'Pembelian'],
            ['name' => 'inventory.purchases.cancel', 'display_name' => 'Cancel Purchase', 'description' => 'Dapat cancel purchase order', 'module' => 'Pembelian'],
            ['name' => 'inventory.purchases.receive', 'display_name' => 'Receive Purchase', 'description' => 'Dapat receive barang purchase', 'module' => 'Pembelian'],
            ['name' => 'inventory.purchases.post-to-journal', 'display_name' => 'Post Purchase to Journal', 'description' => 'Dapat posting purchase ke jurnal', 'module' => 'Pembelian'],
            ['name' => 'inventory.purchases.create-payment', 'display_name' => 'Create Purchase Payment', 'description' => 'Dapat membuat pembayaran purchase', 'module' => 'Pembelian'],
            ['name' => 'inventory.purchases.view-ap', 'display_name' => 'View Accounts Payable', 'description' => 'Dapat melihat outstanding accounts payable', 'module' => 'Pembelian'],
            
            // Inventory - Stock Adjustments
            ['name' => 'inventory.stock-adjustments.view', 'display_name' => 'Lihat Stock Adjustment', 'description' => 'Dapat melihat daftar stock adjustment', 'module' => 'Stock Adjustment'],
            ['name' => 'inventory.stock-adjustments.create', 'display_name' => 'Tambah Stock Adjustment', 'description' => 'Dapat menambah stock adjustment', 'module' => 'Stock Adjustment'],
            ['name' => 'inventory.stock-adjustments.edit', 'display_name' => 'Edit Stock Adjustment', 'description' => 'Dapat mengedit stock adjustment', 'module' => 'Stock Adjustment'],
            ['name' => 'inventory.stock-adjustments.delete', 'display_name' => 'Hapus Stock Adjustment', 'description' => 'Dapat menghapus stock adjustment', 'module' => 'Stock Adjustment'],
            ['name' => 'inventory.stock-adjustments.approve', 'display_name' => 'Approve Stock Adjustment', 'description' => 'Dapat approve stock adjustment', 'module' => 'Stock Adjustment'],
            ['name' => 'inventory.stock-adjustments.post-to-journal', 'display_name' => 'Post Stock Adjustment to Journal', 'description' => 'Dapat posting stock adjustment ke jurnal', 'module' => 'Stock Adjustment'],
            
            // Inventory - Stock Transfers
            ['name' => 'inventory.stock-transfers.view', 'display_name' => 'Lihat Stock Transfer', 'description' => 'Dapat melihat daftar stock transfer', 'module' => 'Transfer Stok'],
            ['name' => 'inventory.stock-transfers.create', 'display_name' => 'Tambah Stock Transfer', 'description' => 'Dapat membuat stock transfer', 'module' => 'Transfer Stok'],
            ['name' => 'inventory.stock-transfers.edit', 'display_name' => 'Edit Stock Transfer', 'description' => 'Dapat mengedit stock transfer', 'module' => 'Transfer Stok'],
            ['name' => 'inventory.stock-transfers.delete', 'display_name' => 'Hapus Stock Transfer', 'description' => 'Dapat menghapus stock transfer', 'module' => 'Transfer Stok'],
            ['name' => 'inventory.stock-transfers.approve', 'display_name' => 'Approve Stock Transfer', 'description' => 'Dapat approve stock transfer', 'module' => 'Transfer Stok'],
            ['name' => 'inventory.stock-transfers.receive', 'display_name' => 'Receive Stock Transfer', 'description' => 'Dapat receive stock transfer', 'module' => 'Transfer Stok'],
            
            // Inventory - Stock Requests (Central Warehouse System)
            ['name' => 'inventory.stock-requests.view', 'display_name' => 'Lihat Permintaan Stok', 'description' => 'Dapat melihat daftar permintaan stok', 'module' => 'Permintaan Stok'],
            ['name' => 'inventory.stock-requests.create', 'display_name' => 'Tambah Permintaan Stok', 'description' => 'Dapat membuat permintaan stok baru', 'module' => 'Permintaan Stok'],
            ['name' => 'inventory.stock-requests.edit', 'display_name' => 'Edit Permintaan Stok', 'description' => 'Dapat mengedit permintaan stok', 'module' => 'Permintaan Stok'],
            ['name' => 'inventory.stock-requests.delete', 'display_name' => 'Hapus Permintaan Stok', 'description' => 'Dapat menghapus permintaan stok', 'module' => 'Permintaan Stok'],
            ['name' => 'inventory.stock-requests.submit', 'display_name' => 'Submit Permintaan Stok', 'description' => 'Dapat submit permintaan stok untuk approval', 'module' => 'Permintaan Stok'],
            ['name' => 'inventory.stock-requests.approve', 'display_name' => 'Approve Permintaan Stok', 'description' => 'Dapat approve/reject permintaan stok', 'module' => 'Permintaan Stok'],
            ['name' => 'inventory.stock-requests.complete', 'display_name' => 'Complete Permintaan Stok', 'description' => 'Dapat menyelesaikan permintaan stok (issue items)', 'module' => 'Permintaan Stok'],
            ['name' => 'inventory.stock-requests.cancel', 'display_name' => 'Cancel Permintaan Stok', 'description' => 'Dapat membatalkan permintaan stok', 'module' => 'Permintaan Stok'],
            
            // Inventory - Stock Opname (Physical Stock Count)
            ['name' => 'inventory.stock-opnames.view', 'display_name' => 'Lihat Stock Opname', 'description' => 'Dapat melihat daftar stock opname', 'module' => 'Stock Opname'],
            ['name' => 'inventory.stock-opnames.create', 'display_name' => 'Tambah Stock Opname', 'description' => 'Dapat membuat stock opname baru', 'module' => 'Stock Opname'],
            ['name' => 'inventory.stock-opnames.edit', 'display_name' => 'Edit Stock Opname', 'description' => 'Dapat mengedit stock opname', 'module' => 'Stock Opname'],
            ['name' => 'inventory.stock-opnames.delete', 'display_name' => 'Hapus Stock Opname', 'description' => 'Dapat menghapus stock opname', 'module' => 'Stock Opname'],
            ['name' => 'inventory.stock-opnames.submit', 'display_name' => 'Submit Stock Opname', 'description' => 'Dapat submit stock opname untuk approval', 'module' => 'Stock Opname'],
            ['name' => 'inventory.stock-opnames.approve', 'display_name' => 'Approve Stock Opname', 'description' => 'Dapat approve/reject stock opname', 'module' => 'Stock Opname'],
            ['name' => 'inventory.stock-opnames.update-counts', 'display_name' => 'Update Physical Counts', 'description' => 'Dapat update hasil perhitungan fisik', 'module' => 'Stock Opname'],
            
            // Inventory - Central Warehouse
            ['name' => 'inventory.central-warehouse.view', 'display_name' => 'Lihat Gudang Pusat', 'description' => 'Dapat melihat stok gudang pusat', 'module' => 'Gudang Pusat'],
            
            // Inventory - Department Stocks
            ['name' => 'inventory.department-stocks.view', 'display_name' => 'Lihat Stok Department', 'description' => 'Dapat melihat stok per department', 'module' => 'Stok Department'],
            
            // Inventory - Reports
            ['name' => 'inventory.reports.view', 'display_name' => 'Lihat Laporan Inventory', 'description' => 'Dapat melihat laporan inventory (permintaan stok, pembelian, dll)', 'module' => 'Laporan Inventory'],
            ['name' => 'inventory.reports.export', 'display_name' => 'Export Laporan Inventory', 'description' => 'Dapat export laporan inventory ke Excel/PDF', 'module' => 'Laporan Inventory'],
            
            // Inventory - Requisitions (OLD - Keep for backward compatibility)
            ['name' => 'inventory.requisitions.view', 'display_name' => 'Lihat Requisitions', 'description' => 'Dapat melihat daftar requisitions', 'module' => 'Requisitions (Deprecated)'],
            ['name' => 'inventory.requisitions.create', 'display_name' => 'Tambah Requisitions', 'description' => 'Dapat menambah requisition baru', 'module' => 'Requisitions (Deprecated)'],
            ['name' => 'inventory.requisitions.edit', 'display_name' => 'Edit Requisitions', 'description' => 'Dapat mengedit requisitions', 'module' => 'Requisitions (Deprecated)'],
            ['name' => 'inventory.requisitions.delete', 'display_name' => 'Hapus Requisitions', 'description' => 'Dapat menghapus requisitions', 'module' => 'Requisitions (Deprecated)'],
            ['name' => 'inventory.requisitions.approve', 'display_name' => 'Approve Requisition', 'description' => 'Dapat approve requisition', 'module' => 'Requisitions (Deprecated)'],
            ['name' => 'inventory.requisitions.cancel', 'display_name' => 'Cancel Requisition', 'description' => 'Dapat cancel requisition', 'module' => 'Requisitions (Deprecated)'],
            
            // ========== KAS MODULE ==========
            ['name' => 'kas.view', 'display_name' => 'Lihat Dashboard Kas', 'description' => 'Dapat mengakses dashboard kas', 'module' => 'Kas & Bank - Dashboard'],
            
            // Kas - Cash & Bank Management (Used in routes)
            ['name' => 'kas.cash-management.view', 'display_name' => 'Lihat Cash Management', 'description' => 'Dapat melihat dashboard kas, transaksi kas & bank', 'module' => 'Transaksi Kas & Bank'],
            ['name' => 'kas.cash-management.daily-entry', 'display_name' => 'Entry Transaksi Kas/Bank Harian', 'description' => 'Dapat create/edit transaksi kas dan bank', 'module' => 'Transaksi Kas & Bank'],
            ['name' => 'kas.cash-management.reconcile', 'display_name' => 'Rekonsiliasi Bank', 'description' => 'Dapat melakukan rekonsiliasi bank', 'module' => 'Transaksi Kas & Bank'],
            
            // Kas - Delete Permissions (Separated per transaction type)
            ['name' => 'kas.cash-transaction.delete', 'display_name' => 'Hapus Transaksi Kas', 'description' => 'Dapat menghapus transaksi kas', 'module' => 'Transaksi Kas & Bank'],
            ['name' => 'kas.bank-transaction.delete', 'display_name' => 'Hapus Transaksi Bank', 'description' => 'Dapat menghapus transaksi bank', 'module' => 'Transaksi Kas & Bank'],
            
            // Kas - Bank Account (Master Data)
            ['name' => 'kas.bank-account.view', 'display_name' => 'Lihat Bank Account', 'description' => 'Dapat melihat daftar bank account', 'module' => 'Bank Account'],
            ['name' => 'kas.bank-account.create', 'display_name' => 'Tambah Bank Account', 'description' => 'Dapat menambah bank account', 'module' => 'Bank Account'],
            ['name' => 'kas.bank-account.edit', 'display_name' => 'Edit Bank Account', 'description' => 'Dapat mengedit bank account', 'module' => 'Bank Account'],
            ['name' => 'kas.bank-account.delete', 'display_name' => 'Hapus Bank Account', 'description' => 'Dapat menghapus bank account', 'module' => 'Bank Account'],
            
            // Kas - Giro Transaction
            ['name' => 'kas.giro-transaction.view', 'display_name' => 'Lihat Giro Transaction', 'description' => 'Dapat melihat giro transaction', 'module' => 'Transaksi Giro'],
            ['name' => 'kas.giro-transaction.create', 'display_name' => 'Tambah Giro Transaction', 'description' => 'Dapat menambah giro transaction', 'module' => 'Transaksi Giro'],
            ['name' => 'kas.giro-transaction.edit', 'display_name' => 'Edit Giro Transaction', 'description' => 'Dapat mengedit giro transaction', 'module' => 'Transaksi Giro'],
            ['name' => 'kas.giro-transaction.delete', 'display_name' => 'Hapus Giro Transaction', 'description' => 'Dapat menghapus giro transaction', 'module' => 'Transaksi Giro'],
            ['name' => 'kas.giro-transaction.post', 'display_name' => 'Post Giro Transaction', 'description' => 'Dapat post giro ke bank', 'module' => 'Transaksi Giro'],
            ['name' => 'kas.giro-transaction.clear', 'display_name' => 'Clear Giro Transaction', 'description' => 'Dapat clear/cash giro transaction', 'module' => 'Transaksi Giro'],
            ['name' => 'kas.giro-transaction.reject', 'display_name' => 'Reject Giro Transaction', 'description' => 'Dapat reject/bounce giro transaction', 'module' => 'Transaksi Giro'],
            
            // Kas - Transfer
            ['name' => 'kas.transfer.view', 'display_name' => 'Lihat Transfer', 'description' => 'Dapat melihat transfer', 'module' => 'Transfer Kas & Bank'],
            ['name' => 'kas.transfer.create', 'display_name' => 'Tambah Transfer', 'description' => 'Dapat menambah transfer', 'module' => 'Transfer Kas & Bank'],
            ['name' => 'kas.transfer.edit', 'display_name' => 'Edit Transfer', 'description' => 'Dapat mengedit transfer', 'module' => 'Transfer Kas & Bank'],
            ['name' => 'kas.transfer.delete', 'display_name' => 'Hapus Transfer', 'description' => 'Dapat menghapus transfer', 'module' => 'Transfer Kas & Bank'],
            ['name' => 'kas.transfer.approve', 'display_name' => 'Approve Transfer', 'description' => 'Dapat approve transfer', 'module' => 'Transfer Kas & Bank'],
            ['name' => 'kas.transfer.reverse', 'display_name' => 'Reverse Transfer', 'description' => 'Dapat reverse transfer', 'module' => 'Transfer Kas & Bank'],
            
            // Laporan - Cash Flow
            ['name' => 'laporan.cash-flow.view', 'display_name' => 'Lihat Laporan Arus Kas', 'description' => 'Dapat melihat laporan arus kas', 'module' => 'Laporan'],
            ['name' => 'laporan.cash-flow.export', 'display_name' => 'Export Laporan Arus Kas', 'description' => 'Dapat export laporan arus kas', 'module' => 'Laporan'],
            
            // Laporan - Giro
            ['name' => 'laporan.giro-report.view', 'display_name' => 'Lihat Laporan Giro', 'description' => 'Dapat melihat laporan giro', 'module' => 'Laporan'],
            ['name' => 'laporan.giro-report.export', 'display_name' => 'Export Laporan Giro', 'description' => 'Dapat export laporan giro', 'module' => 'Laporan'],
            
            // ========== ASET MODULE ==========
            ['name' => 'aset.dashboard.view', 'display_name' => 'Lihat Dashboard Aset', 'description' => 'Dapat mengakses dashboard aset', 'module' => 'Aset - Dashboard'],
            ['name' => 'aset.view', 'display_name' => 'Lihat Modul Aset', 'description' => 'Dapat mengakses modul aset', 'module' => 'Aset - Dashboard'],

            // Aset - Kategori
            ['name' => 'aset.categories.view', 'display_name' => 'Lihat Kategori Aset', 'description' => 'Dapat melihat daftar kategori aset', 'module' => 'Aset - Kategori'],
            ['name' => 'aset.categories.create', 'display_name' => 'Tambah Kategori Aset', 'description' => 'Dapat menambah kategori aset baru', 'module' => 'Aset - Kategori'],
            ['name' => 'aset.categories.edit', 'display_name' => 'Edit Kategori Aset', 'description' => 'Dapat mengedit kategori aset', 'module' => 'Aset - Kategori'],
            ['name' => 'aset.categories.delete', 'display_name' => 'Hapus Kategori Aset', 'description' => 'Dapat menghapus kategori aset', 'module' => 'Aset - Kategori'],

            // Aset - Daftar Aset
            ['name' => 'aset.assets.view', 'display_name' => 'Lihat Daftar Aset', 'description' => 'Dapat melihat daftar aset', 'module' => 'Aset - Daftar Aset'],
            ['name' => 'aset.assets.create', 'display_name' => 'Tambah Aset', 'description' => 'Dapat menambah aset baru', 'module' => 'Aset - Daftar Aset'],
            ['name' => 'aset.assets.edit', 'display_name' => 'Edit Aset', 'description' => 'Dapat mengedit data aset', 'module' => 'Aset - Daftar Aset'],
            ['name' => 'aset.assets.delete', 'display_name' => 'Hapus Aset', 'description' => 'Dapat menghapus aset', 'module' => 'Aset - Daftar Aset'],

            // Aset - Penyusutan
            ['name' => 'aset.depreciations.view', 'display_name' => 'Lihat Penyusutan', 'description' => 'Dapat melihat data penyusutan aset', 'module' => 'Aset - Penyusutan'],
            ['name' => 'aset.depreciations.create', 'display_name' => 'Proses Penyusutan', 'description' => 'Dapat menjalankan proses penyusutan bulanan', 'module' => 'Aset - Penyusutan'],

            // Aset - Maintenance
            ['name' => 'aset.maintenances.view', 'display_name' => 'Lihat Maintenance', 'description' => 'Dapat melihat daftar maintenance aset', 'module' => 'Aset - Maintenance'],
            ['name' => 'aset.maintenances.create', 'display_name' => 'Tambah Maintenance', 'description' => 'Dapat menambah maintenance aset', 'module' => 'Aset - Maintenance'],
            ['name' => 'aset.maintenances.edit', 'display_name' => 'Edit Maintenance', 'description' => 'Dapat mengedit maintenance aset', 'module' => 'Aset - Maintenance'],
            ['name' => 'aset.maintenances.delete', 'display_name' => 'Hapus Maintenance', 'description' => 'Dapat menghapus maintenance aset', 'module' => 'Aset - Maintenance'],

            // Aset - Disposal
            ['name' => 'aset.disposals.view', 'display_name' => 'Lihat Disposal', 'description' => 'Dapat melihat daftar disposal aset', 'module' => 'Aset - Disposal'],
            ['name' => 'aset.disposals.create', 'display_name' => 'Tambah Disposal', 'description' => 'Dapat menambah disposal aset', 'module' => 'Aset - Disposal'],
            ['name' => 'aset.disposals.approve', 'display_name' => 'Approve Disposal', 'description' => 'Dapat menyetujui, menyelesaikan, atau membatalkan disposal', 'module' => 'Aset - Disposal'],

            // Aset - Transfer
            ['name' => 'aset.transfers.view', 'display_name' => 'Lihat Transfer Aset', 'description' => 'Dapat melihat daftar transfer aset', 'module' => 'Aset - Transfer'],
            ['name' => 'aset.transfers.create', 'display_name' => 'Tambah Transfer Aset', 'description' => 'Dapat membuat transfer aset antar departemen', 'module' => 'Aset - Transfer'],
            ['name' => 'aset.transfers.approve', 'display_name' => 'Approve Transfer Aset', 'description' => 'Dapat menyetujui, menyelesaikan, atau membatalkan transfer', 'module' => 'Aset - Transfer'],

            // Aset - RAB (Rencana Anggaran Belanja)
            ['name' => 'aset.budgets.view', 'display_name' => 'Lihat RAB Aset', 'description' => 'Dapat melihat daftar RAB aset', 'module' => 'Aset - RAB'],
            ['name' => 'aset.budgets.create', 'display_name' => 'Buat RAB Aset', 'description' => 'Dapat membuat RAB aset baru', 'module' => 'Aset - RAB'],
            ['name' => 'aset.budgets.edit', 'display_name' => 'Edit RAB Aset', 'description' => 'Dapat mengedit RAB aset', 'module' => 'Aset - RAB'],
            ['name' => 'aset.budgets.delete', 'display_name' => 'Hapus RAB Aset', 'description' => 'Dapat menghapus RAB aset', 'module' => 'Aset - RAB'],
            ['name' => 'aset.budgets.submit', 'display_name' => 'Submit RAB Aset', 'description' => 'Dapat mengajukan RAB aset untuk persetujuan', 'module' => 'Aset - RAB'],
            ['name' => 'aset.budgets.approve', 'display_name' => 'Approve RAB Aset', 'description' => 'Dapat menyetujui RAB aset', 'module' => 'Aset - RAB'],
            ['name' => 'aset.budgets.realize', 'display_name' => 'Realisasi RAB Aset', 'description' => 'Dapat melakukan realisasi item RAB aset', 'module' => 'Aset - RAB'],

            // Aset - Laporan
            ['name' => 'aset.reports.view', 'display_name' => 'Lihat Laporan Aset', 'description' => 'Dapat melihat laporan register dan penyusutan aset', 'module' => 'Aset - Laporan'],
            ['name' => 'aset.reports.export', 'display_name' => 'Export Laporan Aset', 'description' => 'Dapat export laporan aset', 'module' => 'Aset - Laporan'],

            // ========== PENGGAJIAN MODULE ==========
            ['name' => 'penggajian.view', 'display_name' => 'Lihat Penggajian', 'description' => 'Dapat melihat daftar batch gaji', 'module' => 'Penggajian'],
            ['name' => 'penggajian.create', 'display_name' => 'Buat Batch Gaji', 'description' => 'Dapat membuat batch gaji baru', 'module' => 'Penggajian'],
            ['name' => 'penggajian.edit', 'display_name' => 'Edit Batch Gaji', 'description' => 'Dapat mengedit batch gaji', 'module' => 'Penggajian'],
            ['name' => 'penggajian.delete', 'display_name' => 'Hapus Batch Gaji', 'description' => 'Dapat menghapus batch gaji', 'module' => 'Penggajian'],
            ['name' => 'penggajian.input-gaji', 'display_name' => 'Input Data Gaji', 'description' => 'Dapat input data gaji karyawan', 'module' => 'Penggajian'],
            ['name' => 'penggajian.post-to-journal', 'display_name' => 'Post Gaji ke Jurnal', 'description' => 'Dapat posting gaji ke jurnal akuntansi', 'module' => 'Penggajian'],
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
