<?php

namespace App\Http\Controllers\Kas;

use App\Http\Controllers\Controller;
use App\Models\Kas\CashTransaction;
use App\Models\Akuntansi\DaftarAkun;
use App\Models\Akuntansi\Jurnal;
use App\Models\Akuntansi\DetailJurnal;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class CashTransactionController extends Controller
{
    public function index(Request $request)
    {
        $query = CashTransaction::with(['daftarAkunKas', 'daftarAkunLawan', 'user'])
            ->orderBy('tanggal_transaksi', 'desc')
            ->orderBy('created_at', 'desc');

        // Filter berdasarkan pencarian
        if ($request->search) {
            $query->where(function($q) use ($request) {
                $q->where('nomor_transaksi', 'like', '%' . $request->search . '%')
                  ->orWhere('keterangan', 'like', '%' . $request->search . '%')
                  ->orWhere('pihak_terkait', 'like', '%' . $request->search . '%')
                  ->orWhere('referensi', 'like', '%' . $request->search . '%');
            });
        }

        // Filter berdasarkan jenis transaksi
        if ($request->jenis_transaksi) {
            $query->where('jenis_transaksi', $request->jenis_transaksi);
        }

        // Filter berdasarkan status
        if ($request->status) {
            $query->where('status', $request->status);
        }

        // Filter berdasarkan tanggal
        if ($request->tanggal_dari) {
            $query->where('tanggal_transaksi', '>=', $request->tanggal_dari);
        }
        if ($request->tanggal_sampai) {
            $query->where('tanggal_transaksi', '<=', $request->tanggal_sampai);
        }

        $perPage = (int) ($request->perPage ?? 10);
        $cashTransactions = $query->paginate($perPage);

        // Summary data
        $summary = [
            'total_penerimaan' => CashTransaction::penerimaan()->posted()->sum('jumlah'),
            'total_pengeluaran' => CashTransaction::pengeluaran()->posted()->sum('jumlah'),
            'total_draft' => CashTransaction::draft()->count(),
            'saldo_kas' => $this->getSaldoKas()
        ];

        return Inertia::render('kas/cash-transactions/index', [
            'cashTransactions' => $cashTransactions,
            'summary' => $summary,
            'filters' => [
                'search' => $request->search ?? '',
                'jenis_transaksi' => $request->jenis_transaksi ?? '',
                'status' => $request->status ?? '',
                'tanggal_dari' => $request->tanggal_dari ?? '',
                'tanggal_sampai' => $request->tanggal_sampai ?? '',
                'perPage' => (int) ($request->perPage ?? 10),
            ],
            'jenisTransaksi' => [
                'penerimaan' => 'Penerimaan Kas',
                'pengeluaran' => 'Pengeluaran Kas',
                'uang_muka_penerimaan' => 'Uang Muka Penerimaan',
                'uang_muka_pengeluaran' => 'Uang Muka Pengeluaran',
                'transfer_masuk' => 'Transfer Masuk',
                'transfer_keluar' => 'Transfer Keluar'
            ]
        ]);
    }

    public function create()
    {
        $akunKas = DaftarAkun::where('jenis_akun', 'aset')
            ->where(function($query) {
                $query->where('nama_akun', 'like', '%kas%')
                      ->orWhere('kode_akun', 'like', '1.1.1%');
            })
            ->aktif()
            ->orderBy('kode_akun')
            ->get();

        return Inertia::render('kas/cash-transactions/create', [
            'daftarAkunKas' => $akunKas,
            'jenisTransaksi' => [
                'penerimaan' => 'Penerimaan Kas',
                'pengeluaran' => 'Pengeluaran Kas'
            ]
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'tanggal_transaksi' => 'required|date',
            'jenis_transaksi' => 'required|in:penerimaan,pengeluaran,uang_muka_penerimaan,uang_muka_pengeluaran,transfer_masuk,transfer_keluar',
            'kategori_transaksi' => 'required|string|max:100',
            'jumlah' => 'required|numeric|min:0',
            'keterangan' => 'required|string|max:500',
            'pihak_terkait' => 'nullable|string|max:200',
            'referensi' => 'nullable|string|max:100',
            'daftar_akun_kas_id' => 'required|exists:daftar_akun,id'
        ]);

        DB::transaction(function () use ($request) {
            $cashTransaction = new CashTransaction($request->all());
            $cashTransaction->user_id = Auth::id();
            $cashTransaction->status = 'draft';
            $cashTransaction->nomor_transaksi = $cashTransaction->generateNomorTransaksi();
            $cashTransaction->save();
        });

        return redirect()->route('kas.cash-transactions.index')
            ->with('success', 'Transaksi kas berhasil dibuat dan menunggu posting ke jurnal.');
    }

    public function show(CashTransaction $cashTransaction)
    {
        $cashTransaction->load(['daftarAkunKas', 'daftarAkunLawan', 'user', 'postedBy', 'jurnal.details.daftarAkun']);

        return Inertia::render('kas/cash-transactions/show', [
            'cashTransaction' => $cashTransaction
        ]);
    }

    public function edit(CashTransaction $cashTransaction)
    {
        if ($cashTransaction->status !== 'draft') {
            return redirect()->back()->with('error', 'Hanya transaksi dengan status draft yang dapat diedit.');
        }

        $akunKas = DaftarAkun::where('jenis_akun', 'aset')
            ->where(function($query) {
                $query->where('nama_akun', 'like', '%kas%')
                      ->orWhere('kode_akun', 'like', '1.1.1%');
            })
            ->aktif()
            ->orderBy('kode_akun')
            ->get();

        // Daftar akun untuk sumber/tujuan transaksi
        $daftarAkun = DaftarAkun::aktif()
            ->whereIn('jenis_akun', ['pendapatan', 'biaya', 'beban', 'kewajiban', 'modal', 'aset'])
            ->orderBy('jenis_akun')
            ->orderBy('kode_akun')
            ->get();

        return Inertia::render('kas/cash-transactions/edit', [
            'cashTransaction' => $cashTransaction,
            'daftarAkunKas' => $akunKas,
            'daftarAkun' => $daftarAkun,
            'jenisTransaksi' => [
                'penerimaan' => 'Penerimaan Kas',
                'pengeluaran' => 'Pengeluaran Kas',
                'uang_muka_penerimaan' => 'Uang Muka Penerimaan',
                'uang_muka_pengeluaran' => 'Uang Muka Pengeluaran',
                'transfer_masuk' => 'Transfer Masuk',
                'transfer_keluar' => 'Transfer Keluar'
            ]
        ]);
    }

    public function update(Request $request, CashTransaction $cashTransaction)
    {
        if ($cashTransaction->status !== 'draft') {
            return redirect()->back()->with('error', 'Hanya transaksi dengan status draft yang dapat diedit.');
        }

        $request->validate([
            'tanggal_transaksi' => 'required|date',
            'jenis_transaksi' => 'required|in:penerimaan,pengeluaran,uang_muka_penerimaan,uang_muka_pengeluaran,transfer_masuk,transfer_keluar',
            'kategori_transaksi' => 'required|string|max:100',
            'jumlah' => 'required|numeric|min:0',
            'keterangan' => 'required|string|max:500',
            'pihak_terkait' => 'nullable|string|max:200',
            'referensi' => 'nullable|string|max:100',
            'daftar_akun_kas_id' => 'required|exists:daftar_akun,id'
        ]);

        $cashTransaction->update($request->all());

        return redirect()->route('kas.cash-transactions.index')
            ->with('success', 'Transaksi kas berhasil diupdate.');
    }

    public function destroy(CashTransaction $cashTransaction)
    {
        if ($cashTransaction->status !== 'draft') {
            return redirect()->back()->with('error', 'Hanya transaksi dengan status draft yang dapat dihapus.');
        }

        $cashTransaction->delete();

        return redirect()->route('kas.cash-transactions.index')
            ->with('success', 'Transaksi kas berhasil dihapus.');
    }

    /**
     * Batch posting cash transactions to journal
     */
    public function postToJurnal(Request $request)
    {
        $request->validate([
            'cash_transaction_id' => 'required|exists:cash_transactions,id',
            'detail_jurnal' => 'required|array|min:2',
            'detail_jurnal.*.daftar_akun_id' => 'required|exists:daftar_akun,id',
            'detail_jurnal.*.keterangan' => 'required|string|max:255',
            'detail_jurnal.*.jumlah_debit' => 'required|numeric|min:0',
            'detail_jurnal.*.jumlah_kredit' => 'required|numeric|min:0',
        ]);

        // Validasi balance
        $totalDebit = collect($request->detail_jurnal)->sum('jumlah_debit');
        $totalKredit = collect($request->detail_jurnal)->sum('jumlah_kredit');

        if ($totalDebit != $totalKredit) {
            return back()->withErrors(['detail_jurnal' => 'Total debit dan kredit harus balance.']);
        }

        $cashTransaction = CashTransaction::findOrFail($request->cash_transaction_id);

        if ($cashTransaction->status !== 'draft') {
            return back()->withErrors(['cash_transaction_id' => 'Transaksi sudah diposting atau bukan draft.']);
        }

        $jurnal = null;
        DB::transaction(function () use ($request, $cashTransaction, $totalDebit, &$jurnal) {
            // Generate nomor jurnal - gunakan nomor transaksi sebagai referensi
            // Format: JKS dari nomor transaksi KAS-YYYY-MM-XXXX menjadi JKS/YYYY/MM/XXXX
            $nomorJurnal = str_replace('KAS-', 'JKS/', $cashTransaction->nomor_transaksi);
            $nomorJurnal = str_replace('-', '/', $nomorJurnal);

            // Buat keterangan jurnal dari transaksi kas
            $keteranganJurnal = $cashTransaction->keterangan . ' - ' . $cashTransaction->pihak_terkait;

            // Buat jurnal header
            $jurnal = Jurnal::create([
                'nomor_jurnal' => $nomorJurnal,
                'jenis_jurnal' => 'umum',
                'tanggal_transaksi' => $cashTransaction->tanggal_transaksi, // Tanggal kas sesuai kaidah akuntansi
                'jenis_referensi' => 'kas',
                'nomor_referensi' => $cashTransaction->nomor_transaksi,
                'keterangan' => $keteranganJurnal,
                'total_debit' => $totalDebit,
                'total_kredit' => $totalDebit,
                'dibuat_oleh' => Auth::id(),
                'status' => 'posted',
                'tanggal_posting' => now(),
                'diposting_oleh' => Auth::id()
            ]);

            // Buat detail jurnal dengan keterangan masing-masing
            foreach ($request->detail_jurnal as $detail) {
                DetailJurnal::create([
                    'jurnal_id' => $jurnal->id,
                    'daftar_akun_id' => $detail['daftar_akun_id'],
                    'keterangan' => $detail['keterangan'],
                    'jumlah_debit' => $detail['jumlah_debit'],
                    'jumlah_kredit' => $detail['jumlah_kredit']
                ]);
            }

            // Update status cash transaction
            $cashTransaction->update([
                'status' => 'posted',
                'posted_at' => now(),
                'posted_by' => Auth::id(),
                'jurnal_id' => $jurnal->id
            ]);
        });

        // Send notification - system will auto-filter based on each role's notification_settings
        if ($jurnal) {
            $notificationService = new NotificationService();
            $notificationService->sendToAllRoles(
                NotificationService::TYPE_KAS_POST,
                [
                    'title' => 'Transaksi Kas Posted ke Jurnal',
                    'message' => "Transaksi kas {$cashTransaction->nomor_transaksi} sebesar Rp " . number_format($cashTransaction->jumlah, 0, ',', '.') . " telah diposting ke jurnal oleh " . Auth::user()->name,
                    'action_url' => route('akuntansi.jurnal.show', $jurnal->id),
                    'data' => ['transaction_id' => $cashTransaction->id, 'jurnal_id' => $jurnal->id]
                ]
            );
        }

        return redirect()->route('kas.cash-transactions.index')
            ->with('success', 'Berhasil memposting transaksi kas ke jurnal.');
    }

    /**
     * Show single transaction posting page
     */
    public function showPostToJournal(Request $request)
    {
        $transactionId = $request->get('id');
        
        if (!$transactionId) {
            return redirect()->route('kas.cash-transactions.index')
                ->with('error', 'Pilih transaksi untuk diposting ke jurnal.');
        }

        $cashTransaction = CashTransaction::with(['daftarAkunKas', 'user'])
            ->where('id', $transactionId)
            ->where('status', 'draft')
            ->first();

        if (!$cashTransaction) {
            return redirect()->route('kas.cash-transactions.index')
                ->with('error', 'Transaksi tidak ditemukan atau sudah diposting.');
        }

        // Debug: Log to check data
        Log::info('Cash Transaction Data:', [
            'transaction' => $cashTransaction->toArray(),
            'has_daftar_akun_kas' => $cashTransaction->daftarAkunKas ? 'yes' : 'no'
        ]);

        // Daftar akun untuk dropdown (exclude kas yang sudah auto-filled)
        $daftarAkun = DaftarAkun::aktif()
            ->where('id', '!=', $cashTransaction->daftar_akun_kas_id)
            ->orderBy('jenis_akun')
            ->orderBy('kode_akun')
            ->get(['id', 'kode_akun', 'nama_akun', 'jenis_akun']);

        // Generate nomor jurnal preview - gunakan nomor transaksi sebagai referensi
        // Format: JKS dari nomor transaksi KAS-YYYY-MM-XXXX menjadi JKS/YYYY/MM/XXXX
        $nomorJurnal = str_replace('KAS-', 'JKS/', $cashTransaction->nomor_transaksi);
        $nomorJurnal = str_replace('-', '/', $nomorJurnal);

        return Inertia::render('kas/cash-transactions/post-to-journal', [
            'cashTransaction' => $cashTransaction->load('daftarAkunKas', 'user'),
            'daftarAkun' => $daftarAkun,
            'nomorJurnalPreview' => $nomorJurnal
        ]);
    }

    private function generateJurnal(CashTransaction $cashTransaction, $daftarAkunLawanId)
    {
        // Generate nomor jurnal - gunakan nomor transaksi sebagai referensi
        // Format: JKS dari nomor transaksi KAS-YYYY-MM-XXXX menjadi JKS/YYYY/MM/XXXX
        $nomorJurnal = str_replace('KAS-', 'JKS/', $cashTransaction->nomor_transaksi);
        $nomorJurnal = str_replace('-', '/', $nomorJurnal);

        // Buat jurnal header
        $jurnal = Jurnal::create([
            'nomor_jurnal' => $nomorJurnal,
            'jenis_jurnal' => 'kas',
            'tanggal_transaksi' => $cashTransaction->tanggal_transaksi,
            'keterangan' => $cashTransaction->keterangan . ' - ' . $cashTransaction->pihak_terkait,
            'nomor_referensi' => $cashTransaction->nomor_transaksi,
            'total_debit' => $cashTransaction->jumlah,
            'total_kredit' => $cashTransaction->jumlah,
            'dibuat_oleh' => Auth::id(),
            'status' => 'posted',
            'tanggal_posting' => now(),
            'diposting_oleh' => Auth::id()
        ]);

        // Detail jurnal berdasarkan jenis transaksi
        if (in_array($cashTransaction->jenis_transaksi, ['penerimaan', 'uang_muka_penerimaan', 'transfer_masuk'])) {
            // Kas bertambah (Debit), Akun lawan berkurang (Kredit)
            DetailJurnal::create([
                'jurnal_id' => $jurnal->id,
                'daftar_akun_id' => $cashTransaction->daftar_akun_kas_id,
                'keterangan' => $cashTransaction->keterangan,
                'jumlah_debit' => $cashTransaction->jumlah,
                'jumlah_kredit' => 0
            ]);

            DetailJurnal::create([
                'jurnal_id' => $jurnal->id,
                'daftar_akun_id' => $daftarAkunLawanId,
                'keterangan' => $cashTransaction->keterangan,
                'jumlah_debit' => 0,
                'jumlah_kredit' => $cashTransaction->jumlah
            ]);
        } else {
            // Kas berkurang (Kredit), Akun lawan bertambah (Debit)
            DetailJurnal::create([
                'jurnal_id' => $jurnal->id,
                'daftar_akun_id' => $daftarAkunLawanId,
                'keterangan' => $cashTransaction->keterangan,
                'jumlah_debit' => $cashTransaction->jumlah,
                'jumlah_kredit' => 0
            ]);

            DetailJurnal::create([
                'jurnal_id' => $jurnal->id,
                'daftar_akun_id' => $cashTransaction->daftar_akun_kas_id,
                'keterangan' => $cashTransaction->keterangan,
                'jumlah_debit' => 0,
                'jumlah_kredit' => $cashTransaction->jumlah
            ]);
        }

        return $jurnal;
    }

    private function generateNomorJurnal()
    {
        $prefix = 'JU'; // Jurnal Umum (bukan JKS karena ini jurnal accounting, bukan transaksi kas)
        $tahun = date('Y');
        $bulan = date('m');
        
        // Cari nomor terakhir dari semua jurnal (JU) agar tidak bentrok dengan jurnal lain
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

    private function getSaldoKas()
    {
        $akunKas = DaftarAkun::where('jenis_akun', 'aset')
            ->where(function($query) {
                $query->where('nama_akun', 'like', '%kas%')
                      ->orWhere('kode_akun', 'like', '1.1.1%');
            })
            ->aktif()
            ->get();

        $totalSaldo = 0;
        foreach ($akunKas as $akun) {
            $debit = DetailJurnal::where('daftar_akun_id', $akun->id)
                ->whereHas('jurnal', function($query) {
                    $query->where('status', 'posted');
                })
                ->sum('jumlah_debit');

            $kredit = DetailJurnal::where('daftar_akun_id', $akun->id)
                ->whereHas('jurnal', function($query) {
                    $query->where('status', 'posted');
                })
                ->sum('jumlah_kredit');

            $totalSaldo += ($debit - $kredit);
        }

        return $totalSaldo;
    }
}
