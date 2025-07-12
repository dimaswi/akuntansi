<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Inventory\InventoryStockCount;
use App\Models\Inventory\InventoryStockCountItem;
use App\Models\Inventory\InventoryItem;
use App\Models\Inventory\InventoryLocation;
use App\Models\Inventory\InventoryStock;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class InventoryStockCountController extends Controller
{
    public function index(Request $request)
    {
        $query = InventoryStockCount::with(['location', 'countedBy'])
            ->select('inventory_stock_counts.*')
            ->orderBy('count_date', 'desc');

        // Apply filters
        if ($request->filled('location') && $request->location !== 'all') {
            $query->where('location_id', $request->location);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('reference_number', 'like', "%{$search}%")
                  ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        $stockCounts = $query->paginate(20);

        $locations = InventoryLocation::active()->orderBy('name')->get(['id', 'name']);

        return Inertia::render('Inventory/StockCount/Index', [
            'stockCounts' => $stockCounts,
            'locations' => $locations,
            'filters' => $request->only(['search', 'location', 'status'])
        ]);
    }

    public function create()
    {
        $locations = InventoryLocation::active()->orderBy('name')->get(['id', 'name']);
        
        return Inertia::render('Inventory/StockCount/Create', [
            'locations' => $locations
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'location_id' => 'required|exists:inventory_locations,id',
            'count_date' => 'required|date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:inventory_items,id',
            'items.*.counted_quantity' => 'required|numeric|min:0',
            'items.*.notes' => 'nullable|string',
        ]);

        DB::transaction(function () use ($request) {
            // Create stock count record
            $stockCount = InventoryStockCount::create([
                'reference_number' => 'SC-' . date('Ymd') . '-' . str_pad(InventoryStockCount::count() + 1, 4, '0', STR_PAD_LEFT),
                'location_id' => $request->location_id,
                'count_date' => $request->count_date,
                'status' => 'draft',
                'counted_by' => Auth::id(),
                'notes' => $request->notes,
            ]);

            // Add stock count items
            foreach ($request->items as $itemId => $itemData) {
                // Get current system count
                $currentStock = InventoryStock::where('item_id', $itemId)
                    ->where('location_id', $request->location_id)
                    ->first();

                $systemQuantity = $currentStock ? $currentStock->quantity : 0;
                $countedQuantity = $itemData['counted_quantity'];
                $variance = $countedQuantity - $systemQuantity;

                $stockCount->items()->create([
                    'item_id' => $itemId,
                    'system_quantity' => $systemQuantity,
                    'counted_quantity' => $countedQuantity,
                    'variance' => $variance,
                    'notes' => $itemData['notes'] ?? null,
                ]);
            }
        });

        return redirect('/inventory/stock-count')->with('success', 'Stock count created successfully.');
    }

    public function show(InventoryStockCount $stockCount)
    {
        $stockCount->load(['location', 'countedBy', 'items.item']);

        return Inertia::render('Inventory/StockCount/Show', [
            'stockCount' => $stockCount
        ]);
    }

    public function approve(InventoryStockCount $stockCount)
    {
        if ($stockCount->status !== 'draft') {
            return back()->withErrors(['error' => 'Only draft stock counts can be approved.']);
        }

        DB::transaction(function () use ($stockCount) {
            // Update stock count status
            $stockCount->update([
                'status' => 'approved',
                'approved_by' => Auth::id(),
                'approved_at' => now(),
            ]);

            // Apply variances to stock
            foreach ($stockCount->items as $item) {
                if ($item->variance != 0) {
                    $stock = InventoryStock::where('item_id', $item->item_id)
                        ->where('location_id', $stockCount->location_id)
                        ->first();

                    if ($stock) {
                        $stock->update([
                            'current_quantity' => $item->physical_count,
                            'total_value' => $item->physical_count * $stock->unit_cost,
                        ]);
                    }

                    // Create movement record
                    $stockCount->movements()->create([
                        'item_id' => $item->item_id,
                        'location_id' => $stockCount->location_id,
                        'movement_type' => 'adjustment',
                        'quantity' => abs($item->variance),
                        'movement_date' => $stockCount->count_date,
                        'reference' => $stockCount->reference_number,
                        'notes' => "Stock count adjustment: {$item->notes}",
                        'created_by' => Auth::id(),
                    ]);
                }
            }
        });

        return back()->with('success', 'Stock count approved and adjustments applied.');
    }

    public function reject(InventoryStockCount $stockCount)
    {
        if ($stockCount->status !== 'draft') {
            return back()->withErrors(['error' => 'Only draft stock counts can be rejected.']);
        }

        $stockCount->update([
            'status' => 'rejected',
            'approved_by' => Auth::id(),
            'approved_at' => now(),
        ]);

        return back()->with('success', 'Stock count rejected.');
    }

    public function destroy(InventoryStockCount $stockCount)
    {
        if ($stockCount->status === 'approved') {
            return back()->withErrors(['error' => 'Approved stock counts cannot be deleted.']);
        }

        $stockCount->items()->delete();
        $stockCount->delete();

        return redirect('/inventory/stock-count')->with('success', 'Stock count deleted successfully.');
    }

    public function getItemsForLocation($locationId)
    {
        $items = InventoryStock::with(['item.category'])
            ->where('location_id', $locationId)
            ->get()
            ->map(function ($stock) {
                return [
                    'id' => $stock->item->id,
                    'name' => $stock->item->name,
                    'code' => $stock->item->code,
                    'category' => $stock->item->category->name ?? 'Uncategorized',
                    'unit' => $stock->item->unit,
                    'current_stock' => $stock->current_quantity,
                ];
            });

        return response()->json($items);
    }
}
