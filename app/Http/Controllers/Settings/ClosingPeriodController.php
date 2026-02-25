<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Akuntansi\ClosingPeriod;
use App\Models\Akuntansi\ClosingPeriodSetting;
use App\Models\Akuntansi\PeriodTemplate;
use App\Models\Akuntansi\Jurnal;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class ClosingPeriodController extends Controller
{
    /**
     * Display a listing of closing periods
     */
    public function index(Request $request)
    {
        $query = ClosingPeriod::with(['softClosedBy', 'hardClosedBy'])
            ->orderBy('period_start', 'desc');

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by year
        if ($request->filled('year')) {
            $query->whereYear('period_start', $request->year);
        }

        $periods = $query->paginate(10);

        // Get available years for filter
        $years = ClosingPeriod::selectRaw('YEAR(period_start) as year')
            ->distinct()
            ->orderBy('year', 'desc')
            ->pluck('year');

        return Inertia::render('settings/closing-periods/index', [
            'periods' => $periods,
            'years' => $years,
            'filters' => $request->only(['status', 'year']),
        ]);
    }

    /**
     * Show form for creating new period
     */
    public function create()
    {
        $templates = PeriodTemplate::active()->get();
        
        // Get last period untuk suggest periode berikutnya
        $lastPeriod = ClosingPeriod::orderBy('period_end', 'desc')->first();
        
        $suggestedStart = $lastPeriod 
            ? Carbon::parse($lastPeriod->period_end)->addDay()
            : Carbon::now()->startOfMonth();
            
        $suggestedEnd = $suggestedStart->copy()->endOfMonth();

        return Inertia::render('settings/closing-periods/create', [
            'templates' => $templates,
            'suggestedStart' => $suggestedStart->format('Y-m-d'),
            'suggestedEnd' => $suggestedEnd->format('Y-m-d'),
        ]);
    }

    /**
     * Store a newly created period
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'period_name' => 'required|string|max:255',
            'period_type' => 'required|in:daily,weekly,monthly,quarterly,yearly,custom',
            'period_start' => 'required|date',
            'period_end' => 'required|date|after_or_equal:period_start',
            'template_id' => 'nullable|exists:period_templates,id',
            'notes' => 'nullable|string',
        ]);

        // Check overlap dengan periode lain
        $overlap = ClosingPeriod::where(function($query) use ($validated) {
            $query->whereBetween('period_start', [$validated['period_start'], $validated['period_end']])
                  ->orWhereBetween('period_end', [$validated['period_start'], $validated['period_end']])
                  ->orWhere(function($q) use ($validated) {
                      $q->where('period_start', '<=', $validated['period_start'])
                        ->where('period_end', '>=', $validated['period_end']);
                  });
        })->exists();

        if ($overlap) {
            return back()->withErrors([
                'period_start' => 'Periode ini overlap dengan periode yang sudah ada'
            ]);
        }

        // Generate period code
        $periodCode = $this->generatePeriodCode($validated['period_start'], $validated['period_type']);

        // Get template or use defaults
        $template = null;
        if ($validated['template_id']) {
            $template = PeriodTemplate::find($validated['template_id']);
        }
        
        $cutoffDays = $template ? $template->cutoff_days : ClosingPeriodSetting::get('default_cutoff_days', 5);
        $hardCloseDays = $template ? $template->hard_close_days : ClosingPeriodSetting::get('hard_close_days', 15);

        // Calculate dates
        $periodEnd = Carbon::parse($validated['period_end']);
        $cutoffDate = $periodEnd->copy()->addDays($cutoffDays);
        $hardCloseDate = $hardCloseDays ? $cutoffDate->copy()->addDays($hardCloseDays) : null;

        $period = ClosingPeriod::create([
            'period_code' => $periodCode,
            'period_name' => $validated['period_name'],
            'period_type' => $validated['period_type'],
            'period_start' => $validated['period_start'],
            'period_end' => $validated['period_end'],
            'cutoff_date' => $cutoffDate,
            'hard_close_date' => $hardCloseDate,
            'status' => 'open',
            'notes' => $validated['notes'] ?? null,
        ]);

        return redirect()->route('settings.closing-periods.show', $period->id)
            ->with('message', 'Periode berhasil dibuat');
    }

    /**
     * Display the specified period
     */
    public function show(ClosingPeriod $closingPeriod)
    {
        $closingPeriod->load([
            'softClosedBy',
            'hardClosedBy',
            'reopenedBy',
            'revisionLogs' => function($query) {
                $query->with(['revisedBy', 'approvedBy'])
                      ->orderBy('revised_at', 'desc')
                      ->limit(10);
            },
        ]);

        // Get statistics
        $stats = [
            'total_journals' => Jurnal::whereBetween('tanggal_transaksi', [
                $closingPeriod->period_start,
                $closingPeriod->period_end
            ])->count(),
            
            'posted_journals' => Jurnal::whereBetween('tanggal_transaksi', [
                $closingPeriod->period_start,
                $closingPeriod->period_end
            ])->where('status', 'posted')->count(),
            
            'draft_journals' => Jurnal::whereBetween('tanggal_transaksi', [
                $closingPeriod->period_start,
                $closingPeriod->period_end
            ])->where('status', 'draft')->count(),
            
            'total_revisions' => $closingPeriod->revisionLogs()->count(),
            'pending_approvals' => $closingPeriod->revisionLogs()->pending()->count(),
        ];

        return Inertia::render('settings/closing-periods/show', [
            'period' => $closingPeriod,
            'stats' => $stats,
        ]);
    }

    /**
     * Show form for editing period
     */
    public function edit(ClosingPeriod $closingPeriod)
    {
        // Only allow edit if period is still OPEN
        if ($closingPeriod->status !== 'open') {
            return back()->withErrors([
                'message' => 'Hanya periode dengan status OPEN yang bisa diedit'
            ]);
        }

        $templates = PeriodTemplate::active()->get();

        return Inertia::render('settings/closing-periods/edit', [
            'period' => $closingPeriod,
            'templates' => $templates,
        ]);
    }

    /**
     * Update the specified period
     */
    public function update(Request $request, ClosingPeriod $closingPeriod)
    {
        // Only allow edit if period is still OPEN
        if ($closingPeriod->status !== 'open') {
            return back()->withErrors([
                'message' => 'Hanya periode dengan status OPEN yang bisa diedit'
            ]);
        }

        $validated = $request->validate([
            'period_name' => 'required|string|max:255',
            'period_type' => 'required|in:daily,weekly,monthly,quarterly,yearly,custom',
            'period_start' => 'required|date',
            'period_end' => 'required|date|after_or_equal:period_start',
            'template_id' => 'nullable|exists:period_templates,id',
            'notes' => 'nullable|string',
        ]);

        // Check overlap dengan periode lain (kecuali periode ini sendiri)
        $overlap = ClosingPeriod::where('id', '!=', $closingPeriod->id)
            ->where(function($query) use ($validated) {
                $query->whereBetween('period_start', [$validated['period_start'], $validated['period_end']])
                      ->orWhereBetween('period_end', [$validated['period_start'], $validated['period_end']])
                      ->orWhere(function($q) use ($validated) {
                          $q->where('period_start', '<=', $validated['period_start'])
                            ->where('period_end', '>=', $validated['period_end']);
                      });
            })->exists();

        if ($overlap) {
            return back()->withErrors([
                'period_start' => 'Periode ini overlap dengan periode yang sudah ada'
            ]);
        }

        // Get template if provided
        $template = null;
        if ($validated['template_id']) {
            $template = PeriodTemplate::find($validated['template_id']);
        }

        // Calculate dates based on template or default
        $periodStart = Carbon::parse($validated['period_start']);
        $periodEnd = Carbon::parse($validated['period_end']);
        
        $cutoffDays = $template ? $template->cutoff_days : ClosingPeriodSetting::get('cutoff_days_before_end', 5);
        $hardCloseDays = $template ? $template->hard_close_days : ClosingPeriodSetting::get('hard_close_days_after_cutoff', 10);
        
        $cutoffDate = $periodEnd->copy()->subDays($cutoffDays);
        $hardCloseDate = $cutoffDate->copy()->addDays($hardCloseDays);

        // Update period
        $closingPeriod->update([
            'period_name' => $validated['period_name'],
            'period_type' => $validated['period_type'],
            'period_start' => $periodStart,
            'period_end' => $periodEnd,
            'cutoff_date' => $cutoffDate,
            'hard_close_date' => $hardCloseDate,
            'notes' => $validated['notes'] ?? null,
        ]);

        return redirect()->route('settings.closing-periods.show', $closingPeriod->id)
            ->with('message', 'Periode berhasil diupdate');
    }

    /**
     * Soft close periode
     */
    public function softClose(ClosingPeriod $closingPeriod)
    {
        // Check if already closed
        if ($closingPeriod->status !== 'open') {
            return back()->withErrors(['message' => 'Periode sudah ditutup']);
        }

        // Check if module enabled
        if (!ClosingPeriodSetting::isModuleEnabled()) {
            return back()->withErrors(['message' => 'Fitur tutup buku belum diaktifkan']);
        }

        // Check if there are draft journals
        $draftCount = Jurnal::whereBetween('tanggal_transaksi', [
            $closingPeriod->period_start,
            $closingPeriod->period_end
        ])->where('status', 'draft')->count();

        if ($draftCount > 0) {
            return back()->withErrors([
                'message' => "Masih ada {$draftCount} jurnal dengan status draft. Posting semua jurnal terlebih dahulu."
            ]);
        }

        // Soft close the period
        $closingPeriod->update([
            'status' => 'soft_close',
            'soft_closed_by' => Auth::id(),
            'soft_closed_at' => now(),
        ]);

        // Send notification - system will auto-filter based on each role's notification_settings
        $notificationService = new NotificationService();
        $notificationService->sendToAllRoles(
            NotificationService::TYPE_CLOSING_PERIOD,
            [
                'title' => 'Periode Soft Close',
                'message' => "Periode {$closingPeriod->period_name} ({$closingPeriod->period_code}) telah di-soft close oleh " . Auth::user()->name,
                'action_url' => route('settings.closing-periods.show', $closingPeriod->id),
                'data' => [
                    'period_id' => $closingPeriod->id,
                    'action' => 'soft_close'
                ]
            ]
        );

        return back()->with('message', 'Periode berhasil di-soft close');
    }

    /**
     * Hard close periode
     */
    public function hardClose(ClosingPeriod $closingPeriod)
    {
        // Check if soft closed first
        if ($closingPeriod->status !== 'soft_close') {
            return back()->withErrors(['message' => 'Periode harus di-soft close terlebih dahulu']);
        }

        // Check if mode supports hard close
        $mode = ClosingPeriodSetting::getClosingMode();
        if ($mode !== 'soft_and_hard') {
            return back()->withErrors(['message' => 'Mode hard close belum diaktifkan di settings']);
        }

        // Check if there are pending approvals
        $pendingCount = $closingPeriod->revisionLogs()->pending()->count();
        if ($pendingCount > 0) {
            return back()->withErrors([
                'message' => "Masih ada {$pendingCount} revisi yang menunggu approval"
            ]);
        }

        // Hard close the period
        $closingPeriod->update([
            'status' => 'hard_close',
            'hard_closed_by' => Auth::id(),
            'hard_closed_at' => now(),
        ]);

        // Send notification - system will auto-filter based on each role's notification_settings
        $notificationService = new NotificationService();
        $notificationService->sendToAllRoles(
            NotificationService::TYPE_CLOSING_PERIOD,
            [
                'title' => 'Periode Hard Close',
                'message' => "Periode {$closingPeriod->period_name} ({$closingPeriod->period_code}) telah di-hard close oleh " . Auth::user()->name . ". Transaksi tidak dapat diubah lagi.",
                'action_url' => route('settings.closing-periods.show', $closingPeriod->id),
                'data' => [
                    'period_id' => $closingPeriod->id,
                    'action' => 'hard_close'
                ]
            ]
        );

        return back()->with('message', 'Periode berhasil di-hard close');
    }

    /**
     * Reopen periode
     */
    public function reopen(Request $request, ClosingPeriod $closingPeriod)
    {
        $validated = $request->validate([
            'reason' => 'required|string|min:10',
        ]);

        // Check if hard closed and reopen is allowed
        if ($closingPeriod->status === 'hard_close') {
            $allowReopen = ClosingPeriodSetting::get('allow_reopen_hard_close', false);
            if (!$allowReopen) {
                return back()->withErrors([
                    'message' => 'Reopen hard close tidak diizinkan. Aktifkan di settings jika diperlukan.'
                ]);
            }
        }

        // Reopen the period
        $closingPeriod->update([
            'status' => 'open',
            'reopened_by' => Auth::id(),
            'reopened_at' => now(),
            'reopen_reason' => $validated['reason'],
        ]);

        // Send notification - system will auto-filter based on each role's notification_settings
        $notificationService = new NotificationService();
        $notificationService->sendToAllRoles(
            NotificationService::TYPE_CLOSING_PERIOD,
            [
                'title' => 'Periode Dibuka Kembali',
                'message' => "Periode {$closingPeriod->period_name} ({$closingPeriod->period_code}) telah dibuka kembali oleh " . Auth::user()->name . ". Alasan: {$validated['reason']}",
                'action_url' => route('settings.closing-periods.show', $closingPeriod->id),
                'data' => [
                    'period_id' => $closingPeriod->id,
                    'action' => 'reopen',
                    'reason' => $validated['reason']
                ]
            ]
        );

        return back()->with('message', 'Periode berhasil dibuka kembali');
    }

    /**
     * Generate period code
     */
    protected function generatePeriodCode($date, $type): string
    {
        $carbon = Carbon::parse($date);
        
        return match($type) {
            'monthly' => $carbon->format('Y-m'),
            'quarterly' => $carbon->format('Y') . '-Q' . $carbon->quarter,
            'yearly' => $carbon->format('Y'),
            'weekly' => $carbon->format('Y-W'),
            default => $carbon->format('Y-m-d'),
        };
    }

    /**
     * Check if date is in closed period
     */
    public static function checkDateInClosedPeriod($date, $mode = 'soft_close')
    {
        $checkDate = is_string($date) ? Carbon::parse($date) : $date;
        
        $query = ClosingPeriod::where('period_start', '<=', $checkDate)
            ->where('period_end', '>=', $checkDate);
            
        if ($mode === 'hard_close') {
            $query->where('status', 'hard_close');
        } else {
            $query->whereIn('status', ['soft_close', 'hard_close']);
        }
        
        return $query->first();
    }
}
