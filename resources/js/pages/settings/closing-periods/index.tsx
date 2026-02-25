import { type Column, type FilterField, DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { BookOpenCheck, Edit3, Eye, PlusCircle } from 'lucide-react';

interface ClosingPeriod {
    id: number;
    period_code: string;
    period_name: string;
    period_type: string;
    period_start: string;
    period_end: string;
    cutoff_date: string;
    hard_close_date: string | null;
    status: 'open' | 'soft_close' | 'hard_close';
}

interface Props {
    periods: { data: ClosingPeriod[]; current_page: number; last_page: number; per_page: number; total: number; from: number; to: number };
    years: number[];
    filters: { status: string; year: string };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: <BookOpenCheck className="h-4 w-4" />, href: '/settings/closing-periods/list' },
    { title: 'Periode Tutup Buku', href: '' },
];

const fmtDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });

const statusCfg: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive'; className: string }> = {
    open: { label: 'Open', variant: 'default', className: 'bg-emerald-500' },
    soft_close: { label: 'Soft Close', variant: 'secondary', className: 'bg-amber-500 text-white' },
    hard_close: { label: 'Hard Close', variant: 'destructive', className: 'bg-red-500' },
};

export default function ClosingPeriodsIndex({ periods, years, filters }: Props) {
    const navigate = (p: Record<string, any>) =>
        router.get(route('settings.closing-periods.list'), p, { preserveState: true, replace: true });

    const fp = { status: filters.status || '', year: filters.year || '' };

    const columns: Column<ClosingPeriod>[] = [
        { key: 'no', label: 'No', className: 'w-[60px] font-medium', render: (_row, _index, meta) => meta.rowNumber },
        {
            key: 'nama_periode', label: 'Nama Periode',
            className: 'font-medium',
            render: (row) => (
                <div>
                    <div>{row.period_name}</div>
                    <div className="text-xs text-muted-foreground">{row.period_code}</div>
                </div>
            ),
        },
        { key: 'tipe', label: 'Tipe', className: 'text-muted-foreground capitalize', render: (row) => row.period_type },
        { key: 'tanggal_mulai', label: 'Tanggal Mulai', className: 'text-muted-foreground', render: (row) => fmtDate(row.period_start) },
        { key: 'tanggal_selesai', label: 'Tanggal Selesai', className: 'text-muted-foreground', render: (row) => fmtDate(row.period_end) },
        { key: 'cutoff_date', label: 'Cutoff Date', className: 'text-muted-foreground', render: (row) => fmtDate(row.cutoff_date) },
        {
            key: 'status', label: 'Status',
            render: (row) => {
                const c = statusCfg[row.status] || statusCfg.open;
                return <Badge variant={c.variant} className={c.className}>{c.label}</Badge>;
            },
        },
        {
            key: 'aksi', label: 'Aksi',
            className: 'text-right',
            render: (row) => (
                <div className="flex items-center justify-end gap-2">
                    {row.status === 'open' && (
                        <Button variant="ghost" size="icon" onClick={() => router.visit(route('settings.closing-periods.edit', row.id))} title="Edit">
                            <Edit3 className="h-4 w-4" />
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => router.visit(route('settings.closing-periods.show', row.id))} title="Detail">
                        <Eye className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    const filterFields: FilterField[] = [
        { name: 'status', label: 'Status', type: 'select', value: fp.status, options: [{ value: 'open', label: 'Open' }, { value: 'soft_close', label: 'Soft Close' }, { value: 'hard_close', label: 'Hard Close' }] },
        { name: 'year', label: 'Tahun', type: 'select', value: fp.year, options: years.map((y) => ({ value: y.toString(), label: y.toString() })) },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Periode Tutup Buku" />
            <div className="p-4">
                <DataTable<ClosingPeriod>
                    columns={columns}
                    data={periods.data}
                    pagination={periods}
                    searchValue=""
                    searchPlaceholder=""
                    onSearch={() => {}}
                    filters={filterFields}
                    onFilterChange={(k, v) => navigate({ ...fp, [k]: v, page: 1 })}
                    onFilterReset={() => navigate({ status: '', year: '', page: 1 })}
                    onPageChange={(p) => navigate({ ...fp, page: p })}
                    onPerPageChange={(n) => navigate({ ...fp, perPage: n, page: 1 })}
                    headerActions={
                        <Button onClick={() => router.visit(route('settings.closing-periods.create'))} className="gap-2">
                            <PlusCircle className="h-4 w-4" />
                            Buat Periode
                        </Button>
                    }
                    emptyIcon={<BookOpenCheck className="h-8 w-8 text-muted-foreground/50" />}
                    emptyText="Belum ada periode tutup buku"
                    rowKey={(p) => p.id}
                />
            </div>
        </AppLayout>
    );
}
