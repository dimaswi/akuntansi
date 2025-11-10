import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ItemSearchableDropdown } from '@/components/ui/item-searchable-dropdown';
import { Label } from '@/components/ui/label';
import { SupplierSearchableDropdown } from '@/components/ui/supplier-searchable-dropdown';
import { SearchableAccountSelect } from '@/components/ui/searchable-account-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, PageProps } from '@/types';
import { Head, router, usePage, useForm } from '@inertiajs/react';
import { ArrowLeft, Package, Plus, Save, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
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

interface Akun {
    id: number;
    kode_akun: string;
    nama_akun: string;
    jenis_akun: string;
}

interface PurchaseItem {
    item_id: number;
    quantity_ordered: number;
    unit_price: number;
    notes?: string;
}

interface Props extends PageProps {
    suppliers: Supplier[];
    items: Item[];
    akunKas: Akun[];
}

const breadcrumbItems: BreadcrumbItem[] = [
    { title: <Package className="h-4 w-4" />, href: '#' },
    { title: 'Purchase Orders', href: route('purchases.index') },
    { title: 'Create Purchase Order', href: '' },
];

export default function PurchaseCreate() {
    const { suppliers, items, akunKas } = usePage<Props>().props;
    const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
    const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
    
    const { data, setData, post, processing, errors } = useForm({
        supplier_id: '',
        purchase_date: new Date().toISOString().split('T')[0],
        expected_delivery_date: '',
        akun_kas_id: '',
        notes: '',
    });

    const addItem = () => {
        if (!selectedItemId) {
            toast.error('Please select an item');
            return;
        }

        const itemExists = purchaseItems.find((item) => item.item_id === selectedItemId);
        if (itemExists) {
            toast.error('Item already added');
            return;
        }

        const newItem: PurchaseItem = {
            item_id: selectedItemId,
            quantity_ordered: 1,
            unit_price: 0,
            notes: '',
        };

        setPurchaseItems([...purchaseItems, newItem]);
        setSelectedItemId(null);
    };

    const removeItem = (itemId: number) => {
        setPurchaseItems(purchaseItems.filter((item) => item.item_id !== itemId));
    };

    const updateItem = (itemId: number, field: keyof PurchaseItem, value: any) => {
        setPurchaseItems(purchaseItems.map((item) => (item.item_id === itemId ? { ...item, [field]: value } : item)));
    };

    const getSelectedItem = (itemId: number) => {
        return items.find((item) => item.id === itemId);
    };

    const getTotalAmount = () => {
        return purchaseItems.reduce((total, item) => {
            return total + item.quantity_ordered * item.unit_price;
        }, 0);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
        }).format(amount);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (purchaseItems.length === 0) {
            toast.error('Please add at least one item');
            return;
        }

        if (!data.supplier_id) {
            toast.error('Please select a supplier');
            return;
        }

        if (!data.akun_kas_id) {
            toast.error('Please select account (Akun Inventory/Beban)');
            return;
        }

        // Use Inertia router.post directly
        router.post(
            route('purchases.store'),
            {
                supplier_id: parseInt(data.supplier_id),
                purchase_date: data.purchase_date,
                expected_delivery_date: data.expected_delivery_date || null,
                akun_kas_id: parseInt(data.akun_kas_id),
                notes: data.notes || null,
                items: purchaseItems.map(item => ({
                    item_id: item.item_id,
                    quantity_ordered: parseFloat(item.quantity_ordered.toString()),
                    unit_price: parseFloat(item.unit_price.toString()),
                    notes: item.notes || null
                }))
            },
            {
                onSuccess: () => {
                    toast.success('Purchase order created successfully');
                },
                onError: (errors) => {
                    console.log('Validation errors:', errors);
                    if (errors.supplier_id) {
                        toast.error('Supplier: ' + errors.supplier_id);
                    } else if (errors.akun_kas_id) {
                        toast.error('Akun Inventory/Beban: ' + errors.akun_kas_id);
                    } else if (errors.items) {
                        toast.error('Items: ' + errors.items);
                    } else if (errors.purchase_date) {
                        toast.error('Purchase Date: ' + errors.purchase_date);
                    } else {
                        const firstError = Object.keys(errors)[0];
                        toast.error(`${firstError}: ${errors[firstError]}`);
                    }
                }
            }
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbItems}>
            <Head title="Create Purchase Order" />

            <div className="max-w-7xl p-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Buat Purchase Order</h1>
                            <p className="text-muted-foreground">Buat pesanan pembelian baru untuk item inventaris</p>
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
                            <CardDescription>Enter the basic information for the purchase order</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="supplier_id">Supplier *</Label>
                                    <SupplierSearchableDropdown
                                        value={data.supplier_id ? parseInt(data.supplier_id) : null}
                                        onValueChange={(value) => setData('supplier_id', value ? value.toString() : '')}
                                        placeholder="Pilih supplier..."
                                        error={!!errors.supplier_id}
                                        suppliers={suppliers.map((s) => ({ ...s, is_active: s.is_active ?? true }))}
                                        className={errors.supplier_id ? 'border-red-500' : ''}
                                    />
                                    {errors.supplier_id && <p className="text-sm text-red-500">{errors.supplier_id}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="akun_kas_id">Akun Inventory/Beban *</Label>
                                    <SearchableAccountSelect
                                        accounts={akunKas}
                                        value={data.akun_kas_id ? data.akun_kas_id.toString() : ''}
                                        onValueChange={(value) => setData('akun_kas_id', value ? value : '')}
                                        placeholder="Pilih akun inventory atau beban..."
                                    />
                                    {errors.akun_kas_id && <p className="text-sm text-red-500">{errors.akun_kas_id}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="purchase_date">Purchase Date *</Label>
                                    <Input
                                        type="date"
                                        value={data.purchase_date}
                                        onChange={(e) => setData('purchase_date', e.target.value)}
                                        className={errors.purchase_date ? 'border-red-500' : ''}
                                    />
                                    {errors.purchase_date && <p className="text-sm text-red-500">{errors.purchase_date}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="expected_delivery_date">Expected Delivery Date</Label>
                                    <Input
                                        type="date"
                                        value={data.expected_delivery_date}
                                        onChange={(e) => setData('expected_delivery_date', e.target.value)}
                                        className={errors.expected_delivery_date ? 'border-red-500' : ''}
                                    />
                                    {errors.expected_delivery_date && <p className="text-sm text-red-500">{errors.expected_delivery_date}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="Additional notes for this purchase order..."
                                    className={errors.notes ? 'border-red-500' : ''}
                                />
                                {errors.notes && <p className="text-sm text-red-500">{errors.notes}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Purchase Items */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Purchase Items</CardTitle>
                            <CardDescription>Add items to this purchase order</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Add Item Form */}
                            <div className="flex items-end gap-2">
                                <div className="flex-1">
                                    <Label htmlFor="item">Select Item</Label>
                                    <ItemSearchableDropdown
                                        value={selectedItemId}
                                        onValueChange={setSelectedItemId}
                                        placeholder="Pilih item untuk ditambahkan..."
                                        items={items.map((item) => ({ ...item, is_active: true }))}
                                        excludeIds={purchaseItems.map((pi) => pi.item_id)}
                                    />
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
                                                                onChange={(e) =>
                                                                    updateItem(
                                                                        purchaseItem.item_id,
                                                                        'quantity_ordered',
                                                                        parseFloat(e.target.value) || 0,
                                                                    )
                                                                }
                                                                className="w-24"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                value={purchaseItem.unit_price}
                                                                onChange={(e) =>
                                                                    updateItem(purchaseItem.item_id, 'unit_price', parseFloat(e.target.value) || 0)
                                                                }
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
                                        <div className="flex items-center justify-between">
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
                            <a href={route('purchases.index')}>Cancel</a>
                        </Button>
                        <Button type="submit" disabled={processing || purchaseItems.length === 0}>
                            {processing ? (
                                <>Processing...</>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Create Purchase Order
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
