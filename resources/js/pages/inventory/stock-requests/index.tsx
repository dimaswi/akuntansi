import { type Column, type FilterField, DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type PageProps } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { AlertTriangle, CheckCircle, Clock, Edit, Eye, Package, Plus, XCircle } from 'lucide-react';

interface StockRequest {
    id: number;
    request_number: string;
    request_date: string;
    department: { id: number; name: string };
    requested_by: { id: number; name: string };
    status: 'draft' | 'submitted' | 'approved' | 'completed' | 'rejected' | 'cancelled';
    priority: 'low' | 'normal' | 'high' | 'urgent';
    total_items: number;
    total_quantity_requested: number;
    total_quantity_approved?: number;
    can_edit: boolean;
    can_submit: boolean;
    can_approve: boolean;
    can_complete: boolean;
}

interface Department { id: number; name: string; is_active?: boolean }

interface Props extends PageProps {
    stockRequests: { data: StockRequest[]; links: any; meta?: any };
    statistics: Record<string, number>;
    departments: Department[];
    filters: { search?: string; status?: string; department_id?: number; priority?: string };
}

const breadcrumbItems: BreadcrumbItem[] = [
    { title: <Package className="h-4 w-4" />, href: '#' },
    { title: 'Permintaan Stok', href: '' },
];

const statusCfg: Record<string, { variant: 'secondary' | 'default' | 'destructive'; icon: React.ComponentType<{ className?: string }>; label: string }> = {
    draft: { variant: 'secondary', icon: Edit, label: 'Draft' },
    submitted: { variant: 'default', icon: Clock, label: 'Submitted' },
    approved: { variant: 'default', icon: CheckCircle, label: 'Approved' },
    completed: { variant: 'default', icon: CheckCircle, label: 'Completed' },
    rejected: { variant: 'destructive', icon: XCircle, label: 'Rejected' },
    cancelled: { variant: 'secondary', icon: XCircle, label: 'Cancelled' },
};

const priorityCfg: Record<string, { variant: 'secondary' | 'default' | 'destructive'; label: string; hasIcon?: boolean }> = {
    low: { variant: 'secondary', label: 'Low' },
    normal: { variant: 'default', label: 'Normal' },
    high: { variant: 'default', label: 'High' },
    urgent: { variant: 'destructive', label: 'Urgent', hasIcon: true },
};

export default function index() {
    const { stockRequests, departments, filters } = usePage<Props>().props;

    const meta = stockRequests.meta || {};
    const pagination = {
        current_page: meta.current_page ?? 1,
        last_page: meta.last_page ?? 1,
        per_page: meta.per_page ?? 10,
        total: meta.total ?? 0,
        from: meta.from ?? 0,
        to: meta.to ?? 0,
    };

    const navigate = (p: Record<string, any>) =>
        router.get(route('stock-requests.index'), p, { preserveState: true, preserveScroll: true });

    const fp = {
        search: filters.search || '',
        status: filters.status || '',
        department_id: filters.department_id ? String(filters.department_id) : '',
        priority: filters.priority || '',
    };

    const columns: Column<StockRequest>[] = [
        { key: 'request_number', label: 'Request Number', className: 'font-medium', render: (row) => row.request_number },
        { key: 'request_date', label: 'Request Date', render: (row) => new Date(row.request_date).toLocaleDateString('id-ID') },
        { key: 'department', label: 'Department', render: (row) => row.department.name },
        { key: 'requested_by', label: 'Requested By', render: (row) => row.requested_by.name },
        {
            key: 'priority', label: 'Priority',
            render: (row) => {
                const c = priorityCfg[row.priority] || priorityCfg.normal;
                return (
                    <Badge variant={c.variant} className="inline-flex items-center gap-1">
                        {c.hasIcon && <AlertTriangle className="h-3 w-3" />}
                        {c.label}
                    </Badge>
                );
            },
        },
        { key: 'items', label: 'Items', render: (row) => row.total_items },
        { key: 'qty_requested', label: 'Qty Requested', render: (row) => row.total_quantity_requested },
        { key: 'qty_approved', label: 'Qty Approved', render: (row) => row.total_quantity_approved || '-' },
        {
            key: 'status', label: 'Status',
            render: (row) => {
                const c = statusCfg[row.status] || statusCfg.draft;
                const Icon = c.icon;
                return (
                    <Badge variant={c.variant} className="inline-flex items-center gap-1">
                        <Icon className="h-3 w-3" />
                        {c.label}
                    </Badge>
                );
            },
        },
        {
            key: 'actions', label: 'Actions',
            className: 'text-right',
            render: (row) => (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); router.visit(route('stock-requests.show', row.id)); }}
                    className="gap-2"
                >
                    <Eye className="h-4 w-4" />
                    View
                </Button>
            ),
        },
    ];

    const filterFields: FilterField[] = [
        {
            name: 'status',
            label: 'Status',
            type: 'select',
            value: fp.status,
            options: [
                { value: 'draft', label: 'Draft' },
                { value: 'submitted', label: 'Submitted' },
                { value: 'approved', label: 'Approved' },
                { value: 'completed', label: 'Completed' },
                { value: 'rejected', label: 'Rejected' },
                { value: 'cancelled', label: 'Cancelled' },
            ],
        },
        {
            name: 'department_id',
            label: 'Department',
            type: 'select',
            value: fp.department_id,
            options: departments.map((d) => ({ value: d.id.toString(), label: d.name })),
        },
        {
            name: 'priority',
            label: 'Priority',
            type: 'select',
            value: fp.priority,
            options: [
                { value: 'low', label: 'Low' },
                { value: 'normal', label: 'Normal' },
                { value: 'high', label: 'High' },
                { value: 'urgent', label: 'Urgent' },
            ],
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbItems}>
            <Head title="Permintaan Stok" />
            <div className="p-4">
                <DataTable<StockRequest>
                    pageTitle="Daftar Permintaan Stok"
                    pageSubtitle="Kelola data permintaan stok Anda di sini"
                    columns={columns}
                    data={stockRequests.data}
                    pagination={pagination}
                    searchValue={fp.search}
                    searchPlaceholder="Search by request number or notes..."
                    onSearch={(v) => navigate({ ...fp, search: v, page: 1 })}
                    filters={filterFields}
                    onFilterChange={(k, v) => navigate({ ...fp, [k]: v, page: 1 })}
                    onFilterReset={() => navigate({ search: '', status: '', department_id: '', priority: '', page: 1 })}
                    onPageChange={(p) => navigate({ ...fp, page: p })}
                    onPerPageChange={(n) => navigate({ ...fp, perPage: n, page: 1 })}
                    headerActions={
                        <Button onClick={() => router.get(route('stock-requests.create'))} className="gap-2">
                            <Plus className="h-4 w-4" />
                            New Request
                        </Button>
                    }
                    emptyIcon={<Package className="h-8 w-8 text-muted-foreground/50" />}
                    emptyText="No Permintaan Stok found"
                    rowKey={(r) => r.id}
                    onRowClick={(r) => router.visit(route('stock-requests.show', r.id))}
                    rowClassName={() => 'cursor-pointer'}
                />
            </div>
        </AppLayout>
    );
}
