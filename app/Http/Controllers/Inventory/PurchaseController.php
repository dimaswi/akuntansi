<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Repositories\Inventory\PurchaseRepositoryInterface;
use App\Models\Inventory\Purchase;
use App\Models\Inventory\PurchaseItem;
use App\Models\Inventory\Supplier;
use App\Models\Inventory\Department;
use App\Models\Inventory\Item;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PurchaseController extends Controller
{
    private $purchaseRepository;

    public function __construct(PurchaseRepositoryInterface $purchaseRepository)
    {
        $this->purchaseRepository = $purchaseRepository;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user()->load(['department', 'role']);
        $isLogistics = $user->isLogistics();
        
        $filters = $request->only([
            'search', 'status', 'department_id', 'supplier_id', 
            'date_from', 'date_to', 'perPage'
        ]);
        
        // Non-logistics users can only see their department's purchases
        if (!$isLogistics && $user->department_id) {
            $filters['department_id'] = $user->department_id;
        }

        $purchases = $this->purchaseRepository->paginate($filters);

        $statusOptions = collect(Purchase::getStatusOptions())->map(function ($label, $value) {
            return ['value' => $value, 'label' => $label];
        })->values();

        return Inertia::render('inventory/purchases/index', [
            'purchases' => $purchases,
            'filters' => $filters,
            'departments' => Department::select('id', 'name')->where('is_active', true)->get(),
            'suppliers' => Supplier::select('id', 'name')->where('is_active', true)->get(),
            'statusOptions' => $statusOptions,
            'isLogistics' => $isLogistics,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $user = request()->user()->load(['department', 'role']);
        $isLogistics = $user->isLogistics();
        
        return Inertia::render('inventory/purchases/create', [
            'suppliers' => Supplier::select('id', 'name', 'phone', 'email')->where('is_active', true)->get(),
            'departments' => Department::select('id', 'name')->where('is_active', true)->get(),
            'items' => Item::select('id', 'code', 'name', 'unit_of_measure', 'reorder_level', 'safety_stock')->get(),
            'isLogistics' => $isLogistics,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'department_id' => 'required|exists:departments,id',
            'purchase_date' => 'required|date',
            'expected_delivery_date' => 'nullable|date|after_or_equal:purchase_date',
            'notes' => 'nullable|string|max:1000',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:items,id',
            'items.*.quantity_ordered' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.notes' => 'nullable|string|max:500',
        ]);

        try {
            $validated['created_by'] = Auth::id();
            $validated['status'] = 'draft';

            $purchase = $this->purchaseRepository->create($validated);

            return redirect()->route('purchases.show', $purchase->id)
                ->with('success', 'Purchase order berhasil dibuat.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Gagal membuat purchase order: ' . $e->getMessage()]);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $purchase = $this->purchaseRepository->find($id);

        return Inertia::render('inventory/purchases/show', [
            'purchase' => $purchase,
            'canEdit' => $purchase->canBeEdited(),
            'canApprove' => $purchase->canBeApproved(),
            'canReceive' => $purchase->canReceiveItems(),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($id)
    {
        $purchase = $this->purchaseRepository->find($id);

        if (!$purchase->canBeEdited()) {
            return redirect()->route('purchases.show', $id)
                ->withErrors(['error' => 'Purchase order tidak dapat diedit dalam status saat ini.']);
        }

        return Inertia::render('inventory/purchases/edit', [
            'purchase' => $purchase,
            'suppliers' => Supplier::select('id', 'name', 'phone', 'email')->where('is_active', true)->get(),
            'departments' => Department::select('id', 'name')->where('is_active', true)->get(),
            'items' => Item::select('id', 'code', 'name', 'unit_of_measure', 'reorder_level', 'safety_stock')->get(),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'department_id' => 'required|exists:departments,id',
            'purchase_date' => 'required|date',
            'expected_delivery_date' => 'nullable|date|after_or_equal:purchase_date',
            'notes' => 'nullable|string|max:1000',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:items,id',
            'items.*.quantity_ordered' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.notes' => 'nullable|string|max:500',
        ]);

        try {
            $purchase = $this->purchaseRepository->update($id, $validated);

            return redirect()->route('purchases.show', $purchase->id)
                ->with('success', 'Purchase order berhasil diupdate.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Gagal mengupdate purchase order: ' . $e->getMessage()]);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        try {
            $this->purchaseRepository->delete($id);

            return redirect()->route('purchases.index')
                ->with('success', 'Purchase order berhasil dihapus.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Gagal menghapus purchase order: ' . $e->getMessage()]);
        }
    }

    /**
     * Approve purchase order
     */
    public function approve(Request $request, $id)
    {
        try {
            $purchase = $this->purchaseRepository->approve($id, Auth::id());

            return redirect()->route('purchases.show', $id)
                ->with('success', 'Purchase order berhasil diapprove.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Gagal approve purchase order: ' . $e->getMessage()]);
        }
    }

    /**
     * Show receive form for purchase order
     */
    public function receive($id)
    {
        $purchase = $this->purchaseRepository->find($id);

        if (!$purchase->canReceiveItems()) {
            return redirect()->route('purchases.show', $id)
                ->withErrors(['error' => 'Purchase order tidak dapat di-receive dalam status saat ini.']);
        }

        return Inertia::render('inventory/purchases/receive', [
            'purchase' => $purchase,
        ]);
    }

    /**
     * Receive item for purchase order
     */
    public function receiveItem(Request $request, $purchaseItemId)
    {
        $validated = $request->validate([
            'received_quantity' => 'required|numeric|min:0.01',
            'batch_number' => 'nullable|string|max:50',
            'expiry_date' => 'nullable|date|after:today',
        ]);

        try {
            $purchaseItem = $this->purchaseRepository->receiveItem(
                $purchaseItemId, 
                $validated['received_quantity'],
                $request->only(['batch_number', 'expiry_date'])
            );

            return response()->json([
                'success' => true,
                'message' => 'Item berhasil di-receive.',
                'purchaseItem' => $purchaseItem->load(['item', 'purchase'])
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal receive item: ' . $e->getMessage()
            ], 422);
        }
    }

    /**
     * Get pending approvals
     */
    public function pendingApprovals()
    {
        $purchases = $this->purchaseRepository->getPendingApprovals();

        return Inertia::render('inventory/purchases/pending-approvals', [
            'purchases' => $purchases,
        ]);
    }

    /**
     * Get purchases ready to receive
     */
    public function readyToReceive()
    {
        $purchases = $this->purchaseRepository->getReadyToReceive();

        return Inertia::render('inventory/purchases/ready-to-receive', [
            'purchases' => $purchases,
        ]);
    }

    /**
     * Search purchases for API
     */
    public function search(Request $request)
    {
        $query = $request->get('q', '');
        $limit = $request->get('limit', 10);

        $purchases = $this->purchaseRepository->search($query, $limit);

        return response()->json($purchases);
    }

    /**
     * Submit purchase for approval
     */
    public function submit($id)
    {
        try {
            $purchase = $this->purchaseRepository->find($id);
            
            if (!$purchase->canBeEdited()) {
                return back()->withErrors(['error' => 'Purchase order tidak dapat disubmit dalam status saat ini.']);
            }

            $purchase->update(['status' => 'pending']);

            return redirect()->route('purchases.show', $id)
                ->with('success', 'Purchase order berhasil disubmit untuk approval.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Gagal submit purchase order: ' . $e->getMessage()]);
        }
    }

    /**
     * Cancel purchase order
     */
    public function cancel($id)
    {
        try {
            $purchase = $this->purchaseRepository->find($id);
            
            if (!in_array($purchase->status, ['draft', 'pending'])) {
                return back()->withErrors(['error' => 'Purchase order tidak dapat dibatalkan dalam status saat ini.']);
            }

            $purchase->update(['status' => 'cancelled']);

            return redirect()->route('purchases.show', $id)
                ->with('success', 'Purchase order berhasil dibatalkan.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Gagal membatalkan purchase order: ' . $e->getMessage()]);
        }
    }
}
