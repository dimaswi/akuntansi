<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Inventory\Item;
use App\Models\Inventory\StockAdjustment;
use App\Services\Inventory\StockAdjustmentAccountingService;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class StockAdjustmentController extends Controller
{
    protected StockAdjustmentAccountingService $accountingService;
    protected NotificationService $notificationService;

    public function __construct(
        StockAdjustmentAccountingService $accountingService,
        NotificationService $notificationService
    ) {
        $this->accountingService = $accountingService;
        $this->notificationService = $notificationService;
    }

    /**
     * Display a listing of stock adjustments
     * Only logistics role can manage stock adjustments (central warehouse)
     */
    public function index(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        
        // Stock adjustments are for central warehouse - only logistics can access
        if (!$user->isLogistics()) {
            abort(403, 'Hanya role logistics yang dapat mengakses stock adjustment');
        }
        
        $query = StockAdjustment::with(['item', 'approvedBy', 'jurnal'])
            ->orderBy('created_at', 'desc');

        // Filter by search (nomor adjustment, item name)
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nomor_adjustment', 'like', "%{$search}%")
                  ->orWhereHas('item', function ($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%");
                  });
            });
        }

        // Filter by tipe adjustment
        if ($request->filled('tipe_adjustment')) {
            $query->where('tipe_adjustment', $request->tipe_adjustment);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by posted status
        if ($request->filled('posted_only')) {
            $query->where('jurnal_posted', true);
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->whereDate('tanggal_adjustment', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('tanggal_adjustment', '<=', $request->date_to);
        }

        $adjustments = $query->paginate(15)->withQueryString();

        // Transform item data untuk setiap adjustment
        $adjustments->getCollection()->transform(function ($adjustment) {
            $data = $adjustment->toArray();
            if (isset($data['item'])) {
                $data['item'] = [
                    'id' => $adjustment->item->id,
                    'code' => $adjustment->item->code,
                    'name' => $adjustment->item->name,
                ];
            }
            return $data;
        });

        return Inertia::render('inventory/stock-adjustments/index', [
            'adjustments' => $adjustments,
            'filters' => $request->only(['search', 'tipe_adjustment', 'status', 'posted_only', 'date_from', 'date_to']),
        ]);
    }

    /**
     * Show the form for creating a new adjustment
     * Only logistics role can create adjustments
     */
    public function create()
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        
        if (!$user->isLogistics()) {
            abort(403, 'Hanya role logistics yang dapat membuat stock adjustment');
        }
        
        return Inertia::render('inventory/stock-adjustments/create');
    }

    /**
     * Store a newly created adjustment
     */
    public function store(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        
        if (!$user->isLogistics()) {
            abort(403, 'Hanya role logistics yang dapat membuat stock adjustment');
        }
        
        $validated = $request->validate([
            'tanggal_adjustment' => 'required|date',
            'tipe_adjustment' => 'required|in:shortage,overage',
            'item_id' => 'required|exists:items,id',
            'quantity' => 'required|integer|min:1',
            'keterangan' => 'nullable|string',
        ]);

        // Get item for unit price
        $item = Item::findOrFail($validated['item_id']);

        // Generate nomor adjustment
        $nomorAdjustment = StockAdjustment::generateNomorAdjustment($validated['tanggal_adjustment']);

        $adjustment = StockAdjustment::create([
            'nomor_adjustment' => $nomorAdjustment,
            'tanggal_adjustment' => $validated['tanggal_adjustment'],
            'tipe_adjustment' => $validated['tipe_adjustment'],
            'item_id' => $validated['item_id'],
            'quantity' => $validated['quantity'],
            'unit_price' => $item->last_purchase_cost ?? $item->standard_cost ?? 0,
            'keterangan' => $validated['keterangan'],
            'status' => 'draft',
        ]);

        return redirect()->route('stock-adjustments.show', $adjustment)
            ->with('success', 'Stock adjustment berhasil dibuat dengan nomor ' . $nomorAdjustment);
    }

    /**
     * Display the specified adjustment
     */
    public function show(StockAdjustment $stockAdjustment)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        
        if (!$user->isLogistics()) {
            abort(403, 'Hanya role logistics yang dapat mengakses stock adjustment');
        }
        
        $stockAdjustment->load(['item', 'approvedBy', 'jurnal.details']);

        // Transform item data untuk frontend
        $adjustment = $stockAdjustment->toArray();
        if (isset($adjustment['item'])) {
            $adjustment['item'] = [
                'id' => $stockAdjustment->item->id,
                'code' => $stockAdjustment->item->code,
                'name' => $stockAdjustment->item->name,
            ];
        }

        return Inertia::render('inventory/stock-adjustments/show', [
            'adjustment' => $adjustment,
        ]);
    }

    /**
     * Show the form for editing the specified adjustment
     */
    public function edit(StockAdjustment $stockAdjustment)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        
        if (!$user->isLogistics()) {
            abort(403, 'Hanya role logistics yang dapat mengedit stock adjustment');
        }
        
        if ($stockAdjustment->status === 'approved') {
            return redirect()->route('stock-adjustments.show', $stockAdjustment)
                ->with('error', 'Stock adjustment yang sudah approved tidak dapat diedit');
        }

        return Inertia::render('inventory/stock-adjustments/edit', [
            'adjustment' => $stockAdjustment->load('item'),
        ]);
    }

    /**
     * Update the specified adjustment
     */
    public function update(Request $request, StockAdjustment $stockAdjustment)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        
        if (!$user->isLogistics()) {
            abort(403, 'Hanya role logistics yang dapat mengupdate stock adjustment');
        }
        
        if ($stockAdjustment->status === 'approved') {
            return back()->with('error', 'Stock adjustment yang sudah approved tidak dapat diedit');
        }

        $validated = $request->validate([
            'tanggal_adjustment' => 'required|date',
            'tipe_adjustment' => 'required|in:shortage,overage',
            'item_id' => 'required|exists:items,id',
            'quantity' => 'required|integer|min:1',
            'keterangan' => 'nullable|string',
        ]);

        // Get item for unit price
        $item = Item::findOrFail($validated['item_id']);

        $stockAdjustment->update([
            'tanggal_adjustment' => $validated['tanggal_adjustment'],
            'tipe_adjustment' => $validated['tipe_adjustment'],
            'item_id' => $validated['item_id'],
            'quantity' => $validated['quantity'],
            'unit_price' => $item->last_purchase_cost ?? $item->standard_cost ?? 0,
            'keterangan' => $validated['keterangan'],
        ]);

        return redirect()->route('stock-adjustments.show', $stockAdjustment)
            ->with('success', 'Stock adjustment berhasil diupdate');
    }

    /**
     * Remove the specified adjustment
     */
    public function destroy(StockAdjustment $stockAdjustment)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        
        if (!$user->isLogistics()) {
            abort(403, 'Hanya role logistics yang dapat menghapus stock adjustment');
        }
        
        if ($stockAdjustment->status === 'approved') {
            return back()->with('error', 'Stock adjustment yang sudah approved tidak dapat dihapus');
        }

        if ($stockAdjustment->jurnal_posted) {
            return back()->with('error', 'Stock adjustment yang sudah di-posting ke jurnal tidak dapat dihapus');
        }

        $nomorAdjustment = $stockAdjustment->nomor_adjustment;
        $stockAdjustment->delete();

        return redirect()->route('stock-adjustments.index')
            ->with('success', "Stock adjustment {$nomorAdjustment} berhasil dihapus");
    }

    /**
     * Approve adjustment and update stock
     * This is the FIRST step - updates inventory immediately
     */
    public function approve(StockAdjustment $stockAdjustment)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        
        if (!$user->isLogistics()) {
            abort(403, 'Hanya role logistics yang dapat meng-approve stock adjustment');
        }
        
        if ($stockAdjustment->status === 'approved') {
            return back()->with('error', 'Stock adjustment sudah approved');
        }

        try {
            DB::beginTransaction();

            $item = $stockAdjustment->item;
            $centralStock = $item->centralStock();

            if (!$centralStock) {
                throw new \Exception('Central stock tidak ditemukan untuk item ini');
            }

            // Update stock based on adjustment type
            if ($stockAdjustment->tipe_adjustment === 'shortage') {
                // Kekurangan: reduce stock
                $newStock = $centralStock->quantity_on_hand - $stockAdjustment->quantity;
                if ($newStock < 0) {
                    throw new \Exception('Stok tidak mencukupi untuk adjustment shortage');
                }
                $centralStock->quantity_on_hand = $newStock;
                $centralStock->available_quantity = max(0, $centralStock->available_quantity - $stockAdjustment->quantity);
            } else {
                // Kelebihan: increase stock
                $centralStock->quantity_on_hand += $stockAdjustment->quantity;
                $centralStock->available_quantity += $stockAdjustment->quantity;
            }

            $centralStock->save();

            // Update adjustment status
            $stockAdjustment->update([
                'status' => 'approved',
                'approved_by' => Auth::id(),
                'approved_at' => now(),
            ]);

            DB::commit();

            // Send notification
            $this->notificationService->sendToAllRoles(
                NotificationService::TYPE_STOCK_ADJUSTMENT_APPROVED,
                [
                    'title' => 'Stock Adjustment Disetujui',
                    'message' => "Stock Adjustment {$stockAdjustment->nomor_adjustment} untuk item {$item->name} ({$stockAdjustment->quantity} {$item->unit_of_measure}) - {$stockAdjustment->tipe_adjustment} telah disetujui.",
                    'action_url' => route('stock-adjustments.show', $stockAdjustment->id),
                    'data' => [
                        'adjustment_id' => $stockAdjustment->id,
                        'nomor_adjustment' => $stockAdjustment->nomor_adjustment,
                        'item_name' => $item->name,
                        'tipe' => $stockAdjustment->tipe_adjustment,
                        'quantity' => $stockAdjustment->quantity,
                    ]
                ]
            );

            return redirect()->route('stock-adjustments.show', $stockAdjustment)
                ->with('success', 'Stock adjustment approved dan stok berhasil diupdate');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->with('error', 'Gagal approve adjustment: ' . $e->getMessage());
        }
    }

    /**
     * Show page untuk post to jurnal (batch selection)
     */
    public function showPostToJournal()
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        
        if (!$user->isLogistics()) {
            abort(403, 'Hanya role logistics yang dapat mengakses halaman ini');
        }
        
        // Get adjustments yang approved tapi belum di-post
        $adjustments = StockAdjustment::with('item')
            ->where('status', 'approved')
            ->where('jurnal_posted', false)
            ->orderBy('tanggal_adjustment', 'desc')
            ->get()
            ->map(function ($adjustment) {
                return [
                    'id' => $adjustment->id,
                    'nomor_adjustment' => $adjustment->nomor_adjustment,
                    'tanggal_adjustment' => $adjustment->tanggal_adjustment->format('Y-m-d'),
                    'tipe_adjustment' => $adjustment->tipe_adjustment,
                    'item' => [
                        'code' => $adjustment->item->code,
                        'name' => $adjustment->item->name,
                    ],
                    'quantity' => $adjustment->quantity,
                    'total_amount' => $adjustment->total_amount,
                ];
            });
        
        return Inertia::render('inventory/stock-adjustments/post-to-journal', [
            'adjustments' => $adjustments,
        ]);
    }

    /**
     * Post adjustment to jurnal
     * This is the SECOND step - separate from stock update
     * Support single ID or batch IDs
     */
    public function postToJournal(Request $request, StockAdjustment $stockAdjustment = null)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        
        if (!$user->isLogistics()) {
            abort(403, 'Hanya role logistics yang dapat posting ke jurnal');
        }

        // Check if batch processing (from post-to-journal page)
        if ($request->has('adjustment_ids')) {
            return $this->postBatchToJurnal($request);
        }

        // Single item processing (from detail page)
        if (!$stockAdjustment) {
            return back()->with('error', 'Stock adjustment tidak ditemukan');
        }
        
        $result = $this->accountingService->postAdjustmentToJournal($stockAdjustment);

        if ($result['success']) {
            // Send notification
            $this->notificationService->sendToAllRoles(
                NotificationService::TYPE_STOCK_ADJUSTMENT_POSTED,
                [
                    'title' => 'Stock Adjustment Posted to Journal',
                    'message' => "Stock Adjustment {$stockAdjustment->nomor_adjustment} telah berhasil diposting ke jurnal dengan nomor {$stockAdjustment->jurnal->nomor_jurnal}.",
                    'action_url' => route('stock-adjustments.show', $stockAdjustment->id),
                    'data' => [
                        'adjustment_id' => $stockAdjustment->id,
                        'nomor_adjustment' => $stockAdjustment->nomor_adjustment,
                        'nomor_jurnal' => $stockAdjustment->jurnal->nomor_jurnal,
                    ]
                ]
            );
            
            return redirect()->route('stock-adjustments.show', $stockAdjustment)
                ->with('success', $result['message']);
        }

        return back()->with('error', $result['message']);
    }

    /**
     * Post multiple stock adjustments to jurnal (batch processing)
     */
    private function postBatchToJurnal(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        $request->validate([
            'adjustment_ids' => 'required|array|min:1',
            'adjustment_ids.*' => 'exists:stock_adjustments,id',
        ]);

        $adjustmentIds = $request->adjustment_ids;
        $adjustments = StockAdjustment::whereIn('id', $adjustmentIds)
            ->where('status', 'approved')
            ->where('jurnal_posted', false)
            ->get();

        if ($adjustments->isEmpty()) {
            return back()->with('error', 'Tidak ada stock adjustment yang valid untuk diposting');
        }

        $successCount = 0;
        $failedCount = 0;
        $errors = [];

        foreach ($adjustments as $adjustment) {
            $result = $this->accountingService->postAdjustmentToJournal($adjustment);
            
            if ($result['success']) {
                // Send notification
                $this->notificationService->sendToAllRoles(
                    NotificationService::TYPE_STOCK_ADJUSTMENT_POSTED,
                    [
                        'title' => 'Stock Adjustment Posted to Journal',
                        'message' => "Stock Adjustment {$adjustment->nomor_adjustment} telah berhasil diposting ke jurnal.",
                        'action_url' => route('stock-adjustments.show', $adjustment->id),
                        'data' => [
                            'adjustment_id' => $adjustment->id,
                            'nomor_adjustment' => $adjustment->nomor_adjustment,
                        ]
                    ]
                );

                $successCount++;
            } else {
                $failedCount++;
                $errors[] = "{$adjustment->nomor_adjustment}: {$result['message']}";
            }
        }

        $message = "Berhasil posting {$successCount} stock adjustment ke jurnal.";
        if ($failedCount > 0) {
            $message .= " {$failedCount} gagal: " . implode(', ', $errors);
        }

        return redirect()->route('stock-adjustments.showPostToJournal')
            ->with($failedCount > 0 ? 'warning' : 'success', $message);
    }

    /**
     * Search items for adjustment (AJAX)
     */
    public function searchItems(Request $request)
    {
        try {
            $search = $request->get('search', '');

            $items = Item::with('stocks')
                ->when($search, function ($query, $search) {
                    $query->where('name', 'like', "%{$search}%")
                          ->orWhere('code', 'like', "%{$search}%");
                })
                ->where('is_active', true)
                ->orderBy('name')
                ->limit(100)
                ->get()
                ->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'kode_barang' => $item->code,
                        'nama_barang' => $item->name,
                        'harga_beli' => (float) ($item->last_purchase_cost ?? $item->standard_cost ?? 0),
                        'stok_pusat' => (int) $item->getCentralQuantity(),
                    ];
                });

            Log::info('Search Items Response:', ['count' => $items->count(), 'items' => $items->toArray()]);

            return response()->json($items->values()->toArray());
        } catch (\Exception $e) {
            Log::error('Search Items Error:', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}

