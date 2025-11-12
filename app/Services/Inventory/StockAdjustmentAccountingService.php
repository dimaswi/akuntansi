<?php

namespace App\Services\Inventory;

use App\Models\Akuntansi\DetailJurnal;
use App\Models\Akuntansi\Jurnal;
use App\Models\Inventory\StockAdjustment;
use Illuminate\Support\Facades\DB;

class StockAdjustmentAccountingService
{
    /**
     * Post stock adjustment to jurnal
     * - Shortage: Dr. Loss (Selisih) → Cr. Inventory
     * - Overage: Dr. Inventory → Cr. Gain (Selisih)
     */
    public function postAdjustmentToJournal(StockAdjustment $adjustment): array
    {
        if ($adjustment->jurnal_posted) {
            return [
                'success' => false,
                'message' => 'Adjustment sudah di-posting ke jurnal',
            ];
        }

        if ($adjustment->status !== 'approved') {
            return [
                'success' => false,
                'message' => 'Adjustment harus approved dulu sebelum posting jurnal',
            ];
        }

        try {
            DB::beginTransaction();

            // Generate nomor jurnal dengan format JIA/YYYY/MM/XXXX
            $nomorJurnal = $this->generateNomorJurnal($adjustment->tanggal_adjustment->format('Y-m-d'));

            // Get COA accounts
            $inventoryAccount = DB::table('daftar_akun')->where('kode_akun', '1-1300')->first(); // Inventory
            $selisihAccount = DB::table('daftar_akun')->where('kode_akun', '484')->first(); // Selisih Manual dan SIMGOS

            if (!$inventoryAccount || !$selisihAccount) {
                throw new \Exception('COA untuk Inventory (1-1300) atau Selisih (484) tidak ditemukan');
            }

            // Create jurnal
            $jurnal = Jurnal::create([
                'nomor_jurnal' => $nomorJurnal,
                'tanggal_transaksi' => $adjustment->tanggal_adjustment,
                'deskripsi' => "Stock Adjustment - {$adjustment->nomor_adjustment} - " . 
                               ucfirst($adjustment->tipe_adjustment) . " - " . 
                               $adjustment->item->nama_barang,
                'jenis_jurnal' => 'umum',
            ]);

            $totalAmount = $adjustment->total_amount;

            if ($adjustment->tipe_adjustment === 'shortage') {
                // Shortage (kekurangan): Dr. Loss → Cr. Inventory
                
                // Debit: Selisih (Loss/Expense)
                DetailJurnal::create([
                    'jurnal_id' => $jurnal->id,
                    'kode_akun' => $selisihAccount->kode_akun,
                    'nama_akun' => $selisihAccount->nama_akun,
                    'jumlah_debit' => $totalAmount,
                    'jumlah_kredit' => 0,
                ]);

                // Kredit: Inventory
                DetailJurnal::create([
                    'jurnal_id' => $jurnal->id,
                    'kode_akun' => $inventoryAccount->kode_akun,
                    'nama_akun' => $inventoryAccount->nama_akun,
                    'jumlah_debit' => 0,
                    'jumlah_kredit' => $totalAmount,
                ]);
            } else {
                // Overage (kelebihan): Dr. Inventory → Cr. Gain
                
                // Debit: Inventory
                DetailJurnal::create([
                    'jurnal_id' => $jurnal->id,
                    'kode_akun' => $inventoryAccount->kode_akun,
                    'nama_akun' => $inventoryAccount->nama_akun,
                    'jumlah_debit' => $totalAmount,
                    'jumlah_kredit' => 0,
                ]);

                // Kredit: Selisih (Gain/Income)
                DetailJurnal::create([
                    'jurnal_id' => $jurnal->id,
                    'kode_akun' => $selisihAccount->kode_akun,
                    'nama_akun' => $selisihAccount->nama_akun,
                    'jumlah_debit' => 0,
                    'jumlah_kredit' => $totalAmount,
                ]);
            }

            // Update adjustment record
            $adjustment->update([
                'jurnal_posted' => true,
                'jurnal_id' => $jurnal->id,
            ]);

            DB::commit();

            return [
                'success' => true,
                'message' => 'Stock adjustment berhasil di-posting ke jurnal',
                'jurnal_id' => $jurnal->id,
                'nomor_jurnal' => $nomorJurnal,
            ];
        } catch (\Exception $e) {
            DB::rollBack();

            return [
                'success' => false,
                'message' => 'Gagal posting ke jurnal: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Generate nomor jurnal dengan format JIA/YYYY/MM/XXXX
     * JIA = Jurnal Inventory Adjustment
     */
    private function generateNomorJurnal(string $tanggal): string
    {
        $date = \Carbon\Carbon::parse($tanggal);
        $year = $date->format('Y');
        $month = $date->format('m');
        $prefix = "JIA/{$year}/{$month}";

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
