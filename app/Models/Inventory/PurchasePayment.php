<?php

namespace App\Models\Inventory;

use App\Models\User;
use App\Models\Akuntansi\Jurnal;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;

class PurchasePayment extends Model
{
    protected $fillable = [
        'purchase_id',
        'payment_number',
        'payment_date',
        'payment_method',
        'kode_akun_bank',
        'amount',
        'discount_amount',
        'notes',
        'jurnal_id',
        'jurnal_posted',
        'created_by',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'payment_date' => 'date',
        'amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'jurnal_posted' => 'boolean',
        'approved_at' => 'datetime',
    ];

    protected $appends = ['net_amount', 'bank_account_name'];

    // Relations
    public function purchase(): BelongsTo
    {
        return $this->belongsTo(Purchase::class);
    }

    public function jurnal(): BelongsTo
    {
        return $this->belongsTo(Jurnal::class, 'jurnal_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    // Accessors
    public function getNetAmountAttribute(): float
    {
        return $this->amount - $this->discount_amount;
    }

    public function getBankAccountNameAttribute(): ?string
    {
        if (!$this->kode_akun_bank) {
            return null;
        }
        
        $account = DB::table('daftar_akun')
            ->where('kode_akun', $this->kode_akun_bank)
            ->first();
        
        return $account ? $account->nama_akun : null;
    }

    // Methods
    public function canBeEdited(): bool
    {
        return !$this->jurnal_posted && is_null($this->approved_at);
    }

    public function canBeApproved(): bool
    {
        return !$this->jurnal_posted && is_null($this->approved_at);
    }

    public function canBeDeleted(): bool
    {
        return !$this->jurnal_posted;
    }

    // Generate payment number
    public static function generatePaymentNumber(): string
    {
        $date = now();
        $year = $date->format('Y');
        $month = $date->format('m');
        $day = $date->format('d');
        
        $lastPayment = static::whereDate('payment_date', $date->toDateString())
            ->orderBy('payment_number', 'desc')
            ->first();

        if ($lastPayment) {
            $parts = explode('-', $lastPayment->payment_number);
            $lastNumber = intval(end($parts));
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return "PAY-{$year}{$month}{$day}-" . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
    }
}
