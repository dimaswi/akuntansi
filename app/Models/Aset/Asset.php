<?php

namespace App\Models\Aset;

use App\Models\Akuntansi\DaftarAkun;
use App\Models\Inventory\Department;
use App\Models\Inventory\Supplier;
use App\Models\Inventory\Purchase;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Asset extends Model
{
    use SoftDeletes;

    protected $table = 'assets';

    protected $fillable = [
        'code',
        'name',
        'description',
        'category_id',
        'department_id',
        'supplier_id',
        'location',
        'brand',
        'model',
        'serial_number',
        'plate_number',
        'acquisition_date',
        'acquisition_type',
        'acquisition_cost',
        'purchase_id',
        'useful_life_months',
        'salvage_value',
        'depreciation_method',
        'estimated_service_hours',
        'estimated_total_production',
        'current_book_value',
        'accumulated_depreciation',
        'depreciation_start_date',
        'status',
        'condition',
        'warranty_expiry_date',
        'photo',
        'notes',
        'specifications',
        'created_by',
    ];

    protected $casts = [
        'acquisition_date' => 'date',
        'depreciation_start_date' => 'date',
        'warranty_expiry_date' => 'date',
        'acquisition_cost' => 'decimal:2',
        'salvage_value' => 'decimal:2',
        'current_book_value' => 'decimal:2',
        'accumulated_depreciation' => 'decimal:2',
        'useful_life_months' => 'integer',
        'estimated_service_hours' => 'integer',
        'estimated_total_production' => 'integer',
        'specifications' => 'json',
    ];

    // ─── Relationships ─────────────────────────────────────

    public function category(): BelongsTo
    {
        return $this->belongsTo(AssetCategory::class, 'category_id');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class, 'supplier_id');
    }

    public function purchase(): BelongsTo
    {
        return $this->belongsTo(Purchase::class, 'purchase_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function depreciations(): HasMany
    {
        return $this->hasMany(AssetDepreciation::class, 'asset_id');
    }

    public function maintenances(): HasMany
    {
        return $this->hasMany(AssetMaintenance::class, 'asset_id');
    }

    public function disposals(): HasMany
    {
        return $this->hasMany(AssetDisposal::class, 'asset_id');
    }

    public function transfers(): HasMany
    {
        return $this->hasMany(AssetTransfer::class, 'asset_id');
    }

    public function latestDepreciation(): HasOne
    {
        return $this->hasOne(AssetDepreciation::class, 'asset_id')->latestOfMany();
    }

    // ─── Scopes ────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeByDepartment($query, $departmentId)
    {
        return $query->where('department_id', $departmentId);
    }

    public function scopeByCategory($query, $categoryId)
    {
        return $query->where('category_id', $categoryId);
    }

    // ─── Helpers ───────────────────────────────────────────

    public static function generateCode(): string
    {
        $year = date('Y');
        $prefix = "AST-{$year}-";
        $last = static::where('code', 'like', $prefix . '%')->orderByDesc('code')->first();
        $nextNum = $last ? ((int) substr($last->code, -4)) + 1 : 1;
        return $prefix . str_pad($nextNum, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Calculate monthly depreciation based on method.
     * For usage-based methods (service_hours, productive_output),
     * returns the per-unit/per-hour rate.
     */
    public function calculateMonthlyDepreciation(): float
    {
        $depreciableAmount = $this->acquisition_cost - $this->salvage_value;
        if ($depreciableAmount <= 0) return 0;

        return match ($this->depreciation_method) {
            'straight_line'       => $this->calcStraightLine($depreciableAmount),
            'declining_balance'   => $this->calcDecliningBalance(),
            'double_declining'    => $this->calcDoubleDeclining(),
            'sum_of_years_digits' => $this->calcSumOfYearsDigits($depreciableAmount),
            'service_hours'       => $this->calcServiceHoursRate($depreciableAmount),
            'productive_output'   => $this->calcProductiveOutputRate($depreciableAmount),
            default               => $this->useful_life_months > 0 ? $depreciableAmount / $this->useful_life_months : 0,
        };
    }

    /**
     * Calculate depreciation for usage-based methods with actual usage data.
     */
    public function calculateUsageDepreciation(float $usageAmount): float
    {
        $depreciableAmount = $this->acquisition_cost - $this->salvage_value;
        if ($depreciableAmount <= 0 || $usageAmount <= 0) return 0;

        $rate = match ($this->depreciation_method) {
            'service_hours'    => $this->calcServiceHoursRate($depreciableAmount),
            'productive_output' => $this->calcProductiveOutputRate($depreciableAmount),
            default => 0,
        };

        $depreciation = $rate * $usageAmount;

        // Jangan melebihi sisa nilai buku di atas salvage
        if (($this->current_book_value - $depreciation) < $this->salvage_value) {
            $depreciation = $this->current_book_value - $this->salvage_value;
        }

        return max(0, round($depreciation, 2));
    }

    // ── Metode Garis Lurus ──────────────────────────────────
    protected function calcStraightLine(float $depreciableAmount): float
    {
        return $this->useful_life_months > 0
            ? $depreciableAmount / $this->useful_life_months
            : 0;
    }

    // ── Metode Saldo Menurun ────────────────────────────────
    protected function calcDecliningBalance(): float
    {
        $usefulYears = $this->useful_life_months / 12;
        if ($usefulYears <= 0) return 0;
        $rate = 1 / $usefulYears;
        $monthlyRate = $rate / 12;
        return $this->current_book_value * $monthlyRate;
    }

    // ── Metode Saldo Menurun Ganda ──────────────────────────
    protected function calcDoubleDeclining(): float
    {
        $usefulYears = $this->useful_life_months / 12;
        if ($usefulYears <= 0) return 0;
        $rate = 2 / $usefulYears;
        $monthlyRate = $rate / 12;
        $depreciation = $this->current_book_value * $monthlyRate;

        if (($this->current_book_value - $depreciation) < $this->salvage_value) {
            $depreciation = $this->current_book_value - $this->salvage_value;
        }

        return max(0, $depreciation);
    }

    // ── Metode Jumlah Angka Tahun ───────────────────────────
    protected function calcSumOfYearsDigits(float $depreciableAmount): float
    {
        $usefulYears = (int) ceil($this->useful_life_months / 12);
        if ($usefulYears <= 0) return 0;

        $sum = $usefulYears * ($usefulYears + 1) / 2;
        $currentPeriod = $this->depreciations()->count() + 1;
        $currentYear = (int) ceil($currentPeriod / 12);

        if ($currentYear > $usefulYears) return 0;

        $fraction = ($usefulYears - $currentYear + 1) / $sum;
        $yearlyDepreciation = $depreciableAmount * $fraction;

        return $yearlyDepreciation / 12;
    }

    // ── Metode Satuan Jam Kerja (rate per jam) ──────────────
    protected function calcServiceHoursRate(float $depreciableAmount): float
    {
        if (!$this->estimated_service_hours || $this->estimated_service_hours <= 0) return 0;
        return $depreciableAmount / $this->estimated_service_hours;
    }

    // ── Metode Satuan Hasil Produksi (rate per unit) ────────
    protected function calcProductiveOutputRate(float $depreciableAmount): float
    {
        if (!$this->estimated_total_production || $this->estimated_total_production <= 0) return 0;
        return $depreciableAmount / $this->estimated_total_production;
    }

    /**
     * Check if this asset uses a usage-based depreciation method.
     */
    public function isUsageBasedMethod(): bool
    {
        return in_array($this->depreciation_method, ['service_hours', 'productive_output']);
    }

    public function isFullyDepreciated(): bool
    {
        return $this->current_book_value <= $this->salvage_value;
    }

    public function isUnderWarranty(): bool
    {
        return $this->warranty_expiry_date && $this->warranty_expiry_date->isFuture();
    }

    public function getRemainingLifeMonths(): int
    {
        $depreciatedPeriods = $this->depreciations()->count();
        return max(0, $this->useful_life_months - $depreciatedPeriods);
    }

    public function getDepreciationPercentage(): float
    {
        if ($this->acquisition_cost <= 0) return 0;
        return ($this->accumulated_depreciation / $this->acquisition_cost) * 100;
    }
}
