<?php

namespace App\Http\Controllers;

use App\Models\Approval;
use App\Models\ApprovalRule;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class ApprovalController extends Controller
{
    /**
     * Display approval queue for current user
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        
        // Get approvals that current user can approve
        $query = Approval::with(['approvable', 'requestedBy'])
            ->where('status', 'pending');

        // Filter by approval types user can approve
        $approvalTypes = [];
        if ($user->can('approval.cash-transactions.approve')) {
            $approvalTypes[] = 'transaction';
        }
        if ($user->can('approval.journal-posting.approve')) {
            $approvalTypes[] = 'journal_posting';
        }
        if ($user->can('approval.monthly-closing.approve')) {
            $approvalTypes[] = 'monthly_closing';
        }

        if (!empty($approvalTypes)) {
            $query->whereIn('approval_type', $approvalTypes);
        } else {
            // User has no approval permissions, show empty
            $query->where('id', -1);
        }

        // Apply filters
        if ($request->filled('approval_type')) {
            $query->where('approval_type', $request->approval_type);
        }

        if ($request->filled('amount_min')) {
            $query->where('amount', '>=', $request->amount_min);
        }

        if ($request->filled('amount_max')) {
            $query->where('amount', '<=', $request->amount_max);
        }

        $approvals = $query->orderBy('expires_at', 'asc')
                          ->orderBy('created_at', 'asc')
                          ->paginate(20);

        // Get summary statistics
        $summary = [
            'pending_count' => Approval::pending()->whereIn('approval_type', $approvalTypes)->count(),
            'expired_count' => Approval::expired()->whereIn('approval_type', $approvalTypes)->count(),
            'my_approvals_today' => Approval::whereIn('approval_type', $approvalTypes)
                ->where('approved_by', $user->id)
                ->whereDate('approved_at', today())
                ->count(),
        ];

        return Inertia::render('approvals/index', [
            'approvals' => $approvals,
            'summary' => $summary,
            'filters' => $request->only(['approval_type', 'amount_min', 'amount_max']),
        ]);
    }

    /**
     * Show approval details
     */
    public function show(Approval $approval)
    {
        $approval->load(['approvable', 'requestedBy', 'approvedBy']);
        
        // Check if user can view this approval
        if (!$approval->canBeApprovedBy(auth()->user())) {
            abort(403, 'You do not have permission to view this approval.');
        }

        return Inertia::render('approvals/show', [
            'approval' => $approval,
        ]);
    }

    /**
     * Approve an approval request
     */
    public function approve(Request $request, Approval $approval)
    {
        $request->validate([
            'notes' => 'nullable|string|max:1000',
        ]);

        $user = auth()->user();
        
        if (!$approval->canBeApprovedBy($user)) {
            return back()->withErrors(['error' => 'You do not have permission to approve this request.']);
        }

        if (!$approval->isPending()) {
            return back()->withErrors(['error' => 'This approval request is no longer pending.']);
        }

        try {
            DB::transaction(function () use ($approval, $user, $request) {
                $approval->approve($user, $request->notes);
                
                // Update the underlying transaction status if it's a transaction approval
                if ($approval->approval_type === 'transaction') {
                    $approvable = $approval->approvable;
                    if ($approvable && method_exists($approvable, 'markAsApproved')) {
                        $approvable->markAsApproved();
                    }
                }
            });

            return redirect()->route('approvals.index')
                ->with('success', 'Approval request has been approved successfully.');
                
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to approve request: ' . $e->getMessage()]);
        }
    }

    /**
     * Reject an approval request
     */
    public function reject(Request $request, Approval $approval)
    {
        $request->validate([
            'reason' => 'required|string|max:1000',
        ]);

        $user = auth()->user();
        
        if (!$approval->canBeApprovedBy($user)) {
            return back()->withErrors(['error' => 'You do not have permission to reject this request.']);
        }

        if (!$approval->isPending()) {
            return back()->withErrors(['error' => 'This approval request is no longer pending.']);
        }

        try {
            DB::transaction(function () use ($approval, $user, $request) {
                $approval->reject($user, $request->reason);
                
                // Update the underlying transaction status if needed
                if ($approval->approval_type === 'transaction') {
                    $approvable = $approval->approvable;
                    if ($approvable && method_exists($approvable, 'markAsRejected')) {
                        $approvable->markAsRejected();
                    }
                }
            });

            return redirect()->route('approvals.index')
                ->with('success', 'Approval request has been rejected.');
                
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to reject request: ' . $e->getMessage()]);
        }
    }

    /**
     * Get approval notifications for current user
     */
    public function notifications()
    {
        $user = auth()->user();
        
        $approvals = Approval::pending()
            ->with(['approvable', 'requestedBy'])
            ->where(function ($query) use ($user) {
                // Approvals assigned to user or that user can approve
                $query->where('escalated_to', $user->id)
                      ->orWhere('requested_by', $user->id);
            })
            ->orderBy('expires_at', 'asc')
            ->limit(10)
            ->get();

        return response()->json([
            'approvals' => $approvals,
            'count' => $approvals->count(),
        ]);
    }
}
