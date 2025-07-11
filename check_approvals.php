<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Approval;
use App\Models\Kas\CashTransaction;

echo "=== Checking Approval Data ===\n\n";

// Check approvals
$approvals = Approval::with(['approvable', 'requestedBy'])->get();
echo "Total Approvals: " . $approvals->count() . "\n\n";

foreach ($approvals as $approval) {
    echo "Approval ID: " . $approval->id . "\n";
    echo "Type: " . $approval->approval_type . "\n";
    echo "Status: " . $approval->status . "\n";
    echo "Level: " . $approval->approval_level . "\n";
    echo "Required Role: " . $approval->required_role . "\n";
    echo "Requested by: " . ($approval->requestedBy ? $approval->requestedBy->name : 'Unknown') . "\n";
    echo "Approvable: " . $approval->approvable_type . " ID: " . $approval->approvable_id . "\n";
    echo "Notes: " . $approval->notes . "\n";
    echo "Created: " . $approval->created_at . "\n";
    echo "---\n";
}

// Check cash transactions with pending approval
echo "\n=== Cash Transactions with Pending Approval ===\n\n";
$pendingTransactions = CashTransaction::where('status', 'pending_approval')->with(['approvals', 'user'])->get();

foreach ($pendingTransactions as $transaction) {
    echo "Transaction ID: " . $transaction->id . "\n";
    echo "Number: " . $transaction->nomor_transaksi . "\n";
    echo "Amount: " . number_format((float)$transaction->jumlah) . "\n";
    echo "Type: " . $transaction->jenis_transaksi . "\n";
    echo "Status: " . $transaction->status . "\n";
    echo "Description: " . $transaction->keterangan . "\n";
    echo "Approvals count: " . $transaction->approvals->count() . "\n";
    echo "---\n";
}
