<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockRequestItem extends Model
{
    protected $fillable = [
        'stock_request_id',
        'item_id',
        'quantity_requested',
        'quantity_approved',
        'quantity_issued',
        'unit_cost',
        'total_cost',
        'notes',
        'approval_notes',
    ];

    protected $casts = [
        'quantity_requested' => 'float',
        'quantity_approved' => 'float',
        'quantity_issued' => 'float',
        'unit_cost' => 'decimal:2',
        'total_cost' => 'decimal:2',
    ];

    // Relations
    public function stockRequest(): BelongsTo
    {
        return $this->belongsTo(StockRequest::class);
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    // Helper methods
    public function getRemainingQuantity(): float
    {
        return $this->quantity_approved - $this->quantity_issued;
    }

    public function isFullyIssued(): bool
    {
        return $this->quantity_issued >= $this->quantity_approved;
    }

    public function calculateTotalCost(): void
    {
        $this->total_cost = $this->quantity_approved * $this->unit_cost;
        $this->save();
    }
}
