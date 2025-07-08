<?php

namespace App\Http\Controllers\Akuntansi;

use App\Http\Controllers\Controller;
use App\Models\Akuntansi\DaftarAkun;
use App\Models\Akuntansi\Jurnal;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AkuntansiController extends Controller
{
    /**
     * Display the accounting dashboard
     */
    public function index()
    {
        // Get basic statistics
        $totalAkun = DaftarAkun::where('is_aktif', true)->count();
        $jurnalBulanIni = Jurnal::whereMonth('tanggal_transaksi', now()->month)
            ->whereYear('tanggal_transaksi', now()->year)
            ->count();
        $totalTransaksi = Jurnal::count();
        
        // Get cash account balance (assuming cash account has code starting with '1-1-1')
        $saldoKas = 0; // TODO: Calculate balance from journal entries

        return Inertia::render('akuntansi/index', [
            'statistics' => [
                'total_akun' => $totalAkun,
                'jurnal_bulan_ini' => $jurnalBulanIni,
                'total_transaksi' => $totalTransaksi,
                'saldo_kas' => $saldoKas,
            ]
        ]);
    }
}
