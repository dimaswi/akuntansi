<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class StockMovement extends Model
{
    use HasFactory;

    protected $fillable = [
        'item_id',
        'department_id',
        'user_id',
        'reference_type',
        'reference_id',
        'reference_number',
        'movement_type',
        'transaction_type',
        'quantity',
        'unit_cost',
        'total_cost',
        'stock_before',
        'stock_after',
        'batch_number',
        'expiry_date',
        'notes',
        'movement_date',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'unit_cost' => 'decimal:2',
        'total_cost' => 'decimal:2',
        'stock_before' => 'decimal:2',
        'stock_after' => 'decimal:2',
        'expiry_date' => 'date',
        'movement_date' => 'datetime',
    ];

    // Relationships
    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function reference()
    {
        return $this->morphTo();
    }

    // Scopes
    public function scopeIncoming($query)
    {
        return $query->where('movement_type', 'in');
    }

    public function scopeOutgoing($query)
    {
        return $query->where('movement_type', 'out');
    }

    public function scopePurchases($query)
    {
        return $query->where('transaction_type', 'purchase');
    }

    public function scopeForItem($query, $itemId)
    {
        return $query->where('item_id', $itemId);
    }

    public function scopeForDepartment($query, $departmentId)
    {
        return $query->where('department_id', $departmentId);
    }

    // Helper methods
    public static function createFromPurchase($purchaseItem, $receivedQuantity, $unitCost, $userId)
    {
        $item = $purchaseItem->item;
        
        // Get current stock from central warehouse (item_stocks table)
        $centralStock = \App\Models\Inventory\ItemStock::where('item_id', $item->id)
            ->where('department_id', null)
            ->first();
        
        $currentStock = $centralStock ? $centralStock->quantity_on_hand : 0;
        
        return static::create([
            'item_id' => $item->id,
            'department_id' => null, // Purchase receive to central warehouse (no department)
            'user_id' => $userId,
            'reference_type' => Purchase::class,
            'reference_id' => $purchaseItem->purchase_id,
            'reference_number' => $purchaseItem->purchase->purchase_number,
            'movement_type' => 'in',
            'transaction_type' => 'purchase',
            'quantity' => $receivedQuantity,
            'unit_cost' => $unitCost,
            'total_cost' => $receivedQuantity * $unitCost,
            'stock_before' => $currentStock,
            'stock_after' => $currentStock + $receivedQuantity,
            'batch_number' => $purchaseItem->batch_number,
            'expiry_date' => $purchaseItem->expiry_date,
            'movement_date' => now(),
        ]);
    }
}
