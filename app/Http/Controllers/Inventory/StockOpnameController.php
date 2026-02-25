<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Inventory\Department;
use App\Models\Inventory\StockOpname;
use App\Services\Inventory\StockOpnameService;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class StockOpnameController extends Controller
{
    protected StockOpnameService $stockOpnameService;
    protected NotificationService $notificationService;

    public function __construct(
        StockOpnameService $stockOpnameService,
        NotificationService $notificationService
    ) {
        $this->stockOpnameService = $stockOpnameService;
        $this->notificationService = $notificationService;
    }

    /**
     * Display a listing of stock opnames
     */
    public function index(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

         // Check if user has department assigned (for non-logistics users)
        if (!$user->hasRole(['logistik', 'super_admin']) && !$user->department_id) {
            return redirect()->back()
                ->with('error', 'Anda belum terdaftar di departemen manapun. Silahkan hubungi administrator untuk assign departemen.');
        }
        
        $query = StockOpname::with(['department', 'creator', 'approver']);
        
        // Department-level access control
        if (!$user->isLogistics()) {
            $query->where('department_id', $user->department_id);
        }
        
        // Filters
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('opname_number', 'like', "%{$search}%")
                  ->orWhereHas('department', function ($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%");
                  });
            });
        }
        
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        
        if ($request->filled('department_id') && $user->isLogistics()) {
            $query->where('department_id', $request->department_id);
        }
        
        $opnames = $query->orderBy('opname_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('perPage', 10));
        
        return Inertia::render('inventory/stock-opnames/index', [
            'opnames' => $opnames,
            'filters' => [
                'search' => $request->search,
                'status' => $request->status,
                'department_id' => $request->department_id,
                'perPage' => $request->get('perPage', 10),
            ],
            'departments' => $user->isLogistics() 
                ? Department::where('is_active', true)->orderBy('name')->get(['id', 'name'])
                : [],
            'isLogistics' => $user->isLogistics(),
        ]);
    }

    /**
     * Show the form for creating a new opname
     */
    public function create()
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        
        // Check if department already has opname for current month
        $hasMonthlyOpname = StockOpname::hasMonthlyOpname($user->department_id);
        
        if ($hasMonthlyOpname) {
            return redirect()
                ->route('stock-opnames.index')
                ->with('error', 'Department sudah melakukan stock opname bulan ini');
        }
        
        $departments = $user->isLogistics()
            ? Department::where('is_active', true)->orderBy('name')->get(['id', 'name'])
            : collect([['id' => $user->department_id, 'name' => $user->department->name]]);
        
        return Inertia::render('inventory/stock-opnames/create', [
            'departments' => $departments,
            'isLogistics' => $user->isLogistics(),
        ]);
    }

    /**
     * Store a newly created opname
     */
    public function store(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        
        $validated = $request->validate([
            'department_id' => 'required|exists:departments,id',
            'opname_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);
        
        // Validate department access
        if (!$user->isLogistics() && $validated['department_id'] != $user->department_id) {
            abort(403, 'Anda tidak memiliki akses ke department ini');
        }
        
        // Check if already has opname this month
        $date = \Carbon\Carbon::parse($validated['opname_date']);
        $hasMonthlyOpname = StockOpname::hasMonthlyOpname($validated['department_id'], $date);
        
        if ($hasMonthlyOpname) {
            return back()->with('error', 'Department sudah memiliki stock opname yang approved untuk bulan ini');
        }
        
        try {
            $opname = $this->stockOpnameService->create(
                $validated['department_id'],
                $validated['opname_date'],
                $user->id,
                $validated['notes'] ?? null
            );
            
            return redirect()
                ->route('stock-opnames.show', $opname)
                ->with('success', 'Stock Opname berhasil dibuat dengan nomor ' . $opname->opname_number);
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Display the specified opname
     */
    public function show(StockOpname $stockOpname)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        
        // Department-level access control
        if (!$user->isLogistics() && $stockOpname->department_id !== $user->department_id) {
            abort(403, 'Anda tidak memiliki akses ke stock opname ini');
        }
        
        $stockOpname->load(['department', 'items.item', 'creator', 'approver']);
        
        return Inertia::render('inventory/stock-opnames/show', [
            'opname' => $stockOpname,
            'isLogistics' => $user->isLogistics(),
            'isDepartmentHead' => $user->role && $user->role->name === 'department_head',
        ]);
    }

    /**
     * Update physical counts
     */
    public function updateCounts(Request $request, StockOpname $stockOpname)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        
        // Department-level access control
        if (!$user->isLogistics() && $stockOpname->department_id !== $user->department_id) {
            abort(403, 'Anda tidak memiliki akses ke stock opname ini');
        }
        
        if ($stockOpname->status !== 'draft') {
            return back()->with('error', 'Hanya opname dengan status draft yang dapat diupdate');
        }
        
        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|exists:stock_opname_items,id',
            'items.*.physical_quantity' => 'required|numeric|min:0',
            'items.*.notes' => 'nullable|string',
        ]);
        
        try {
            $this->stockOpnameService->updatePhysicalCounts($stockOpname, $validated['items']);
            
            return back()->with('success', 'Physical count berhasil diupdate');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Submit opname for approval
     */
    public function submit(StockOpname $stockOpname)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        
        // Department-level access control
        if (!$user->isLogistics() && $stockOpname->department_id !== $user->department_id) {
            abort(403, 'Anda tidak memiliki akses ke stock opname ini');
        }
        
        try {
            $this->stockOpnameService->submit($stockOpname);
            
            // Send notification to logistics and department head
            $this->notificationService->sendToRoles(
                NotificationService::TYPE_STOCK_OPNAME_SUBMITTED,
                ['logistics', 'department_head'],
                [
                    'title' => 'Stock Opname Baru untuk Approval',
                    'message' => "Stock Opname {$stockOpname->opname_number} dari {$stockOpname->department->name} menunggu persetujuan Anda.",
                    'action_url' => route('stock-opnames.show', $stockOpname->id),
                    'data' => [
                        'opname_id' => $stockOpname->id,
                        'opname_number' => $stockOpname->opname_number,
                        'department' => $stockOpname->department->name,
                        'total_variance' => $stockOpname->total_variance_value,
                    ]
                ]
            );
            
            return redirect()
                ->route('stock-opnames.show', $stockOpname)
                ->with('success', 'Stock Opname berhasil disubmit untuk approval');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Approve opname
     */
    public function approve(StockOpname $stockOpname)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        
        // Only logistics or department head can approve
        if (!$user->isLogistics() && (!$user->role || $user->role->name !== 'department_head')) {
            abort(403, 'Anda tidak memiliki akses untuk approve stock opname');
        }
        
        try {
            $this->stockOpnameService->approve($stockOpname, $user->id);
            
            // Send notification to department
            $this->notificationService->sendToDepartment(
                $stockOpname->department_id,
                NotificationService::TYPE_STOCK_OPNAME_APPROVED,
                [
                    'title' => 'Stock Opname Disetujui',
                    'message' => "Stock Opname {$stockOpname->opname_number} telah disetujui. Stock adjustment telah dibuat untuk variance.",
                    'action_url' => route('stock-opnames.show', $stockOpname->id),
                    'data' => [
                        'opname_id' => $stockOpname->id,
                        'opname_number' => $stockOpname->opname_number,
                        'approved_by' => $user->name,
                    ]
                ]
            );
            
            return redirect()
                ->route('stock-opnames.show', $stockOpname)
                ->with('success', 'Stock Opname berhasil diapprove dan adjustment telah dibuat');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Reject opname
     */
    public function reject(Request $request, StockOpname $stockOpname)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        
        // Only logistics or department head can reject
        if (!$user->isLogistics() && (!$user->role || $user->role->name !== 'department_head')) {
            abort(403, 'Anda tidak memiliki akses untuk reject stock opname');
        }
        
        $validated = $request->validate([
            'rejection_reason' => 'required|string|min:10',
        ]);
        
        try {
            $this->stockOpnameService->reject($stockOpname, $user->id, $validated['rejection_reason']);
            
            // Send notification to department
            $this->notificationService->sendToDepartment(
                $stockOpname->department_id,
                NotificationService::TYPE_STOCK_OPNAME_REJECTED,
                [
                    'title' => 'Stock Opname Ditolak',
                    'message' => "Stock Opname {$stockOpname->opname_number} ditolak. Alasan: {$validated['rejection_reason']}",
                    'action_url' => route('stock-opnames.show', $stockOpname->id),
                    'data' => [
                        'opname_id' => $stockOpname->id,
                        'opname_number' => $stockOpname->opname_number,
                        'rejected_by' => $user->name,
                        'rejection_reason' => $validated['rejection_reason'],
                    ]
                ]
            );
            
            return redirect()
                ->route('stock-opnames.show', $stockOpname)
                ->with('success', 'Stock Opname berhasil direject');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }
}
