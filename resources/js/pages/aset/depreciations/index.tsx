import { type Column, type FilterField, DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Calculator, Landmark } from 'lucide-react';

interface Category { id: number; name: string }

interface Depreciation {
    id: number;
    period_date: string;
    period_number: number;
    depreciation_amount: number;
    accumulated_depreciation: number;
    book_value: number;
    method: string;
    asset: {
        id: number;
        code: string;
        name: string;
        acquisition_cost: number;
        useful_life_months: number;
        depreciation_method: string;
        category?: { id: number; name: string };
    };
}

interface PaginatedData {
    data: Depreciation[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Props extends SharedData {
    depreciations: PaginatedData;
    filters: Record<string, string>;
    categories: Category[];
    totalDepreciationThisMonth: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: <Landmark className="h-4 w-4" />, href: '/aset' },
    { title: 'Penyusutan', href: '#' },
];

const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
const fmtDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

const methodMap: Record<string, string> = { straight_line: 'Garis Lurus', declining_balance: 'Saldo Menurun', double_declining: 'Saldo Menurun Ganda', sum_of_years_digits: 'Jumlah Angka Tahun', service_hours: 'Satuan Jam Kerja', productive_output: 'Satuan Hasil Produksi' };

export default function DepreciationsIndex() {
    const { depreciations, filters, categories, totalDepreciationThisMonth } = usePage<Props>().props;

    const nav = (params: Record<string, string | number>) => {
        router.get('/aset/depreciations', { ...filters, ...params }, { preserveState: true, replace: true });
    };

    const columns: Column<Depreciation>[] = [
        { key: 'asset', label: 'Aset', render: (r) => <div><p className="font-medium font-mono text-sm">{r.asset.code}</p><p className="text-xs text-muted-foreground">{r.asset.name}</p></div> },
        { key: 'category', label: 'Kategori', className: 'w-32', render: (r) => r.asset.category?.name ?? '-' },
        { key: 'period', label: 'Periode', className: 'w-32', render: (r) => fmtDate(r.period_date) },
        { key: 'number', label: '#', className: 'w-12', render: (r) => r.period_number },
        { key: 'method', label: 'Metode', className: 'w-28', render: (r) => methodMap[r.method] ?? r.method },
        { key: 'amount', label: 'Penyusutan', className: 'w-36', render: (r) => <span className="font-medium text-orange-600">{fmtCurrency(r.depreciation_amount)}</span> },
        { key: 'accumulated', label: 'Akumulasi', className: 'w-36', render: (r) => fmtCurrency(r.accumulated_depreciation) },
        { key: 'book_value', label: 'Nilai Buku', className: 'w-36', render: (r) => <span className="font-medium">{fmtCurrency(r.book_value)}</span> },
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => ({ value: (currentYear - i).toString(), label: (currentYear - i).toString() }));
    const months = [
        { value: '1', label: 'Januari' }, { value: '2', label: 'Februari' }, { value: '3', label: 'Maret' },
        { value: '4', label: 'April' }, { value: '5', label: 'Mei' }, { value: '6', label: 'Juni' },
        { value: '7', label: 'Juli' }, { value: '8', label: 'Agustus' }, { value: '9', label: 'September' },
        { value: '10', label: 'Oktober' }, { value: '11', label: 'November' }, { value: '12', label: 'Desember' },
    ];

    const filterFields: FilterField[] = [
        { name: 'category_id', label: 'Kategori', type: 'select', options: categories.map((c) => ({ value: c.id.toString(), label: c.name })), value: filters.category_id ?? '' },
        { name: 'period_year', label: 'Tahun', type: 'select', options: years, value: filters.period_year ?? '' },
        { name: 'period_month', label: 'Bulan', type: 'select', options: months, value: filters.period_month ?? '' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Penyusutan Aset" />
            <div className="space-y-4 p-4">
                <Card>
                    <CardContent className="flex items-center justify-between p-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Penyusutan Bulan Ini</p>
                            <p className="text-2xl font-bold text-orange-600">{fmtCurrency(totalDepreciationThisMonth)}</p>
                        </div>
                        <Button onClick={() => router.visit('/aset/depreciations/calculate')}>
                            <Calculator className="mr-2 h-4 w-4" />Hitung Penyusutan
                        </Button>
                    </CardContent>
                </Card>

                <DataTable
                    columns={columns}
                    data={depreciations.data}
                    pagination={depreciations}
                    searchValue={filters.search ?? ''}
                    searchPlaceholder="Cari aset..."
                    onSearch={(v) => nav({ search: v, page: 1 })}
                    filters={filterFields}
                    onFilterChange={(name, val) => nav({ [name]: val, page: 1 })}
                    onFilterReset={() => router.get('/aset/depreciations', {}, { preserveState: true, replace: true })}
                    onPageChange={(p) => nav({ page: p })}
                    onPerPageChange={(pp) => nav({ perPage: pp, page: 1 })}
                    rowKey={(r) => r.id}
                    emptyIcon={<Calculator className="h-12 w-12 text-muted-foreground/50" />}
                    emptyText="Belum ada data penyusutan"
                    pageTitle="Riwayat Penyusutan"
                    pageSubtitle="Catatan penyusutan aset per periode"
                />
            </div>
        </AppLayout>
    );
}
