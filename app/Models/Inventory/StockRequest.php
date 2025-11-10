<?php

namespace App\Models\Inventory;

use App\Models\User;
use App\Models\Akuntansi\Jurnal;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class StockRequest extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'request_number',
        'department_id',
        'requested_by',
        'request_date',
        'required_date',
        'status',
        'priority',
        'purpose',
        'notes',
        'approved_by',
        'approved_at',
        'rejection_reason',
        'completed_at',
        'completed_by',
        'jurnal_id',
        'jurnal_posted',
        'jurnal_posted_at',
    ];

    protected $casts = [
        'request_date' => 'date',
        'required_date' => 'date',
        'approved_at' => 'datetime',
        'completed_at' => 'datetime',
        'jurnal_posted' => 'boolean',
        'jurnal_posted_at' => 'datetime',
    ];

    // Relations
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    // Alias untuk konsistensi dengan naming convention
    public function requestedByUser(): BelongsTo
    {
        return $this->requestedBy();
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    // Alias untuk konsistensi dengan naming convention
    public function approvedByUser(): BelongsTo
    {
        return $this->approvedBy();
    }

    public function completedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'completed_by');
    }

    // Alias untuk konsistensi dengan naming convention
    public function completedByUser(): BelongsTo
    {
        return $this->completedBy();
    }

    public function jurnal(): BelongsTo
    {
        return $this->belongsTo(Jurnal::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(StockRequestItem::class);
    }

    public function inventoryTransactions(): HasMany
    {
        return $this->hasMany(InventoryTransaction::class, 'reference_id')
            ->where('reference_type', 'stock_request');
    }

    // Scopes
    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    public function scopeSubmitted($query)
    {
        return $query->where('status', 'submitted');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopePending($query)
    {
        return $query->whereIn('status', ['submitted', 'approved']);
    }

    // Helper methods
    public function canEdit(): bool
    {
        return in_array($this->status, ['draft']);
    }

    public function canSubmit(): bool
    {
        return $this->status === 'draft' && $this->items()->count() > 0;
    }

    public function canApprove(): bool
    {
        // Allow approve if submitted OR if approved but has remaining quantity
        if ($this->status === 'submitted') {
            return true;
        }
        
        if ($this->status === 'approved') {
            // Check if there's remaining quantity to approve
            return $this->items()->whereRaw('quantity_approved < quantity_requested')->exists();
        }
        
        return false;
    }

    public function canComplete(): bool
    {
        return $this->status === 'approved';
    }

    public function canCancel(): bool
    {
        return in_array($this->status, ['draft', 'submitted']);
    }

    public function canPostToJournal(): bool
    {
        return $this->status === 'completed' && !$this->jurnal_posted;
    }

    public function getTotalRequestedQuantity(): float
    {
        return $this->items()->sum('quantity_requested');
    }

    public function getTotalApprovedQuantity(): float
    {
        return $this->items()->sum('quantity_approved');
    }

    public function getTotalCost(): float
    {
        return $this->items()->sum('total_cost');
    }

    // Generate request number
    public static function generateRequestNumber(): string
    {
        $date = now();
        $year = $date->format('Y');
        $month = $date->format('m');
        $day = $date->format('d');
        
        $lastRequest = static::whereDate('request_date', $date->toDateString())
            ->orderBy('request_number', 'desc')
            ->first();

        if ($lastRequest) {
            $parts = explode('-', $lastRequest->request_number);
            $lastNumber = intval(end($parts));
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return "SREQ-{$year}{$month}{$day}-" . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
    }

    // Status labels
    public static function getStatusLabel(string $status): string
    {
        $labels = [
            'draft' => 'Draft',
            'submitted' => 'Menunggu Approval',
            'approved' => 'Disetujui',
            'rejected' => 'Ditolak',
            'completed' => 'Selesai',
            'cancelled' => 'Dibatalkan',
        ];

        return $labels[$status] ?? $status;
    }

    public static function getPriorityLabel(string $priority): string
    {
        $labels = [
            'low' => 'Rendah',
            'normal' => 'Normal',
            'high' => 'Tinggi',
            'urgent' => 'Mendesak',
        ];

        return $labels[$priority] ?? $priority;
    }
}
