<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Akuntansi\JournalRevisionLog;
use App\Models\Akuntansi\Jurnal;
use App\Models\Akuntansi\ClosingPeriod;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class RevisionApprovalController extends Controller
{
    /**
     * Display a listing of pending revisions
     */
    public function index(Request $request)
    {
        $query = JournalRevisionLog::with([
            'closingPeriod',
            'revisedBy',
            'approvedBy'
        ])
        ->orderBy('revised_at', 'desc');

        // Filter by status
        if ($request->filled('status')) {
            $query->where('approval_status', $request->status);
        } else {
            // Default: show pending only
            $query->where('approval_status', 'pending');
        }

        // Filter by period
        if ($request->filled('period_id')) {
            $query->where('closing_period_id', $request->period_id);
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->whereDate('revised_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('revised_at', '<=', $request->date_to);
        }

        $revisions = $query->paginate(10);

        // Get statistics
        $stats = [
            'pending' => JournalRevisionLog::pending()->count(),
            'approved' => JournalRevisionLog::approved()->count(),
            'rejected' => JournalRevisionLog::rejected()->count(),
        ];

        // Get detailed statistics
        $today = now()->startOfDay();
        $thisWeek = now()->startOfWeek();
        $thisMonth = now()->startOfMonth();

        $statistics = [
            'pending_count' => JournalRevisionLog::pending()->count(),
            'today_count' => JournalRevisionLog::pending()
                ->whereDate('revised_at', $today)
                ->count(),
            'week_count' => JournalRevisionLog::pending()
                ->where('revised_at', '>=', $thisWeek)
                ->count(),
            'month_count' => JournalRevisionLog::pending()
                ->where('revised_at', '>=', $thisMonth)
                ->count(),
            'high_value_count' => JournalRevisionLog::pending()
                ->where('impact_amount', '>=', 10000000) // > 10 juta
                ->count(),
        ];

        // Get all periods for filter
        $periods = ClosingPeriod::orderBy('period_start', 'desc')->get();

        return Inertia::render('settings/revision-approvals/index', [
            'revisions' => $revisions,
            'periods' => $periods,
            'stats' => $stats,
            'statistics' => $statistics,
            'filters' => $request->only(['status', 'period_id', 'date_from', 'date_to']),
        ]);
    }

    /**
     * Show detail revision
     */
    public function show(JournalRevisionLog $revisionLog)
    {
        $revisionLog->load([
            'closingPeriod',
            'revisedBy',
            'approvedBy'
        ]);

        // Get journal data
        $journal = Jurnal::with(['detailJurnal.daftarAkun'])
            ->find($revisionLog->journal_id);

        return Inertia::render('settings/revision-approvals/show', [
            'revision' => $revisionLog,
            'journal' => $journal,
        ]);
    }

    /**
     * Approve revision
     */
    public function approve(Request $request, JournalRevisionLog $revisionLog)
    {
        if ($revisionLog->approval_status !== 'pending') {
            return back()->withErrors(['message' => 'Revisi ini sudah diproses']);
        }

        $validated = $request->validate([
            'notes' => 'nullable|string',
        ]);

        DB::transaction(function () use ($revisionLog, $validated) {
            // Update approval status
            $revisionLog->update([
                'approval_status' => 'approved',
                'approved_by' => Auth::id(),
                'approved_at' => now(),
                'approval_notes' => $validated['notes'] ?? null,
            ]);

            // Apply changes to journal
            $this->applyRevision($revisionLog);
        });

        // Send notification to requester
        $revisionLog->load('revisedBy');
        if ($revisionLog->revisedBy) {
            $notificationService = new NotificationService();
            $notificationService->sendToUser(
                $revisionLog->revised_by,
                NotificationService::TYPE_REVISION_APPROVAL,
                [
                    'title' => 'Revisi Disetujui',
                    'message' => "Permintaan revisi Anda untuk jurnal telah disetujui oleh " . Auth::user()->name,
                    'action_url' => route('settings.revision-approvals.show', $revisionLog->id),
                    'data' => [
                        'revision_id' => $revisionLog->id,
                        'journal_id' => $revisionLog->journal_id,
                        'action' => 'approved',
                        'approver' => Auth::user()->name
                    ]
                ]
            );
        }

        return back()->with('message', 'Revisi berhasil disetujui');
    }

    /**
     * Reject revision
     */
    public function reject(Request $request, JournalRevisionLog $revisionLog)
    {
        if ($revisionLog->approval_status !== 'pending') {
            return back()->withErrors(['message' => 'Revisi ini sudah diproses']);
        }

        $validated = $request->validate([
            'notes' => 'required|string|min:10',
        ]);

        $revisionLog->update([
            'approval_status' => 'rejected',
            'approved_by' => Auth::id(),
            'approved_at' => now(),
            'approval_notes' => $validated['notes'],
        ]);

        // Send notification to requester
        $revisionLog->load('revisedBy');
        if ($revisionLog->revisedBy) {
            $notificationService = new NotificationService();
            $notificationService->sendToUser(
                $revisionLog->revised_by,
                NotificationService::TYPE_REVISION_APPROVAL,
                [
                    'title' => 'Revisi Ditolak',
                    'message' => "Permintaan revisi Anda untuk jurnal telah ditolak oleh " . Auth::user()->name . ". Alasan: {$validated['notes']}",
                    'action_url' => route('settings.revision-approvals.show', $revisionLog->id),
                    'data' => [
                        'revision_id' => $revisionLog->id,
                        'journal_id' => $revisionLog->journal_id,
                        'action' => 'rejected',
                        'approver' => Auth::user()->name,
                        'reason' => $validated['notes']
                    ]
                ]
            );
        }

        return back()->with('message', 'Revisi ditolak');
    }

    /**
     * Bulk approve multiple revisions
     */
    public function bulkApprove(Request $request)
    {
        $validated = $request->validate([
            'revision_ids' => 'required|array',
            'revision_ids.*' => 'exists:journal_revision_logs,id',
            'notes' => 'nullable|string',
        ]);

        $count = 0;
        DB::transaction(function () use ($validated, &$count) {
            $revisions = JournalRevisionLog::whereIn('id', $validated['revision_ids'])
                ->where('approval_status', 'pending')
                ->get();

            foreach ($revisions as $revision) {
                $revision->update([
                    'approval_status' => 'approved',
                    'approved_by' => Auth::id(),
                    'approved_at' => now(),
                    'approval_notes' => $validated['notes'] ?? null,
                ]);

                $this->applyRevision($revision);
                $count++;
            }
        });

        return back()->with('message', "{$count} revisi berhasil disetujui");
    }

    /**
     * Apply revision changes to journal
     */
    protected function applyRevision(JournalRevisionLog $revisionLog)
    {
        $journal = Jurnal::find($revisionLog->journal_id);
        
        if (!$journal) {
            return;
        }

        // Apply changes based on action
        switch ($revisionLog->action) {
            case 'update':
                if ($revisionLog->new_data) {
                    $journal->update($revisionLog->new_data);
                }
                break;
                
            case 'delete':
                $journal->delete();
                break;
                
            case 'create':
                // Already created, just mark as approved
                break;
        }
    }

    /**
     * Get summary statistics for dashboard
     */
    public function statistics()
    {
        $today = now()->startOfDay();
        $thisWeek = now()->startOfWeek();
        $thisMonth = now()->startOfMonth();

        return response()->json([
            'pending_count' => JournalRevisionLog::pending()->count(),
            'today_count' => JournalRevisionLog::pending()
                ->whereDate('revised_at', $today)
                ->count(),
            'week_count' => JournalRevisionLog::pending()
                ->where('revised_at', '>=', $thisWeek)
                ->count(),
            'month_count' => JournalRevisionLog::pending()
                ->where('revised_at', '>=', $thisMonth)
                ->count(),
            'high_value_count' => JournalRevisionLog::pending()
                ->where('impact_amount', '>=', 10000000) // > 10 juta
                ->count(),
        ]);
    }
}
