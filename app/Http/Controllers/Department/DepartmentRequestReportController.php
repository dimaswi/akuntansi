<?php

namespace App\Http\Controllers\Department;

use App\Http\Controllers\Controller;
use App\Models\DepartmentRequest;
use App\Models\Department;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DepartmentRequestReportController extends Controller
{
    public function index(Request $request)
    {
        $query = DepartmentRequest::with(['department', 'requestedBy', 'approvedBy'])
            ->withCount('items as items_count')
            ->select('department_requests.*');

        // Apply filters
        $this->applyFilters($query, $request);

        // Order by date
        $requests = $query->orderBy('request_date', 'desc')->paginate(20);

        // Get summary data
        $summary = $this->getSummary($request);

        // Get departments and users for filters
        $departments = Department::active()->orderBy('name')->get(['id', 'name', 'code']);
        $users = User::orderBy('name')->get(['id', 'name', 'nip']);

        return Inertia::render('Department/Requests/Reports', [
            'requests' => $requests,
            'departments' => $departments,
            'users' => $users,
            'summary' => $summary,
            'filters' => $request->only(['search', 'department', 'status', 'priority', 'requested_by', 'date_from', 'date_to', 'report_type'])
        ]);
    }

    private function getSummary(Request $request)
    {
        $query = DepartmentRequest::query();
        $this->applyFilters($query, $request);

        // Basic counts
        $total_requests = $query->count();
        $total_estimated_cost = $query->sum('total_estimated_cost');
        $total_approved_budget = $query->whereNotNull('approved_budget')->sum('approved_budget');
        $total_fulfilled = $query->where('status', 'fulfilled')->count();

        // Status breakdown
        $statusQuery = DepartmentRequest::query();
        $this->applyFilters($statusQuery, $request);
        $status_breakdown = $statusQuery->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        // Fill missing statuses with 0
        $all_statuses = ['draft', 'submitted', 'approved', 'rejected', 'fulfilled'];
        foreach ($all_statuses as $status) {
            if (!isset($status_breakdown[$status])) {
                $status_breakdown[$status] = 0;
            }
        }

        // Department breakdown
        $deptQuery = DepartmentRequest::query();
        $this->applyFilters($deptQuery, $request);
        $department_breakdown = $deptQuery->select('department_id')
            ->with('department:id,name')
            ->selectRaw('count(*) as total_requests, sum(total_estimated_cost) as total_cost')
            ->groupBy('department_id')
            ->get()
            ->map(function ($item) {
                return [
                    'department' => $item->department->name ?? 'Unknown',
                    'total_requests' => $item->total_requests,
                    'total_cost' => $item->total_cost ?? 0,
                ];
            })
            ->toArray();

        // Monthly trend (last 6 months)
        $monthly_trend = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $month_start = $date->copy()->startOfMonth();
            $month_end = $date->copy()->endOfMonth();
            
            // Create new query for monthly count
            $monthlyCountQuery = DepartmentRequest::query();
            $this->applyFilters($monthlyCountQuery, $request);
            $requests_count = $monthlyCountQuery
                ->whereDate('request_date', '>=', $month_start)
                ->whereDate('request_date', '<=', $month_end)
                ->count();
                
            // Create new query for monthly cost
            $monthlyCostQuery = DepartmentRequest::query();
            $this->applyFilters($monthlyCostQuery, $request);
            $month_cost = $monthlyCostQuery
                ->whereDate('request_date', '>=', $month_start)
                ->whereDate('request_date', '<=', $month_end)
                ->sum('total_estimated_cost');

            $monthly_trend[] = [
                'month' => $date->format('M Y'),
                'requests' => $requests_count,
                'cost' => $month_cost ?? 0,
            ];
        }

        // Average approval time (in days)
        $approvalQuery = DepartmentRequest::query();
        $this->applyFilters($approvalQuery, $request);
        $average_approval_time = $approvalQuery
            ->whereNotNull('approved_at')
            ->where('status', 'approved')
            ->selectRaw('AVG(DATEDIFF(approved_at, created_at)) as avg_days')
            ->value('avg_days') ?? 0;

        return [
            'total_requests' => $total_requests,
            'total_estimated_cost' => $total_estimated_cost,
            'total_approved_cost' => $total_approved_budget,
            'total_fulfilled' => $total_fulfilled,
            'average_approval_time' => round($average_approval_time, 1),
            'status_breakdown' => $status_breakdown,
            'department_breakdown' => $department_breakdown,
            'monthly_trend' => $monthly_trend,
        ];
    }

    public function export(Request $request)
    {
        $format = $request->get('export', 'excel');
        
        $query = DepartmentRequest::with(['department', 'requestedBy', 'approvedBy', 'items'])
            ->select('department_requests.*');

        // Apply same filters as index
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('request_number', 'like', "%{$search}%")
                  ->orWhere('purpose', 'like', "%{$search}%");
            });
        }

        if ($request->filled('department') && $request->department !== 'all') {
            $query->where('department_id', $request->department);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('priority') && $request->priority !== 'all') {
            $query->where('priority', $request->priority);
        }

        if ($request->filled('requested_by') && $request->requested_by !== 'all') {
            $query->where('requested_by', $request->requested_by);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('request_date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('request_date', '<=', $request->date_to);
        }

        $requests = $query->orderBy('request_date', 'desc')->get();

        if ($format === 'excel') {
            return $this->exportExcel($requests, $request);
        } else {
            return $this->exportPDF($requests, $request);
        }
    }

    private function exportExcel($requests, $request)
    {
        $filename = 'laporan_permintaan_departemen_' . date('Y-m-d') . '.xlsx';
        
        // For now, return a simple CSV-like response
        // In production, you'd use Laravel Excel package
        $headers = [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        $data = "No. Permintaan,Departemen,Diminta Oleh,Tujuan,Status,Prioritas,Jumlah Item,Est. Biaya,Tanggal\n";
        
        foreach ($requests as $request) {
            $data .= sprintf(
                "%s,%s,%s,%s,%s,%s,%d,%d,%s\n",
                $request->request_number,
                $request->department->name ?? '',
                $request->requestedBy->name ?? '',
                str_replace(',', ';', $request->purpose),
                $request->status,
                $request->priority,
                $request->items->count(),
                $request->total_estimated_cost,
                $request->request_date
            );
        }

        return response($data, 200, $headers);
    }

    private function exportPDF($requests, $request)
    {
        // For now, return HTML that can be converted to PDF
        // In production, you'd use a PDF library like TCPDF or DomPDF
        
        $html = '<!DOCTYPE html>
        <html>
        <head>
            <title>Laporan Permintaan Departemen</title>
            <style>
                body { font-family: Arial, sans-serif; font-size: 12px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .header { text-align: center; margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>Laporan Permintaan Departemen</h2>
                <p>Periode: ' . ($request->date_from ?? 'Semua') . ' - ' . ($request->date_to ?? 'Semua') . '</p>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>No. Permintaan</th>
                        <th>Departemen</th>
                        <th>Diminta Oleh</th>
                        <th>Tujuan</th>
                        <th>Status</th>
                        <th>Prioritas</th>
                        <th>Jumlah Item</th>
                        <th>Est. Biaya</th>
                        <th>Tanggal</th>
                    </tr>
                </thead>
                <tbody>';

        foreach ($requests as $request) {
            $html .= sprintf(
                '<tr>
                    <td>%s</td>
                    <td>%s</td>
                    <td>%s</td>
                    <td>%s</td>
                    <td>%s</td>
                    <td>%s</td>
                    <td>%d</td>
                    <td>Rp %s</td>
                    <td>%s</td>
                </tr>',
                $request->request_number,
                $request->department->name ?? '',
                $request->requestedBy->name ?? '',
                htmlspecialchars($request->purpose),
                ucfirst($request->status),
                ucfirst($request->priority),
                $request->items->count(),
                number_format($request->total_estimated_cost, 0, ',', '.'),
                date('d/m/Y', strtotime($request->request_date))
            );
        }

        $html .= '</tbody></table></body></html>';

        return response($html)
            ->header('Content-Type', 'text/html')
            ->header('Content-Disposition', 'attachment; filename="laporan_permintaan_departemen_' . date('Y-m-d') . '.html"');
    }

    private function applyFilters($query, Request $request)
    {
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('request_number', 'like', "%{$search}%")
                  ->orWhere('purpose', 'like', "%{$search}%");
            });
        }

        if ($request->filled('department') && $request->department !== 'all') {
            $query->where('department_id', $request->department);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('priority') && $request->priority !== 'all') {
            $query->where('priority', $request->priority);
        }

        if ($request->filled('requested_by') && $request->requested_by !== 'all') {
            $query->where('requested_by', $request->requested_by);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('request_date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('request_date', '<=', $request->date_to);
        }

        return $query;
    }
}
