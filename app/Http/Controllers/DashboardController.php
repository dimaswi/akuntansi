<?php

namespace App\Http\Controllers;

use App\Models\Akuntansi\DaftarAkun;
use App\Models\Akuntansi\DetailJurnal;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        // Administrator can access both dashboards - default to inventory
        if ($user->isAdmin()) {
            return redirect()->route('inventory.dashboard');
        }
        
        // Priority: Inventory dashboard
        if ($user->hasPermission('inventory.dashboard.view')) {
            return redirect()->route('inventory.dashboard');
        }
        
        // If user has accounting view permission, redirect to accounting dashboard
        if ($user->hasPermission('akuntansi.view')) {
            return redirect()->route('dashboard.accounting');
        }
        
        // For users without any dashboard access, show welcome page
        return Inertia::render('dashboard-welcome');
    }
    
    public function accounting(Request $request)
    {
        $user = $request->user();
        
        // Check permission
        if (!$user->hasPermission('akuntansi.view')) {
            abort(403, 'Anda tidak memiliki akses ke Dashboard Akuntansi');
        }
        
        // Jika tidak ada parameter bulan, return empty state (untuk first load cepat)
        if (!$request->has('bulan')) {
            return Inertia::render('dashboard-accounting', [
                'bulan' => null,
                'dataHarian' => [],
                'statistik' => [
                    'totalPendapatan' => 0,
                    'totalBeban' => 0,
                    'labaRugi' => 0,
                    'marginRataRata' => 0,
                ],
                'kasBank' => ['total' => 0, 'detail' => []],
                'topPendapatan' => [],
                'topBeban' => [],
                'posisiKeuangan' => [
                    'aset' => 0,
                    'kewajiban' => 0,
                    'ekuitas' => 0,
                ],
                'rasioLikuiditas' => [
                    'aset_lancar' => 0,
                    'kewajiban_lancar' => 0,
                    'current_ratio' => 0,
                ],
                'canAccessInventoryDashboard' => $user->hasPermission('inventory.dashboard.view'),
            ]);
        }
        
        // Bulan yang dipilih
        $bulan = $request->bulan;
        $tanggalPeriode = Carbon::parse($bulan . '-01');
        
        // Data per hari untuk chart
        $dataHarian = $this->getDataHarian($tanggalPeriode);
        
        // Statistik ringkasan
        $totalPendapatan = collect($dataHarian)->sum('pendapatan');
        $totalBeban = collect($dataHarian)->sum('beban');
        $labaRugi = $totalPendapatan - $totalBeban;
        $marginRataRata = $totalPendapatan > 0 ? (($labaRugi / $totalPendapatan) * 100) : 0;
        
        // Kas & Bank saat ini
        $kasBank = $this->getKasBank();
        
        // Top 5 Pendapatan
        $topPendapatan = $this->getTopPendapatan($tanggalPeriode);
        
        // Top 5 Beban
        $topBeban = $this->getTopBeban($tanggalPeriode);
        
        // Total Aset, Kewajiban, Ekuitas
        $posisiKeuangan = $this->getPosisiKeuangan();
        
        // Rasio Likuiditas Cepat
        $rasioLikuiditas = $this->getRasioLikuiditas();
        
        return Inertia::render('dashboard-accounting', [
            'bulan' => $bulan,
            'dataHarian' => $dataHarian,
            'statistik' => [
                'totalPendapatan' => $totalPendapatan,
                'totalBeban' => $totalBeban,
                'labaRugi' => $labaRugi,
                'marginRataRata' => $marginRataRata,
            ],
            'kasBank' => $kasBank,
            'topPendapatan' => $topPendapatan,
            'topBeban' => $topBeban,
            'posisiKeuangan' => $posisiKeuangan,
            'rasioLikuiditas' => $rasioLikuiditas,
            'canAccessInventoryDashboard' => $user->hasPermission('inventory.dashboard.view'),
        ]);
    }
    
    private function getDataHarian($tanggalPeriode)
    {
        $data = [];
        $tanggalAwal = $tanggalPeriode->copy()->startOfMonth();
        $tanggalAkhir = $tanggalPeriode->copy()->endOfMonth();
        $jumlahHari = $tanggalAkhir->day;
        
        for ($hari = 1; $hari <= $jumlahHari; $hari++) {
            $tanggal = Carbon::create($tanggalPeriode->year, $tanggalPeriode->month, $hari);
            
            // Hitung pendapatan hari ini  
            $pendapatan = $this->hitungPendapatan($tanggal->copy()->startOfDay(), $tanggal->copy()->endOfDay());
            
            // Hitung beban hari ini
            $beban = $this->hitungBeban($tanggal->copy()->startOfDay(), $tanggal->copy()->endOfDay());
            
            // Hitung laba/rugi dan margin
            $labaRugi = $pendapatan - $beban;
            $margin = $pendapatan > 0 ? (($labaRugi / $pendapatan) * 100) : 0;
            
            $data[] = [
                'tanggal' => $hari,
                'tanggal_full' => $tanggal->format('d M Y'),
                'pendapatan' => $pendapatan,
                'beban' => $beban,
                'laba_rugi' => $labaRugi,
                'margin' => round($margin, 2),
            ];
        }
        
        return $data;
    }
    
    private function hitungPendapatan($tanggalAwal, $tanggalAkhir)
    {
        $akunPendapatan = DaftarAkun::where('jenis_akun', 'pendapatan')->aktif()->get();
        $total = 0;
        
        foreach ($akunPendapatan as $akun) {
            $transaksi = DetailJurnal::where('daftar_akun_id', $akun->id)
                ->whereHas('jurnal', function($query) use ($tanggalAwal, $tanggalAkhir) {
                    $query->whereBetween('tanggal_transaksi', [$tanggalAwal, $tanggalAkhir])
                          ->where('status', 'posted');
                })
                ->get();
            $total += $transaksi->sum('jumlah_kredit') - $transaksi->sum('jumlah_debit');
        }
        
        return $total;
    }
    
    private function hitungBeban($tanggalAwal, $tanggalAkhir)
    {
        $akunBeban = DaftarAkun::where('jenis_akun', 'beban')->aktif()->get();
        $total = 0;
        
        foreach ($akunBeban as $akun) {
            $transaksi = DetailJurnal::where('daftar_akun_id', $akun->id)
                ->whereHas('jurnal', function($query) use ($tanggalAwal, $tanggalAkhir) {
                    $query->whereBetween('tanggal_transaksi', [$tanggalAwal, $tanggalAkhir])
                          ->where('status', 'posted');
                })
                ->get();
            $total += $transaksi->sum('jumlah_debit') - $transaksi->sum('jumlah_kredit');
        }
        
        return $total;
    }
    
    private function getKasBank()
    {
        $akunKas = DaftarAkun::where('jenis_akun', 'aset')
            ->where(function($query) {
                $query->where('nama_akun', 'like', '%kas%')
                      ->orWhere('nama_akun', 'like', '%bank%');
            })
            ->aktif()
            ->get();
        
        $total = 0;
        $detail = [];
        
        foreach ($akunKas as $akun) {
            $transaksi = DetailJurnal::where('daftar_akun_id', $akun->id)
                ->whereHas('jurnal', function($query) {
                    $query->where('status', 'posted');
                })
                ->get();
            
            $saldo = $transaksi->sum('jumlah_debit') - $transaksi->sum('jumlah_kredit');
            
            if ($saldo != 0) {
                $total += $saldo;
                $detail[] = [
                    'nama' => $akun->nama_akun,
                    'saldo' => $saldo,
                ];
            }
        }
        
        return [
            'total' => $total,
            'detail' => $detail,
        ];
    }
    
    private function getTopPendapatan($tanggalPeriode)
    {
        $tanggalAwal = $tanggalPeriode->copy()->startOfMonth();
        $tanggalAkhir = $tanggalPeriode->copy()->endOfMonth();
        
        $akunPendapatan = DaftarAkun::where('jenis_akun', 'pendapatan')->aktif()->get();
        $data = [];
        
        foreach ($akunPendapatan as $akun) {
            $transaksi = DetailJurnal::where('daftar_akun_id', $akun->id)
                ->whereHas('jurnal', function($query) use ($tanggalAwal, $tanggalAkhir) {
                    $query->whereBetween('tanggal_transaksi', [$tanggalAwal, $tanggalAkhir])
                          ->where('status', 'posted');
                })
                ->get();
            
            $total = $transaksi->sum('jumlah_kredit') - $transaksi->sum('jumlah_debit');
            
            if ($total > 0) {
                $data[] = [
                    'nama' => $akun->nama_akun,
                    'total' => $total,
                ];
            }
        }
        
        // Sort descending dan ambil top 5
        usort($data, function($a, $b) {
            return $b['total'] <=> $a['total'];
        });
        
        return array_slice($data, 0, 5);
    }
    
    private function getTopBeban($tanggalPeriode)
    {
        $tanggalAwal = $tanggalPeriode->copy()->startOfMonth();
        $tanggalAkhir = $tanggalPeriode->copy()->endOfMonth();
        
        $akunBeban = DaftarAkun::where('jenis_akun', 'beban')->aktif()->get();
        $data = [];
        
        foreach ($akunBeban as $akun) {
            $transaksi = DetailJurnal::where('daftar_akun_id', $akun->id)
                ->whereHas('jurnal', function($query) use ($tanggalAwal, $tanggalAkhir) {
                    $query->whereBetween('tanggal_transaksi', [$tanggalAwal, $tanggalAkhir])
                          ->where('status', 'posted');
                })
                ->get();
            
            $total = $transaksi->sum('jumlah_debit') - $transaksi->sum('jumlah_kredit');
            
            if ($total > 0) {
                $data[] = [
                    'nama' => $akun->nama_akun,
                    'total' => $total,
                ];
            }
        }
        
        // Sort descending dan ambil top 5
        usort($data, function($a, $b) {
            return $b['total'] <=> $a['total'];
        });
        
        return array_slice($data, 0, 5);
    }
    
    private function getPosisiKeuangan()
    {
        $tanggal = Carbon::now();
        
        // Total Aset
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
        
        // Total Kewajiban
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
        
        // Total Ekuitas
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
        
        return [
            'aset' => $totalAset,
            'kewajiban' => $totalKewajiban,
            'ekuitas' => $totalEkuitas,
        ];
    }
    
    private function getRasioLikuiditas()
    {
        $tanggal = Carbon::now();
        
        // Aset Lancar
        $asetLancar = DaftarAkun::where('jenis_akun', 'aset')
            ->where('sub_jenis', 'aset_lancar')
            ->aktif()
            ->get();
        $totalAsetLancar = 0;
        
        foreach ($asetLancar as $akun) {
            $transaksi = DetailJurnal::where('daftar_akun_id', $akun->id)
                ->whereHas('jurnal', function($query) use ($tanggal) {
                    $query->where('tanggal_transaksi', '<=', $tanggal)
                          ->where('status', 'posted');
                })
                ->get();
            $totalAsetLancar += $transaksi->sum('jumlah_debit') - $transaksi->sum('jumlah_kredit');
        }
        
        // Kewajiban Lancar
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
            $totalKewajibanLancar += $transaksi->sum('jumlah_kredit') - $transaksi->sum('jumlah_debit');
        }
        
        $currentRatio = $totalKewajibanLancar > 0 ? $totalAsetLancar / $totalKewajibanLancar : 0;
        
        return [
            'aset_lancar' => $totalAsetLancar,
            'kewajiban_lancar' => $totalKewajibanLancar,
            'current_ratio' => round($currentRatio, 2),
        ];
    }
}
