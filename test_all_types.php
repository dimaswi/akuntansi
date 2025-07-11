<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Models\Kas\CashTransaction;
use App\Models\Akuntansi\DaftarAkun;
use Illuminate\Support\Facades\Auth;

echo "=== Testing Approval for All Transaction Types ===\n\n";

$user = User::first();
$kasAkun = DaftarAkun::where('nama_akun', 'like', '%kas%')->first();

if (!$user || !$kasAkun) {
    echo "Missing required data\n";
    exit;
}

Auth::loginUsingId($user->id);

$testCases = [
    [
        'jenis' => 'penerimaan',
        'jumlah' => 1500000,
        'keterangan' => 'Test penerimaan kas besar',
        'expected' => 'YES'
    ],
    [
        'jenis' => 'pengeluaran', 
        'jumlah' => 1500000,
        'keterangan' => 'Test pengeluaran kas besar',
        'expected' => 'YES'
    ],
    [
        'jenis' => 'penerimaan',
        'jumlah' => 2000000,
        'keterangan' => 'Test penerimaan kas 2 juta',
        'expected' => 'YES'
    ],
    [
        'jenis' => 'pengeluaran',
        'jumlah' => 2500000,
        'keterangan' => 'Test pengeluaran kas 2.5 juta',
        'expected' => 'YES'
    ],
    [
        'jenis' => 'penerimaan',
        'jumlah' => 1800000,
        'keterangan' => 'Test penerimaan kas 1.8 juta',
        'expected' => 'YES'
    ],
    [
        'jenis' => 'pengeluaran',
        'jumlah' => 1200000,
        'keterangan' => 'Test pengeluaran kas 1.2 juta',
        'expected' => 'YES'
    ],
    [
        'jenis' => 'penerimaan',
        'jumlah' => 800000,
        'keterangan' => 'Test penerimaan kas kecil',
        'expected' => 'NO'
    ],
    [
        'jenis' => 'pengeluaran',
        'jumlah' => 500000,
        'keterangan' => 'Test pengeluaran kas kecil',
        'expected' => 'NO'
    ]
];

$counter = 1;
foreach ($testCases as $case) {
    echo "Test Case {$counter}: {$case['jenis']} - " . number_format($case['jumlah']) . "\n";
    
    $transaction = new CashTransaction([
        'tanggal_transaksi' => today(),
        'jenis_transaksi' => $case['jenis'],
        'kategori_transaksi' => 'Test',
        'jumlah' => $case['jumlah'],
        'keterangan' => $case['keterangan'],
        'daftar_akun_kas_id' => $kasAkun->id
    ]);
    
    $transaction->user_id = $user->id;
    $transaction->status = 'draft';
    $transaction->nomor_transaksi = 'TEST-' . $counter . '-' . time();
    $transaction->save();
    
    $requiresApproval = $transaction->requiresApproval();
    $result = $requiresApproval ? 'YES' : 'NO';
    $status = ($result === $case['expected']) ? '✅ PASS' : '❌ FAIL';
    
    echo "   Requires Approval: {$result} (Expected: {$case['expected']}) {$status}\n";
    
    if ($requiresApproval) {
        $approval = $transaction->requestApproval($user, 'transaction', 'Test approval');
        if ($approval) {
            $transaction->update(['status' => 'pending_approval']);
            echo "   → Created approval ID: {$approval->id}, Status: pending_approval\n";
        }
    }
    
    echo "\n";
    $counter++;
}

echo "=== Summary ===\n";
$totalApprovals = \App\Models\Approval::count();
$pendingTransactions = CashTransaction::where('status', 'pending_approval')->count();

echo "Total Approvals in DB: {$totalApprovals}\n";
echo "Pending Transactions: {$pendingTransactions}\n";
