<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockOpnameItem extends Model
{
    protected $fillable = [
        'stock_opname_id',
        'item_id',
        'system_quantity',
        'physical_quantity',
        'variance',
        'unit_price',
        'variance_value',
        'notes',
    ];

    protected $casts = [
        'system_quantity' => 'decimal:2',
        'physical_quantity' => 'decimal:2',
        'variance' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'variance_value' => 'decimal:2',
    ];

    // Relationships
    public function stockOpname(): BelongsTo
    {
        return $this->belongsTo(StockOpname::class);
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    /**
     * Get variance status
     */
    public function getVarianceStatusAttribute(): string
    {
        if ($this->variance > 0) {
            return 'surplus'; // Lebih banyak dari sistem
        } elseif ($this->variance < 0) {
            return 'shortage'; // Kurang dari sistem
        }
        return 'match'; // Sesuai
    }

    /**
     * Get absolute variance
     */
    public function getAbsoluteVarianceAttribute(): float
    {
        return abs($this->variance);
    }
}
