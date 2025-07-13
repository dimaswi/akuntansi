<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_id',
        'item_id',
        'quantity_ordered',
        'quantity_received',
        'unit_price',
        'total_price',
        'batch_number',
        'expiry_date',
        'notes',
        'item_status',
        'received_at',
    ];

    protected $casts = [
        'quantity_ordered' => 'decimal:2',
        'quantity_received' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'total_price' => 'decimal:2',
        'expiry_date' => 'date',
        'received_at' => 'datetime',
    ];

    // Relationships
    public function purchase()
    {
        return $this->belongsTo(Purchase::class);
    }

    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    // Helper methods
    public function remainingQuantity()
    {
        return $this->quantity_ordered - $this->quantity_received;
    }

    public function isFullyReceived()
    {
        return $this->quantity_received >= $this->quantity_ordered;
    }

    public function canReceiveMore()
    {
        return $this->quantity_received < $this->quantity_ordered;
    }

    public function calculateTotalPrice()
    {
        $this->total_price = $this->quantity_ordered * $this->unit_price;
        $this->save();
    }

    // Update status based on received quantity
    public function updateStatus()
    {
        if ($this->quantity_received == 0) {
            $this->item_status = 'pending';
        } elseif ($this->quantity_received < $this->quantity_ordered) {
            $this->item_status = 'partial';
        } else {
            $this->item_status = 'completed';
            $this->received_at = now();
        }
        $this->save();
    }
}
