import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DepartmentSearchableDropdown } from '@/components/ui/department-searchable-dropdown';
import { Input } from '@/components/ui/input';
import { ItemSearchableDropdown } from '@/components/ui/item-searchable-dropdown';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, PageProps } from '@/types';
import { Head, router, usePage, useForm } from '@inertiajs/react';
import { ArrowLeft, Plus, Save, Trash2, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

interface Department {
    id: number;
    name: string;
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

interface RequisitionItem {
    item_id: number;
    quantity_requested: number;
    estimated_unit_price: number;
    notes?: string;
}

interface ExistingRequisitionItem {
    id: number;
    item_id: number;
    quantity_requested: number;
    estimated_unit_price: number;
    notes?: string;
    item: Item;
}

interface Requisition {
    id: number;
    requisition_number: string;
    request_date: string;
    required_date: string;
    status: string;
    notes?: string;
    department: {
        id: number;
        name: string;
    };
    items: ExistingRequisitionItem[];
}

interface Props extends PageProps {
    requisition: Requisition;
    departments: Department[];
    items: Item[];
}

const breadcrumbItems = (requisition: Requisition): BreadcrumbItem[] => [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Inventory', href: '/inventory' },
    { title: 'Requisitions', href: route('requisitions.index') },
    { title: requisition.requisition_number, href: route('requisitions.show', requisition.id) },
    { title: 'Edit', href: '' },
];

export default function RequisitionEdit() {
    const { requisition, departments, items } = usePage<Props>().props;
    const [requisitionItems, setRequisitionItems] = useState<RequisitionItem[]>([]);
    const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
    
    const { data, setData, put, processing, errors } = useForm({
        department_id: requisition.department.id.toString(),
        request_date: requisition.request_date,
        required_date: requisition.required_date,
        notes: requisition.notes || '',
    });

    // Initialize items from existing requisition
    useEffect(() => {
        const initialItems = requisition.items.map(item => ({
            item_id: item.item_id,
            quantity_requested: item.quantity_requested,
            estimated_unit_price: item.estimated_unit_price,
            notes: item.notes || '',
        }));
        setRequisitionItems(initialItems);
    }, [requisition.items]);

    const addItem = () => {
        if (!selectedItemId) {
            toast.error('Please select an item');
            return;
        }

        const itemExists = requisitionItems.find((item) => item.item_id === selectedItemId);
        if (itemExists) {
            toast.error('Item already added');
            return;
        }

        const newItem: RequisitionItem = {
            item_id: selectedItemId,
            quantity_requested: 1,
            estimated_unit_price: 0,
            notes: '',
        };

        setRequisitionItems([...requisitionItems, newItem]);
        setSelectedItemId(null);
    };

    const removeItem = (itemId: number) => {
        setRequisitionItems(requisitionItems.filter((item) => item.item_id !== itemId));
    };

    const updateItem = (itemId: number, field: keyof RequisitionItem, value: any) => {
        setRequisitionItems(
            requisitionItems.map((item) =>
                item.item_id === itemId ? { ...item, [field]: value } : item
            )
        );
    };

    const getItemById = (itemId: number) => {
        return items.find((item) => item.id === itemId);
    };

    const calculateTotal = () => {
        return requisitionItems.reduce(
            (total, item) => total + (item.quantity_requested * item.estimated_unit_price),
            0
        );
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (requisitionItems.length === 0) {
            toast.error('Please add at least one item');
            return;
        }

        const formData = {
            ...data,
            items: requisitionItems,
        };

        router.put(route('requisitions.update', requisition.id), formData as any, {
            onSuccess: () => {
                toast.success('Requisition updated successfully');
            },
            onError: (errors) => {
                console.error('Validation errors:', errors);
                toast.error('Please check your input');
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbItems(requisition)}>
            <Head title={`Edit Requisition ${requisition.requisition_number}`} />

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Header */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Edit Requisition
                                </CardTitle>
                                <CardDescription>
                                    {requisition.requisition_number}
                                </CardDescription>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.get(route('requisitions.show', requisition.id))}
                                className="gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Details
                            </Button>
                        </div>
                    </CardHeader>
                </Card>

                {/* Basic Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                        <CardDescription>
                            Update the basic details for the requisition
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="department_id">Department <span className="text-destructive">*</span></Label>
                                <DepartmentSearchableDropdown
                                    value={data.department_id ? parseInt(data.department_id) : null}
                                    onValueChange={(value) => setData('department_id', value?.toString() || '')}
                                    placeholder="Select department"
                                />
                                {errors.department_id && (
                                    <p className="text-sm text-destructive">{errors.department_id}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="request_date">Request Date <span className="text-destructive">*</span></Label>
                                <Input
                                    id="request_date"
                                    type="date"
                                    value={data.request_date}
                                    onChange={(e) => setData('request_date', e.target.value)}
                                    required
                                />
                                {errors.request_date && (
                                    <p className="text-sm text-destructive">{errors.request_date}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="required_date">Required Date <span className="text-destructive">*</span></Label>
                                <Input
                                    id="required_date"
                                    type="date"
                                    value={data.required_date}
                                    onChange={(e) => setData('required_date', e.target.value)}
                                    min={data.request_date}
                                    required
                                />
                                {errors.required_date && (
                                    <p className="text-sm text-destructive">{errors.required_date}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                placeholder="Enter any additional notes or special requirements..."
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                rows={3}
                            />
                            {errors.notes && (
                                <p className="text-sm text-destructive">{errors.notes}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Items */}
                <Card>
                    <CardHeader>
                        <CardTitle>Requisition Items</CardTitle>
                        <CardDescription>
                            Update items for the requisition
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Add Item Row */}
                        <div className="flex gap-2 p-4 border rounded-lg bg-muted/50">
                            <div className="flex-1">
                                <ItemSearchableDropdown
                                    value={selectedItemId}
                                    onValueChange={setSelectedItemId}
                                    placeholder="Select item to add..."
                                />
                            </div>
                            <Button type="button" onClick={addItem} className="gap-2">
                                <Plus className="h-4 w-4" />
                                Add Item
                            </Button>
                        </div>

                        {/* Items Table */}
                        {requisitionItems.length > 0 && (
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Item Code</TableHead>
                                            <TableHead>Item Name</TableHead>
                                            <TableHead>Unit</TableHead>
                                            <TableHead>Qty Requested</TableHead>
                                            <TableHead>Est. Unit Price</TableHead>
                                            <TableHead>Total</TableHead>
                                            <TableHead>Notes</TableHead>
                                            <TableHead className="w-20">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {requisitionItems.map((requisitionItem) => {
                                            const item = getItemById(requisitionItem.item_id);
                                            return (
                                                <TableRow key={requisitionItem.item_id}>
                                                    <TableCell className="font-mono">
                                                        {item?.code}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium">{item?.name}</div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">
                                                            {item?.unit_of_measure}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            step="1"
                                                            value={requisitionItem.quantity_requested}
                                                            onChange={(e) =>
                                                                updateItem(
                                                                    requisitionItem.item_id,
                                                                    'quantity_requested',
                                                                    parseInt(e.target.value) || 0
                                                                )
                                                            }
                                                            className="w-20"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={requisitionItem.estimated_unit_price}
                                                            onChange={(e) =>
                                                                updateItem(
                                                                    requisitionItem.item_id,
                                                                    'estimated_unit_price',
                                                                    parseFloat(e.target.value) || 0
                                                                )
                                                            }
                                                            className="w-32"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        {formatCurrency(
                                                            requisitionItem.quantity_requested * requisitionItem.estimated_unit_price
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            placeholder="Notes..."
                                                            value={requisitionItem.notes || ''}
                                                            onChange={(e) =>
                                                                updateItem(
                                                                    requisitionItem.item_id,
                                                                    'notes',
                                                                    e.target.value
                                                                )
                                                            }
                                                            className="w-32"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeItem(requisitionItem.item_id)}
                                                            className="text-destructive hover:text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>

                                {/* Total */}
                                <div className="border-t bg-muted/50 p-4">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium">Total Estimated Cost:</span>
                                        <span className="text-lg font-bold">
                                            {formatCurrency(calculateTotal())}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {requisitionItems.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                No items added yet. Use the dropdown above to add items to this requisition.
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Submit Actions */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex gap-2 justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.get(route('requisitions.show', requisition.id))}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing || requisitionItems.length === 0}
                                className="gap-2"
                            >
                                <Save className="h-4 w-4" />
                                {processing ? 'Updating...' : 'Update Requisition'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </AppLayout>
    );
}
