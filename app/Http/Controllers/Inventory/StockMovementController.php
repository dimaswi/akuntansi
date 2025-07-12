<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class StockMovementController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = DB::table('inventory_movements as im')
            ->join('inventory_items as i', 'im.item_id', '=', 'i.id')
            ->join('inventory_locations as l', 'im.location_id', '=', 'l.id')
            ->join('users as u', 'im.created_by', '=', 'u.id')
            ->leftJoin('users as approver', 'im.approved_by', '=', 'approver.id')
            ->select([
                'im.*',
                'i.name as item_name',
                'i.code as item_code',
                'l.name as location_name',
                'l.code as location_code',
                'u.name as created_by_name',
                'approver.name as approved_by_name'
            ]);

        // Filter berdasarkan pencarian
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('im.movement_number', 'like', "%{$search}%")
                  ->orWhere('i.name', 'like', "%{$search}%")
                  ->orWhere('i.code', 'like', "%{$search}%")
                  ->orWhere('l.name', 'like', "%{$search}%");
            });
        }

        // Filter berdasarkan jenis perpindahan
        if ($request->filled('movement_type')) {
            $query->where('im.movement_type', $request->movement_type);
        }

        // Filter berdasarkan lokasi
        if ($request->filled('location')) {
            $query->where('im.location_id', $request->location);
        }

        // Filter berdasarkan tanggal
        if ($request->filled('date_from')) {
            $query->where('im.movement_date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->where('im.movement_date', '<=', $request->date_to);
        }

        $movements = $query->orderBy('im.movement_date', 'desc')
                          ->orderBy('im.created_at', 'desc')
                          ->paginate(15)
                          ->withQueryString();

        // Data untuk filter
        $locations = DB::table('inventory_locations')
                      ->where('is_active', true)
                      ->select('id', 'name', 'code')
                      ->orderBy('name')
                      ->get();

        return Inertia::render('Inventory/Movements/Index', [
            'movements' => $movements,
            'locations' => $locations,
            'filters' => $request->only(['search', 'movement_type', 'location', 'date_from', 'date_to'])
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        // Data untuk form
        $items = DB::table('inventory_items as i')
                  ->join('inventory_categories as c', 'i.category_id', '=', 'c.id')
                  ->where('i.is_active', true)
                  ->select([
                      'i.id',
                      'i.name',
                      'i.code',
                      'i.unit_of_measure',
                      'c.name as category_name'
                  ])
                  ->orderBy('i.name')
                  ->get();

        $locations = DB::table('inventory_locations')
                      ->where('is_active', true)
                      ->select('id', 'name', 'code', 'location_type')
                      ->orderBy('name')
                      ->get();

        return Inertia::render('Inventory/Movements/Create', [
            'items' => $items,
            'locations' => $locations
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'item_id' => 'required|exists:inventory_items,id',
            'location_id' => 'required|exists:inventory_locations,id',
            'movement_type' => 'required|in:stock_in,stock_out,transfer_in,transfer_out,adjustment_plus,adjustment_minus,return,disposal',
            'transaction_type' => 'required|in:purchase_receipt,sales_issue,department_requisition,inter_location_transfer,stock_adjustment,stock_count,expired_disposal,damage_writeoff,return_to_supplier',
            'quantity' => 'required|numeric|min:0.01',
            'unit_cost' => 'nullable|numeric|min:0',
            'movement_date' => 'required|date',
            'batch_number' => 'nullable|string|max:50',
            'expiry_date' => 'nullable|date|after:today',
            'notes' => 'nullable|string|max:1000'
        ]);

        DB::beginTransaction();

        try {
            // Generate nomor perpindahan
            $movementNumber = $this->generateMovementNumber();

            // Hitung total cost
            $totalCost = $request->quantity * ($request->unit_cost ?? 0);

            // Buat record perpindahan
            $movementId = DB::table('inventory_movements')->insertGetId([
                'movement_number' => $movementNumber,
                'item_id' => $request->item_id,
                'location_id' => $request->location_id,
                'movement_type' => $request->movement_type,
                'transaction_type' => $request->transaction_type,
                'quantity' => $request->quantity,
                'unit_cost' => $request->unit_cost ?? 0,
                'total_cost' => $totalCost,
                'batch_number' => $request->batch_number,
                'expiry_date' => $request->expiry_date,
                'movement_date' => $request->movement_date,
                'notes' => $request->notes,
                'created_by' => Auth::id(),
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // Update stok
            $this->updateStock($request->item_id, $request->location_id, $request->movement_type, $request->quantity);

            DB::commit();

            return redirect()->route('inventory.stock-movements.index')
                           ->with('success', 'Perpindahan stok berhasil dicatat.');

        } catch (\Exception $e) {
            DB::rollback();
            return back()->withErrors(['error' => 'Gagal menyimpan perpindahan stok: ' . $e->getMessage()]);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): Response
    {
        $movement = DB::table('inventory_movements as im')
            ->join('inventory_items as i', 'im.item_id', '=', 'i.id')
            ->join('inventory_locations as l', 'im.location_id', '=', 'l.id')
            ->join('users as u', 'im.created_by', '=', 'u.id')
            ->leftJoin('users as approver', 'im.approved_by', '=', 'approver.id')
            ->where('im.id', $id)
            ->select([
                'im.*',
                'i.name as item_name',
                'i.code as item_code',
                'i.unit_of_measure',
                'l.name as location_name',
                'l.code as location_code',
                'u.name as created_by_name',
                'approver.name as approved_by_name'
            ])
            ->first();

        if (!$movement) {
            abort(404);
        }

        return Inertia::render('Inventory/Movements/Show', [
            'movement' => $movement
        ]);
    }

    /**
     * Generate nomor perpindahan unik
     */
    private function generateMovementNumber(): string
    {
        $date = Carbon::now()->format('Ymd');
        $lastNumber = DB::table('inventory_movements')
                       ->where('movement_number', 'like', "MOV-{$date}-%")
                       ->orderBy('movement_number', 'desc')
                       ->value('movement_number');

        if ($lastNumber) {
            $sequence = intval(substr($lastNumber, -4)) + 1;
        } else {
            $sequence = 1;
        }

        return sprintf('MOV-%s-%04d', $date, $sequence);
    }

    /**
     * Update stok berdasarkan jenis perpindahan
     */
    private function updateStock(int $itemId, int $locationId, string $movementType, float $quantity): void
    {
        // Cari atau buat record stok
        $stock = DB::table('inventory_stocks')
                  ->where('item_id', $itemId)
                  ->where('location_id', $locationId)
                  ->first();

        if (!$stock) {
            // Buat record stok baru
            DB::table('inventory_stocks')->insert([
                'item_id' => $itemId,
                'location_id' => $locationId,
                'current_quantity' => 0,
                'reserved_quantity' => 0,
                'available_quantity' => 0,
                'average_cost' => 0,
                'total_value' => 0,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            $currentQuantity = 0;
        } else {
            $currentQuantity = $stock->current_quantity;
        }

        // Hitung kuantitas baru berdasarkan jenis perpindahan
        $newQuantity = $currentQuantity;
        
        switch ($movementType) {
            case 'stock_in':
            case 'transfer_in':
            case 'adjustment_plus':
            case 'return':
                $newQuantity += $quantity;
                break;
                
            case 'stock_out':
            case 'transfer_out':
            case 'adjustment_minus':
            case 'disposal':
                $newQuantity -= $quantity;
                break;
        }

        // Pastikan stok tidak negatif
        $newQuantity = max(0, $newQuantity);

        // Update record stok
        DB::table('inventory_stocks')
          ->where('item_id', $itemId)
          ->where('location_id', $locationId)
          ->update([
              'current_quantity' => $newQuantity,
              'available_quantity' => $newQuantity, // Simplified, nanti bisa dikembangkan untuk reserved
              'last_movement_at' => now(),
              'updated_at' => now()
          ]);
    }
}
