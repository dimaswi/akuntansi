<?php

namespace App\Services\Inventory;

use App\Models\Inventory\Purchase;
use App\Models\Inventory\PurchasePayment;
use App\Models\Inventory\InventoryTransaction;
use App\Models\Akuntansi\Jurnal;
use App\Models\Akuntansi\DetailJurnal;
use App\Models\Akuntansi\DaftarAkun;
use App\Services\NotificationService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class InventoryAccountingService
{
    // Notification types for inventory accounting
    const TYPE_PURCHASE_POSTED = 'purchase_posted_to_jurnal';
    const TYPE_PAYMENT_CREATED = 'purchase_payment_created';
    const TYPE_PURCHASE_APPROVED = 'purchase_approved';
    const TYPE_PURCHASE_OUTSTANDING = 'purchase_outstanding_reminder';

    protected NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }
    /**
     * Post Purchase Order ke Jurnal saat Approved
     * 
     * Jurnal Entry:
     * Dr. Inventory (atau Expense)  xxx
     *     Cr. Accounts Payable           xxx
     */
    public function postPurchaseToJournal(Purchase $purchase, int $userId): Jurnal
    {
        if ($purchase->jurnal_posted) {
            throw new \Exception('Purchase sudah di-post ke jurnal.');
        }

        if ($purchase->status !== 'approved') {
            throw new \Exception('Hanya purchase dengan status approved yang bisa di-post.');
        }

        return DB::transaction(function() use ($purchase, $userId) {
            // Generate nomor jurnal dari nomor purchase
            // Format: JPO dari nomor PO-YYYY-MM-XXXX menjadi JPO/YYYY/MM/XXXX
            $nomorJurnal = str_replace('PO-', 'JPO/', $purchase->purchase_number);
            $nomorJurnal = str_replace('-', '/', $nomorJurnal);
            
            // Hitung total
            $totalAmount = $purchase->total_amount;
            
            // Create Jurnal Header
            $jurnal = Jurnal::create([
                'nomor_jurnal' => $nomorJurnal,
                'tanggal_transaksi' => $purchase->purchase_date,
                'jenis_referensi' => 'purchase_order',
                'nomor_referensi' => $purchase->purchase_number,
                'jenis_jurnal' => 'umum',
                'keterangan' => "Purchase Order {$purchase->purchase_number} dari {$purchase->supplier->name}",
                'total_debit' => $totalAmount,
                'total_kredit' => $totalAmount,
                'status' => 'posted',
                'dibuat_oleh' => $userId,
                'diposting_oleh' => $userId,
                'tanggal_posting' => now(),
            ]);

            // Create Jurnal Details
            // DEBIT SIDE - Inventory/Expense per item
            foreach ($purchase->items as $item) {
                $subtotal = $item->quantity_ordered * $item->unit_price;
                
                // Tentukan account berdasarkan allocation type
                $debitAccountId = $item->allocation_type === 'expense' 
                    ? $item->expense_account_id 
                    : $item->inventory_account_id;
                
                if (!$debitAccountId) {
                    // Default ke Inventory account
                    $debitAccountId = $this->getDefaultInventoryAccount($item->item->category_id ?? null);
                }
                
                DetailJurnal::create([
                    'jurnal_id' => $jurnal->id,
                    'daftar_akun_id' => $debitAccountId,
                    'keterangan' => "{$item->item->name} - Qty: {$item->quantity_ordered}",
                    'jumlah_debit' => $subtotal,
                    'jumlah_kredit' => 0,
                ]);
            }

            // CREDIT SIDE - Accounts Payable
            $apAccountId = $this->getDefaultAccountsPayableAccount($purchase->supplier_id);
            
            DetailJurnal::create([
                'jurnal_id' => $jurnal->id,
                'daftar_akun_id' => $apAccountId,
                'keterangan' => "Utang kepada {$purchase->supplier->name}",
                'jumlah_debit' => 0,
                'jumlah_kredit' => $totalAmount,
            ]);

            // Update Purchase
            $purchase->update([
                'jurnal_id' => $jurnal->id,
                'jurnal_posted' => true,
                'jurnal_posted_at' => now(),
                'ap_account_id' => $apAccountId,
                'ap_amount' => $totalAmount,
                'ap_outstanding' => $totalAmount,
            ]);

            Log::info("Purchase {$purchase->purchase_number} posted to journal {$jurnal->nomor_jurnal}");

            // Send notifications
            $this->sendPurchasePostedNotification($purchase, $jurnal, $userId);

            return $jurnal;
        });
    }

    /**
     * Generate journal preview without saving to database
     */
    public function generateJournalPreview(Purchase $purchase): array
    {
        $nomorJurnal = $this->generateJournalNumber() . ' (Preview)';
        $totalAmount = $purchase->total_amount;
        
        $details = [];
        
        // DEBIT SIDE - Inventory/Expense per item
        foreach ($purchase->items as $item) {
            $subtotal = $item->quantity_ordered * $item->unit_price;
            
            // Tentukan account berdasarkan allocation type
            $debitAccountId = $item->allocation_type === 'expense' 
                ? $item->expense_account_id 
                : $item->inventory_account_id;
            
            if (!$debitAccountId) {
                // Default ke Inventory account
                $debitAccountId = $this->getDefaultInventoryAccount($item->item->category_id ?? null);
            }
            
            $account = DaftarAkun::find($debitAccountId);
            
            $details[] = [
                'account_code' => $account->kode_akun,
                'account_name' => $account->nama_akun,
                'description' => "{$item->item->name} - Qty: {$item->quantity_ordered}",
                'debit' => $subtotal,
                'credit' => 0,
            ];
        }
        
        // CREDIT SIDE - Accounts Payable
        $apAccountId = $this->getDefaultAccountsPayableAccount($purchase->supplier_id);
        $apAccount = DaftarAkun::find($apAccountId);
        
        $details[] = [
            'account_code' => $apAccount->kode_akun,
            'account_name' => $apAccount->nama_akun,
            'description' => "Utang kepada {$purchase->supplier->name}",
            'debit' => 0,
            'credit' => $totalAmount,
        ];
        
        return [
            'jurnal_number' => $nomorJurnal,
            'transaction_date' => $purchase->purchase_date,
            'total_debit' => $totalAmount,
            'total_kredit' => $totalAmount,
            'details' => $details,
        ];
    }

    /**
     * Post Purchase Order ke Jurnal dengan detail dari user (seperti kas)
     */
    public function postPurchaseToJournalWithDetail(Purchase $purchase, array $detailJurnal, int $userId): Jurnal
    {
        if ($purchase->jurnal_posted) {
            throw new \Exception('Purchase sudah di-post ke jurnal.');
        }

        if ($purchase->status !== 'approved') {
            throw new \Exception('Hanya purchase dengan status approved yang bisa di-post.');
        }

        return DB::transaction(function() use ($purchase, $detailJurnal, $userId) {
            // Generate nomor jurnal dari nomor purchase
            // Format: JPO dari nomor PO-YYYY-MM-XXXX menjadi JPO/YYYY/MM/XXXX
            $nomorJurnal = str_replace('PO-', 'JPO/', $purchase->purchase_number);
            $nomorJurnal = str_replace('-', '/', $nomorJurnal);
            
            // Hitung total dari detail yang diinput user
            $totalDebit = collect($detailJurnal)->sum('jumlah_debit');
            $totalKredit = collect($detailJurnal)->sum('jumlah_kredit');
            
            // Create Jurnal Header
            $jurnal = Jurnal::create([
                'nomor_jurnal' => $nomorJurnal,
                'tanggal_transaksi' => $purchase->purchase_date,
                'jenis_referensi' => 'purchase_order',
                'nomor_referensi' => $purchase->purchase_number,
                'jenis_jurnal' => 'umum',
                'keterangan' => "Purchase Order {$purchase->purchase_number} dari {$purchase->supplier->name}",
                'total_debit' => $totalDebit,
                'total_kredit' => $totalKredit,
                'status' => 'posted',
                'dibuat_oleh' => $userId,
                'diposting_oleh' => $userId,
                'tanggal_posting' => now(),
            ]);

            // Cari AP account dari detail kredit (biasanya yang paling besar)
            $apAccountId = null;
            foreach ($detailJurnal as $detail) {
                DetailJurnal::create([
                    'jurnal_id' => $jurnal->id,
                    'daftar_akun_id' => $detail['daftar_akun_id'],
                    'keterangan' => $detail['keterangan'],
                    'jumlah_debit' => $detail['jumlah_debit'],
                    'jumlah_kredit' => $detail['jumlah_kredit'],
                ]);

                // Simpan AP account (yang kredit terbesar, biasanya AP)
                if ($detail['jumlah_kredit'] > 0 && $detail['jumlah_kredit'] >= $purchase->total_amount * 0.9) {
                    $apAccountId = $detail['daftar_akun_id'];
                }
            }

            // Jika AP account tidak ditemukan, gunakan default
            if (!$apAccountId) {
                $apAccountId = $this->getDefaultAccountsPayableAccount($purchase->supplier_id);
            }

            // Update Purchase
            $purchase->update([
                'jurnal_id' => $jurnal->id,
                'jurnal_posted' => true,
                'jurnal_posted_at' => now(),
                'ap_account_id' => $apAccountId,
                'ap_amount' => $purchase->total_amount,
                'ap_outstanding' => $purchase->total_amount,
            ]);

            Log::info("Purchase {$purchase->purchase_number} posted to journal {$jurnal->nomor_jurnal} with user-defined details");

            // Send notifications
            $this->sendPurchasePostedNotification($purchase, $jurnal, $userId);

            return $jurnal;
        });
    }

    /**
     * Post Payment ke Jurnal
     * 
     * Jurnal Entry:
     * Dr. Accounts Payable    xxx
     *     Cr. Cash/Bank           xxx
     *     Cr. Discount Received   xxx (if any)
     */
    public function postPaymentToJournal(PurchasePayment $payment, int $userId): Jurnal
    {
        if ($payment->jurnal_posted) {
            throw new \Exception('Payment sudah di-post ke jurnal.');
        }

        return DB::transaction(function() use ($payment, $userId) {
            $purchase = $payment->purchase;
            
            // Generate nomor jurnal dari nomor payment
            // Format: JPY dari nomor PAY-YYYY-MM-XXXX menjadi JPY/YYYY/MM/XXXX
            $nomorJurnal = str_replace('PAY-', 'JPY/', $payment->payment_number);
            $nomorJurnal = str_replace('-', '/', $nomorJurnal);
            
            $totalAmount = $payment->amount;
            $totalWithDiscount = $payment->amount - $payment->discount_amount;
            
            // Create Jurnal Header
            $jurnal = Jurnal::create([
                'nomor_jurnal' => $nomorJurnal,
                'tanggal_transaksi' => $payment->payment_date,
                'jenis_referensi' => 'purchase_payment',
                'nomor_referensi' => $payment->payment_number,
                'jenis_jurnal' => 'pengeluaran_kas',
                'keterangan' => "Pembayaran PO {$purchase->purchase_number} kepada {$purchase->supplier->name}",
                'total_debit' => $totalAmount,
                'total_kredit' => $totalAmount,
                'status' => 'posted',
                'dibuat_oleh' => $userId,
                'diposting_oleh' => $userId,
                'tanggal_posting' => now(),
            ]);

            // DEBIT - Accounts Payable
            DetailJurnal::create([
                'jurnal_id' => $jurnal->id,
                'daftar_akun_id' => $purchase->ap_account_id,
                'keterangan' => "Pembayaran utang {$purchase->supplier->name}",
                'jumlah_debit' => $totalAmount,
                'jumlah_kredit' => 0,
            ]);

            // CREDIT - Cash/Bank
            $creditAccountId = $this->getCashOrBankAccount($payment);
            
            DetailJurnal::create([
                'jurnal_id' => $jurnal->id,
                'daftar_akun_id' => $creditAccountId,
                'keterangan' => "Pembayaran via {$payment->payment_method}",
                'jumlah_debit' => 0,
                'jumlah_kredit' => $totalWithDiscount,
            ]);

            // If ada discount
            if ($payment->discount_amount > 0) {
                $discountAccountId = $this->getDiscountReceivedAccount();
                
                DetailJurnal::create([
                    'jurnal_id' => $jurnal->id,
                    'daftar_akun_id' => $discountAccountId,
                    'keterangan' => "Diskon pembayaran",
                    'jumlah_debit' => 0,
                    'jumlah_kredit' => $payment->discount_amount,
                ]);
            }

            // Update Payment
            $payment->update([
                'jurnal_id' => $jurnal->id,
                'jurnal_posted' => true,
            ]);

            // Update Purchase AP balance
            $purchase->increment('ap_paid_amount', $totalAmount);
            $purchase->decrement('ap_outstanding', $totalAmount);

            Log::info("Payment {$payment->payment_number} posted to journal {$jurnal->nomor_jurnal}");

            // Send notifications
            $this->sendPaymentCreatedNotification($payment, $jurnal, $userId);

            return $jurnal;
        });
    }

    /**
     * Create Inventory Transaction saat item received
     */
    public function createInventoryTransaction(Purchase $purchase, $item, int $userId): InventoryTransaction
    {
        return DB::transaction(function() use ($purchase, $item, $userId) {
            $transactionNumber = InventoryTransaction::generateTransactionNumber('RCV');
            
            $transaction = InventoryTransaction::create([
                'transaction_number' => $transactionNumber,
                'transaction_date' => $purchase->actual_delivery_date ?? now(),
                'transaction_type' => 'purchase_receive',
                'item_id' => $item->item_id,
                'department_id' => $purchase->department_id,
                'quantity' => $item->quantity_received,
                'unit_cost' => $item->unit_price,
                'total_cost' => $item->quantity_received * $item->unit_price,
                'reference_type' => 'purchase',
                'reference_id' => $purchase->id,
                'balance_before' => $this->getCurrentStock($item->item_id),
                'balance_after' => $this->getCurrentStock($item->item_id) + $item->quantity_received,
                'notes' => "Penerimaan barang dari PO {$purchase->purchase_number}",
                'created_by' => $userId,
            ]);

            Log::info("Inventory transaction {$transactionNumber} created for item {$item->item_id}");

            return $transaction;
        });
    }

    /**
     * Helper: Generate Journal Number
     */
    private function generateJournalNumber(): string
    {
        $date = now();
        $year = $date->format('Y');
        $month = $date->format('m');
        
        $lastJournal = Jurnal::whereYear('tanggal_transaksi', $year)
            ->whereMonth('tanggal_transaksi', $month)
            ->orderBy('nomor_jurnal', 'desc')
            ->first();

        if ($lastJournal) {
            // Extract number from last journal
            $parts = explode('-', $lastJournal->nomor_jurnal);
            $lastNumber = intval(end($parts));
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return "JE-{$year}-{$month}-" . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Helper: Get default inventory account
     */
    private function getDefaultInventoryAccount($categoryId = null): int
    {
        // Try to get from category mapping first
        // For now, return default inventory account
        $account = DaftarAkun::where('kode_akun', 'LIKE', '1-1-3%')
            ->where('nama_akun', 'LIKE', '%Inventory%')
            ->where('is_aktif', true)
            ->first();
        
        if (!$account) {
            throw new \Exception('Akun Inventory (1-1-3-xx) tidak ditemukan. Silakan buat akun terlebih dahulu di master data.');
        }
        
        return $account->id;
    }

    /**
     * Helper: Get accounts payable account
     */
    private function getDefaultAccountsPayableAccount($supplierId = null): int
    {
        $account = DaftarAkun::where('kode_akun', 'LIKE', '2-1-1%')
            ->where('nama_akun', 'LIKE', '%Utang%')
            ->where('is_aktif', true)
            ->first();
        
        if (!$account) {
            throw new \Exception('Akun Utang Usaha (2-1-1-xx) tidak ditemukan. Silakan buat akun terlebih dahulu di master data.');
        }
        
        return $account->id;
    }

    /**
     * Helper: Get cash or bank account for payment
     */
    private function getCashOrBankAccount(PurchasePayment $payment): int
    {
        if ($payment->payment_method === 'cash') {
            $account = DaftarAkun::where('kode_akun', 'LIKE', '1-1-1%')
                ->where('nama_akun', 'LIKE', '%Kas%')
                ->where('is_aktif', true)
                ->first();
            
            if (!$account) {
                throw new \Exception('Akun Kas (1-1-1-xx) tidak ditemukan. Silakan buat akun terlebih dahulu di master data.');
            }
            
            return $account->id;
        }
        
        // For bank transfer, get from bank_account relation
        if ($payment->bankAccount && $payment->bankAccount->daftar_akun_id) {
            return $payment->bankAccount->daftar_akun_id;
        }
        
        // Default to bank account
        $account = DaftarAkun::where('kode_akun', 'LIKE', '1-1-2%')
            ->where('nama_akun', 'LIKE', '%Bank%')
            ->where('is_aktif', true)
            ->first();
        
        if (!$account) {
            throw new \Exception('Akun Bank (1-1-2-xx) tidak ditemukan. Silakan buat akun terlebih dahulu di master data atau gunakan metode pembayaran lain.');
        }
        
        return $account->id;
    }

    /**
     * Helper: Get discount received account
     */
    private function getDiscountReceivedAccount(): int
    {
        $account = DaftarAkun::where('kode_akun', 'LIKE', '4-2%')
            ->where('nama_akun', 'LIKE', '%Discount%')
            ->where('is_aktif', true)
            ->first();
        
        if (!$account) {
            throw new \Exception('Akun Diskon Pembelian/Pendapatan Lain-lain (4-2-x-xx) tidak ditemukan. Silakan buat akun terlebih dahulu di master data.');
        }
        
        return $account->id;
    }

    /**
     * Helper: Get current stock for item
     */
    private function getCurrentStock($itemId): float
    {
        $lastTransaction = InventoryTransaction::where('item_id', $itemId)
            ->orderBy('created_at', 'desc')
            ->first();
        
        return $lastTransaction ? $lastTransaction->balance_after : 0;
    }

    /**
     * Send notification when purchase is posted to journal
     */
    private function sendPurchasePostedNotification(Purchase $purchase, Jurnal $jurnal, int $userId): void
    {
        // Notify accounting team
        $this->notificationService->sendToRoles(
            self::TYPE_PURCHASE_POSTED,
            ['akuntansi', 'manager', 'administrator'],
            [
                'title' => 'Purchase Order Posted to Journal',
                'message' => "PO {$purchase->purchase_number} dari {$purchase->supplier->name} telah di-post ke jurnal {$jurnal->nomor_jurnal}. Total: " . number_format($purchase->total_amount, 2),
                'action_url' => route('purchases.show', $purchase->id),
                'data' => [
                    'purchase_id' => $purchase->id,
                    'purchase_number' => $purchase->purchase_number,
                    'jurnal_id' => $jurnal->id,
                    'jurnal_number' => $jurnal->nomor_jurnal,
                    'amount' => $purchase->total_amount,
                    'supplier' => $purchase->supplier->name,
                ],
            ]
        );

        // Notify purchase creator
        if ($purchase->created_by !== $userId) {
            $this->notificationService->sendToUser(
                $purchase->created_by,
                self::TYPE_PURCHASE_POSTED,
                [
                    'title' => 'Your Purchase Order Posted',
                    'message' => "PO {$purchase->purchase_number} Anda telah di-post ke jurnal dan siap untuk pembayaran.",
                    'action_url' => route('purchases.show', $purchase->id),
                    'data' => [
                        'purchase_id' => $purchase->id,
                        'purchase_number' => $purchase->purchase_number,
                    ],
                ]
            );
        }
    }

    /**
     * Send notification when payment is created
     */
    private function sendPaymentCreatedNotification(PurchasePayment $payment, Jurnal $jurnal, int $userId): void
    {
        $purchase = $payment->purchase;
        $isFullyPaid = $purchase->ap_outstanding <= 0;

        // Notify accounting team
        $this->notificationService->sendToRoles(
            self::TYPE_PAYMENT_CREATED,
            ['akuntansi', 'manager', 'administrator'],
            [
                'title' => 'Purchase Payment Created',
                'message' => "Payment {$payment->payment_number} untuk PO {$purchase->purchase_number} telah dibuat. Amount: " . number_format($payment->amount, 2) . ($isFullyPaid ? ' (Lunas)' : ' (Sisa: ' . number_format($purchase->ap_outstanding, 2) . ')'),
                'action_url' => route('purchases.show', $purchase->id),
                'data' => [
                    'payment_id' => $payment->id,
                    'payment_number' => $payment->payment_number,
                    'purchase_id' => $purchase->id,
                    'purchase_number' => $purchase->purchase_number,
                    'jurnal_id' => $jurnal->id,
                    'jurnal_number' => $jurnal->nomor_jurnal,
                    'amount' => $payment->amount,
                    'discount' => $payment->discount_amount,
                    'outstanding' => $purchase->ap_outstanding,
                    'is_fully_paid' => $isFullyPaid,
                ],
            ]
        );

        // Notify purchase creator about payment
        if ($purchase->created_by !== $userId) {
            $this->notificationService->sendToUser(
                $purchase->created_by,
                self::TYPE_PAYMENT_CREATED,
                [
                    'title' => $isFullyPaid ? 'Purchase Order Fully Paid' : 'Payment Made for Purchase Order',
                    'message' => "Payment {$payment->payment_number} telah dibuat untuk PO {$purchase->purchase_number}." . ($isFullyPaid ? ' Purchase order sudah lunas.' : ' Sisa outstanding: ' . number_format($purchase->ap_outstanding, 2)),
                    'action_url' => route('purchases.show', $purchase->id),
                    'data' => [
                        'payment_id' => $payment->id,
                        'purchase_id' => $purchase->id,
                        'is_fully_paid' => $isFullyPaid,
                    ],
                ]
            );
        }

        // If fully paid, send additional notification to logistics
        if ($isFullyPaid) {
            $this->notificationService->sendToRoles(
                self::TYPE_PAYMENT_CREATED,
                ['logistics'],
                [
                    'title' => 'Purchase Order Fully Paid',
                    'message' => "PO {$purchase->purchase_number} dari {$purchase->supplier->name} telah dibayar lunas.",
                    'action_url' => route('purchases.show', $purchase->id),
                    'data' => [
                        'purchase_id' => $purchase->id,
                        'purchase_number' => $purchase->purchase_number,
                        'supplier' => $purchase->supplier->name,
                    ],
                ]
            );
        }
    }

    /**
     * Get available notification types for inventory accounting
     */
    public static function getNotificationTypes(): array
    {
        return [
            self::TYPE_PURCHASE_POSTED => 'Purchase Order Posted to Journal',
            self::TYPE_PAYMENT_CREATED => 'Purchase Payment Created',
            self::TYPE_PURCHASE_APPROVED => 'Purchase Order Approved',
            self::TYPE_PURCHASE_OUTSTANDING => 'Purchase Outstanding Reminder',
        ];
    }
}
