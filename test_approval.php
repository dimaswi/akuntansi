<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Models\Kas\CashTransaction;
use App\Models\Akuntansi\DaftarAkun;
use App\Models\ApprovalRule;
use Illuminate\Support\Facades\Auth;

echo "=== Testing Approval System ===\n\n";

// 1. Check if we have users
$user = User::first();
echo "1. User check: " . ($user ? $user->name : 'NO USERS FOUND') . "\n";

// 2. Check if we have kas akun
$kasAkun = DaftarAkun::where('nama_akun', 'like', '%kas%')->first();
echo "2. Kas Akun: " . ($kasAkun ? $kasAkun->nama_akun : 'NO KAS ACCOUNT FOUND') . "\n";

// 3. Check approval rules
$rules = ApprovalRule::where('entity_type', 'cash_transaction')->get();
echo "3. Approval Rules for cash_transaction: " . $rules->count() . "\n";
foreach ($rules as $rule) {
    echo "   - " . $rule->approval_type . " threshold: " . number_format((float)$rule->min_amount) . "\n";
}

if (!$user || !$kasAkun) {
    echo "\nCannot proceed with test - missing required data\n";
    exit;
}

// 4. Test creating a transaction that should require approval
echo "\n4. Creating test transaction...\n";

// Set authenticated user
Auth::loginUsingId($user->id);

$transaction = new CashTransaction([
    'tanggal_transaksi' => today(),
    'jenis_transaksi' => 'pengeluaran',
    'kategori_transaksi' => 'Operasional',
    'jumlah' => 1500000, // 1.5 million - should require approval
    'keterangan' => 'Test pengeluaran kas untuk approval system',
    'pihak_terkait' => 'Test Vendor',
    'daftar_akun_kas_id' => $kasAkun->id
]);

$transaction->user_id = $user->id;
$transaction->status = 'draft';
$transaction->nomor_transaksi = 'TEST-' . time();
$transaction->save();

echo "   Transaction created with ID: " . $transaction->id . "\n";

// 5. Test if it requires approval
$requiresApproval = $transaction->requiresApproval();
echo "5. Requires approval: " . ($requiresApproval ? 'YES' : 'NO') . "\n";

if ($requiresApproval) {
    // 6. Request approval
    echo "6. Requesting approval...\n";
    $approval = $transaction->requestApproval($user, 'transaction', 'Test approval request');
    
    if ($approval) {
        echo "   Approval created with ID: " . $approval->id . "\n";
        
        // Update transaction status
        $transaction->update(['status' => 'pending_approval']);
        echo "   Transaction status updated to: " . $transaction->status . "\n";
        
        // Check if approval exists in database
        $approvalCount = \App\Models\Approval::where('approvable_id', $transaction->id)
            ->where('approvable_type', 'App\Models\Kas\CashTransaction')
            ->count();
        echo "   Approvals in database: " . $approvalCount . "\n";
        
    } else {
        echo "   ERROR: Failed to create approval\n";
    }
} else {
    echo "6. No approval needed for this transaction\n";
}

echo "\n=== Test Complete ===\n";
