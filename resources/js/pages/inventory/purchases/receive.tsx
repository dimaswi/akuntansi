import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, PageProps } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Package, ArrowLeft, CheckCircle, Clock } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/lib/toast';
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
    status: string;
    supplier: {
        id: number;
        name: string;
    };
    items: PurchaseItem[];
}

interface Props extends PageProps {
    purchase: Purchase;
}

const getItemStatusBadge = (status: string) => {
    const statusConfig = {
        pending: { variant: 'secondary' as const, label: 'Pending', icon: Clock },
        partial: { variant: 'default' as const, label: 'Partial', icon: Clock },
        completed: { variant: 'default' as const, label: 'Completed', icon: CheckCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
        <Badge variant={config.variant} className="inline-flex items-center gap-1">
            <Icon className="h-3 w-3" />
            {config.label}
        </Badge>
    );
};

export default function PurchaseReceive() {
    const { purchase } = usePage<Props>().props;
    const [selectedItem, setSelectedItem] = useState<PurchaseItem | null>(null);
    const [receiveData, setReceiveData] = useState({
        received_quantity: 0,
        batch_number: '',
        expiry_date: ''
    });
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    const breadcrumbItems: BreadcrumbItem[] = [
        { title: <Package className="h-4 w-4" />, href: '#' },
        { title: 'Purchase Orders', href: route('purchases.index') },
        { title: purchase.purchase_number, href: route('purchases.show', purchase.id) },
        { title: 'Receive Items', href: '' }
    ];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR'
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID');
    };

    const getRemainingQuantity = (item: PurchaseItem) => {
        return item.quantity_ordered - item.quantity_received;
    };

    const getReceiveProgress = (item: PurchaseItem) => {
        const percentage = (item.quantity_received / item.quantity_ordered) * 100;
        return Math.round(percentage);
    };

    const openReceiveDialog = (item: PurchaseItem) => {
        setSelectedItem(item);
        setReceiveData({
            received_quantity: Math.min(1, getRemainingQuantity(item)),
            batch_number: '',
            expiry_date: ''
        });
        setIsDialogOpen(true);
    };

    const closeReceiveDialog = () => {
        setSelectedItem(null);
        setIsDialogOpen(false);
        setReceiveData({
            received_quantity: 0,
            batch_number: '',
            expiry_date: ''
        });
    };

    const handleReceiveItem = async () => {
        if (!selectedItem) return;

        if (receiveData.received_quantity <= 0) {
            toast.error('Please enter a valid quantity');
            return;
        }

        if (receiveData.received_quantity > getRemainingQuantity(selectedItem)) {
            toast.error('Quantity cannot exceed remaining quantity');
            return;
        }

        setProcessing(true);

        try {
            const response = await fetch(route('purchases.receiveItem', selectedItem.id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(receiveData)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                toast.success('Item received successfully');
                closeReceiveDialog();
                // Refresh the page to show updated data
                window.location.reload();
            } else {
                toast.error(result.message || 'Failed to receive item');
            }
        } catch (error) {
            toast.error('Network error occurred');
        } finally {
            setProcessing(false);
        }
    };

    const pendingItems = purchase.items.filter(item => item.item_status !== 'completed');
    const completedItems = purchase.items.filter(item => item.item_status === 'completed');

    return (
        <AppLayout breadcrumbs={breadcrumbItems}>
            <Head title={`Receive Items - ${purchase.purchase_number}`} />

            <div className="space-y-6 mt-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Receive Items</h1>
                        <p className="text-muted-foreground">
                            Purchase Order: {purchase.purchase_number}
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <a href={route('purchases.show', purchase.id)}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Purchase Order
                        </a>
                    </Button>
                </div>

                {/* Purchase Summary */}
                <Card>
                    <CardHeader>
                        <CardTitle>Purchase Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <h4 className="font-medium text-sm text-muted-foreground">Supplier</h4>
                                <p className="font-medium">{purchase.supplier.name}</p>
                            </div>
                            <div>
                                <h4 className="font-medium text-sm text-muted-foreground">Purchase Date</h4>
                                <p>{formatDate(purchase.purchase_date)}</p>
                            </div>
                            {purchase.expected_delivery_date && (
                                <div>
                                    <h4 className="font-medium text-sm text-muted-foreground">Expected Delivery</h4>
                                    <p>{formatDate(purchase.expected_delivery_date)}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Pending Items */}
                {pendingItems.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Items to Receive ({pendingItems.length})
                            </CardTitle>
                            <CardDescription>
                                Items that are pending or partially received
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Item</TableHead>
                                            <TableHead>Ordered</TableHead>
                                            <TableHead>Received</TableHead>
                                            <TableHead>Remaining</TableHead>
                                            <TableHead>Progress</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pendingItems.map((item) => {
                                            const remaining = getRemainingQuantity(item);
                                            const progress = getReceiveProgress(item);
                                            
                                            return (
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
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className={`font-medium ${remaining > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                                            {remaining}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center space-x-2">
                                                            <div className="w-20 bg-gray-200 rounded-full h-2">
                                                                <div 
                                                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                                                    style={{ width: `${progress}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-sm text-muted-foreground">{progress}%</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{getItemStatusBadge(item.item_status)}</TableCell>
                                                    <TableCell className="text-right">
                                                        {remaining > 0 && (
                                                            <Button
                                                                size="sm"
                                                                onClick={() => openReceiveDialog(item)}
                                                            >
                                                                Receive
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Completed Items */}
                {completedItems.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                Completed Items ({completedItems.length})
                            </CardTitle>
                            <CardDescription>
                                Items that have been fully received
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Item</TableHead>
                                            <TableHead>Quantity</TableHead>
                                            <TableHead>Unit Price</TableHead>
                                            <TableHead>Total</TableHead>
                                            <TableHead>Batch/Expiry</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {completedItems.map((item) => (
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
                                                    <span className="font-medium">{item.quantity_received}</span>
                                                </TableCell>
                                                <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                                                <TableCell>{formatCurrency(item.total_price)}</TableCell>
                                                <TableCell>
                                                    {item.batch_number && (
                                                        <div className="text-sm">
                                                            <span className="font-medium">Batch:</span> {item.batch_number}
                                                        </div>
                                                    )}
                                                    {item.expiry_date && (
                                                        <div className="text-sm text-muted-foreground">
                                                            <span className="font-medium">Exp:</span> {formatDate(item.expiry_date)}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>{getItemStatusBadge(item.item_status)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Receive Item Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Receive Item</DialogTitle>
                            <DialogDescription>
                                {selectedItem && (
                                    <>Enter the quantity received for {selectedItem.item.code} - {selectedItem.item.name}</>
                                )}
                            </DialogDescription>
                        </DialogHeader>
                        {selectedItem && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-medium">Ordered:</span> {selectedItem.quantity_ordered}
                                    </div>
                                    <div>
                                        <span className="font-medium">Already Received:</span> {selectedItem.quantity_received}
                                    </div>
                                    <div className="col-span-2">
                                        <span className="font-medium">Remaining:</span> {getRemainingQuantity(selectedItem)}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="received_quantity">Quantity Received *</Label>
                                    <Input
                                        id="received_quantity"
                                        type="number"
                                        min="0.01"
                                        max={getRemainingQuantity(selectedItem)}
                                        step="0.01"
                                        value={receiveData.received_quantity}
                                        onChange={(e) => setReceiveData({
                                            ...receiveData,
                                            received_quantity: parseFloat(e.target.value) || 0
                                        })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="batch_number">Batch Number (Optional)</Label>
                                    <Input
                                        id="batch_number"
                                        value={receiveData.batch_number}
                                        onChange={(e) => setReceiveData({
                                            ...receiveData,
                                            batch_number: e.target.value
                                        })}
                                        placeholder="Enter batch number"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="expiry_date">Expiry Date (Optional)</Label>
                                    <Input
                                        id="expiry_date"
                                        type="date"
                                        value={receiveData.expiry_date}
                                        onChange={(e) => setReceiveData({
                                            ...receiveData,
                                            expiry_date: e.target.value
                                        })}
                                    />
                                </div>
                            </div>
                        )}
                        <DialogFooter>
                            <Button variant="outline" onClick={closeReceiveDialog}>
                                Cancel
                            </Button>
                            <Button onClick={handleReceiveItem} disabled={processing}>
                                {processing ? 'Processing...' : 'Receive Item'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
