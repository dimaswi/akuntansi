<?php

namespace App\Models;

use App\Models\Inventory\InventoryItem;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DepartmentRequestItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'request_id',
        'item_id',
        'item_name',
        'item_description',
        'quantity_requested',
        'unit_of_measure',
        'estimated_unit_cost',
        'estimated_total_cost',
        'quantity_approved',
        'approved_unit_cost',
        'approved_total_cost',
        'approval_notes',
        'quantity_fulfilled',
        'actual_unit_cost',
        'actual_total_cost',
        'fulfilled_date',
        'fulfillment_notes',
        'status'
    ];

    protected $casts = [
        'quantity_requested' => 'decimal:2',
        'estimated_unit_cost' => 'decimal:2',
        'estimated_total_cost' => 'decimal:2',
        'quantity_approved' => 'decimal:2',
        'approved_unit_cost' => 'decimal:2',
        'approved_total_cost' => 'decimal:2',
        'quantity_fulfilled' => 'decimal:2',
        'actual_unit_cost' => 'decimal:2',
        'actual_total_cost' => 'decimal:2',
        'fulfilled_date' => 'date'
    ];

    protected $appends = [
        'custom_item_name',
        'description',
        'estimated_cost',
        'approved_cost'
    ];

    // Status constants
    const STATUS_PENDING = 'pending';
    const STATUS_APPROVED = 'approved';
    const STATUS_REJECTED = 'rejected';
    const STATUS_PARTIALLY_FULFILLED = 'partially_fulfilled';
    const STATUS_FULFILLED = 'fulfilled';

    // Relationships
    public function request(): BelongsTo
    {
        return $this->belongsTo(DepartmentRequest::class, 'request_id');
    }

    public function inventoryItem(): BelongsTo
    {
        return $this->belongsTo(InventoryItem::class, 'item_id');
    }

    // Scopes
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeApproved($query)
    {
        return $query->where('status', self::STATUS_APPROVED);
    }

    public function scopeFulfilled($query)
    {
        return $query->where('status', self::STATUS_FULFILLED);
    }

    // Accessors
    public function getStatusLabelAttribute(): string
    {
        return match($this->status) {
            self::STATUS_PENDING => 'Menunggu',
            self::STATUS_APPROVED => 'Disetujui',
            self::STATUS_REJECTED => 'Ditolak',
            self::STATUS_PARTIALLY_FULFILLED => 'Sebagian Dipenuhi',
            self::STATUS_FULFILLED => 'Dipenuhi',
            default => ucfirst($this->status)
        };
    }

    public function getStatusColorAttribute(): string
    {
        return match($this->status) {
            self::STATUS_PENDING => 'text-yellow-600 bg-yellow-100',
            self::STATUS_APPROVED => 'text-green-600 bg-green-100',
            self::STATUS_REJECTED => 'text-red-600 bg-red-100',
            self::STATUS_PARTIALLY_FULFILLED => 'text-blue-600 bg-blue-100',
            self::STATUS_FULFILLED => 'text-purple-600 bg-purple-100',
            default => 'text-gray-600 bg-gray-100'
        };
    }

    public function getItemDisplayNameAttribute(): string
    {
        return $this->inventoryItem ? $this->inventoryItem->name : $this->item_name;
    }

    public function getItemCodeAttribute(): string
    {
        return $this->inventoryItem ? $this->inventoryItem->code : 'CUSTOM';
    }

    public function getFulfillmentPercentageAttribute(): float
    {
        if ($this->quantity_approved <= 0) {
            return 0;
        }
        
        return ($this->quantity_fulfilled / $this->quantity_approved) * 100;
    }

    // Accessors for frontend compatibility
    public function getCustomItemNameAttribute(): ?string
    {
        return $this->item_name;
    }

    public function getDescriptionAttribute(): ?string
    {
        return $this->item_description;
    }

    public function getEstimatedCostAttribute(): float
    {
        return (float) $this->estimated_total_cost;
    }

    public function getApprovedCostAttribute(): ?float
    {
        return $this->approved_total_cost ? (float) $this->approved_total_cost : null;
    }

    // Helper methods
    public function canBeFulfilled(): bool
    {
        return $this->status === self::STATUS_APPROVED && 
               $this->quantity_fulfilled < $this->quantity_approved;
    }

    public function isFullyFulfilled(): bool
    {
        return $this->quantity_fulfilled >= $this->quantity_approved;
    }

    public function getRemainingQuantity(): float
    {
        return max(0, ($this->quantity_approved ?? $this->quantity_requested) - $this->quantity_fulfilled);
    }

    // Auto-calculate totals
    protected static function boot()
    {
        parent::boot();
        
        static::saving(function ($model) {
            // Calculate estimated total
            if ($model->isDirty(['quantity_requested', 'estimated_unit_cost'])) {
                $model->estimated_total_cost = $model->quantity_requested * $model->estimated_unit_cost;
            }
            
            // Calculate approved total
            if ($model->isDirty(['quantity_approved', 'approved_unit_cost'])) {
                $model->approved_total_cost = ($model->quantity_approved ?? 0) * ($model->approved_unit_cost ?? 0);
            }
            
            // Calculate actual total
            if ($model->isDirty(['quantity_fulfilled', 'actual_unit_cost'])) {
                $model->actual_total_cost = ($model->quantity_fulfilled ?? 0) * ($model->actual_unit_cost ?? 0);
            }
        });
        
        static::saved(function ($model) {
            // Update parent request total
            if ($model->request) {
                $model->request->updateTotalCost();
            }
        });
    }
}
