<?php

namespace App\Http\Controllers\Akuntansi;

use App\Http\Controllers\Controller;
use App\Models\Akuntansi\DaftarAkun;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DaftarAkunController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $search = $request->get('search', '');
        $perPage = $request->get('perPage', 10);

        $query = DaftarAkun::with('indukAkun')
            ->orderBy('kode_akun');

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('kode_akun', 'like', "%{$search}%")
                  ->orWhere('nama_akun', 'like', "%{$search}%");
            });
        }

        $daftarAkun = $query->paginate($perPage);

        return Inertia::render('akuntansi/daftar-akun/index', [
            'daftarAkun' => $daftarAkun,
            'filters' => [
                'search' => $search,
                'perPage' => (int) $perPage,
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $indukAkun = DaftarAkun::where('is_aktif', true)
            ->orderBy('kode_akun')
            ->get(['id', 'kode_akun', 'nama_akun', 'jenis_akun']);

        return Inertia::render('akuntansi/daftar-akun/create', [
            'indukAkun' => $indukAkun,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'kode_akun' => 'required|string|max:20|unique:daftar_akun,kode_akun',
            'nama_akun' => 'required|string|max:255',
            'jenis_akun' => 'required|in:aset,kewajiban,modal,pendapatan,beban',
            'sub_jenis' => 'required|string',
            'saldo_normal' => 'required|in:debit,kredit',
            'induk_akun_id' => 'nullable|exists:daftar_akun,id',
            'level' => 'required|integer|min:1|max:5',
            'is_aktif' => 'boolean',
            'keterangan' => 'nullable|string',
        ]);

        // Auto set level jika ada induk akun
        if ($validated['induk_akun_id']) {
            $indukAkun = DaftarAkun::find($validated['induk_akun_id']);
            $validated['level'] = $indukAkun->level + 1;
        }

        DaftarAkun::create($validated);

        return redirect()->route('akuntansi.daftar-akun.index')
            ->with('message', 'Akun berhasil ditambahkan');
    }

    /**
     * Display the specified resource.
     */
    public function show(DaftarAkun $daftarAkun)
    {
        $daftarAkun->load(['indukAkun', 'subAkun']);
        
        return Inertia::render('akuntansi/daftar-akun/show', [
            'daftarAkun' => $daftarAkun,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(DaftarAkun $daftarAkun)
    {
        $indukAkun = DaftarAkun::where('is_aktif', true)
            ->where('id', '!=', $daftarAkun->id) // Exclude current account
            ->orderBy('kode_akun')
            ->get(['id', 'kode_akun', 'nama_akun', 'jenis_akun']);

        return Inertia::render('akuntansi/daftar-akun/edit', [
            'daftarAkun' => $daftarAkun,
            'indukAkun' => $indukAkun,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, DaftarAkun $daftarAkun)
    {
        $validated = $request->validate([
            'kode_akun' => 'required|string|max:20|unique:daftar_akun,kode_akun,' . $daftarAkun->id,
            'nama_akun' => 'required|string|max:255',
            'jenis_akun' => 'required|in:aset,kewajiban,modal,pendapatan,beban',
            'sub_jenis' => 'required|string',
            'saldo_normal' => 'required|in:debit,kredit',
            'induk_akun_id' => 'nullable|exists:daftar_akun,id',
            'level' => 'required|integer|min:1|max:5',
            'is_aktif' => 'boolean',
            'keterangan' => 'nullable|string',
        ]);

        // Auto set level jika ada induk akun
        if ($validated['induk_akun_id']) {
            $indukAkun = DaftarAkun::find($validated['induk_akun_id']);
            $validated['level'] = $indukAkun->level + 1;
        }

        $daftarAkun->update($validated);

        return redirect()->route('akuntansi.daftar-akun.index')
            ->with('message', 'Akun berhasil diperbarui');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(DaftarAkun $daftarAkun)
    {
        // Check if account has child accounts
        if ($daftarAkun->subAkun()->count() > 0) {
            return back()->withErrors([
                'message' => 'Tidak dapat menghapus akun yang memiliki sub akun'
            ]);
        }

        // Check if account has journal entries
        if ($daftarAkun->detailJurnal()->count() > 0) {
            return back()->withErrors([
                'message' => 'Tidak dapat menghapus akun yang sudah digunakan dalam jurnal'
            ]);
        }

        $daftarAkun->delete();

        return redirect()->route('akuntansi.daftar-akun.index')
            ->with('message', 'Akun berhasil dihapus');
    }
}
