<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Inventory\Department;
use App\Models\Inventory\Item;
use App\Models\Inventory\ItemStock;
use App\Models\Inventory\Purchase;
use App\Models\Inventory\StockRequest;
use App\Models\Inventory\StockTransfer;
use App\Models\Inventory\StockOpname;
use App\Models\Inventory\StockAdjustment;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class InventoryDashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        // Get stats
        $stats = $this->getStats($user);
        
        // Get low stock items
        $lowStockItems = $this->getLowStockItems($user);
        
        // Get recent activities
        $recentActivities = $this->getRecentActivities($user);
        
        // Get stock by category
        $stockByCategory = $this->getStockByCategory($user);
        
        // Get pending approvals (for logistics/dept head)
        $pendingApprovals = $this->getPendingApprovals($user);
        
        // Get monthly stock movement
        $stockMovement = $this->getMonthlyStockMovement($user);
        
        // Get opname status
        $opnameStatus = $this->getOpnameStatus($user);
        
        return Inertia::render('inventory/dashboard', [
            'stats' => $stats,
            'lowStockItems' => $lowStockItems,
            'recentActivities' => $recentActivities,
            'stockByCategory' => $stockByCategory,
            'pendingApprovals' => $pendingApprovals,
            'stockMovement' => $stockMovement,
            'opnameStatus' => $opnameStatus,
        ]);
    }
    
    private function getStats($user)
    {
        $hasLogisticsRole = $user->hasRole(['logistik', 'super_admin']);
        
        if ($hasLogisticsRole) {
            // Central warehouse stats
            $totalItems = Item::aktif()->count();
            $totalStockValue = ItemStock::where('department_id', 1) // Assuming dept 1 is central warehouse
                ->with('item')
                ->get()
                ->sum(function($stock) {
                    return $stock->quantity_on_hand * ($stock->item->standard_cost ?? 0);
                });
            $lowStockCount = ItemStock::where('department_id', 1)
                ->whereHas('item', function($q) {
                    $q->whereRaw('item_stocks.quantity_on_hand <= items.reorder_level');
                })
                ->count();
            $pendingRequests = StockRequest::where('status', 'pending')->count();
        } else {
            // Department stats
            $totalItems = ItemStock::where('department_id', $user->department_id)
                ->where('quantity_on_hand', '>', 0)
                ->count();
            $totalStockValue = ItemStock::where('department_id', $user->department_id)
                ->with('item')
                ->get()
                ->sum(function($stock) {
                    return $stock->quantity_on_hand * ($stock->item->standard_cost ?? 0);
                });
            $lowStockCount = ItemStock::where('department_id', $user->department_id)
                ->whereHas('item', function($q) {
                    $q->whereRaw('item_stocks.quantity_on_hand <= items.reorder_level');
                })
                ->count();
            $pendingRequests = StockRequest::where('department_id', $user->department_id)
                ->whereIn('status', ['draft', 'pending'])
                ->count();
        }
        
        return [
            'total_items' => $totalItems,
            'total_stock_value' => $totalStockValue,
            'low_stock_count' => $lowStockCount,
            'pending_requests' => $pendingRequests,
        ];
    }
    
    private function getLowStockItems($user)
    {
        $hasLogisticsRole = $user->hasRole(['logistik', 'super_admin']);
        
        $query = ItemStock::with(['item', 'department'])
            ->join('items', 'item_stocks.item_id', '=', 'items.id')
            ->whereRaw('item_stocks.quantity_on_hand <= items.reorder_level')
            ->select('item_stocks.*')
            ->orderBy('item_stocks.quantity_on_hand', 'asc')
            ->limit(10);
            
        if (!$hasLogisticsRole) {
            $query->where('item_stocks.department_id', $user->department_id);
        }
        
        return $query->get()->map(function($stock) {
            return [
                'id' => $stock->id,
                'item_code' => $stock->item->code,
                'item_name' => $stock->item->name,
                'department' => $stock->department->name,
                'quantity' => $stock->quantity_on_hand,
                'min_stock' => $stock->item->reorder_level,
                'unit' => $stock->item->unit_of_measure,
                'shortage' => $stock->item->reorder_level - $stock->quantity_on_hand,
            ];
        });
    }
    
    private function getRecentActivities($user)
    {
        $hasLogisticsRole = $user->hasRole(['logistik', 'super_admin']);
        $activities = collect();
        
        // Stock Requests
        $requestsQuery = StockRequest::with(['department', 'items.item'])
            ->orderBy('created_at', 'desc')
            ->limit(5);
            
        if (!$hasLogisticsRole) {
            $requestsQuery->where('department_id', $user->department_id);
        }
        
        $requests = $requestsQuery->get()->map(function($req) {
            $itemCount = $req->items->count();
            return [
                'type' => 'stock_request',
                'title' => 'Stock Request ' . $req->request_number,
                'description' => 'Dari ' . $req->department->name . ' (' . $itemCount . ' items)',
                'status' => $req->status,
                'date' => $req->created_at,
                'user' => $req->department->name,
                'url' => route('stock-requests.show', $req->id),
            ];
        });
        
        $activities = $activities->merge($requests);
        
        // Stock Transfers
        $transfersQuery = StockTransfer::with(['fromDepartment', 'toDepartment', 'item'])
            ->orderBy('created_at', 'desc')
            ->limit(5);
            
        if (!$hasLogisticsRole) {
            $transfersQuery->where(function($q) use ($user) {
                $q->where('from_department_id', $user->department_id)
                  ->orWhere('to_department_id', $user->department_id);
            });
        }
        
        $transfers = $transfersQuery->get()->map(function($transfer) {
            return [
                'type' => 'stock_transfer',
                'title' => 'Stock Transfer ' . $transfer->nomor_transfer,
                'description' => ($transfer->fromDepartment ? $transfer->fromDepartment->name : 'Central') . ' → ' . $transfer->toDepartment->name,
                'status' => $transfer->status,
                'date' => $transfer->created_at,
                'user' => $transfer->item->name ?? 'System',
                'url' => route('stock-transfers.show', $transfer->id),
            ];
        });
        
        $activities = $activities->merge($transfers);
        
        // Stock Opnames
        $opnamesQuery = StockOpname::with(['department', 'creator'])
            ->orderBy('created_at', 'desc')
            ->limit(5);
            
        if (!$hasLogisticsRole) {
            $opnamesQuery->where('department_id', $user->department_id);
        }
        
        $opnames = $opnamesQuery->get()->map(function($opname) {
            return [
                'type' => 'stock_opname',
                'title' => 'Stock Opname ' . $opname->opname_number,
                'description' => 'Department ' . $opname->department->name,
                'status' => $opname->status,
                'date' => $opname->created_at,
                'user' => $opname->creator->name,
                'url' => route('stock-opnames.show', $opname->id),
            ];
        });
        
        $activities = $activities->merge($opnames);
        
        // Sort by date and take top 10
        return $activities->sortByDesc('date')->take(10)->values();
    }
    
    private function getStockByCategory($user)
    {
        $hasLogisticsRole = $user->hasRole(['logistik', 'super_admin']);
        
        $query = ItemStock::with(['item.category'])
            ->where('quantity_on_hand', '>', 0);
            
        if (!$hasLogisticsRole) {
            $query->where('department_id', $user->department_id);
        }
        
        $stocks = $query->get();
        
        $byCategory = $stocks->groupBy(function($stock) {
            return $stock->item->category->name ?? 'Uncategorized';
        })->map(function($items, $category) {
            return [
                'category' => $category,
                'total_items' => $items->count(),
                'total_quantity' => $items->sum('quantity_on_hand'),
                'total_value' => $items->sum(function($stock) {
                    return $stock->quantity_on_hand * ($stock->item->standard_cost ?? 0);
                }),
            ];
        })->values();
        
        return $byCategory;
    }
    
    private function getPendingApprovals($user)
    {
        $hasLogisticsRole = $user->hasRole(['logistik', 'super_admin']);
        $isDeptHead = $user->hasRole('ketua_department');
        
        if (!$hasLogisticsRole && !$isDeptHead) {
            return [
                'stock_requests' => 0,
                'stock_transfers' => 0,
                'stock_opnames' => 0,
                'purchases' => 0,
            ];
        }
        
        $data = [
            'stock_requests' => StockRequest::where('status', 'pending')->count(),
            'stock_transfers' => StockTransfer::where('status', 'pending')->count(),
            'purchases' => Purchase::where('status', 'pending')->count(),
        ];
        
        // Stock Opnames - can be approved by logistics OR dept head
        if ($hasLogisticsRole) {
            $data['stock_opnames'] = StockOpname::where('status', 'submitted')->count();
        } elseif ($isDeptHead) {
            $data['stock_opnames'] = StockOpname::where('status', 'submitted')
                ->where('department_id', $user->department_id)
                ->count();
        } else {
            $data['stock_opnames'] = 0;
        }
        
        return $data;
    }
    
    private function getMonthlyStockMovement($user)
    {
        $hasLogisticsRole = $user->hasRole(['logistik', 'super_admin']);
        $startDate = Carbon::now()->subMonths(6)->startOfMonth();
        $endDate = Carbon::now()->endOfMonth();
        
        $data = [];
        $current = $startDate->copy();
        
        while ($current <= $endDate) {
            $monthStart = $current->copy()->startOfMonth();
            $monthEnd = $current->copy()->endOfMonth();
            
            // Count movements for this month
            $requestsQuery = StockRequest::whereBetween('created_at', [$monthStart, $monthEnd])
                ->where('status', 'completed');
            $transfersQuery = StockTransfer::whereBetween('created_at', [$monthStart, $monthEnd])
                ->where('status', 'completed');
            $adjustmentsQuery = StockAdjustment::whereBetween('created_at', [$monthStart, $monthEnd]);
            
            if (!$hasLogisticsRole) {
                $requestsQuery->where('department_id', $user->department_id);
                $transfersQuery->where(function($q) use ($user) {
                    $q->where('from_department_id', $user->department_id)
                      ->orWhere('to_department_id', $user->department_id);
                });
                // Don't filter adjustments by department as it doesn't have department_id
            }
            
            $data[] = [
                'month' => $current->format('M Y'),
                'requests' => $requestsQuery->count(),
                'transfers' => $transfersQuery->count(),
                'adjustments' => $adjustmentsQuery->count(),
            ];
            
            $current->addMonth();
        }
        
        return $data;
    }
    
    private function getOpnameStatus($user)
    {
        $hasLogisticsRole = $user->hasRole(['logistik', 'super_admin']);
        $currentMonth = Carbon::now()->format('Y-m');
        
        if ($hasLogisticsRole) {
            // Show all departments opname status
            $departments = Department::aktif()->get();
            $status = $departments->map(function($dept) use ($currentMonth) {
                $hasOpname = StockOpname::hasMonthlyOpname($dept->id);
                $latestOpname = StockOpname::where('department_id', $dept->id)
                    ->where('status', 'approved')
                    ->orderBy('opname_date', 'desc')
                    ->first();
                
                return [
                    'department' => $dept->name,
                    'has_monthly_opname' => $hasOpname,
                    'last_opname_date' => $latestOpname ? $latestOpname->opname_date : null,
                    'status' => $hasOpname ? 'completed' : 'pending',
                ];
            });
        } else {
            // Show current department only
            // Check if user has department assigned
            if (!$user->department_id) {
                return collect([]);
            }
            
            $hasOpname = StockOpname::hasMonthlyOpname($user->department_id);
            $latestOpname = StockOpname::where('department_id', $user->department_id)
                ->where('status', 'approved')
                ->orderBy('opname_date', 'desc')
                ->first();
                
            $status = collect([[
                'department' => $user->department->name,
                'has_monthly_opname' => $hasOpname,
                'last_opname_date' => $latestOpname ? $latestOpname->opname_date : null,
                'status' => $hasOpname ? 'completed' : 'pending',
                'can_create' => !StockOpname::where('department_id', $user->department_id)
                    ->whereIn('status', ['draft', 'submitted'])
                    ->exists(),
            ]]);
        }
        
        return $status;
    }
}
