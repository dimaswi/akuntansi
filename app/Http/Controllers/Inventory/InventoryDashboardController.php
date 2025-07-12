<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Inventory\InventoryItem;
use App\Models\Inventory\InventoryStock;
use App\Models\Inventory\InventoryCategory;
use App\Models\Inventory\InventoryLocation;
use App\Models\Inventory\InventoryMovement;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class InventoryDashboardController extends Controller
{
    public function index()
    {
        // Get summary statistics
        $totalItems = InventoryItem::active()->count();
        $totalCategories = InventoryCategory::active()->count();
        $totalLocations = InventoryLocation::active()->count();
        
        // Get total stock value
        $totalStockValue = InventoryStock::sum('total_value');
        
        // Get low stock items count
        $lowStockCount = InventoryItem::active()
            ->whereHas('stocks', function ($query) {
                $query->whereRaw('current_quantity <= reorder_level');
            })
            ->count();
        
        // Get recent movements (last 10)
        $recentMovements = InventoryMovement::with(['item', 'location', 'createdBy'])
            ->orderBy('movement_date', 'desc')
            ->limit(10)
            ->get();
        
        // Get stock by category
        $stockByCategory = InventoryCategory::withCount('items')
            ->with(['items' => function ($query) {
                $query->withSum('stocks', 'total_value');
            }])
            ->get()
            ->map(function ($category) {
                return [
                    'name' => $category->name,
                    'items_count' => $category->items_count,
                    'total_value' => $category->items->sum('stocks_sum_total_value') ?? 0
                ];
            });
        
        // Get stock by location
        $stockByLocation = InventoryLocation::active()
            ->withSum('stocks', 'total_value')
            ->withCount(['stocks as items_count'])
            ->get()
            ->map(function ($location) {
                return [
                    'name' => $location->name,
                    'items_count' => $location->items_count,
                    'total_value' => $location->stocks_sum_total_value ?? 0
                ];
            });
        
        // Get top items by value
        $topItemsByValue = InventoryItem::active()
            ->withSum('stocks', 'total_value')
            ->orderBy('stocks_sum_total_value', 'desc')
            ->limit(10)
            ->get(['id', 'code', 'name'])
            ->map(function ($item) {
                return [
                    'code' => $item->code,
                    'name' => $item->name,
                    'total_value' => $item->stocks_sum_total_value ?? 0
                ];
            });
        
        // Get movement trends (last 7 days)
        $movementTrends = InventoryMovement::select(
                DB::raw('DATE(movement_date) as date'),
                DB::raw('COUNT(*) as count'),
                'movement_type'
            )
            ->where('movement_date', '>=', now()->subDays(7))
            ->groupBy('date', 'movement_type')
            ->orderBy('date')
            ->get()
            ->groupBy('date')
            ->map(function ($movements, $date) {
                return [
                    'date' => $date,
                    'movements' => $movements->pluck('count', 'movement_type')->toArray()
                ];
            })
            ->values();

        return Inertia::render('Inventory/Dashboard', [
            'stockSummary' => [
                'total_items' => $totalItems,
                'total_categories' => $totalCategories,
                'low_stock_count' => $lowStockCount,
                'out_of_stock_count' => InventoryStock::where('current_quantity', 0)->count(),
                'total_value' => $totalStockValue,
                'recent_movements' => InventoryMovement::where('movement_date', '>=', now()->subDays(7))->count(),
            ],
            'lowStockItems' => InventoryItem::active()
                ->with(['category', 'stocks.location'])
                ->whereHas('stocks', function ($query) {
                    $query->whereRaw('current_quantity <= reorder_level');
                })
                ->limit(10)
                ->get()
                ->map(function ($item) {
                    $stock = $item->stocks->first();
                    return [
                        'id' => $item->id,
                        'name' => $item->name,
                        'code' => $item->code,
                        'current_stock' => $stock->current_quantity ?? 0,
                        'minimum_stock' => $stock->reorder_level ?? 0,
                        'location' => $stock->location->name ?? 'Unknown',
                        'category' => $item->category->name ?? 'Uncategorized',
                        'status' => ($stock->current_quantity ?? 0) == 0 ? 'out_of_stock' : 'low_stock'
                    ];
                }),
            'recentMovements' => $recentMovements->map(function ($movement) {
                return [
                    'id' => $movement->id,
                    'item_name' => $movement->item->name,
                    'type' => $movement->movement_type,
                    'quantity' => $movement->quantity,
                    'location' => $movement->location->name ?? 'Unknown',
                    'created_at' => $movement->movement_date->toISOString(),
                    'reference' => $movement->reference ?? 'N/A'
                ];
            }),
        ]);
    }

    public function getLowStockAlert()
    {
        $lowStockItems = InventoryItem::active()
            ->with(['category', 'stocks.location'])
            ->whereHas('stocks', function ($query) {
                $query->whereRaw('current_quantity <= reorder_level');
            })
            ->get();

        return response()->json($lowStockItems);
    }

    public function getStockSummary(Request $request)
    {
        $locationId = $request->get('location_id');
        $categoryId = $request->get('category_id');

        $query = InventoryStock::with(['item.category', 'location']);

        if ($locationId) {
            $query->where('location_id', $locationId);
        }

        if ($categoryId) {
            $query->whereHas('item', function ($itemQuery) use ($categoryId) {
                $itemQuery->where('category_id', $categoryId);
            });
        }

        $stocks = $query->where('current_quantity', '>', 0)
            ->orderBy('total_value', 'desc')
            ->get();

        return response()->json($stocks);
    }
}
