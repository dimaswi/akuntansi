<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Inventory\ItemStock;
use App\Services\Inventory\ItemStockService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CentralWarehouseController extends Controller
{
    protected $itemStockService;

    public function __construct(ItemStockService $itemStockService)
    {
        $this->itemStockService = $itemStockService;
    }

    /**
     * Display central warehouse stock listing
     */
    public function index(Request $request)
    {
        $query = ItemStock::with(['item.category'])
            ->whereNull('item_stocks.department_id'); // Central warehouse - add table prefix

        // Search by item name or code
        if ($request->filled('search')) {
            $query->whereHas('item', function($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('code', 'like', '%' . $request->search . '%');
            });
        }

        // Filter by low stock
        if ($request->boolean('low_stock')) {
            $query->whereHas('item', function($q) {
                $q->whereRaw('item_stocks.quantity_on_hand <= items.reorder_level');
            });
        }

        // Filter by has reserved
        if ($request->boolean('has_reserved')) {
            $query->where('item_stocks.reserved_quantity', '>', 0);
        }

        // Sort
        $sortBy = $request->get('sort_by', 'item_code');
        $sortOrder = $request->get('sort_order', 'asc');
        
        if ($sortBy === 'item_code') {
            $query->join('items', 'item_stocks.item_id', '=', 'items.id')
                  ->orderBy('items.code', $sortOrder)
                  ->select('item_stocks.*');
        } else {
            $query->orderBy('item_stocks.' . $sortBy, $sortOrder);
        }

        $stocks = $query->paginate(10)->withQueryString();

        // Transform stocks data
        $stocks->getCollection()->transform(function ($stock) {
            return [
                'id' => $stock->id,
                'item_id' => $stock->item_id,
                'item' => [
                    'id' => $stock->item->id,
                    'code' => $stock->item->code,
                    'name' => $stock->item->name,
                    'unit_of_measure' => $stock->item->unit,
                    'category' => $stock->item->category,
                    'reorder_level' => $stock->item->reorder_level,
                    'safety_stock' => $stock->item->safety_stock,
                ],
                'quantity_on_hand' => (float) $stock->quantity_on_hand,
                'reserved_quantity' => (float) $stock->reserved_quantity,
                'available_quantity' => (float) $stock->available_quantity,
                'last_unit_cost' => (float) $stock->last_unit_cost,
                'average_unit_cost' => (float) $stock->average_unit_cost,
                'total_value' => (float) $stock->total_value,
                'last_updated_at' => $stock->last_updated_at?->format('Y-m-d H:i'),
            ];
        });

        // Get summary
        $summary = [
            'total_items' => ItemStock::whereNull('item_stocks.department_id')->count(),
            'total_quantity' => (float) ItemStock::whereNull('item_stocks.department_id')->sum('quantity_on_hand'),
            'total_available' => (float) ItemStock::whereNull('item_stocks.department_id')->sum('available_quantity'),
            'total_reserved' => (float) ItemStock::whereNull('item_stocks.department_id')->sum('reserved_quantity'),
            'total_value' => (float) ItemStock::whereNull('item_stocks.department_id')->sum('total_value'),
            'low_stock_items' => ItemStock::whereNull('item_stocks.department_id')
                ->whereHas('item', function($q) {
                    $q->whereRaw('item_stocks.quantity_on_hand <= items.reorder_level');
                })
                ->count(),
        ];

        return Inertia::render('inventory/central-warehouse/index', [
            'stocks' => $stocks,
            'summary' => $summary,
            'filters' => [
                'search' => $request->search,
                'low_stock' => $request->boolean('low_stock'),
                'has_reserved' => $request->boolean('has_reserved'),
                'sort_by' => $sortBy,
                'sort_order' => $sortOrder,
            ],
        ]);
    }
}
