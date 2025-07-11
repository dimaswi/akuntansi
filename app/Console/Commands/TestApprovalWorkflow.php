<?php

namespace App\Console\Commands;

use App\Models\Kas\CashTransaction;
use App\Models\User;
use Illuminate\Console\Command;

class TestApprovalWorkflow extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'approval:test';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test approval workflow system';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Testing Approval Workflow System...');
        
        // Get or create a test transaction
        $transaction = CashTransaction::where('nomor_transaksi', 'TK-TEST-001')->first();
        if (!$transaction) {
            $transaction = CashTransaction::create([
                'nomor_transaksi' => 'TK-TEST-001',
                'tanggal_transaksi' => now(),
                'jenis_transaksi' => 'pengeluaran',
                'kategori_transaksi' => 'operasional',
                'jumlah' => 10000000, // 10 juta
                'keterangan' => 'Test transaction for approval system',
                'pihak_terkait' => 'Test Vendor',
                'daftar_akun_kas_id' => 1,
                'daftar_akun_lawan_id' => 2,
                'status' => 'draft',
                'user_id' => 1
            ]);
            $this->info('Created test transaction: ' . $transaction->nomor_transaksi);
        }

        $user = User::first();
        if (!$user) {
            $this->error('No user found in database');
            return 1;
        }

        // Test if approval is required
        $this->info('Testing approval requirement...');
        if ($transaction->requiresApproval()) {
            $this->info('✓ Approval required for transaction: ' . $transaction->nomor_transaksi);
            $this->info('  Amount: Rp ' . number_format((float)$transaction->jumlah, 0, ',', '.'));
            
            // Request approval
            $approval = $transaction->requestApproval($user, 'transaction', 'Test approval request via command');
            
            if ($approval) {
                $this->info('✓ Approval request created successfully!');
                $this->info('  Approval ID: ' . $approval->id);
                $this->info('  Status: ' . $approval->status);
                $this->info('  Amount: Rp ' . number_format((float)$approval->amount, 0, ',', '.'));
                $this->info('  Expires: ' . $approval->expires_at);
                $this->info('  Requested by: ' . $approval->requestedBy->name);
                
                return 0;
            } else {
                $this->error('✗ Failed to create approval request');
                return 1;
            }
        } else {
            $this->warn('No approval required for this transaction amount');
            return 0;
        }
    }
}
