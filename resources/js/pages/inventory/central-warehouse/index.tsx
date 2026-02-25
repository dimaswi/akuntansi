import { type Column, type FilterField, DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type PageProps } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Package, Warehouse } from 'lucide-react';

interface Stock {
    id: number;
    item_id: number;
    item: {
        id: number;
        code: string;
        name: string;
        unit_of_measure: string;
        category?: { id: number; code: string; name: string } | null;
        reorder_level: number;
        safety_stock: number;
    };
    quantity_on_hand: number;
    available_quantity: number;
    reserved_quantity: number;
    last_unit_cost: number;
    average_unit_cost: number;
    total_value: number;
    last_updated_at: string;
}

interface Props extends PageProps {
    stocks: { data: Stock[]; current_page: number; last_page: number; per_page: number; total: number; from?: number; to?: number };
    summary: { total_items: number; total_quantity: number; total_available: number; total_reserved: number; total_value: number; low_stock_items: number };
    filters: { search?: string; low_stock?: boolean; has_reserved?: boolean; sort_by?: string; sort_order?: string };
}

const breadcrumbItems: BreadcrumbItem[] = [
    { title: <Package className="h-4 w-4" />, href: '#' },
    { title: 'Gudang Pusat', href: '' },
];

const fmtNum = (n: number | undefined | null) => (n ?? 0).toString();
const fmtCurrency = (v: number | undefined | null) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v ?? 0);
const fmtDate = (d: string | null | undefined) => {
    if (!d) return '-';
    try { return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return '-'; }
};

export default function Index({ stocks, summary, filters }: Props) {
    const pagination = {
        current_page: stocks.current_page,
        last_page: stocks.last_page,
        per_page: stocks.per_page,
        total: stocks.total,
        from: stocks.from ?? (stocks.current_page - 1) * stocks.per_page + 1,
        to: stocks.to ?? Math.min(stocks.current_page * stocks.per_page, stocks.total),
    };

    const navigate = (p: Record<string, any>) =>
        router.get(route('central-warehouse.index'), p, { preserveState: true, preserveScroll: true });

    const fp = {
        search: filters.search || '',
        low_stock: filters.low_stock ? '1' : '',
        has_reserved: filters.has_reserved ? '1' : '',
        sort_by: filters.sort_by || '',
        sort_order: filters.sort_order || '',
    };

    const columns: Column<Stock>[] = [
        { key: 'kode', label: 'Kode', className: 'font-mono text-xs text-muted-foreground', render: (row) => row.item.code },
        { key: 'nama_item', label: 'Nama Item', className: 'font-medium', render: (row) => row.item.name },
        { key: 'kategori', label: 'Kategori', className: 'text-sm text-muted-foreground', render: (row) => row.item.category?.name || '-' },
        { key: 'unit', label: 'Unit', className: 'text-center', render: (row) => <Badge variant="outline" className="text-xs">{row.item.unit_of_measure}</Badge> },
        { key: 'on_hand', label: 'On Hand', className: 'text-right font-semibold', render: (row) => fmtNum(row.quantity_on_hand) },
        { key: 'reserved', label: 'Reserved', className: 'text-right text-orange-600 font-semibold', render: (row) => fmtNum(row.reserved_quantity) },
        { key: 'available', label: 'Available', className: 'text-right text-green-600 font-semibold', render: (row) => fmtNum(row.available_quantity) },
        { key: 'unit_cost', label: 'Unit Cost', className: 'text-right text-sm', render: (row) => fmtCurrency(row.average_unit_cost) },
        { key: 'total_value', label: 'Total Value', className: 'text-right font-semibold text-blue-600', render: (row) => fmtCurrency(row.total_value) },
        { key: 'update_terakhir', label: 'Update Terakhir', className: 'text-sm text-muted-foreground', render: (row) => fmtDate(row.last_updated_at) },
    ];

    const filterFields: FilterField[] = [
        { name: 'low_stock', label: 'Filter Stok', type: 'select', value: fp.low_stock, options: [{ value: '1', label: 'Stok Rendah Saja' }] },
        { name: 'has_reserved', label: 'Filter Reserved', type: 'select', value: fp.has_reserved, options: [{ value: '1', label: 'Ada Reserved' }] },
        { name: 'sort_by', label: 'Sort By', type: 'select', value: fp.sort_by, options: [{ value: 'item_code', label: 'Item Code' }, { value: 'quantity_on_hand', label: 'Quantity' }, { value: 'reserved_quantity', label: 'Reserved' }, { value: 'total_value', label: 'Value' }] },
        { name: 'sort_order', label: 'Sort Order', type: 'select', value: fp.sort_order, options: [{ value: 'asc', label: 'Ascending' }, { value: 'desc', label: 'Descending' }] },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbItems}>
            <Head title="Gudang Pusat" />
            <div className="p-4 space-y-4">
                {/* Summary */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Warehouse className="h-5 w-5" />
                            Gudang Pusat
                        </CardTitle>
                        <CardDescription>Summary of stock inventory in central warehouse</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Item</p>
                                <p className="text-2xl font-bold mt-1">{summary.total_items}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Quantity</p>
                                <p className="text-2xl font-bold text-green-600 mt-1">{fmtNum(summary.total_quantity)}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Reserved</p>
                                <p className="text-2xl font-bold text-orange-600 mt-1">{fmtNum(summary.total_reserved)}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Item Stok Rendah</p>
                                <p className={`text-2xl font-bold mt-1 ${summary.low_stock_items > 0 ? 'text-red-600' : 'text-gray-900'}`}>{summary.low_stock_items}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                                <p className="text-2xl font-bold text-blue-600 mt-1">{fmtCurrency(summary.total_value)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Table */}
                <DataTable<Stock>
                    pageTitle="Stok Gudang Pusat"
                    pageSubtitle="Kelola stok item Anda di gudang pusat"
                    columns={columns}
                    data={stocks.data}
                    pagination={pagination}
                    searchValue={fp.search}
                    searchPlaceholder="Search by item code or name..."
                    onSearch={(v) => navigate({ ...fp, search: v, page: 1 })}
                    filters={filterFields}
                    onFilterChange={(k, v) => navigate({ ...fp, [k]: v, page: 1 })}
                    onFilterReset={() => navigate({ search: '', low_stock: '', has_reserved: '', sort_by: '', sort_order: '', page: 1 })}
                    onPageChange={(p) => navigate({ ...fp, page: p })}
                    onPerPageChange={(n) => navigate({ ...fp, perPage: n, page: 1 })}
                    emptyIcon={<Package className="h-8 w-8 text-muted-foreground/50" />}
                    emptyText="Tidak ada stok item di gudang pusat"
                    rowKey={(s) => s.id}
                />
            </div>
        </AppLayout>
    );
}
