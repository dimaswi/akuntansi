<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Inventory\InventoryMovement;
use App\Models\Inventory\InventoryItem;
use App\Models\Inventory\InventoryLocation;
use App\Models\Inventory\InventoryStock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class InventoryMovementController extends Controller
{
    public function index(Request $request)
    {
        $query = InventoryMovement::with(['item', 'location', 'createdBy', 'approvedBy'])
            ->orderBy('created_at', 'desc');

        // Search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('movement_number', 'like', "%{$search}%")
                  ->orWhere('notes', 'like', "%{$search}%")
                  ->orWhereHas('item', function($itemQuery) use ($search) {
                      $itemQuery->where('name', 'like', "%{$search}%")
                               ->orWhere('sku', 'like', "%{$search}%");
                  });
            });
        }

        // Movement type filter
        if ($request->filled('movement_type')) {
            $query->where('movement_type', $request->movement_type);
        }

        // Status filter
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $movements = $query->paginate(20)->through(function ($movement) {
            return [
                'id' => $movement->id,
                'reference_number' => $movement->movement_number,
                'movement_type' => $movement->movement_type,
                'from_location' => $movement->movement_type === 'stock_out' ? $movement->location->name : null,
                'to_location' => $movement->movement_type === 'stock_in' ? $movement->location->name : null,
                'notes' => $movement->notes,
                'status' => $movement->status ?? 'approved',
                'total_items' => 1, // Single item per movement
                'movement_date' => $movement->movement_date,
                'created_by' => [
                    'name' => $movement->createdBy->name ?? 'Unknown'
                ],
                'approved_by' => $movement->approvedBy ? [
                    'name' => $movement->approvedBy->name
                ] : null,
                'created_at' => $movement->created_at,
            ];
        });

        return Inertia::render('Inventory/Movements/Index', [
            'movements' => $movements,
            'filters' => $request->only(['search', 'movement_type', 'status']),
        ]);
    }

    public function create()
    {
        $items = InventoryItem::select('id', 'name', 'sku', 'unit')
            ->with(['stocks' => function($query) {
                $query->select('item_id', DB::raw('SUM(current_quantity) as total_stock'))
                      ->groupBy('item_id');
            }])
            ->orderBy('name')
            ->get()
            ->map(function($item) {
                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'sku' => $item->sku,
                    'unit' => $item->unit,
                    'current_stock' => $item->stocks->sum('total_stock') ?? 0,
                ];
            });

        $locations = InventoryLocation::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('inventory/movements/create', [
            'items' => $items,
            'locations' => $locations->pluck('name')->toArray(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'movement_type' => 'required|in:in,out,transfer,adjustment',
            'movement_date' => 'required|date',
            'from_location' => 'required_if:movement_type,out,transfer',
            'to_location' => 'required_if:movement_type,in,transfer',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:inventory_items,id',
            'items.*.quantity' => 'required|numeric|min:1',
            'items.*.notes' => 'nullable|string',
        ]);

        // Map movement types to database values
        $movementTypeMap = [
            'in' => 'stock_in',
            'out' => 'stock_out',
            'transfer' => 'transfer_in', // We'll create both transfer_in and transfer_out
            'adjustment' => 'adjustment_plus', // We'll determine plus/minus based on quantity
        ];

        DB::transaction(function() use ($request, $movementTypeMap) {
            $movementDate = $request->movement_date;
            $counter = 1;

            foreach ($request->items as $itemData) {
                $movementNumber = 'MOV-' . date('Ymd', strtotime($movementDate)) . '-' . str_pad($counter, 4, '0', STR_PAD_LEFT);
                
                // Determine location
                $locationName = null;
                if ($request->movement_type === 'in' || $request->movement_type === 'transfer') {
                    $locationName = $request->to_location;
                } elseif ($request->movement_type === 'out') {
                    $locationName = $request->from_location;
                } else { // adjustment
                    $locationName = $request->to_location ?: $request->from_location;
                }

                $location = InventoryLocation::where('name', $locationName)->first();
                if (!$location) {
                    // Create location if not exists
                    $location = InventoryLocation::create([
                        'code' => strtoupper(str_replace(' ', '_', $locationName)),
                        'name' => $locationName,
                        'location_type' => 'warehouse',
                        'is_active' => true,
                    ]);
                }

                // Create movement
                InventoryMovement::create([
                    'movement_number' => $movementNumber,
                    'item_id' => $itemData['item_id'],
                    'location_id' => $location->id,
                    'movement_type' => $movementTypeMap[$request->movement_type],
                    'transaction_type' => 'stock_adjustment',
                    'quantity' => $itemData['quantity'],
                    'movement_date' => $movementDate,
                    'notes' => $itemData['notes'] ?? $request->notes,
                    'created_by' => Auth::id(),
                    'status' => 'pending',
                ]);

                $counter++;
            }
        });

        return redirect()->route('inventory.movements.index')
            ->with('success', 'Stock movement created successfully. Waiting for approval.');
    }

    public function show($id)
    {
        $movement = InventoryMovement::with(['item', 'location', 'createdBy', 'approvedBy'])
            ->findOrFail($id);

        return Inertia::render('inventory/movements/show', [
            'movement' => [
                'id' => $movement->id,
                'reference_number' => $movement->movement_number,
                'movement_type' => $movement->movement_type,
                'from_location' => $movement->movement_type === 'stock_out' ? $movement->location->name : null,
                'to_location' => $movement->movement_type === 'stock_in' ? $movement->location->name : null,
                'movement_date' => $movement->movement_date,
                'notes' => $movement->notes,
                'status' => $movement->status ?? 'approved',
                'created_by' => [
                    'name' => $movement->createdBy->name ?? 'Unknown'
                ],
                'approved_by' => $movement->approvedBy ? [
                    'name' => $movement->approvedBy->name
                ] : null,
                'items' => [[
                    'id' => $movement->id,
                    'item' => [
                        'name' => $movement->item->name,
                        'sku' => $movement->item->sku,
                        'unit' => $movement->item->unit,
                    ],
                    'quantity' => $movement->quantity,
                    'notes' => $movement->notes,
                ]],
                'created_at' => $movement->created_at,
                'updated_at' => $movement->updated_at,
            ]
        ]);
    }

    public function approve($id)
    {
        $movement = InventoryMovement::where('status', 'pending')
            ->findOrFail($id);

        DB::transaction(function() use ($movement) {
            // Update stock based on movement type
            $this->updateStock($movement);

            $movement->update([
                'status' => 'approved',
                'approved_by' => Auth::id(),
                'approved_at' => now(),
            ]);
        });

        return redirect()->back()
            ->with('success', 'Stock movement approved and stock updated successfully.');
    }

    public function reject(Request $request, $id)
    {
        $movement = InventoryMovement::where('status', 'pending')->findOrFail($id);

        $movement->update([
            'status' => 'rejected',
            'approved_by' => Auth::id(),
            'approved_at' => now(),
        ]);

        return redirect()->back()
            ->with('success', 'Stock movement rejected.');
    }

    private function updateStock($movement)
    {
        $stock = InventoryStock::firstOrCreate([
            'item_id' => $movement->item_id,
            'location_id' => $movement->location_id,
        ], [
            'current_quantity' => 0,
            'reserved_quantity' => 0,
            'available_quantity' => 0,
        ]);

        switch ($movement->movement_type) {
            case 'stock_in':
            case 'transfer_in':
            case 'adjustment_plus':
                $stock->current_quantity += $movement->quantity;
                break;
            case 'stock_out':
            case 'transfer_out':
            case 'adjustment_minus':
                $stock->current_quantity -= $movement->quantity;
                break;
        }

        $stock->available_quantity = $stock->current_quantity - $stock->reserved_quantity;
        $stock->last_movement_at = now();
        $stock->save();
    }
}