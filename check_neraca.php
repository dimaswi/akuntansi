<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->boot();

echo "=== ANALISIS NERACA ===\n\n";

// 1. Cek akun ekuitas
echo "1. AKUN EKUITAS:\n";
$akunEkuitas = App\Models\Akuntansi\DaftarAkun::where('jenis_akun', 'ekuitas')->get();
foreach ($akunEkuitas as $akun) {
    echo "- {$akun->kode_akun}: {$akun->nama_akun}\n";
}

echo "\n2. AKUN PENDAPATAN:\n";
$akunPendapatan = App\Models\Akuntansi\DaftarAkun::where('jenis_akun', 'pendapatan')->get();
foreach ($akunPendapatan as $akun) {
    echo "- {$akun->kode_akun}: {$akun->nama_akun}\n";
}

echo "\n3. AKUN BEBAN:\n";
$akunBeban = App\Models\Akuntansi\DaftarAkun::where('jenis_akun', 'beban')->get();
foreach ($akunBeban as $akun) {
    echo "- {$akun->kode_akun}: {$akun->nama_akun}\n";
}

// Test perhitungan laba rugi berjalan
echo "\n4. TEST PERHITUNGAN LABA RUGI BERJALAN:\n";
$tanggal = now();

$totalPendapatan = 0;
$totalBeban = 0;

foreach ($akunPendapatan as $akun) {
    $transaksi = App\Models\Akuntansi\DetailJurnal::where('daftar_akun_id', $akun->id)
        ->whereHas('jurnal', function($query) use ($tanggal) {
            $query->where('tanggal_transaksi', '<=', $tanggal)
                  ->where('status', 'posted');
        })
        ->get();
    $saldoPendapatan = $transaksi->sum('jumlah_kredit') - $transaksi->sum('jumlah_debit');
    $totalPendapatan += $saldoPendapatan;
    if ($saldoPendapatan != 0) {
        echo "Pendapatan {$akun->nama_akun}: " . number_format($saldoPendapatan) . "\n";
    }
}

foreach ($akunBeban as $akun) {
    $transaksi = App\Models\Akuntansi\DetailJurnal::where('daftar_akun_id', $akun->id)
        ->whereHas('jurnal', function($query) use ($tanggal) {
            $query->where('tanggal_transaksi', '<=', $tanggal)
                  ->where('status', 'posted');
        })
        ->get();
    $saldoBeban = $transaksi->sum('jumlah_debit') - $transaksi->sum('jumlah_kredit');
    $totalBeban += $saldoBeban;
    if ($saldoBeban != 0) {
        echo "Beban {$akun->nama_akun}: " . number_format($saldoBeban) . "\n";
    }
}

echo "\nTotal Pendapatan: " . number_format($totalPendapatan) . "\n";
echo "Total Beban: " . number_format($totalBeban) . "\n";
echo "Laba/Rugi Berjalan: " . number_format($totalPendapatan - $totalBeban) . "\n";
