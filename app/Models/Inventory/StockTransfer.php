<?php

namespace App\Models\Inventory;

use App\Models\Inventory\Department;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockTransfer extends Model
{
    use HasFactory;

    protected $fillable = [
        'nomor_transfer',
        'tanggal_transfer',
        'item_id',
        'from_department_id',
        'to_department_id',
        'quantity',
        'keterangan',
        'status',
        'approved_by',
        'approved_at',
        'received_by',
        'received_at',
    ];

    protected $casts = [
        'tanggal_transfer' => 'date',
        'quantity' => 'integer',
        'approved_at' => 'datetime',
        'received_at' => 'datetime',
    ];

    /**
     * Generate nomor transfer otomatis
     */
    public static function generateNomorTransfer(string $tanggal): string
    {
        $date = \Carbon\Carbon::parse($tanggal);
        $year = $date->format('Y');
        $month = $date->format('m');
        
        $prefix = "TRF/{$year}/{$month}/";
        
        $lastTransfer = self::where('nomor_transfer', 'like', $prefix . '%')
            ->orderBy('nomor_transfer', 'desc')
            ->first();
        
        if ($lastTransfer) {
            $lastNumber = (int) substr($lastTransfer->nomor_transfer, -4);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }
        
        return $prefix . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Check if transfer is from central warehouse
     */
    public function isFromCentral(): bool
    {
        return $this->from_department_id === null;
    }

    /**
     * Relationship: Item yang ditransfer
     */
    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    /**
     * Relationship: Department asal (nullable untuk central)
     */
    public function fromDepartment(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'from_department_id');
    }

    /**
     * Relationship: Department tujuan
     */
    public function toDepartment(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'to_department_id');
    }

    /**
     * Relationship: User yang approve
     */
    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Relationship: User yang menerima
     */
    public function receivedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }
}
