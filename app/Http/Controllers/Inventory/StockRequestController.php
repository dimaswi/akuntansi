<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Inventory\StockRequest;
use App\Models\Inventory\Item;
use App\Models\Inventory\Department;
use App\Services\Inventory\StockRequestService;
use App\Services\Inventory\ItemStockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class StockRequestController extends Controller
{
    public function __construct(
        protected StockRequestService $stockRequestService,
        protected ItemStockService $itemStockService
    ) {}

    /**
     * Display a listing of Permintaan Stok
     */
    public function index(Request $request)
    {
        $query = StockRequest::with(['department', 'requestedByUser', 'approvedByUser', 'items'])
            ->orderBy('created_at', 'desc');
        
        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        
        // Filter by department
        if ($request->filled('department_id')) {
            $query->where('department_id', $request->department_id);
        }
        
        // Filter by priority
        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }
        
        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('request_number', 'like', "%{$search}%")
                  ->orWhere('notes', 'like', "%{$search}%");
            });
        }
        
        $stockRequests = $query->paginate(15)->through(function($request) {
            return [
                'id' => $request->id,
                'request_number' => $request->request_number,
                'request_date' => $request->request_date->format('Y-m-d'),
                'department' => [
                    'id' => $request->department->id,
                    'name' => $request->department->name,
                ],
                'requested_by' => [
                    'id' => $request->requestedByUser->id,
                    'name' => $request->requestedByUser->name,
                ],
                'status' => $request->status,
                'priority' => $request->priority,
                'total_items' => $request->items->count(),
                'total_quantity_requested' => $request->items->sum('quantity_requested'),
                'total_quantity_approved' => $request->items->sum('quantity_approved'),
                'can_edit' => $request->canEdit(),
                'can_submit' => $request->canSubmit(),
                'can_approve' => $request->canApprove(),
                'can_complete' => $request->canComplete(),
            ];
        });
                
        $departments = Department::orderBy('name')->get();
        
        return Inertia::render('inventory/stock-requests/index', [
            'stockRequests' => $stockRequests,
            'departments' => $departments,
            'filters' => $request->only(['status', 'department_id', 'priority', 'search']),
        ]);
    }

    /**
     * Show the form for creating a new Permintaan Stok
     */
    public function create()
    {
        $departments = Department::orderBy('name')->get();
        $items = Item::orderBy('name')->get()->map(function($item) {
            $centralStock = $this->itemStockService->getCentralStock($item->id);
            return [
                'id' => $item->id,
                'code' => $item->code,
                'name' => $item->name,
                'unit_of_measure' => $item->unit,
                'reorder_level' => $item->reorder_level,
                'safety_stock' => $item->safety_stock,
                'central_stock' => $centralStock ? [
                    'quantity_on_hand' => $centralStock->quantity_on_hand,
                    'available_quantity' => $centralStock->available_quantity,
                    'average_unit_cost' => $centralStock->average_unit_cost,
                ] : null,
            ];
        });
        
        return Inertia::render('inventory/stock-requests/create', [
            'departments' => $departments,
            'items' => $items,
        ]);
    }

    /**
     * Store a newly created Permintaan Stok
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'department_id' => 'required|exists:departments,id',
            'priority' => 'required|in:low,normal,high,urgent',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:items,id',
            'items.*.quantity_requested' => 'required|numeric|min:0.01',
            'items.*.notes' => 'nullable|string',
        ]);
        
        $stockRequest = $this->stockRequestService->createDraft(
            departmentId: $validated['department_id'],
            requestedBy: Auth::id(),
            items: $validated['items'],
            priority: $validated['priority'],
            notes: $validated['notes'] ?? null
        );
        
        return redirect()
            ->route('stock-requests.show', $stockRequest)
            ->with('success', 'Permintaan Stok berhasil dibuat.');
    }

    /**
     * Display the specified Permintaan Stok
     */
    public function show(StockRequest $stockRequest)
    {
        $stockRequest->load([
            'department',
            'requestedByUser',
            'approvedByUser',
            'completedByUser',
            'items.item',
        ]);
        
        // Get current stock info for each item
        $items = $stockRequest->items->map(function($item) {
            $centralStock = $this->itemStockService->getCentralStock($item->item_id);
            return [
                'id' => $item->id,
                'item' => [
                    'id' => $item->item->id,
                    'code' => $item->item->code,
                    'name' => $item->item->name,
                    'unit_of_measure' => $item->item->unit,
                ],
                'quantity_requested' => $item->quantity_requested,
                'quantity_approved' => $item->quantity_approved,
                'quantity_issued' => $item->quantity_issued,
                'unit_cost' => $item->unit_cost,
                'total_cost' => $item->total_cost,
                'notes' => $item->notes,
                'central_stock' => $centralStock ? [
                    'quantity_on_hand' => $centralStock->quantity_on_hand,
                    'available_quantity' => $centralStock->available_quantity,
                    'average_unit_cost' => $centralStock->average_unit_cost,
                ] : null,
            ];
        });
        
        return Inertia::render('inventory/stock-requests/show', [
            'stockRequest' => [
                'id' => $stockRequest->id,
                'request_number' => $stockRequest->request_number,
                'request_date' => $stockRequest->request_date->format('Y-m-d'),
                'department' => [
                    'id' => $stockRequest->department->id,
                    'name' => $stockRequest->department->name,
                ],
                'requested_by' => [
                    'id' => $stockRequest->requestedByUser->id,
                    'name' => $stockRequest->requestedByUser->name,
                ],
                'approved_by' => $stockRequest->approvedByUser ? [
                    'id' => $stockRequest->approvedByUser->id,
                    'name' => $stockRequest->approvedByUser->name,
                ] : null,
                'completed_by' => $stockRequest->completedByUser ? [
                    'id' => $stockRequest->completedByUser->id,
                    'name' => $stockRequest->completedByUser->name,
                ] : null,
                'status' => $stockRequest->status,
                'priority' => $stockRequest->priority,
                'notes' => $stockRequest->notes,
                'submitted_at' => $stockRequest->submitted_at?->format('Y-m-d H:i'),
                'approved_at' => $stockRequest->approved_at?->format('Y-m-d H:i'),
                'completed_at' => $stockRequest->completed_at?->format('Y-m-d H:i'),
                'can_edit' => $stockRequest->canEdit(),
                'can_submit' => $stockRequest->canSubmit(),
                'can_approve' => $stockRequest->canApprove(),
                'can_complete' => $stockRequest->canComplete(),
                'can_delete' => $stockRequest->canEdit(),
                'can_cancel' => $stockRequest->canCancel(),
            ],
            'items' => $items,
        ]);
    }

    /**
     * Show the form for editing the Permintaan Stok
     */
    public function edit(StockRequest $stockRequest)
    {
        if (!$stockRequest->canEdit()) {
            return redirect()
                ->route('stock-requests.show', $stockRequest)
                ->with('error', 'Permintaan Stok tidak bisa diedit.');
        }
        
        $stockRequest->load('items.item');
        
        $departments = Department::orderBy('name')->get();
        $items = Item::orderBy('name')->get()->map(function($item) {
            $centralStock = $this->itemStockService->getCentralStock($item->id);
            return [
                'id' => $item->id,
                'code' => $item->code,
                'name' => $item->name,
                'unit_of_measure' => $item->unit,
                'reorder_level' => $item->reorder_level,
                'safety_stock' => $item->safety_stock,
                'central_stock' => $centralStock ? [
                    'quantity_on_hand' => $centralStock->quantity_on_hand,
                    'available_quantity' => $centralStock->available_quantity,
                    'average_unit_cost' => $centralStock->average_unit_cost,
                ] : null,
            ];
        });
        
        return Inertia::render('inventory/stock-requests/edit', [
            'stockRequest' => [
                'id' => $stockRequest->id,
                'request_number' => $stockRequest->request_number,
                'request_date' => $stockRequest->request_date->format('Y-m-d'),
                'department_id' => $stockRequest->department_id,
                'priority' => $stockRequest->priority,
                'notes' => $stockRequest->notes,
                'items' => $stockRequest->items->map(function($item) {
                    return [
                        'id' => $item->id,
                        'item_id' => $item->item_id,
                        'quantity_requested' => $item->quantity_requested,
                        'notes' => $item->notes,
                        'item' => [
                            'id' => $item->item->id,
                            'code' => $item->item->code,
                            'name' => $item->item->name,
                            'unit_of_measure' => $item->item->unit,
                        ],
                    ];
                }),
            ],
            'departments' => $departments,
            'items' => $items,
        ]);
    }

    /**
     * Update the specified Permintaan Stok
     */
    public function update(Request $request, StockRequest $stockRequest)
    {
        if (!$stockRequest->canEdit()) {
            return redirect()
                ->route('stock-requests.show', $stockRequest)
                ->with('error', 'Permintaan Stok tidak bisa diedit.');
        }
        
        $validated = $request->validate([
            'priority' => 'required|in:low,normal,high,urgent',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:items,id',
            'items.*.quantity_requested' => 'required|numeric|min:0.01',
            'items.*.notes' => 'nullable|string',
        ]);
        
        $this->stockRequestService->updateDraft($stockRequest, $validated);
        
        return redirect()
            ->route('stock-requests.show', $stockRequest)
            ->with('success', 'Permintaan Stok berhasil diupdate.');
    }

    /**
     * Submit Permintaan Stok for approval
     */
    public function submit(StockRequest $stockRequest)
    {
        try {
            $this->stockRequestService->submit($stockRequest);
            
            return redirect()
                ->route('stock-requests.show', $stockRequest)
                ->with('success', 'Permintaan Stok berhasil disubmit untuk approval.');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Show approval form
     */
    public function approvalForm(StockRequest $stockRequest)
    {
        if (!$stockRequest->canApprove()) {
            return redirect()
                ->route('stock-requests.show', $stockRequest)
                ->with('error', 'Permintaan Stok tidak bisa diapprove.');
        }
        
        $stockRequest->load(['department', 'requestedByUser', 'items.item']);
        
        // Get current stock info for each item
        $items = $stockRequest->items->map(function($item) {
            $centralStock = $this->itemStockService->getCentralStock($item->item_id);
            return [
                'id' => $item->id,
                'item_id' => $item->item_id,
                'quantity_requested' => $item->quantity_requested,
                'quantity_approved' => $item->quantity_approved ?? 0,  // Include already approved qty
                'notes' => $item->notes,
                'item' => [
                    'id' => $item->item->id,
                    'code' => $item->item->code,
                    'name' => $item->item->name,
                    'unit_of_measure' => $item->item->unit,
                ],
                'central_stock' => $centralStock ? [
                    'quantity_on_hand' => $centralStock->quantity_on_hand,
                    'available_quantity' => $centralStock->available_quantity,
                    'average_unit_cost' => $centralStock->average_unit_cost,
                ] : null,
            ];
        });
        
        return Inertia::render('inventory/stock-requests/approve', [
            'stockRequest' => [
                'id' => $stockRequest->id,
                'request_number' => $stockRequest->request_number,
                'request_date' => $stockRequest->request_date->format('Y-m-d'),
                'department' => [
                    'id' => $stockRequest->department->id,
                    'name' => $stockRequest->department->name,
                ],
                'requested_by' => [
                    'id' => $stockRequest->requestedByUser->id,
                    'name' => $stockRequest->requestedByUser->name,
                ],
                'priority' => $stockRequest->priority,
                'notes' => $stockRequest->notes,
                'items' => $items,
            ],
        ]);
    }

    /**
     * Approve Permintaan Stok
     */
    public function approve(Request $request, StockRequest $stockRequest)
    {
        // Parse items if it's JSON string
        $items = $request->input('items');
        if (is_string($items)) {
            $items = json_decode($items, true);
        }
        
        $validated = $request->validate([
            'approval_notes' => 'nullable|string',
        ]);
        
        // Build approvals array [stock_request_item_id => quantity_approved]
        $approvals = [];
        foreach ($items as $item) {
            $approvals[$item['id']] = $item['quantity_approved'];  // id = stock_request_item id
        }
        
        try {
            $this->stockRequestService->approve(
                $stockRequest,
                Auth::id(),
                $approvals,
                $validated['approval_notes'] ?? null
            );
            
            return redirect()
                ->route('stock-requests.show', $stockRequest)
                ->with('success', 'Permintaan Stok berhasil diapprove.');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Reject Permintaan Stok
     */
    public function reject(Request $request, StockRequest $stockRequest)
    {
        $validated = $request->validate([
            'reason' => 'required|string',
        ]);
        
        try {
            $this->stockRequestService->reject(
                $stockRequest,
                Auth::id(),
                $validated['reason']
            );
            
            return redirect()
                ->route('stock-requests.show', $stockRequest)
                ->with('success', 'Permintaan Stok berhasil direject.');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Complete Permintaan Stok (issue items)
     */
    public function complete(Request $request, StockRequest $stockRequest)
    {
        $validated = $request->validate([
            'issued_quantities' => 'nullable|array',
            'issued_quantities.*' => 'nullable|numeric|min:0',
        ]);
        
        try {
            $this->stockRequestService->complete(
                $stockRequest,
                Auth::id(),
                $validated['issued_quantities'] ?? []
            );
            
            return redirect()
                ->route('stock-requests.show', $stockRequest)
                ->with('success', 'Permintaan Stok berhasil dicomplete. Barang sudah ditransfer ke department.');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Cancel Permintaan Stok
     */
    public function cancel(Request $request, StockRequest $stockRequest)
    {
        $validated = $request->validate([
            'reason' => 'required|string',
        ]);
        
        try {
            $this->stockRequestService->cancel(
                $stockRequest,
                Auth::id(),
                $validated['reason']
            );
            
            return redirect()
                ->route('stock-requests.show', $stockRequest)
                ->with('success', 'Permintaan Stok berhasil dicancel.');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Delete Permintaan Stok (draft only)
     */
    public function destroy(StockRequest $stockRequest)
    {
        if (!$stockRequest->canEdit()) {
            return back()->with('error', 'Permintaan Stok tidak bisa dihapus.');
        }
        
        $stockRequest->items()->delete();
        $stockRequest->delete();
        
        return redirect()
            ->route('stock-requests.index')
            ->with('success', 'Permintaan Stok berhasil dihapus.');
    }
}
