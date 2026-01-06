import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select';
import { SupplierSearchableDropdown } from '@/components/ui/supplier-searchable-dropdown';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, PageProps } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { ShoppingCart, Plus, Trash2, Save, ArrowLeft, Package } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from '@/lib/toast';
import { route } from 'ziggy-js';

interface Supplier {
    id: number;
    name: string;
    phone?: string;
    email?: string;
    is_active?: boolean;
}

interface Item {
    id: number;
    code: string;
    name: string;
    unit_of_measure: string;
    reorder_level: number;
    safety_stock: number;
}

interface PurchaseItem {
    item_id: number;
    quantity_ordered: number;
    unit_price: number;
    notes?: string;
}

interface Purchase {
    id: number;
    purchase_number: string;
    supplier_id: number;
    purchase_date: string;
    expected_delivery_date?: string;
    notes?: string;
    items: Array<{
        item_id: number;
        quantity_ordered: number;
        unit_price: number;
        notes?: string;
        item: {
            id: number;
            code: string;
            name: string;
            unit: string;
        };
    }>;
}

interface Props extends PageProps {
    purchase: Purchase;
    suppliers: Supplier[];
    items: Item[];
}

export default function PurchaseEdit() {
    const { purchase, suppliers, items } = usePage<Props>().props;
    const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
    const [selectedItemId, setSelectedItemId] = useState<string>('');
    const [formData, setFormData] = useState({
        supplier_id: purchase.supplier_id.toString(),
        purchase_date: purchase.purchase_date,
        expected_delivery_date: purchase.expected_delivery_date || '',
        notes: purchase.notes || '',
    });
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<any>({});

    const breadcrumbItems: BreadcrumbItem[] = [
        { title: <Package className="h-4 w-4" />, href: '#' },
        { title: 'Purchase Orders', href: route('purchases.index') },
        { title: purchase.purchase_number, href: route('purchases.show', purchase.id) },
        { title: 'Edit', href: '' }
    ];

    // Initialize purchase items from existing data
    useEffect(() => {
        const initialItems: PurchaseItem[] = purchase.items.map(item => ({
            item_id: item.item_id,
            quantity_ordered: item.quantity_ordered,
            unit_price: item.unit_price,
            notes: item.notes || ''
        }));
        setPurchaseItems(initialItems);
    }, [purchase.items]);

    const addItem = () => {
        if (!selectedItemId) {
            toast.error('Please select an item');
            return;
        }

        const itemExists = purchaseItems.find(item => item.item_id === parseInt(selectedItemId));
        if (itemExists) {
            toast.error('Item already added');
            return;
        }

        const newItem: PurchaseItem = {
            item_id: parseInt(selectedItemId),
            quantity_ordered: 1,
            unit_price: 0,
            notes: ''
        };

        setPurchaseItems([...purchaseItems, newItem]);
        setSelectedItemId('');
    };

    const removeItem = (itemId: number) => {
        setPurchaseItems(purchaseItems.filter(item => item.item_id !== itemId));
    };

    const updateItem = (itemId: number, field: keyof PurchaseItem, value: any) => {
        setPurchaseItems(purchaseItems.map(item =>
            item.item_id === itemId ? { ...item, [field]: value } : item
        ));
    };

    const getSelectedItem = (itemId: number) => {
        return items.find(item => item.id === itemId);
    };

    const getTotalAmount = () => {
        return purchaseItems.reduce((total, item) => {
            return total + (item.quantity_ordered * item.unit_price);
        }, 0);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR'
        }).format(amount);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (purchaseItems.length === 0) {
            toast.error('Please add at least one item');
            return;
        }

        setProcessing(true);
        const submitData = {
            ...formData,
            items: purchaseItems,
            _method: 'PUT'
        };

        try {
            const response = await fetch(route('purchases.update', purchase.id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(submitData)
            });

            if (response.ok) {
                toast.success('Purchase order updated successfully');
                window.location.href = route('purchases.show', purchase.id);
            } else {
                const errorData = await response.json();
                setErrors(errorData.errors || {});
                toast.error('Failed to update purchase order');
            }
        } catch (error) {
            toast.error('Network error occurred');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbItems}>
            <Head title={`Edit Purchase Order - ${purchase.purchase_number}`} />

            <div className="max-w-7xl p-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Edit Purchase Order</h1>
                            <p className="text-muted-foreground">Update purchase order: {purchase.purchase_number}</p>
                        </div>
                        <Button onClick={() => router.visit(route('purchases.index'))} className="flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Kembali
                        </Button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Purchase Order Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Purchase Order Details</CardTitle>
                            <CardDescription>
                                Update the basic information for the purchase order
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="supplier_id">Supplier *</Label>
                                    <SupplierSearchableDropdown
                                        value={formData.supplier_id ? parseInt(formData.supplier_id) : null}
                                        onValueChange={(value) => setFormData({...formData, supplier_id: value ? value.toString() : ''})}
                                        placeholder="Pilih supplier..."
                                        error={!!errors.supplier_id}
                                        suppliers={suppliers.map(s => ({...s, is_active: s.is_active ?? true}))}
                                        className={errors.supplier_id ? 'border-red-500' : ''}
                                    />
                                    {errors.supplier_id && (
                                        <p className="text-sm text-red-500">{errors.supplier_id}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="purchase_date">Purchase Date *</Label>
                                    <Input
                                        type="date"
                                        value={formData.purchase_date}
                                        onChange={(e) => setFormData({...formData, purchase_date: e.target.value})}
                                        className={errors.purchase_date ? 'border-red-500' : ''}
                                    />
                                    {errors.purchase_date && (
                                        <p className="text-sm text-red-500">{errors.purchase_date}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="expected_delivery_date">Expected Delivery Date</Label>
                                    <Input
                                        type="date"
                                        value={formData.expected_delivery_date}
                                        onChange={(e) => setFormData({...formData, expected_delivery_date: e.target.value})}
                                        className={errors.expected_delivery_date ? 'border-red-500' : ''}
                                    />
                                    {errors.expected_delivery_date && (
                                        <p className="text-sm text-red-500">{errors.expected_delivery_date}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                    placeholder="Additional notes for this purchase order..."
                                    className={errors.notes ? 'border-red-500' : ''}
                                />
                                {errors.notes && (
                                    <p className="text-sm text-red-500">{errors.notes}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Purchase Items */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Purchase Items</CardTitle>
                            <CardDescription>
                                Update items in this purchase order
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Add Item Form */}
                            <div className="flex items-end gap-2">
                                <div className="flex-1">
                                    <Label htmlFor="item">Add New Item</Label>
                                    <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select item to add" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {items.filter(item => !purchaseItems.find(pi => pi.item_id === item.id)).map((item) => (
                                                <SelectItem key={item.id} value={item.id.toString()}>
                                                    {item.code} - {item.name}
                                                    <Badge variant="outline" className="ml-2">
                                                        {item.unit_of_measure}
                                                    </Badge>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button type="button" onClick={addItem}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Item
                                </Button>
                            </div>

                            {/* Items Table */}
                            {purchaseItems.length > 0 && (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Item</TableHead>
                                                <TableHead>Quantity</TableHead>
                                                <TableHead>Unit Price</TableHead>
                                                <TableHead>Total</TableHead>
                                                <TableHead>Notes</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {purchaseItems.map((purchaseItem) => {
                                                const item = getSelectedItem(purchaseItem.item_id);
                                                const total = purchaseItem.quantity_ordered * purchaseItem.unit_price;
                                                
                                                return (
                                                    <TableRow key={purchaseItem.item_id}>
                                                        <TableCell>
                                                            {item && (
                                                                <div>
                                                                    <div className="font-medium">{item.code}</div>
                                                                    <div className="text-sm text-muted-foreground">{item.name}</div>
                                                                    <Badge variant="outline" className="mt-1">
                                                                        {item.unit_of_measure}
                                                                    </Badge>
                                                                </div>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                min="0.01"
                                                                step="0.01"
                                                                value={purchaseItem.quantity_ordered}
                                                                onChange={(e) => updateItem(purchaseItem.item_id, 'quantity_ordered', parseFloat(e.target.value) || 0)}
                                                                className="w-24"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                value={purchaseItem.unit_price}
                                                                onChange={(e) => updateItem(purchaseItem.item_id, 'unit_price', parseFloat(e.target.value) || 0)}
                                                                className="w-32"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className="font-medium">{formatCurrency(total)}</span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                value={purchaseItem.notes || ''}
                                                                onChange={(e) => updateItem(purchaseItem.item_id, 'notes', e.target.value)}
                                                                placeholder="Item notes..."
                                                                className="w-32"
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeItem(purchaseItem.item_id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>

                                    {/* Total Summary */}
                                    <div className="border-t p-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-lg font-medium">Total Amount:</span>
                                            <span className="text-lg font-bold">{formatCurrency(getTotalAmount())}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Form Actions */}
                    <div className="flex items-center justify-end space-x-2">
                        <Button type="button" variant="outline" asChild>
                            <a href={route('purchases.show', purchase.id)}>Cancel</a>
                        </Button>
                        <Button type="submit" disabled={processing || purchaseItems.length === 0}>
                            {processing ? (
                                <>Processing...</>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Update Purchase Order
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
