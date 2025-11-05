<?php

namespace App\Http\Controllers\Akuntansi;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Akuntansi\Traits\HandlesRevisionLogs;
use App\Models\Akuntansi\DaftarAkun;
use App\Models\Akuntansi\DetailJurnal;
use App\Models\Akuntansi\Jurnal;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class JurnalPenyesuaianController extends Controller
{
    use HandlesRevisionLogs;
    /**
     * Display a listing of adjusting journals
     */
    public function index(Request $request)
    {
        $search = $request->search ?? '';
        $perPage = $request->perPage ?? 25;
        $status = $request->status ?? '';
        $tanggalDari = $request->tanggal_dari ?? '';
        $tanggalSampai = $request->tanggal_sampai ?? '';

        $query = Jurnal::with(['details.daftarAkun', 'dibuatOleh'])
            ->where('jenis_jurnal', 'penyesuaian');

        // Search filter
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('nomor_jurnal', 'like', "%{$search}%")
                  ->orWhere('keterangan', 'like', "%{$search}%");
            });
        }

        // Status filter
        if ($status) {
            $query->where('status', $status);
        }

        // Date range filter
        if ($tanggalDari) {
            $query->whereDate('tanggal_transaksi', '>=', $tanggalDari);
        }
        if ($tanggalSampai) {
            $query->whereDate('tanggal_transaksi', '<=', $tanggalSampai);
        }

        $query->orderBy('tanggal_transaksi', 'desc')
              ->orderBy('created_at', 'desc');

        $jurnalPenyesuaian = $query->paginate($perPage)->appends($request->query());

        return Inertia::render('akuntansi/jurnal-penyesuaian/index', [
            'jurnals' => $jurnalPenyesuaian,
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
     * Show the form for creating a new adjusting journal
     */
    public function create(Request $request)
    {
        $bulan = $request->bulan ?? date('m');
        $tahun = $request->tahun ?? date('Y');

        // Tanggal default: akhir bulan
        $tanggalDefault = Carbon::create($tahun, $bulan)->endOfMonth()->format('Y-m-d');

        // Template jurnal penyesuaian umum
        $templates = $this->getTemplates();

        // Daftar akun aktif
        $daftarAkun = DaftarAkun::aktif()
            ->orderBy('jenis_akun')
            ->orderBy('kode_akun')
            ->get(['id', 'kode_akun', 'nama_akun', 'jenis_akun', 'sub_jenis']);

        return Inertia::render('akuntansi/jurnal-penyesuaian/create', [
            'templates' => $templates,
            'akuns' => $daftarAkun,
            'nomor_jurnal' => $this->generateNomorJurnal(),
        ]);
    }

    /**
     * Store a newly created adjusting journal
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'tanggal_transaksi' => 'required|date',
            'jenis_referensi' => 'nullable|string|max:100',
            'nomor_referensi' => 'nullable|string|max:100',
            'keterangan' => 'required|string|max:255',
            'details' => 'required|array|min:2',
            'details.*.akun_id' => 'required|exists:daftar_akun,id',
            'details.*.debit' => 'required|numeric|min:0',
            'details.*.kredit' => 'required|numeric|min:0',
            'details.*.keterangan' => 'nullable|string|max:255',
        ]);

        // Validasi balance
        $totalDebit = collect($validated['details'])->sum('debit');
        $totalKredit = collect($validated['details'])->sum('kredit');

        if ($totalDebit != $totalKredit) {
            return back()->withErrors(['details' => 'Total debit dan kredit harus balance.']);
        }

        $jurnal = null;
        DB::transaction(function () use ($validated, $totalDebit, &$jurnal) {
            // Generate nomor jurnal
            $nomorJurnal = $this->generateNomorJurnal();

            // Buat jurnal header
            $jurnal = Jurnal::create([
                'nomor_jurnal' => $nomorJurnal,
                'jenis_jurnal' => 'penyesuaian',
                'tanggal_transaksi' => $validated['tanggal_transaksi'],
                'jenis_referensi' => $validated['jenis_referensi'] ?? 'manual',
                'nomor_referensi' => $validated['nomor_referensi'] ?? null,
                'keterangan' => $validated['keterangan'],
                'total_debit' => $totalDebit,
                'total_kredit' => $totalDebit,
                'dibuat_oleh' => Auth::id(),
                'status' => 'draft',
            ]);

            // Buat detail jurnal
            foreach ($validated['details'] as $detail) {
                DetailJurnal::create([
                    'jurnal_id' => $jurnal->id,
                    'daftar_akun_id' => $detail['akun_id'],
                    'keterangan' => $detail['keterangan'] ?? $validated['keterangan'],
                    'jumlah_debit' => $detail['debit'],
                    'jumlah_kredit' => $detail['kredit'],
                ]);
            }
        });

        // Send notification - system will auto-filter based on each role's notification_settings
        if ($jurnal) {
            $notificationService = new NotificationService();
            $notificationService->sendToAllRoles(
                NotificationService::TYPE_JURNAL_CREATED,
                [
                    'title' => 'Jurnal Penyesuaian Baru Dibuat',
                    'message' => "Jurnal Penyesuaian {$jurnal->nomor_jurnal} telah dibuat oleh " . Auth::user()->name . " dengan total Rp " . number_format($jurnal->total_debit, 0, ',', '.'),
                    'action_url' => route('akuntansi.jurnal-penyesuaian.show', $jurnal->id),
                    'data' => ['jurnal_id' => $jurnal->id]
                ]
            );
        }

        return redirect()->route('akuntansi.jurnal-penyesuaian.index')
            ->with('success', 'Jurnal penyesuaian berhasil dibuat.');
    }

    /**
     * Display the specified adjusting journal
     */
    public function show(Jurnal $jurnalPenyesuaian)
    {
        $jurnalPenyesuaian->load(['details.daftarAkun', 'dibuatOleh', 'dipostingOleh']);

        return Inertia::render('akuntansi/jurnal-penyesuaian/show', [
            'jurnal' => $jurnalPenyesuaian,
        ]);
    }

    /**
     * Show the form for editing the specified adjusting journal
     */
    public function edit(Jurnal $jurnalPenyesuaian)
    {
        // Cek apakah jurnal sudah diposting
        if ($jurnalPenyesuaian->status === 'posted') {
            return redirect()->route('akuntansi.jurnal-penyesuaian.show', $jurnalPenyesuaian)
                ->with('error', 'Jurnal yang sudah diposting tidak dapat diedit.');
        }

        $jurnalPenyesuaian->load(['details.daftarAkun']);
        $akuns = DaftarAkun::where('is_active', true)->orderBy('kode_akun')->get();

        return Inertia::render('akuntansi/jurnal-penyesuaian/edit', [
            'jurnal' => $jurnalPenyesuaian,
            'akuns' => $akuns,
        ]);
    }

    /**
     * Update the specified adjusting journal
     */
    public function update(Request $request, Jurnal $jurnalPenyesuaian)
    {
        // Cek apakah jurnal sudah diposting OR if it's an approved revision
        if ($jurnalPenyesuaian->status === 'posted' && !$this->isAutoApprovedRevision($request)) {
            return back()->withErrors(['error' => 'Jurnal yang sudah diposting tidak dapat diedit.']);
        }

        $validated = $request->validate([
            'tanggal_transaksi' => 'required|date',
            'jenis_referensi' => 'nullable|string|max:100',
            'nomor_referensi' => 'nullable|string|max:100',
            'keterangan' => 'required|string|max:255',
            'details' => 'required|array|min:2',
            'details.*.akun_id' => 'required|exists:daftar_akun,id',
            'details.*.debit' => 'required|numeric|min:0',
            'details.*.kredit' => 'required|numeric|min:0',
            'details.*.keterangan' => 'nullable|string|max:255',
        ]);

        // Validasi balance
        $totalDebit = collect($validated['details'])->sum('debit');
        $totalKredit = collect($validated['details'])->sum('kredit');

        if ($totalDebit != $totalKredit) {
            return back()->withErrors(['details' => 'Total debit dan kredit harus balance.']);
        }

        // Capture data before for revision log
        $dataBefore = $request->_is_revision ? $this->prepareJurnalDataForLog($jurnalPenyesuaian) : null;

        DB::transaction(function () use ($validated, $jurnalPenyesuaian, $totalDebit, $request, $dataBefore) {
            // Update jurnal header
            $jurnalPenyesuaian->update([
                'tanggal_transaksi' => $validated['tanggal_transaksi'],
                'jenis_referensi' => $validated['jenis_referensi'] ?? null,
                'nomor_referensi' => $validated['nomor_referensi'] ?? null,
                'keterangan' => $validated['keterangan'],
                'total_debit' => $totalDebit,
                'total_kredit' => $totalDebit,
            ]);

            // Hapus detail lama
            $jurnalPenyesuaian->details()->delete();

            // Buat detail baru
            foreach ($validated['details'] as $detail) {
                DetailJurnal::create([
                    'jurnal_id' => $jurnalPenyesuaian->id,
                    'daftar_akun_id' => $detail['akun_id'],
                    'keterangan' => $detail['keterangan'] ?? $validated['keterangan'],
                    'jumlah_debit' => $detail['debit'],
                    'jumlah_kredit' => $detail['kredit'],
                ]);
            }

            // Create revision log if this is a revision
            if ($request->_is_revision) {
                $jurnalPenyesuaian->refresh();
                $dataAfter = $this->prepareJurnalDataForLog($jurnalPenyesuaian);
                
                $this->createRevisionLog(
                    $request,
                    $jurnalPenyesuaian->id,
                    'edit',
                    $dataBefore,
                    $dataAfter
                );
            }
        });

        $message = $request->_is_revision 
            ? ($this->requiresApproval($request) 
                ? 'Permintaan revisi jurnal penyesuaian berhasil diajukan. Menunggu approval.'
                : 'Jurnal penyesuaian berhasil diperbarui (revisi periode tertutup).')
            : 'Jurnal penyesuaian berhasil diupdate.';

        return redirect()->route('akuntansi.jurnal-penyesuaian.show', $jurnalPenyesuaian)
            ->with('success', $message);
    }

    /**
     * Remove the specified adjusting journal
     */
    public function destroy(Request $request, Jurnal $jurnalPenyesuaian)
    {
        // Cek apakah jurnal sudah diposting OR if it's an approved revision
        if ($jurnalPenyesuaian->status === 'posted' && !$this->isAutoApprovedRevision($request)) {
            return back()->withErrors(['error' => 'Jurnal yang sudah diposting tidak bisa dihapus. Buat jurnal pembalik jika perlu koreksi.']);
        }

        // Capture data before for revision log
        $dataBefore = $request->_is_revision ? $this->prepareJurnalDataForLog($jurnalPenyesuaian) : null;
        $jurnalId = $jurnalPenyesuaian->id;

        DB::transaction(function () use ($jurnalPenyesuaian, $request, $dataBefore, $jurnalId) {
            // Create revision log before deletion if this is a revision
            if ($request->_is_revision) {
                $this->createRevisionLog(
                    $request,
                    $jurnalId,
                    'delete',
                    $dataBefore,
                    null
                );
            }

            // Hapus detail jurnal
            $jurnalPenyesuaian->details()->delete();

            // Hapus jurnal
            $jurnalPenyesuaian->delete();
        });

        $message = $request->_is_revision 
            ? ($this->requiresApproval($request) 
                ? 'Permintaan penghapusan jurnal penyesuaian berhasil diajukan. Menunggu approval.'
                : 'Jurnal penyesuaian berhasil dihapus (revisi periode tertutup).')
            : 'Jurnal penyesuaian berhasil dihapus.';

        return redirect()->route('akuntansi.jurnal-penyesuaian.index')
            ->with('success', $message);
    }

    /**
     * Post jurnal penyesuaian (ubah status dari draft ke posted)
     */
    public function post(Jurnal $jurnalPenyesuaian)
    {
        // Cek apakah jurnal masih draft
        if ($jurnalPenyesuaian->status !== 'draft') {
            return back()->withErrors(['error' => 'Hanya jurnal dengan status draft yang bisa diposting.']);
        }

        $jurnalPenyesuaian->update([
            'status' => 'posted',
            'tanggal_posting' => now(),
            'diposting_oleh' => Auth::id(),
        ]);

        return back()->with('success', 'Jurnal penyesuaian berhasil diposting.');
    }

    /**
     * Unpost jurnal penyesuaian (batal posting)
     */
    public function unpost(Request $request, Jurnal $jurnalPenyesuaian)
    {
        // Cek apakah jurnal sudah diposting OR if it's an approved revision
        if ($jurnalPenyesuaian->status !== 'posted' && !$this->isAutoApprovedRevision($request)) {
            return back()->withErrors(['error' => 'Hanya jurnal yang sudah diposting yang bisa dibatalkan postingnya.']);
        }

        // Capture data before for revision log
        $dataBefore = $request->_is_revision ? $this->prepareJurnalDataForLog($jurnalPenyesuaian) : null;

        DB::transaction(function () use ($jurnalPenyesuaian, $request, $dataBefore) {
            $jurnalPenyesuaian->update([
                'status' => 'draft',
                'tanggal_posting' => null,
                'diposting_oleh' => null,
            ]);

            // Create revision log if this is a revision
            if ($request->_is_revision) {
                $jurnalPenyesuaian->refresh();
                $dataAfter = $this->prepareJurnalDataForLog($jurnalPenyesuaian);
                
                $this->createRevisionLog(
                    $request,
                    $jurnalPenyesuaian->id,
                    'unpost',
                    $dataBefore,
                    $dataAfter
                );
            }
        });

        $message = $request->_is_revision 
            ? ($this->requiresApproval($request) 
                ? 'Permintaan unpost jurnal penyesuaian berhasil diajukan. Menunggu approval.'
                : 'Posting jurnal penyesuaian berhasil dibatalkan (revisi periode tertutup).')
            : 'Posting jurnal penyesuaian berhasil dibatalkan.';

        return back()->with('success', $message);
    }

    /**
     * Reverse jurnal penyesuaian (membuat jurnal pembalik)
     */
    public function reverse(Request $request, Jurnal $jurnalPenyesuaian)
    {
        // Cek apakah jurnal sudah diposting OR if it's an approved revision
        if ($jurnalPenyesuaian->status !== 'posted' && !$this->isAutoApprovedRevision($request)) {
            return back()->withErrors(['error' => 'Hanya jurnal yang sudah diposting yang bisa di-reverse.']);
        }

        // Capture data before for revision log
        $dataBefore = $request->_is_revision ? $this->prepareJurnalDataForLog($jurnalPenyesuaian) : null;

        DB::transaction(function () use ($jurnalPenyesuaian, $request, $dataBefore) {
            // Generate nomor jurnal baru untuk reversal
            $nomorJurnalBaru = $this->generateNomorJurnal();

            // Buat jurnal pembalik
            $jurnalPembalik = Jurnal::create([
                'nomor_jurnal' => $nomorJurnalBaru,
                'jenis_jurnal' => 'penyesuaian',
                'tanggal_transaksi' => now()->format('Y-m-d'),
                'jenis_referensi' => 'reversal',
                'nomor_referensi' => $jurnalPenyesuaian->nomor_jurnal,
                'keterangan' => 'PEMBALIK - ' . $jurnalPenyesuaian->keterangan,
                'total_debit' => $jurnalPenyesuaian->total_debit,
                'total_kredit' => $jurnalPenyesuaian->total_kredit,
                'dibuat_oleh' => Auth::id(),
                'status' => 'posted',
                'tanggal_posting' => now(),
                'diposting_oleh' => Auth::id(),
            ]);

            // Buat detail dengan membalik debit-kredit
            foreach ($jurnalPenyesuaian->details as $detail) {
                DetailJurnal::create([
                    'jurnal_id' => $jurnalPembalik->id,
                    'daftar_akun_id' => $detail->daftar_akun_id,
                    'keterangan' => 'PEMBALIK - ' . $detail->keterangan,
                    'jumlah_debit' => $detail->jumlah_kredit, // Tukar debit-kredit
                    'jumlah_kredit' => $detail->jumlah_debit, // Tukar debit-kredit
                ]);
            }

            // Update status jurnal asli
            $jurnalPenyesuaian->update([
                'status' => 'reversed',
            ]);

            // Create revision log if this is a revision
            if ($request->_is_revision) {
                $jurnalPenyesuaian->refresh();
                $dataAfter = $this->prepareJurnalDataForLog($jurnalPenyesuaian);
                
                $this->createRevisionLog(
                    $request,
                    $jurnalPenyesuaian->id,
                    'reverse',
                    $dataBefore,
                    $dataAfter
                );
            }
        });

        $message = $request->_is_revision 
            ? ($this->requiresApproval($request) 
                ? 'Permintaan reverse jurnal penyesuaian berhasil diajukan. Menunggu approval.'
                : 'Jurnal penyesuaian berhasil di-reverse (revisi periode tertutup). Jurnal pembalik telah dibuat.')
            : 'Jurnal penyesuaian berhasil di-reverse. Jurnal pembalik telah dibuat.';

        return back()->with('success', $message);
    }

    /**
     * Generate nomor jurnal penyesuaian
     */
    private function generateNomorJurnal()
    {
        $tahun = date('Y');
        $bulan = date('m');

        // Format: JP/YYYY/MM/XXXX
        $prefix = "JP/{$tahun}/{$bulan}/";

        // Cari nomor terakhir di bulan ini
        $lastJurnal = Jurnal::where('jenis_jurnal', 'penyesuaian')
            ->where('nomor_jurnal', 'like', $prefix . '%')
            ->orderBy('nomor_jurnal', 'desc')
            ->first();

        if ($lastJurnal) {
            // Extract nomor urut
            $lastNumber = (int) substr($lastJurnal->nomor_jurnal, -4);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return $prefix . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Get templates for common adjusting entries
     */
    private function getTemplates()
    {
        return [
            [
                'id' => 'depreciation',
                'nama' => 'Penyusutan Aset Tetap',
                'kategori' => 'depreciation',
                'keterangan' => 'Penyusutan aset tetap bulan {bulan} {tahun}',
                'debit_hint' => 'Beban Penyusutan',
                'kredit_hint' => 'Akumulasi Penyusutan',
            ],
            [
                'id' => 'prepaid_rent',
                'nama' => 'Alokasi Sewa Dibayar Dimuka',
                'kategori' => 'prepaid_expense',
                'keterangan' => 'Alokasi beban sewa bulan {bulan} {tahun}',
                'debit_hint' => 'Beban Sewa',
                'kredit_hint' => 'Sewa Dibayar Dimuka',
            ],
            [
                'id' => 'prepaid_insurance',
                'nama' => 'Alokasi Asuransi Dibayar Dimuka',
                'kategori' => 'prepaid_expense',
                'keterangan' => 'Alokasi beban asuransi bulan {bulan} {tahun}',
                'debit_hint' => 'Beban Asuransi',
                'kredit_hint' => 'Asuransi Dibayar Dimuka',
            ],
            [
                'id' => 'accrual_utility',
                'nama' => 'Beban Utilitas yang Masih Harus Dibayar',
                'kategori' => 'accrual_expense',
                'keterangan' => 'Beban listrik/air yang masih harus dibayar',
                'debit_hint' => 'Beban Listrik/Air',
                'kredit_hint' => 'Utang Listrik/Air',
            ],
            [
                'id' => 'accrual_salary',
                'nama' => 'Beban Gaji yang Masih Harus Dibayar',
                'kategori' => 'accrual_expense',
                'keterangan' => 'Beban gaji yang masih harus dibayar',
                'debit_hint' => 'Beban Gaji',
                'kredit_hint' => 'Utang Gaji',
            ],
            [
                'id' => 'bad_debt',
                'nama' => 'Beban Piutang Tak Tertagih',
                'kategori' => 'bad_debt',
                'keterangan' => 'Pencadangan piutang tak tertagih',
                'debit_hint' => 'Beban Piutang Tak Tertagih',
                'kredit_hint' => 'Cadangan Piutang Tak Tertagih',
            ],
            [
                'id' => 'unearned_revenue',
                'nama' => 'Pendapatan Diterima Dimuka yang Direalisasi',
                'kategori' => 'unearned_revenue',
                'keterangan' => 'Realisasi pendapatan diterima dimuka',
                'debit_hint' => 'Pendapatan Diterima Dimuka',
                'kredit_hint' => 'Pendapatan',
            ],
            [
                'id' => 'manual',
                'nama' => 'Manual (Custom)',
                'kategori' => 'other',
                'keterangan' => 'Jurnal penyesuaian manual',
                'debit_hint' => 'Pilih akun',
                'kredit_hint' => 'Pilih akun',
            ],
        ];
    }

    /**
     * Get month options for filter
     */
    private function getBulanOptions()
    {
        return [
            ['value' => 1, 'label' => 'Januari'],
            ['value' => 2, 'label' => 'Februari'],
            ['value' => 3, 'label' => 'Maret'],
            ['value' => 4, 'label' => 'April'],
            ['value' => 5, 'label' => 'Mei'],
            ['value' => 6, 'label' => 'Juni'],
            ['value' => 7, 'label' => 'Juli'],
            ['value' => 8, 'label' => 'Agustus'],
            ['value' => 9, 'label' => 'September'],
            ['value' => 10, 'label' => 'Oktober'],
            ['value' => 11, 'label' => 'November'],
            ['value' => 12, 'label' => 'Desember'],
        ];
    }
}
