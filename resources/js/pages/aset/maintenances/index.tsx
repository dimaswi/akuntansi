import { type Column, type FilterField, DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Eye, Landmark, PlusCircle, Wrench } from 'lucide-react';

interface Maintenance {
    id: number;
    maintenance_number: string;
    type: string;
    description: string;
    scheduled_date: string;
    completed_date?: string;
    cost: number;
    vendor?: string;
    status: string;
    asset: { id: number; code: string; name: string };
    creator: { id: number; name: string };
}

interface PaginatedData { data: Maintenance[]; current_page: number; last_page: number; per_page: number; total: number; from: number; to: number }

interface Props extends SharedData {
    maintenances: PaginatedData;
    filters: Record<string, string>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: <Landmark className="h-4 w-4" />, href: '/aset' },
    { title: 'Maintenance', href: '#' },
];

const fmtCurrency = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
const fmtDate = (d: string) => new Date(d).toLocaleDateString('id-ID');

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    scheduled: { label: 'Terjadwal', variant: 'outline' },
    in_progress: { label: 'Dalam Proses', variant: 'default' },
    completed: { label: 'Selesai', variant: 'secondary' },
    cancelled: { label: 'Dibatalkan', variant: 'destructive' },
};

const typeMap: Record<string, string> = { preventive: 'Preventif', corrective: 'Korektif', emergency: 'Darurat' };

export default function MaintenancesIndex() {
    const { maintenances, filters } = usePage<Props>().props;

    const nav = (params: Record<string, string | number>) => {
        router.get('/aset/maintenances', { ...filters, ...params }, { preserveState: true, replace: true });
    };

    const columns: Column<Maintenance>[] = [
        { key: 'number', label: 'Nomor', className: 'w-36', render: (r) => <span className="font-mono text-sm">{r.maintenance_number}</span> },
        { key: 'asset', label: 'Aset', render: (r) => <div><p className="font-medium">{r.asset.code}</p><p className="text-xs text-muted-foreground">{r.asset.name}</p></div> },
        { key: 'type', label: 'Tipe', className: 'w-24', render: (r) => <Badge variant="outline">{typeMap[r.type] ?? r.type}</Badge> },
        { key: 'scheduled', label: 'Tgl Jadwal', className: 'w-28', render: (r) => fmtDate(r.scheduled_date) },
        { key: 'cost', label: 'Biaya', className: 'w-32', render: (r) => fmtCurrency(r.cost) },
        { key: 'vendor', label: 'Vendor', className: 'w-32', render: (r) => r.vendor ?? '-' },
        { key: 'status', label: 'Status', className: 'w-28', render: (r) => { const s = statusMap[r.status]; return <Badge variant={s?.variant}>{s?.label}</Badge>; } },
        { key: 'actions', label: '', className: 'w-16', render: (r) => <Button variant="ghost" size="icon" onClick={() => router.visit(`/aset/maintenances/${r.id}`)}><Eye className="h-4 w-4" /></Button> },
    ];

    const filterFields: FilterField[] = [
        { name: 'status', label: 'Status', type: 'select', options: Object.entries(statusMap).map(([k, v]) => ({ value: k, label: v.label })), value: filters.status ?? '' },
        { name: 'type', label: 'Tipe', type: 'select', options: Object.entries(typeMap).map(([k, v]) => ({ value: k, label: v })), value: filters.type ?? '' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Maintenance Aset" />
            <div className="p-4">
                <DataTable
                    columns={columns} data={maintenances.data} pagination={maintenances}
                    searchValue={filters.search ?? ''} searchPlaceholder="Cari maintenance..."
                    onSearch={(v) => nav({ search: v, page: 1 })} filters={filterFields}
                    onFilterChange={(name, val) => nav({ [name]: val, page: 1 })}
                    onFilterReset={() => router.get('/aset/maintenances', {}, { preserveState: true, replace: true })}
                    onPageChange={(p) => nav({ page: p })} onPerPageChange={(pp) => nav({ perPage: pp, page: 1 })}
                    headerActions={<Button onClick={() => router.visit('/aset/maintenances/create')}><PlusCircle className="mr-2 h-4 w-4" />Tambah Maintenance</Button>}
                    rowKey={(r) => r.id}
                    emptyIcon={<Wrench className="h-12 w-12 text-muted-foreground/50" />}
                    emptyText="Belum ada data maintenance"
                    pageTitle="Maintenance Aset"
                    pageSubtitle="Kelola jadwal dan riwayat pemeliharaan aset"
                />
            </div>
        </AppLayout>
    );
}
