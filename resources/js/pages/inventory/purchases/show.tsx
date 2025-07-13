import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, PageProps } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, Clock, Edit, Package, Send, ShoppingCart, Trash2, Truck, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

interface PurchaseItem {
    id: number;
    item_id: number;
    quantity_ordered: number;
    quantity_received: number;
    unit_price: number;
    total_price: number;
    notes?: string;
    batch_number?: string;
    expiry_date?: string;
    item_status: 'pending' | 'partial' | 'completed';
    item: {
        id: number;
        code: string;
        name: string;
        unit_of_measure: string;
    };
}

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
        phone?: string;
        email?: string;
    };
    department: {
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
    items: PurchaseItem[];
}

interface Props extends PageProps {
    purchase: Purchase;
    canEdit: boolean;
    canApprove: boolean;
    canReceive: boolean;
}

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

const getItemStatusBadge = (status: string) => {
    const statusConfig = {
        pending: { variant: 'secondary' as const, label: 'Pending' },
        partial: { variant: 'default' as const, label: 'Partial' },
        completed: { variant: 'default' as const, label: 'Completed' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return <Badge variant={config.variant}>{config.label}</Badge>;
};

export default function PurchaseShow() {
    const { purchase, canEdit, canApprove, canReceive } = usePage<Props>().props;

    const breadcrumbItems: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Inventory', href: '/inventory' },
        { title: 'Purchase Orders', href: route('purchases.index') },
        { title: purchase.purchase_number, href: '' },
    ];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID');
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this purchase order?')) {
            router.delete(route('purchases.destroy', purchase.id), {
                onSuccess: () => {
                    toast.success('Purchase order deleted successfully');
                },
                onError: () => {
                    toast.error('Failed to delete purchase order');
                },
            });
        }
    };

    const handleSubmit = () => {
        router.post(
            route('purchases.submit', purchase.id),
            {},
            {
                onSuccess: () => {
                    toast.success('Purchase order submitted for approval');
                },
                onError: () => {
                    toast.error('Failed to submit purchase order');
                },
            },
        );
    };

    const handleApprove = () => {
        router.post(
            route('purchases.approve', purchase.id),
            {},
            {
                onSuccess: () => {
                    toast.success('Purchase order approved successfully');
                },
                onError: () => {
                    toast.error('Failed to approve purchase order');
                },
            },
        );
    };

    const handleCancel = () => {
        if (confirm('Are you sure you want to cancel this purchase order?')) {
            router.post(
                route('purchases.cancel', purchase.id),
                {},
                {
                    onSuccess: () => {
                        toast.success('Purchase order cancelled successfully');
                    },
                    onError: () => {
                        toast.error('Failed to cancel purchase order');
                    },
                },
            );
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbItems}>
            <Head title={`Purchase Order - ${purchase.purchase_number}`} />

            <div className="max-w-7xl p-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{purchase.purchase_number}</h1>
                            <p className="text-muted-foreground">Purchase order details and items</p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button onClick={() => router.visit(route('purchases.index'))} className="flex items-center gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                Kembali
                            </Button>

                            {canEdit && purchase.status === 'draft' && (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={() => router.visit(route('purchases.edit', purchase.id))}
                                        className="flex items-center gap-2"
                                    >
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                    </Button>
                                    <Button onClick={handleSubmit}>
                                        <Send className="mr-2 h-4 w-4" />
                                        Submit for Approval
                                    </Button>
                                </>
                            )}

                            {canApprove && purchase.status === 'pending' && (
                                <Button onClick={handleApprove}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Approve
                                </Button>
                            )}

                            {canReceive && (purchase.status === 'approved' || purchase.status === 'ordered' || purchase.status === 'partial') && (
                                <Button onClick={() => router.visit(route('purchases.receive', purchase.id))} className="flex items-center gap-2">
                                    <Package className="mr-2 h-4 w-4" />
                                    Receive Items
                                </Button>
                            )}

                            {(purchase.status === 'draft' || purchase.status === 'pending') && canEdit && (
                                <>
                                    <Button variant="outline" onClick={handleCancel}>
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Cancel
                                    </Button>
                                    <Button variant="destructive" onClick={handleDelete}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Purchase Details */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ShoppingCart className="h-5 w-5" />
                                    Purchase Order Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-6">
                                    {/* Row 1 */}
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                        <div>
                                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Purchase Number</h4>
                                            <p className="text-lg font-semibold">{purchase.purchase_number}</p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Status</h4>
                                            <div>{getStatusBadge(purchase.status)}</div>
                                        </div>
                                    </div>
                                    
                                    {/* Row 2 */}
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                        <div>
                                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Purchase Date</h4>
                                            <p>{formatDate(purchase.purchase_date)}</p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Total Amount</h4>
                                            <p className="text-lg font-semibold">{formatCurrency(purchase.total_amount)}</p>
                                        </div>
                                    </div>
                                    
                                    {/* Row 3 - Delivery Dates (if available) */}
                                    {(purchase.expected_delivery_date || purchase.actual_delivery_date) && (
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            {purchase.expected_delivery_date && (
                                                <div>
                                                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Expected Delivery</h4>
                                                    <p>{formatDate(purchase.expected_delivery_date)}</p>
                                                </div>
                                            )}
                                            {purchase.actual_delivery_date && (
                                                <div>
                                                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Actual Delivery</h4>
                                                    <p>{formatDate(purchase.actual_delivery_date)}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {purchase.notes && (
                                    <div className="mt-6 pt-6 border-t">
                                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Notes</h4>
                                        <p className="text-sm">{purchase.notes}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        {/* Supplier Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Supplier Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Supplier Name</h4>
                                    <p className="font-medium">{purchase.supplier.name}</p>
                                </div>
                                {purchase.supplier.phone && (
                                    <div>
                                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Phone</h4>
                                        <p>{purchase.supplier.phone}</p>
                                    </div>
                                )}
                                {purchase.supplier.email && (
                                    <div>
                                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Email</h4>
                                        <p>{purchase.supplier.email}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Department & Approval Info */}
                        <Card className='mb-6'>
                            <CardHeader>
                                <CardTitle>Department & Approval</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Department</h4>
                                    <p className="font-medium">{purchase.department.name}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Created By</h4>
                                    <p>{purchase.creator.name}</p>
                                </div>
                                {purchase.approver && (
                                    <div>
                                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Approved By</h4>
                                        <p>{purchase.approver.name}</p>
                                        {purchase.approved_at && <p className="text-sm text-muted-foreground mt-1">{formatDate(purchase.approved_at)}</p>}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Purchase Items */}
                <Card>
                    <CardHeader>
                        <CardTitle>Purchase Items ({purchase.items.length})</CardTitle>
                        <CardDescription>List of items in this purchase order</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item</TableHead>
                                        <TableHead>Quantity Ordered</TableHead>
                                        <TableHead>Quantity Received</TableHead>
                                        <TableHead>Unit Price</TableHead>
                                        <TableHead>Total Price</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Notes</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {purchase.items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{item.item.code}</div>
                                                    <div className="text-sm text-muted-foreground">{item.item.name}</div>
                                                    <Badge variant="outline" className="mt-1">
                                                        {item.item.unit_of_measure}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-medium">{item.quantity_ordered}</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-medium">{item.quantity_received}</span>
                                                {item.quantity_received > 0 && item.quantity_received < item.quantity_ordered && (
                                                    <div className="text-sm text-muted-foreground">
                                                        Remaining: {item.quantity_ordered - item.quantity_received}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                                            <TableCell>{formatCurrency(item.total_price)}</TableCell>
                                            <TableCell>{getItemStatusBadge(item.item_status)}</TableCell>
                                            <TableCell>
                                                {item.notes && <p className="text-sm">{item.notes}</p>}
                                                {item.batch_number && <div className="text-xs text-muted-foreground">Batch: {item.batch_number}</div>}
                                                {item.expiry_date && (
                                                    <div className="text-xs text-muted-foreground">Exp: {formatDate(item.expiry_date)}</div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Summary */}
                            <div className="border-t p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-lg font-medium">Total Amount:</span>
                                    <span className="text-lg font-bold">{formatCurrency(purchase.total_amount)}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
