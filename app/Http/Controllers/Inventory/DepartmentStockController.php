<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Inventory\Department;
use App\Services\Inventory\ItemStockService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DepartmentStockController extends Controller
{
    protected $itemStockService;

    public function __construct(ItemStockService $itemStockService)
    {
        $this->itemStockService = $itemStockService;
    }

    /**
     * Display a listing of department stocks
     */
    public function index(Request $request)
    {
        $query = Department::query()->with(['itemStocks.item']);

        // Filter by department if specified
        if ($request->filled('department_id')) {
            $query->where('id', $request->department_id);
        }

        // Search by department name
        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $departments = $query->paginate(10)->withQueryString();

        // Calculate totals for each department
        $departments->getCollection()->transform(function ($department) {
            $stocks = $department->itemStocks;
            
            return [
                'id' => $department->id,
                'name' => $department->name,
                'code' => $department->code,
                'total_items' => $stocks->count(),
                'total_quantity' => (float) $stocks->sum('quantity_on_hand'),
                'total_value' => (float) $stocks->sum('total_value'),
                'items_count' => $stocks->count(),
            ];
        });

        return Inertia::render('inventory/department-stocks/index', [
            'departments' => $departments,
            'filters' => [
                'search' => $request->search,
                'department_id' => $request->department_id,
            ],
            'allDepartments' => Department::select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    /**
     * Display department stock details
     */
    public function show(Request $request, Department $department)
    {
        $query = $department->itemStocks()->with(['item']);

        // Search by item name or code
        if ($request->filled('search')) {
            $query->whereHas('item', function($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('code', 'like', '%' . $request->search . '%');
            });
        }

        // Filter by low stock
        if ($request->boolean('low_stock')) {
            $query->whereRaw('available_quantity <= (quantity_on_hand * 0.2)');
        }

        // Sort
        $sortBy = $request->get('sort_by', 'item_code');
        $sortOrder = $request->get('sort_order', 'asc');
        
        if ($sortBy === 'item_code') {
            $query->join('items', 'item_stocks.item_id', '=', 'items.id')
                  ->orderBy('items.code', $sortOrder)
                  ->select('item_stocks.*');
        } else {
            $query->orderBy($sortBy, $sortOrder);
        }

        $stocks = $query->paginate(15)->withQueryString();

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
            'total_items' => $department->itemStocks()->count(),
            'total_quantity' => (float) $department->itemStocks()->sum('quantity_on_hand'),
            'total_available' => (float) $department->itemStocks()->sum('available_quantity'),
            'total_reserved' => (float) $department->itemStocks()->sum('reserved_quantity'),
            'total_value' => (float) $department->itemStocks()->sum('total_value'),
            'low_stock_items' => $department->itemStocks()
                ->whereRaw('available_quantity <= (quantity_on_hand * 0.2)')
                ->count(),
        ];

        return Inertia::render('inventory/department-stocks/show', [
            'department' => [
                'id' => $department->id,
                'name' => $department->name,
                'code' => $department->code,
            ],
            'stocks' => $stocks,
            'summary' => $summary,
            'filters' => [
                'search' => $request->search,
                'low_stock' => $request->boolean('low_stock'),
                'sort_by' => $sortBy,
                'sort_order' => $sortOrder,
            ],
        ]);
    }
}
