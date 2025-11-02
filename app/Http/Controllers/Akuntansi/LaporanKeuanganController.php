<?php

namespace App\Http\Controllers\Akuntansi;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Akuntansi\DaftarAkun;
use App\Models\Akuntansi\DetailJurnal;
use App\Models\Akuntansi\Jurnal;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class LaporanKeuanganController extends Controller
{
    public function index()
    {
        return Inertia::render('akuntansi/laporan-keuangan/index', [
            'laporanTypes' => [
                [
                    'id' => 'neraca',
                    'name' => 'Neraca',
                    'description' => 'Laporan posisi keuangan (Aset, Kewajiban, Modal)',
                    'icon' => 'BarChart3',
                    'color' => 'bg-blue-500'
                ],
                [
                    'id' => 'laba-rugi',
                    'name' => 'Laba Rugi',
                    'description' => 'Laporan pendapatan dan beban dalam periode tertentu',
                    'icon' => 'TrendingUp',
                    'color' => 'bg-green-500'
                ],
                [
                    'id' => 'arus-kas',
                    'name' => 'Arus Kas',
                    'description' => 'Laporan arus kas masuk dan keluar',
                    'icon' => 'DollarSign',
                    'color' => 'bg-purple-500'
                ],
                [
                    'id' => 'perubahan-modal',
                    'name' => 'Perubahan Modal',
                    'description' => 'Laporan perubahan modal pemilik',
                    'icon' => 'Activity',
                    'color' => 'bg-orange-500'
                ],
                [
                    'id' => 'analisis-rasio',
                    'name' => 'Analisis Rasio',
                    'description' => 'Analisis rasio keuangan (Likuiditas, Solvabilitas, dll)',
                    'icon' => 'PieChart',
                    'color' => 'bg-pink-500'
                ]
            ]
        ]);
    }

    public function neraca(Request $request)
    {
        $request->validate([
            'tanggal' => 'nullable|date',
            'periode_dari' => 'nullable|date',
            'periode_sampai' => 'nullable|date|after_or_equal:periode_dari',
        ]);

        $tanggal = $request->tanggal ? Carbon::parse($request->tanggal) : Carbon::now();
        
        // Periode untuk laba rugi (default: awal tahun sampai tanggal neraca)
        $periodeDari = $request->periode_dari ? Carbon::parse($request->periode_dari) : Carbon::create($tanggal->year, 1, 1);
        $periodeSampai = $request->periode_sampai ? Carbon::parse($request->periode_sampai) : $tanggal;

        // Ambil semua akun aset, kewajiban, dan modal
        $akunAset = DaftarAkun::where('jenis_akun', 'aset')->aktif()->orderBy('kode_akun')->get();
        $akunKewajiban = DaftarAkun::where('jenis_akun', 'kewajiban')->aktif()->orderBy('kode_akun')->get();
        $akunEkuitas = DaftarAkun::where('jenis_akun', 'modal')->aktif()->orderBy('kode_akun')->get();

        // Hitung saldo masing-masing akun
        $dataAset = $this->hitungSaldoAkun($akunAset, $tanggal);
        $dataKewajiban = $this->hitungSaldoAkun($akunKewajiban, $tanggal);
        $dataEkuitas = $this->hitungSaldoAkun($akunEkuitas, $tanggal);

        // Hitung laba rugi berjalan berdasarkan periode yang dipilih
        // Ini akan konsisten dengan laporan laba rugi
        $labaRugiBerjalan = $this->hitungLabaRugiPeriode($periodeDari, $periodeSampai);

        $totalAset = collect($dataAset)->sum('saldo');
        $totalKewajiban = collect($dataKewajiban)->sum('saldo');
        $totalEkuitas = collect($dataEkuitas)->sum('saldo') + $labaRugiBerjalan;

        return Inertia::render('akuntansi/laporan-keuangan/neraca', [
            'tanggal' => $tanggal->format('Y-m-d'),
            'periode_dari' => $periodeDari->format('Y-m-d'),
            'periode_sampai' => $periodeSampai->format('Y-m-d'),
            'dataAset' => $dataAset,
            'dataKewajiban' => $dataKewajiban,
            'dataEkuitas' => $dataEkuitas,
            'labaRugiBerjalan' => $labaRugiBerjalan,
            'totalAset' => $totalAset,
            'totalKewajiban' => $totalKewajiban,
            'totalEkuitas' => $totalEkuitas,
            'balanced' => abs($totalAset - ($totalKewajiban + $totalEkuitas)) < 0.01
        ]);
    }

    public function labaRugi(Request $request)
    {
        $request->validate([
            'periode_dari' => 'nullable|date',
            'periode_sampai' => 'nullable|date|after_or_equal:periode_dari',
        ]);

        $periodeAwal = $request->periode_dari ? Carbon::parse($request->periode_dari) : Carbon::now()->startOfMonth();
        $periodeAkhir = $request->periode_sampai ? Carbon::parse($request->periode_sampai) : Carbon::now()->endOfMonth();

        // Ambil akun pendapatan dan beban
        $akunPendapatan = DaftarAkun::where('jenis_akun', 'pendapatan')->aktif()->orderBy('kode_akun')->get();
        $akunBeban = DaftarAkun::where('jenis_akun', 'beban')->aktif()->orderBy('kode_akun')->get();

        // Hitung saldo dalam periode
        $dataPendapatan = $this->hitungSaldoAkunPeriode($akunPendapatan, $periodeAwal, $periodeAkhir);
        $dataBeban = $this->hitungSaldoAkunPeriode($akunBeban, $periodeAwal, $periodeAkhir);

        $totalPendapatan = collect($dataPendapatan)->sum('saldo');
        $totalBeban = collect($dataBeban)->sum('saldo');
        $labaRugi = $totalPendapatan - $totalBeban;

        return Inertia::render('akuntansi/laporan-keuangan/laba-rugi', [
            'periode_dari' => $periodeAwal->format('Y-m-d'),
            'periode_sampai' => $periodeAkhir->format('Y-m-d'),
            'dataPendapatan' => $dataPendapatan,
            'dataBeban' => $dataBeban,
            'totalPendapatan' => $totalPendapatan,
            'totalBeban' => $totalBeban,
            'labaRugi' => $labaRugi,
        ]);
    }

    public function arusKas(Request $request)
    {
        $request->validate([
            'periode_dari' => 'nullable|date',
            'periode_sampai' => 'nullable|date|after_or_equal:periode_dari',
        ]);

        $periodeAwal = $request->periode_dari ? Carbon::parse($request->periode_dari) : Carbon::now()->startOfMonth();
        $periodeAkhir = $request->periode_sampai ? Carbon::parse($request->periode_sampai) : Carbon::now()->endOfMonth();

        // Ambil akun kas/bank
        $akunKas = DaftarAkun::where('jenis_akun', 'aset')
            ->where(function($query) {
                $query->where('nama_akun', 'like', '%kas%')
                      ->orWhere('nama_akun', 'like', '%bank%')
                      ->orWhere('kode_akun', 'like', '1.1.1%'); // Asumsi kode kas dimulai 1.1.1
            })
            ->aktif()
            ->orderBy('kode_akun')
            ->get();

        $dataArusKas = [];
        foreach ($akunKas as $akun) {
            $transaksi = DetailJurnal::with(['jurnal'])
                ->where('daftar_akun_id', $akun->id)
                ->whereHas('jurnal', function($query) use ($periodeAwal, $periodeAkhir) {
                    $query->whereBetween('tanggal_transaksi', [$periodeAwal, $periodeAkhir])
                          ->where('status', 'posted');
                })
                ->orderBy('created_at')
                ->get()
                ->map(function($detail) {
                    $masuk = $detail->jumlah_debit;
                    $keluar = $detail->jumlah_kredit;
                    
                    return [
                        'tanggal' => $detail->jurnal->tanggal_transaksi,
                        'keterangan' => $detail->jurnal->keterangan,
                        'referensi' => $detail->jurnal->nomor_jurnal,
                        'kas_masuk' => $masuk,
                        'kas_keluar' => $keluar,
                        'net' => $masuk - $keluar
                    ];
                });

            if ($transaksi->isNotEmpty()) {
                $dataArusKas[] = [
                    'akun' => $akun,
                    'transaksi' => $transaksi,
                    'total_masuk' => $transaksi->sum('kas_masuk'),
                    'total_keluar' => $transaksi->sum('kas_keluar'),
                    'net' => $transaksi->sum('net')
                ];
            }
        }

        $totalKasMasuk = collect($dataArusKas)->sum('total_masuk');
        $totalKasKeluar = collect($dataArusKas)->sum('total_keluar');
        $netArusKas = $totalKasMasuk - $totalKasKeluar;

        return Inertia::render('akuntansi/laporan-keuangan/arus-kas', [
            'periode_dari' => $periodeAwal->format('Y-m-d'),
            'periode_sampai' => $periodeAkhir->format('Y-m-d'),
            'dataArusKas' => $dataArusKas,
            'totalKasMasuk' => $totalKasMasuk,
            'totalKasKeluar' => $totalKasKeluar,
            'netArusKas' => $netArusKas,
        ]);
    }

    public function perubahanModal(Request $request)
    {
        $request->validate([
            'periode_dari' => 'nullable|date',
            'periode_sampai' => 'nullable|date|after_or_equal:periode_dari',
        ]);

        $periodeAwal = $request->periode_dari ? Carbon::parse($request->periode_dari) : Carbon::now()->startOfYear();
        $periodeAkhir = $request->periode_sampai ? Carbon::parse($request->periode_sampai) : Carbon::now()->endOfYear();

        // Ambil akun modal
        $akunEkuitas = DaftarAkun::where('jenis_akun', 'modal')->aktif()->orderBy('kode_akun')->get();

        // Hitung saldo awal modal (sebelum periode)
        $saldoAwalModal = 0;
        foreach ($akunEkuitas as $akun) {
            $transaksi = DetailJurnal::where('daftar_akun_id', $akun->id)
                ->whereHas('jurnal', function($query) use ($periodeAwal) {
                    $query->where('tanggal_transaksi', '<', $periodeAwal)
                          ->where('status', 'posted');
                })
                ->get();
            $saldoAwalModal += $transaksi->sum('jumlah_kredit') - $transaksi->sum('jumlah_debit');
        }

        // Hitung laba ditahan (akumulasi laba/rugi sebelum periode)
        $labaDitahan = $this->hitungLabaRugiPeriode(Carbon::parse('1970-01-01'), $periodeAwal->copy()->subDay());
        
        // Detail laba ditahan per bulan
        $detailLabaDitahanPerBulan = $this->getLabaDitahanPerBulan($periodeAwal);

        // Hitung laba rugi periode berjalan
        $labaRugiPeriode = $this->hitungLabaRugiPeriode($periodeAwal, $periodeAkhir);

        // Hitung tambahan investasi dalam periode
        $tambahanInvestasi = 0;
        foreach ($akunEkuitas as $akun) {
            // Hanya hitung yang bukan retained earnings
            if (!str_contains(strtolower($akun->nama_akun), 'laba') && 
                !str_contains(strtolower($akun->nama_akun), 'rugi') &&
                !str_contains(strtolower($akun->nama_akun), 'ditahan')) {
                $transaksi = DetailJurnal::where('daftar_akun_id', $akun->id)
                    ->whereHas('jurnal', function($query) use ($periodeAwal, $periodeAkhir) {
                        $query->whereBetween('tanggal_transaksi', [$periodeAwal, $periodeAkhir])
                              ->where('status', 'posted');
                    })
                    ->get();
                $tambahanInvestasi += $transaksi->sum('jumlah_kredit') - $transaksi->sum('jumlah_debit');
            }
        }

        // Hitung penarikan/dividen dalam periode
        $penarikan = 0;
        // Asumsi akun penarikan/dividen ada dalam ekuitas dengan saldo debit
        foreach ($akunEkuitas as $akun) {
            if (str_contains(strtolower($akun->nama_akun), 'prive') || 
                str_contains(strtolower($akun->nama_akun), 'dividen') ||
                str_contains(strtolower($akun->nama_akun), 'penarikan')) {
                $transaksi = DetailJurnal::where('daftar_akun_id', $akun->id)
                    ->whereHas('jurnal', function($query) use ($periodeAwal, $periodeAkhir) {
                        $query->whereBetween('tanggal_transaksi', [$periodeAwal, $periodeAkhir])
                              ->where('status', 'posted');
                    })
                    ->get();
                $penarikan += $transaksi->sum('jumlah_debit') - $transaksi->sum('jumlah_kredit');
            }
        }

        $saldoAkhirModal = $saldoAwalModal + $labaDitahan + $labaRugiPeriode + $tambahanInvestasi - $penarikan;

        return Inertia::render('akuntansi/laporan-keuangan/perubahan-modal', [
            'periode_dari' => $periodeAwal->format('Y-m-d'),
            'periode_sampai' => $periodeAkhir->format('Y-m-d'),
            'saldoAwalModal' => $saldoAwalModal,
            'labaDitahan' => $labaDitahan,
            'detailLabaDitahanPerBulan' => $detailLabaDitahanPerBulan,
            'labaRugiPeriode' => $labaRugiPeriode,
            'tambahanInvestasi' => $tambahanInvestasi,
            'penarikan' => $penarikan,
            'saldoAkhirModal' => $saldoAkhirModal,
            'detailModal' => $this->getDetailModal($akunEkuitas, $periodeAwal, $periodeAkhir)
        ]);
    }

    private function getLabaDitahanPerBulan($sampaiTanggal)
    {
        $detail = [];
        
        // Ambil transaksi pendapatan dan beban tertua
        $transaksiPertama = DetailJurnal::with('jurnal')
            ->whereHas('jurnal', function($query) use ($sampaiTanggal) {
                $query->where('tanggal_transaksi', '<', $sampaiTanggal)
                      ->where('status', 'posted');
            })
            ->join('jurnal', 'detail_jurnal.jurnal_id', '=', 'jurnal.id')
            ->orderBy('jurnal.tanggal_transaksi', 'asc')
            ->select('detail_jurnal.*')
            ->first();
        
        if (!$transaksiPertama) {
            return $detail;
        }
        
        $tanggalMulai = Carbon::parse($transaksiPertama->jurnal->tanggal_transaksi)->startOfMonth();
        $tanggalAkhir = Carbon::parse($sampaiTanggal)->subDay()->endOfMonth();
        
        $currentDate = $tanggalMulai->copy();
        $saldoAkumulasi = 0;
        
        while ($currentDate <= $tanggalAkhir) {
            $bulanAwal = $currentDate->copy()->startOfMonth();
            $bulanAkhir = $currentDate->copy()->endOfMonth();
            
            // Pastikan tidak melewati batas akhir
            if ($bulanAkhir > $tanggalAkhir) {
                $bulanAkhir = $tanggalAkhir;
            }
            
            // Hitung laba/rugi bulan ini
            $labaRugiBulan = $this->hitungLabaRugiPeriode($bulanAwal, $bulanAkhir);
            $saldoAkumulasi += $labaRugiBulan;
            
            $detail[] = [
                'bulan' => $bulanAwal->format('F Y'),
                'tahun' => $bulanAwal->year,
                'bulan_num' => $bulanAwal->month,
                'periode_dari' => $bulanAwal->format('Y-m-d'),
                'periode_sampai' => $bulanAkhir->format('Y-m-d'),
                'laba_rugi' => $labaRugiBulan,
                'saldo_akumulasi' => $saldoAkumulasi
            ];
            
            $currentDate->addMonth();
        }
        
        return $detail;
    }

    private function hitungSaldoAkun($akunList, $tanggal)
    {
        $hasil = [];
        foreach ($akunList as $akun) {
            $transaksi = DetailJurnal::with(['jurnal'])
                ->where('daftar_akun_id', $akun->id)
                ->whereHas('jurnal', function($query) use ($tanggal) {
                    $query->where('tanggal_transaksi', '<=', $tanggal)
                          ->where('status', 'posted');
                })
                ->get();

            $totalDebet = $transaksi->sum('jumlah_debit');
            $totalKredit = $transaksi->sum('jumlah_kredit');

            // Hitung saldo berdasarkan jenis akun
            if (in_array($akun->jenis_akun, ['aset', 'beban'])) {
                $saldo = $totalDebet - $totalKredit; // Normal debet
            } else {
                $saldo = $totalKredit - $totalDebet; // Normal kredit
            }

            if ($saldo != 0 || $transaksi->count() > 0) {
                // Format detail transaksi untuk expandable row
                $detailTransaksi = $transaksi->map(function($detail) use ($akun) {
                    $isNormalDebit = in_array($akun->jenis_akun, ['aset', 'beban']);
                    
                    return [
                        'id' => $detail->id,
                        'tanggal' => $detail->jurnal->tanggal_transaksi->format('Y-m-d'),
                        'nomor_jurnal' => $detail->jurnal->nomor_jurnal,
                        'keterangan' => $detail->jurnal->keterangan,
                        'debit' => $detail->jumlah_debit,
                        'kredit' => $detail->jumlah_kredit,
                        'saldo' => $isNormalDebit 
                            ? $detail->jumlah_debit - $detail->jumlah_kredit
                            : $detail->jumlah_kredit - $detail->jumlah_debit
                    ];
                });

                $hasil[] = [
                    'akun' => $akun,
                    'saldo' => $saldo,
                    'detail_transaksi' => $detailTransaksi
                ];
            }
        }
        return $hasil;
    }

    private function hitungSaldoAkunPeriode($akunList, $periodeAwal, $periodeAkhir)
    {
        $hasil = [];
        foreach ($akunList as $akun) {
            $transaksi = DetailJurnal::with(['jurnal'])
                ->where('daftar_akun_id', $akun->id)
                ->whereHas('jurnal', function($query) use ($periodeAwal, $periodeAkhir) {
                    $query->whereBetween('tanggal_transaksi', [$periodeAwal, $periodeAkhir])
                          ->where('status', 'posted');
                })
                ->get();

            $totalDebet = $transaksi->sum('jumlah_debit');
            $totalKredit = $transaksi->sum('jumlah_kredit');

            // Untuk pendapatan: saldo = kredit - debet
            // Untuk beban: saldo = debet - kredit
            if ($akun->jenis_akun === 'pendapatan') {
                $saldo = $totalKredit - $totalDebet;
            } else {
                $saldo = $totalDebet - $totalKredit;
            }

            if ($saldo != 0 || $transaksi->count() > 0) {
                // Format detail transaksi untuk expandable row
                $detailTransaksi = $transaksi->map(function($detail) use ($akun) {
                    return [
                        'id' => $detail->id,
                        'tanggal' => $detail->jurnal->tanggal_transaksi->format('Y-m-d'),
                        'nomor_jurnal' => $detail->jurnal->nomor_jurnal,
                        'keterangan' => $detail->jurnal->keterangan,
                        'debit' => $detail->jumlah_debit,
                        'kredit' => $detail->jumlah_kredit,
                        'saldo' => $akun->jenis_akun === 'pendapatan' 
                            ? $detail->jumlah_kredit - $detail->jumlah_debit
                            : $detail->jumlah_debit - $detail->jumlah_kredit
                    ];
                });

                $hasil[] = [
                    'akun' => $akun,
                    'saldo' => $saldo,
                    'detail_transaksi' => $detailTransaksi
                ];
            }
        }
        return $hasil;
    }

    private function hitungLabaRugiBerjalan($tanggal)
    {
        // Hitung pendapatan sampai tanggal tertentu
        $akunPendapatan = DaftarAkun::where('jenis_akun', 'pendapatan')->aktif()->get();
        $akunBeban = DaftarAkun::where('jenis_akun', 'beban')->aktif()->get();

        $totalPendapatan = 0;
        $totalBeban = 0;

        foreach ($akunPendapatan as $akun) {
            $transaksi = DetailJurnal::where('daftar_akun_id', $akun->id)
                ->whereHas('jurnal', function($query) use ($tanggal) {
                    $query->where('tanggal_transaksi', '<=', $tanggal)
                          ->where('status', 'posted');
                })
                ->get();
            $totalPendapatan += $transaksi->sum('jumlah_kredit') - $transaksi->sum('jumlah_debit');
        }

        foreach ($akunBeban as $akun) {
            $transaksi = DetailJurnal::where('daftar_akun_id', $akun->id)
                ->whereHas('jurnal', function($query) use ($tanggal) {
                    $query->where('tanggal_transaksi', '<=', $tanggal)
                          ->where('status', 'posted');
                })
                ->get();
            $totalBeban += $transaksi->sum('jumlah_debit') - $transaksi->sum('jumlah_kredit');
        }

        return $totalPendapatan - $totalBeban;
    }

    private function hitungLabaRugiPeriode($periodeAwal, $periodeAkhir)
    {
        $akunPendapatan = DaftarAkun::where('jenis_akun', 'pendapatan')->aktif()->get();
        $akunBeban = DaftarAkun::where('jenis_akun', 'beban')->aktif()->get();

        $totalPendapatan = 0;
        $totalBeban = 0;

        foreach ($akunPendapatan as $akun) {
            $transaksi = DetailJurnal::where('daftar_akun_id', $akun->id)
                ->whereHas('jurnal', function($query) use ($periodeAwal, $periodeAkhir) {
                    $query->whereBetween('tanggal_transaksi', [$periodeAwal, $periodeAkhir])
                          ->where('status', 'posted');
                })
                ->get();
            $totalPendapatan += $transaksi->sum('jumlah_kredit') - $transaksi->sum('jumlah_debit');
        }

        foreach ($akunBeban as $akun) {
            $transaksi = DetailJurnal::where('daftar_akun_id', $akun->id)
                ->whereHas('jurnal', function($query) use ($periodeAwal, $periodeAkhir) {
                    $query->whereBetween('tanggal_transaksi', [$periodeAwal, $periodeAkhir])
                          ->where('status', 'posted');
                })
                ->get();
            $totalBeban += $transaksi->sum('jumlah_debit') - $transaksi->sum('jumlah_kredit');
        }

        return $totalPendapatan - $totalBeban;
    }

    private function getDetailModal($akunEkuitas, $periodeAwal, $periodeAkhir)
    {
        $detail = [];
        foreach ($akunEkuitas as $akun) {
            $saldoAwal = DetailJurnal::where('daftar_akun_id', $akun->id)
                ->whereHas('jurnal', function($query) use ($periodeAwal) {
                    $query->where('tanggal_transaksi', '<', $periodeAwal)
                          ->where('status', 'posted');
                })
                ->get();
            
            $mutasiPeriode = DetailJurnal::where('daftar_akun_id', $akun->id)
                ->whereHas('jurnal', function($query) use ($periodeAwal, $periodeAkhir) {
                    $query->whereBetween('tanggal_transaksi', [$periodeAwal, $periodeAkhir])
                          ->where('status', 'posted');
                })
                ->get();

            $saldoAwalAmount = $saldoAwal->sum('jumlah_kredit') - $saldoAwal->sum('jumlah_debit');
            $mutasiAmount = $mutasiPeriode->sum('jumlah_kredit') - $mutasiPeriode->sum('jumlah_debit');
            $saldoAkhir = $saldoAwalAmount + $mutasiAmount;

            if ($saldoAwalAmount != 0 || $mutasiAmount != 0 || $saldoAkhir != 0) {
                $detail[] = [
                    'akun' => $akun,
                    'saldo_awal' => $saldoAwalAmount,
                    'mutasi' => $mutasiAmount,
                    'saldo_akhir' => $saldoAkhir
                ];
            }
        }
        return $detail;
    }

    public function analisisRasio(Request $request)
    {
        $request->validate([
            'tanggal' => 'nullable|date',
        ]);

        $tanggal = $request->tanggal ? Carbon::parse($request->tanggal) : Carbon::now();

        // Hitung total aset lancar
        $asetLancar = DaftarAkun::where('jenis_akun', 'aset')
            ->where('sub_jenis', 'aset_lancar')
            ->aktif()
            ->get();
        $totalAsetLancar = 0;
        $totalKas = 0;
        $totalPersediaan = 0;

        foreach ($asetLancar as $akun) {
            $transaksi = DetailJurnal::where('daftar_akun_id', $akun->id)
                ->whereHas('jurnal', function($query) use ($tanggal) {
                    $query->where('tanggal_transaksi', '<=', $tanggal)
                          ->where('status', 'posted');
                })
                ->get();
            $saldo = $transaksi->sum('jumlah_debit') - $transaksi->sum('jumlah_kredit');
            $totalAsetLancar += $saldo;

            // Identifikasi Kas/Bank
            if (str_contains(strtolower($akun->nama_akun), 'kas') || 
                str_contains(strtolower($akun->nama_akun), 'bank')) {
                $totalKas += $saldo;
            }

            // Identifikasi Persediaan
            if (str_contains(strtolower($akun->nama_akun), 'persediaan') ||
                str_contains(strtolower($akun->nama_akun), 'inventory')) {
                $totalPersediaan += $saldo;
            }
        }

        // Hitung total kewajiban lancar
        $kewajibanLancar = DaftarAkun::where('jenis_akun', 'kewajiban')
            ->where('sub_jenis', 'kewajiban_lancar')
            ->aktif()
            ->get();
        $totalKewajibanLancar = 0;

        foreach ($kewajibanLancar as $akun) {
            $transaksi = DetailJurnal::where('daftar_akun_id', $akun->id)
                ->whereHas('jurnal', function($query) use ($tanggal) {
                    $query->where('tanggal_transaksi', '<=', $tanggal)
                          ->where('status', 'posted');
                })
                ->get();
            $saldo = $transaksi->sum('jumlah_kredit') - $transaksi->sum('jumlah_debit');
            $totalKewajibanLancar += $saldo;
        }

        // Hitung total aset
        $akunAset = DaftarAkun::where('jenis_akun', 'aset')->aktif()->get();
        $totalAset = 0;
        foreach ($akunAset as $akun) {
            $transaksi = DetailJurnal::where('daftar_akun_id', $akun->id)
                ->whereHas('jurnal', function($query) use ($tanggal) {
                    $query->where('tanggal_transaksi', '<=', $tanggal)
                          ->where('status', 'posted');
                })
                ->get();
            $totalAset += $transaksi->sum('jumlah_debit') - $transaksi->sum('jumlah_kredit');
        }

        // Hitung total kewajiban
        $akunKewajiban = DaftarAkun::where('jenis_akun', 'kewajiban')->aktif()->get();
        $totalKewajiban = 0;
        foreach ($akunKewajiban as $akun) {
            $transaksi = DetailJurnal::where('daftar_akun_id', $akun->id)
                ->whereHas('jurnal', function($query) use ($tanggal) {
                    $query->where('tanggal_transaksi', '<=', $tanggal)
                          ->where('status', 'posted');
                })
                ->get();
            $totalKewajiban += $transaksi->sum('jumlah_kredit') - $transaksi->sum('jumlah_debit');
        }

        // Hitung total ekuitas
        $akunEkuitas = DaftarAkun::where('jenis_akun', 'modal')->aktif()->get();
        $totalEkuitas = 0;
        foreach ($akunEkuitas as $akun) {
            $transaksi = DetailJurnal::where('daftar_akun_id', $akun->id)
                ->whereHas('jurnal', function($query) use ($tanggal) {
                    $query->where('tanggal_transaksi', '<=', $tanggal)
                          ->where('status', 'posted');
                })
                ->get();
            $totalEkuitas += $transaksi->sum('jumlah_kredit') - $transaksi->sum('jumlah_debit');
        }

        // Hitung laba berjalan sampai tanggal
        $labaBerjalan = $this->hitungLabaRugiPeriode(Carbon::parse('1970-01-01'), $tanggal);
        $totalEkuitas += $labaBerjalan;

        // Hitung modal kerja
        $modalKerja = $totalAsetLancar - $totalKewajibanLancar;

        // Hitung rasio-rasio
        $currentRatio = $totalKewajibanLancar > 0 ? $totalAsetLancar / $totalKewajibanLancar : 0;
        $quickRatio = $totalKewajibanLancar > 0 ? ($totalAsetLancar - $totalPersediaan) / $totalKewajibanLancar : 0;
        $cashRatio = $totalKewajibanLancar > 0 ? $totalKas / $totalKewajibanLancar : 0;
        $debtToAssetRatio = $totalAset > 0 ? $totalKewajiban / $totalAset : 0;
        $debtToEquityRatio = $totalEkuitas > 0 ? $totalKewajiban / $totalEkuitas : 0;

        return Inertia::render('akuntansi/laporan-keuangan/analisis-rasio', [
            'tanggal' => $tanggal->format('Y-m-d'),
            'totalAsetLancar' => $totalAsetLancar,
            'totalKewajibanLancar' => $totalKewajibanLancar,
            'totalKas' => $totalKas,
            'totalPersediaan' => $totalPersediaan,
            'totalAset' => $totalAset,
            'totalKewajiban' => $totalKewajiban,
            'totalEkuitas' => $totalEkuitas,
            'modalKerja' => $modalKerja,
            'currentRatio' => $currentRatio,
            'quickRatio' => $quickRatio,
            'cashRatio' => $cashRatio,
            'debtToAssetRatio' => $debtToAssetRatio,
            'debtToEquityRatio' => $debtToEquityRatio,
        ]);
    }

    public function export(Request $request)
    {
        // TODO: Implementasi export ke Excel/PDF
        return response()->json([
            'message' => 'Export feature coming soon',
        ]);
    }
}