<?php

namespace App\Models\Inventory;

use App\Models\Akuntansi\Jurnal;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockAdjustment extends Model
{
    protected $fillable = [
        'nomor_adjustment',
        'tanggal_adjustment',
        'tipe_adjustment',
        'item_id',
        'quantity',
        'unit_price',
        'keterangan',
        'status',
        'approved_by',
        'approved_at',
        'jurnal_posted',
        'jurnal_id',
    ];

    protected $casts = [
        'tanggal_adjustment' => 'date',
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
        'jurnal_posted' => 'boolean',
        'approved_at' => 'datetime',
    ];

    protected $appends = ['total_amount'];

    public function getTotalAmountAttribute(): float
    {
        return $this->quantity * $this->unit_price;
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    public function jurnal(): BelongsTo
    {
        return $this->belongsTo(Jurnal::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Generate nomor adjustment dengan format ADJ/YYYY/MM/XXXX
     */
    public static function generateNomorAdjustment(string $tanggal): string
    {
        $date = \Carbon\Carbon::parse($tanggal);
        $year = $date->format('Y');
        $month = $date->format('m');
        $prefix = "ADJ/{$year}/{$month}";

        // Get the latest number for this month
        $latest = self::where('nomor_adjustment', 'like', "{$prefix}/%")
            ->orderBy('nomor_adjustment', 'desc')
            ->first();

        if ($latest) {
            $lastNumber = (int) substr($latest->nomor_adjustment, -4);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return sprintf('%s/%04d', $prefix, $newNumber);
    }
}
