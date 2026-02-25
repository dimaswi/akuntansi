<?php

namespace App\Http\Controllers\Aset;

use App\Http\Controllers\Controller;
use App\Models\Aset\Asset;
use App\Models\Aset\AssetBudget;
use App\Models\Aset\AssetCategory;
use App\Models\Aset\AssetDepreciation;
use App\Models\Aset\AssetMaintenance;
use App\Models\Aset\AssetDisposal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AssetDashboardController extends Controller
{
    public function index()
    {
        // Statistik umum
        $totalAssets = Asset::count();
        $activeAssets = Asset::where('status', 'active')->count();
        $maintenanceAssets = Asset::where('status', 'maintenance')->count();
        $disposedAssets = Asset::where('status', 'disposed')->count();

        $totalAcquisitionCost = Asset::sum('acquisition_cost');
        $totalBookValue = Asset::where('status', '!=', 'disposed')->sum('current_book_value');
        $totalDepreciation = Asset::where('status', '!=', 'disposed')->sum('accumulated_depreciation');

        // Aset per kategori
        $assetsByCategory = AssetCategory::withCount(['assets' => fn ($q) => $q->where('status', '!=', 'disposed')])
            ->withSum(['assets' => fn ($q) => $q->where('status', '!=', 'disposed')], 'current_book_value')
            ->having('assets_count', '>', 0)
            ->orderByDesc('assets_count')
            ->get()
            ->map(fn ($cat) => [
                'id' => $cat->id,
                'name' => $cat->name,
                'count' => $cat->assets_count,
                'book_value' => (float) $cat->assets_sum_current_book_value,
            ]);

        // Aset per departemen
        $assetsByDepartment = Asset::where('status', '!=', 'disposed')
            ->with('department:id,name')
            ->select('department_id', DB::raw('COUNT(*) as count'), DB::raw('SUM(current_book_value) as book_value'))
            ->groupBy('department_id')
            ->get()
            ->map(fn ($item) => [
                'department' => $item->department?->name ?? 'Tidak Ada',
                'count' => $item->count,
                'book_value' => (float) $item->book_value,
            ]);

        // Aset per kondisi
        $assetsByCondition = Asset::where('status', '!=', 'disposed')
            ->select('condition', DB::raw('COUNT(*) as count'))
            ->groupBy('condition')
            ->pluck('count', 'condition');

        // Maintenance mendatang
        $upcomingMaintenances = AssetMaintenance::with('asset:id,code,name')
            ->whereIn('status', ['scheduled', 'in_progress'])
            ->orderBy('scheduled_date')
            ->limit(10)
            ->get();

        // Aset mendekati fully depreciated (< 10% book value)
        $nearFullyDepreciated = Asset::where('status', 'active')
            ->whereRaw('current_book_value <= (acquisition_cost * 0.10)')
            ->where('current_book_value', '>', 0)
            ->with('category:id,name')
            ->limit(10)
            ->get(['id', 'code', 'name', 'category_id', 'acquisition_cost', 'current_book_value']);

        // Warranty expiring soon (within 90 days)
        $warrantyExpiringSoon = Asset::where('status', 'active')
            ->whereNotNull('warranty_expiry_date')
            ->whereBetween('warranty_expiry_date', [now(), now()->addDays(90)])
            ->orderBy('warranty_expiry_date')
            ->limit(10)
            ->get(['id', 'code', 'name', 'warranty_expiry_date']);

        // RAB Tahun ini
        $currentYear = (int) date('Y');
        $currentBudget = AssetBudget::where('fiscal_year', $currentYear)
            ->whereIn('status', ['approved', 'closed'])
            ->first();

        $budgetSummary = null;
        if ($currentBudget) {
            $budgetSummary = [
                'id' => $currentBudget->id,
                'code' => $currentBudget->code,
                'fiscal_year' => $currentBudget->fiscal_year,
                'total_budget' => (float) $currentBudget->total_budget,
                'total_realized' => (float) $currentBudget->total_realized,
                'status' => $currentBudget->status,
                'total_items' => $currentBudget->items()->count(),
                'realized_items' => $currentBudget->items()->where('status', 'realized')->count(),
                'pending_items' => $currentBudget->items()->whereIn('status', ['pending', 'partially_realized'])->count(),
            ];
        }

        return Inertia::render('aset/dashboard', [
            'statistics' => [
                'total_assets' => $totalAssets,
                'active_assets' => $activeAssets,
                'maintenance_assets' => $maintenanceAssets,
                'disposed_assets' => $disposedAssets,
                'total_acquisition_cost' => (float) $totalAcquisitionCost,
                'total_book_value' => (float) $totalBookValue,
                'total_depreciation' => (float) $totalDepreciation,
            ],
            'assetsByCategory' => $assetsByCategory,
            'assetsByDepartment' => $assetsByDepartment,
            'assetsByCondition' => $assetsByCondition,
            'upcomingMaintenances' => $upcomingMaintenances,
            'nearFullyDepreciated' => $nearFullyDepreciated,
            'warrantyExpiringSoon' => $warrantyExpiringSoon,
            'budgetSummary' => $budgetSummary,
        ]);
    }
}
