<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Inventory\StockRequest;
use App\Models\Inventory\Purchase;
use App\Models\Inventory\Item;
use App\Models\Inventory\Department;
use App\Models\Inventory\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;
use Rap2hpoutre\FastExcel\FastExcel;

class InventoryReportController extends Controller
{
    /**
     * Display the inventory reports page
     */
    public function index(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        // Get filter values
        $reportType = $request->input('report_type', 'stock_requests');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        $departmentId = $request->input('department_id');
        $supplierId = $request->input('supplier_id');
        $status = $request->input('status');
        $itemId = $request->input('item_id');

        // Determine actual report type for columns
        $actualReportType = match($reportType) {
            'stock_request_rankings' => 'department_rankings',
            'stock_request_item_rankings' => 'item_request_rankings',
            'purchase_item_rankings' => 'item_purchase_rankings',
            'stock_request_items' => 'stock_request_items',
            'purchase_items' => 'purchase_items',
            default => $reportType,
        };
        
        // Selected columns (comma-separated string)
        $selectedColumns = $request->input('columns', $this->getDefaultColumns($actualReportType));
        $columnsArray = array_filter(explode(',', $selectedColumns));

        // Initialize data
        $reportData = [];
        $summary = [];
        
        // Get report data based on type
        if ($reportType === 'stock_request_rankings') {
            // Show department rankings
            $rankingsData = $this->getDepartmentRankings($user, $dateFrom, $dateTo, $status, $itemId);
            $reportData = [
                'data' => $rankingsData,
                'current_page' => 1,
                'last_page' => 1,
                'per_page' => count($rankingsData),
                'total' => count($rankingsData),
            ];
        } elseif ($reportType === 'stock_request_item_rankings') {
            // Show item request rankings
            $rankingsData = $this->getItemRequestRankings($user, $dateFrom, $dateTo, $departmentId, $status);
            $reportData = [
                'data' => $rankingsData,
                'current_page' => 1,
                'last_page' => 1,
                'per_page' => count($rankingsData),
                'total' => count($rankingsData),
            ];
        } elseif ($reportType === 'purchase_item_rankings') {
            // Show item purchase rankings
            $rankingsData = $this->getItemPurchaseRankings($user, $dateFrom, $dateTo, $supplierId, $status);
            $reportData = [
                'data' => $rankingsData,
                'current_page' => 1,
                'last_page' => 1,
                'per_page' => count($rankingsData),
                'total' => count($rankingsData),
            ];
        } elseif ($reportType === 'stock_request_items') {
            // Show detail stock request items
            $reportData = $this->getStockRequestItemsReport(
                $user,
                $dateFrom,
                $dateTo,
                $departmentId,
                $status,
                $itemId
            );
        } elseif ($reportType === 'purchase_items') {
            // Show detail purchase items
            $reportData = $this->getPurchaseItemsReport(
                $user,
                $dateFrom,
                $dateTo,
                $supplierId,
                $status,
                $itemId
            );
        } elseif ($reportType === 'stock_requests') {
            $reportData = $this->getStockRequestsReport(
                $user,
                $dateFrom,
                $dateTo,
                $departmentId,
                $status,
                $itemId
            );
        } elseif ($reportType === 'purchases') {
            $reportData = $this->getPurchasesReport(
                $user,
                $dateFrom,
                $dateTo,
                $supplierId,
                $status,
                $itemId
            );
        }

        // Get filter options
        $departments = Department::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        $suppliers = Supplier::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        $items = Item::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        return Inertia::render('inventory/reports/index', [
            'reportData' => $reportData,
            'summary' => $summary,
            'departments' => $departments,
            'suppliers' => $suppliers,
            'items' => $items,
            'filters' => [
                'report_type' => $reportType,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'department_id' => $departmentId,
                'supplier_id' => $supplierId,
                'status' => $status,
                'item_id' => $itemId,
                'columns' => $selectedColumns,
            ],
            'availableColumns' => $this->getAvailableColumns($actualReportType),
            'selectedColumns' => $columnsArray,
        ]);
    }

