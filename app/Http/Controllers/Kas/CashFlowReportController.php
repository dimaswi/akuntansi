<?php

namespace App\Http\Controllers\Kas;

use App\Http\Controllers\Controller;
use App\Models\Kas\CashTransaction;
use App\Models\Kas\BankTransaction;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class CashFlowReportController extends Controller
{
    /**
     * Display cash flow report with new workflow support
     */
    public function index(Request $request)
    {
        // Check permission
        if (!auth()->user()->can('laporan.cash-flow.view')) {
            abort(403, 'Unauthorized. You do not have permission to view cash flow reports.');
        }

        $tanggalDari = $request->get('tanggal_dari', now()->startOfMonth()->format('Y-m-d'));
        $tanggalSampai = $request->get('tanggal_sampai', now()->endOfMonth()->format('Y-m-d'));
        $status = $request->get('status', 'all'); // all, draft, posted
        $jenisLaporan = $request->get('jenis_laporan', 'summary'); // summary, detail
        $tipeLaporan = $request->get('tipe_laporan', 'both'); // cash, bank, both

        // Query Cash Transactions
        $cashQuery = CashTransaction::with(['daftarAkunKas', 'daftarAkunLawan', 'user'])
            ->whereBetween('tanggal_transaksi', [$tanggalDari, $tanggalSampai])
            ->orderBy('tanggal_transaksi', 'asc')
            ->orderBy('created_at', 'asc');

        if ($status && $status !== 'all') {
            $cashQuery->where('status', $status);
        }

        $cashTransactions = $cashQuery->get();

        // Query Bank Transactions
        $bankQuery = BankTransaction::with(['bankAccount', 'daftarAkunLawan', 'user'])
            ->whereBetween('tanggal_transaksi', [$tanggalDari, $tanggalSampai])
            ->orderBy('tanggal_transaksi', 'asc')
            ->orderBy('created_at', 'asc');

        if ($status && $status !== 'all') {
            $bankQuery->where('status', $status);
        }

        $bankTransactions = $bankQuery->get();

        // Calculate summaries for new workflow
        $cashSummary = $this->calculateCashSummaryByStatus($cashTransactions);
        $bankSummary = $this->calculateBankSummaryByStatus($bankTransactions);
        $combinedSummary = $this->calculateCombinedSummary($cashSummary, $bankSummary);

        // Daily breakdown if detail report
        $dailyBreakdown = [];
        if ($jenisLaporan === 'detail') {
            $dailyBreakdown = $this->getDailyBreakdown($cashTransactions, $bankTransactions, $tanggalDari, $tanggalSampai);
        }

        return Inertia::render('kas/reports/cash-flow', [
            'cashTransactions' => $cashTransactions,
            'bankTransactions' => $bankTransactions,
            'cashSummary' => $cashSummary,
            'bankSummary' => $bankSummary,
            'combinedSummary' => $combinedSummary,
            'dailyBreakdown' => $dailyBreakdown,
            'filters' => [
                'tanggal_dari' => $tanggalDari,
                'tanggal_sampai' => $tanggalSampai,
                'status' => $status,
                'jenis_laporan' => $jenisLaporan,
                'tipe_laporan' => $tipeLaporan,
            ]
        ]);
    }

    private function calculateCashSummary($transactions)
    {
        $summary = [
            'saldo_awal' => 0, // This should come from previous period
            'total_penerimaan' => 0,
            'total_pengeluaran' => 0,
            'saldo_akhir' => 0,
            'draft_penerimaan' => 0,
            'draft_pengeluaran' => 0,
            'posted_penerimaan' => 0,
            'posted_pengeluaran' => 0,
        ];

        foreach ($transactions as $transaction) {
            if (in_array($transaction->jenis_transaksi, ['penerimaan', 'uang_muka_penerimaan', 'transfer_masuk'])) {
                $summary['total_penerimaan'] += $transaction->jumlah;
                if ($transaction->status === 'draft') {
                    $summary['draft_penerimaan'] += $transaction->jumlah;
                } else {
                    $summary['posted_penerimaan'] += $transaction->jumlah;
                }
            } else {
                $summary['total_pengeluaran'] += $transaction->jumlah;
                if ($transaction->status === 'draft') {
                    $summary['draft_pengeluaran'] += $transaction->jumlah;
                } else {
                    $summary['posted_pengeluaran'] += $transaction->jumlah;
                }
            }
        }

        $summary['saldo_akhir'] = $summary['saldo_awal'] + $summary['total_penerimaan'] - $summary['total_pengeluaran'];

        return $summary;
    }

    private function calculateBankSummary($transactions)
    {
        $summary = [
            'total_setoran' => 0,
            'total_penarikan' => 0,
            'draft_setoran' => 0,
            'draft_penarikan' => 0,
            'posted_setoran' => 0,
            'posted_penarikan' => 0,
        ];

        foreach ($transactions as $transaction) {
            if (in_array($transaction->jenis_transaksi, ['setoran', 'transfer_masuk', 'kliring_masuk', 'bunga_bank'])) {
                $summary['total_setoran'] += $transaction->jumlah;
                if ($transaction->status === 'draft') {
                    $summary['draft_setoran'] += $transaction->jumlah;
                } else {
                    $summary['posted_setoran'] += $transaction->jumlah;
                }
            } else {
                $summary['total_penarikan'] += $transaction->jumlah;
                if ($transaction->status === 'draft') {
                    $summary['draft_penarikan'] += $transaction->jumlah;
                } else {
                    $summary['posted_penarikan'] += $transaction->jumlah;
                }
            }
        }

        return $summary;
    }

    private function getDailyBreakdown($cashTransactions, $bankTransactions, $tanggalDari, $tanggalSampai)
    {
        $breakdown = [];
        $startDate = Carbon::parse($tanggalDari);
        $endDate = Carbon::parse($tanggalSampai);

        for ($date = $startDate->copy(); $date->lte($endDate); $date->addDay()) {
            $dateStr = $date->format('Y-m-d');
            
            $breakdown[$dateStr] = [
                'tanggal' => $dateStr,
                'cash' => [
                    'penerimaan' => 0,
                    'pengeluaran' => 0,
                    'transactions' => []
                ],
                'bank' => [
                    'setoran' => 0,
                    'penarikan' => 0,
                    'transactions' => []
                ]
            ];
        }

        // Group cash transactions by date
        foreach ($cashTransactions as $transaction) {
            $dateStr = Carbon::parse($transaction->tanggal_transaksi)->format('Y-m-d');
            if (isset($breakdown[$dateStr])) {
                $breakdown[$dateStr]['cash']['transactions'][] = $transaction;
                
                if (in_array($transaction->jenis_transaksi, ['penerimaan', 'uang_muka_penerimaan', 'transfer_masuk'])) {
                    $breakdown[$dateStr]['cash']['penerimaan'] += $transaction->jumlah;
                } else {
                    $breakdown[$dateStr]['cash']['pengeluaran'] += $transaction->jumlah;
                }
            }
        }

        // Group bank transactions by date
        foreach ($bankTransactions as $transaction) {
            $dateStr = Carbon::parse($transaction->tanggal_transaksi)->format('Y-m-d');
            if (isset($breakdown[$dateStr])) {
                $breakdown[$dateStr]['bank']['transactions'][] = $transaction;
                
                if (in_array($transaction->jenis_transaksi, ['setoran', 'transfer_masuk', 'kliring_masuk', 'bunga_bank'])) {
                    $breakdown[$dateStr]['bank']['setoran'] += $transaction->jumlah;
                } else {
                    $breakdown[$dateStr]['bank']['penarikan'] += $transaction->jumlah;
                }
            }
        }

        return array_values($breakdown);
    }

    /**
     * Calculate cash summary by status for new workflow
     */
    private function calculateCashSummaryByStatus($cashTransactions)
    {
        $summary = [
            'draft' => [
                'penerimaan' => 0,
                'pengeluaran' => 0,
                'saldo' => 0,
                'count' => 0
            ],
            'posted' => [
                'penerimaan' => 0,
                'pengeluaran' => 0,
                'saldo' => 0,
                'count' => 0
            ],
            'total' => [
                'penerimaan' => 0,
                'pengeluaran' => 0,
                'saldo' => 0,
                'count' => 0
            ]
        ];

        foreach ($cashTransactions as $transaction) {
            $status = $transaction->status;
            $jumlah = $transaction->jumlah;
            
            if (in_array($transaction->jenis_transaksi, ['penerimaan', 'uang_muka_penerimaan', 'transfer_masuk'])) {
                $summary[$status]['penerimaan'] += $jumlah;
                $summary['total']['penerimaan'] += $jumlah;
            } else {
                $summary[$status]['pengeluaran'] += $jumlah;
                $summary['total']['pengeluaran'] += $jumlah;
            }
            
            $summary[$status]['count']++;
            $summary['total']['count']++;
        }

        // Calculate net cash flow for each status
        foreach (['draft', 'posted', 'total'] as $status) {
            $summary[$status]['saldo'] = $summary[$status]['penerimaan'] - $summary[$status]['pengeluaran'];
        }

        return $summary;
    }

    /**
     * Calculate bank summary by status for new workflow
     */
    private function calculateBankSummaryByStatus($bankTransactions)
    {
        $summary = [
            'draft' => [
                'setoran' => 0,
                'penarikan' => 0,
                'saldo' => 0,
                'count' => 0
            ],
            'posted' => [
                'setoran' => 0,
                'penarikan' => 0,
                'saldo' => 0,
                'count' => 0
            ],
            'total' => [
                'setoran' => 0,
                'penarikan' => 0,
                'saldo' => 0,
                'count' => 0
            ]
        ];

        foreach ($bankTransactions as $transaction) {
            $status = $transaction->status;
            $jumlah = $transaction->jumlah;
            
            if (in_array($transaction->jenis_transaksi, ['setoran', 'transfer_masuk', 'kliring_masuk', 'bunga_bank'])) {
                $summary[$status]['setoran'] += $jumlah;
                $summary['total']['setoran'] += $jumlah;
            } else {
                $summary[$status]['penarikan'] += $jumlah;
                $summary['total']['penarikan'] += $jumlah;
            }
            
            $summary[$status]['count']++;
            $summary['total']['count']++;
        }

        // Calculate net bank flow for each status
        foreach (['draft', 'posted', 'total'] as $status) {
            $summary[$status]['saldo'] = $summary[$status]['setoran'] - $summary[$status]['penarikan'];
        }

        return $summary;
    }

    /**
     * Calculate combined summary
     */
    private function calculateCombinedSummary($cashSummary, $bankSummary)
    {
        $combined = [
            'draft' => [
                'total_masuk' => $cashSummary['draft']['penerimaan'] + $bankSummary['draft']['setoran'],
                'total_keluar' => $cashSummary['draft']['pengeluaran'] + $bankSummary['draft']['penarikan'],
                'saldo_bersih' => 0,
                'count' => $cashSummary['draft']['count'] + $bankSummary['draft']['count']
            ],
            'posted' => [
                'total_masuk' => $cashSummary['posted']['penerimaan'] + $bankSummary['posted']['setoran'],
                'total_keluar' => $cashSummary['posted']['pengeluaran'] + $bankSummary['posted']['penarikan'],
                'saldo_bersih' => 0,
                'count' => $cashSummary['posted']['count'] + $bankSummary['posted']['count']
            ],
            'total' => [
                'total_masuk' => $cashSummary['total']['penerimaan'] + $bankSummary['total']['setoran'],
                'total_keluar' => $cashSummary['total']['pengeluaran'] + $bankSummary['total']['penarikan'],
                'saldo_bersih' => 0,
                'count' => $cashSummary['total']['count'] + $bankSummary['total']['count']
            ]
        ];

        // Calculate net flow for each status
        foreach (['draft', 'posted', 'total'] as $status) {
            $combined[$status]['saldo_bersih'] = $combined[$status]['total_masuk'] - $combined[$status]['total_keluar'];
        }

        return $combined;
    }
}
