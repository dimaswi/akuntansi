<?php

namespace App\Http\Controllers\Akuntansi;

use App\Http\Controllers\Controller;
use App\Models\Akuntansi\DaftarAkun;
use App\Models\Akuntansi\Jurnal;
use App\Models\Akuntansi\DetailJurnal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class JurnalController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $search = $request->get('search', '');
        $perPage = $request->get('perPage', 10);
        $status = $request->get('status', '');
        $tanggalDari = $request->get('tanggal_dari', '');
        $tanggalSampai = $request->get('tanggal_sampai', '');

        $query = Jurnal::with(['dibuatOleh'])
            ->where(function($q) {
                $q->where('jenis_jurnal', 'umum')
                  ->orWhereNull('jenis_jurnal');
            })
            ->orderBy('tanggal_transaksi', 'desc')
            ->orderBy('created_at', 'desc');

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('nomor_jurnal', 'like', "%{$search}%")
                  ->orWhere('keterangan', 'like', "%{$search}%");
            });
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($tanggalDari) {
            $query->whereDate('tanggal_transaksi', '>=', $tanggalDari);
        }

        if ($tanggalSampai) {
            $query->whereDate('tanggal_transaksi', '<=', $tanggalSampai);
        }

        $jurnal = $query->paginate($perPage);

        return Inertia::render('akuntansi/jurnal/index', [
            'jurnal' => $jurnal,
            'filters' => [
                'search' => $search,
                'perPage' => (int) $perPage,
                'status' => $status,
                'tanggal_dari' => $tanggalDari,
                'tanggal_sampai' => $tanggalSampai,
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $daftarAkun = DaftarAkun::aktif()
            ->orderBy('kode_akun')
            ->get(['id', 'kode_akun', 'nama_akun', 'jenis_akun', 'sub_jenis']);

        return Inertia::render('akuntansi/jurnal/create', [
            'daftar_akun' => $daftarAkun,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nomor_jurnal' => 'nullable|string|unique:jurnal,nomor_jurnal',
            'tanggal_transaksi' => 'required|date',
            'jenis_referensi' => 'nullable|string',
            'nomor_referensi' => 'nullable|string',
            'keterangan' => 'required|string',
            'details' => 'required|array|min:2',
            'details.*.daftar_akun_id' => 'required|exists:daftar_akun,id',
            'details.*.jumlah_debit' => 'required|numeric|min:0',
            'details.*.jumlah_kredit' => 'required|numeric|min:0',
            'details.*.keterangan' => 'required|string',
        ]);

        // Generate nomor jurnal if not provided
        if (empty($validated['nomor_jurnal'])) {
            $lastJurnal = Jurnal::whereYear('created_at', date('Y'))
                ->orderBy('created_at', 'desc')
                ->first();
            
            $nextNumber = 1;
            if ($lastJurnal) {
                $lastNumber = (int) substr($lastJurnal->nomor_jurnal, -4);
                $nextNumber = $lastNumber + 1;
            }
            
            $validated['nomor_jurnal'] = 'JE-' . date('Y') . '-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
        }

        // Validate balanced journal
        $totalDebit = collect($validated['details'])->sum('jumlah_debit');
        $totalKredit = collect($validated['details'])->sum('jumlah_kredit');

        if ($totalDebit != $totalKredit) {
            return back()->withErrors([
                'details' => 'Total debit dan kredit harus seimbang'
            ]);
        }

        // Validate each detail has either debit or credit (not both)
        foreach ($validated['details'] as $detail) {
            if (($detail['jumlah_debit'] > 0 && $detail['jumlah_kredit'] > 0) ||
                ($detail['jumlah_debit'] == 0 && $detail['jumlah_kredit'] == 0)) {
                return back()->withErrors([
                    'details' => 'Setiap baris harus memiliki nilai debit ATAU kredit, tidak boleh keduanya'
                ]);
            }
        }

        DB::transaction(function () use ($validated) {
            $jurnal = Jurnal::create([
                'nomor_jurnal' => $validated['nomor_jurnal'],
                'jenis_jurnal' => 'umum',
                'tanggal_transaksi' => $validated['tanggal_transaksi'],
                'jenis_referensi' => $validated['jenis_referensi'],
                'nomor_referensi' => $validated['nomor_referensi'],
                'keterangan' => $validated['keterangan'],
                'total_debit' => collect($validated['details'])->sum('jumlah_debit'),
                'total_kredit' => collect($validated['details'])->sum('jumlah_kredit'),
                'status' => 'draft',
                'dibuat_oleh' => Auth::id(),
            ]);

            foreach ($validated['details'] as $detail) {
                DetailJurnal::create([
                    'jurnal_id' => $jurnal->id,
                    'daftar_akun_id' => $detail['daftar_akun_id'],
                    'jumlah_debit' => $detail['jumlah_debit'],
                    'jumlah_kredit' => $detail['jumlah_kredit'],
                    'keterangan' => $detail['keterangan'],
                ]);
            }
        });

        return redirect()->route('akuntansi.jurnal.index')
            ->with('message', 'Jurnal berhasil disimpan');
    }

    /**
     * Display the specified resource.
     */
    public function show(Jurnal $jurnal)
    {
        $jurnal->load([
            'details.daftarAkun',
            'dibuatOleh',
            'dipostingOleh'
        ]);

        return Inertia::render('akuntansi/jurnal/show', [
            'jurnal' => $jurnal,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Jurnal $jurnal)
    {
        // Only allow editing draft journals
        if ($jurnal->status !== 'draft') {
            return redirect()->route('akuntansi.jurnal.show', $jurnal)
                ->withErrors(['message' => 'Hanya jurnal dengan status draft yang dapat diedit']);
        }

        $jurnal->load('details');
        
        $daftarAkun = DaftarAkun::aktif()
            ->orderBy('kode_akun')
            ->get(['id', 'kode_akun', 'nama_akun', 'jenis_akun', 'sub_jenis']);

        return Inertia::render('akuntansi/jurnal/edit', [
            'jurnal' => $jurnal,
            'daftar_akun' => $daftarAkun,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Jurnal $jurnal)
    {
        // Only allow updating draft journals
        if ($jurnal->status !== 'draft') {
            return back()->withErrors([
                'message' => 'Hanya jurnal dengan status draft yang dapat diubah'
            ]);
        }

        $validated = $request->validate([
            'tanggal_transaksi' => 'required|date',
            'jenis_referensi' => 'nullable|string',
            'nomor_referensi' => 'nullable|string',
            'keterangan' => 'required|string',
            'details' => 'required|array|min:2',
            'details.*.daftar_akun_id' => 'required|exists:daftar_akun,id',
            'details.*.jumlah_debit' => 'required|numeric|min:0',
            'details.*.jumlah_kredit' => 'required|numeric|min:0',
            'details.*.keterangan' => 'required|string',
        ]);

        // Validate balanced journal
        $totalDebit = collect($validated['details'])->sum('jumlah_debit');
        $totalKredit = collect($validated['details'])->sum('jumlah_kredit');

        if ($totalDebit != $totalKredit) {
            return back()->withErrors([
                'details' => 'Total debit dan kredit harus seimbang'
            ]);
        }

        // Validate each detail has either debit or credit (not both)
        foreach ($validated['details'] as $detail) {
            if (($detail['jumlah_debit'] > 0 && $detail['jumlah_kredit'] > 0) ||
                ($detail['jumlah_debit'] == 0 && $detail['jumlah_kredit'] == 0)) {
                return back()->withErrors([
                    'details' => 'Setiap baris harus memiliki nilai debit ATAU kredit, tidak boleh keduanya'
                ]);
            }
        }

        DB::transaction(function () use ($validated, $jurnal) {
            // Update jurnal
            $jurnal->update([
                'tanggal_transaksi' => $validated['tanggal_transaksi'],
                'jenis_referensi' => $validated['jenis_referensi'],
                'nomor_referensi' => $validated['nomor_referensi'],
                'keterangan' => $validated['keterangan'],
                'total_debit' => collect($validated['details'])->sum('jumlah_debit'),
                'total_kredit' => collect($validated['details'])->sum('jumlah_kredit'),
            ]);

            // Delete existing details
            $jurnal->details()->delete();

            // Create new details
            foreach ($validated['details'] as $detail) {
                DetailJurnal::create([
                    'jurnal_id' => $jurnal->id,
                    'daftar_akun_id' => $detail['daftar_akun_id'],
                    'jumlah_debit' => $detail['jumlah_debit'],
                    'jumlah_kredit' => $detail['jumlah_kredit'],
                    'keterangan' => $detail['keterangan'],
                ]);
            }
        });

        return redirect()->route('akuntansi.jurnal.show', $jurnal)
            ->with('message', 'Jurnal berhasil diperbarui');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Jurnal $jurnal)
    {
        // Only allow deleting draft journals
        if ($jurnal->status !== 'draft') {
            return back()->withErrors([
                'message' => 'Hanya jurnal dengan status draft yang dapat dihapus'
            ]);
        }

        $jurnal->delete();

        return redirect()->route('akuntansi.jurnal.index')
            ->with('message', 'Jurnal berhasil dihapus');
    }

    /**
     * Post journal entry
     */
    public function post(Jurnal $jurnal)
    {
        if ($jurnal->status !== 'draft') {
            return back()->withErrors([
                'message' => 'Hanya jurnal dengan status draft yang dapat diposting'
            ]);
        }

        $jurnal->update([
            'status' => 'posted',
            'diposting_oleh' => Auth::id(),
            'tanggal_posting' => now(),
        ]);

        return back()->with('message', 'Jurnal berhasil diposting');
    }

    /**
     * Unpost journal entry (cancel posting)
     */
    public function unpost(Jurnal $jurnal)
    {
        if ($jurnal->status !== 'posted') {
            return back()->withErrors([
                'message' => 'Hanya jurnal dengan status posted yang dapat dibatalkan postingnya'
            ]);
        }

        $jurnal->update([
            'status' => 'draft',
            'diposting_oleh' => null,
            'tanggal_posting' => null,
        ]);

        return back()->with('message', 'Posting jurnal berhasil dibatalkan');
    }

    /**
     * Reverse journal entry
     */
    public function reverse(Jurnal $jurnal)
    {
        if ($jurnal->status !== 'posted') {
            return back()->withErrors([
                'message' => 'Hanya jurnal dengan status posted yang dapat direverse'
            ]);
        }

        $jurnal->update([
            'status' => 'reversed',
        ]);

        return back()->with('message', 'Jurnal berhasil direverse');
    }
}
