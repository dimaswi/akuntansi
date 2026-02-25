<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Inventory\Department;
use App\Models\Inventory\Item;
use App\Models\Inventory\StockTransfer;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class StockTransferController extends Controller
{
    protected NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    public function index(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        
        // Check if user has department assigned (for non-logistics users)
        if (!$user->isLogistics() && !$user->department_id) {
            return redirect()->back()
                ->with('error', 'Anda belum terdaftar di departemen manapun. Silahkan hubungi administrator untuk assign departemen.');
        }
        
        $query = StockTransfer::with(['item', 'fromDepartment', 'toDepartment', 'approvedBy', 'receivedBy'])
            ->orderBy('created_at', 'desc');

        // Department-level access control: Only logistics role can see all departments
        if (!$user->isLogistics()) {
            // Non-logistics users can only see transfers from/to their department
            $query->where(function ($q) use ($user) {
                $q->where('from_department_id', $user->department_id)
                  ->orWhere('to_department_id', $user->department_id);
            });
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nomor_transfer', 'like', "%{$search}%")
                  ->orWhereHas('item', function ($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('from_department_id')) {
            $query->where('from_department_id', $request->from_department_id);
        }

        if ($request->filled('to_department_id')) {
            $query->where('to_department_id', $request->to_department_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('tanggal_transfer', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('tanggal_transfer', '<=', $request->date_to);
        }

        $transfers = $query->paginate(10)->withQueryString();

        $transfers->getCollection()->transform(function ($transfer) {
            $data = $transfer->toArray();
            
            // Transform item data
            if (isset($data['item'])) {
                $data['item'] = [
                    'id' => $transfer->item->id,
                    'code' => $transfer->item->code,
                    'name' => $transfer->item->name,
                ];
            }
            
            // Transform fromDepartment data
            if ($transfer->fromDepartment) {
                $data['from_department'] = [
                    'id' => $transfer->fromDepartment->id,
                    'code' => $transfer->fromDepartment->code,
                    'name' => $transfer->fromDepartment->name,
                ];
            }
            
            // Transform toDepartment data
            if ($transfer->toDepartment) {
                $data['to_department'] = [
                    'id' => $transfer->toDepartment->id,
                    'code' => $transfer->toDepartment->code,
                    'name' => $transfer->toDepartment->name,
                ];
            }
            
            return $data;
        });

        $departments = Department::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'code', 'name']);

        return Inertia::render('inventory/stock-transfers/index', [
            'transfers' => $transfers,
            'departments' => $departments,
            'filters' => $request->only(['search', 'from_department_id', 'to_department_id', 'status', 'date_from', 'date_to']),
        ]);
    }

    public function create()
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        
        // Check if user has department assigned
        if (!$user->isLogistics() && !$user->department_id) {
            return redirect()->route('dashboard')
                ->with('error', 'Anda belum terdaftar di departemen manapun. Silahkan hubungi administrator untuk assign departemen.');
        }
        
        // Only show user's department (unless logistics)
        $departments = $user->isLogistics() 
            ? Department::where('is_active', true)->orderBy('name')->get(['id', 'code', 'name'])
            : Department::where('id', $user->department_id)->get(['id', 'code', 'name']);

        // Load items that have stock in ANY department (NOT central warehouse)
        // We need items that have at least one item_stock record where department_id IS NOT NULL
        $items = Item::whereHas('stocks', function ($query) {
            $query->whereNotNull('department_id')
                ->where('quantity_on_hand', '>', 0);
        })
        ->with(['stocks' => function ($query) {
            $query->whereNotNull('department_id')
                ->where('quantity_on_hand', '>', 0);
        }])
        ->orderBy('name')
        ->get()
        ->map(function ($item) {
            return [
                'id' => $item->id,
                'code' => $item->code,
                'name' => $item->name,
                'unit' => $item->unit_of_measure,
                'department_stocks' => $item->stocks->map(function ($stock) {
                    return [
                        'department_id' => $stock->department_id,
                        'quantity_on_hand' => $stock->quantity_on_hand,
                    ];
                })->values(),
            ];
        })
        ->values();

        return Inertia::render('inventory/stock-transfers/create', [
            'departments' => $departments,
            'items' => $items,
        ]);
    }

    public function store(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        
        // Check if user has department assigned
        if (!$user->isLogistics() && !$user->department_id) {
            return redirect()->route('dashboard')
                ->with('error', 'Anda belum terdaftar di departemen manapun. Silahkan hubungi administrator untuk assign departemen.');
        }
        
        $validated = $request->validate([
            'tanggal_transfer' => 'required|date',
            'from_department_id' => 'required|exists:departments,id',
            'to_department_id' => 'required|exists:departments,id|different:from_department_id',
            'item_id' => 'required|exists:items,id',
            'quantity' => 'required|integer|min:1',
            'keterangan' => 'nullable|string',
        ]);

        // Check if FROM department has completed stock opname for PREVIOUS month
        if (!\App\Models\Inventory\StockOpname::hasPreviousMonthOpname($validated['from_department_id'])) {
            return back()->with('error', 'Department pengirim harus menyelesaikan Stock Opname bulan lalu sebelum dapat melakukan transfer stok');
        }

        $nomorTransfer = StockTransfer::generateNomorTransfer($validated['tanggal_transfer']);

        $transfer = StockTransfer::create([
            'nomor_transfer' => $nomorTransfer,
            'tanggal_transfer' => $validated['tanggal_transfer'],
            'from_department_id' => $validated['from_department_id'],
            'to_department_id' => $validated['to_department_id'],
            'item_id' => $validated['item_id'],
            'quantity' => $validated['quantity'],
            'keterangan' => $validated['keterangan'],
            'status' => 'draft',
        ]);

        return redirect()->route('stock-transfers.show', $transfer)
            ->with('success', 'Stock transfer berhasil dibuat dengan nomor ' . $nomorTransfer);
    }

    public function show(StockTransfer $stockTransfer)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        
        // Department-level access control: Only logistics role can see all departments
        if (!$user->isLogistics()) {
            // Non-logistics users can only see transfers from/to their department
            if ($stockTransfer->from_department_id !== $user->department_id && 
                $stockTransfer->to_department_id !== $user->department_id) {
                abort(403, 'Anda tidak memiliki akses ke stock transfer ini');
            }
        }
        
        $stockTransfer->load(['item', 'fromDepartment', 'toDepartment', 'approvedBy', 'receivedBy']);

        $transfer = $stockTransfer->toArray();
        
        // Transform item data
        if (isset($transfer['item'])) {
            $transfer['item'] = [
                'id' => $stockTransfer->item->id,
                'code' => $stockTransfer->item->code,
                'name' => $stockTransfer->item->name,
            ];
        }
        
        // Transform fromDepartment data
        if ($stockTransfer->fromDepartment) {
            $transfer['from_department'] = [
                'id' => $stockTransfer->fromDepartment->id,
                'code' => $stockTransfer->fromDepartment->code,
                'name' => $stockTransfer->fromDepartment->name,
            ];
        }
        
        // Transform toDepartment data
        if ($stockTransfer->toDepartment) {
            $transfer['to_department'] = [
                'id' => $stockTransfer->toDepartment->id,
                'code' => $stockTransfer->toDepartment->code,
                'name' => $stockTransfer->toDepartment->name,
            ];
        }
        
        // Transform approvedBy data
        if ($stockTransfer->approvedBy) {
            $transfer['approved_by_user'] = [
                'id' => $stockTransfer->approvedBy->id,
                'name' => $stockTransfer->approvedBy->name,
            ];
        }
        
        // Transform receivedBy data
        if ($stockTransfer->receivedBy) {
            $transfer['received_by_user'] = [
                'id' => $stockTransfer->receivedBy->id,
                'name' => $stockTransfer->receivedBy->name,
            ];
        }

        return Inertia::render('inventory/stock-transfers/show', [
            'transfer' => $transfer,
        ]);
    }

    public function edit(StockTransfer $stockTransfer)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        
        // Department-level access control
        if (!$user->isLogistics()) {
            if ($stockTransfer->from_department_id !== $user->department_id && 
                $stockTransfer->to_department_id !== $user->department_id) {
                abort(403, 'Anda tidak memiliki akses ke stock transfer ini');
            }
        }
        
        if ($stockTransfer->status !== 'draft') {
            return redirect()->route('stock-transfers.show', $stockTransfer)
                ->with('error', 'Stock transfer yang sudah approved tidak dapat diedit');
        }

        $departments = Department::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'code', 'name']);

        // Load items that have stock in ANY department (NOT central warehouse)
        $items = Item::whereHas('stocks', function ($query) {
            $query->whereNotNull('department_id')
                ->where('quantity_on_hand', '>', 0);
        })
        ->with(['stocks' => function ($query) {
            $query->whereNotNull('department_id')
                ->where('quantity_on_hand', '>', 0);
        }])
        ->orderBy('name')
        ->get()
        ->map(function ($item) {
            return [
                'id' => $item->id,
                'code' => $item->code,
                'name' => $item->name,
                'unit' => $item->unit_of_measure,
                'department_stocks' => $item->stocks->map(function ($stock) {
                    return [
                        'department_id' => $stock->department_id,
                        'quantity_on_hand' => $stock->quantity_on_hand,
                    ];
                })->values(),
            ];
        })
        ->values();

        return Inertia::render('inventory/stock-transfers/edit', [
            'transfer' => $stockTransfer->load('item', 'fromDepartment', 'toDepartment'),
            'departments' => $departments,
            'items' => $items,
        ]);
    }

    public function update(Request $request, StockTransfer $stockTransfer)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        
        // Department-level access control
        if (!$user->isLogistics()) {
            if ($stockTransfer->from_department_id !== $user->department_id && 
                $stockTransfer->to_department_id !== $user->department_id) {
                abort(403, 'Anda tidak memiliki akses ke stock transfer ini');
            }
        }
        
        if ($stockTransfer->status !== 'draft') {
            return back()->with('error', 'Stock transfer yang sudah approved tidak dapat diedit');
        }

        $validated = $request->validate([
            'tanggal_transfer' => 'required|date',
            'from_department_id' => 'required|exists:departments,id',
            'to_department_id' => 'required|exists:departments,id|different:from_department_id',
            'item_id' => 'required|exists:items,id',
            'quantity' => 'required|integer|min:1',
            'keterangan' => 'nullable|string',
        ]);

        $stockTransfer->update($validated);

        return redirect()->route('stock-transfers.show', $stockTransfer)
            ->with('success', 'Stock transfer berhasil diupdate');
    }

    public function destroy(StockTransfer $stockTransfer)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        
        // Department-level access control
        if (!$user->isLogistics()) {
            if ($stockTransfer->from_department_id !== $user->department_id && 
                $stockTransfer->to_department_id !== $user->department_id) {
                abort(403, 'Anda tidak memiliki akses ke stock transfer ini');
            }
        }
        
        if ($stockTransfer->status !== 'draft') {
            return back()->with('error', 'Stock transfer yang sudah approved tidak dapat dihapus');
        }

        $stockTransfer->delete();

        return redirect()->route('stock-transfers.index')
            ->with('success', 'Stock transfer berhasil dihapus');
    }

    public function approve(StockTransfer $stockTransfer)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        
        // Department-level access control
        if (!$user->isLogistics()) {
            if ($stockTransfer->from_department_id !== $user->department_id && 
                $stockTransfer->to_department_id !== $user->department_id) {
                abort(403, 'Anda tidak memiliki akses ke stock transfer ini');
            }
        }
        
        if ($stockTransfer->status !== 'draft') {
            return back()->with('error', 'Stock transfer sudah approved');
        }

        DB::beginTransaction();
        try {
            $item = $stockTransfer->item;

            // Transfer dari department - use reduceStock() method
            $fromStock = $item->departmentStock($stockTransfer->from_department_id);
            if (!$fromStock || $fromStock->quantity_on_hand < $stockTransfer->quantity) {
                throw new \Exception('Stok department asal tidak mencukupi');
            }
            
            // Use reduceStock() method to automatically update total_value
            $fromStock->reduceStock($stockTransfer->quantity);

            $stockTransfer->update([
                'status' => 'approved',
                'approved_by' => Auth::id(),
                'approved_at' => now(),
            ]);

            DB::commit();

            // Send notification to destination department
            $this->notificationService->sendToAllRoles(
                NotificationService::TYPE_STOCK_TRANSFER_APPROVED,
                [
                    'title' => 'Stock Transfer Disetujui',
                    'message' => "Stock Transfer {$stockTransfer->nomor_transfer} untuk item {$item->name} ({$stockTransfer->quantity} {$item->unit_of_measure}) telah disetujui. Menunggu penerimaan di {$stockTransfer->toDepartment->name}.",
                    'action_url' => route('stock-transfers.show', $stockTransfer->id),
                    'data' => [
                        'transfer_id' => $stockTransfer->id,
                        'nomor_transfer' => $stockTransfer->nomor_transfer,
                        'item_name' => $item->name,
                        'quantity' => $stockTransfer->quantity,
                        'from_department' => $stockTransfer->fromDepartment->name,
                        'to_department' => $stockTransfer->toDepartment->name,
                    ]
                ]
            );

            return back()->with('success', 'Stock transfer berhasil di-approve. Menunggu penerimaan di department tujuan');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal approve stock transfer: ' . $e->getMessage());
        }
    }

    public function receive(StockTransfer $stockTransfer)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        
        // Department-level access control
        if (!$user->isLogistics()) {
            if ($stockTransfer->from_department_id !== $user->department_id && 
                $stockTransfer->to_department_id !== $user->department_id) {
                abort(403, 'Anda tidak memiliki akses ke stock transfer ini');
            }
        }
        
        if ($stockTransfer->status !== 'approved') {
            return back()->with('error', 'Hanya transfer yang sudah approved yang bisa diterima');
        }

        DB::beginTransaction();
        try {
            $item = $stockTransfer->item;

            // Tambah stok di department tujuan
            $toStock = $item->departmentStock($stockTransfer->to_department_id);
            
            // Jika belum ada stock record untuk department ini, buat baru
            if (!$toStock) {
                $toStock = $item->stocks()->create([
                    'department_id' => $stockTransfer->to_department_id,
                    'quantity_on_hand' => 0,
                    'reserved_quantity' => 0,
                    'available_quantity' => 0,
                    'last_unit_cost' => 0,
                    'average_unit_cost' => 0,
                    'total_value' => 0,
                ]);
            }
            
            // Get the cost from source department stock
            $fromStock = $item->departmentStock($stockTransfer->from_department_id);
            $unitCost = $fromStock ? $fromStock->average_unit_cost : 0;
            
            // Use addStock() method to automatically update total_value
            $toStock->addStock($stockTransfer->quantity, $unitCost);

            $stockTransfer->update([
                'status' => 'received',
                'received_by' => Auth::id(),
                'received_at' => now(),
            ]);

            DB::commit();

            // Send notification
            $this->notificationService->sendToAllRoles(
                NotificationService::TYPE_STOCK_TRANSFER_RECEIVED,
                [
                    'title' => 'Stock Transfer Diterima',
                    'message' => "Stock Transfer {$stockTransfer->nomor_transfer} untuk item {$item->name} ({$stockTransfer->quantity} {$item->unit_of_measure}) telah diterima oleh {$stockTransfer->toDepartment->name}.",
                    'action_url' => route('stock-transfers.show', $stockTransfer->id),
                    'data' => [
                        'transfer_id' => $stockTransfer->id,
                        'nomor_transfer' => $stockTransfer->nomor_transfer,
                        'item_name' => $item->name,
                        'quantity' => $stockTransfer->quantity,
                        'from_department' => $stockTransfer->fromDepartment->name,
                        'to_department' => $stockTransfer->toDepartment->name,
                    ]
                ]
            );

            return back()->with('success', 'Stock transfer berhasil diterima');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal menerima stock transfer: ' . $e->getMessage());
        }
    }
}
