<?php

namespace App\Http\Controllers\Penggajian;

use App\Http\Controllers\Controller;
use App\Models\Penggajian\SalaryBatch;
use App\Models\Penggajian\SalaryDetail;
use App\Models\User;
use App\Models\Akuntansi\DaftarAkun;
use App\Models\Akuntansi\Jurnal;
use App\Models\Akuntansi\DetailJurnal;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class SalaryBatchController extends Controller
{
    /**
     * Display listing of salary batches (Admin/Akuntansi) or personal salary slips (User)
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        
        // Cek role: HANYA admin dan akuntansi yang bisa akses list batch
        $canAccessBatchList = $user->hasAnyRole(['administrator', 'akuntan']);
        
        if (!$canAccessBatchList) {
            // User lain: tampilkan slip gaji mereka sendiri
            return $this->showPersonalSalarySlips($request);
        }
        
        // Admin/Akuntansi: tampilkan list batch seperti biasa
        $query = SalaryBatch::with(['creator', 'journal', 'paymentAccount']);

        // Filter by search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('batch_number', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by year
        if ($request->filled('period_year')) {
            $query->where('period_year', $request->period_year);
        }

        // Filter by month
        if ($request->filled('period_month')) {
            $query->where('period_month', $request->period_month);
        }

        $batches = $query->orderBy('period_year', 'desc')
            ->orderBy('period_month', 'desc')
            ->get();

        // Summary data
        $summary = [
            'total_draft' => SalaryBatch::where('status', 'draft')->count(),
            'total_posted' => SalaryBatch::where('status', 'posted')->count(),
            'total_employees_all' => SalaryBatch::where('status', 'posted')->sum('total_employees'),
            'total_gaji_bersih_posted' => SalaryBatch::where('status', 'posted')->sum('total_gaji_bersih'),
        ];

        return Inertia::render('penggajian/index', [
            'batches' => $batches,
            'filters' => [
                'search' => $request->search ?? '',
                'status' => $request->status ?? '',
                'period_year' => $request->period_year ?? '',
                'period_month' => $request->period_month ?? '',
            ],
            'summary' => $summary,
            'isRegularUser' => false,
        ]);
    }
    
    /**
     * Show personal salary slips for regular users (non-admin/non-akuntansi)
     */
    private function showPersonalSalarySlips(Request $request)
    {
        $user = Auth::user();
        
        // Get salary details untuk user ini saja dari batch yang sudah posted
        $query = SalaryDetail::with(['salaryBatch'])
            ->where('user_id', $user->id);
            // ->whereHas('salaryBatch', function($q) {
            //     $q->where('status', 'posted');
            // });
        
        // Filter by year
        if ($request->filled('period_year')) {
            $query->whereHas('salaryBatch', function($q) use ($request) {
                $q->where('period_year', $request->period_year);
            });
        }
        
        // Filter by month
        if ($request->filled('period_month')) {
            $query->whereHas('salaryBatch', function($q) use ($request) {
                $q->where('period_month', $request->period_month);
            });
        }
        
        $salarySlips = $query->orderBy('created_at', 'desc')->get();
        
        // Summary untuk user
        $totalSlips = $salarySlips->count();
        $totalGajiBersih = $salarySlips->sum('gaji_bersih');
        $latestSlip = $salarySlips->first();
        
        return Inertia::render('penggajian/my-salary', [
            'salarySlips' => $salarySlips,
            'filters' => [
                'period_year' => $request->period_year ?? '',
                'period_month' => $request->period_month ?? '',
            ],
            'summary' => [
                'total_slips' => $totalSlips,
                'total_gaji_bersih' => $totalGajiBersih,
                'latest_period' => $latestSlip ? $latestSlip->salaryBatch->period_display : null,
            ],
            'userName' => $user->name,
            'userNip' => $user->nip,
        ]);
    }

    /**
     * Show create form
     */
    public function create()
    {
        // Get list of accounts for salary payment (kas/bank or payable)
        $daftarAkun = DaftarAkun::aktif()
            ->whereIn('jenis_akun', ['aset', 'kewajiban'])
            ->orderBy('jenis_akun')
            ->orderBy('kode_akun')
            ->get(['id', 'kode_akun', 'nama_akun', 'jenis_akun']);

        return Inertia::render('penggajian/create', [
            'daftarAkun' => $daftarAkun,
        ]);
    }

    /**
     * Store new batch
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'period_month' => 'required|integer|min:1|max:12',
            'period_year' => 'required|integer|min:2020|max:2100',
            'description' => 'nullable|string|max:500',
            'payment_account_id' => 'required|exists:daftar_akun,id', // Akun yang dipilih untuk kredit
        ]);

        // Check if batch already exists for this period
        $exists = SalaryBatch::where('period_month', $validated['period_month'])
            ->where('period_year', $validated['period_year'])
            ->exists();

        if ($exists) {
            return back()->withErrors([
                'period' => 'Batch gaji untuk periode ini sudah ada.'
            ]);
        }

        $batchNumber = SalaryBatch::generateBatchNumber(
            $validated['period_year'],
            $validated['period_month']
        );

        $batch = SalaryBatch::create([
            'batch_number' => $batchNumber,
            'period_month' => $validated['period_month'],
            'period_year' => $validated['period_year'],
            'description' => $validated['description'],
            'payment_account_id' => $validated['payment_account_id'], // Simpan akun yang dipilih
            'created_by' => auth()->id(),
            'status' => 'draft',
        ]);

        return redirect()->route('penggajian.index')
            ->with('message', 'Batch gaji berhasil dibuat. Silakan isi data gaji karyawan.');
    }

    /**
     * Show edit form
     */
    public function edit(SalaryBatch $salaryBatch)
    {
        if (!$salaryBatch->can_edit) {
            return back()->withErrors(['error' => 'Batch yang sudah diposting tidak dapat diedit.']);
        }

        return Inertia::render('penggajian/edit', [
            'batch' => $salaryBatch,
        ]);
    }

    /**
     * Update batch info
     */
    public function update(Request $request, SalaryBatch $salaryBatch)
    {
        if (!$salaryBatch->can_edit) {
            return back()->withErrors(['error' => 'Batch yang sudah diposting tidak dapat diedit.']);
        }

        $validated = $request->validate([
            'description' => 'nullable|string|max:500',
        ]);

        $salaryBatch->update($validated);

        return redirect()->route('penggajian.index')
            ->with('message', 'Batch gaji berhasil diupdate.');
    }

    /**
     * Delete batch (only if draft)
     */
    public function destroy(SalaryBatch $salaryBatch)
    {
        if (!$salaryBatch->can_edit) {
            return back()->withErrors(['error' => 'Batch yang sudah diposting tidak dapat dihapus.']);
        }

        $salaryBatch->delete();

        return redirect()->route('penggajian.index')
            ->with('message', 'Batch gaji berhasil dihapus.');
    }

    /**
     * Show input gaji page (Excel-like table)
     */
    public function inputGaji(SalaryBatch $salaryBatch)
    {
        if (!$salaryBatch->can_edit) {
            return back()->withErrors(['error' => 'Batch yang sudah diposting tidak dapat diedit.']);
        }

        // Get all users with NIP (pegawai)
        $users = User::whereNotNull('nip')
            ->orderBy('name')
            ->get(['id', 'name', 'nip']);

        // Get existing salary details for this batch
        $details = $salaryBatch->details()
            ->orderBy('nama_pegawai')
            ->get();

        return Inertia::render('penggajian/input-gaji', [
            'batch' => $salaryBatch->load('creator'),
            'users' => $users,
            'details' => $details,
        ]);
    }

    /**
     * Store salary data from Excel-like table
     */
    public function storeGaji(Request $request, SalaryBatch $salaryBatch)
    {
        if (!$salaryBatch->can_edit) {
            return back()->withErrors(['error' => 'Batch yang sudah diposting tidak dapat diedit.']);
        }

        $validated = $request->validate([
            'details' => 'required|array|min:1',
            'details.*.user_id' => 'nullable|exists:users,id',
            'details.*.nip' => 'nullable|string',
            'details.*.nama_pegawai' => 'required|string',
            'details.*.nomor_whatsapp' => 'nullable|string',
            'details.*.gaji_pokok' => 'nullable|numeric|min:0',
            'details.*.tunjangan_sia' => 'nullable|numeric|min:0',
            'details.*.tunjangan_transportasi' => 'nullable|numeric|min:0',
            'details.*.tunjangan_jabatan' => 'nullable|numeric|min:0',
            'details.*.uang_jaga_utama' => 'nullable|numeric|min:0',
            'details.*.uang_jaga_pratama' => 'nullable|numeric|min:0',
            'details.*.jasa_pelayanan_pratama' => 'nullable|numeric|min:0',
            'details.*.jasa_pelayanan_rawat_inap' => 'nullable|numeric|min:0',
            'details.*.jasa_pelayanan_rawat_jalan' => 'nullable|numeric|min:0',
            'details.*.tugas_tambahan' => 'nullable|numeric|min:0',
            'details.*.pph_21' => 'nullable|numeric|min:0',
            'details.*.infaq' => 'nullable|numeric|min:0',
            'details.*.bpjs_kesehatan' => 'nullable|numeric|min:0',
            'details.*.bpjs_ketenagakerjaan' => 'nullable|numeric|min:0',
            'details.*.denda_absen' => 'nullable|numeric|min:0',
            'details.*.arisan_keluarga' => 'nullable|numeric|min:0',
            'details.*.denda_ngaji' => 'nullable|numeric|min:0',
            'details.*.kasbon' => 'nullable|numeric|min:0',
        ]);

        DB::transaction(function () use ($salaryBatch, $validated) {
            // Delete existing details
            $salaryBatch->details()->delete();

            // Create new details
            foreach ($validated['details'] as $detailData) {
                SalaryDetail::create([
                    'salary_batch_id' => $salaryBatch->id,
                    ...$detailData
                ]);
            }

            // Recalculate batch totals
            $salaryBatch->calculateTotals();
        });

        return redirect()->route('penggajian.index')
            ->with('message', 'Data gaji berhasil disimpan.');
    }

    /**
     * Show post to journal page (pattern sama dengan kas)
     */
    public function showPostToJournal(Request $request)
    {
        $batchIds = $request->input('batch_ids', []);

        if (empty($batchIds)) {
            return back()->withErrors(['error' => 'Pilih minimal 1 batch untuk diposting.']);
        }

        $batches = SalaryBatch::with(['details', 'paymentAccount'])
            ->whereIn('id', $batchIds)
            ->where('status', 'draft')
            ->get();

        if ($batches->isEmpty()) {
            return back()->withErrors(['error' => 'Tidak ada batch yang valid untuk diposting.']);
        }

        // Generate preview journal entries dengan akun yang dipilih
        $journalPreview = $this->generateJournalPreview($batches);

        // Daftar akun untuk dropdown (untuk tambahan baris jika perlu)
        $daftarAkun = DaftarAkun::aktif()
            ->orderBy('jenis_akun')
            ->orderBy('kode_akun')
            ->get(['id', 'kode_akun', 'nama_akun', 'jenis_akun']);

        // Generate nomor jurnal preview
        $nomorJurnalPreview = 'JGA/' . date('Y') . '/' . date('m') . '/XXXX';

        return Inertia::render('penggajian/post-to-journal', [
            'batches' => $batches,
            'journalPreview' => $journalPreview,
            'daftarAkun' => $daftarAkun,
            'nomorJurnalPreview' => $nomorJurnalPreview,
        ]);
    }

    /**
     * Post to journal (pattern sama dengan kas - terima detail_jurnal dari UI)
     */
    public function postToJurnal(Request $request)
    {
        $validated = $request->validate([
            'batch_ids' => 'required|array|min:1',
            'batch_ids.*' => 'exists:salary_batches,id',
            'detail_jurnal' => 'required|array|min:2',
            'detail_jurnal.*.daftar_akun_id' => 'required|exists:daftar_akun,id',
            'detail_jurnal.*.keterangan' => 'required|string|max:255',
            'detail_jurnal.*.jumlah_debit' => 'required|numeric|min:0',
            'detail_jurnal.*.jumlah_kredit' => 'required|numeric|min:0',
        ]);

        // Validasi balance
        $totalDebit = collect($validated['detail_jurnal'])->sum('jumlah_debit');
        $totalKredit = collect($validated['detail_jurnal'])->sum('jumlah_kredit');

        if ($totalDebit != $totalKredit) {
            return back()->withErrors(['detail_jurnal' => 'Total debit dan kredit harus balance.']);
        }

        $batches = SalaryBatch::with('details')
            ->whereIn('id', $validated['batch_ids'])
            ->where('status', 'draft')
            ->get();

        if ($batches->isEmpty()) {
            return back()->withErrors(['error' => 'Tidak ada batch yang valid untuk diposting.']);
        }

        $jurnal = null;
        DB::transaction(function () use ($batches, $validated, $totalDebit, &$jurnal) {
            // Generate nomor jurnal
            $tanggal = now();
            $nomorJurnal = $this->generateNomorJurnal($tanggal);

            // Buat keterangan jurnal
            $batchNumbers = $batches->pluck('batch_number')->join(', ');
            $keteranganJurnal = "Beban Gaji Karyawan - {$batchNumbers}";

            // Create jurnal header
            $jurnal = Jurnal::create([
                'nomor_jurnal' => $nomorJurnal,
                'jenis_jurnal' => 'umum',
                'tanggal_transaksi' => $tanggal,
                'jenis_referensi' => 'penggajian',
                'nomor_referensi' => $batchNumbers,
                'keterangan' => $keteranganJurnal,
                'total_debit' => $totalDebit,
                'total_kredit' => $totalDebit,
                'dibuat_oleh' => Auth::id(),
                'status' => 'posted',
                'tanggal_posting' => now(),
                'diposting_oleh' => Auth::id()
            ]);

            // Create detail jurnal dari input user
            foreach ($validated['detail_jurnal'] as $detail) {
                DetailJurnal::create([
                    'jurnal_id' => $jurnal->id,
                    'daftar_akun_id' => $detail['daftar_akun_id'],
                    'keterangan' => $detail['keterangan'],
                    'jumlah_debit' => $detail['jumlah_debit'],
                    'jumlah_kredit' => $detail['jumlah_kredit']
                ]);
            }

            // Update batch status
            foreach ($batches as $batch) {
                $batch->update([
                    'status' => 'posted',
                    'journal_id' => $jurnal->id,
                    'posted_by' => Auth::id(),
                    'posted_at' => now(),
                ]);
            }
        });

        // Send notification
        if ($jurnal) {
            $notificationService = new NotificationService();
            $notificationService->sendToAllRoles(
                NotificationService::TYPE_KAS_POST, // Bisa buat TYPE_PENGGAJIAN_POST nanti
                [
                    'title' => 'Batch Gaji Posted ke Jurnal',
                    'message' => "Batch gaji telah diposting ke jurnal {$jurnal->nomor_jurnal} oleh " . Auth::user()->name,
                    'action_url' => route('penggajian.index'),
                    'data' => ['jurnal_id' => $jurnal->id]
                ]
            );
        }

        return redirect()->route('penggajian.index')
            ->with('success', 'Batch gaji berhasil diposting ke jurnal.');
    }

    /**
     * Generate journal preview for display
     */
    private function generateJournalPreview($batches)
    {
        $entries = [];

        foreach ($batches as $batch) {
            $details = $batch->details;

            // Aggregate pendapatan components
            $components = [
                'Beban Gaji Pokok' => $details->sum('gaji_pokok'),
                'Beban Tunjangan SIA' => $details->sum('tunjangan_sia'),
                'Beban Tunjangan Transportasi' => $details->sum('tunjangan_transportasi'),
                'Beban Tunjangan Jabatan' => $details->sum('tunjangan_jabatan'),
                'Beban Uang Jaga Utama' => $details->sum('uang_jaga_utama'),
                'Beban Uang Jaga Pratama' => $details->sum('uang_jaga_pratama'),
                'Beban Jasa Pelayanan Pratama' => $details->sum('jasa_pelayanan_pratama'),
                'Beban Jasa Pelayanan Rawat Inap' => $details->sum('jasa_pelayanan_rawat_inap'),
                'Beban Jasa Pelayanan Rawat Jalan' => $details->sum('jasa_pelayanan_rawat_jalan'),
                'Beban Tugas Tambahan' => $details->sum('tugas_tambahan'),
            ];

            // Add debit entries (expenses)
            foreach ($components as $account => $amount) {
                if ($amount > 0) {
                    $entries[] = [
                        'account_name' => $account,
                        'type' => 'debit',
                        'amount' => $amount,
                    ];
                }
            }

            // Add credit entries (liabilities)
            $entries[] = [
                'account_name' => 'Hutang Gaji Karyawan',
                'type' => 'credit',
                'amount' => $details->sum('gaji_bersih'),
            ];

            if ($details->sum('pph_21') > 0) {
                $entries[] = [
                    'account_name' => 'Hutang PPh 21',
                    'type' => 'credit',
                    'amount' => $details->sum('pph_21'),
                ];
            }

            if ($details->sum('infaq') > 0) {
                $entries[] = [
                    'account_name' => 'Hutang Infaq',
                    'type' => 'credit',
                    'amount' => $details->sum('infaq'),
                ];
            }

            if ($details->sum('bpjs_kesehatan') > 0) {
                $entries[] = [
                    'account_name' => 'Hutang BPJS Kesehatan',
                    'type' => 'credit',
                    'amount' => $details->sum('bpjs_kesehatan'),
                ];
            }

            if ($details->sum('bpjs_ketenagakerjaan') > 0) {
                $entries[] = [
                    'account_name' => 'Hutang BPJS Ketenagakerjaan',
                    'type' => 'credit',
                    'amount' => $details->sum('bpjs_ketenagakerjaan'),
                ];
            }

            if ($details->sum('kasbon') > 0) {
                $entries[] = [
                    'account_name' => 'Piutang Kasbon Karyawan',
                    'type' => 'credit',
                    'amount' => $details->sum('kasbon'),
                ];
            }

            // Denda as income (could be kas or pendapatan lain-lain)
            $totalDenda = $details->sum('denda_absen') + $details->sum('denda_ngaji');
            if ($totalDenda > 0) {
                $entries[] = [
                    'account_name' => 'Kas - Pendapatan Denda',
                    'type' => 'credit',
                    'amount' => $totalDenda,
                ];
            }

            if ($details->sum('arisan_keluarga') > 0) {
                $entries[] = [
                    'account_name' => 'Kas - Arisan Keluarga',
                    'type' => 'credit',
                    'amount' => $details->sum('arisan_keluarga'),
                ];
            }
        }

        return $entries;
    }

    /**
     * Generate nomor jurnal dengan format JGA/YYYY/MM/XXXX
     */
    private function generateNomorJurnal($tanggal)
    {
        $prefix = 'JGA'; // Jurnal Gaji
        $date = Carbon::parse($tanggal);
        $tahun = $date->format('Y');
        $bulan = $date->format('m');
        
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
