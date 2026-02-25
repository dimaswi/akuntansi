import { type Column, type FilterField, DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { ClipboardList, Eye, Landmark, PlusCircle } from 'lucide-react';
import { route } from 'ziggy-js';

interface Budget {
    id: number;
    code: string;
    fiscal_year: number;
    title: string;
    total_budget: number;
    total_realized: number;
    status: string;
    items_count: number;
    creator?: { id: number; name: string };
    approver?: { id: number; name: string };
    approved_at?: string;
    created_at: string;
}

interface PaginatedBudgets {
    data: Budget[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Props extends SharedData {
    budgets: PaginatedBudgets;
    filters: Record<string, string>;
    availableYears: number[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: <Landmark className="h-4 w-4" />, href: route('aset.dashboard') },
    { title: 'RAB Aset', href: '#' },
];

const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    draft: { label: 'Draft', variant: 'secondary' },
    submitted: { label: 'Diajukan', variant: 'outline' },
    approved: { label: 'Disetujui', variant: 'default' },
    closed: { label: 'Ditutup', variant: 'destructive' },
};

export default function BudgetIndex() {
    const { budgets, filters, availableYears } = usePage<Props>().props;

    const nav = (params: Record<string, string | number | undefined>) => {
        router.get(route('aset.budgets.index'), { ...filters, ...params }, { preserveState: true, replace: true });
    };

    const columns: Column<Budget>[] = [
        {
            key: 'code', label: 'Kode', className: 'w-36',
            render: (r) => <span className="font-mono text-sm">{r.code}</span>,
        },
        {
            key: 'fiscal_year', label: 'Tahun', className: 'w-20',
            render: (r) => r.fiscal_year,
        },
        {
            key: 'title', label: 'Judul',
            render: (r) => <span className="font-medium">{r.title}</span>,
        },
        {
            key: 'items_count', label: 'Item', className: 'w-16 text-center',
            render: (r) => <span className="text-center block">{r.items_count}</span>,
        },
        {
            key: 'total_budget', label: 'Total Anggaran', className: 'text-right',
            render: (r) => <span className="text-right block">{fmtCurrency(r.total_budget)}</span>,
        },
        {
            key: 'total_realized', label: 'Realisasi', className: 'text-right',
            render: (r) => <span className="text-right block">{fmtCurrency(r.total_realized)}</span>,
        },
        {
            key: 'progress', label: 'Progress', className: 'w-32',
            render: (r) => {
                const pct = r.total_budget > 0 ? (r.total_realized / r.total_budget) * 100 : 0;
                return (
                    <div className="flex items-center gap-2">
                        <Progress value={pct} className="h-2 w-16" />
                        <span className="text-xs text-muted-foreground">{pct.toFixed(0)}%</span>
                    </div>
                );
            },
        },
        {
            key: 'status', label: 'Status', className: 'w-28 text-center',
            render: (r) => {
                const st = statusMap[r.status];
                return <Badge variant={st?.variant}>{st?.label ?? r.status}</Badge>;
            },
        },
        {
            key: 'actions', label: '', className: 'w-16',
            render: (r) => (
                <Button variant="ghost" size="icon" onClick={() => router.visit(route('aset.budgets.show', r.id))}>
                    <Eye className="h-4 w-4" />
                </Button>
            ),
        },
    ];

    const filterFields: FilterField[] = [
        {
            name: 'fiscal_year', label: 'Tahun', type: 'select',
            options: availableYears.map((y) => ({ value: y.toString(), label: y.toString() })),
            value: filters.fiscal_year ?? '',
        },
        {
            name: 'status', label: 'Status', type: 'select',
            options: [
                { value: 'draft', label: 'Draft' },
                { value: 'submitted', label: 'Diajukan' },
                { value: 'approved', label: 'Disetujui' },
                { value: 'closed', label: 'Ditutup' },
            ],
            value: filters.status ?? '',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="RAB Aset" />
            <div className="p-4">
                <DataTable
                    columns={columns}
                    data={budgets.data}
                    pagination={budgets}
                    searchValue={filters.search ?? ''}
                    searchPlaceholder="Cari kode / judul..."
                    onSearch={(v) => nav({ search: v, page: 1 })}
                    filters={filterFields}
                    onFilterChange={(name, val) => nav({ [name]: val, page: 1 })}
                    onFilterReset={() => router.get(route('aset.budgets.index'), {}, { preserveState: true, replace: true })}
                    onPageChange={(p) => nav({ page: p })}
                    onPerPageChange={(pp) => nav({ perPage: pp, page: 1 })}
                    headerActions={
                        <Button onClick={() => router.visit(route('aset.budgets.create'))}>
                            <PlusCircle className="mr-2 h-4 w-4" />Buat RAB
                        </Button>
                    }
                    rowKey={(r) => r.id}
                    emptyIcon={<ClipboardList className="h-12 w-12 text-muted-foreground/50" />}
                    emptyText="Belum ada data RAB"
                    pageTitle="Rencana Anggaran Belanja Aset"
                    pageSubtitle="Kelola RAB pengadaan aset"
                    onRowClick={(r) => router.visit(route('aset.budgets.show', r.id))}
                />
            </div>
        </AppLayout>
    );
}
