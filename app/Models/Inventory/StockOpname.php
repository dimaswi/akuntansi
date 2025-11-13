<?php

namespace App\Models\Inventory;

use App\Models\User;
use App\Models\Inventory\Department as InventoryDepartment;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class StockOpname extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'opname_number',
        'department_id',
        'opname_date',
        'status',
        'notes',
        'total_items_counted',
        'total_variance_value',
        'created_by',
        'approved_by',
        'approved_at',
        'rejection_reason',
    ];

    protected $casts = [
        'opname_date' => 'date',
        'approved_at' => 'datetime',
        'total_items_counted' => 'integer',
        'total_variance_value' => 'decimal:2',
    ];

    /**
     * Generate opname number otomatis
     */
    public static function generateOpnameNumber(string $tanggal): string
    {
        $date = \Carbon\Carbon::parse($tanggal);
        $year = $date->format('Y');
        $month = $date->format('m');
        
        $prefix = "OPN/{$year}/{$month}/";
        
        $lastOpname = self::where('opname_number', 'like', $prefix . '%')
            ->orderBy('opname_number', 'desc')
            ->first();
        
        if ($lastOpname) {
            $lastNumber = (int) substr($lastOpname->opname_number, -4);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }
        
        return $prefix . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Check if department has completed opname for current month
     */
    public static function hasMonthlyOpname(int $departmentId, ?string $date = null): bool
    {
        $date = $date ? \Carbon\Carbon::parse($date) : now();
        
        return self::where('department_id', $departmentId)
            ->where('status', 'approved')
            ->whereYear('opname_date', $date->year)
            ->whereMonth('opname_date', $date->month)
            ->exists();
    }

    /**
     * Check if department has completed opname for PREVIOUS month
     * Used to validate if department can create new stock requests/transfers
     */
    public static function hasPreviousMonthOpname(int $departmentId): bool
    {
        $previousMonth = now()->subMonth();
        
        return self::where('department_id', $departmentId)
            ->where('status', 'approved')
            ->whereYear('opname_date', $previousMonth->year)
            ->whereMonth('opname_date', $previousMonth->month)
            ->exists();
    }

    /**
     * Get days since last approved opname
     */
    public static function getDaysSinceLastOpname(int $departmentId): ?int
    {
        $lastOpname = self::where('department_id', $departmentId)
            ->where('status', 'approved')
            ->orderBy('opname_date', 'desc')
            ->first();
        
        if (!$lastOpname) {
            return null; // Never done opname
        }
        
        return now()->diffInDays($lastOpname->opname_date);
    }

    /**
     * Check if department is LATE (more than X days after month end)
     */
    public static function isOpnameLate(int $departmentId, int $graceDays = 5): bool
    {
        $previousMonth = now()->subMonth();
        $lastDayOfPreviousMonth = $previousMonth->endOfMonth();
        $deadlineDate = $lastDayOfPreviousMonth->copy()->addDays($graceDays);
        
        // If today is past deadline and no opname for previous month
        if (now()->gt($deadlineDate)) {
            return !self::hasPreviousMonthOpname($departmentId);
        }
        
        return false;
    }

    /**
     * Get all departments that haven't completed previous month opname
     */
    public static function getDepartmentsWithoutPreviousMonthOpname(): \Illuminate\Support\Collection
    {
        $allDepartments = InventoryDepartment::where('is_active', true)->get();
        
        return $allDepartments->filter(function ($department) {
            return !self::hasPreviousMonthOpname($department->id);
        })->map(function ($department) {
            $daysSince = self::getDaysSinceLastOpname($department->id);
            $isLate = self::isOpnameLate($department->id);
            
            return [
                'id' => $department->id,
                'name' => $department->name,
                'days_since_last_opname' => $daysSince,
                'last_opname_date' => self::getLastOpnameDate($department->id),
                'is_late' => $isLate,
                'severity' => self::getSeverityLevel($daysSince, $isLate),
            ];
        });
    }

    /**
     * Get last opname date for department
     */
    public static function getLastOpnameDate(int $departmentId): ?string
    {
        $lastOpname = self::where('department_id', $departmentId)
            ->where('status', 'approved')
            ->orderBy('opname_date', 'desc')
            ->first();
        
        return $lastOpname ? $lastOpname->opname_date->format('Y-m-d') : null;
    }

    /**
     * Get severity level based on days since last opname
     */
    private static function getSeverityLevel(?int $daysSince, bool $isLate): string
    {
        if (!$daysSince) {
            return 'critical'; // Never done opname
        }
        
        if (!$isLate) {
            return 'ok'; // Within grace period
        }
        
        if ($daysSince > 60) {
            return 'critical'; // More than 2 months
        } elseif ($daysSince > 45) {
            return 'high'; // More than 1.5 months
        } else {
            return 'warning'; // Just past deadline
        }
    }

    // Relationships
    public function department(): BelongsTo
    {
        return $this->belongsTo(InventoryDepartment::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(StockOpnameItem::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
