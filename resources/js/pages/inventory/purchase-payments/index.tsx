import { type Column, type FilterField, DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePermission } from '@/hooks/use-permission';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { CheckCircle, Eye, Package, PlusCircle, XCircle } from 'lucide-react';

interface PurchasePayment {
    id: number;
    payment_number: string;
    payment_date: string;
    payment_method: string;
    amount: number;
    discount_amount: number;
    net_amount: number;
    jurnal_posted: boolean;
    notes?: string;
    purchase: { id: number; purchase_number: string; supplier: { name: string } };
    bank_account?: { account_name: string; bank_name: string };
    created_by: { name: string };
}

interface PaginatedPayments {
    data: PurchasePayment[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Props extends SharedData {
    payments: PaginatedPayments;
    filters: {
        search: string;
        payment_method: string;
        date_from: string;
        date_to: string;
        posted_only: string;
        perPage: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: <Package className="h-4 w-4" />, href: '#' },
    { title: 'Purchase Payments', href: '#' },
];

const methodLabels: Record<string, string> = { cash: 'Cash', bank_transfer: 'Transfer Bank', giro: 'Giro', credit_card: 'Kartu Kredit' };
const methodColors: Record<string, string> = { cash: 'bg-green-100 text-green-800', bank_transfer: 'bg-blue-100 text-blue-800', giro: 'bg-purple-100 text-purple-800', credit_card: 'bg-orange-100 text-orange-800' };

const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

export default function PurchasePaymentIndex() {
    const { payments, filters } = usePage<Props>().props;
    const { hasPermission } = usePermission();

    const navigate = (p: Record<string, any>) =>
        router.get('/purchase-payments', p, { preserveState: true, replace: true });

    const fp = {
        search: filters.search || '',
        payment_method: filters.payment_method || '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
        posted_only: filters.posted_only || '',
        perPage: filters.perPage,
    };

    const columns: Column<PurchasePayment>[] = [
        { key: 'no', label: 'No', className: 'w-[60px]', render: (_row, _index, meta) => meta.rowNumber },
        { key: 'payment_number', label: 'Payment Number', className: 'font-medium', render: (row) => row.payment_number },
        { key: 'purchase_order', label: 'Purchase Order', render: (row) => row.purchase.purchase_number },
        { key: 'supplier', label: 'Supplier', render: (row) => row.purchase.supplier.name },
        {
            key: 'tanggal', label: 'Tanggal',
            render: (row) => format(new Date(row.payment_date), 'dd MMM yyyy', { locale: idLocale }),
        },
        {
            key: 'method', label: 'Method',
            render: (row) => <Badge className={methodColors[row.payment_method]}>{methodLabels[row.payment_method]}</Badge>,
        },
        { key: 'amount', label: 'Amount', className: 'text-right', render: (row) => fmtCurrency(row.amount) },
        { key: 'discount', label: 'Discount', className: 'text-right', render: (row) => (row.discount_amount > 0 ? fmtCurrency(row.discount_amount) : '-') },
        { key: 'net_amount', label: 'Net Amount', className: 'text-right font-medium', render: (row) => fmtCurrency(row.net_amount) },
        {
            key: 'posted', label: 'Posted',
            className: 'text-center',
            render: (row) =>
                row.jurnal_posted ? (
                    <Badge variant="default" className="gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Posted
                    </Badge>
                ) : (
                    <Badge variant="secondary" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        Draft
                    </Badge>
                ),
        },
        {
            key: 'aksi', label: 'Aksi',
            className: 'w-[100px] text-center',
            render: (row) => (
                <Button variant="ghost" size="sm" onClick={() => router.visit(route('purchase-payments.show', row.id))} className="h-8 w-8 p-0" title="Lihat Detail">
                    <Eye className="h-4 w-4" />
                </Button>
            ),
        },
    ];

    const filterFields: FilterField[] = [
        {
            name: 'payment_method',
            label: 'Payment Method',
            type: 'select',
            value: fp.payment_method,
            options: [
                { value: 'cash', label: 'Cash' },
                { value: 'bank_transfer', label: 'Transfer Bank' },
                { value: 'giro', label: 'Giro' },
                { value: 'credit_card', label: 'Kartu Kredit' },
            ],
        },
        { name: 'date_from', label: 'Dari Tanggal', type: 'date', value: fp.date_from },
        { name: 'date_to', label: 'Sampai Tanggal', type: 'date', value: fp.date_to },
        {
            name: 'posted_only',
            label: 'Status Posting',
            type: 'select',
            value: fp.posted_only,
            options: [
                { value: '1', label: 'Sudah Posted' },
                { value: '0', label: 'Belum Posted' },
            ],
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Purchase Payments" />
            <div className="p-4">
                <DataTable<PurchasePayment>
                    pageTitle="Daftar Purchase Payments"
                    pageSubtitle="Kelola data purchase payments Anda di sini"
                    columns={columns}
                    data={payments.data}
                    pagination={payments}
                    searchValue={fp.search}
                    searchPlaceholder="Cari nomor payment atau PO..."
                    onSearch={(v) => navigate({ ...fp, search: v, page: 1 })}
                    filters={filterFields}
                    onFilterChange={(k, v) => navigate({ ...fp, [k]: v, page: 1 })}
                    onFilterReset={() =>
                        navigate({ search: '', payment_method: '', date_from: '', date_to: '', posted_only: '', perPage: fp.perPage, page: 1 })
                    }
                    onPageChange={(p) => navigate({ ...fp, page: p })}
                    onPerPageChange={(n) => navigate({ ...fp, perPage: n, page: 1 })}
                    headerActions={
                        hasPermission('inventory.purchases.create-payment') ? (
                            <Button onClick={() => router.visit('/purchase-payments/create')} className="gap-2">
                                <PlusCircle className="h-4 w-4" />
                                Buat Payment
                            </Button>
                        ) : undefined
                    }
                    emptyIcon={<Package className="h-8 w-8 text-muted-foreground/50" />}
                    emptyText="Tidak ada payment ditemukan"
                    rowKey={(r) => r.id}
                />
            </div>
        </AppLayout>
    );
}
