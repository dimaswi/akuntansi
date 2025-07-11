<?php

namespace App\Http\Controllers\Kas;

use App\Http\Controllers\Controller;
use App\Models\Kas\GiroTransaction;
use App\Models\Kas\BankAccount;
use App\Models\Akuntansi\DaftarAkun;
use App\Models\Akuntansi\Jurnal;
use App\Models\Akuntansi\DetailJurnal;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class GiroTransactionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $search = $request->get('search', '');
        $perPage = $request->get('perPage', 10);
        $status = $request->get('status_giro', '');
        $jenis = $request->get('jenis_giro', '');
        $bankAccountId = $request->get('bank_account_id', '');
        $isPosted = $request->get('is_posted', '');
        $tanggalDari = $request->get('tanggal_dari', '');
        $tanggalSampai = $request->get('tanggal_sampai', '');

        $query = GiroTransaction::with(['bankAccount', 'daftarAkunGiro', 'daftarAkunLawan', 'user'])
            ->orderBy('tanggal_terima', 'desc')
            ->orderBy('created_at', 'desc');

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('nomor_giro', 'like', "%{$search}%")
                  ->orWhere('nama_penerbit', 'like', "%{$search}%")
                  ->orWhere('bank_penerbit', 'like', "%{$search}%")
                  ->orWhere('nomor_referensi', 'like', "%{$search}%");
            });
        }

        if ($status) {
            $query->where('status_giro', $status);
        }

        if ($jenis) {
            $query->where('jenis_giro', $jenis);
        }

        if ($bankAccountId) {
            $query->where('bank_account_id', $bankAccountId);
        }

        if ($isPosted !== '') {
            if ($isPosted == '1') {
                $query->whereNotNull('posted_at');
            } else {
                $query->whereNull('posted_at');
            }
        }

        if ($tanggalDari) {
            $query->whereDate('tanggal_terima', '>=', $tanggalDari);
        }

        if ($tanggalSampai) {
            $query->whereDate('tanggal_terima', '<=', $tanggalSampai);
        }

        $giroTransactions = $query->paginate($perPage);

        // Add computed is_posted attribute
        $giroTransactions->getCollection()->transform(function ($transaction) {
            $transaction->is_posted = $transaction->posted_at !== null;
            return $transaction;
        });

        $bankAccounts = BankAccount::aktif()
            ->orderBy('nama_bank')
            ->get(['id', 'kode_rekening', 'nama_bank', 'nama_rekening', 'nomor_rekening']);

        return Inertia::render('kas/giro-transactions/index', [
            'giro_transactions' => $giroTransactions,
            'bank_accounts' => $bankAccounts,
            'filters' => [
                'search' => $search,
                'perPage' => (int) $perPage,
                'status_giro' => $status,
                'jenis_giro' => $jenis,
                'bank_account_id' => $bankAccountId,
                'is_posted' => $isPosted,
                'tanggal_dari' => $tanggalDari,
                'tanggal_sampai' => $tanggalSampai,
            ],
            'jenisGiro' => [
                'masuk' => 'Giro Masuk',
                'keluar' => 'Giro Keluar',
            ],
            'statusGiro' => [
                'diterima' => 'Diterima',
                'cair' => 'Sudah Cair',
                'ditolak' => 'Ditolak',
                'kadaluarsa' => 'Kadaluarsa',
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
            ->get(['id', 'kode_rekening', 'nama_bank', 'nama_rekening', 'nomor_rekening']);

        // Giro accounts - typically under current assets
        $daftarAkunGiro = DaftarAkun::where('jenis_akun', 'aset')
            ->where(function($query) {
                $query->where('nama_akun', 'like', '%giro%')
                      ->orWhere('kode_akun', 'like', '1105%'); // Assuming giro accounts start with 1105
            })
            ->aktif()
            ->orderBy('kode_akun')
            ->get(['id', 'kode_akun', 'nama_akun']);

        $daftarAkun = DaftarAkun::aktif()
            ->orderBy('kode_akun')
            ->get(['id', 'kode_akun', 'nama_akun', 'jenis_akun']);

        return Inertia::render('kas/giro-transactions/create', [
            'bank_accounts' => $bankAccounts,
            'daftar_akun_giro' => $daftarAkunGiro,
            'daftar_akun' => $daftarAkun,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nomor_giro' => 'required|string|max:100|unique:giro_transactions,nomor_giro',
            'tanggal_terima' => 'required|date',
            'tanggal_jatuh_tempo' => 'required|date|after:tanggal_terima',
            'jenis_giro' => 'required|in:masuk,keluar',
            'bank_account_id' => 'required|exists:bank_accounts,id',
            'jumlah' => 'required|numeric|min:0.01',
            'nama_penerbit' => 'required|string|max:255',
            'bank_penerbit' => 'required|string|max:255',
            'keterangan' => 'nullable|string|max:500',
            'nomor_referensi' => 'nullable|string|max:100',
            'daftar_akun_giro_id' => 'required|exists:daftar_akun,id',
            'daftar_akun_lawan_id' => 'required|exists:daftar_akun,id',
        ]);

        $validated['user_id'] = Auth::id();
        $validated['status_giro'] = 'diterima';

        $giroTransaction = GiroTransaction::create($validated);

        return redirect()->route('kas.giro-transactions.index')
            ->with('message', 'Transaksi giro berhasil dibuat');
    }

    /**
     * Display the specified resource.
     */
    public function show(GiroTransaction $giroTransaction)
    {
        $giroTransaction->load([
            'bankAccount.daftarAkun',
            'daftarAkunGiro',
            'daftarAkunLawan',
            'jurnalTerima.details.daftarAkun',
            'jurnalCair.details.daftarAkun',
            'user',
            'postedBy'
        ]);

        // Add computed is_posted attribute
        $giroTransaction->is_posted = $giroTransaction->posted_at !== null;

        return Inertia::render('kas/giro-transactions/show', [
            'giro_transaction' => $giroTransaction,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(GiroTransaction $giroTransaction)
    {
        if ($giroTransaction->status_giro === 'cair') {
            return back()->withErrors([
                'message' => 'Giro yang sudah cair tidak dapat diedit'
            ]);
        }

        $bankAccounts = BankAccount::aktif()
            ->orderBy('nama_bank')
            ->get(['id', 'kode_rekening', 'nama_bank', 'nama_rekening', 'nomor_rekening']);

        $daftarAkunGiro = DaftarAkun::where('jenis_akun', 'aset')
            ->where(function($query) {
                $query->where('nama_akun', 'like', '%giro%')
                      ->orWhere('kode_akun', 'like', '1105%');
            })
            ->aktif()
            ->orderBy('kode_akun')
            ->get(['id', 'kode_akun', 'nama_akun']);

        $daftarAkun = DaftarAkun::aktif()
            ->orderBy('kode_akun')
            ->get(['id', 'kode_akun', 'nama_akun', 'jenis_akun']);

        return Inertia::render('kas/giro-transactions/edit', [
            'giro_transaction' => $giroTransaction,
            'bank_accounts' => $bankAccounts,
            'daftar_akun_giro' => $daftarAkunGiro,
            'daftar_akun' => $daftarAkun,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, GiroTransaction $giroTransaction)
    {
        if ($giroTransaction->status_giro === 'cair') {
            return back()->withErrors([
                'message' => 'Giro yang sudah cair tidak dapat diedit'
            ]);
        }

        $validated = $request->validate([
            'tanggal_terima' => 'required|date',
            'tanggal_jatuh_tempo' => 'required|date|after:tanggal_terima',
            'jenis_giro' => 'required|in:masuk,keluar',
            'bank_account_id' => 'required|exists:bank_accounts,id',
            'jumlah' => 'required|numeric|min:0.01',
            'nama_penerbit' => 'required|string|max:255',
            'bank_penerbit' => 'required|string|max:255',
            'keterangan' => 'nullable|string|max:500',
            'nomor_referensi' => 'nullable|string|max:100',
            'daftar_akun_giro_id' => 'required|exists:daftar_akun,id',
            'daftar_akun_lawan_id' => 'required|exists:daftar_akun,id',
        ]);

        $giroTransaction->update($validated);

        return redirect()->route('kas.giro-transactions.index')
            ->with('message', 'Transaksi giro berhasil diperbarui');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(GiroTransaction $giroTransaction)
    {
        if ($giroTransaction->status_giro === 'cair') {
            return back()->withErrors([
                'message' => 'Giro yang sudah cair tidak dapat dihapus'
            ]);
        }

        // Delete related journals if any
        if ($giroTransaction->jurnal_terima_id) {
            $giroTransaction->jurnalTerima->delete();
        }

        $giroTransaction->delete();

        return redirect()->route('kas.giro-transactions.index')
            ->with('message', 'Transaksi giro berhasil dihapus');
    }

    /**
     * Post giro transaction (when received)
     */
    public function post(GiroTransaction $giroTransaction)
    {
        if ($giroTransaction->jurnal_terima_id) {
            return back()->withErrors([
                'message' => 'Giro sudah diposting sebelumnya'
            ]);
        }

        DB::transaction(function () use ($giroTransaction) {
            // Generate journal entry for giro received
            $jurnal = $this->generateJurnalTerima($giroTransaction);

            // Update giro transaction
            $giroTransaction->update([
                'jurnal_terima_id' => $jurnal->id,
                'posted_at' => now(),
                'posted_by' => Auth::id()
            ]);
        });

        return back()->with('message', 'Giro berhasil diposting dan jurnal penerimaan telah dibuat');
    }

    /**
     * Clear giro (when giro is cleared by bank)
     */
    public function clear(Request $request, GiroTransaction $giroTransaction)
    {
        if ($giroTransaction->status_giro === 'cair') {
            return back()->withErrors([
                'message' => 'Giro sudah dicairkan sebelumnya'
            ]);
        }

        if (!$giroTransaction->jurnal_terima_id) {
            return back()->withErrors([
                'message' => 'Giro harus diposting terlebih dahulu sebelum dapat dicairkan'
            ]);
        }

        $validated = $request->validate([
            'tanggal_cair' => 'required|date|after_or_equal:tanggal_terima',
        ]);

        DB::transaction(function () use ($giroTransaction, $validated) {
            // Generate journal entry for giro clearing
            $jurnal = $this->generateJurnalCair($giroTransaction);

            // Update giro transaction
            $giroTransaction->update([
                'jurnal_cair_id' => $jurnal->id,
                'status_giro' => 'cair',
                'tanggal_cair' => $validated['tanggal_cair'],
            ]);

            // Update bank account balance
            $giroTransaction->bankAccount->updateSaldoBerjalan();
        });

        return back()->with('message', 'Giro berhasil dicairkan dan jurnal pencairan telah dibuat');
    }

    /**
     * Reject giro
     */
    public function reject(Request $request, GiroTransaction $giroTransaction)
    {
        if ($giroTransaction->status_giro === 'cair') {
            return back()->withErrors([
                'message' => 'Giro yang sudah cair tidak dapat ditolak'
            ]);
        }

        $validated = $request->validate([
            'keterangan_tolak' => 'required|string|max:500',
        ]);

        DB::transaction(function () use ($giroTransaction, $validated) {
            // If giro was posted, create reversal journal
            if ($giroTransaction->jurnal_terima_id) {
                $this->generateJurnalTolak($giroTransaction, $validated['keterangan_tolak']);
            }

            // Update giro status
            $giroTransaction->update([
                'status_giro' => 'ditolak',
                'keterangan' => $giroTransaction->keterangan . ' | DITOLAK: ' . $validated['keterangan_tolak'],
            ]);
        });

        return back()->with('message', 'Giro berhasil ditolak dan jurnal pembalik telah dibuat');
    }

    /**
     * Show form for batch posting giro transactions to journal
     */
    public function showPostToJournal(Request $request)
    {
        // Additional permission check (middleware already handles this, but double check for security)
        /** @var User $user */
        $user = Auth::user();
        if (!$user || !$user->hasPermission('akuntansi.journal-posting.view')) {
            abort(403, 'Unauthorized. You do not have permission to view journal posting.');
        }

        $search = $request->get('search', '');
        $perPage = $request->get('perPage', 10);
        $jenisGiro = $request->get('jenis_giro', '');
        $statusGiro = $request->get('status_giro', '');
        $bankAccountId = $request->get('bank_account_id', '');

        // Get draft giro transactions ready for posting
        $query = GiroTransaction::with(['bankAccount', 'daftarAkunGiro', 'daftarAkunLawan', 'user'])
            ->where('status', 'draft')
            ->whereNotNull('daftar_akun_lawan_id')
            ->orderBy('tanggal_terima', 'asc');

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('nomor_giro', 'like', "%{$search}%")
                  ->orWhere('nama_penerbit', 'like', "%{$search}%")
                  ->orWhere('bank_penerbit', 'like', "%{$search}%");
            });
        }

        if ($jenisGiro) {
            $query->where('jenis_giro', $jenisGiro);
        }

        if ($statusGiro) {
            $query->where('status_giro', $statusGiro);
        }

        if ($bankAccountId) {
            $query->where('bank_account_id', $bankAccountId);
        }

        $giroTransactions = $query->paginate($perPage);

        // Get options for form
        $bankAccounts = BankAccount::orderBy('nama_bank')->get();
        $daftarAkun = DaftarAkun::orderBy('kode_akun')->get();

        return Inertia::render('kas/giro-transactions/post-to-journal', [
            'giroTransactions' => $giroTransactions,
            'bankAccounts' => $bankAccounts,
            'daftarAkun' => $daftarAkun,
            'filters' => $request->only(['search', 'perPage', 'jenis_giro', 'status_giro', 'bank_account_id']),
        ]);
    }

    /**
     * Batch post selected giro transactions to journal
     */
    public function postToJournal(Request $request)
    {
        // Additional permission check (middleware already handles this, but double check for security)
        /** @var User $user */
        $user = Auth::user();
        if (!$user || !$user->hasPermission('akuntansi.journal-posting.post')) {
            abort(403, 'Unauthorized. You do not have permission to post to journal.');
        }

        $request->validate([
            'selected_transactions' => 'required|array|min:1',
            'selected_transactions.*' => 'exists:giro_transactions,id',
            'keterangan_posting' => 'string|nullable|max:255',
        ]);

        try {
            DB::beginTransaction();

            $selectedIds = $request->selected_transactions;
            $keteranganPosting = $request->keterangan_posting ?? 'Posting batch giro transactions';
            $userId = Auth::id();
            $now = now();
            
            $postedCount = 0;
            $errors = [];

            foreach ($selectedIds as $id) {
                $giro = GiroTransaction::where('id', $id)
                    ->where('status', 'draft')
                    ->whereNotNull('daftar_akun_lawan_id')
                    ->first();

                if (!$giro) {
                    $errors[] = "Giro ID {$id} tidak dapat diposting (tidak memenuhi kriteria)";
                    continue;
                }

                try {
                    // Create journal entry
                    $jurnal = Jurnal::create([
                        'nomor_jurnal' => $this->generateNomorJurnal('JU'),
                        'tanggal_transaksi' => $giro->tanggal_terima,
                        'keterangan' => "Penerimaan Giro - {$giro->nomor_giro} - {$giro->nama_penerbit}",
                        'total_debit' => $giro->jumlah,
                        'total_kredit' => $giro->jumlah,
                        'dibuat_oleh' => $userId,
                        'status' => 'posted',
                        'diposting_oleh' => $userId,
                        'tanggal_posting' => $now,
                    ]);

                    // Create journal details
                    // Debit: Giro account
                    DetailJurnal::create([
                        'jurnal_id' => $jurnal->id,
                        'daftar_akun_id' => $giro->daftar_akun_giro_id,
                        'jumlah_debit' => $giro->jumlah,
                        'jumlah_kredit' => 0,
                        'keterangan' => "Penerimaan Giro {$giro->nomor_giro}",
                    ]);

                    // Credit: Counter account
                    DetailJurnal::create([
                        'jurnal_id' => $jurnal->id,
                        'daftar_akun_id' => $giro->daftar_akun_lawan_id,
                        'jumlah_debit' => 0,
                        'jumlah_kredit' => $giro->jumlah,
                        'keterangan' => "Penerimaan Giro {$giro->nomor_giro}",
                    ]);

                    // Update giro transaction
                    $giro->update([
                        'status' => 'posted',
                        'jurnal_terima_id' => $jurnal->id,
                        'posted_at' => $now,
                        'posted_by' => $userId,
                        'posting_notes' => $keteranganPosting,
                        'posting_batch_data' => [
                            'batch_id' => uniqid('batch_'),
                            'posted_at' => $now->toISOString(),
                            'posted_by' => $userId,
                            'notes' => $keteranganPosting,
                        ],
                    ]);

                    $postedCount++;

                } catch (\Exception $e) {
                    $errors[] = "Error posting giro {$giro->nomor_giro}: " . $e->getMessage();
                }
            }

            if ($postedCount > 0) {
                DB::commit();
                
                $message = "Berhasil memposting {$postedCount} transaksi giro ke jurnal.";
                if (!empty($errors)) {
                    $message .= " Namun ada " . count($errors) . " transaksi yang gagal.";
                }
                
                return redirect()->back()->with('success', $message);
            } else {
                DB::rollBack();
                return redirect()->back()->with('error', 'Tidak ada transaksi yang berhasil diposting. Errors: ' . implode('; ', $errors));
            }

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Terjadi kesalahan: ' . $e->getMessage());
        }
    }

    private function generateJurnalTerima(GiroTransaction $giroTransaction)
    {
        $nomorJurnal = $this->generateNomorJurnal('JGTR'); // Jurnal Giro Terima

        $jurnal = Jurnal::create([
            'nomor_jurnal' => $nomorJurnal,
            'tanggal_transaksi' => $giroTransaction->tanggal_terima,
            'keterangan' => 'Penerimaan giro: ' . $giroTransaction->nomor_giro . ' - ' . $giroTransaction->nama_penerbit,
            'nomor_referensi' => $giroTransaction->nomor_giro,
            'total_debit' => $giroTransaction->jumlah,
            'total_kredit' => $giroTransaction->jumlah,
            'dibuat_oleh' => Auth::id(),
            'status' => 'posted',
            'tanggal_posting' => now(),
            'diposting_oleh' => Auth::id()
        ]);

        if ($giroTransaction->jenis_giro === 'masuk') {
            // Giro Masuk: Debit Giro, Kredit Akun Lawan
            DetailJurnal::create([
                'jurnal_id' => $jurnal->id,
                'daftar_akun_id' => $giroTransaction->daftar_akun_giro_id,
                'keterangan' => 'Penerimaan giro masuk',
                'jumlah_debit' => $giroTransaction->jumlah,
                'jumlah_kredit' => 0
            ]);

            DetailJurnal::create([
                'jurnal_id' => $jurnal->id,
                'daftar_akun_id' => $giroTransaction->daftar_akun_lawan_id,
                'keterangan' => 'Penerimaan giro masuk',
                'jumlah_debit' => 0,
                'jumlah_kredit' => $giroTransaction->jumlah
            ]);
        } else {
            // Giro Keluar: Debit Akun Lawan, Kredit Giro
            DetailJurnal::create([
                'jurnal_id' => $jurnal->id,
                'daftar_akun_id' => $giroTransaction->daftar_akun_lawan_id,
                'keterangan' => 'Pengeluaran giro keluar',
                'jumlah_debit' => $giroTransaction->jumlah,
                'jumlah_kredit' => 0
            ]);

            DetailJurnal::create([
                'jurnal_id' => $jurnal->id,
                'daftar_akun_id' => $giroTransaction->daftar_akun_giro_id,
                'keterangan' => 'Pengeluaran giro keluar',
                'jumlah_debit' => 0,
                'jumlah_kredit' => $giroTransaction->jumlah
            ]);
        }

        $jurnal->update([
            'total_debit' => $giroTransaction->jumlah,
            'total_kredit' => $giroTransaction->jumlah,
        ]);

        return $jurnal;
    }

    private function generateJurnalCair(GiroTransaction $giroTransaction)
    {
        $nomorJurnal = $this->generateNomorJurnal('JGCR'); // Jurnal Giro Cair

        $jurnal = Jurnal::create([
            'nomor_jurnal' => $nomorJurnal,
            'tanggal_transaksi' => $giroTransaction->tanggal_cair,
            'keterangan' => 'Pencairan giro: ' . $giroTransaction->nomor_giro . ' - ' . $giroTransaction->nama_penerbit,
            'nomor_referensi' => $giroTransaction->nomor_giro,
            'total_debit' => $giroTransaction->jumlah,
            'total_kredit' => $giroTransaction->jumlah,
            'dibuat_oleh' => Auth::id(),
            'status' => 'posted',
            'tanggal_posting' => now(),
            'diposting_oleh' => Auth::id()
        ]);

        if ($giroTransaction->jenis_giro === 'masuk') {
            // Giro Masuk Cair: Debit Bank, Kredit Giro
            DetailJurnal::create([
                'jurnal_id' => $jurnal->id,
                'daftar_akun_id' => $giroTransaction->bankAccount->daftar_akun_id,
                'keterangan' => 'Pencairan giro masuk ke bank',
                'jumlah_debit' => $giroTransaction->jumlah,
                'jumlah_kredit' => 0
            ]);

            DetailJurnal::create([
                'jurnal_id' => $jurnal->id,
                'daftar_akun_id' => $giroTransaction->daftar_akun_giro_id,
                'keterangan' => 'Pencairan giro masuk ke bank',
                'jumlah_debit' => 0,
                'jumlah_kredit' => $giroTransaction->jumlah
            ]);
        } else {
            // Giro Keluar Cair: Debit Giro, Kredit Bank
            DetailJurnal::create([
                'jurnal_id' => $jurnal->id,
                'daftar_akun_id' => $giroTransaction->daftar_akun_giro_id,
                'keterangan' => 'Pencairan giro keluar dari bank',
                'jumlah_debit' => $giroTransaction->jumlah,
                'jumlah_kredit' => 0
            ]);

            DetailJurnal::create([
                'jurnal_id' => $jurnal->id,
                'daftar_akun_id' => $giroTransaction->bankAccount->daftar_akun_id,
                'keterangan' => 'Pencairan giro keluar dari bank',
                'jumlah_debit' => 0,
                'jumlah_kredit' => $giroTransaction->jumlah
            ]);
        }

        $jurnal->update([
            'total_debit' => $giroTransaction->jumlah,
            'total_kredit' => $giroTransaction->jumlah,
        ]);

        return $jurnal;
    }

    private function generateJurnalTolak(GiroTransaction $giroTransaction, $keteranganTolak)
    {
        $nomorJurnal = $this->generateNomorJurnal('JGTK'); // Jurnal Giro Tolak

        $jurnal = Jurnal::create([
            'nomor_jurnal' => $nomorJurnal,
            'tanggal_transaksi' => now()->toDateString(),
            'keterangan' => 'Penolakan giro: ' . $giroTransaction->nomor_giro . ' - ' . $keteranganTolak,
            'nomor_referensi' => $giroTransaction->nomor_giro,
            'total_debit' => $giroTransaction->jumlah,
            'total_kredit' => $giroTransaction->jumlah,
            'dibuat_oleh' => Auth::id(),
            'status' => 'posted',
            'tanggal_posting' => now(),
            'diposting_oleh' => Auth::id()
        ]);

        // Reverse the original journal entry
        if ($giroTransaction->jenis_giro === 'masuk') {
            // Reverse: Kredit Giro, Debit Akun Lawan
            DetailJurnal::create([
                'jurnal_id' => $jurnal->id,
                'daftar_akun_id' => $giroTransaction->daftar_akun_lawan_id,
                'keterangan' => 'Penolakan giro masuk',
                'jumlah_debit' => $giroTransaction->jumlah,
                'jumlah_kredit' => 0
            ]);

            DetailJurnal::create([
                'jurnal_id' => $jurnal->id,
                'daftar_akun_id' => $giroTransaction->daftar_akun_giro_id,
                'keterangan' => 'Penolakan giro masuk',
                'jumlah_debit' => 0,
                'jumlah_kredit' => $giroTransaction->jumlah
            ]);
        } else {
            // Reverse: Kredit Akun Lawan, Debit Giro
            DetailJurnal::create([
                'jurnal_id' => $jurnal->id,
                'daftar_akun_id' => $giroTransaction->daftar_akun_giro_id,
                'keterangan' => 'Penolakan giro keluar',
                'jumlah_debit' => $giroTransaction->jumlah,
                'jumlah_kredit' => 0
            ]);

            DetailJurnal::create([
                'jurnal_id' => $jurnal->id,
                'daftar_akun_id' => $giroTransaction->daftar_akun_lawan_id,
                'keterangan' => 'Penolakan giro keluar',
                'jumlah_debit' => 0,
                'jumlah_kredit' => $giroTransaction->jumlah
            ]);
        }

        $jurnal->update([
            'total_debit' => $giroTransaction->jumlah,
            'total_kredit' => $giroTransaction->jumlah,
        ]);

        return $jurnal;
    }

    private function generateNomorJurnal($prefix)
    {
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
