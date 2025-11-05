<?php

use App\Http\Controllers\Akuntansi\AkuntansiController;
use App\Http\Controllers\Akuntansi\DaftarAkunController;
use App\Http\Controllers\Akuntansi\JurnalController;
use App\Http\Controllers\Akuntansi\JurnalPenyesuaianController;
use App\Http\Controllers\Akuntansi\BukuBesarController;
use App\Http\Controllers\Akuntansi\LaporanKeuanganController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    
    // Akuntansi Dashboard
    Route::get('akuntansi', [AkuntansiController::class, 'index'])
        ->name('akuntansi.index')
        ->middleware('permission:akuntansi.view');
    
    // Daftar Akun Management
    Route::get('akuntansi/daftar-akun', [DaftarAkunController::class, 'index'])
        ->name('akuntansi.daftar-akun.index')
        ->middleware('permission:akuntansi.daftar-akun.view');
    
    Route::get('akuntansi/daftar-akun/create', [DaftarAkunController::class, 'create'])
        ->name('akuntansi.daftar-akun.create')
        ->middleware('permission:akuntansi.daftar-akun.create');
    
    Route::post('akuntansi/daftar-akun', [DaftarAkunController::class, 'store'])
        ->name('akuntansi.daftar-akun.store')
        ->middleware('permission:akuntansi.daftar-akun.create');
    
    Route::get('akuntansi/daftar-akun/{daftarAkun}', [DaftarAkunController::class, 'show'])
        ->name('akuntansi.daftar-akun.show')
        ->middleware('permission:akuntansi.daftar-akun.view');
    
    Route::get('akuntansi/daftar-akun/{daftarAkun}/edit', [DaftarAkunController::class, 'edit'])
        ->name('akuntansi.daftar-akun.edit')
        ->middleware('permission:akuntansi.daftar-akun.edit');
    
    Route::put('akuntansi/daftar-akun/{daftarAkun}', [DaftarAkunController::class, 'update'])
        ->name('akuntansi.daftar-akun.update')
        ->middleware('permission:akuntansi.daftar-akun.edit');
    
    Route::delete('akuntansi/daftar-akun/{daftarAkun}', [DaftarAkunController::class, 'destroy'])
        ->name('akuntansi.daftar-akun.destroy')
        ->middleware('permission:akuntansi.daftar-akun.delete');

    // Jurnal Management
    Route::get('akuntansi/jurnal', [JurnalController::class, 'index'])
        ->name('akuntansi.jurnal.index')
        ->middleware('permission:akuntansi.jurnal.view');
    
    Route::get('akuntansi/jurnal/create', [JurnalController::class, 'create'])
        ->name('akuntansi.jurnal.create')
        ->middleware('permission:akuntansi.jurnal.create');
    
    Route::post('akuntansi/jurnal', [JurnalController::class, 'store'])
        ->name('akuntansi.jurnal.store')
        ->middleware('permission:akuntansi.jurnal.create');
    
    Route::get('akuntansi/jurnal/{jurnal}', [JurnalController::class, 'show'])
        ->name('akuntansi.jurnal.show')
        ->middleware('permission:akuntansi.jurnal.view');
    
    Route::get('akuntansi/jurnal/{jurnal}/edit', [JurnalController::class, 'edit'])
        ->name('akuntansi.jurnal.edit')
        ->middleware('permission:akuntansi.jurnal.edit');
    
    Route::put('akuntansi/jurnal/{jurnal}', [JurnalController::class, 'update'])
        ->name('akuntansi.jurnal.update')
        ->middleware(['permission:akuntansi.jurnal.edit', 'check.period']);
    
    Route::delete('akuntansi/jurnal/{jurnal}', [JurnalController::class, 'destroy'])
        ->name('akuntansi.jurnal.destroy')
        ->middleware(['permission:akuntansi.jurnal.delete', 'check.period']);

    // Jurnal Actions
    Route::post('akuntansi/jurnal/{jurnal}/post', [JurnalController::class, 'post'])
        ->name('akuntansi.jurnal.post')
        ->middleware('permission:akuntansi.jurnal.post');
    
    Route::post('akuntansi/jurnal/{jurnal}/unpost', [JurnalController::class, 'unpost'])
        ->name('akuntansi.jurnal.unpost')
        ->middleware(['permission:akuntansi.jurnal.edit', 'check.period']);
    
    Route::post('akuntansi/jurnal/{jurnal}/reverse', [JurnalController::class, 'reverse'])
        ->name('akuntansi.jurnal.reverse')
        ->middleware(['permission:akuntansi.jurnal.reverse', 'check.period']);

    // Jurnal Penyesuaian Management
    Route::get('akuntansi/jurnal-penyesuaian', [JurnalPenyesuaianController::class, 'index'])
        ->name('akuntansi.jurnal-penyesuaian.index')
        ->middleware('permission:akuntansi.jurnal-penyesuaian.view');
    
    Route::get('akuntansi/jurnal-penyesuaian/create', [JurnalPenyesuaianController::class, 'create'])
        ->name('akuntansi.jurnal-penyesuaian.create')
        ->middleware('permission:akuntansi.jurnal-penyesuaian.create');
    
    Route::post('akuntansi/jurnal-penyesuaian', [JurnalPenyesuaianController::class, 'store'])
        ->name('akuntansi.jurnal-penyesuaian.store')
        ->middleware('permission:akuntansi.jurnal-penyesuaian.create');
    
    Route::get('akuntansi/jurnal-penyesuaian/{jurnalPenyesuaian}', [JurnalPenyesuaianController::class, 'show'])
        ->name('akuntansi.jurnal-penyesuaian.show')
        ->middleware('permission:akuntansi.jurnal-penyesuaian.view');
    
    Route::get('akuntansi/jurnal-penyesuaian/{jurnalPenyesuaian}/edit', [JurnalPenyesuaianController::class, 'edit'])
        ->name('akuntansi.jurnal-penyesuaian.edit')
        ->middleware('permission:akuntansi.jurnal-penyesuaian.edit');
    
    Route::put('akuntansi/jurnal-penyesuaian/{jurnalPenyesuaian}', [JurnalPenyesuaianController::class, 'update'])
        ->name('akuntansi.jurnal-penyesuaian.update')
        ->middleware(['permission:akuntansi.jurnal-penyesuaian.edit', 'check.period']);
    
    Route::delete('akuntansi/jurnal-penyesuaian/{jurnalPenyesuaian}', [JurnalPenyesuaianController::class, 'destroy'])
        ->name('akuntansi.jurnal-penyesuaian.destroy')
        ->middleware(['permission:akuntansi.jurnal-penyesuaian.delete', 'check.period']);
    
    Route::post('akuntansi/jurnal-penyesuaian/{jurnalPenyesuaian}/post', [JurnalPenyesuaianController::class, 'post'])
        ->name('akuntansi.jurnal-penyesuaian.post')
        ->middleware('permission:akuntansi.jurnal-penyesuaian.edit');
    
    Route::post('akuntansi/jurnal-penyesuaian/{jurnalPenyesuaian}/unpost', [JurnalPenyesuaianController::class, 'unpost'])
        ->name('akuntansi.jurnal-penyesuaian.unpost')
        ->middleware(['permission:akuntansi.jurnal-penyesuaian.edit', 'check.period']);
    
    Route::post('akuntansi/jurnal-penyesuaian/{jurnalPenyesuaian}/reverse', [JurnalPenyesuaianController::class, 'reverse'])
        ->name('akuntansi.jurnal-penyesuaian.reverse')
        ->middleware(['permission:akuntansi.jurnal-penyesuaian.edit', 'check.period']);

    // Buku Besar Management
    Route::get('akuntansi/buku-besar', [BukuBesarController::class, 'index'])
        ->name('akuntansi.buku-besar.index')
        ->middleware('permission:akuntansi.buku-besar.view');
    
    Route::get('akuntansi/buku-besar/{akunId}', [BukuBesarController::class, 'show'])
        ->name('akuntansi.buku-besar.show')
        ->middleware('permission:akuntansi.buku-besar.view');
    
    Route::get('akuntansi/buku-besar/export', [BukuBesarController::class, 'export'])
        ->name('akuntansi.buku-besar.export')
        ->middleware('permission:akuntansi.buku-besar.export');

    // Laporan Keuangan
    Route::get('akuntansi/laporan', [LaporanKeuanganController::class, 'index'])
        ->name('akuntansi.laporan.index')
        ->middleware('permission:akuntansi.laporan.view');
    
    Route::get('akuntansi/laporan/neraca', [LaporanKeuanganController::class, 'neraca'])
        ->name('akuntansi.laporan.neraca')
        ->middleware('permission:akuntansi.laporan.view');
    
    Route::get('akuntansi/laporan/laba-rugi', [LaporanKeuanganController::class, 'labaRugi'])
        ->name('akuntansi.laporan.laba-rugi')
        ->middleware('permission:akuntansi.laporan.view');
    
    Route::get('akuntansi/laporan/arus-kas', [LaporanKeuanganController::class, 'arusKas'])
        ->name('akuntansi.laporan.arus-kas')
        ->middleware('permission:akuntansi.laporan.view');
    
    Route::get('akuntansi/laporan/perubahan-modal', [LaporanKeuanganController::class, 'perubahanModal'])
        ->name('akuntansi.laporan.perubahan-modal')
        ->middleware('permission:akuntansi.laporan.view');
    
    Route::get('akuntansi/laporan/analisis-rasio', [LaporanKeuanganController::class, 'analisisRasio'])
        ->name('akuntansi.laporan.analisis-rasio')
        ->middleware('permission:akuntansi.laporan.view');
    
    Route::get('akuntansi/laporan/dampak-penyesuaian', [LaporanKeuanganController::class, 'dampakPenyesuaian'])
        ->name('akuntansi.laporan.dampak-penyesuaian')
        ->middleware('permission:akuntansi.laporan.view');
    
    Route::get('akuntansi/laporan/export', [LaporanKeuanganController::class, 'export'])
        ->name('akuntansi.laporan.export')
        ->middleware('permission:akuntansi.laporan.export');

});
