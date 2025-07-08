<?php

namespace App\Http\Controllers\Kas;

use App\Http\Controllers\Controller;
use App\Models\Kas\BankAccount;
use App\Models\Kas\CashTransaction;
use App\Models\Kas\BankTransaction;
use App\Models\Kas\GiroTransaction;
use Carbon\Carbon;
use Inertia\Inertia;

class KasDashboardController extends Controller
{
    public function index()
    {
        // Calculate total cash balance
        $totalCashBalance = CashTransaction::where('status', 'posted')
            ->selectRaw('
                SUM(CASE WHEN jenis_transaksi = "penerimaan" THEN jumlah ELSE 0 END) -
                SUM(CASE WHEN jenis_transaksi = "pengeluaran" THEN jumlah ELSE 0 END) as total
            ')
            ->value('total') ?? 0;

        // Calculate total bank balance
        $totalBankBalance = BankAccount::sum('saldo_awal') + 
            BankTransaction::where('status', 'posted')
                ->selectRaw('
                    SUM(CASE WHEN jenis_transaksi = "penerimaan" THEN jumlah ELSE 0 END) -
                    SUM(CASE WHEN jenis_transaksi = "pengeluaran" THEN jumlah ELSE 0 END) as total
                ')
                ->value('total') ?? 0;

        // Count pending giros
        $pendingGiroCount = GiroTransaction::where('status_giro', 'pending')->count();

        // Count today's transactions
        $today = Carbon::today();
        $todayTransactionsCount = CashTransaction::whereDate('tanggal_transaksi', $today)->count() +
                                BankTransaction::whereDate('tanggal_transaksi', $today)->count() +
                                GiroTransaction::whereDate('tanggal_jatuh_tempo', $today)->count();

        // Monthly cash flow
        $currentMonth = Carbon::now()->startOfMonth();
        $monthlyCashIn = CashTransaction::where('status', 'posted')
            ->where('jenis_transaksi', 'penerimaan')
            ->whereDate('tanggal_transaksi', '>=', $currentMonth)
            ->sum('jumlah');

        $monthlyCashOut = CashTransaction::where('status', 'posted')
            ->where('jenis_transaksi', 'pengeluaran')
            ->whereDate('tanggal_transaksi', '>=', $currentMonth)
            ->sum('jumlah');

        // Monthly bank flow
        $monthlyBankIn = BankTransaction::where('status', 'posted')
            ->where('jenis_transaksi', 'penerimaan')
            ->whereDate('tanggal_transaksi', '>=', $currentMonth)
            ->sum('jumlah');

        $monthlyBankOut = BankTransaction::where('status', 'posted')
            ->where('jenis_transaksi', 'pengeluaran')
            ->whereDate('tanggal_transaksi', '>=', $currentMonth)
            ->sum('jumlah');

        $stats = [
            'total_cash_balance' => $totalCashBalance,
            'total_bank_balance' => $totalBankBalance,
            'pending_giro_count' => $pendingGiroCount,
            'today_transactions_count' => $todayTransactionsCount,
            'monthly_cash_in' => $monthlyCashIn,
            'monthly_cash_out' => $monthlyCashOut,
            'monthly_bank_in' => $monthlyBankIn,
            'monthly_bank_out' => $monthlyBankOut,
        ];

        return Inertia::render('kas/index', [
            'stats' => $stats,
        ]);
    }
}
