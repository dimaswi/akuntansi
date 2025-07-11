<?php

use App\Models\Kas\CashTransaction;
use App\Models\Kas\BankTransaction;
use Carbon\Carbon;

// Create sample cash transactions
$cashTransactions = [
    [
        'nomor_transaksi' => 'KAS-' . now()->format('Ymd') . '-001',
        'tanggal_transaksi' => now(),
        'jenis_transaksi' => 'pengeluaran',
        'jumlah' => 100000,
        'keterangan' => 'Test pengeluaran kas - draft',
        'daftar_akun_kas_id' => 1,
        'daftar_akun_lawan_id' => 2,
        'status' => 'draft',
        'user_id' => 1
    ],
    [
        'nomor_transaksi' => 'KAS-' . now()->format('Ymd') . '-002',
        'tanggal_transaksi' => now(),
        'jenis_transaksi' => 'penerimaan',
        'jumlah' => 200000,
        'keterangan' => 'Test penerimaan kas - pending approval',
        'daftar_akun_kas_id' => 1,
        'daftar_akun_lawan_id' => 3,
        'status' => 'pending_approval',
        'user_id' => 1
    ],
    [
        'nomor_transaksi' => 'KAS-' . now()->format('Ymd') . '-003',
        'tanggal_transaksi' => now(),
        'jenis_transaksi' => 'pengeluaran',
        'jumlah' => 50000,
        'keterangan' => 'Test pengeluaran kas - posted',
        'daftar_akun_kas_id' => 1,
        'daftar_akun_lawan_id' => 4,
        'status' => 'posted',
        'user_id' => 1
    ],
];

foreach ($cashTransactions as $data) {
    CashTransaction::create($data);
    echo "Created cash transaction: " . $data['nomor_transaksi'] . "\n";
}

// Create sample bank transactions
$bankTransactions = [
    [
        'nomor_transaksi' => 'BANK-' . now()->format('Ymd') . '-001',
        'tanggal_transaksi' => now(),
        'jenis_transaksi' => 'pengeluaran',
        'jumlah' => 300000,
        'keterangan' => 'Test pengeluaran bank - draft',
        'bank_account_id' => 1,
        'daftar_akun_lawan_id' => 2,
        'status' => 'draft',
        'user_id' => 1
    ],
    [
        'nomor_transaksi' => 'BANK-' . now()->format('Ymd') . '-002',
        'tanggal_transaksi' => now(),
        'jenis_transaksi' => 'penerimaan',
        'jumlah' => 500000,
        'keterangan' => 'Test penerimaan bank - pending approval',
        'bank_account_id' => 1,
        'daftar_akun_lawan_id' => 3,
        'status' => 'pending_approval',
        'user_id' => 1
    ],
    [
        'nomor_transaksi' => 'BANK-' . now()->format('Ymd') . '-003',
        'tanggal_transaksi' => now(),
        'jenis_transaksi' => 'penerimaan',
        'jumlah' => 150000,
        'keterangan' => 'Test penerimaan bank - posted',
        'bank_account_id' => 1,
        'daftar_akun_lawan_id' => 4,
        'status' => 'posted',
        'user_id' => 1
    ],
];

foreach ($bankTransactions as $data) {
    BankTransaction::create($data);
    echo "Created bank transaction: " . $data['nomor_transaksi'] . "\n";
}

echo "Sample data created successfully!\n";
