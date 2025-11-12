<?php

namespace App\Services\Inventory;

use App\Models\Akuntansi\DetailJurnal;
use App\Models\Akuntansi\Jurnal;
use App\Models\Inventory\Purchase;
use App\Models\Inventory\PurchasePayment;
use Illuminate\Support\Facades\DB;

/**
 * Service untuk handle posting Purchase Payment ke Jurnal Akuntansi
 */
class PurchasePaymentAccountingService
{
    /**
     * Buat jurnal untuk purchase payment
     * 
     * @param PurchasePayment $payment
     * @return Jurnal
     */
    public function createPaymentJournal(PurchasePayment $payment): Jurnal
    {
        // Cek apakah sudah pernah diposting
        if ($payment->jurnal_posted) {
            throw new \Exception('Payment sudah diposting ke jurnal');
        }

        DB::beginTransaction();
        try {
            $purchase = $payment->purchase()->with('supplier')->first();
            
            // Ambil kode akun Hutang Usaha (Accounts Payable)
            $apAccount = DB::table('daftar_akun')
                ->where('jenis_akun', 'kewajiban')
                ->where('nama_akun', 'like', '%hutang%')
                ->first();
            
            // Gunakan akun bank dari payment, atau default kas jika payment method = cash
            if ($payment->payment_method === 'cash') {
                $bankAccount = DB::table('daftar_akun')
                    ->where('jenis_akun', 'aset')
                    ->where('nama_akun', 'like', '%kas%')
                    ->where('kode_akun', 'not like', '111')
                    ->first();
            } else {
                $bankAccount = DB::table('daftar_akun')
                    ->where('kode_akun', $payment->kode_akun_bank)
                    ->first();
            }
            
            if (!$apAccount || !$bankAccount) {
                throw new \Exception('Akun tidak ditemukan di COA');
            }

            // Generate nomor jurnal
            $nomorJurnal = $this->generateNomorJurnal($payment->payment_date->format('Y-m-d'));

            // Buat jurnal
            $jurnal = Jurnal::create([
                'nomor_jurnal' => $nomorJurnal,
                'tanggal_transaksi' => $payment->payment_date,
                'deskripsi' => "Pembayaran PO {$purchase->purchase_number} - {$purchase->supplier->name}",
                'jenis_jurnal' => 'umum',
            ]);
            
            // Dr. Accounts Payable
            DetailJurnal::create([
                'jurnal_id' => $jurnal->id,
                'kode_akun' => $apAccount->kode_akun,
                'nama_akun' => $apAccount->nama_akun,
                'jumlah_debit' => $payment->amount,
                'jumlah_kredit' => 0,
            ]);
            
            // Cr. Bank/Cash (net amount setelah dikurangi discount)
            DetailJurnal::create([
                'jurnal_id' => $jurnal->id,
                'kode_akun' => $bankAccount->kode_akun,
                'nama_akun' => $bankAccount->nama_akun,
                'jumlah_debit' => 0,
                'jumlah_kredit' => $payment->net_amount,
            ]);
            
            // Jika ada discount, Cr. Purchase Discount (Pendapatan Lainnya)
            if ($payment->discount_amount > 0) {
                $discountAccount = DB::table('daftar_akun')
                    ->where('jenis_akun', 'pendapatan')
                    ->where('nama_akun', 'like', '%lain%')
                    ->first();
                    
                if ($discountAccount) {
                    DetailJurnal::create([
                        'jurnal_id' => $jurnal->id,
                        'kode_akun' => $discountAccount->kode_akun,
                        'nama_akun' => $discountAccount->nama_akun,
                        'jumlah_debit' => 0,
                        'jumlah_kredit' => $payment->discount_amount,
                    ]);
                }
            }

            // Update payment dengan jurnal_id
            $payment->update([
                'jurnal_id' => $jurnal->id,
                'jurnal_posted' => true,
            ]);

            // Update AP Outstanding di Purchase
            $this->updatePurchaseAPOutstanding($purchase);

            DB::commit();
            return $jurnal;

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Update AP Outstanding di Purchase
     */
    private function updatePurchaseAPOutstanding(Purchase $purchase)
    {
        // Hitung total payment yang sudah dilakukan
        $totalPaid = $purchase->payments()->where('jurnal_posted', true)->sum('amount');
        
        // Update AP outstanding
        $apOutstanding = $purchase->total_amount - $totalPaid;
        
        $purchase->update([
            'ap_paid_amount' => $totalPaid,
            'ap_outstanding' => max(0, $apOutstanding),
        ]);
    }

    /**
     * Generate nomor jurnal dengan format JPY/YYYY/MM/XXXX
     */
    private function generateNomorJurnal(string $tanggal): string
    {
        $date = \Carbon\Carbon::parse($tanggal);
        $year = $date->format('Y');
        $month = $date->format('m');
        $prefix = "JPY/{$year}/{$month}";

        $latest = Jurnal::where('nomor_jurnal', 'like', "{$prefix}/%")
            ->orderBy('nomor_jurnal', 'desc')
            ->first();

        if ($latest) {
            $lastNumber = (int) substr($latest->nomor_jurnal, -4);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return sprintf('%s/%04d', $prefix, $newNumber);
    }
}
