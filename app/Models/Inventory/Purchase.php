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
        'created_by',
        'approved_by',
        'purchase_date',
        'expected_delivery_date',
        'actual_delivery_date',
        'status',
        'jurnal_id',
        'jurnal_posted',
        'jurnal_posted_at',
        'ap_account_id',
        'ap_amount',
        'ap_paid_amount',
        'ap_outstanding',
        'akun_kas_id',
        'tax_included',
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
        'jurnal_posted' => 'boolean',
        'jurnal_posted_at' => 'datetime',
        'tax_included' => 'boolean',
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'shipping_cost' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'ap_amount' => 'decimal:2',
        'ap_paid_amount' => 'decimal:2',
        'ap_outstanding' => 'decimal:2',
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

    // New accounting relations
    public function jurnal()
    {
        return $this->belongsTo(\App\Models\Akuntansi\Jurnal::class, 'jurnal_id');
    }

    public function akunKas()
    {
        return $this->belongsTo(\App\Models\Akuntansi\DaftarAkun::class, 'akun_kas_id');
    }

    public function apAccount()
    {
        return $this->belongsTo(\App\Models\Akuntansi\DaftarAkun::class, 'ap_account_id');
    }

    public function payments()
    {
        return $this->hasMany(PurchasePayment::class);
    }

    public function inventoryTransactions()
    {
        return $this->hasMany(InventoryTransaction::class, 'reference_id')
            ->where('reference_type', 'purchase');
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
        return in_array($this->status, ['approved', 'ordered', 'partial']);
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
        
        // Update AP amount if jurnal posted
        if ($this->jurnal_posted && $this->ap_amount == 0) {
            $this->ap_amount = $this->total_amount;
            $this->ap_outstanding = $this->total_amount - $this->ap_paid_amount;
        }
        
        $this->save();
    }

    // Accounting methods
    public function canPostToJournal(): bool
    {
        // Allow posting if status is 'approved', 'ordered', 'partial', or 'completed'
        // Karena posting jurnal bisa dilakukan kapan saja selama belum pernah di-post
        return in_array($this->status, ['approved', 'ordered', 'partial', 'completed']) && !$this->jurnal_posted;
    }

    public function isFullyPaid(): bool
    {
        return $this->ap_paid_amount >= $this->ap_amount && $this->ap_amount > 0;
    }

    public function hasOutstandingPayment(): bool
    {
        return $this->ap_outstanding > 0 && $this->jurnal_posted;
    }

    public function getOutstandingAmountAttribute(): float
    {
        return $this->ap_outstanding;
    }

    // Generate purchase number
    public static function generatePurchaseNumber()
    {
        $year = date('Y');
        $month = date('m');
        
        // Format: PO/YYYY/MM/XXXX (konsisten dengan sistem lain)
        $prefix = "PO/{$year}/{$month}/";
        
        // Use pessimistic locking to prevent race conditions
        $lastPurchase = static::where('purchase_number', 'like', $prefix . '%')
            ->lockForUpdate()
            ->orderBy('purchase_number', 'desc')
            ->first();
            
        if ($lastPurchase) {
            $lastNum = (int) substr($lastPurchase->purchase_number, -4);
            $sequence = $lastNum + 1;
        } else {
            $sequence = 1;
        }
        
        $purchaseNumber = $prefix . str_pad($sequence, 4, '0', STR_PAD_LEFT);
        
        // Check if number already exists (safety check)
        $attempts = 0;
        while (static::where('purchase_number', $purchaseNumber)->exists() && $attempts < 10) {
            $sequence++;
            $purchaseNumber = $prefix . str_pad($sequence, 4, '0', STR_PAD_LEFT);
            $attempts++;
        }
        
        if ($attempts >= 10) {
            throw new \Exception('Unable to generate unique purchase number after 10 attempts');
        }
        
        return $purchaseNumber;
    }
}
