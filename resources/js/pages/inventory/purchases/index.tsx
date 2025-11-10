import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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
import { SupplierSearchableDropdown } from '@/components/ui/supplier-searchable-dropdown';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, PageProps } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { ShoppingCart, Plus, Edit, Trash2, Eye, Search, Filter, CheckCircle, Clock, XCircle, Truck, Package } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

interface Purchase {
    id: number;
    purchase_number: string;
    purchase_date: string;
    expected_delivery_date?: string;
    actual_delivery_date?: string;
    status: 'draft' | 'pending' | 'approved' | 'ordered' | 'partial' | 'completed' | 'cancelled';
    total_amount: number;
    notes?: string;
    supplier: {
        id: number;
        name: string;
    };
    creator: {
        id: number;
        name: string;
    };
    approver?: {
        id: number;
        name: string;
    };
    approved_at?: string;
    completed_at?: string;
    items_count?: number;
}

interface Supplier {
    id: number;
    name: string;
    is_active?: boolean;
}

interface Props extends PageProps {
    purchases: {
        data: Purchase[];
        links: any;
        meta: any;
    };
    filters: {
        search?: string;
        status?: string;
        supplier_id?: number;
        date_from?: string;
        date_to?: string;
        perPage?: number;
    };
    suppliers: Supplier[];
    statusOptions: { value: string; label: string }[];
    statistics: {
        draft: number;
        pending: number;
        approved: number;
        ordered: number;
        partial: number;
        completed: number;
        cancelled: number;
    };
}

const breadcrumbItems: BreadcrumbItem[] = [
    { title: <Package className="h-4 w-4" />, href: '#' },
    { title: 'Purchase Orders', href: '#' }
];

const getStatusBadge = (status: string) => {
    const statusConfig = {
        draft: { variant: 'secondary' as const, icon: Edit, label: 'Draft' },
        pending: { variant: 'default' as const, icon: Clock, label: 'Pending Approval' },
        approved: { variant: 'default' as const, icon: CheckCircle, label: 'Approved' },
        ordered: { variant: 'default' as const, icon: Truck, label: 'Ordered' },
        partial: { variant: 'default' as const, icon: Clock, label: 'Partially Received' },
        completed: { variant: 'default' as const, icon: CheckCircle, label: 'Completed' },
        cancelled: { variant: 'destructive' as const, icon: XCircle, label: 'Cancelled' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;

    return (
        <Badge variant={config.variant} className="inline-flex items-center gap-1">
            <Icon className="h-3 w-3" />
            {config.label}
        </Badge>
    );
};

export default function PurchaseIndex() {
    const { purchases, suppliers, statistics, statusOptions } = usePage<Props>().props;
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [selectedSupplier, setSelectedSupplier] = useState<number | null>(null);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [purchaseToDelete, setPurchaseToDelete] = useState<number | null>(null);

    const handleSearch = () => {
        router.get(route('purchases.index'), {
            search: searchTerm,
            status: selectedStatus !== 'all' ? selectedStatus : undefined,
            supplier_id: selectedSupplier,
            date_from: dateFrom,
            date_to: dateTo,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedStatus('all');
        setSelectedSupplier(null);
        setDateFrom('');
        setDateTo('');
        router.get(route('purchases.index'), {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleDelete = (id: number) => {
        setPurchaseToDelete(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (purchaseToDelete) {
            router.delete(route('purchases.destroy', purchaseToDelete), {
                onSuccess: () => {
                    toast.success('Purchase order deleted successfully');
                    setDeleteDialogOpen(false);
                    setPurchaseToDelete(null);
                },
                onError: () => {
                    toast.error('Failed to delete purchase order');
                }
            });
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR'
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbItems}>
            <Head title="Purchase Orders" />

            <Card className='mt-6'>
                <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <ShoppingCart className="h-5 w-5" />
                                Purchase Orders Management
                            </CardTitle>
                            <CardDescription>
                                Manage and track all purchase orders for inventory items
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setShowFilters(!showFilters)}
                                className="gap-2"
                            >
                                <Filter className="h-4 w-4" />
                                {showFilters ? 'Hide Filters' : 'Show Filters'}
                            </Button>
                            <Button
                                onClick={() => router.visit(route('purchases.create'))}
                                className="gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                New Purchase
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Search Bar */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by purchase number or supplier..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <Button onClick={handleSearch} className="gap-2">
                            <Search className="h-4 w-4" />
                            Search
                        </Button>
                        {(searchTerm || selectedStatus !== 'all' || selectedSupplier || dateFrom || dateTo) && (
                            <Button variant="outline" onClick={handleClearFilters}>
                                Clear
                            </Button>
                        )}
                    </div>

                    {/* Collapsible Filters */}
                    {showFilters && (
                        <div className="p-4 border rounded-lg bg-gray-50">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Status</SelectItem>
                                            {statusOptions.map((status) => (
                                                <SelectItem key={status.value} value={status.value}>
                                                    {status.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Supplier</Label>
                                    <SupplierSearchableDropdown
                                        value={selectedSupplier}
                                        onValueChange={setSelectedSupplier}
                                        placeholder="All Suppliers"
                                        suppliers={suppliers.map(s => ({...s, is_active: s.is_active ?? true}))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Date From</Label>
                                    <Input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Date To</Label>
                                    <Input
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Purchase Orders Table */}
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Purchase Number</TableHead>
                                    <TableHead>Supplier</TableHead>
                                    <TableHead>Purchase Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Total Amount</TableHead>
                                    <TableHead>Items</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                    {purchases.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8">
                                                <div className="flex flex-col items-center gap-2">
                                                    <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                                                    <p className="text-muted-foreground">No purchase orders found</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        purchases.data.map((purchase) => (
                                            <TableRow key={purchase.id}>
                                                <TableCell className="font-medium">
                                                    {purchase.purchase_number}
                                                </TableCell>
                                                <TableCell>{purchase.supplier.name}</TableCell>
                                                <TableCell>{formatDate(purchase.purchase_date)}</TableCell>
                                                <TableCell>{getStatusBadge(purchase.status)}</TableCell>
                                                <TableCell>{formatCurrency(purchase.total_amount)}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {purchase.items_count || 0} items
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            asChild
                                                        >
                                                            <a href={route('purchases.show', purchase.id)}>
                                                                <Eye className="h-4 w-4" />
                                                            </a>
                                                        </Button>
                                                        {purchase.status === 'draft' && (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    asChild
                                                                >
                                                                    <a href={route('purchases.edit', purchase.id)}>
                                                                        <Edit className="h-4 w-4" />
                                                                    </a>
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleDelete(purchase.id)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {purchases?.meta?.last_page > 1 && (
                            <div className="flex items-center justify-between space-x-2 py-4">
                                <div className="text-sm text-muted-foreground">
                                    Showing {purchases.meta.from} to {purchases.meta.to} of {purchases.meta.total} results
                                </div>
                                <div className="flex items-center space-x-2">
                                    {purchases.links.map((link: any, index: number) => (
                                        <Button
                                            key={index}
                                            variant={link.active ? "default" : "outline"}
                                            size="sm"
                                            disabled={!link.url}
                                            onClick={() => link.url && router.get(link.url)}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Delete Confirmation Dialog */}
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
