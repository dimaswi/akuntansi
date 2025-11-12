<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Repositories\Inventory\PurchaseRepositoryInterface;
use App\Services\Inventory\InventoryAccountingService;
use App\Services\NotificationService;
use App\Models\Inventory\Purchase;
use App\Models\Inventory\PurchaseItem;
use App\Models\Inventory\PurchasePayment;
use App\Models\Inventory\Supplier;
use App\Models\Inventory\Item;
use App\Models\Kas\BankAccount;
use App\Models\Akuntansi\DaftarAkun;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PurchaseController extends Controller
{
    private $purchaseRepository;
    private $accountingService;
    private $notificationService;

    public function __construct(
        PurchaseRepositoryInterface $purchaseRepository,
        InventoryAccountingService $accountingService,
        NotificationService $notificationService
    ) {
        $this->purchaseRepository = $purchaseRepository;
        $this->accountingService = $accountingService;
        $this->notificationService = $notificationService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user()->load('role');
        $isLogistics = $user->isLogistics();
        
        $filters = $request->only([
            'search', 'status', 'supplier_id', 
            'date_from', 'date_to', 'perPage', 'has_outstanding'
        ]);

        // If AJAX request with has_outstanding filter (for payment creation)
        if ($request->ajax() && isset($filters['has_outstanding'])) {
            $perPage = $request->input('per_page', 100);
            
            $purchases = Purchase::with('supplier')
                ->where('status', 'approved')
                ->where('ap_outstanding', '>', 0)
                ->when($filters['search'] ?? null, function ($query, $search) {
                    $query->where(function ($q) use ($search) {
                        $q->where('purchase_number', 'like', "%{$search}%")
                          ->orWhereHas('supplier', function ($q) use ($search) {
                              $q->where('name', 'like', "%{$search}%");
                          });
                    });
                })
                ->orderBy('purchase_date', 'desc')
                ->limit($perPage)
                ->get()
                ->map(function ($purchase) {
                    return [
                        'id' => $purchase->id,
                        'purchase_number' => $purchase->purchase_number,
                        'supplier_name' => $purchase->supplier->name,
                        'total_amount' => $purchase->total_amount,
                        'ap_outstanding' => $purchase->ap_outstanding,
                    ];
                });

            return response()->json(['data' => $purchases]);
        }

        $purchases = $this->purchaseRepository->paginate($filters);

        $statusOptions = collect(Purchase::getStatusOptions())->map(function ($label, $value) {
            return ['value' => $value, 'label' => $label];
        })->values();

        return Inertia::render('inventory/purchases/index', [
            'purchases' => $purchases,
            'filters' => $filters,
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
        $user = request()->user()->load('role');
        $isLogistics = $user->isLogistics();
        
        // Get akun kas (inventory/expense accounts) for selection
        $akunKas = DaftarAkun::whereIn('jenis_akun', ['aset', 'beban'])
            ->where('is_aktif', true)
            ->orderBy('kode_akun')
            ->get(['id', 'kode_akun', 'nama_akun', 'jenis_akun']);
        
        return Inertia::render('inventory/purchases/create', [
            'suppliers' => Supplier::select('id', 'name', 'phone', 'email')->where('is_active', true)->get(),
            'items' => Item::select('id', 'code', 'name', 'unit_of_measure', 'reorder_level', 'safety_stock')->get(),
            'akunKas' => $akunKas,
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
            'purchase_date' => 'required|date',
            'expected_delivery_date' => 'nullable|date|after_or_equal:purchase_date',
            'akun_kas_id' => 'required|exists:daftar_akun,id',
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
        $purchase->load([
            'payments.jurnal', 
            'payments.bankAccount', 
            'payments.createdBy',
            'jurnal' // Load jurnal relation untuk ditampilkan di frontend
        ]);

        $user = request()->user();

        return Inertia::render('inventory/purchases/show', [
            'purchase' => $purchase,
            'canEdit' => $purchase->canBeEdited() && $user->can('inventory.purchases.edit'),
            'canApprove' => $purchase->canBeApproved() && $user->can('inventory.purchases.approve'),
            'canReceive' => $purchase->canReceiveItems() && $user->can('inventory.purchases.receive'),
            'canPostToJurnal' => $purchase->canPostToJournal() && $user->can('inventory.purchases.post-to-journal'),
            'hasOutstandingPayment' => $purchase->hasOutstandingPayment(),
            'payments' => $purchase->payments,
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

            // Send approval notification
            $this->notificationService->sendToUser(
                $purchase->created_by,
                NotificationService::TYPE_PURCHASE_APPROVED,
                [
                    'title' => 'Purchase Order Approved',
                    'message' => "PO {$purchase->purchase_number} Anda telah diapprove dan siap untuk diproses.",
                    'action_url' => route('purchases.show', $purchase->id),
                    'data' => [
                        'purchase_id' => $purchase->id,
                        'purchase_number' => $purchase->purchase_number,
                        'approved_by' => Auth::user()->name,
                    ],
                ]
            );

            // Notify logistics team
            $this->notificationService->sendToRoles(
                NotificationService::TYPE_PURCHASE_APPROVED,
                ['logistics'],
                [
                    'title' => 'Purchase Order Approved',
                    'message' => "PO {$purchase->purchase_number} telah diapprove. Total: " . number_format($purchase->total_amount, 2),
                    'action_url' => route('purchases.show', $purchase->id),
                    'data' => [
                        'purchase_id' => $purchase->id,
                        'purchase_number' => $purchase->purchase_number,
                        'supplier' => $purchase->supplier->name,
                    ],
                ]
            );

            // Notify accounting team that PO is ready for journal posting
            $this->notificationService->sendToRoles(
                NotificationService::TYPE_PURCHASE_APPROVED,
                ['akuntansi', 'manager'],
                [
                    'title' => 'Purchase Order Ready for Journal Posting',
                    'message' => "PO {$purchase->purchase_number} telah diapprove dan siap untuk di-post ke jurnal. Total: " . number_format($purchase->total_amount, 2),
                    'action_url' => route('purchases.show', $purchase->id),
                    'data' => [
                        'purchase_id' => $purchase->id,
                        'purchase_number' => $purchase->purchase_number,
                        'supplier' => $purchase->supplier->name,
                        'total_amount' => $purchase->total_amount,
                    ],
                ]
            );

            return redirect()->route('purchases.show', $id)
                ->with('success', 'Purchase order berhasil diapprove. Silakan post ke jurnal untuk melanjutkan.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Gagal approve purchase order: ' . $e->getMessage()]);
        }
    }

    /**
     * Mark purchase order as ordered
     */
    public function markAsOrdered($id)
    {
        try {
            $purchase = Purchase::findOrFail($id);
            
            if ($purchase->status !== 'approved') {
                return redirect()->route('purchases.show', $id)
                    ->withErrors(['error' => 'Hanya purchase order dengan status "approved" yang dapat diubah ke "ordered".']);
            }

            $purchase->update(['status' => 'ordered']);

            return redirect()->route('purchases.show', $purchase->id)
                ->with('success', 'Purchase order berhasil diubah ke status "ordered".');
        } catch (\Exception $e) {
            return redirect()->back()
                ->withErrors(['error' => 'Gagal mengubah status: ' . $e->getMessage()]);
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

            // Send notification to users who can approve (logistics role with approval permission)
            $this->notificationService->sendToRoles(
                NotificationService::TYPE_PURCHASE_APPROVED,
                ['logistics', 'manager', 'administrator'],
                [
                    'title' => 'Purchase Order Menunggu Approval',
                    'message' => "PO {$purchase->purchase_number} dari {$purchase->supplier->name} telah disubmit dan menunggu approval. Total: " . number_format($purchase->total_amount, 0, ',', '.'),
                    'action_url' => route('purchases.show', $purchase->id),
                    'data' => [
                        'purchase_id' => $purchase->id,
                        'purchase_number' => $purchase->purchase_number,
                        'supplier' => $purchase->supplier->name,
                        'total_amount' => $purchase->total_amount,
                        'created_by' => $purchase->creator->name ?? 'System',
                    ],
                ]
            );

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

    /**
     * Show post to journal form (GET dengan query param seperti kas)
     */
    public function showPostToJournal(Request $request)
    {
        $purchaseId = $request->get('id');
        
        if (!$purchaseId) {
            return redirect()->route('purchases.index')
                ->with('error', 'Pilih purchase order untuk diposting ke jurnal.');
        }

        $purchase = Purchase::with(['supplier', 'items.item.category', 'creator', 'akunKas'])
            ->where('id', $purchaseId)
            ->first();

        if (!$purchase) {
            return redirect()->route('purchases.index')
                ->with('error', 'Purchase order tidak ditemukan.');
        }

        if (!$purchase->canPostToJournal()) {
            $reason = '';
            if ($purchase->jurnal_posted) {
                $reason = 'Purchase order sudah pernah di-post ke jurnal.';
            } elseif (!in_array($purchase->status, ['approved', 'ordered', 'partial', 'completed'])) {
                $reason = "Status purchase order saat ini adalah '{$purchase->status}'. Hanya purchase order dengan status 'approved', 'ordered', 'partial', atau 'completed' yang dapat di-post ke jurnal.";
            }
            
            return redirect()->route('purchases.show', $purchaseId)
                ->withErrors(['error' => $reason ?: 'Purchase order tidak dapat di-post ke jurnal.']);
        }

        // Get daftar akun untuk referensi
        $daftarAkun = DaftarAkun::aktif()
            ->orderBy('jenis_akun')
            ->orderBy('kode_akun')
            ->get(['id', 'kode_akun', 'nama_akun', 'jenis_akun']);

        // Generate nomor jurnal preview (tidak disimpan)
        $nomorJurnalPreview = $this->generateNomorJurnal();

        return Inertia::render('inventory/purchases/post-to-journal', [
            'purchase' => $purchase,
            'daftarAkun' => $daftarAkun,
            'nomorJurnalPreview' => $nomorJurnalPreview,
        ]);
    }

    private function generateNomorJurnal()
    {
        $date = now();
        $year = $date->format('Y');
        $month = $date->format('m');
        $prefix = 'JPO'; // Jurnal Purchase Order
        
        // Get last number for this month with JPO prefix
        $lastJurnal = \App\Models\Akuntansi\Jurnal::where('nomor_jurnal', 'like', "$prefix/$year/$month/%")
            ->orderBy('nomor_jurnal', 'desc')
            ->first();
        
        if ($lastJurnal) {
            $lastNum = (int) substr($lastJurnal->nomor_jurnal, -4);
            $newNum = $lastNum + 1;
        } else {
            $newNum = 1;
        }
        
        return sprintf('%s/%s/%s/%04d', $prefix, $year, $month, $newNum);
    }

    /**
     * Process posting to journal (POST)
     */
    public function postToJournal(Request $request)
    {
        $validated = $request->validate([
            'purchase_id' => 'required|exists:purchases,id',
            'detail_jurnal' => 'required|array|min:2',
            'detail_jurnal.*.daftar_akun_id' => 'required|exists:daftar_akun,id',
            'detail_jurnal.*.keterangan' => 'required|string|max:255',
            'detail_jurnal.*.jumlah_debit' => 'required|numeric|min:0',
            'detail_jurnal.*.jumlah_kredit' => 'required|numeric|min:0',
        ]);

        // Validasi balance
        $totalDebit = collect($validated['detail_jurnal'])->sum('jumlah_debit');
        $totalKredit = collect($validated['detail_jurnal'])->sum('jumlah_kredit');

        if ($totalDebit != $totalKredit) {
            return back()->withErrors(['detail_jurnal' => 'Total debit dan kredit harus balance.']);
        }

        try {
            $purchase = Purchase::with(['supplier', 'items.item.category'])->findOrFail($validated['purchase_id']);

            if (!$purchase->canPostToJournal()) {
                $reason = '';
                if ($purchase->jurnal_posted) {
                    $reason = 'Purchase order sudah pernah di-post ke jurnal.';
                } elseif (!in_array($purchase->status, ['approved', 'ordered', 'partial', 'completed'])) {
                    $reason = "Status purchase order saat ini adalah '{$purchase->status}'. Hanya purchase order dengan status 'approved', 'ordered', 'partial', atau 'completed' yang dapat di-post ke jurnal.";
                }
                return back()->withErrors(['error' => $reason ?: 'Purchase order tidak dapat di-post ke jurnal.']);
            }

            // Post to journal with detail from user
            $jurnal = $this->accountingService->postPurchaseToJournalWithDetail(
                $purchase, 
                $validated['detail_jurnal'],
                Auth::id()
            );

            return redirect()->route('purchases.show', $purchase->id)
                ->with('success', "Purchase order berhasil di-post ke jurnal {$jurnal->nomor_jurnal}.");
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Gagal posting ke jurnal: ' . $e->getMessage()]);
        }
    }
}
