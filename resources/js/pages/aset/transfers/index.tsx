import { type Column, type FilterField, DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { ArrowRightLeft, Landmark, Plus } from 'lucide-react';

interface Transfer {
    id: number; transfer_number: string; transfer_date: string; status: string;
    asset: { id: number; code: string; name: string };
    fromDepartment: { name: string }; toDepartment: { name: string };
}
interface PaginatedTransfers {
    data: Transfer[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Props extends SharedData {
    transfers: PaginatedTransfers;
    filters: { search?: string; status?: string };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: <Landmark className="h-4 w-4" />, href: '/aset' },
    { title: 'Transfer Aset', href: '#' },
];

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    draft: { label: 'Draft', variant: 'secondary' },
    approved: { label: 'Disetujui', variant: 'default' },
    completed: { label: 'Selesai', variant: 'outline' },
    cancelled: { label: 'Dibatalkan', variant: 'destructive' },
};

export default function TransferIndex() {
    const { transfers, filters } = usePage<Props>().props;

    const nav = (params: Record<string, string | number>) => {
        router.get('/aset/transfers', { ...filters, ...params }, { preserveState: true, replace: true });
    };

    const columns: Column<Transfer>[] = [
        { key: 'transfer_number', label: 'No. Transfer', render: (t) => <span className="font-mono text-sm">{t.transfer_number}</span> },
        { key: 'asset', label: 'Aset', render: (t) => <span>{t.asset.code} - {t.asset.name}</span> },
        { key: 'fromDepartment', label: 'Dari Dept.', render: (t) => <span>{t.fromDepartment.name}</span> },
        { key: 'toDepartment', label: 'Ke Dept.', render: (t) => <span>{t.toDepartment.name}</span> },
        { key: 'transfer_date', label: 'Tanggal', render: (t) => <span>{t.transfer_date}</span> },
        {
            key: 'status', label: 'Status', render: (t) => {
                const s = statusMap[t.status] ?? { label: t.status, variant: 'outline' as const };
                return <Badge variant={s.variant}>{s.label}</Badge>;
            },
        },
    ];

    const filterFields: FilterField[] = [
        { name: 'status', label: 'Status', type: 'select', options: [{ value: 'draft', label: 'Draft' }, { value: 'approved', label: 'Disetujui' }, { value: 'completed', label: 'Selesai' }, { value: 'cancelled', label: 'Dibatalkan' }], value: filters.status ?? '' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Transfer Aset" />
            <div className="p-4">
                <DataTable
                    columns={columns}
                    data={transfers.data}
                    pagination={transfers}
                    searchValue={filters.search ?? ''}
                    searchPlaceholder="Cari transfer..."
                    onSearch={(v) => nav({ search: v, page: 1 })}
                    filters={filterFields}
                    onFilterChange={(name, val) => nav({ [name]: val, page: 1 })}
                    onFilterReset={() => router.get('/aset/transfers', {}, { preserveState: true, replace: true })}
                    onPageChange={(p) => nav({ page: p })}
                    onPerPageChange={(pp) => nav({ perPage: pp, page: 1 })}
                    onRowClick={(t) => router.visit(`/aset/transfers/${t.id}`)}
                    headerActions={<Button onClick={() => router.visit('/aset/transfers/create')}><Plus className="mr-2 h-4 w-4" />Tambah Transfer</Button>}
                    rowKey={(r) => r.id}
                    emptyIcon={<ArrowRightLeft className="h-12 w-12 text-muted-foreground/50" />}
                    emptyText="Belum ada transfer"
                    pageTitle="Transfer Aset"
                    pageSubtitle="Kelola mutasi aset antar departemen"
                />
            </div>
        </AppLayout>
    );
}
