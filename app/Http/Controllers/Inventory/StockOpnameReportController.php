<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Inventory\StockOpname;
use App\Models\Inventory\Department;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StockOpnameReportController extends Controller
{
    /**
     * Display opname compliance report
     */
    public function index(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        
        // Only logistics and super admin can see this report
        if (!$user->isLogistics()) {
            abort(403, 'Anda tidak memiliki akses ke laporan ini');
        }
        
        // Get all active departments with their opname status
        $departments = $this->getDepartmentsStatus();
        
        // Get compliance statistics
        $stats = $this->getComplianceStats($departments);
        
        // Get monthly trend (last 6 months)
        $monthlyTrend = $this->getMonthlyTrend();
        
        return Inertia::render('inventory/reports/opname-compliance', [
            'departments' => $departments,
            'stats' => $stats,
            'monthlyTrend' => $monthlyTrend,
        ]);
    }

    /**
     * Get status for all departments
     */
    private function getDepartmentsStatus()
    {
        $allDepartments = Department::where('is_active', true)
            ->orderBy('name')
            ->get();
        
        return $allDepartments->map(function ($department) {
            $hasPreviousMonth = StockOpname::hasPreviousMonthOpname($department->id);
            $daysSince = StockOpname::getDaysSinceLastOpname($department->id);
            $isLate = StockOpname::isOpnameLate($department->id);
            $lastOpnameDate = StockOpname::getLastOpnameDate($department->id);
            
            // Check if has pending opname (draft or submitted)
            $hasPending = StockOpname::where('department_id', $department->id)
                ->whereIn('status', ['draft', 'submitted'])
                ->exists();
            
            // Get last 3 months opname history
            $recentHistory = StockOpname::where('department_id', $department->id)
                ->where('status', 'approved')
                ->orderBy('opname_date', 'desc')
                ->limit(3)
                ->get(['opname_number', 'opname_date', 'total_items_counted', 'total_variance_value']);
            
            return [
                'id' => $department->id,
                'name' => $department->name,
                'has_previous_month_opname' => $hasPreviousMonth,
                'days_since_last_opname' => $daysSince,
                'last_opname_date' => $lastOpnameDate,
                'is_late' => $isLate,
                'is_blocked' => !$hasPreviousMonth, // Blocked from creating requests
                'has_pending' => $hasPending,
                'severity' => $this->getSeverity($daysSince, $isLate, $hasPreviousMonth),
                'status_label' => $this->getStatusLabel($hasPreviousMonth, $isLate, $hasPending),
                'recent_history' => $recentHistory,
            ];
        });
    }

    /**
     * Get compliance statistics
     */
    private function getComplianceStats($departments)
    {
        $total = $departments->count();
        $compliant = $departments->where('has_previous_month_opname', true)->count();
        $late = $departments->where('is_late', true)->count();
        $blocked = $departments->where('is_blocked', true)->count();
        $pending = $departments->where('has_pending', true)->count();
        
        // Count by severity
        $critical = $departments->where('severity', 'critical')->count();
        $high = $departments->where('severity', 'high')->count();
        $warning = $departments->where('severity', 'warning')->count();
        
        return [
            'total_departments' => $total,
            'compliant' => $compliant,
            'late' => $late,
            'blocked' => $blocked,
            'pending' => $pending,
            'compliance_rate' => $total > 0 ? round(($compliant / $total) * 100, 1) : 0,
            'critical_count' => $critical,
            'high_count' => $high,
            'warning_count' => $warning,
        ];
    }

    /**
     * Get monthly trend for last 6 months
     */
    private function getMonthlyTrend()
    {
        $trend = [];
        $current = Carbon::now()->startOfMonth();
        
        for ($i = 5; $i >= 0; $i--) {
            $month = $current->copy()->subMonths($i);
            
            $totalDepts = Department::where('is_active', true)->count();
            $completed = StockOpname::where('status', 'approved')
                ->whereYear('opname_date', $month->year)
                ->whereMonth('opname_date', $month->month)
                ->distinct('department_id')
                ->count('department_id');
            
            $trend[] = [
                'month' => $month->format('M Y'),
                'total' => $totalDepts,
                'completed' => $completed,
                'compliance_rate' => $totalDepts > 0 ? round(($completed / $totalDepts) * 100, 1) : 0,
            ];
        }
        
        return $trend;
    }

    /**
     * Get severity level
     */
    private function getSeverity(?int $daysSince, bool $isLate, bool $hasCompleted): string
    {
        if (!$daysSince) {
            return 'critical'; // Never done opname
        }
        
        if ($hasCompleted && !$isLate) {
            return 'ok'; // All good
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

    /**
     * Get status label
     */
    private function getStatusLabel(bool $hasCompleted, bool $isLate, bool $hasPending): string
    {
        if ($hasPending) {
            return 'Sedang Proses';
        }
        
        if ($hasCompleted) {
            return 'Selesai';
        }
        
        if ($isLate) {
            return 'Terlambat';
        }
        
        return 'Belum Opname';
    }

    /**
     * Export report to Excel/PDF (future implementation)
     */
    public function export(Request $request)
    {
        // TODO: Implement export functionality
        return response()->json(['message' => 'Export feature coming soon']);
    }
}
