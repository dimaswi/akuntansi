<?php

namespace App\Http\Controllers\Kas;

use App\Http\Controllers\Controller;
use App\Models\Kas\CashTransaction;
use App\Models\Akuntansi\DaftarAkun;
use App\Models\Akuntansi\Jurnal;
use App\Models\Akuntansi\DetailJurnal;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

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

        $perPage = (int) ($request->perPage ?? 15);
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
                'perPage' => (int) ($request->perPage ?? 15),
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

        $akunLawan = DaftarAkun::aktif()->orderBy('kode_akun')->get();

        return Inertia::render('kas/cash-transactions/create', [
            'daftarAkunKas' => $akunKas,
            'daftarAkun' => $akunLawan,
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

    public function store(Request $request)
    {
        $request->validate([
            'tanggal_transaksi' => 'required|date',
            'jenis_transaksi' => 'required|in:penerimaan,pengeluaran,uang_muka_penerimaan,uang_muka_pengeluaran,transfer_masuk,transfer_keluar',
            'jumlah' => 'required|numeric|min:0',
            'keterangan' => 'required|string|max:500',
            'pihak_terkait' => 'nullable|string|max:200',
            'referensi' => 'nullable|string|max:100',
            'daftar_akun_kas_id' => 'required|exists:daftar_akun,id',
            'daftar_akun_lawan_id' => 'required|exists:daftar_akun,id'
        ]);

        DB::transaction(function () use ($request) {
            $cashTransaction = new CashTransaction($request->all());
            $cashTransaction->user_id = Auth::id();
            $cashTransaction->status = 'draft';
            $cashTransaction->nomor_transaksi = $cashTransaction->generateNomorTransaksi();
            $cashTransaction->save();
        });

        return redirect()->route('kas.cash-transactions.index')
            ->with('success', 'Transaksi kas berhasil dibuat.');
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

        $akunLawan = DaftarAkun::aktif()->orderBy('kode_akun')->get();

        return Inertia::render('kas/cash-transactions/edit', [
            'cashTransaction' => $cashTransaction,
            'daftarAkunKas' => $akunKas,
            'daftarAkun' => $akunLawan,
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
            'jumlah' => 'required|numeric|min:0',
            'keterangan' => 'required|string|max:500',
            'pihak_terkait' => 'nullable|string|max:200',
            'referensi' => 'nullable|string|max:100',
            'daftar_akun_kas_id' => 'required|exists:daftar_akun,id',
            'daftar_akun_lawan_id' => 'required|exists:daftar_akun,id'
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

    public function post(CashTransaction $cashTransaction)
    {
        if ($cashTransaction->status !== 'draft') {
            return redirect()->back()->with('error', 'Hanya transaksi dengan status draft yang dapat dipost.');
        }

        DB::transaction(function () use ($cashTransaction) {
            // Generate jurnal otomatis
            $jurnal = $this->generateJurnal($cashTransaction);
            
            // Update status
            $cashTransaction->update([
                'status' => 'posted',
                'posted_at' => now(),
                'posted_by' => Auth::id(),
                'jurnal_id' => $jurnal->id
            ]);
        });

        return redirect()->back()->with('success', 'Transaksi kas berhasil dipost dan jurnal telah dibuat.');
    }

    private function generateJurnal(CashTransaction $cashTransaction)
    {
        // Generate nomor jurnal
        $nomorJurnal = $this->generateNomorJurnal();

        // Buat jurnal header
        $jurnal = Jurnal::create([
            'nomor_jurnal' => $nomorJurnal,
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
                'daftar_akun_id' => $cashTransaction->daftar_akun_lawan_id,
                'keterangan' => $cashTransaction->keterangan,
                'jumlah_debit' => 0,
                'jumlah_kredit' => $cashTransaction->jumlah
            ]);
        } else {
            // Kas berkurang (Kredit), Akun lawan bertambah (Debit)
            DetailJurnal::create([
                'jurnal_id' => $jurnal->id,
                'daftar_akun_id' => $cashTransaction->daftar_akun_lawan_id,
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
        $prefix = 'JKS'; // Jurnal Kas
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
