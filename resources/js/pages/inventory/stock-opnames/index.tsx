import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { type Column, type FilterField, DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlusCircle, Eye, FileBarChart } from 'lucide-react';

interface StockOpname {
    id: number;
    opname_number: string;
    opname_date: string;
    status: 'draft' | 'submitted' | 'approved' | 'rejected';
    total_items_counted: number;
    total_variance_value: number;
    notes?: string;
    rejection_reason?: string;
    department: { id: number; name: string };
    creator: { id: number; name: string };
    approver?: { id: number; name: string };
    approved_at?: string;
    created_at: string;
}

interface Department { id: number; name: string }

interface PaginatedOpnames {
    data: StockOpname[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Props extends SharedData {
    opnames: PaginatedOpnames;
    filters: { search: string; status?: string; department_id?: string; perPage: number };
    departments: Department[];
    isLogistics: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: <FileBarChart className="h-4 w-4" />, href: '#' },
    { title: 'Stock Opname', href: '#' },
];

const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

const statusCfg: Record<string, { label: string; className: string }> = {
    draft: { label: 'Draft', className: 'bg-gray-100 text-gray-800' },
    submitted: { label: 'Submitted', className: 'bg-blue-100 text-blue-800' },
    approved: { label: 'Approved', className: 'bg-green-100 text-green-800' },
    rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800' },
};

export default function StockOpnameIndex() {
    const { opnames, filters, departments, isLogistics } = usePage<Props>().props;

    const navigate = (p: Record<string, any>) =>
        router.get('/stock-opnames', p, { preserveState: true, replace: true });

    const fp = {
        search: filters.search || '',
        status: filters.status || '',
        department_id: filters.department_id || '',
        perPage: filters.perPage,
    };

    const columns: Column<StockOpname>[] = [
        { key: 'no', label: 'No', className: 'w-[60px]', render: (_row, _index, meta) => meta.rowNumber },
        { key: 'nomor_opname', label: 'Nomor Opname', className: 'font-medium', render: (row) => row.opname_number },
        { key: 'department', label: 'Department', render: (row) => row.department.name },
        { key: 'tanggal', label: 'Tanggal', render: (row) => fmtDate(row.opname_date) },
        {
            key: 'items', label: 'Items',
            render: (row) => <Badge variant="outline">{row.total_items_counted} items</Badge>,
        },
        {
            key: 'variance', label: 'Variance',
            render: (row) => {
                const v = row.total_variance_value;
                if (v === 0) return <Badge className="bg-green-100 text-green-800">Match</Badge>;
                if (v > 0) return <Badge className="bg-blue-100 text-blue-800">+{fmtCurrency(v)}</Badge>;
                return <Badge className="bg-red-100 text-red-800">{fmtCurrency(v)}</Badge>;
            },
        },
        {
            key: 'status', label: 'Status',
            render: (row) => {
                const c = statusCfg[row.status] || statusCfg.draft;
                return <Badge className={c.className}>{c.label}</Badge>;
            },
        },
        { key: 'dibuat_oleh', label: 'Dibuat Oleh', render: (row) => row.creator.name },
        {
            key: 'aksi', label: 'Aksi',
            className: 'text-right',
            render: (row) => (
                <Button variant="ghost" size="sm" onClick={() => router.visit(route('stock-opnames.show', row.id))}>
                    <Eye className="h-4 w-4" />
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
                { value: 'rejected', label: 'Rejected' },
            ],
        },
        ...(isLogistics
            ? [
                  {
                      name: 'department_id',
                      label: 'Department',
                      type: 'select' as const,
                      value: fp.department_id,
                      options: departments.map((d) => ({ value: d.id.toString(), label: d.name })),
                  },
              ]
            : []),
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Stock Opname" />
            <div className="p-4">
                <DataTable<StockOpname>
                    pageTitle="Daftar Stock Opname"
                    pageSubtitle="Kelola data stock opname Anda di sini"
                    columns={columns}
                    data={opnames.data}
                    pagination={opnames}
                    searchValue={fp.search}
                    searchPlaceholder="Cari nomor opname atau department..."
                    onSearch={(v) => navigate({ ...fp, search: v, page: 1 })}
                    filters={filterFields}
                    onFilterChange={(k, v) => navigate({ ...fp, [k]: v, page: 1 })}
                    onFilterReset={() => navigate({ search: '', status: '', department_id: '', perPage: fp.perPage, page: 1 })}
                    onPageChange={(p) => navigate({ ...fp, page: p })}
                    onPerPageChange={(n) => navigate({ ...fp, perPage: n, page: 1 })}
                    headerActions={
                        <Button onClick={() => router.visit(route('stock-opnames.create'))} className="gap-2">
                            <PlusCircle className="h-4 w-4" />
                            Buat Stock Opname
                        </Button>
                    }
                    emptyIcon={<FileBarChart className="h-8 w-8 text-muted-foreground/50" />}
                    emptyText="Tidak ada data stock opname"
                    rowKey={(r) => r.id}
                />
            </div>
        </AppLayout>
    );
}
