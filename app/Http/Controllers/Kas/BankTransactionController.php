<?php

namespace App\Http\Controllers\Kas;

use App\Http\Controllers\Controller;
use App\Models\Kas\BankTransaction;
use App\Models\Kas\BankAccount;
use App\Models\Akuntansi\DaftarAkun;
use App\Models\Akuntansi\Jurnal;
use App\Models\Akuntansi\DetailJurnal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class BankTransactionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $search = $request->get('search', '');
        $perPage = $request->get('perPage', 10);
        $status = $request->get('status', '');
        $jenis = $request->get('jenis_transaksi', '');
        $bankAccountId = $request->get('bank_account_id', '');
        $isPosted = $request->get('is_posted', '');
        $tanggalDari = $request->get('tanggal_dari', '');
        $tanggalSampai = $request->get('tanggal_sampai', '');

        $query = BankTransaction::with(['bankAccount', 'daftarAkunLawan', 'user'])
            ->orderBy('tanggal_transaksi', 'desc')
            ->orderBy('created_at', 'desc');

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('nomor_transaksi', 'like', "%{$search}%")
                  ->orWhere('keterangan', 'like', "%{$search}%")
                  ->orWhere('pihak_terkait', 'like', "%{$search}%")
                  ->orWhere('nomor_referensi', 'like', "%{$search}%");
            });
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($jenis) {
            $query->where('jenis_transaksi', $jenis);
        }

        if ($bankAccountId) {
            $query->where('bank_account_id', $bankAccountId);
        }

        if ($isPosted !== '') {
            if ($isPosted == '1') {
                $query->where('status', 'posted');
            } else {
                $query->where('status', '!=', 'posted');
            }
        }

        if ($tanggalDari) {
            $query->whereDate('tanggal_transaksi', '>=', $tanggalDari);
        }

        if ($tanggalSampai) {
            $query->whereDate('tanggal_transaksi', '<=', $tanggalSampai);
        }

        $bankTransactions = $query->paginate($perPage);

        // Add computed is_posted attribute
        $bankTransactions->getCollection()->transform(function ($transaction) {
            $transaction->is_posted = $transaction->status === 'posted';
            return $transaction;
        });

        $bankAccounts = BankAccount::aktif()
            ->orderBy('nama_bank')
            ->get(['id', 'kode_rekening', 'nama_bank', 'nama_rekening', 'nomor_rekening']);

        return Inertia::render('kas/bank-transactions/index', [
            'bank_transactions' => $bankTransactions,
            'bank_accounts' => $bankAccounts,
            'filters' => [
                'search' => $search,
                'perPage' => (int) $perPage,
                'status' => $status,
                'jenis_transaksi' => $jenis,
                'bank_account_id' => $bankAccountId,
                'is_posted' => $isPosted,
                'tanggal_dari' => $tanggalDari,
                'tanggal_sampai' => $tanggalSampai,
            ],
            'jenisTransaksi' => [
                'setoran' => 'Setoran',
                'penarikan' => 'Penarikan',
                'transfer_masuk' => 'Transfer Masuk',
                'transfer_keluar' => 'Transfer Keluar',
                'kliring_masuk' => 'Kliring Masuk',
                'kliring_keluar' => 'Kliring Keluar',
                'bunga_bank' => 'Bunga Bank',
                'biaya_admin' => 'Biaya Admin',
                'pajak_bunga' => 'Pajak Bunga',
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $bankAccounts = BankAccount::aktif()
            ->orderBy('nama_bank')
            ->get(['id', 'kode_rekening', 'nama_bank', 'nama_rekening', 'nomor_rekening', 'saldo_berjalan']);

        return Inertia::render('kas/bank-transactions/create', [
            'bank_accounts' => $bankAccounts,
            'jenisTransaksi' => [
                'penerimaan' => 'Penerimaan',
                'pengeluaran' => 'Pengeluaran',
                'transfer_masuk' => 'Transfer Masuk',
                'transfer_keluar' => 'Transfer Keluar',
            ],
            'kategoriTransaksi' => [
                'pendapatan_operasional' => 'Pendapatan Operasional',
                'pendapatan_non_operasional' => 'Pendapatan Non-Operasional',
                'pinjaman' => 'Pinjaman',
                'modal' => 'Modal',
                'biaya_operasional' => 'Biaya Operasional',
                'biaya_non_operasional' => 'Biaya Non-Operasional',
                'pembelian_aset' => 'Pembelian Aset',
                'pembayaran_kewajiban' => 'Pembayaran Kewajiban',
                'lainnya_masuk' => 'Lainnya (Masuk)',
                'lainnya_keluar' => 'Lainnya (Keluar)',
            ],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nomor_transaksi' => 'nullable|string|max:100|unique:bank_transactions,nomor_transaksi',
            'tanggal_transaksi' => 'required|date',
            'tanggal_efektif' => 'nullable|date',
            'jenis_transaksi' => 'required|in:penerimaan,pengeluaran,transfer_masuk,transfer_keluar',
            'bank_account_id' => 'required|exists:bank_accounts,id',
            'jumlah' => 'required|numeric|min:0.01',
            'kategori_transaksi' => 'required|string|max:100',
            'keterangan' => 'required|string|max:500',
            'nomor_referensi' => 'nullable|string|max:100',
            'pihak_terkait' => 'nullable|string|max:255',
        ]);

        // Generate nomor transaksi if not provided
        if (empty($validated['nomor_transaksi'])) {
            $validated['nomor_transaksi'] = $this->generateNomorTransaksi();
        }

        $validated['user_id'] = Auth::id();
        $validated['status'] = 'draft';
        $validated['tanggal_efektif'] = $validated['tanggal_efektif'] ?? $validated['tanggal_transaksi'];
        // daftar_akun_lawan_id will be set during journal posting

        $bankTransaction = BankTransaction::create($validated);

        return redirect()->route('kas.bank-transactions.index')
            ->with('message', 'Transaksi bank berhasil dibuat');
    }

    /**
     * Display the specified resource.
     */
    public function show(BankTransaction $bankTransaction)
    {
        $bankTransaction->load([
            'bankAccount.daftarAkun',
            'daftarAkunLawan',
            'jurnal.details.daftarAkun',
            'user',
            'postedBy'
        ]);

        // Add computed is_posted attribute
        $bankTransaction->is_posted = $bankTransaction->status === 'posted';

        return Inertia::render('kas/bank-transactions/show', [
            'bank_transaction' => $bankTransaction,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(BankTransaction $bankTransaction)
    {
        if ($bankTransaction->status === 'posted') {
            return back()->withErrors([
                'message' => 'Transaksi yang sudah diposting tidak dapat diedit'
            ]);
        }

        $bankAccounts = BankAccount::aktif()
            ->orderBy('nama_bank')
            ->get(['id', 'kode_rekening', 'nama_bank', 'nama_rekening', 'nomor_rekening']);

        // Daftar akun untuk akun lawan transaksi bank
        $daftarAkun = DaftarAkun::aktif()
            ->whereIn('jenis_akun', ['pendapatan', 'biaya', 'beban', 'kewajiban', 'modal', 'aset'])
            ->orderBy('jenis_akun')
            ->orderBy('kode_akun')
            ->get(['id', 'kode_akun', 'nama_akun', 'jenis_akun']);

        return Inertia::render('kas/bank-transactions/edit', [
            'bank_transaction' => $bankTransaction,
            'bank_accounts' => $bankAccounts,
            'daftar_akun' => $daftarAkun,
            'jenisTransaksi' => [
                'setoran' => 'Setoran',
                'penarikan' => 'Penarikan',
                'transfer_masuk' => 'Transfer Masuk',
                'transfer_keluar' => 'Transfer Keluar',
                'kliring_masuk' => 'Kliring Masuk',
                'kliring_keluar' => 'Kliring Keluar',
                'bunga_bank' => 'Bunga Bank',
                'biaya_admin' => 'Biaya Admin',
                'pajak_bunga' => 'Pajak Bunga',
            ],
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, BankTransaction $bankTransaction)
    {
        if ($bankTransaction->status === 'posted') {
            return back()->withErrors([
                'message' => 'Transaksi yang sudah diposting tidak dapat diedit'
            ]);
        }

        $validated = $request->validate([
            'tanggal_transaksi' => 'required|date',
            'tanggal_efektif' => 'nullable|date',
            'jenis_transaksi' => 'required|in:setoran,penarikan,transfer_masuk,transfer_keluar,kliring_masuk,kliring_keluar,bunga_bank,biaya_admin,pajak_bunga',
            'bank_account_id' => 'required|exists:bank_accounts,id',
            'jumlah' => 'required|numeric|min:0.01',
            'keterangan' => 'required|string|max:500',
            'nomor_referensi' => 'nullable|string|max:100',
            'pihak_terkait' => 'nullable|string|max:255',
            'daftar_akun_lawan_id' => 'required|exists:daftar_akun,id',
        ]);

        $validated['tanggal_efektif'] = $validated['tanggal_efektif'] ?? $validated['tanggal_transaksi'];

        $bankTransaction->update($validated);

        return redirect()->route('kas.bank-transactions.index')
            ->with('message', 'Transaksi bank berhasil diperbarui');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(BankTransaction $bankTransaction)
    {
        if ($bankTransaction->status === 'posted') {
            return back()->withErrors([
                'message' => 'Transaksi yang sudah diposting tidak dapat dihapus'
            ]);
        }

        $bankTransaction->delete();

        return redirect()->route('kas.bank-transactions.index')
            ->with('message', 'Transaksi bank berhasil dihapus');
    }

    /**
     * Post bank transaction and create journal entry
     */
    public function post(BankTransaction $bankTransaction)
    {
        if ($bankTransaction->status === 'posted') {
            return back()->withErrors([
                'message' => 'Transaksi sudah diposting sebelumnya'
            ]);
        }

        DB::transaction(function () use ($bankTransaction) {
            // Generate journal entry
            $jurnal = $this->generateJurnal($bankTransaction);

            // Update transaction status
            $bankTransaction->update([
                'jurnal_id' => $jurnal->id,
                'status' => 'posted',
                'posted_at' => now(),
                'posted_by' => Auth::id()
            ]);

            // Update bank account balance
            $bankTransaction->bankAccount->updateSaldoBerjalan();
        });

        return back()->with('message', 'Transaksi berhasil diposting dan jurnal telah dibuat');
    }

    /**
     * Bank reconciliation
     */
    public function reconcile(Request $request)
    {
        $validated = $request->validate([
            'transaction_ids' => 'required|array',
            'transaction_ids.*' => 'exists:bank_transactions,id',
            'tanggal_rekonsiliasi' => 'required|date',
        ]);

        $transactions = BankTransaction::whereIn('id', $validated['transaction_ids'])
            ->where('status', 'posted')
            ->where('is_reconciled', false)
            ->get();

        if ($transactions->count() !== count($validated['transaction_ids'])) {
            return back()->withErrors([
                'message' => 'Beberapa transaksi tidak dapat direkonsiliasi (belum diposting atau sudah direkonsiliasi)'
            ]);
        }

        $transactions->each(function ($transaction) use ($validated) {
            $transaction->update([
                'is_reconciled' => true,
                'tanggal_rekonsiliasi' => $validated['tanggal_rekonsiliasi'],
            ]);
        });

        return back()->with('message', 'Rekonsiliasi berhasil untuk ' . $transactions->count() . ' transaksi');
    }

    /**
     * Show form to post transactions to journal
     */
    public function showPostToJournal(Request $request)
    {
        $transactionIds = $request->get('ids', []);
        
        if (empty($transactionIds)) {
            return redirect()->route('kas.bank-transactions.index')
                ->with('error', 'Pilih minimal satu transaksi untuk diposting ke jurnal.');
        }
        
        $transactions = BankTransaction::with(['bankAccount'])
            ->where('status', 'draft')
            ->whereIn('id', $transactionIds)
            ->orderBy('tanggal_transaksi')
            ->get();

        if ($transactions->isEmpty()) {
            return redirect()->route('kas.bank-transactions.index')
                ->with('error', 'Tidak ada transaksi draft yang dipilih.');
        }

        // Get available accounts for journal entries
        $daftarAkun = DaftarAkun::aktif()
            ->whereIn('jenis_akun', ['pendapatan', 'biaya', 'beban', 'kewajiban', 'modal', 'aset'])
            ->orderBy('jenis_akun')
            ->orderBy('kode_akun')
            ->get(['id', 'kode_akun', 'nama_akun', 'jenis_akun']);

        return Inertia::render('kas/bank-transactions/post-to-journal', [
            'bankTransactions' => $transactions,
            'daftarAkun' => $daftarAkun,
        ]);
    }

    /**
     * Process posting multiple transactions to journal
     */
    public function postToJournal(Request $request)
    {
        $validated = $request->validate([
            'selected_transactions' => 'required|array|min:1',
            'selected_transactions.*' => 'exists:bank_transactions,id',
            'account_mappings' => 'required|array',
            'account_mappings.*.bank_transaction_id' => 'required|exists:bank_transactions,id',
            'account_mappings.*.daftar_akun_lawan_id' => 'required|exists:daftar_akun,id'
        ]);

        $postedCount = 0;

        DB::transaction(function () use ($validated, &$postedCount) {
            foreach ($validated['account_mappings'] as $mapping) {
                $transaction = BankTransaction::find($mapping['bank_transaction_id']);
                
                if ($transaction && $transaction->status === 'draft') {
                    // Generate journal entry
                    $jurnal = $this->generateJurnal($transaction, $mapping['daftar_akun_lawan_id']);

                    // Update transaction status
                    $transaction->update([
                        'daftar_akun_lawan_id' => $mapping['daftar_akun_lawan_id'],
                        'jurnal_id' => $jurnal->id,
                        'status' => 'posted',
                        'posted_at' => now(),
                        'posted_by' => Auth::id()
                    ]);

                    // Update bank account balance
                    $transaction->bankAccount->updateSaldoBerjalan();
                    
                    $postedCount++;
                }
            }
        });

        return redirect()->route('kas.bank-transactions.index')
            ->with('success', "Berhasil memposting {$postedCount} transaksi bank ke jurnal.");
    }

    private function generateJurnal(BankTransaction $bankTransaction, $daftarAkunLawanId = null)
    {
        // Use provided account or existing one
        $akunLawanId = $daftarAkunLawanId ?? $bankTransaction->daftar_akun_lawan_id;
        
        // Generate nomor jurnal
        $nomorJurnal = $this->generateNomorJurnal();

        // Create journal header
        $jurnal = Jurnal::create([
            'nomor_jurnal' => $nomorJurnal,
            'tanggal_transaksi' => $bankTransaction->tanggal_transaksi,
            'keterangan' => $bankTransaction->keterangan . ' - ' . ($bankTransaction->pihak_terkait ?: 'Bank Transfer'),
            'nomor_referensi' => $bankTransaction->nomor_transaksi,
            'total_debit' => $bankTransaction->jumlah,
            'total_kredit' => $bankTransaction->jumlah,
            'dibuat_oleh' => Auth::id(),
            'status' => 'posted',
            'tanggal_posting' => now(),
            'diposting_oleh' => Auth::id()
        ]);

        // Create journal details based on transaction type
        if (in_array($bankTransaction->jenis_transaksi, ['setoran', 'transfer_masuk', 'kliring_masuk', 'bunga_bank'])) {
            // Bank balance increases (Debit), Counter account decreases (Credit)
            DetailJurnal::create([
                'jurnal_id' => $jurnal->id,
                'daftar_akun_id' => $bankTransaction->bankAccount->daftar_akun_id,
                'keterangan' => $bankTransaction->keterangan,
                'jumlah_debit' => $bankTransaction->jumlah,
                'jumlah_kredit' => 0
            ]);

            DetailJurnal::create([
                'jurnal_id' => $jurnal->id,
                'daftar_akun_id' => $akunLawanId,
                'keterangan' => $bankTransaction->keterangan,
                'jumlah_debit' => 0,
                'jumlah_kredit' => $bankTransaction->jumlah
            ]);
        } else {
            // Bank balance decreases (Credit), Counter account increases (Debit)
            DetailJurnal::create([
                'jurnal_id' => $jurnal->id,
                'daftar_akun_id' => $akunLawanId,
                'keterangan' => $bankTransaction->keterangan,
                'jumlah_debit' => $bankTransaction->jumlah,
                'jumlah_kredit' => 0
            ]);

            DetailJurnal::create([
                'jurnal_id' => $jurnal->id,
                'daftar_akun_id' => $bankTransaction->bankAccount->daftar_akun_id,
                'keterangan' => $bankTransaction->keterangan,
                'jumlah_debit' => 0,
                'jumlah_kredit' => $bankTransaction->jumlah
            ]);
        }

        return $jurnal;
    }

    private function generateNomorTransaksi()
    {
        $prefix = 'BT'; // Bank Transaction
        $tahun = date('Y');
        $bulan = date('m');
        
        $lastTransaction = BankTransaction::where('nomor_transaksi', 'like', "$prefix/$tahun/$bulan/%")
            ->orderBy('nomor_transaksi', 'desc')
            ->first();

        if ($lastTransaction) {
            $lastNum = (int) substr($lastTransaction->nomor_transaksi, -4);
            $newNum = $lastNum + 1;
        } else {
            $newNum = 1;
        }

        return sprintf('%s/%s/%s/%04d', $prefix, $tahun, $bulan, $newNum);
    }

    private function generateNomorJurnal()
    {
        $prefix = 'JBT'; // Jurnal Bank Transaction
        $tahun = date('Y');
        $bulan = date('m');
        
        $lastJurnal = Jurnal::where('nomor_jurnal', 'like', "$prefix/$tahun/$bulan/%")
            ->orderBy('nomor_jurnal', 'desc')
            ->first();

        if ($lastJurnal) {
            $lastNum = (int) substr($lastJurnal->nomor_jurnal, -4);
            $newNum = $lastNum + 1;
        } else {
            $newNum = 1;
        }

        return sprintf('%s/%s/%s/%04d', $prefix, $tahun, $bulan, $newNum);
    }
}
