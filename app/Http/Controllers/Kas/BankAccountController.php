<?php

namespace App\Http\Controllers\Kas;

use App\Http\Controllers\Controller;
use App\Models\Kas\BankAccount;
use App\Models\Akuntansi\DaftarAkun;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BankAccountController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $search = $request->get('search', '');
        $perPage = $request->get('perPage', 10);
        $status = $request->get('status', '');

        $query = BankAccount::with(['daftarAkun:id,kode_akun,nama_akun,is_aktif'])
            ->orderBy('nama_bank')
            ->orderBy('nama_rekening');

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('nama_bank', 'like', "%{$search}%")
                  ->orWhere('nama_rekening', 'like', "%{$search}%")
                  ->orWhere('nomor_rekening', 'like', "%{$search}%")
                  ->orWhere('kode_rekening', 'like', "%{$search}%");
            });
        }

        if ($status !== '') {
            $query->where('is_aktif', $status === 'aktif');
        }

        $bankAccounts = $query->paginate($perPage);

        return Inertia::render('kas/bank-accounts/index', [
            'bankAccounts' => $bankAccounts,
            'filters' => [
                'search' => $search,
                'perPage' => (int) $perPage,
                'status' => $status,
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $daftarAkunBank = DaftarAkun::where('jenis_akun', 'aset')
            ->where(function($query) {
                $query->where('nama_akun', 'like', '%bank%')
                      ->orWhere('kode_akun', 'like', '1102%'); // Assuming bank accounts start with 1102
            })
            ->aktif()
            ->orderBy('kode_akun')
            ->get(['id', 'kode_akun', 'nama_akun']);

        return Inertia::render('kas/bank-accounts/create', [
            'daftarAkunBank' => $daftarAkunBank,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'kode_rekening' => 'required|string|max:50|unique:bank_accounts,kode_rekening',
            'nama_bank' => 'required|string|max:255',
            'nama_rekening' => 'required|string|max:255',
            'nomor_rekening' => 'required|string|max:100',
            'cabang' => 'nullable|string|max:255',
            'saldo_awal' => 'required|numeric|min:0',
            'daftar_akun_id' => 'required|exists:daftar_akun,id',
            'jenis_rekening' => 'required|in:giro,tabungan,deposito',
            'keterangan' => 'nullable|string',
            'is_aktif' => 'boolean',
        ]);

        $validated['saldo_berjalan'] = $validated['saldo_awal'];

        BankAccount::create($validated);

        return redirect()->route('kas.bank-accounts.index')
            ->with('message', 'Rekening bank berhasil ditambahkan');
    }

    /**
     * Display the specified resource.
     */
    public function show(BankAccount $bankAccount)
    {
        $bankAccount->load([
            'daftarAkun' => function($query) {
                $query->select('id', 'kode_akun', 'nama_akun', 'jenis_akun', 'sub_jenis', 'saldo_normal', 'is_aktif', 'induk_akun_id');
            },
            'bankTransactions' => function($query) {
                $query->with(['daftarAkunLawan:id,kode_akun,nama_akun', 'user:id,name'])
                    ->orderBy('tanggal_transaksi', 'desc')
                    ->limit(20);
            },
            'giroTransactions' => function($query) {
                $query->with(['daftarAkunGiro:id,kode_akun,nama_akun', 'user:id,name'])
                    ->orderBy('tanggal_terima', 'desc')
                    ->limit(10);
            }
        ]);

        // Calculate saldo from detail_jurnal if daftar_akun exists
        $saldoCoa = null;
        if ($bankAccount->daftarAkun) {
            $saldoCoa = $bankAccount->daftarAkun->getBalance();
        }

        // Calculate detailed statistics
        $stats = [
            'total_transaksi_bank' => $bankAccount->bankTransactions()->count(),
            'total_transaksi_giro' => $bankAccount->giroTransactions()->count(),
            'total_setoran' => $bankAccount->bankTransactions()
                ->whereIn('jenis_transaksi', ['setoran', 'transfer_masuk', 'kliring_masuk', 'bunga_bank'])
                ->where('status', 'posted')
                ->sum('jumlah'),
            'total_penarikan' => $bankAccount->bankTransactions()
                ->whereIn('jenis_transaksi', ['penarikan', 'transfer_keluar', 'kliring_keluar', 'biaya_admin', 'pajak_bunga'])
                ->where('status', 'posted')
                ->sum('jumlah'),
            'total_giro_pending' => $bankAccount->giroTransactions()
                ->whereIn('status', ['diterima', 'posted'])
                ->sum('jumlah'),
            'total_giro_cair' => $bankAccount->giroTransactions()
                ->where('status', 'cair')
                ->sum('jumlah'),
        ];

        return Inertia::render('kas/bank-accounts/show', [
            'bank_account' => $bankAccount,
            'saldo_coa' => $saldoCoa,
            'stats' => $stats,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(BankAccount $bankAccount)
    {
        $daftarAkunBank = DaftarAkun::where('jenis_akun', 'aset')
            ->where(function($query) {
                $query->where('nama_akun', 'like', '%bank%')
                      ->orWhere('kode_akun', 'like', '1102%');
            })
            ->aktif()
            ->orderBy('kode_akun')
            ->get(['id', 'kode_akun', 'nama_akun']);

        return Inertia::render('kas/bank-accounts/edit', [
            'bank_account' => $bankAccount,
            'daftarAkunBank' => $daftarAkunBank,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, BankAccount $bankAccount)
    {
        $validated = $request->validate([
            'kode_rekening' => 'required|string|max:50|unique:bank_accounts,kode_rekening,' . $bankAccount->id,
            'nama_bank' => 'required|string|max:255',
            'nama_rekening' => 'required|string|max:255',
            'nomor_rekening' => 'required|string|max:100',
            'cabang' => 'nullable|string|max:255',
            'saldo_awal' => 'required|numeric|min:0',
            'daftar_akun_id' => 'required|exists:daftar_akun,id',
            'jenis_rekening' => 'required|in:giro,tabungan,deposito',
            'keterangan' => 'nullable|string',
            'is_aktif' => 'boolean',
        ]);

        $bankAccount->update($validated);

        return redirect()->route('kas.bank-accounts.index')
            ->with('message', 'Rekening bank berhasil diperbarui');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(BankAccount $bankAccount)
    {
        // Check if bank account has transactions
        if ($bankAccount->bankTransactions()->count() > 0 || $bankAccount->giroTransactions()->count() > 0) {
            return back()->withErrors([
                'message' => 'Tidak dapat menghapus rekening yang sudah memiliki transaksi'
            ]);
        }

        $bankAccount->delete();

        return redirect()->route('kas.bank-accounts.index')
            ->with('message', 'Rekening bank berhasil dihapus');
    }

    /**
     * Update running balance
     */
    public function updateSaldo(BankAccount $bankAccount)
    {
        $saldoBaru = $bankAccount->updateSaldoBerjalan();

        return back()->with('message', "Saldo berjalan berhasil diperbarui menjadi Rp " . number_format($saldoBaru, 0, ',', '.'));
    }
}
