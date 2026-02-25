import { type Column, type FilterField, DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Download, FileText, Landmark } from 'lucide-react';
import { route } from 'ziggy-js';

interface Asset {
    id: number; code: string; name: string; acquisition_date: string;
    acquisition_cost: number; accumulated_depreciation: number; current_book_value: number;
    status: string; condition: string;
    category: { name: string }; department: { name: string } | null;
}

interface PaginatedAssets {
    data: Asset[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Category { id: number; name: string }
interface Department { id: number; name: string }
interface Props extends SharedData {
    assets: PaginatedAssets;
    categories: Category[];
    departments: Department[];
    filters: Record<string, string>;
    summary: { total_assets: number; total_cost: number; total_depreciation: number; total_book_value: number };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: <Landmark className="h-4 w-4" />, href: route('aset.dashboard') },
    { title: 'Laporan', href: '#' },
    { title: 'Register Aset', href: '#' },
];

const fmt = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    active: { label: 'Aktif', variant: 'default' },
    inactive: { label: 'Tidak Aktif', variant: 'secondary' },
    maintenance: { label: 'Maintenance', variant: 'outline' },
    disposed: { label: 'Dihapus', variant: 'destructive' },
};

export default function RegisterReport() {
    const { assets, categories, departments, filters, summary } = usePage<Props>().props;

    const nav = (params: Record<string, string | number | undefined>) => {
        router.get('/aset/reports/register', { ...filters, ...params }, { preserveState: true, replace: true });
    };

    const columns: Column<Asset>[] = [
        {
            key: 'code', label: 'Kode', className: 'w-32',
            render: (r) => <span className="font-mono text-xs">{r.code}</span>,
        },
        {
            key: 'name', label: 'Nama Aset',
            render: (r) => <span className="font-medium">{r.name}</span>,
        },
        {
            key: 'category', label: 'Kategori',
            render: (r) => r.category.name,
        },
        {
            key: 'department', label: 'Departemen',
            render: (r) => r.department?.name ?? '-',
        },
        {
            key: 'acquisition_date', label: 'Tgl. Perolehan', className: 'w-32',
            render: (r) => new Date(r.acquisition_date).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        },
        {
            key: 'acquisition_cost', label: 'Harga Perolehan', className: 'text-right',
            render: (r) => <span className="text-right block">{fmt(r.acquisition_cost)}</span>,
        },
        {
            key: 'accumulated_depreciation', label: 'Akum. Penyusutan', className: 'text-right',
            render: (r) => <span className="text-right block">{fmt(r.accumulated_depreciation)}</span>,
        },
        {
            key: 'current_book_value', label: 'Nilai Buku', className: 'text-right',
            render: (r) => <span className="text-right block font-medium">{fmt(r.current_book_value)}</span>,
        },
        {
            key: 'status', label: 'Status', className: 'w-28',
            render: (r) => {
                const st = statusMap[r.status];
                return <Badge variant={st?.variant ?? 'outline'}>{st?.label ?? r.status}</Badge>;
            },
        },
    ];

    const filterFields: FilterField[] = [
        {
            name: 'category_id', label: 'Kategori', type: 'select',
            options: categories.map((c) => ({ value: c.id.toString(), label: c.name })),
            value: filters.category_id ?? '',
        },
        {
            name: 'department_id', label: 'Departemen', type: 'select',
            options: departments.map((d) => ({ value: d.id.toString(), label: d.name })),
            value: filters.department_id ?? '',
        },
        {
            name: 'status', label: 'Status', type: 'select',
            options: [
                { value: 'active', label: 'Aktif' },
                { value: 'inactive', label: 'Tidak Aktif' },
                { value: 'maintenance', label: 'Maintenance' },
                { value: 'disposed', label: 'Dihapus' },
            ],
            value: filters.status ?? '',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Register Aset" />
            <div className="p-4 space-y-4">
                {/* Summary cards */}
                <div className="grid grid-cols-4 gap-4">
                    <Card><CardContent className="pt-4"><p className="text-muted-foreground text-sm">Total Aset</p><p className="text-2xl font-bold">{summary.total_assets}</p></CardContent></Card>
                    <Card><CardContent className="pt-4"><p className="text-muted-foreground text-sm">Total Perolehan</p><p className="text-2xl font-bold">{fmt(summary.total_cost)}</p></CardContent></Card>
                    <Card><CardContent className="pt-4"><p className="text-muted-foreground text-sm">Total Penyusutan</p><p className="text-2xl font-bold">{fmt(summary.total_depreciation)}</p></CardContent></Card>
                    <Card><CardContent className="pt-4"><p className="text-muted-foreground text-sm">Total Nilai Buku</p><p className="text-2xl font-bold">{fmt(summary.total_book_value)}</p></CardContent></Card>
                </div>

                <DataTable
                    columns={columns}
                    data={assets.data}
                    pagination={assets}
                    searchValue={filters.search ?? ''}
                    searchPlaceholder="Cari kode / nama aset..."
                    onSearch={(v) => nav({ search: v, page: 1 })}
                    filters={filterFields}
                    onFilterChange={(name, val) => nav({ [name]: val, page: 1 })}
                    onFilterReset={() => router.get('/aset/reports/register', {}, { preserveState: true, replace: true })}
                    onPageChange={(p) => nav({ page: p })}
                    onPerPageChange={(pp) => nav({ perPage: pp, page: 1 })}
                    headerActions={
                        <Button variant="outline" onClick={() => window.print()}>
                            <Download className="mr-2 h-4 w-4" />Cetak
                        </Button>
                    }
                    rowKey={(r) => r.id}
                    emptyIcon={<FileText className="h-12 w-12 text-muted-foreground/50" />}
                    emptyText="Tidak ada data aset"
                    pageTitle="Laporan Register Aset"
                    pageSubtitle="Daftar seluruh aset beserta nilai perolehan dan penyusutan"
                />
            </div>
        </AppLayout>
    );
}
