import { type Column, type FilterField, DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePermission } from '@/hooks/use-permission';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { CheckCircle, ClipboardList, Eye, PlusCircle, Send, XCircle } from 'lucide-react';

interface StockAdjustment {
    id: number;
    nomor_adjustment: string;
    tanggal_adjustment: string;
    tipe_adjustment: 'shortage' | 'overage';
    quantity: number;
    unit_price: number;
    total_amount: number;
    status: 'draft' | 'approved';
    jurnal_posted: boolean;
    keterangan?: string;
    item: { id: number; code: string; name: string };
    approved_by?: { name: string };
    approved_at?: string;
}

interface PaginatedAdjustments {
    data: StockAdjustment[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Props extends SharedData {
    adjustments: PaginatedAdjustments;
    filters: {
        search: string;
        tipe_adjustment: string;
        status: string;
        posted_only: string;
        date_from: string;
        date_to: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: <ClipboardList className="h-4 w-4" />, href: '#' },
    { title: 'Stock Adjustments', href: '#' },
];

const tipeLabels: Record<string, string> = { shortage: 'Kekurangan', overage: 'Kelebihan' };
const tipeColors: Record<string, string> = { shortage: 'bg-red-100 text-red-800', overage: 'bg-green-100 text-green-800' };
const statusLabels: Record<string, string> = { draft: 'Draft', approved: 'Approved' };
const statusColors: Record<string, string> = { draft: 'bg-yellow-100 text-yellow-800', approved: 'bg-green-100 text-green-800' };

const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

export default function StockAdjustmentIndex() {
    const { adjustments, filters } = usePage<Props>().props;
    const { hasPermission } = usePermission();

    const navigate = (p: Record<string, any>) =>
        router.get('/stock-adjustments', p, { preserveState: true, replace: true });

    const fp = {
        search: filters.search || '',
        tipe_adjustment: filters.tipe_adjustment || '',
        status: filters.status || '',
        posted_only: filters.posted_only || '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
    };

    const columns: Column<StockAdjustment>[] = [
        { key: 'nomor', label: 'Nomor', className: 'font-medium', render: (row) => row.nomor_adjustment },
        {
            key: 'tanggal', label: 'Tanggal',
            render: (row) => format(new Date(row.tanggal_adjustment), 'dd MMM yyyy', { locale: idLocale }),
        },
        {
            key: 'barang', label: 'Barang',
            render: (row) => (
                <div>
                    <div className="font-medium">{row.item.name}</div>
                    <div className="text-sm text-muted-foreground">{row.item.code}</div>
                </div>
            ),
        },
        {
            key: 'tipe', label: 'Tipe',
            render: (row) => <Badge className={tipeColors[row.tipe_adjustment]}>{tipeLabels[row.tipe_adjustment]}</Badge>,
        },
        { key: 'qty', label: 'Qty', render: (row) => row.quantity },
        { key: 'nilai', label: 'Nilai', render: (row) => fmtCurrency(row.total_amount) },
        {
            key: 'status', label: 'Status',
            render: (row) => <Badge className={statusColors[row.status]}>{statusLabels[row.status]}</Badge>,
        },
        {
            key: 'jurnal', label: 'Jurnal',
            render: (row) =>
                row.jurnal_posted ? (
                    <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Posted
                    </Badge>
                ) : (
                    <Badge className="bg-gray-100 text-gray-800">
                        <XCircle className="mr-1 h-3 w-3" />
                        Draft
                    </Badge>
                ),
        },
        {
            key: 'aksi', label: 'Aksi',
            className: 'text-right',
            render: (row) => (
                <Button variant="ghost" size="sm" onClick={() => router.visit(route('stock-adjustments.show', row.id))}>
                    <Eye className="h-4 w-4" />
                </Button>
            ),
        },
    ];

    const filterFields: FilterField[] = [
        {
            name: 'tipe_adjustment',
            label: 'Tipe',
            type: 'select',
            value: fp.tipe_adjustment,
            options: [
                { value: 'shortage', label: 'Kekurangan' },
                { value: 'overage', label: 'Kelebihan' },
            ],
        },
        {
            name: 'status',
            label: 'Status',
            type: 'select',
            value: fp.status,
            options: [
                { value: 'draft', label: 'Draft' },
                { value: 'approved', label: 'Approved' },
            ],
        },
        { name: 'date_from', label: 'Tanggal Dari', type: 'date', value: fp.date_from },
        { name: 'date_to', label: 'Tanggal Sampai', type: 'date', value: fp.date_to },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Stock Adjustments" />
            <div className="p-4">
                <DataTable<StockAdjustment>
                    pageTitle="Daftar Stock Adjustments"
                    pageSubtitle="Kelola data stock adjustments Anda di sini"
                    columns={columns}
                    data={adjustments.data}
                    pagination={adjustments}
                    searchValue={fp.search}
                    searchPlaceholder="Cari nomor adjustment atau nama barang..."
                    onSearch={(v) => navigate({ ...fp, search: v, page: 1 })}
                    filters={filterFields}
                    onFilterChange={(k, v) => navigate({ ...fp, [k]: v, page: 1 })}
                    onFilterReset={() =>
                        navigate({ search: '', tipe_adjustment: '', status: '', posted_only: '', date_from: '', date_to: '', page: 1 })
                    }
                    onPageChange={(p) => navigate({ ...fp, page: p })}
                    onPerPageChange={(n) => navigate({ ...fp, perPage: n, page: 1 })}
                    headerActions={
                        <div className="flex gap-2">
                            {hasPermission('inventory.purchases.post-to-journal') && (
                                <Button variant="outline" onClick={() => router.visit(route('stock-adjustments.showPostToJournal'))}>
                                    <Send className="mr-2 h-4 w-4" />
                                    Post to Jurnal
                                </Button>
                            )}
                            {hasPermission('inventory.items.edit') && (
                                <Button onClick={() => router.visit(route('stock-adjustments.create'))}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Buat Adjustment
                                </Button>
                            )}
                        </div>
                    }
                    emptyIcon={<ClipboardList className="h-8 w-8 text-muted-foreground/50" />}
                    emptyText="Tidak ada data stock adjustment"
                    rowKey={(r) => r.id}
                />
            </div>
        </AppLayout>
    );
}
