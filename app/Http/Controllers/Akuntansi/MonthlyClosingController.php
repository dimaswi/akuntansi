<?php

namespace App\Http\Controllers\Akuntansi;

use App\Http\Controllers\Controller;
use App\Models\Akuntansi\MonthlyClosing;
use App\Models\Kas\CashTransaction;
use App\Models\Kas\BankTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class MonthlyClosingController extends Controller
{
    public function index(Request $request)
    {
        // Check permission
        if (!auth()->user()->can('monthly-closing.view')) {
            abort(403, 'Unauthorized access to monthly closing.');
        }

        $year = $request->get('year', now()->year);
        $status = $request->get('status', 'all');

        $query = MonthlyClosing::with(['initiatedBy', 'approvedBy', 'reopenedBy'])
            ->where('periode_tahun', $year)
            ->orderBy('periode_bulan', 'desc');

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        $closings = $query->paginate(12);

        // Summary untuk dashboard
        $summary = [
            'current_year' => $year,
            'total_closings' => MonthlyClosing::where('periode_tahun', $year)->count(),
            'closed_months' => MonthlyClosing::where('periode_tahun', $year)->closed()->count(),
            'pending_approvals' => MonthlyClosing::where('periode_tahun', $year)->where('status', 'pending_approval')->count(),
            'last_closed_month' => MonthlyClosing::where('periode_tahun', $year)->closed()->max('periode_bulan'),
        ];

        // Status bulan saat ini
        $currentMonth = now()->month;
        $currentMonthClosing = MonthlyClosing::forPeriod($year, $currentMonth)->first();
        $canInitiateClosing = !$currentMonthClosing && $this->checkCanInitiateClosing($year, $currentMonth);

        return Inertia::render('akuntansi/monthly-closing/index', [
            'closings' => $closings,
            'summary' => $summary,
            'currentMonthClosing' => $currentMonthClosing,
            'canInitiateClosing' => $canInitiateClosing,
            'filters' => [
                'year' => $year,
                'status' => $status
            ]
        ]);
    }

    public function create(Request $request)
    {
        // Check permission
        if (!auth()->user()->can('monthly-closing.create')) {
            abort(403, 'Unauthorized to initiate monthly closing.');
        }

        $year = $request->get('year', now()->year);
        $month = $request->get('month', now()->month);

        // Check if closing sudah ada untuk periode ini
        $existingClosing = MonthlyClosing::forPeriod($year, $month)->first();
        if ($existingClosing) {
            return redirect()->route('monthly-closing.show', $existingClosing)
                ->with('error', 'Monthly closing untuk periode ini sudah ada.');
        }

        // Validate dapat membuat closing
        if (!$this->checkCanInitiateClosing($year, $month)) {
            return redirect()->back()
                ->with('error', 'Tidak dapat membuat monthly closing untuk periode ini. Pastikan periode sebelumnya sudah di-close.');
        }

        // Get validation checks and pending transactions
        $validationChecks = $this->getValidationChecks($year, $month);
        $pendingTransactions = $this->getPendingTransactions($year, $month);

        $monthNames = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];

        return Inertia::render('akuntansi/monthly-closing/create', [
            'year' => $year,
            'month' => $month,
            'monthName' => $monthNames[$month - 1] ?? 'Unknown',
            'validationChecks' => $validationChecks,
            'pendingTransactions' => $pendingTransactions
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'periode_tahun' => 'required|integer|min:2020|max:2030',
            'periode_bulan' => 'required|integer|min:1|max:12',
            'tanggal_cut_off' => 'required|date',
            'keterangan' => 'nullable|string|max:1000'
        ]);

        // Check permission
        if (!auth()->user()->can('monthly-closing.create')) {
            abort(403, 'Unauthorized to create monthly closing.');
        }

        $year = $request->periode_tahun;
        $month = $request->periode_bulan;

        // Double check
        $existingClosing = MonthlyClosing::forPeriod($year, $month)->first();
        if ($existingClosing) {
            return redirect()->back()
                ->with('error', 'Monthly closing untuk periode ini sudah ada.');
        }

        DB::beginTransaction();
        try {
            // Create monthly closing
            $closing = MonthlyClosing::create([
                'periode_tahun' => $year,
                'periode_bulan' => $month,
                'tanggal_cut_off' => $request->tanggal_cut_off,
                'status' => MonthlyClosing::STATUS_DRAFT,
                'initiated_by' => Auth::id(),
                'keterangan' => $request->keterangan,
            ]);

            // Check if needs approval
            if ($closing->requiresApproval('monthly_closing')) {
                $approval = $closing->requestApproval(
                    Auth::user(),
                    'monthly_closing',
                    "Monthly closing untuk periode " . $closing->periode
                );

                if ($approval) {
                    $closing->update(['status' => MonthlyClosing::STATUS_PENDING_APPROVAL]);
                }
            }

            DB::commit();

            $message = $closing->status === MonthlyClosing::STATUS_PENDING_APPROVAL
                ? 'Monthly closing berhasil dibuat dan menunggu approval.'
                : 'Monthly closing berhasil dibuat.';

            return redirect()->route('monthly-closing.show', $closing)
                ->with('success', $message);

        } catch (\Exception $e) {
            DB::rollback();
            return redirect()->back()
                ->with('error', 'Gagal membuat monthly closing: ' . $e->getMessage());
        }
    }

    public function show(MonthlyClosing $monthlyClosing)
    {
        // Check permission
        if (!auth()->user()->can('monthly-closing.view')) {
            abort(403, 'Unauthorized access to monthly closing.');
        }

        $monthlyClosing->load(['initiatedBy', 'approvedBy']);

        // Get transaction summary for the period
        $startDate = Carbon::createFromDate($monthlyClosing->periode_tahun, $monthlyClosing->periode_bulan, 1)->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();

        $cashTransactions = CashTransaction::whereBetween('tanggal_transaksi', [$startDate, $endDate])
            ->where('status', 'posted')
            ->count();

        $bankTransactions = BankTransaction::whereBetween('tanggal_transaksi', [$startDate, $endDate])
            ->where('status', 'posted')
            ->count();

        $totalAmount = CashTransaction::whereBetween('tanggal_transaksi', [$startDate, $endDate])
            ->where('status', 'posted')
            ->sum('jumlah');

        $totalAmount += BankTransaction::whereBetween('tanggal_transaksi', [$startDate, $endDate])
            ->where('status', 'posted')
            ->sum('jumlah');

        return Inertia::render('akuntansi/monthly-closing/show', [
            'monthlyClosing' => $monthlyClosing,
            'canApprove' => auth()->user()->can('monthly-closing.approve') && $monthlyClosing->status === 'pending_approval',
            'canClose' => auth()->user()->can('monthly-closing.close') && $monthlyClosing->status === 'approved',
            'canReopen' => auth()->user()->can('monthly-closing.reopen') && $monthlyClosing->status === 'closed',
            'transactionSummary' => [
                'cash_transactions' => $cashTransactions,
                'bank_transactions' => $bankTransactions,
                'giro_transactions' => 0, // Add when implemented
                'total_transactions' => $cashTransactions + $bankTransactions,
                'total_amount' => $totalAmount
            ]
        ]);
    }

    public function close(MonthlyClosing $monthlyClosing)
    {
        // Check permission
        if (!auth()->user()->can('monthly-closing.close')) {
            abort(403, 'Unauthorized to close monthly period.');
        }

        if ($monthlyClosing->status !== MonthlyClosing::STATUS_APPROVED) {
            return redirect()->back()
                ->with('error', 'Monthly closing harus di-approve terlebih dahulu.');
        }

        DB::beginTransaction();
        try {
            // Check for pending transactions
            $pendingCount = $monthlyClosing->getPendingTransactionsCount();
            if ($pendingCount > 0) {
                return redirect()->back()
                    ->with('error', "Masih ada {$pendingCount} transaksi yang belum di-post. Harap selesaikan semua transaksi terlebih dahulu.");
            }

            // Auto adjustments (jika diperlukan)
            $autoAdjustments = $this->performAutoAdjustments($monthlyClosing);

            // Update status to closed
            $monthlyClosing->update([
                'status' => MonthlyClosing::STATUS_CLOSED,
                'closed_at' => now(),
                'auto_adjustments' => $autoAdjustments,
                'closing_summary' => $monthlyClosing->generateClosingSummary()
            ]);

            DB::commit();

            return redirect()->back()
                ->with('success', 'Monthly closing berhasil di-tutup untuk periode ' . $monthlyClosing->periode);

        } catch (\Exception $e) {
            DB::rollback();
            return redirect()->back()
                ->with('error', 'Gagal menutup periode: ' . $e->getMessage());
        }
    }

    public function reopen(Request $request, MonthlyClosing $monthlyClosing)
    {
        $request->validate([
            'reopen_reason' => 'required|string|max:500'
        ]);

        // Check permission
        if (!auth()->user()->can('monthly-closing.reopen')) {
            abort(403, 'Unauthorized to reopen monthly period.');
        }

        if (!$monthlyClosing->canBeReopened()) {
            return redirect()->back()
                ->with('error', 'Periode ini tidak dapat dibuka kembali.');
        }

        $monthlyClosing->update([
            'status' => MonthlyClosing::STATUS_REOPENED,
            'reopened_by' => Auth::id(),
            'reopened_at' => now(),
            'reopen_reason' => $request->reopen_reason
        ]);

        return redirect()->back()
            ->with('success', 'Periode ' . $monthlyClosing->periode . ' berhasil dibuka kembali.');
    }

    public function approve(MonthlyClosing $monthlyClosing)
    {
        // Check permission
        if (!auth()->user()->can('monthly-closing.approve')) {
            abort(403, 'Unauthorized to approve monthly closing.');
        }

        if ($monthlyClosing->status !== 'pending_approval') {
            return redirect()->back()
                ->with('error', 'Monthly closing tidak dalam status pending approval.');
        }

        DB::beginTransaction();
        try {
            $monthlyClosing->update([
                'status' => 'approved',
                'approved_by' => Auth::id(),
                'approved_at' => now()
            ]);

            DB::commit();

            return redirect()->back()
                ->with('success', 'Monthly closing berhasil di-approve.');

        } catch (\Exception $e) {
            DB::rollback();
            return redirect()->back()
                ->with('error', 'Gagal approve monthly closing: ' . $e->getMessage());
        }
    }

    private function checkCanInitiateClosing($year, $month)
    {
        // Tidak bisa membuat closing untuk bulan yang akan datang
        $today = now();
        $targetDate = Carbon::createFromDate($year, $month, 1);
        
        if ($targetDate->isFuture()) {
            return false;
        }

        // Check apakah periode sebelumnya sudah di-close (opsional rule)
        if ($month > 1) {
            $previousMonth = MonthlyClosing::forPeriod($year, $month - 1)->first();
            // Uncomment jika mau enforce sequence closing
            // if (!$previousMonth || !$previousMonth->isClosed()) {
            //     return false;
            // }
        }

        return true;
    }

    private function getPeriodData($year, $month)
    {
        $startDate = Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();

        // Summary transaksi kas
        $cashSummary = CashTransaction::whereBetween('tanggal_transaksi', [$startDate, $endDate])
            ->selectRaw('
                status,
                COUNT(*) as count,
                SUM(CASE WHEN jenis_transaksi IN ("penerimaan", "uang_muka_penerimaan", "transfer_masuk") THEN jumlah ELSE 0 END) as penerimaan,
                SUM(CASE WHEN jenis_transaksi NOT IN ("penerimaan", "uang_muka_penerimaan", "transfer_masuk") THEN jumlah ELSE 0 END) as pengeluaran
            ')
            ->groupBy('status')
            ->get()
            ->keyBy('status');

        // Summary transaksi bank
        $bankSummary = BankTransaction::whereBetween('tanggal_transaksi', [$startDate, $endDate])
            ->selectRaw('
                status,
                COUNT(*) as count,
                SUM(CASE WHEN jenis_transaksi IN ("setoran", "transfer_masuk", "kliring_masuk", "bunga_bank") THEN jumlah ELSE 0 END) as setoran,
                SUM(CASE WHEN jenis_transaksi NOT IN ("setoran", "transfer_masuk", "kliring_masuk", "bunga_bank") THEN jumlah ELSE 0 END) as penarikan
            ')
            ->groupBy('status')
            ->get()
            ->keyBy('status');

        // Count pending transactions
        $pendingCash = CashTransaction::whereBetween('tanggal_transaksi', [$startDate, $endDate])
            ->whereIn('status', ['draft', 'pending_approval'])
            ->count();

        $pendingBank = BankTransaction::whereBetween('tanggal_transaksi', [$startDate, $endDate])
            ->whereIn('status', ['draft', 'pending_approval'])
            ->count();

        return [
            'periode' => $startDate->format('F Y'),
            'start_date' => $startDate->format('Y-m-d'),
            'end_date' => $endDate->format('Y-m-d'),
            'cash_summary' => $cashSummary,
            'bank_summary' => $bankSummary,
            'total_pending' => $pendingCash + $pendingBank,
            'pending_cash' => $pendingCash,
            'pending_bank' => $pendingBank,
            'can_close' => ($pendingCash + $pendingBank) === 0
        ];
    }

    private function generateClosingSummary($year, $month)
    {
        $periodData = $this->getPeriodData($year, $month);
        
        return [
            'generated_at' => now(),
            'period_data' => $periodData,
            'generated_by' => Auth::id()
        ];
    }

    private function performAutoAdjustments($monthlyClosing)
    {
        $adjustments = [];

        // Example: Auto adjustments bisa berupa:
        // - Accrual adjustments
        // - Depreciation
        // - Period-end provisions
        // - etc.

        return $adjustments;
    }

    private function getValidationChecks($year, $month)
    {
        $startDate = Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();

        // Check all transactions posted
        $pendingTransactions = CashTransaction::whereBetween('tanggal_transaksi', [$startDate, $endDate])
            ->whereIn('status', ['draft', 'pending_approval'])
            ->count();
        
        $pendingTransactions += BankTransaction::whereBetween('tanggal_transaksi', [$startDate, $endDate])
            ->whereIn('status', ['draft', 'pending_approval'])
            ->count();

        // Check no pending approvals
        $pendingApprovals = \App\Models\Approval::where('status', 'pending')
            ->whereHas('approvable', function ($query) use ($startDate, $endDate) {
                $query->whereBetween('tanggal_transaksi', [$startDate, $endDate]);
            })
            ->count();

        // Check previous month closed
        $previousMonth = $month - 1;
        $previousYear = $year;
        if ($previousMonth < 1) {
            $previousMonth = 12;
            $previousYear--;
        }

        $previousMonthClosed = true;
        if ($month > 1 || $year > now()->year - 1) {
            $previousClosing = MonthlyClosing::forPeriod($previousYear, $previousMonth)->first();
            $previousMonthClosed = $previousClosing && $previousClosing->status === 'closed';
        }

        $allTransactionsPosted = $pendingTransactions === 0;
        $noPendingApprovals = $pendingApprovals === 0;

        return [
            'all_transactions_posted' => $allTransactionsPosted,
            'no_pending_approvals' => $noPendingApprovals,
            'previous_month_closed' => $previousMonthClosed,
            'can_proceed' => $allTransactionsPosted && $noPendingApprovals && $previousMonthClosed
        ];
    }

    private function getPendingTransactions($year, $month)
    {
        $startDate = Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();

        $cashCount = CashTransaction::whereBetween('tanggal_transaksi', [$startDate, $endDate])
            ->whereIn('status', ['draft', 'pending_approval'])
            ->count();

        $bankCount = BankTransaction::whereBetween('tanggal_transaksi', [$startDate, $endDate])
            ->whereIn('status', ['draft', 'pending_approval'])
            ->count();

        // Assuming giro transactions exist
        $giroCount = 0; // You can add this when giro transactions are implemented

        return [
            'cash_count' => $cashCount,
            'bank_count' => $bankCount,
            'giro_count' => $giroCount,
            'total_count' => $cashCount + $bankCount + $giroCount
        ];
    }
}
