import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DepartmentSearchableDropdown } from '@/components/ui/department-searchable-dropdown';
import { ItemSearchableDropdown } from '@/components/ui/item-searchable-dropdown';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, PageProps } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Home, Package, Plus, Save, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/lib/toast';
import { route } from 'ziggy-js';

interface Item {
    id: number;
    code: string;
    name: string;
    unit_of_measure: string;
    reorder_level?: number;
    safety_stock?: number;
    central_stock: {
        quantity_on_hand: number;
        available_quantity: number;
        average_unit_cost: number;
    } | null;
}

interface Department {
    id: number;
    name: string;
    is_active?: boolean;
}

interface ItemRow {
    item_id: number;
    quantity: number;
    notes: string;
}

interface Props extends PageProps {
    departments: Department[];
    items: Item[];
}

const breadcrumbItems: BreadcrumbItem[] = [
    { title: <Package className="h-4 w-4" />, href: '#' },
    { title: 'Permintaan Stok', href: route('stock-requests.index') },
    { title: 'Buat Permintaan Stok', href: '' },
];

export default function create() {
    const { departments, items } = usePage<Props>().props;

    const [formData, setFormData] = useState({
        department_id: null as number | null,
        priority: 'normal',
        notes: '',
    });

    const [itemRows, setItemRows] = useState<ItemRow[]>([
        {
            item_id: 0,
            quantity: 0,
            notes: '',
        },
    ]);

    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<any>({});

    const addItemRow = () => {
        setItemRows([
            ...itemRows,
            {
                item_id: 0,
                quantity: 0,
                notes: '',
            },
        ]);
    };

    const removeItemRow = (index: number) => {
        if (itemRows.length > 1) {
            const newRows = itemRows.filter((_, i) => i !== index);
            setItemRows(newRows);
        }
    };

    const updateItemRow = (index: number, field: keyof ItemRow, value: any) => {
        const newRows = [...itemRows];
        newRows[index] = { ...newRows[index], [field]: value };
        setItemRows(newRows);
    };

    const getSelectedItem = (itemId: number): Item | undefined => {
        return items.find((item) => item.id === itemId);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate items
        const validItems = itemRows.filter((row) => row.item_id > 0 && row.quantity > 0);

        if (validItems.length === 0) {
            toast.error('Tambahkan minimal 1 item dengan jumlah > 0');
            return;
        }

        // Transform items to match backend expectation
        const transformedItems = validItems.map((item) => ({
            item_id: item.item_id,
            quantity_requested: item.quantity,
            notes: item.notes,
        }));

        setProcessing(true);
        router.post(
            route('stock-requests.store'),
            {
                ...formData,
                items: transformedItems,
            } as any,
            {
                onError: (errors) => {
                    setErrors(errors);
                    toast.error(errors?.message || 'Gagal membuat permintaan stok');
                },
                onFinish: () => setProcessing(false),
            }
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbItems}>
            <Head title="Buat Permintaan Stok" />

            <div className="p-4 space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Request Information Card */}
                    <Card>
                        <CardHeader>
                            <div className='flex items-center gap-2'>
                                <div>
                                    <Button type="button" variant="outline" onClick={() => window.history.back()} className="gap-2">
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Package className="h-5 w-5" />
                                        Buat Permintaan Stok Baru
                                    </CardTitle>
                                    <CardDescription>
                                        Isi detail permintaan stok Anda dan tambahkan item yang diperlukan
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="department_id">
                                        Departemen <span className="text-red-500">*</span>
                                    </Label>
                                    <DepartmentSearchableDropdown
                                        value={formData.department_id}
                                        onValueChange={(value) =>
                                            setFormData({ ...formData, department_id: value })
                                        }
                                        departments={departments.map((d: any) => ({ 
                                            ...d, 
                                            is_active: d.is_active ?? true 
                                        }))}
                                        placeholder="Pilih departemen"
                                    />
                                    {errors.department_id && (
                                        <p className="text-sm text-red-600">
                                            {errors.department_id}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="priority">
                                        Prioritas <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={formData.priority}
                                        onValueChange={(value) =>
                                            setFormData({ ...formData, priority: value })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Rendah</SelectItem>
                                            <SelectItem value="normal">Normal</SelectItem>
                                            <SelectItem value="high">Tinggi</SelectItem>
                                            <SelectItem value="urgent">Mendesak</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.priority && (
                                        <p className="text-sm text-red-600">{errors.priority}</p>
                                    )}
                                </div>

                                <div className="md:col-span-2 space-y-2">
                                    <Label htmlFor="notes">Catatan</Label>
                                    <Textarea
                                        id="notes"
                                        value={formData.notes}
                                        onChange={(e) =>
                                            setFormData({ ...formData, notes: e.target.value })
                                        }
                                        rows={3}
                                        placeholder="Catatan tambahan atau permintaan khusus..."
                                        className="resize-none"
                                    />
                                    {errors.notes && (
                                        <p className="text-sm text-red-600">{errors.notes}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Request Items Card */}
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Item Permintaan</CardTitle>
                                    <CardDescription>
                                        Tambahkan item ke permintaan stok Anda
                                    </CardDescription>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addItemRow}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Tambah Item
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg overflow-hidden">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/50">
                                                <TableHead className="w-[350px]">
                                                    Item <span className="text-red-500">*</span>
                                                </TableHead>
                                                <TableHead className="w-[100px]">Satuan</TableHead>
                                                <TableHead className="w-[120px] text-right">
                                                    Stok Pusat
                                                </TableHead>
                                                <TableHead className="w-[150px]">
                                                    Jumlah <span className="text-red-500">*</span>
                                                </TableHead>
                                                <TableHead>Catatan</TableHead>
                                                <TableHead className="w-[80px] text-center">
                                                    Aksi
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {itemRows.map((row, index) => {
                                                const selectedItem = getSelectedItem(row.item_id);
                                                const availableQty = selectedItem?.central_stock?.available_quantity ?? null;
                                                const isOutOfStock = availableQty !== null && availableQty === 0;
                                                const isLowStock = availableQty !== null && 
                                                    availableQty > 0 && 
                                                    availableQty < (selectedItem?.reorder_level || 0);

                                                return (
                                                    <TableRow key={index}>
                                                        <TableCell>
                                                            <ItemSearchableDropdown
                                                                value={row.item_id > 0 ? row.item_id : null}
                                                                onValueChange={(value) =>
                                                                    updateItemRow(
                                                                        index,
                                                                        'item_id',
                                                                        value || 0
                                                                    )
                                                                }
                                                                items={items}
                                                                placeholder="Cari dan pilih item..."
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="text-sm font-medium">
                                                                {selectedItem ? selectedItem.unit_of_measure : '-'}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {selectedItem && selectedItem.central_stock && selectedItem.central_stock.available_quantity !== undefined ? (
                                                                <div className="space-y-1">
                                                                    <div className="font-semibold text-sm">
                                                                        {selectedItem.central_stock.available_quantity.toLocaleString()}
                                                                    </div>
                                                                    {isOutOfStock && (
                                                                        <Badge variant="destructive" className="text-xs">
                                                                            Stok Habis
                                                                        </Badge>
                                                                    )}
                                                                    {isLowStock && (
                                                                        <Badge variant="secondary" className="text-xs">
                                                                            Stok Rendah
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            ) : selectedItem ? (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    Tidak Ada Data Stok
                                                                </Badge>
                                                            ) : (
                                                                <span className="text-gray-400">-</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                value={row.quantity || ''}
                                                                onChange={(e) =>
                                                                    updateItemRow(
                                                                        index,
                                                                        'quantity',
                                                                        parseFloat(e.target.value) || 0
                                                                    )
                                                                }
                                                                placeholder="0.00"
                                                                className="text-right"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="text"
                                                                value={row.notes}
                                                                onChange={(e) =>
                                                                    updateItemRow(
                                                                        index,
                                                                        'notes',
                                                                        e.target.value
                                                                    )
                                                                }
                                                                placeholder="Catatan item..."
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeItemRow(index)}
                                                                disabled={itemRows.length === 1}
                                                                className="h-8 w-8 p-0"
                                                            >
                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            {errors.items && (
                                <p className="text-sm text-red-600 mt-2">{errors.items}</p>
                            )}

                            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    <strong>Catatan:</strong> Semua item akan diminta dari gudang pusat. 
                                    Pastikan untuk mengecek stok tersedia sebelum mengirim permintaan Anda.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Form Actions */}
                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit(route('stock-requests.index'))}
                            disabled={processing}
                        >
                            Batal
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={processing}
                            className="min-w-[150px]"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {processing ? 'Membuat...' : 'Buat Permintaan'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
