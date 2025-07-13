<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\User;

class Purchase extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'purchase_number',
        'supplier_id',
        'department_id',
        'created_by',
        'approved_by',
        'purchase_date',
        'expected_delivery_date',
        'actual_delivery_date',
        'status',
        'subtotal',
        'tax_amount',
        'discount_amount',
        'shipping_cost',
        'total_amount',
        'notes',
        'delivery_address',
        'payment_terms',
        'approved_at',
        'ordered_at',
        'completed_at',
    ];

    protected $casts = [
        'purchase_date' => 'date',
        'expected_delivery_date' => 'date',
        'actual_delivery_date' => 'date',
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'shipping_cost' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'delivery_address' => 'array',
        'approved_at' => 'datetime',
        'ordered_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    protected $dates = [
        'approved_at',
        'ordered_at', 
        'completed_at'
    ];

    // Relationships
    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function items()
    {
        return $this->hasMany(PurchaseItem::class);
    }

    // Scopes
    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    // Helper methods
    public function canBeEdited()
    {
        return in_array($this->status, ['draft', 'pending']);
    }

    public function canBeApproved()
    {
        return $this->status === 'pending';
    }

    public function canBeOrdered()
    {
        return $this->status === 'approved';
    }

    public function canReceiveItems()
    {
        return in_array($this->status, ['ordered', 'partial']);
    }

    public function isCompleted()
    {
        return $this->status === 'completed';
    }

    // Static methods
    public static function getStatusOptions()
    {
        return [
            'draft' => 'Draft',
            'pending' => 'Pending Approval',
            'approved' => 'Approved',
            'ordered' => 'Ordered',
            'partial' => 'Partially Received',
            'completed' => 'Completed',
            'cancelled' => 'Cancelled',
        ];
    }

    public function calculateTotals()
    {
        $this->subtotal = $this->items->sum('total_price');
        $this->total_amount = $this->subtotal + $this->tax_amount + $this->shipping_cost - $this->discount_amount;
        $this->save();
    }

    // Generate purchase number
    public static function generatePurchaseNumber()
    {
        $year = date('Y');
        $month = date('m');
        
        $lastPurchase = static::whereYear('created_at', $year)
            ->whereMonth('created_at', $month)
            ->orderBy('id', 'desc')
            ->first();
            
        $sequence = $lastPurchase ? (int) substr($lastPurchase->purchase_number, -3) + 1 : 1;
        
        return "PO-{$year}{$month}-" . str_pad($sequence, 3, '0', STR_PAD_LEFT);
    }
}
