<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class InventoryReportController extends Controller
{
    public function index()
    {
        return Inertia::render('Inventory/Reports/Index');
    }

    public function stockLevel()
    {
        $locations = DB::table('inventory_locations')
            ->select('id', 'name', 'code')
            ->orderBy('name')
            ->get();

        $items = DB::table('inventory_items')
            ->select('id', 'name', 'code', 'unit_of_measure', 'reorder_level')
            ->orderBy('name')
            ->get();

        return Inertia::render('Inventory/Reports/StockLevel', [
            'locations' => $locations,
            'items' => $items
        ]);
    }

    public function stockLevelData(Request $request)
    {
        $query = DB::table('inventory_items as i')
            ->leftJoin('inventory_stock as s', 'i.id', '=', 's.item_id')
            ->leftJoin('inventory_locations as l', 's.location_id', '=', 'l.id')
            ->select(
                'i.id',
                'i.name as item_name',
                'i.code',
                'i.unit_of_measure',
                'i.reorder_level',
                'l.name as location_name',
                'l.code as location_code',
                DB::raw('COALESCE(s.quantity, 0) as current_stock'),
                DB::raw('COALESCE(i.standard_cost, 0) as average_cost'),
                DB::raw('COALESCE(s.quantity, 0) * COALESCE(i.standard_cost, 0) as value'),
                DB::raw('NOW() as last_updated'),
                DB::raw('CASE 
                    WHEN COALESCE(s.quantity, 0) <= i.reorder_level THEN "low"
                    WHEN COALESCE(s.quantity, 0) = 0 THEN "out"
                    ELSE "normal"
                END as stock_status')
            );

        // Filter berdasarkan lokasi
        if ($request->location_id && $request->location_id !== 'all') {
            $query->where('s.location_id', $request->location_id);
        }

        // Filter berdasarkan item
        if ($request->item_id && $request->item_id !== 'all') {
            $query->where('i.id', $request->item_id);
        }

        // Filter berdasarkan status stok
        if ($request->stock_status && $request->stock_status !== 'all') {
            if ($request->stock_status === 'low') {
                $query->whereRaw('COALESCE(s.quantity, 0) <= i.reorder_level AND COALESCE(s.quantity, 0) > 0');
            } elseif ($request->stock_status === 'out') {
                $query->whereRaw('COALESCE(s.quantity, 0) = 0');
            } elseif ($request->stock_status === 'normal') {
                $query->whereRaw('COALESCE(s.quantity, 0) > i.reorder_level');
            }
        }

        // Search
        if ($request->search) {
            $query->where(function($q) use ($request) {
                $q->where('i.name', 'like', '%' . $request->search . '%')
                  ->orWhere('i.code', 'like', '%' . $request->search . '%')
                  ->orWhere('l.name', 'like', '%' . $request->search . '%');
            });
        }

        $stockLevels = $query->orderBy('i.name')->get();

        return response()->json([
            'data' => $stockLevels,
            'summary' => [
                'total_items' => $stockLevels->count(),
                'low_stock' => $stockLevels->where('stock_status', 'low')->count(),
                'out_of_stock' => $stockLevels->where('stock_status', 'out')->count(),
                'normal_stock' => $stockLevels->where('stock_status', 'normal')->count()
            ]
        ]);
    }

    public function movementHistory()
    {
        $locations = DB::table('inventory_locations')
            ->select('id', 'name', 'code')
            ->orderBy('name')
            ->get();

        $items = DB::table('inventory_items')
            ->select('id', 'name', 'code')
            ->orderBy('name')
            ->get();

        return Inertia::render('Inventory/Reports/MovementHistory', [
            'locations' => $locations,
            'items' => $items
        ]);
    }

    public function movementHistoryData(Request $request)
    {
        $query = DB::table('inventory_movements as m')
            ->join('inventory_items as i', 'm.item_id', '=', 'i.id')
            ->join('inventory_locations as l', 'm.location_id', '=', 'l.id')
            ->join('users as u', 'm.created_by', '=', 'u.id')
            ->leftJoin('users as approver', 'm.approved_by', '=', 'approver.id')
            ->select(
                'm.id',
                'm.movement_number',
                'i.name as item_name',
                'i.code',
                'l.name as location_name',
                'l.code as location_code',
                'm.movement_type',
                'm.transaction_type',
                'm.quantity',
                'm.unit_cost',
                'm.total_cost',
                'm.movement_date',
                'm.batch_number',
                'm.expiry_date',
                'm.notes',
                'u.name as created_by_name',
                'approver.name as approved_by_name',
                'm.approved_at',
                'm.created_at'
            );

        // Filter berdasarkan tanggal
        if ($request->date_from) {
            $query->whereDate('m.movement_date', '>=', $request->date_from);
        }

        if ($request->date_to) {
            $query->whereDate('m.movement_date', '<=', $request->date_to);
        }

        // Filter berdasarkan lokasi
        if ($request->location_id && $request->location_id !== 'all') {
            $query->where('m.location_id', $request->location_id);
        }

        // Filter berdasarkan item
        if ($request->item_id && $request->item_id !== 'all') {
            $query->where('m.item_id', $request->item_id);
        }

        // Filter berdasarkan jenis perpindahan
        if ($request->movement_type && $request->movement_type !== 'all') {
            $query->where('m.movement_type', $request->movement_type);
        }

        // Search
        if ($request->search) {
            $query->where(function($q) use ($request) {
                $q->where('m.movement_number', 'like', '%' . $request->search . '%')
                  ->orWhere('i.name', 'like', '%' . $request->search . '%')
                  ->orWhere('i.code', 'like', '%' . $request->search . '%')
                  ->orWhere('l.name', 'like', '%' . $request->search . '%');
            });
        }

        $movements = $query->orderBy('m.movement_date', 'desc')
                          ->orderBy('m.created_at', 'desc')
                          ->get();

        // Hitung summary
        $summary = [
            'total_movements' => $movements->count(),
            'total_value' => $movements->sum('total_cost'),
            'stock_in' => $movements->whereIn('movement_type', ['in', 'transfer'])->sum('quantity'),
            'stock_out' => $movements->whereIn('movement_type', ['out', 'adjustment'])->sum('quantity')
        ];

        return response()->json([
            'data' => $movements,
            'summary' => $summary
        ]);
    }

    public function stockValuation()
    {
        $locations = DB::table('inventory_locations')
            ->select('id', 'name', 'code')
            ->orderBy('name')
            ->get();

        return Inertia::render('Inventory/Reports/StockValuation', [
            'locations' => $locations
        ]);
    }

    public function stockValuationData(Request $request)
    {
        $query = DB::table('inventory_stock as s')
            ->join('inventory_items as i', 's.item_id', '=', 'i.id')
            ->join('inventory_locations as l', 's.location_id', '=', 'l.id')
            ->select(
                'i.id as item_id',
                'i.name as item_name',
                'i.code',
                'i.unit_of_measure',
                'l.name as location_name',
                'l.code as location_code',
                's.quantity',
                's.average_cost',
                DB::raw('s.quantity * s.average_cost as total_value')
            )
            ->where('s.quantity', '>', 0);

        // Filter berdasarkan lokasi
        if ($request->location_id && $request->location_id !== 'all') {
            $query->where('s.location_id', $request->location_id);
        }

        // Search
        if ($request->search) {
            $query->where(function($q) use ($request) {
                $q->where('i.name', 'like', '%' . $request->search . '%')
                  ->orWhere('i.code', 'like', '%' . $request->search . '%')
                  ->orWhere('l.name', 'like', '%' . $request->search . '%');
            });
        }

        $stockValuation = $query->orderBy('total_value', 'desc')->get();

        $summary = [
            'total_items' => $stockValuation->count(),
            'total_quantity' => $stockValuation->sum('quantity'),
            'total_value' => $stockValuation->sum('total_value'),
            'average_value_per_item' => $stockValuation->count() > 0 ? $stockValuation->sum('total_value') / $stockValuation->count() : 0
        ];

        return response()->json([
            'data' => $stockValuation,
            'summary' => $summary
        ]);
    }

    public function exportStockLevel(Request $request)
    {
        // Implementation untuk export Excel/PDF
        // Bisa menggunakan Laravel Excel atau DomPDF
        return response()->json(['message' => 'Export fitur akan segera tersedia']);
    }

    public function exportMovementHistory(Request $request)
    {
        // Implementation untuk export Excel/PDF
        return response()->json(['message' => 'Export fitur akan segera tersedia']);
    }

    public function exportStockValuation(Request $request)
    {
        // Implementation untuk export Excel/PDF
        return response()->json(['message' => 'Export fitur akan segera tersedia']);
    }
}
