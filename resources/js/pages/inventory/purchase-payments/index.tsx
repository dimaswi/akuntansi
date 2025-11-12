import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePermission } from '@/hooks/use-permission';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { 
    DollarSign, 
    Eye, 
    Filter, 
    PlusCircle, 
    Search,
    CheckCircle,
    XCircle, 
    Package
} from 'lucide-react';
import { useState } from 'react';
import { route } from 'ziggy-js';

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
    purchase: {
        id: number;
        purchase_number: string;
        supplier: {
            name: string;
        };
    };
    bank_account?: {
        account_name: string;
        bank_name: string;
    };
    created_by: {
        name: string;
    };
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

const paymentMethodLabels: Record<string, string> = {
    cash: 'Cash',
    bank_transfer: 'Transfer Bank',
    giro: 'Giro',
    credit_card: 'Kartu Kredit',
};

const paymentMethodColors: Record<string, string> = {
    cash: 'bg-green-100 text-green-800',
    bank_transfer: 'bg-blue-100 text-blue-800',
    giro: 'bg-purple-100 text-purple-800',
    credit_card: 'bg-orange-100 text-orange-800',
};

export default function PurchasePaymentIndex({ payments, filters }: Props) {
    const { hasPermission } = usePermission();
    const [search, setSearch] = useState(filters.search);
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);

    const handleSearch = (searchValue: string) => {
        router.get(
            '/purchase-payments',
            {
                search: searchValue,
                payment_method: filters.payment_method || '',
                date_from: filters.date_from || '',
                date_to: filters.date_to || '',
                posted_only: filters.posted_only || '',
                perPage: filters.perPage,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleFilterChange = (key: string, value: string) => {
        router.get(
            '/purchase-payments',
            {
                search: filters.search || '',
                payment_method: key === 'payment_method' ? value : filters.payment_method || '',
                date_from: key === 'date_from' ? value : filters.date_from || '',
                date_to: key === 'date_to' ? value : filters.date_to || '',
                posted_only: key === 'posted_only' ? value : filters.posted_only || '',
                perPage: filters.perPage,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handlePageChange = (page: number) => {
        router.get(
            '/purchase-payments',
            {
                ...filters,
                page,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Purchase Payments" />

            <Card className="mt-4">
                <CardHeader>
                    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5" />
                                Purchase Payments
                            </CardTitle>
                            <CardDescription>Kelola pembayaran ke supplier</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setIsFilterExpanded(!isFilterExpanded)} className="gap-2">
                                <Filter className="h-4 w-4" />
                                {isFilterExpanded ? 'Hide Filters' : 'Show Filters'}
                            </Button>
                            {hasPermission('inventory.purchases.create-payment') && (
                                <Button onClick={() => router.visit('/purchase-payments/create')} className="gap-2">
                                    <PlusCircle className="h-4 w-4" />
                                    Buat Payment
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Search Bar */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSearch(search);
                        }}
                        className="flex gap-2"
                    >
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Cari nomor payment atau PO..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Button type="submit" className="gap-2">
                            <Search className="h-4 w-4" />
                            Search
                        </Button>
                        {search && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setSearch('');
                                    handleSearch('');
                                }}
                            >
                                Clear
                            </Button>
                        )}
                    </form>

                    {/* Collapsible Filters */}
                    {isFilterExpanded && (
                        <div className="rounded-lg border bg-gray-50 p-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                                <div className="space-y-2">
                                    <Label>Payment Method</Label>
                                    <Select value={filters.payment_method || 'all'} onValueChange={(value) => handleFilterChange('payment_method', value === 'all' ? '' : value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Methods" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Methods</SelectItem>
                                            <SelectItem value="cash">Cash</SelectItem>
                                            <SelectItem value="bank_transfer">Transfer Bank</SelectItem>
                                            <SelectItem value="giro">Giro</SelectItem>
                                            <SelectItem value="credit_card">Kartu Kredit</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Dari Tanggal</Label>
                                    <Input type="date" value={filters.date_from || ''} onChange={(e) => handleFilterChange('date_from', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Sampai Tanggal</Label>
                                    <Input type="date" value={filters.date_to || ''} onChange={(e) => handleFilterChange('date_to', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Status Posting</Label>
                                    <Select value={filters.posted_only || 'all'} onValueChange={(value) => handleFilterChange('posted_only', value === 'all' ? '' : value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Status</SelectItem>
                                            <SelectItem value="1">Sudah Posted</SelectItem>
                                            <SelectItem value="0">Belum Posted</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Table */}
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[60px]">No</TableHead>
                                    <TableHead>Payment Number</TableHead>
                                    <TableHead>Purchase Order</TableHead>
                                    <TableHead>Supplier</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Method</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="text-right">Discount</TableHead>
                                    <TableHead className="text-right">Net Amount</TableHead>
                                    <TableHead className="text-center">Posted</TableHead>
                                    <TableHead className="w-[100px] text-center">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={11} className="py-8 text-center text-muted-foreground">
                                            Tidak ada payment ditemukan
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    payments.data.map((payment, index) => (
                                        <TableRow key={payment.id}>
                                            <TableCell>{(payments.current_page - 1) * payments.per_page + index + 1}</TableCell>
                                            <TableCell className="font-medium">{payment.payment_number}</TableCell>
                                            <TableCell>{payment.purchase.purchase_number}</TableCell>
                                            <TableCell>{payment.purchase.supplier.name}</TableCell>
                                            <TableCell>{format(new Date(payment.payment_date), 'dd MMM yyyy', { locale: idLocale })}</TableCell>
                                            <TableCell>
                                                <Badge className={paymentMethodColors[payment.payment_method]}>{paymentMethodLabels[payment.payment_method]}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">{formatCurrency(payment.amount)}</TableCell>
                                            <TableCell className="text-right">{payment.discount_amount > 0 ? formatCurrency(payment.discount_amount) : '-'}</TableCell>
                                            <TableCell className="text-right font-medium">{formatCurrency(payment.net_amount)}</TableCell>
                                            <TableCell className="text-center">
                                                {payment.jurnal_posted ? (
                                                    <Badge variant="default" className="gap-1">
                                                        <CheckCircle className="h-3 w-3" />
                                                        Posted
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="gap-1">
                                                        <XCircle className="h-3 w-3" />
                                                        Draft
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => router.visit(route('purchase-payments.show', payment.id))}
                                                        className="h-8 w-8 p-0"
                                                        title="Lihat Detail"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {payments.last_page > 1 && (
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                                Menampilkan {payments.from} sampai {payments.to} dari {payments.total} payments
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => handlePageChange(payments.current_page - 1)} disabled={payments.current_page === 1}>
                                    Sebelumnya
                                </Button>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, payments.last_page) }, (_, i) => {
                                        const page = Math.max(1, payments.current_page - 2) + i;
                                        if (page > payments.last_page) return null;
                                        return (
                                            <Button key={page} variant={page === payments.current_page ? 'default' : 'outline'} size="sm" onClick={() => handlePageChange(page)} className="w-8">
                                                {page}
                                            </Button>
                                        );
                                    })}
                                </div>
                                <Button variant="outline" size="sm" onClick={() => handlePageChange(payments.current_page + 1)} disabled={payments.current_page === payments.last_page}>
                                    Selanjutnya
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </AppLayout>
    );
}
