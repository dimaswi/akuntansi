import { type Column, type FilterField, DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type PageProps } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { CheckCircle, Clock, Edit, Eye, Package, Plus, ShoppingCart, Trash2, Truck, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/lib/toast';

interface Purchase {
    id: number;
    purchase_number: string;
    purchase_date: string;
    expected_delivery_date?: string;
    actual_delivery_date?: string;
    status: 'draft' | 'pending' | 'approved' | 'ordered' | 'partial' | 'completed' | 'cancelled';
    total_amount: number;
    notes?: string;
    supplier: { id: number; name: string };
    creator: { id: number; name: string };
    approver?: { id: number; name: string };
    approved_at?: string;
    completed_at?: string;
    items_count?: number;
}

interface Supplier { id: number; name: string; is_active?: boolean }

interface Props extends PageProps {
    purchases: { data: Purchase[]; links: any; meta: any };
    filters: { search?: string; status?: string; supplier_id?: number; date_from?: string; date_to?: string; perPage?: number };
    suppliers: Supplier[];
    statusOptions: { value: string; label: string }[];
    statistics: Record<string, number>;
}

const breadcrumbItems: BreadcrumbItem[] = [
    { title: <Package className="h-4 w-4" />, href: '#' },
    { title: 'Purchase Orders', href: '#' },
];

const statusIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    draft: Edit,
    pending: Clock,
    approved: CheckCircle,
    ordered: Truck,
    partial: Clock,
    completed: CheckCircle,
    cancelled: XCircle,
};

const statusVariants: Record<string, 'secondary' | 'default' | 'destructive'> = {
    draft: 'secondary',
    cancelled: 'destructive',
};

const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(n);

const fmtDate = (d: string) => new Date(d).toLocaleDateString('id-ID');

export default function PurchaseIndex() {
    const { purchases, filters, suppliers, statusOptions } = usePage<Props>().props;
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [purchaseToDelete, setPurchaseToDelete] = useState<number | null>(null);

    const meta = purchases.meta || {};
    const pagination = {
        current_page: meta.current_page ?? 1,
        last_page: meta.last_page ?? 1,
        per_page: meta.per_page ?? 10,
        total: meta.total ?? 0,
        from: meta.from ?? 0,
        to: meta.to ?? 0,
    };

    const navigate = (p: Record<string, any>) =>
        router.get(route('purchases.index'), p, { preserveState: true, preserveScroll: true });

    const fp = {
        search: filters.search || '',
        status: filters.status || '',
        supplier_id: filters.supplier_id ? String(filters.supplier_id) : '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
        perPage: filters.perPage || 10,
    };

    const confirmDelete = () => {
        if (purchaseToDelete) {
            router.delete(route('purchases.destroy', purchaseToDelete), {
                onSuccess: () => { setDeleteDialogOpen(false); setPurchaseToDelete(null); },
                onError: (errors) => toast.error(errors?.message || 'Failed to delete purchase order'),
            });
        }
    };

    const columns: Column<Purchase>[] = [
        { key: 'purchase_number', label: 'Purchase Number', className: 'font-medium', render: (row) => row.purchase_number },
        { key: 'supplier', label: 'Supplier', render: (row) => row.supplier.name },
        { key: 'purchase_date', label: 'Purchase Date', render: (row) => fmtDate(row.purchase_date) },
        {
            key: 'status', label: 'Status',
            render: (row) => {
                const Icon = statusIcons[row.status] || Edit;
                const variant = statusVariants[row.status] || 'default';
                const label = statusOptions.find((s) => s.value === row.status)?.label || row.status;
                return (
                    <Badge variant={variant} className="inline-flex items-center gap-1">
                        <Icon className="h-3 w-3" />
                        {label}
                    </Badge>
                );
            },
        },
        { key: 'total_amount', label: 'Total Amount', render: (row) => fmtCurrency(row.total_amount) },
        { key: 'items', label: 'Items', render: (row) => <Badge variant="outline">{row.items_count || 0} items</Badge> },
        {
            key: 'actions', label: 'Actions',
            className: 'text-right',
            render: (row) => (
                <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" asChild>
                        <a href={route('purchases.show', row.id)}>
                            <Eye className="h-4 w-4" />
                        </a>
                    </Button>
                    {row.status === 'draft' && (
                        <>
                            <Button variant="ghost" size="sm" asChild>
                                <a href={route('purchases.edit', row.id)}>
                                    <Edit className="h-4 w-4" />
                                </a>
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => { setPurchaseToDelete(row.id); setDeleteDialogOpen(true); }}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                </div>
            ),
        },
    ];

    const filterFields: FilterField[] = [
        {
            name: 'status',
            label: 'Status',
            type: 'select',
            value: fp.status,
            options: statusOptions.map((s) => ({ value: s.value, label: s.label })),
        },
        {
            name: 'supplier_id',
            label: 'Supplier',
            type: 'select',
            value: fp.supplier_id,
            options: suppliers.map((s) => ({ value: s.id.toString(), label: s.name })),
        },
        { name: 'date_from', label: 'Date From', type: 'date', value: fp.date_from },
        { name: 'date_to', label: 'Date To', type: 'date', value: fp.date_to },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbItems}>
            <Head title="Purchase Orders" />
            <div className="p-4">
                <DataTable<Purchase>
                    pageTitle="Daftar Purchase Orders"
                    pageSubtitle="Kelola data purchase orders Anda di sini"
                    columns={columns}
                    data={purchases.data}
                    pagination={pagination}
                    searchValue={fp.search}
                    searchPlaceholder="Search by purchase number or supplier..."
                    onSearch={(v) => navigate({ ...fp, search: v, page: 1 })}
                    filters={filterFields}
                    onFilterChange={(k, v) => navigate({ ...fp, [k]: v, page: 1 })}
                    onFilterReset={() => navigate({ search: '', status: '', supplier_id: '', date_from: '', date_to: '', perPage: fp.perPage, page: 1 })}
                    onPageChange={(p) => navigate({ ...fp, page: p })}
                    onPerPageChange={(n) => navigate({ ...fp, perPage: n, page: 1 })}
                    headerActions={
                        <Button onClick={() => router.visit(route('purchases.create'))} className="gap-2">
                            <Plus className="h-4 w-4" />
                            New Purchase
                        </Button>
                    }
                    emptyIcon={<ShoppingCart className="h-8 w-8 text-muted-foreground/50" />}
                    emptyText="No purchase orders found"
                    rowKey={(r) => r.id}
                />
            </div>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the purchase order and remove the data from the server.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setPurchaseToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
