import { type Column, type FilterField, DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Landmark, Plus } from 'lucide-react';

interface Disposal {
    id: number; disposal_number: string; disposal_date: string; disposal_method: string;
    disposal_price: number; status: string;
    asset: { id: number; code: string; name: string };
}
interface PaginatedDisposals {
    data: Disposal[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Props extends SharedData {
    disposals: PaginatedDisposals;
    filters: { search?: string; status?: string; disposal_method?: string };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: <Landmark className="h-4 w-4" />, href: '/aset' },
    { title: 'Disposal Aset', href: '#' },
];

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending: { label: 'Menunggu', variant: 'secondary' },
    approved: { label: 'Disetujui', variant: 'default' },
    completed: { label: 'Selesai', variant: 'outline' },
    cancelled: { label: 'Dibatalkan', variant: 'destructive' },
};
const methodMap: Record<string, string> = { sale: 'Penjualan', scrap: 'Penghapusan', donation: 'Donasi', trade_in: 'Tukar Tambah', write_off: 'Write Off' };

const fmt = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

export default function DisposalIndex() {
    const { disposals, filters } = usePage<Props>().props;

    const nav = (params: Record<string, string | number>) => {
        router.get('/aset/disposals', { ...filters, ...params }, { preserveState: true, replace: true });
    };

    const columns: Column<Disposal>[] = [
        { key: 'disposal_number', label: 'No. Disposal', render: (d) => <span className="font-mono text-sm">{d.disposal_number}</span> },
        { key: 'asset', label: 'Aset', render: (d) => <span>{d.asset.code} - {d.asset.name}</span> },
        { key: 'disposal_method', label: 'Metode', render: (d) => <span>{methodMap[d.disposal_method] ?? d.disposal_method}</span> },
        { key: 'disposal_date', label: 'Tanggal', render: (d) => <span>{new Date(d.disposal_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span> },
        { key: 'disposal_price', label: 'Harga Jual', render: (d) => <span>{fmt(d.disposal_price)}</span> },
        {
            key: 'status', label: 'Status', render: (d) => {
                const s = statusMap[d.status] ?? { label: d.status, variant: 'outline' as const };
                return <Badge variant={s.variant}>{s.label}</Badge>;
            },
        },
    ];

    const filterFields: FilterField[] = [
        { name: 'status', label: 'Status', type: 'select', options: [{ value: 'pending', label: 'Menunggu' }, { value: 'approved', label: 'Disetujui' }, { value: 'completed', label: 'Selesai' }, { value: 'cancelled', label: 'Dibatalkan' }], value: filters.status ?? '' },
        { name: 'disposal_method', label: 'Metode', type: 'select', options: [{ value: 'sale', label: 'Penjualan' }, { value: 'scrap', label: 'Penghapusan' }, { value: 'donation', label: 'Donasi' }, { value: 'trade_in', label: 'Tukar Tambah' }, { value: 'write_off', label: 'Write Off' }], value: filters.disposal_method ?? '' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Disposal Aset" />
            <div className="p-4">
                <DataTable
                    columns={columns}
                    data={disposals.data}
                    pagination={disposals}
                    searchValue={filters.search ?? ''}
                    searchPlaceholder="Cari disposal..."
                    onSearch={(v) => nav({ search: v, page: 1 })}
                    filters={filterFields}
                    onFilterChange={(name, val) => nav({ [name]: val, page: 1 })}
                    onFilterReset={() => router.get('/aset/disposals', {}, { preserveState: true, replace: true })}
                    onPageChange={(p) => nav({ page: p })}
                    onPerPageChange={(pp) => nav({ perPage: pp, page: 1 })}
                    onRowClick={(d) => router.visit(`/aset/disposals/${d.id}`)}
                    headerActions={<Button onClick={() => router.visit('/aset/disposals/create')}><Plus className="mr-2 h-4 w-4" />Tambah Disposal</Button>}
                    rowKey={(r) => r.id}
                    emptyIcon={<Landmark className="h-12 w-12 text-muted-foreground/50" />}
                    emptyText="Belum ada disposal"
                    pageTitle="Disposal Aset"
                    pageSubtitle="Kelola penghapusan dan pelepasan aset"
                />
            </div>
        </AppLayout>
    );
}
