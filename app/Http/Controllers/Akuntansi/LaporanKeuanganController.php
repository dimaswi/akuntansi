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
                    'description' => 'Laporan posisi keuangan (Aset, Kewajiban, Ekuitas)',
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
                    'id' => 'perubahan-ekuitas',
                    'name' => 'Perubahan Ekuitas',
                    'description' => 'Laporan perubahan modal pemilik',
                    'icon' => 'Activity',
                    'color' => 'bg-orange-500'
                ]
            ]
        ]);
    }

    public function neraca(Request $request)
    {
        $request->validate([
            'tanggal' => 'nullable|date',
        ]);

        $tanggal = $request->tanggal ? Carbon::parse($request->tanggal) : Carbon::now();

        // Ambil semua akun aset, kewajiban, dan ekuitas
        $akunAset = DaftarAkun::where('jenis_akun', 'aset')->aktif()->orderBy('kode_akun')->get();
        $akunKewajiban = DaftarAkun::where('jenis_akun', 'kewajiban')->aktif()->orderBy('kode_akun')->get();
        $akunEkuitas = DaftarAkun::where('jenis_akun', 'ekuitas')->aktif()->orderBy('kode_akun')->get();

        // Hitung saldo masing-masing akun
        $dataAset = $this->hitungSaldoAkun($akunAset, $tanggal);
        $dataKewajiban = $this->hitungSaldoAkun($akunKewajiban, $tanggal);
        $dataEkuitas = $this->hitungSaldoAkun($akunEkuitas, $tanggal);

        // Hitung laba rugi berjalan (untuk ekuitas)
        $labaRugiBerjalan = $this->hitungLabaRugiBerjalan($tanggal);

        $totalAset = collect($dataAset)->sum('saldo');
        $totalKewajiban = collect($dataKewajiban)->sum('saldo');
        $totalEkuitas = collect($dataEkuitas)->sum('saldo') + $labaRugiBerjalan;

        return Inertia::render('akuntansi/laporan-keuangan/neraca', [
            'tanggal' => $tanggal->format('Y-m-d'),
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

    public function perubahanEkuitas(Request $request)
    {
        $request->validate([
            'periode_dari' => 'nullable|date',
            'periode_sampai' => 'nullable|date|after_or_equal:periode_dari',
        ]);

        $periodeAwal = $request->periode_dari ? Carbon::parse($request->periode_dari) : Carbon::now()->startOfYear();
        $periodeAkhir = $request->periode_sampai ? Carbon::parse($request->periode_sampai) : Carbon::now()->endOfYear();

        // Ambil akun ekuitas
        $akunEkuitas = DaftarAkun::where('jenis_akun', 'ekuitas')->aktif()->orderBy('kode_akun')->get();

        // Hitung saldo awal ekuitas (sebelum periode)
        $saldoAwalEkuitas = 0;
        foreach ($akunEkuitas as $akun) {
            $transaksi = DetailJurnal::where('daftar_akun_id', $akun->id)
                ->whereHas('jurnal', function($query) use ($periodeAwal) {
                    $query->where('tanggal_transaksi', '<', $periodeAwal)
                          ->where('status', 'posted');
                })
                ->get();
            $saldoAwalEkuitas += $transaksi->sum('jumlah_kredit') - $transaksi->sum('jumlah_debit');
        }

        // Hitung laba rugi periode berjalan
        $labaRugiPeriode = $this->hitungLabaRugiPeriode($periodeAwal, $periodeAkhir);

        // Hitung tambahan investasi dalam periode
        $tambahanInvestasi = 0;
        foreach ($akunEkuitas as $akun) {
            // Hanya hitung yang bukan retained earnings
            if (!str_contains(strtolower($akun->nama_akun), 'laba') && 
                !str_contains(strtolower($akun->nama_akun), 'rugi')) {
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

        $saldoAkhirEkuitas = $saldoAwalEkuitas + $labaRugiPeriode + $tambahanInvestasi - $penarikan;

        return Inertia::render('akuntansi/laporan-keuangan/perubahan-ekuitas', [
            'periode_dari' => $periodeAwal->format('Y-m-d'),
            'periode_sampai' => $periodeAkhir->format('Y-m-d'),
            'saldoAwalEkuitas' => $saldoAwalEkuitas,
            'labaRugiPeriode' => $labaRugiPeriode,
            'tambahanInvestasi' => $tambahanInvestasi,
            'penarikan' => $penarikan,
            'saldoAkhirEkuitas' => $saldoAkhirEkuitas,
            'detailEkuitas' => $this->getDetailEkuitas($akunEkuitas, $periodeAwal, $periodeAkhir)
        ]);
    }

    private function hitungSaldoAkun($akunList, $tanggal)
    {
        $hasil = [];
        foreach ($akunList as $akun) {
            $transaksi = DetailJurnal::where('daftar_akun_id', $akun->id)
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
                $hasil[] = [
                    'akun' => $akun,
                    'saldo' => $saldo
                ];
            }
        }
        return $hasil;
    }

    private function hitungSaldoAkunPeriode($akunList, $periodeAwal, $periodeAkhir)
    {
        $hasil = [];
        foreach ($akunList as $akun) {
            $transaksi = DetailJurnal::where('daftar_akun_id', $akun->id)
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
                $hasil[] = [
                    'akun' => $akun,
                    'saldo' => $saldo
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

    private function getDetailEkuitas($akunEkuitas, $periodeAwal, $periodeAkhir)
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

    public function export(Request $request)
    {
        // TODO: Implementasi export ke Excel/PDF
        return response()->json([
            'message' => 'Export feature coming soon',
        ]);
    }
}