import { type Column, type FilterField, DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Calculator, Download, Landmark } from 'lucide-react';
import { route } from 'ziggy-js';

interface DepreciationItem {
    asset_id: number; asset_code: string; asset_name: string; category_name: string;
    acquisition_cost: number; depreciation_method: string; useful_life: number;
    accumulated_depreciation: number; book_value: number; total_year: number;
    asset_status: string;
    depreciations: { period_date: string; amount: number }[];
}

interface PaginatedItems {
    data: DepreciationItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Props extends SharedData {
    items: PaginatedItems;
    filters: Record<string, string>;
    years: number[];
    summary: { total_depreciation_year: number; total_accumulated: number; total_book_value: number };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: <Landmark className="h-4 w-4" />, href: route('aset.dashboard') },
    { title: 'Laporan', href: '#' },
    { title: 'Penyusutan', href: '#' },
];

const fmt = (n: number) => new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(n);
const fmtC = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
const methodMap: Record<string, string> = {
    straight_line: 'Garis Lurus', declining_balance: 'Saldo Menurun', double_declining: 'Saldo Menurun Ganda',
    sum_of_years_digits: 'Jumlah Angka Tahun', service_hours: 'Satuan Jam Kerja', productive_output: 'Satuan Hasil Produksi',
};
const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const assetStatusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    active: { label: 'Aktif', variant: 'default' },
    disposed: { label: 'Dihapusbukukan', variant: 'destructive' },
    maintenance: { label: 'Maintenance', variant: 'outline' },
    inactive: { label: 'Nonaktif', variant: 'secondary' },
};

function getMonthlyMap(item: DepreciationItem): Record<number, number> {
    const map: Record<number, number> = {};
    item.depreciations.forEach((d) => {
        const m = parseInt(d.period_date.split('-')[1]);
        map[m] = (map[m] || 0) + d.amount;
    });
    return map;
}

export default function DepreciationReport() {
    const { items, filters, years, summary } = usePage<Props>().props;

    const nav = (params: Record<string, string | number | undefined>) => {
        router.get('/aset/reports/depreciation', { ...filters, ...params }, { preserveState: true, replace: true });
    };

    const columns: Column<DepreciationItem>[] = [
        {
            key: 'asset_code', label: 'Kode', className: 'sticky left-0 bg-background z-10 w-24',
            render: (r) => <span className="font-mono text-xs">{r.asset_code}</span>,
        },
        {
            key: 'asset_name', label: 'Nama Aset', className: 'sticky left-24 bg-background z-10 min-w-[160px]',
            render: (r) => {
                const s = assetStatusMap[r.asset_status];
                return (
                    <div>
                        <span className="text-sm font-medium">{r.asset_name}</span>
                        {r.asset_status !== 'active' && s && (
                            <Badge variant={s.variant} className="ml-2 text-[10px] px-1 py-0">{s.label}</Badge>
                        )}
                    </div>
                );
            },
        },
        {
            key: 'method', label: 'Metode', className: 'w-28',
            render: (r) => <span className="text-xs">{methodMap[r.depreciation_method] ?? r.depreciation_method}</span>,
        },
        {
            key: 'acquisition_cost', label: 'Perolehan', className: 'text-right w-28',
            render: (r) => <span className="text-right block text-xs">{fmt(r.acquisition_cost)}</span>,
        },
        // 12 monthly columns
        ...monthLabels.map((label, i) => ({
            key: `month_${i + 1}`,
            label,
            className: 'text-right w-20',
            render: (r: DepreciationItem) => {
                const map = getMonthlyMap(r);
                const val = map[i + 1];
                return <span className="text-right block text-xs">{val ? fmt(val) : '-'}</span>;
            },
        })),
        {
            key: 'total_year', label: 'Total Tahun', className: 'text-right w-28',
            render: (r) => <span className="text-right block text-xs font-medium">{fmt(r.total_year)}</span>,
        },
        {
            key: 'accumulated', label: 'Akum.', className: 'text-right w-28',
            render: (r) => <span className="text-right block text-xs">{fmt(r.accumulated_depreciation)}</span>,
        },
        {
            key: 'book_value', label: 'Nilai Buku', className: 'text-right w-28',
            render: (r) => <span className="text-right block text-xs font-medium">{fmt(r.book_value)}</span>,
        },
    ];

    const filterFields: FilterField[] = [
        {
            name: 'year', label: 'Tahun', type: 'select',
            options: years.map((y) => ({ value: y.toString(), label: y.toString() })),
            value: filters.year ?? new Date().getFullYear().toString(),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Penyusutan" />
            <div className="p-4 space-y-4">
                {/* Summary cards */}
                <div className="grid grid-cols-3 gap-4">
                    <Card><CardContent className="pt-4"><p className="text-muted-foreground text-sm">Total Penyusutan Tahun Ini</p><p className="text-2xl font-bold">{fmtC(summary.total_depreciation_year)}</p></CardContent></Card>
                    <Card><CardContent className="pt-4"><p className="text-muted-foreground text-sm">Total Akumulasi Penyusutan</p><p className="text-2xl font-bold">{fmtC(summary.total_accumulated)}</p></CardContent></Card>
                    <Card><CardContent className="pt-4"><p className="text-muted-foreground text-sm">Total Nilai Buku</p><p className="text-2xl font-bold">{fmtC(summary.total_book_value)}</p></CardContent></Card>
                </div>

                <div className="overflow-x-auto">
                    <DataTable
                        columns={columns}
                        data={items.data}
                        pagination={items}
                        searchValue={filters.search ?? ''}
                        searchPlaceholder="Cari kode / nama aset..."
                        onSearch={(v) => nav({ search: v, page: 1 })}
                        filters={filterFields}
                        onFilterChange={(name, val) => nav({ [name]: val, page: 1 })}
                        onFilterReset={() => router.get('/aset/reports/depreciation', {}, { preserveState: true, replace: true })}
                        onPageChange={(p) => nav({ page: p })}
                        onPerPageChange={(pp) => nav({ perPage: pp, page: 1 })}
                        headerActions={
                            <Button variant="outline" onClick={() => window.print()}>
                                <Download className="mr-2 h-4 w-4" />Cetak
                            </Button>
                        }
                        rowKey={(r) => r.asset_id}
                        emptyIcon={<Calculator className="h-12 w-12 text-muted-foreground/50" />}
                        emptyText="Tidak ada data penyusutan"
                        pageTitle={`Laporan Penyusutan Tahun ${filters.year ?? new Date().getFullYear()}`}
                        pageSubtitle="Rincian penyusutan aset per bulan"
                    />
                </div>
            </div>
        </AppLayout>
    );
}
