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

class BukuBesarController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'daftar_akun_id' => 'nullable|exists:daftar_akun,id',
            'periode_dari' => 'nullable|date',
            'periode_sampai' => 'nullable|date|after_or_equal:periode_dari',
            'jenis_akun' => 'nullable|string|in:aset,kewajiban,ekuitas,pendapatan,beban',
        ]);

        // Default periode (bulan ini)
        $periodeAwal = $request->periode_dari 
            ? Carbon::parse($request->periode_dari) 
            : Carbon::now()->startOfMonth();
        
        $periodeAkhir = $request->periode_sampai 
            ? Carbon::parse($request->periode_sampai) 
            : Carbon::now()->endOfMonth();

        // Query dasar untuk akun
        $akunQuery = DaftarAkun::aktif();

        // Filter berdasarkan jenis akun
        if ($request->jenis_akun) {
            $akunQuery->where('jenis_akun', $request->jenis_akun);
        }

        // Filter berdasarkan akun spesifik
        if ($request->daftar_akun_id) {
            $akunQuery->where('id', $request->daftar_akun_id);
        }

        $akunList = $akunQuery->orderBy('kode_akun')->get();

        // Data buku besar
        $bukuBesar = [];

        foreach ($akunList as $akun) {
            // Saldo awal (transaksi sebelum periode)
            $saldoAwal = $this->hitungSaldoAwal($akun, $periodeAwal);

            // Transaksi dalam periode
            $transaksi = DetailJurnal::with(['jurnal'])
                ->where('daftar_akun_id', $akun->id)
                ->whereHas('jurnal', function($query) use ($periodeAwal, $periodeAkhir) {
                    $query->whereBetween('tanggal_transaksi', [$periodeAwal, $periodeAkhir]);
                })
                ->orderBy('created_at')
                ->get()
                ->map(function($detail) {
                    return [
                        'id' => $detail->id,
                        'tanggal' => $detail->jurnal->tanggal_transaksi,
                        'keterangan' => $detail->jurnal->keterangan,
                        'referensi' => $detail->jurnal->nomor_jurnal,
                        'debet' => $detail->jumlah_debit,
                        'kredit' => $detail->jumlah_kredit,
                    ];
                });

            // Hitung saldo berjalan
            $saldoBerjalan = $saldoAwal;
            $transaksiDenganSaldo = $transaksi->map(function($item) use (&$saldoBerjalan, $akun) {
                if (in_array($akun->jenis_akun, ['aset', 'beban'])) {
                    // Akun normal debet
                    $saldoBerjalan += $item['debet'] - $item['kredit'];
                } else {
                    // Akun normal kredit
                    $saldoBerjalan += $item['kredit'] - $item['debet'];
                }
                
                $item['saldo'] = $saldoBerjalan;
                return $item;
            });

            $saldoAkhir = $saldoBerjalan;

            // Skip akun yang tidak memiliki transaksi dan saldo 0
            if ($transaksiDenganSaldo->isEmpty() && $saldoAwal == 0 && $saldoAkhir == 0) {
                continue;
            }

            $bukuBesar[] = [
                'akun' => [
                    'id' => $akun->id,
                    'kode_akun' => $akun->kode_akun,
                    'nama_akun' => $akun->nama_akun,
                    'jenis_akun' => $akun->jenis_akun,
                ],
                'saldo_awal' => $saldoAwal,
                'saldo_akhir' => $saldoAkhir,
                'mutasi_debet' => $transaksi->sum('debet'),
                'mutasi_kredit' => $transaksi->sum('kredit'),
                'transaksi' => $transaksiDenganSaldo,
            ];
        }

        // List semua akun untuk filter
        $semuaAkun = DaftarAkun::aktif()
            ->orderBy('kode_akun')
            ->get(['id', 'kode_akun', 'nama_akun', 'jenis_akun']);

        return Inertia::render('akuntansi/buku-besar/index', [
            'bukuBesar' => $bukuBesar,
            'semuaAkun' => $semuaAkun,
            'filters' => [
                'daftar_akun_id' => $request->daftar_akun_id,
                'periode_dari' => $periodeAwal->format('Y-m-d'),
                'periode_sampai' => $periodeAkhir->format('Y-m-d'),
                'jenis_akun' => $request->jenis_akun,
            ],
            'jenisAkun' => [
                'aset' => 'Aset',
                'kewajiban' => 'Kewajiban',
                'ekuitas' => 'Ekuitas',
                'pendapatan' => 'Pendapatan',
                'beban' => 'Beban',
            ],
        ]);
    }

    public function show(Request $request, $akunId)
    {
        $akun = DaftarAkun::findOrFail($akunId);

        $request->validate([
            'periode_dari' => 'nullable|date',
            'periode_sampai' => 'nullable|date|after_or_equal:periode_dari',
        ]);

        // Default periode (bulan ini)
        $periodeAwal = $request->periode_dari 
            ? Carbon::parse($request->periode_dari) 
            : Carbon::now()->startOfMonth();
        
        $periodeAkhir = $request->periode_sampai 
            ? Carbon::parse($request->periode_sampai) 
            : Carbon::now()->endOfMonth();

        // Saldo awal
        $saldoAwal = $this->hitungSaldoAwal($akun, $periodeAwal);

        // Transaksi dalam periode
        $transaksi = DetailJurnal::with(['jurnal'])
            ->where('daftar_akun_id', $akun->id)
            ->whereHas('jurnal', function($query) use ($periodeAwal, $periodeAkhir) {
                $query->whereBetween('tanggal_transaksi', [$periodeAwal, $periodeAkhir]);
            })
            ->orderBy('created_at')
            ->get()
            ->map(function($detail) {
                return [
                    'id' => $detail->id,
                    'tanggal' => $detail->jurnal->tanggal_transaksi,
                    'keterangan' => $detail->jurnal->keterangan,
                    'referensi' => $detail->jurnal->nomor_jurnal,
                    'debet' => $detail->jumlah_debit,
                    'kredit' => $detail->jumlah_kredit,
                ];
            });

        // Hitung saldo berjalan
        $saldoBerjalan = $saldoAwal;
        $transaksiDenganSaldo = $transaksi->map(function($item) use (&$saldoBerjalan, $akun) {
            if (in_array($akun->jenis_akun, ['aset', 'beban'])) {
                // Akun normal debet
                $saldoBerjalan += $item['debet'] - $item['kredit'];
            } else {
                // Akun normal kredit
                $saldoBerjalan += $item['kredit'] - $item['debet'];
            }
            
            $item['saldo'] = $saldoBerjalan;
            return $item;
        });

        $saldoAkhir = $saldoBerjalan;

        return Inertia::render('akuntansi/buku-besar/show', [
            'akun' => $akun,
            'saldoAwal' => $saldoAwal,
            'saldoAkhir' => $saldoAkhir,
            'mutasiDebet' => $transaksi->sum('debet'),
            'mutasiKredit' => $transaksi->sum('kredit'),
            'transaksi' => $transaksiDenganSaldo,
            'filters' => [
                'periode_dari' => $periodeAwal->format('Y-m-d'),
                'periode_sampai' => $periodeAkhir->format('Y-m-d'),
            ],
        ]);
    }

    private function hitungSaldoAwal($akun, $periodeAwal)
    {
        $transaksiSebelumnya = DetailJurnal::where('daftar_akun_id', $akun->id)
            ->whereHas('jurnal', function($query) use ($periodeAwal) {
                $query->where('tanggal_transaksi', '<', $periodeAwal);
            })
            ->get();

        $totalDebet = $transaksiSebelumnya->sum('jumlah_debit');
        $totalKredit = $transaksiSebelumnya->sum('jumlah_kredit');

        if (in_array($akun->jenis_akun, ['aset', 'beban'])) {
            // Akun normal debet
            return $totalDebet - $totalKredit;
        } else {
            // Akun normal kredit
            return $totalKredit - $totalDebet;
        }
    }

    public function export(Request $request)
    {
        // TODO: Implementasi export ke Excel/PDF
        return response()->json([
            'message' => 'Export feature coming soon',
        ]);
    }
}
