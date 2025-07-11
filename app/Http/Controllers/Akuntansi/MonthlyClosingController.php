<?php

namespace App\Http\Controllers\Akuntansi;

use App\Http\Controllers\Controller;
use App\Models\Akuntansi\MonthlyClosing;
use App\Models\Kas\CashTransaction;
use App\Models\Kas\BankTransaction;
use App\Models\Kas\GiroTransaction;
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
        /** @var \App\Models\User $user */
        $user = Auth::user();
        if (!$user || !$user->hasPermission('monthly-closing.view')) {
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
        /** @var \App\Models\User $user */
        $user = Auth::user();
        if (!$user || !$user->hasPermission('monthly-closing.create')) {
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
        $cashOnlyValidation = $this->getCashOnlyValidation($year, $month);

        $monthNames = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];

        return Inertia::render('akuntansi/monthly-closing/create', [
            'year' => $year,
            'month' => $month,
            'monthName' => $monthNames[$month - 1] ?? 'Unknown',
            'validationChecks' => $validationChecks,
            'pendingTransactions' => $pendingTransactions,
            'cashOnlyValidation' => $cashOnlyValidation
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
        /** @var \App\Models\User $user */
        $user = Auth::user();
        if (!$user || !$user->hasPermission('monthly-closing.create')) {
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
        /** @var \App\Models\User $user */
        $user = Auth::user();
        if (!$user || !$user->hasPermission('monthly-closing.view')) {
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

        $giroTransactions = GiroTransaction::whereBetween('tanggal_giro', [$startDate, $endDate])
            ->where('status', 'posted')
            ->count();

        $totalAmount = CashTransaction::whereBetween('tanggal_transaksi', [$startDate, $endDate])
            ->where('status', 'posted')
            ->sum('jumlah');

        $totalAmount += BankTransaction::whereBetween('tanggal_transaksi', [$startDate, $endDate])
            ->where('status', 'posted')
            ->sum('jumlah');

        $totalAmount += GiroTransaction::whereBetween('tanggal_giro', [$startDate, $endDate])
            ->where('status', 'posted')
            ->sum('jumlah');

        return Inertia::render('akuntansi/monthly-closing/show', [
            'monthlyClosing' => $monthlyClosing,
            'canApprove' => $user->hasPermission('monthly-closing.approve') && $monthlyClosing->status === 'pending_approval',
            'canClose' => $user->hasPermission('monthly-closing.close') && $monthlyClosing->status === 'approved',
            'canReopen' => $user->hasPermission('monthly-closing.reopen') && $monthlyClosing->status === 'closed',
            'transactionSummary' => [
                'cash_transactions' => $cashTransactions,
                'bank_transactions' => $bankTransactions,
                'giro_transactions' => $giroTransactions,
                'total_transactions' => $cashTransactions + $bankTransactions + $giroTransactions,
                'total_amount' => $totalAmount
            ]
        ]);
    }

    public function close(MonthlyClosing $monthlyClosing)
    {
        // Check permission
        /** @var \App\Models\User $user */
        $user = Auth::user();
        if (!$user || !$user->hasPermission('monthly-closing.close')) {
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
        /** @var \App\Models\User $user */
        $user = Auth::user();
        if (!$user || !$user->hasPermission('monthly-closing.reopen')) {
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
        /** @var \App\Models\User $user */
        $user = Auth::user();
        if (!$user || !$user->hasPermission('monthly-closing.approve')) {
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

        // Summary transaksi giro
        $giroSummary = GiroTransaction::whereBetween('tanggal_giro', [$startDate, $endDate])
            ->selectRaw('
                status,
                COUNT(*) as count,
                SUM(CASE WHEN jenis_giro = "masuk" THEN jumlah ELSE 0 END) as giro_masuk,
                SUM(CASE WHEN jenis_giro = "keluar" THEN jumlah ELSE 0 END) as giro_keluar
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

        $pendingGiro = GiroTransaction::whereBetween('tanggal_giro', [$startDate, $endDate])
            ->whereIn('status', ['draft', 'pending_approval'])
            ->count();

        return [
            'periode' => $startDate->format('F Y'),
            'start_date' => $startDate->format('Y-m-d'),
            'end_date' => $endDate->format('Y-m-d'),
            'cash_summary' => $cashSummary,
            'bank_summary' => $bankSummary,
            'giro_summary' => $giroSummary,
            'total_pending' => $pendingCash + $pendingBank + $pendingGiro,
            'pending_cash' => $pendingCash,
            'pending_bank' => $pendingBank,
            'pending_giro' => $pendingGiro,
            'can_close' => ($pendingCash + $pendingBank + $pendingGiro) === 0
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
        // Untuk cut-off, yang menghalangi hanya draft yang akan masuk jurnal
        // Draft untuk laporan kas saja tidak menghalangi cut-off
        $pendingCashForJournal = CashTransaction::whereBetween('tanggal_transaksi', [$startDate, $endDate])
            ->where('status', 'draft')
            ->where('will_post_to_journal', true) // Hanya yang akan masuk jurnal yang menghalangi cut-off
            ->count();
        
        $pendingBankForJournal = BankTransaction::whereBetween('tanggal_transaksi', [$startDate, $endDate])
            ->where('status', 'draft')
            ->where('will_post_to_journal', true) // Hanya yang akan masuk jurnal yang menghalangi cut-off
            ->count();
        
        $pendingGiroForJournal = GiroTransaction::whereBetween('tanggal_giro', [$startDate, $endDate])
            ->where('status', 'draft')
            ->where('will_post_to_journal', true) // Hanya yang akan masuk jurnal yang menghalangi cut-off
            ->count();
        
        $pendingTransactions = $pendingCashForJournal + $pendingBankForJournal + $pendingGiroForJournal;
        
        // Transaksi dengan status 'pending_approval' tetap menghalangi cut-off
        $pendingApprovalTransactions = CashTransaction::whereBetween('tanggal_transaksi', [$startDate, $endDate])
            ->where('status', 'pending_approval')
            ->count();
            
        $pendingApprovalTransactions += BankTransaction::whereBetween('tanggal_transaksi', [$startDate, $endDate])
            ->where('status', 'pending_approval')
            ->count();

        $pendingApprovalTransactions += GiroTransaction::whereBetween('tanggal_giro', [$startDate, $endDate])
            ->where('status', 'pending_approval')
            ->count();
            
        $pendingTransactions += $pendingApprovalTransactions;
            
        // Note: Transaksi dengan status 'approved' atau 'completed' tidak menghalangi cut-off
        // karena sudah final untuk laporan kas, meskipun belum masuk jurnal

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

        // Default true untuk sistem baru atau bulan pertama
        $previousMonthClosed = true;
        
        // Cek jika bukan bulan pertama operasi sistem
        // Untuk sistem baru, bulan pertama selalu bisa proceed
        $firstMonthEver = MonthlyClosing::orderBy('periode_tahun')
            ->orderBy('periode_bulan')
            ->first();
            
        if ($firstMonthEver) {
            // Sudah ada data monthly closing sebelumnya
            // Cek apakah bulan sebelumnya sudah closed
            $previousClosing = MonthlyClosing::forPeriod($previousYear, $previousMonth)->first();
            $previousMonthClosed = $previousClosing && $previousClosing->status === 'closed';
        }
        // Jika belum ada data monthly closing sama sekali, biarkan true (sistem baru)

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

        $giroCount = GiroTransaction::whereBetween('tanggal_giro', [$startDate, $endDate])
            ->whereIn('status', ['draft', 'pending_approval'])
            ->count();

        // Assuming giro transactions exist
        $giroCount = $giroCount; // You can add this when giro transactions are implemented

        return [
            'cash_count' => $cashCount,
            'bank_count' => $bankCount,
            'giro_count' => $giroCount,
            'total_count' => $cashCount + $bankCount + $giroCount
        ];
    }

    private function getCashReportingValidation($year, $month)
    {
        $startDate = Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();

        // Check cash transactions yang belum ready untuk laporan
        $pendingCashReporting = CashTransaction::whereBetween('tanggal_transaksi', [$startDate, $endDate])
            ->whereIn('status', ['draft']) // Hanya draft yang menghalangi
            ->count();
        
        $pendingBankReporting = BankTransaction::whereBetween('tanggal_transaksi', [$startDate, $endDate])
            ->whereIn('status', ['draft']) // Hanya draft yang menghalangi
            ->count();

        $pendingGiroReporting = GiroTransaction::whereBetween('tanggal_giro', [$startDate, $endDate])
            ->whereIn('status', ['draft']) // Hanya draft yang menghalangi
            ->count();
            
        // Check final transactions untuk laporan kas
        $finalCashTransactions = CashTransaction::whereBetween('tanggal_transaksi', [$startDate, $endDate])
            ->whereIn('status', ['approved', 'posted', 'completed'])
            ->count();
            
        $finalBankTransactions = BankTransaction::whereBetween('tanggal_transaksi', [$startDate, $endDate])
            ->whereIn('status', ['approved', 'posted', 'completed'])
            ->count();

        $finalGiroTransactions = GiroTransaction::whereBetween('tanggal_giro', [$startDate, $endDate])
            ->whereIn('status', ['approved', 'posted', 'completed'])
            ->count();

        return [
            'pending_cash_reporting' => $pendingCashReporting,
            'pending_bank_reporting' => $pendingBankReporting,
            'pending_giro_reporting' => $pendingGiroReporting,
            'final_cash_transactions' => $finalCashTransactions,
            'final_bank_transactions' => $finalBankTransactions,
            'final_giro_transactions' => $finalGiroTransactions,
            'total_pending_reporting' => $pendingCashReporting + $pendingBankReporting + $pendingGiroReporting,
            'can_close_for_cash_reporting' => ($pendingCashReporting + $pendingBankReporting + $pendingGiroReporting) === 0
        ];
    }

    /**
     * Get validation specifically for cash reporting (non-journal)
     */
    private function getCashOnlyValidation($year, $month)
    {
        $startDate = Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();

        // Cash transactions yang hanya untuk laporan (tidak masuk jurnal)
        $cashReportingOnly = CashTransaction::whereBetween('tanggal_transaksi', [$startDate, $endDate])
            ->where('status', 'draft')
            ->where('will_post_to_journal', false)
            ->count();
        
        $bankReportingOnly = BankTransaction::whereBetween('tanggal_transaksi', [$startDate, $endDate])
            ->where('status', 'draft')
            ->where('will_post_to_journal', false)
            ->count();

        $giroReportingOnly = GiroTransaction::whereBetween('tanggal_giro', [$startDate, $endDate])
            ->where('status', 'draft')
            ->where('will_post_to_journal', false)
            ->count();

        // Cash transactions yang akan masuk jurnal (masih draft)
        $cashPendingJournal = CashTransaction::whereBetween('tanggal_transaksi', [$startDate, $endDate])
            ->where('status', 'draft')
            ->where('will_post_to_journal', true)
            ->count();
            
        $bankPendingJournal = BankTransaction::whereBetween('tanggal_transaksi', [$startDate, $endDate])
            ->where('status', 'draft')
            ->where('will_post_to_journal', true)
            ->count();

        $giroPendingJournal = GiroTransaction::whereBetween('tanggal_giro', [$startDate, $endDate])
            ->where('status', 'draft')
            ->where('will_post_to_journal', true)
            ->count();

        return [
            'cash_reporting_only' => $cashReportingOnly,
            'bank_reporting_only' => $bankReportingOnly,
            'giro_reporting_only' => $giroReportingOnly,
            'cash_pending_journal' => $cashPendingJournal,
            'bank_pending_journal' => $bankPendingJournal,
            'giro_pending_journal' => $giroPendingJournal,
            'total_reporting_only' => $cashReportingOnly + $bankReportingOnly + $giroReportingOnly,
            'total_pending_journal' => $cashPendingJournal + $bankPendingJournal + $giroPendingJournal,
            'can_close_cash_reporting' => true, // Cash reporting selalu bisa di-close
            'blocks_journal_posting' => ($cashPendingJournal + $bankPendingJournal + $giroPendingJournal) > 0
        ];
    }
}
