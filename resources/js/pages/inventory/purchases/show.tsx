import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { BreadcrumbItem, PageProps } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, Clock, DollarSign, Edit, Package, Send, ShoppingCart, Trash2, Truck, XCircle, BookOpen } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/lib/toast';
import { route } from 'ziggy-js';
import { usePermission } from '@/hooks/use-permission';

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
    jurnal_posted: boolean;
    jurnal_id?: number;
    ap_outstanding: number;
    ap_paid_amount: number;
    supplier: {
        id: number;
        name: string;
        phone?: string;
        email?: string;
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
    jurnal?: {
        nomor_jurnal: string;
    };
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
    const { hasPermission } = usePermission();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

    // Debug log
    console.log('Purchase Status:', purchase.status);
    console.log('canReceive:', canReceive);
    console.log('canEdit:', canEdit);
    console.log('canApprove:', canApprove);

    const breadcrumbItems: BreadcrumbItem[] = [
        { title: <Package className="h-4 w-4" />, href: '#' },
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
        router.delete(route('purchases.destroy', purchase.id), {
            onSuccess: () => {
                setDeleteDialogOpen(false);
            },
            onError: (errors) => {
                toast.error(errors?.message || 'Failed to delete purchase order');
            },
        });
    };

    const handleSubmit = () => {
        router.post(
            route('purchases.submit', purchase.id),
            {},
            {
                onError: (errors) => {
                    toast.error(errors?.message || 'Failed to submit purchase order');
                },
            },
        );
    };

    const handleApprove = () => {
        router.post(
            route('purchases.approve', purchase.id),
            {},
            {
                onError: (errors) => {
                    toast.error(errors?.message || 'Failed to approve purchase order');
                },
            },
        );
    };

    const handleMarkAsOrdered = () => {
        router.post(
            route('purchases.markAsOrdered', purchase.id),
            {},
            {
                onError: (errors) => {
                    toast.error(errors?.message || 'Failed to mark as ordered');
                },
            },
        );
    };

    const handleCancel = () => {
        router.post(
            route('purchases.cancel', purchase.id),
            {},
            {
                onSuccess: () => {
                    setCancelDialogOpen(false);
                },
                onError: (errors) => {
                    toast.error(errors?.message || 'Failed to cancel purchase order');
                },
            },
        );
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

                            {purchase.status === 'approved' && (
                                <Button onClick={handleMarkAsOrdered} className="flex items-center gap-2">
                                    <Truck className="mr-2 h-4 w-4" />
                                    Mark as Ordered
                                </Button>
                            )}

                            {canReceive && (purchase.status === 'approved' || purchase.status === 'ordered' || purchase.status === 'partial') && (
                                <Button onClick={() => router.visit(route('purchases.receive', purchase.id))} className="flex items-center gap-2">
                                    <Package className="mr-2 h-4 w-4" />
                                    Receive Items
                                </Button>
                            )}

                            {/* ACCOUNTING ACTIONS */}
                            {/* 1. POST TO JURNAL - Jika sudah approved/completed tapi BELUM diposting */}
                            {(purchase.status === 'approved' || purchase.status === 'ordered' || purchase.status === 'partial' || purchase.status === 'completed') && 
                             !purchase.jurnal_posted && 
                             hasPermission('inventory.purchases.post-to-journal') && (
                                <Button 
                                    onClick={() => router.visit(route('purchases.showPostToJournal') + '?id=' + purchase.id)}
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                                    variant="default"
                                >
                                    <BookOpen className="mr-2 h-4 w-4" />
                                    Post to Jurnal
                                </Button>
                            )}

                            {/* 2. CREATE PAYMENT - Jika sudah diposting dan ada outstanding AP */}
                            {purchase.jurnal_posted && 
                             purchase.ap_outstanding > 0 && 
                             hasPermission('inventory.purchases.create-payment') && (
                                <Button 
                                    onClick={() => router.visit(route('purchase-payments.create') + '?purchase_id=' + purchase.id)}
                                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                                    variant="default"
                                >
                                    <DollarSign className="mr-2 h-4 w-4" />
                                    Create Payment
                                </Button>
                            )}

                            {(purchase.status === 'draft' || purchase.status === 'pending') && canEdit && (
                                <>
                                    <Button variant="outline" onClick={() => setCancelDialogOpen(true)}>
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Cancel
                                    </Button>
                                    <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
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

                        {/* Approval Info */}
                        <Card className='mb-6'>
                            <CardHeader>
                                <CardTitle>Approval Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
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

                        {/* Accounting Status Card */}
                        <Card className={`mb-6 ${
                            purchase.jurnal_posted 
                                ? (purchase.ap_outstanding > 0 ? 'border-orange-500 bg-orange-50' : 'border-green-500 bg-green-50')
                                : 'border-blue-500 bg-blue-50'
                        }`}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BookOpen className="h-5 w-5" />
                                    Accounting Status
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Jurnal Status */}
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Jurnal Status</h4>
                                    {purchase.jurnal_posted ? (
                                        <div className="flex items-center gap-2">
                                            <Badge variant="default" className="bg-blue-600">
                                                <CheckCircle className="mr-1 h-3 w-3" />
                                                Posted
                                            </Badge>
                                            {purchase.jurnal && (
                                                <span className="text-sm text-muted-foreground">
                                                    #{purchase.jurnal.nomor_jurnal}
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <Badge variant="secondary">
                                            <Clock className="mr-1 h-3 w-3" />
                                            Not Posted
                                        </Badge>
                                    )}
                                </div>

                                {/* AP Outstanding (only if posted) */}
                                {purchase.jurnal_posted && (
                                    <>
                                        <div className="pt-3 border-t">
                                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Accounts Payable</h4>
                                            <div className="grid grid-cols-2 gap-2 mt-2">
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Total</p>
                                                    <p className="text-sm font-medium">{formatCurrency(purchase.total_amount)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Paid</p>
                                                    <p className="text-sm font-medium text-green-600">{formatCurrency(purchase.ap_paid_amount || 0)}</p>
                                                </div>
                                            </div>
                                            <div className="mt-2 p-2 bg-white rounded border">
                                                <p className="text-xs text-muted-foreground">Outstanding</p>
                                                <p className={`text-lg font-bold ${purchase.ap_outstanding > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                                    {formatCurrency(purchase.ap_outstanding)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Payment Status */}
                                        <div className="pt-3 border-t">
                                            <h4 className="text-sm font-medium text-muted-foreground mb-2">Payment Status</h4>
                                            {purchase.ap_outstanding === 0 ? (
                                                <Badge variant="default" className="bg-green-600">
                                                    <CheckCircle className="mr-1 h-3 w-3" />
                                                    Fully Paid
                                                </Badge>
                                            ) : purchase.ap_paid_amount > 0 ? (
                                                <Badge variant="default" className="bg-orange-500">
                                                    <Clock className="mr-1 h-3 w-3" />
                                                    Partially Paid
                                                </Badge>
                                            ) : (
                                                <Badge variant="destructive">
                                                    <XCircle className="mr-1 h-3 w-3" />
                                                    Unpaid
                                                </Badge>
                                            )}
                                        </div>
                                    </>
                                )}

                                {/* Info message based on status */}
                                {!purchase.jurnal_posted && (purchase.status === 'approved' || purchase.status === 'ordered' || purchase.status === 'completed') && (
                                    <div className="pt-3 border-t">
                                        <p className="text-xs text-blue-600">
                                            ℹ️ Silakan klik <strong>"Post to Jurnal"</strong> untuk mencatat hutang (AP) ke sistem akuntansi
                                        </p>
                                    </div>
                                )}
                                
                                {purchase.jurnal_posted && purchase.ap_outstanding > 0 && (
                                    <div className="pt-3 border-t">
                                        <p className="text-xs text-orange-600">
                                            💰 Ada sisa hutang. Klik <strong>"Create Payment"</strong> untuk mencatat pembayaran ke supplier
                                        </p>
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
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Cancel Confirmation Dialog */}
            <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Purchase Order?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to cancel this purchase order? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>No, Keep It</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancel}>
                            Yes, Cancel Order
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
