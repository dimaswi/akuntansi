<?php

namespace App\Http\Controllers\Kas;

use App\Http\Controllers\Controller;
use App\Models\Kas\GiroTransaction;
use App\Models\Kas\BankAccount;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class GiroReportController extends Controller
{
    /**
     * Display giro report with new workflow support
     */
    public function index(Request $request)
    {
        // Check permission
        if (!auth()->user()->can('laporan.giro-report.view')) {
            abort(403, 'Unauthorized. You do not have permission to view giro reports.');
        }

        $tanggalDari = $request->get('tanggal_dari', now()->startOfMonth()->format('Y-m-d'));
        $tanggalSampai = $request->get('tanggal_sampai', now()->endOfMonth()->format('Y-m-d'));
        $status = $request->get('status', 'all'); // all, draft, posted
        $statusGiro = $request->get('status_giro', 'all'); // all, diterima, diserahkan_ke_bank, cair, tolak, batal
        $jenisGiro = $request->get('jenis_giro', 'all'); // all, masuk, keluar
        $bankAccountId = $request->get('bank_account_id', 'all');
        $jenisLaporan = $request->get('jenis_laporan', 'summary'); // summary, detail

        // Query Giro Transactions
        $giroQuery = GiroTransaction::with(['bankAccount', 'daftarAkunGiro', 'daftarAkunLawan', 'user'])
            ->whereBetween('tanggal_terima', [$tanggalDari, $tanggalSampai])
            ->orderBy('tanggal_terima', 'asc')
            ->orderBy('created_at', 'asc');

        if ($status && $status !== 'all') {
            $giroQuery->where('status', $status);
        }

        if ($statusGiro && $statusGiro !== 'all') {
            $giroQuery->where('status_giro', $statusGiro);
        }

        if ($jenisGiro && $jenisGiro !== 'all') {
            $giroQuery->where('jenis_giro', $jenisGiro);
        }

        if ($bankAccountId && $bankAccountId !== 'all') {
            $giroQuery->where('bank_account_id', $bankAccountId);
        }

        $giroTransactions = $giroQuery->get();

        // Calculate summaries
        $giroSummary = $this->calculateGiroSummary($giroTransactions);
        $dailyBreakdown = $this->calculateDailyBreakdown($giroTransactions, $tanggalDari, $tanggalSampai);

        // Get options for filters
        $bankAccounts = BankAccount::orderBy('nama_bank')->get();

        return Inertia::render('kas/reports/giro-report', [
            'giroTransactions' => $giroTransactions,
            'giroSummary' => $giroSummary,
            'dailyBreakdown' => $dailyBreakdown,
            'bankAccounts' => $bankAccounts,
            'filters' => [
                'tanggal_dari' => $tanggalDari,
                'tanggal_sampai' => $tanggalSampai,
                'status' => $status,
                'status_giro' => $statusGiro,
                'jenis_giro' => $jenisGiro,
                'bank_account_id' => $bankAccountId,
                'jenis_laporan' => $jenisLaporan,
            ],
        ]);
    }

    private function calculateGiroSummary($transactions)
    {
        $summary = [
            'draft' => [
                'masuk' => ['count' => 0, 'total' => 0],
                'keluar' => ['count' => 0, 'total' => 0],
            ],
            'posted' => [
                'masuk' => ['count' => 0, 'total' => 0],
                'keluar' => ['count' => 0, 'total' => 0],
            ],
            'by_status_giro' => [
                'diterima' => ['count' => 0, 'total' => 0],
                'diserahkan_ke_bank' => ['count' => 0, 'total' => 0],
                'cair' => ['count' => 0, 'total' => 0],
                'tolak' => ['count' => 0, 'total' => 0],
                'batal' => ['count' => 0, 'total' => 0],
            ],
            'outstanding' => [
                'count' => 0,
                'total' => 0,
            ],
            'matured' => [
                'count' => 0,
                'total' => 0,
            ],
        ];

        foreach ($transactions as $transaction) {
            $status = $transaction->status ?? 'draft';
            $jenis = $transaction->jenis_giro;
            $statusGiro = $transaction->status_giro;

            // Summary by posting status
            $summary[$status][$jenis]['count']++;
            $summary[$status][$jenis]['total'] += $transaction->jumlah;

            // Summary by giro status
            $summary['by_status_giro'][$statusGiro]['count']++;
            $summary['by_status_giro'][$statusGiro]['total'] += $transaction->jumlah;

            // Outstanding giros (not yet cashed)
            if (in_array($statusGiro, ['diterima', 'diserahkan_ke_bank'])) {
                $summary['outstanding']['count']++;
                $summary['outstanding']['total'] += $transaction->jumlah;

                // Matured giros (past due date)
                if ($transaction->tanggal_jatuh_tempo <= now()->toDate()) {
                    $summary['matured']['count']++;
                    $summary['matured']['total'] += $transaction->jumlah;
                }
            }
        }

        return $summary;
    }

    private function calculateDailyBreakdown($transactions, $tanggalDari, $tanggalSampai)
    {
        $breakdown = [];
        $start = Carbon::parse($tanggalDari);
        $end = Carbon::parse($tanggalSampai);

        for ($date = $start->copy(); $date->lte($end); $date->addDay()) {
            $dateStr = $date->format('Y-m-d');
            $breakdown[$dateStr] = [
                'tanggal' => $dateStr,
                'draft' => [
                    'masuk' => ['count' => 0, 'total' => 0],
                    'keluar' => ['count' => 0, 'total' => 0],
                ],
                'posted' => [
                    'masuk' => ['count' => 0, 'total' => 0],
                    'keluar' => ['count' => 0, 'total' => 0],
                ],
                'transactions' => [],
            ];
        }

        foreach ($transactions as $transaction) {
            $dateStr = $transaction->tanggal_terima->format('Y-m-d');
            
            if (isset($breakdown[$dateStr])) {
                $status = $transaction->status ?? 'draft';
                $jenis = $transaction->jenis_giro;

                $breakdown[$dateStr][$status][$jenis]['count']++;
                $breakdown[$dateStr][$status][$jenis]['total'] += $transaction->jumlah;
                $breakdown[$dateStr]['transactions'][] = $transaction;
            }
        }

        return array_values($breakdown);
    }
}
