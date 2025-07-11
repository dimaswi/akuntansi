<?php

use App\Models\Kas\CashTransaction;

// Test outgoing transaction
$outgoingTransaction = CashTransaction::create([
    'nomor_transaksi' => 'TK-KELUAR-TEST-001',
    'tanggal_transaksi' => now(),
    'jenis_transaksi' => 'pengeluaran',
    'kategori_transaksi' => 'operasional',
    'jumlah' => 10000000,
    'keterangan' => 'Test pengeluaran kas - should require approval',
    'pihak_terkait' => 'Test Vendor',
    'daftar_akun_kas_id' => 1,
    'daftar_akun_lawan_id' => 2,
    'status' => 'draft',
    'user_id' => 1
]);

echo "OUTGOING TRANSACTION TEST:\n";
echo "Transaction created: " . $outgoingTransaction->nomor_transaksi . "\n";
echo "Transaction type: " . $outgoingTransaction->jenis_transaksi . "\n";
echo "Is outgoing: " . ($outgoingTransaction->isOutgoingTransaction() ? 'YES' : 'NO') . "\n";
echo "Requires approval: " . ($outgoingTransaction->requiresApproval() ? 'YES' : 'NO') . "\n\n";

// Test incoming transaction
$incomingTransaction = CashTransaction::create([
    'nomor_transaksi' => 'TK-MASUK-TEST-001',
    'tanggal_transaksi' => now(),
    'jenis_transaksi' => 'penerimaan',
    'kategori_transaksi' => 'operasional',
    'jumlah' => 10000000,
    'keterangan' => 'Test penerimaan kas - should NOT require approval',
    'pihak_terkait' => 'Test Customer',
    'daftar_akun_kas_id' => 1,
    'daftar_akun_lawan_id' => 2,
    'status' => 'draft',
    'user_id' => 1
]);

echo "INCOMING TRANSACTION TEST:\n";
echo "Transaction created: " . $incomingTransaction->nomor_transaksi . "\n";
echo "Transaction type: " . $incomingTransaction->jenis_transaksi . "\n";
echo "Is outgoing: " . ($incomingTransaction->isOutgoingTransaction() ? 'YES' : 'NO') . "\n";
echo "Requires approval: " . ($incomingTransaction->requiresApproval() ? 'YES' : 'NO') . "\n";