    /**
     * Get stock requests report data
     */
    private function getStockRequestsReport($user, $dateFrom, $dateTo, $departmentId, $status, $itemId)
    {
        $query = StockRequest::with([
            'department',
            'requestedByUser',
            'approvedByUser',
            'items.item'
        ])->orderBy('request_date', 'desc');

        // Apply user department filter if not logistics
        if (!$user->isLogistics() && $user->department_id) {
            $query->where('department_id', $user->department_id);
        }

        // Apply filters
        if ($dateFrom) {
            $query->whereDate('request_date', '>=', $dateFrom);
        }

        if ($dateTo) {
            $query->whereDate('request_date', '<=', $dateTo);
        }

        if ($departmentId) {
            $query->where('department_id', $departmentId);
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($itemId) {
            $query->whereHas('items', function ($q) use ($itemId) {
                $q->where('item_id', $itemId);
            });
        }

        return $query->paginate(20)->through(function ($request) {
            return [
                'id' => $request->id,
                'request_number' => $request->request_number,
                'request_date' => $request->request_date,
                'department_name' => $request->department->name,
                'requested_by' => $request->requestedByUser->name,
                'status' => $request->status,
                'priority' => $request->priority,
                'total_items' => $request->items->count(),
                'total_quantity_requested' => $request->items->sum('quantity_requested'),
                'total_quantity_approved' => $request->items->sum('quantity_approved'),
                'notes' => $request->notes,
                'approved_by' => $request->approvedByUser?->name,
                'approved_at' => $request->approved_at,
                'completed_at' => $request->completed_at,
                'items' => $request->items->map(function ($item) {
                    return [
                        'item_code' => $item->item->code,
                        'item_name' => $item->item->name,
                        'quantity_requested' => $item->quantity_requested,
                        'quantity_approved' => $item->quantity_approved,
                        'quantity_fulfilled' => $item->quantity_fulfilled,
                    ];
                }),
            ];
        });
    }

    /**
     * Get purchases report data
     */
    private function getPurchasesReport($user, $dateFrom, $dateTo, $supplierId, $status, $itemId)
    {
        $query = Purchase::with([
            'supplier',
            'creator',
            'approver',
            'items.item'
        ])->orderBy('purchase_date', 'desc');

        // Apply filters
        if ($dateFrom) {
            $query->whereDate('purchase_date', '>=', $dateFrom);
        }

        if ($dateTo) {
            $query->whereDate('purchase_date', '<=', $dateTo);
        }

        if ($supplierId) {
            $query->where('supplier_id', $supplierId);
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($itemId) {
            $query->whereHas('items', function ($q) use ($itemId) {
                $q->where('item_id', $itemId);
            });
        }

        return $query->paginate(20)->through(function ($purchase) {
            return [
                'id' => $purchase->id,
                'purchase_number' => $purchase->purchase_number,
                'purchase_date' => $purchase->purchase_date,
                'supplier_name' => $purchase->supplier->name,
                'created_by' => $purchase->creator->name,
                'status' => $purchase->status,
                'total_amount' => $purchase->total_amount,
                'expected_delivery_date' => $purchase->expected_delivery_date,
                'actual_delivery_date' => $purchase->actual_delivery_date,
                'notes' => $purchase->notes,
                'approved_by' => $purchase->approver?->name,
                'approved_at' => $purchase->approved_at,
                'completed_at' => $purchase->completed_at,
                'items_count' => $purchase->items->count(),
                'items' => $purchase->items->map(function ($item) {
                    return [
                        'item_code' => $item->item->code,
                        'item_name' => $item->item->name,
                        'quantity' => $item->quantity,
                        'unit_price' => $item->unit_price,
                        'total_price' => $item->total_price,
                        'quantity_received' => $item->quantity_received,
                    ];
                }),
            ];
        });
    }

    /**
     * Get stock request items detail report data
     */
    private function getStockRequestItemsReport($user, $dateFrom, $dateTo, $departmentId, $status, $itemId)
    {
        $query = \App\Models\Inventory\StockRequestItem::with([
            'stockRequest.department',
            'item.category'
        ])->whereHas('stockRequest', function ($q) use ($user, $dateFrom, $dateTo, $departmentId, $status) {
            // Apply user department filter if not logistics
            if (!$user->isLogistics() && $user->department_id) {
                $q->where('department_id', $user->department_id);
            }

            if ($dateFrom) $q->whereDate('request_date', '>=', $dateFrom);
            if ($dateTo) $q->whereDate('request_date', '<=', $dateTo);
            if ($departmentId) $q->where('department_id', $departmentId);
            if ($status) $q->where('status', $status);
        });

        if ($itemId) {
            $query->where('item_id', $itemId);
        }

        // Order by request date desc
        $query->orderBy(
            StockRequest::select('request_date')
                ->whereColumn('stock_requests.id', 'stock_request_items.stock_request_id')
                ->limit(1),
            'desc'
        );

        return $query->paginate(20)->through(function ($item) {
            return [
                'id' => $item->id,
                'request_number' => $item->stockRequest->request_number,
                'request_date' => $item->stockRequest->request_date,
                'item_code' => $item->item->code,
                'item_name' => $item->item->name,
                'category_name' => $item->item->category?->name ?? '-',
                'department_name' => $item->stockRequest->department->name,
                'quantity_requested' => $item->quantity_requested,
                'quantity_approved' => $item->quantity_approved,
                'quantity_fulfilled' => $item->quantity_fulfilled,
                'status' => $item->stockRequest->status,
                'unit_name' => $item->item->unit_of_measure ?? '-',
            ];
        });
    }

    /**
     * Get purchase items detail report data
     */
    private function getPurchaseItemsReport($user, $dateFrom, $dateTo, $supplierId, $status, $itemId)
    {
        $query = \App\Models\Inventory\PurchaseItem::with([
            'purchase.supplier',
            'item.category'
        ])->whereHas('purchase', function ($q) use ($dateFrom, $dateTo, $supplierId, $status) {
            if ($dateFrom) $q->whereDate('purchase_date', '>=', $dateFrom);
            if ($dateTo) $q->whereDate('purchase_date', '<=', $dateTo);
            if ($supplierId) $q->where('supplier_id', $supplierId);
            if ($status) $q->where('status', $status);
        });

        if ($itemId) {
            $query->where('item_id', $itemId);
        }

        // Order by purchase date desc
        $query->orderBy(
            Purchase::select('purchase_date')
                ->whereColumn('purchases.id', 'purchase_items.purchase_id')
                ->limit(1),
            'desc'
        );

        return $query->paginate(20)->through(function ($item) {
            return [
                'id' => $item->id,
                'purchase_number' => $item->purchase->purchase_number,
                'purchase_date' => $item->purchase->purchase_date,
                'item_code' => $item->item->code,
                'item_name' => $item->item->name,
                'category_name' => $item->item->category?->name ?? '-',
                'supplier_name' => $item->purchase->supplier->name,
                'quantity_ordered' => $item->quantity_ordered,
                'quantity_received' => $item->quantity_received,
                'unit_price' => $item->unit_price,
                'total_price' => $item->total_price,
                'status' => $item->purchase->status,
                'unit_name' => $item->item->unit_of_measure ?? '-',
            ];
        });
    }

    /**
     * Get default columns for each report type
     */
    private function getDefaultColumns($reportType)
    {
        $defaults = [
            'stock_requests' => 'request_number,request_date,department_name,status,total_items,total_quantity_requested',
            'purchases' => 'purchase_number,purchase_date,supplier_name,status,total_amount,items_count',
            'department_rankings' => 'rank,department_name,total_requests,total_items,total_approved,approval_rate',
            'item_request_rankings' => 'rank,item_code,item_name,category_name,total_requests,total_quantity_requested,total_quantity_approved,approval_rate',
            'item_purchase_rankings' => 'rank,item_code,item_name,category_name,total_purchases,total_quantity,total_amount,avg_unit_price',
            'stock_request_items' => 'item_name,department_name,quantity_requested',
            'purchase_items' => 'item_name,supplier_name,quantity_ordered,total_price',
        ];

        return $defaults[$reportType] ?? '';
    }

    /**
     * Get available columns for each report type
     */
    private function getAvailableColumns($reportType)
    {
        $columns = [
            'stock_requests' => [
                ['value' => 'request_number', 'label' => 'Nomor Permintaan'],
                ['value' => 'request_date', 'label' => 'Tanggal Permintaan'],
                ['value' => 'department_name', 'label' => 'Departemen'],
                ['value' => 'requested_by', 'label' => 'Diminta Oleh'],
                ['value' => 'status', 'label' => 'Status'],
                ['value' => 'priority', 'label' => 'Prioritas'],
                ['value' => 'total_items', 'label' => 'Total Item'],
                ['value' => 'total_quantity_requested', 'label' => 'Total Qty Diminta'],
                ['value' => 'total_quantity_approved', 'label' => 'Total Qty Disetujui'],
                ['value' => 'approved_by', 'label' => 'Disetujui Oleh'],
                ['value' => 'approved_at', 'label' => 'Tanggal Disetujui'],
                ['value' => 'completed_at', 'label' => 'Tanggal Selesai'],
                ['value' => 'notes', 'label' => 'Catatan'],
            ],
            'department_rankings' => [
                ['value' => 'rank', 'label' => 'Ranking'],
                ['value' => 'department_name', 'label' => 'Departemen'],
                ['value' => 'total_requests', 'label' => 'Total Permintaan'],
                ['value' => 'total_items', 'label' => 'Total Item Diminta'],
                ['value' => 'total_approved', 'label' => 'Total Item Disetujui'],
                ['value' => 'approval_rate', 'label' => 'Tingkat Persetujuan'],
            ],
            'purchases' => [
                ['value' => 'purchase_number', 'label' => 'Nomor Pembelian'],
                ['value' => 'purchase_date', 'label' => 'Tanggal Pembelian'],
                ['value' => 'supplier_name', 'label' => 'Supplier'],
                ['value' => 'created_by', 'label' => 'Dibuat Oleh'],
                ['value' => 'status', 'label' => 'Status'],
                ['value' => 'total_amount', 'label' => 'Total Nilai'],
                ['value' => 'items_count', 'label' => 'Jumlah Item'],
                ['value' => 'expected_delivery_date', 'label' => 'Tgl Pengiriman Diharapkan'],
                ['value' => 'actual_delivery_date', 'label' => 'Tgl Pengiriman Aktual'],
                ['value' => 'approved_by', 'label' => 'Disetujui Oleh'],
                ['value' => 'approved_at', 'label' => 'Tanggal Disetujui'],
                ['value' => 'completed_at', 'label' => 'Tanggal Selesai'],
                ['value' => 'notes', 'label' => 'Catatan'],
            ],
            'item_request_rankings' => [
                ['value' => 'rank', 'label' => 'Ranking'],
                ['value' => 'item_code', 'label' => 'Kode Item'],
                ['value' => 'item_name', 'label' => 'Nama Item'],
                ['value' => 'category_name', 'label' => 'Kategori'],
                ['value' => 'unit_name', 'label' => 'Satuan'],
                ['value' => 'total_requests', 'label' => 'Total Permintaan'],
                ['value' => 'total_quantity_requested', 'label' => 'Total Qty Diminta'],
                ['value' => 'total_quantity_approved', 'label' => 'Total Qty Disetujui'],
                ['value' => 'approval_rate', 'label' => 'Tingkat Persetujuan'],
            ],
            'item_purchase_rankings' => [
                ['value' => 'rank', 'label' => 'Ranking'],
                ['value' => 'item_code', 'label' => 'Kode Item'],
                ['value' => 'item_name', 'label' => 'Nama Item'],
                ['value' => 'category_name', 'label' => 'Kategori'],
                ['value' => 'unit_name', 'label' => 'Satuan'],
                ['value' => 'total_purchases', 'label' => 'Total Pembelian'],
                ['value' => 'total_quantity', 'label' => 'Total Qty'],
                ['value' => 'total_amount', 'label' => 'Total Nilai'],
                ['value' => 'avg_unit_price', 'label' => 'Rata-rata Harga'],
            ],
            'stock_request_items' => [
                ['value' => 'request_number', 'label' => 'No. Permintaan'],
                ['value' => 'request_date', 'label' => 'Tanggal'],
                ['value' => 'item_code', 'label' => 'Kode Item'],
                ['value' => 'item_name', 'label' => 'Nama Barang'],
                ['value' => 'category_name', 'label' => 'Kategori'],
                ['value' => 'department_name', 'label' => 'Unit Peminta'],
                ['value' => 'quantity_requested', 'label' => 'Jumlah Diminta'],
                ['value' => 'quantity_approved', 'label' => 'Jumlah Disetujui'],
                ['value' => 'quantity_fulfilled', 'label' => 'Jumlah Dipenuhi'],
                ['value' => 'unit_name', 'label' => 'Satuan'],
                ['value' => 'status', 'label' => 'Status'],
            ],
            'purchase_items' => [
                ['value' => 'purchase_number', 'label' => 'No. Pembelian'],
                ['value' => 'purchase_date', 'label' => 'Tanggal'],
                ['value' => 'item_code', 'label' => 'Kode Item'],
                ['value' => 'item_name', 'label' => 'Nama Barang'],
                ['value' => 'category_name', 'label' => 'Kategori'],
                ['value' => 'supplier_name', 'label' => 'Nama Supplier'],
                ['value' => 'quantity_ordered', 'label' => 'Jumlah Barang'],
                ['value' => 'quantity_received', 'label' => 'Jumlah Diterima'],
                ['value' => 'unit_price', 'label' => 'Harga Satuan'],
                ['value' => 'total_price', 'label' => 'Total Harga'],
                ['value' => 'unit_name', 'label' => 'Satuan'],
                ['value' => 'status', 'label' => 'Status'],
            ],
        ];

        return $columns[$reportType] ?? [];
    }

    /**
     * Export report to Excel/PDF
     */
    public function export(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        $reportType = $request->input('report_type', 'stock_requests');
        $format = $request->input('format', 'excel'); // excel or pdf
        $selectedColumns = array_filter(explode(',', $request->input('columns', '')));

        // Get filter values
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        $departmentId = $request->input('department_id');
        $supplierId = $request->input('supplier_id');
        $status = $request->input('status');
        $itemId = $request->input('item_id');

        $data = [];
        $fileName = '';

        if ($reportType === 'stock_request_rankings') {
            // Export Department Rankings
            $data = $this->getDepartmentRankings($user, $dateFrom, $dateTo, $status, $itemId);
            $fileName = 'laporan-ranking-departemen-' . date('Y-m-d');
            $title = 'Laporan Ranking Departemen - Permintaan Stok';
            $reportTypeForExport = 'department_rankings';
            // Use default columns if none selected
            if (empty($selectedColumns)) {
                $selectedColumns = ['rank', 'department_name', 'total_requests', 'total_items', 'total_approved', 'approval_rate'];
            }
        } elseif ($reportType === 'stock_request_item_rankings') {
            // Export Item Request Rankings
            $data = $this->getItemRequestRankings($user, $dateFrom, $dateTo, $departmentId, $status);
            $fileName = 'laporan-ranking-item-permintaan-' . date('Y-m-d');
            $title = 'Laporan Ranking Item - Permintaan Stok';
            $reportTypeForExport = 'item_request_rankings';
            // Use default columns if none selected
            if (empty($selectedColumns)) {
                $selectedColumns = ['rank', 'item_code', 'item_name', 'category_name', 'total_requests', 'total_quantity_requested', 'total_quantity_approved', 'approval_rate'];
            }
        } elseif ($reportType === 'purchase_item_rankings') {
            // Export Item Purchase Rankings
            $data = $this->getItemPurchaseRankings($user, $dateFrom, $dateTo, $supplierId, $status);
            $fileName = 'laporan-ranking-item-pembelian-' . date('Y-m-d');
            $title = 'Laporan Ranking Item - Pembelian';
            $reportTypeForExport = 'item_purchase_rankings';
            // Use default columns if none selected
            if (empty($selectedColumns)) {
                $selectedColumns = ['rank', 'item_code', 'item_name', 'category_name', 'total_purchases', 'total_quantity', 'total_amount', 'avg_unit_price'];
            }
        } elseif ($reportType === 'stock_request_items') {
            // Export Stock Request Items Detail
            $data = $this->getStockRequestItemsExportData($user, $dateFrom, $dateTo, $departmentId, $status, $itemId);
            $fileName = 'laporan-detail-item-permintaan-' . date('Y-m-d');
            $title = 'Laporan Detail Item Permintaan';
            $reportTypeForExport = 'stock_request_items';
            // Use default columns if none selected
            if (empty($selectedColumns)) {
                $selectedColumns = ['item_name', 'department_name', 'quantity_requested'];
            }
        } elseif ($reportType === 'purchase_items') {
            // Export Purchase Items Detail
            $data = $this->getPurchaseItemsExportData($user, $dateFrom, $dateTo, $supplierId, $status, $itemId);
            $fileName = 'laporan-detail-item-pembelian-' . date('Y-m-d');
            $title = 'Laporan Detail Item Pembelian';
            $reportTypeForExport = 'purchase_items';
            // Use default columns if none selected
            if (empty($selectedColumns)) {
                $selectedColumns = ['item_name', 'supplier_name', 'quantity_ordered', 'total_price'];
            }
        } else {
            // Regular export
            if ($reportType === 'stock_requests') {
                $data = $this->getStockRequestsExportData($user, $dateFrom, $dateTo, $departmentId, $status, $itemId);
                $fileName = 'laporan-permintaan-stok-' . date('Y-m-d');
                $title = 'Laporan Permintaan Stok';
                $reportTypeForExport = 'stock_requests';
                // Use default columns if none selected
                if (empty($selectedColumns)) {
                    $selectedColumns = ['request_number', 'request_date', 'department_name', 'status', 'total_items', 'total_quantity_requested'];
                }
            } else {
                $data = $this->getPurchasesExportData($user, $dateFrom, $dateTo, $supplierId, $status, $itemId);
                $fileName = 'laporan-pembelian-' . date('Y-m-d');
                $title = 'Laporan Pembelian';
                $reportTypeForExport = 'purchases';
                // Use default columns if none selected
                if (empty($selectedColumns)) {
                    $selectedColumns = ['purchase_number', 'purchase_date', 'supplier_name', 'status', 'total_amount', 'items_count'];
                }
            }
        }

        if ($format === 'pdf') {
            return $this->exportPdf($data, $selectedColumns, $fileName, $title, $reportTypeForExport);
        } else {
            return $this->exportExcel($data, $selectedColumns, $fileName, $title, $reportTypeForExport);
        }
    }

    /**
     * Get department rankings data
     */
    private function getDepartmentRankings($user, $dateFrom, $dateTo, $status, $itemId)
    {
        // Get all active departments with stock request counts using proper aggregation
        $departments = Department::where('is_active', true)->get();

        $rankings = $departments->map(function ($dept) use ($dateFrom, $dateTo, $status, $itemId) {
            // Build query for stock requests
            $query = StockRequest::where('department_id', $dept->id);

            if ($dateFrom) $query->whereDate('request_date', '>=', $dateFrom);
            if ($dateTo) $query->whereDate('request_date', '<=', $dateTo);
            if ($status) $query->where('status', $status);
            if ($itemId) {
                $query->whereHas('items', function ($q) use ($itemId) {
                    $q->where('item_id', $itemId);
                });
            }

            $stockRequests = $query->with('items')->get();

            $totalRequests = $stockRequests->count();
            $totalItems = (int) $stockRequests->sum(fn($sr) => $sr->items->sum('quantity_requested'));
            $totalApproved = (int) $stockRequests->sum(fn($sr) => $sr->items->sum('quantity_approved'));

            return [
                'department_id' => $dept->id,
                'department_name' => $dept->name,
                'total_requests' => $totalRequests,
                'total_items' => $totalItems,
                'total_approved' => $totalApproved,
                'approval_rate' => $totalItems > 0
                    ? round(($totalApproved / $totalItems) * 100, 0) . '%'
                    : '0%',
            ];
        })
        ->filter(fn($item) => $item['total_requests'] > 0) // Only show departments with requests
        ->sortByDesc('total_requests')
        ->values()
        ->map(function ($item, $index) {
            return array_merge(['rank' => $index + 1], $item);
        })
        ->toArray();

        return $rankings;
    }

    /**
     * Get item request rankings data
     */
    private function getItemRequestRankings($user, $dateFrom, $dateTo, $departmentId, $status)
    {
        // Get all active items
        $items = Item::where('is_active', true)->with(['category'])->get();

        $rankings = $items->map(function ($item) use ($dateFrom, $dateTo, $departmentId, $status, $user) {
            // Build query for stock request items
            $query = \App\Models\Inventory\StockRequestItem::where('item_id', $item->id)
                ->whereHas('stockRequest', function ($q) use ($dateFrom, $dateTo, $departmentId, $status, $user) {
                    if ($dateFrom) $q->whereDate('request_date', '>=', $dateFrom);
                    if ($dateTo) $q->whereDate('request_date', '<=', $dateTo);
                    if ($departmentId) $q->where('department_id', $departmentId);
                    if ($status) $q->where('status', $status);
                    
                    // Apply user department filter if not logistics
                    if (!$user->isLogistics() && $user->department_id) {
                        $q->where('department_id', $user->department_id);
                    }
                });

            $totalRequests = $query->count();
            $totalQtyRequested = (int) (clone $query)->sum('quantity_requested');
            $totalQtyApproved = (int) (clone $query)->sum('quantity_approved');

            return [
                'item_id' => $item->id,
                'item_code' => $item->code,
                'item_name' => $item->name,
                'category_name' => $item->category?->name ?? '-',
                'unit_name' => $item->unit_of_measure ?? '-',
                'total_requests' => $totalRequests,
                'total_quantity_requested' => $totalQtyRequested,
                'total_quantity_approved' => $totalQtyApproved,
                'approval_rate' => $totalQtyRequested > 0
                    ? round(($totalQtyApproved / $totalQtyRequested) * 100, 0) . '%'
                    : '0%',
            ];
        })
        ->filter(fn($item) => $item['total_requests'] > 0)
        ->sortByDesc('total_requests')
        ->values()
        ->map(function ($item, $index) {
            return array_merge(['rank' => $index + 1], $item);
        })
        ->toArray();

        return $rankings;
    }

    /**
     * Get item purchase rankings data
     */
    private function getItemPurchaseRankings($user, $dateFrom, $dateTo, $supplierId, $status)
    {
        // Get all active items
        $items = Item::where('is_active', true)->with(['category'])->get();

        $rankings = $items->map(function ($item) use ($dateFrom, $dateTo, $supplierId, $status) {
            // Build query for purchase items
            $query = \App\Models\Inventory\PurchaseItem::where('item_id', $item->id)
                ->whereHas('purchase', function ($q) use ($dateFrom, $dateTo, $supplierId, $status) {
                    if ($dateFrom) $q->whereDate('purchase_date', '>=', $dateFrom);
                    if ($dateTo) $q->whereDate('purchase_date', '<=', $dateTo);
                    if ($supplierId) $q->where('supplier_id', $supplierId);
                    if ($status) $q->where('status', $status);
                });

            $totalPurchases = $query->count();
            $totalQty = (int) (clone $query)->sum('quantity_ordered');
            $totalAmount = (int) (clone $query)->sum('total_price');
            $avgUnitPrice = $totalQty > 0 ? (int) ($totalAmount / $totalQty) : 0;

            return [
                'item_id' => $item->id,
                'item_code' => $item->code,
                'item_name' => $item->name,
                'category_name' => $item->category?->name ?? '-',
                'unit_name' => $item->unit_of_measure ?? '-',
                'total_purchases' => $totalPurchases,
                'total_quantity' => $totalQty,
                'total_amount' => $totalAmount,
                'avg_unit_price' => $avgUnitPrice,
            ];
        })
        ->filter(fn($item) => $item['total_purchases'] > 0)
        ->sortByDesc('total_purchases')
        ->values()
        ->map(function ($item, $index) {
            return array_merge(['rank' => $index + 1], $item);
        })
        ->toArray();

        return $rankings;
    }

    /**
     * Get stock requests export data
     */
    private function getStockRequestsExportData($user, $dateFrom, $dateTo, $departmentId, $status, $itemId)
    {
        $query = StockRequest::with(['department', 'requestedByUser', 'approvedByUser', 'items.item'])
            ->orderBy('request_date', 'desc');

        if (!$user->isLogistics() && $user->department_id) {
            $query->where('department_id', $user->department_id);
        }

        if ($dateFrom) $query->whereDate('request_date', '>=', $dateFrom);
        if ($dateTo) $query->whereDate('request_date', '<=', $dateTo);
        if ($departmentId) $query->where('department_id', $departmentId);
        if ($status) $query->where('status', $status);
        if ($itemId) {
            $query->whereHas('items', function ($q) use ($itemId) {
                $q->where('item_id', $itemId);
            });
        }

        return $query->get()->map(function ($request) {
            return [
                'request_number' => $request->request_number,
                'request_date' => $request->request_date,
                'department_name' => $request->department->name,
                'requested_by' => $request->requestedByUser->name,
                'status' => $request->status,
                'priority' => $request->priority,
                'total_items' => $request->items->count(),
                'total_quantity_requested' => $request->items->sum('quantity_requested'),
                'total_quantity_approved' => $request->items->sum('quantity_approved'),
                'notes' => $request->notes,
                'approved_by' => $request->approvedByUser?->name,
                'approved_at' => $request->approved_at,
                'completed_at' => $request->completed_at,
            ];
        })->toArray();
    }

    /**
     * Get purchases export data
     */
    private function getPurchasesExportData($user, $dateFrom, $dateTo, $supplierId, $status, $itemId)
    {
        $query = Purchase::with(['supplier', 'creator', 'approver', 'items.item'])
            ->orderBy('purchase_date', 'desc');

        if ($dateFrom) $query->whereDate('purchase_date', '>=', $dateFrom);
        if ($dateTo) $query->whereDate('purchase_date', '<=', $dateTo);
        if ($supplierId) $query->where('supplier_id', $supplierId);
        if ($status) $query->where('status', $status);
        if ($itemId) {
            $query->whereHas('items', function ($q) use ($itemId) {
                $q->where('item_id', $itemId);
            });
        }

        return $query->get()->map(function ($purchase) {
            return [
                'purchase_number' => $purchase->purchase_number,
                'purchase_date' => $purchase->purchase_date,
                'supplier_name' => $purchase->supplier->name,
                'created_by' => $purchase->creator->name,
                'status' => $purchase->status,
                'total_amount' => $purchase->total_amount,
                'items_count' => $purchase->items->count(),
                'expected_delivery_date' => $purchase->expected_delivery_date,
                'actual_delivery_date' => $purchase->actual_delivery_date,
                'notes' => $purchase->notes,
                'approved_by' => $purchase->approver?->name,
                'approved_at' => $purchase->approved_at,
                'completed_at' => $purchase->completed_at,
            ];
        })->toArray();
    }

    /**
     * Get stock request items export data
     */
    private function getStockRequestItemsExportData($user, $dateFrom, $dateTo, $departmentId, $status, $itemId)
    {
        $query = \App\Models\Inventory\StockRequestItem::with([
            'stockRequest.department',
            'item.category'
        ])->whereHas('stockRequest', function ($q) use ($user, $dateFrom, $dateTo, $departmentId, $status) {
            if (!$user->isLogistics() && $user->department_id) {
                $q->where('department_id', $user->department_id);
            }
            if ($dateFrom) $q->whereDate('request_date', '>=', $dateFrom);
            if ($dateTo) $q->whereDate('request_date', '<=', $dateTo);
            if ($departmentId) $q->where('department_id', $departmentId);
            if ($status) $q->where('status', $status);
        });

        if ($itemId) {
            $query->where('item_id', $itemId);
        }

        return $query->get()->map(function ($item) {
            return [
                'request_number' => $item->stockRequest->request_number,
                'request_date' => $item->stockRequest->request_date,
                'item_code' => $item->item->code,
                'item_name' => $item->item->name,
                'category_name' => $item->item->category?->name ?? '-',
                'department_name' => $item->stockRequest->department->name,
                'quantity_requested' => $item->quantity_requested,
                'quantity_approved' => $item->quantity_approved,
                'quantity_fulfilled' => $item->quantity_fulfilled,
                'unit_name' => $item->item->unit_of_measure ?? '-',
                'status' => $item->stockRequest->status,
            ];
        })->toArray();
    }

    /**
     * Get purchase items export data
     */
    private function getPurchaseItemsExportData($user, $dateFrom, $dateTo, $supplierId, $status, $itemId)
    {
        $query = \App\Models\Inventory\PurchaseItem::with([
            'purchase.supplier',
            'item.category'
        ])->whereHas('purchase', function ($q) use ($dateFrom, $dateTo, $supplierId, $status) {
            if ($dateFrom) $q->whereDate('purchase_date', '>=', $dateFrom);
            if ($dateTo) $q->whereDate('purchase_date', '<=', $dateTo);
            if ($supplierId) $q->where('supplier_id', $supplierId);
            if ($status) $q->where('status', $status);
        });

        if ($itemId) {
            $query->where('item_id', $itemId);
        }

        return $query->get()->map(function ($item) {
            return [
                'purchase_number' => $item->purchase->purchase_number,
                'purchase_date' => $item->purchase->purchase_date,
                'item_code' => $item->item->code,
                'item_name' => $item->item->name,
                'category_name' => $item->item->category?->name ?? '-',
                'supplier_name' => $item->purchase->supplier->name,
                'quantity_ordered' => $item->quantity_ordered,
                'quantity_received' => $item->quantity_received,
                'unit_price' => $item->unit_price,
                'total_price' => $item->total_price,
                'unit_name' => $item->item->unit_of_measure ?? '-',
                'status' => $item->purchase->status,
            ];
        })->toArray();
    }

    /**
     * Export to PDF
     */
    private function exportPdf($data, $selectedColumns, $fileName, $title, $reportType)
    {
        $columns = $this->getAvailableColumns($reportType);
        $columnsToShow = empty($selectedColumns) 
            ? array_column($columns, 'value')
            : $selectedColumns;

        $pdf = Pdf::loadView('reports.inventory-pdf', [
            'title' => $title,
            'data' => $data,
            'columns' => $columns,
            'columnsToShow' => $columnsToShow,
            'generatedAt' => now()->format('d/m/Y H:i'),
        ]);

        return $pdf->download($fileName . '.pdf');
    }

    /**
     * Export to Excel
     */
    private function exportExcel($data, $selectedColumns, $fileName, $title, $reportType)
    {
        $columns = $this->getAvailableColumns($reportType);
        $columnsToShow = empty($selectedColumns)
            ? array_column($columns, 'value')
            : $selectedColumns;

        // Check if this is a ranking report (has 'rank' column)
        $isRankingReport = $reportType === 'department_rankings';

        // Prepare data with selected columns only
        $exportData = collect($data)->map(function ($row, $index) use ($columnsToShow, $columns, $isRankingReport) {
            $result = [];

            // Only add "No" column if not a ranking report (ranking has its own rank column)
            if (!$isRankingReport) {
                $result['No'] = $index + 1;
            }

            foreach ($columnsToShow as $column) {
                $columnInfo = collect($columns)->firstWhere('value', $column);
                $label = $columnInfo['label'] ?? $column;
                $value = $row[$column] ?? '-';

                // Format currency values
                if (strpos($column, 'amount') !== false || strpos($column, 'price') !== false) {
                    $value = is_numeric($value) ? 'Rp ' . number_format($value, 0, ',', '.') : $value;
                }

                $result[$label] = $value;
            }

            return $result;
        });

        return (new FastExcel($exportData))->download($fileName . '.xlsx');
    }
}
