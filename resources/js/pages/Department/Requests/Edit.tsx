import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Combobox } from '@/components/ui/combobox';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { PageProps, BreadcrumbItem } from '@/types';

interface Department {
    id: number;
    name: string;
    code: string;
}

interface User {
    id: number;
    name: string;
    nip: string;
}

interface InventoryItem {
    id: number;
    name: string;
    code: string;
    unit_of_measure: string;
    standard_cost: number;
    category: {
        id: number;
        name: string;
    };
}

interface RequestItem {
    id: number;
    item_id?: number;
    custom_item_name?: string;
    description?: string;
    quantity_requested: number;
    estimated_cost: number;
    inventory_item?: InventoryItem;
}

interface DepartmentRequest {
    id: number;
    request_number: string;
    department: Department;
    requested_by: User;
    purpose: string;
    status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'fulfilled';
    priority: 'low' | 'medium' | 'high';
    needed_date: string;
    notes?: string;
    items: RequestItem[];
    total_estimated_cost: number;
    created_at: string;
}

interface EditProps extends PageProps {
    request: DepartmentRequest;
    inventoryItems: InventoryItem[];
}

export default function DepartmentRequestEdit({ request, inventoryItems }: EditProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Permintaan Departemen',
            href: '/department-requests',
        },
        {
            title: request.request_number,
            href: `/department-requests/${request.id}`,
        },
        {
            title: 'Edit',
            href: `/department-requests/${request.id}/edit`,
        },
    ];

    const [items, setItems] = useState<RequestItem[]>(request.items || []);
    const [selectedItem, setSelectedItem] = useState<number | undefined>();
    const [quantity, setQuantity] = useState<number>(1);
    const [estimatedCost, setEstimatedCost] = useState<number>(0);
    const [description, setDescription] = useState<string>('');
    const [purpose, setPurpose] = useState<string>(request.purpose || '');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(request.priority || 'medium');
    const [neededDate, setNeededDate] = useState<string>(request.needed_date || '');
    const [notes, setNotes] = useState<string>(request.notes || '');
    const [processing, setProcessing] = useState<boolean>(false);
    const [errors, setErrors] = useState<any>({});

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const addItem = () => {
        if (!selectedItem || quantity <= 0 || estimatedCost <= 0) {
            return;
        }

        const existingItemIndex = items.findIndex(item => item.item_id === selectedItem);
        
        if (existingItemIndex >= 0) {
            // Update existing item
            const updatedItems = [...items];
            updatedItems[existingItemIndex] = {
                ...updatedItems[existingItemIndex],
                quantity_requested: updatedItems[existingItemIndex].quantity_requested + quantity,
                estimated_cost: updatedItems[existingItemIndex].estimated_cost + estimatedCost,
                description: description || updatedItems[existingItemIndex].description
            };
            setItems(updatedItems);
        } else {
            // Add new item
            const newItem: RequestItem = {
                id: Date.now(), // Temporary ID for new items
                item_id: selectedItem,
                quantity_requested: quantity,
                estimated_cost: estimatedCost,
                description: description || undefined,
                inventory_item: inventoryItems.find(i => i.id === selectedItem)
            };
            setItems([...items, newItem]);
        }

        // Reset form
        setSelectedItem(undefined);
        setQuantity(1);
        setEstimatedCost(0);
        setDescription('');
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItemQuantity = (index: number, newQuantity: number) => {
        if (newQuantity <= 0) return;
        
        const updatedItems = [...items];
        const item = updatedItems[index];
        const unitCost = item.estimated_cost / item.quantity_requested;
        
        updatedItems[index] = {
            ...item,
            quantity_requested: newQuantity,
            estimated_cost: unitCost * newQuantity
        };
        
        setItems(updatedItems);
    };

    const updateItemCost = (index: number, newCost: number) => {
        if (newCost < 0) return;
        
        const updatedItems = [...items];
        updatedItems[index] = {
            ...updatedItems[index],
            estimated_cost: newCost
        };
        
        setItems(updatedItems);
    };

    const handleItemSelect = (itemId: string) => {
        const id = parseInt(itemId);
        setSelectedItem(id);
        
        const item = inventoryItems.find(i => i.id === id);
        if (item) {
            setEstimatedCost(item.standard_cost * quantity);
        }
    };

    const handleQuantityChange = (newQuantity: number) => {
        setQuantity(newQuantity);
        
        if (selectedItem) {
            const item = inventoryItems.find(i => i.id === selectedItem);
            if (item) {
                setEstimatedCost(item.standard_cost * newQuantity);
            }
        }
    };

    // Prepare inventory items options for combobox
    const inventoryItemOptions = inventoryItems.map(item => ({
        value: item.id.toString(),
        label: `${item.name} (${item.unit_of_measure})`,
        description: `${item.code} - ${item.category.name} - ${formatCurrency(item.standard_cost)}`
    }));

    const getTotalEstimatedCost = () => {
        return items.reduce((total, item) => total + item.estimated_cost, 0);
    };

    const getPriorityBadge = (priority: string) => {
        const badges = {
            low: <Badge variant="outline" className="text-blue-600">Rendah</Badge>,
            medium: <Badge variant="outline" className="text-yellow-600">Sedang</Badge>,
            high: <Badge variant="outline" className="text-red-600">Tinggi</Badge>
        };
        return badges[priority as keyof typeof badges];
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (items.length === 0) {
            alert('Mohon tambahkan minimal satu item');
            return;
        }

        setProcessing(true);
        setErrors({});

        // Transform items to match controller expectations
        const transformedItems = items.map(item => ({
            id: item.id > 1000000 ? undefined : item.id, // New items have temp ID > 1000000
            item_id: item.item_id,
            custom_item_name: item.custom_item_name || null,
            description: item.description || null,
            quantity_requested: item.quantity_requested,
            estimated_cost: item.estimated_cost
        }));

        router.put(`/department-requests/${request.id}`, {
            purpose,
            priority,
            needed_date: neededDate,
            notes,
            items: transformedItems
        }, {
            onSuccess: () => {
                setProcessing(false);
            },
            onError: (errors) => {
                setProcessing(false);
                setErrors(errors);
            }
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${request.request_number}`} />
            
            <div className="p-4 space-y-6">
                {/* Request Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Informasi Permintaan</CardTitle>
                        <CardDescription>
                            Edit permintaan barang departemen
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label className="text-sm font-medium">Nomor Permintaan</Label>
                                <div className="text-lg font-semibold">{request.request_number}</div>
                            </div>
                            <div>
                                <Label className="text-sm font-medium">Departemen</Label>
                                <div className="text-lg font-semibold">{request.department.name}</div>
                                <div className="text-sm text-muted-foreground">{request.department.code}</div>
                            </div>
                            <div>
                                <Label className="text-sm font-medium">Pemohon</Label>
                                <div className="text-lg font-semibold">{request.requested_by.name}</div>
                                <div className="text-sm text-muted-foreground">{request.requested_by.nip}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Request Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Detail Permintaan</CardTitle>
                            <CardDescription>
                                Edit informasi umum permintaan barang
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="purpose">Tujuan Permintaan</Label>
                                <Textarea
                                    id="purpose"
                                    placeholder="Jelaskan tujuan atau alasan permintaan barang..."
                                    value={purpose}
                                    onChange={(e) => setPurpose(e.target.value)}
                                    rows={3}
                                />
                                {errors.purpose && (
                                    <p className="text-sm text-red-600 mt-1">{errors.purpose}</p>
                                )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="priority">Prioritas</Label>
                                    <Select value={priority} onValueChange={(value: 'low' | 'medium' | 'high') => setPriority(value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih prioritas" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Rendah</SelectItem>
                                            <SelectItem value="medium">Sedang</SelectItem>
                                            <SelectItem value="high">Tinggi</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <div className="mt-2">
                                        {getPriorityBadge(priority)}
                                    </div>
                                    {errors.priority && (
                                        <p className="text-sm text-red-600 mt-1">{errors.priority}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="needed_date">Tanggal Dibutuhkan</Label>
                                    <Input
                                        id="needed_date"
                                        type="date"
                                        value={neededDate}
                                        onChange={(e) => setNeededDate(e.target.value)}
                                    />
                                    {errors.needed_date && (
                                        <p className="text-sm text-red-600 mt-1">{errors.needed_date}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="notes">Catatan (Opsional)</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Catatan tambahan..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Add Items */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Tambah Item</CardTitle>
                            <CardDescription>
                                Pilih barang yang ingin diminta
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                                <div className="lg:col-span-2">
                                    <Label htmlFor="item">Barang</Label>
                                    <Combobox
                                        options={inventoryItemOptions}
                                        value={selectedItem?.toString() || ''}
                                        onValueChange={handleItemSelect}
                                        placeholder="Pilih barang..."
                                        searchPlaceholder="Cari barang..."
                                        emptyText="Barang tidak ditemukan"
                                        className="w-full"
                                    />
                                </div>
                                
                                <div>
                                    <Label htmlFor="quantity">Jumlah</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={quantity}
                                        onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                                    />
                                </div>
                                
                                <div>
                                    <Label htmlFor="estimated_cost">Estimasi Biaya</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={estimatedCost}
                                        onChange={(e) => setEstimatedCost(parseInt(e.target.value) || 0)}
                                    />
                                </div>
                                
                                <div className="flex items-end">
                                    <Button type="button" onClick={addItem} disabled={!selectedItem}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Tambah
                                    </Button>
                                </div>
                            </div>
                            
                            <div>
                                <Label htmlFor="description">Deskripsi (Opsional)</Label>
                                <Input
                                    placeholder="Deskripsi untuk item ini..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Items List */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Daftar Item ({items.length})</CardTitle>
                            <CardDescription>
                                Item yang akan diminta
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {items.length > 0 ? (
                                <>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Barang</TableHead>
                                                <TableHead>Kategori</TableHead>
                                                <TableHead>Jumlah</TableHead>
                                                <TableHead>Estimasi Biaya</TableHead>
                                                <TableHead>Deskripsi</TableHead>
                                                <TableHead>Aksi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {items.map((item, index) => {
                                                return (
                                                    <TableRow key={item.id}>
                                                        <TableCell>
                                                            <div>
                                                                <div className="font-medium">
                                                                    {item.inventory_item?.name || item.custom_item_name}
                                                                </div>
                                                                <div className="text-sm text-muted-foreground">
                                                                    {item.inventory_item?.code}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {item.inventory_item && (
                                                                <Badge variant="outline">
                                                                    {item.inventory_item.category.name}
                                                                </Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                value={item.quantity_requested}
                                                                onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 1)}
                                                                className="w-20"
                                                            />
                                                            <div className="text-xs text-muted-foreground mt-1">
                                                                {item.inventory_item?.unit_of_measure}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                value={item.estimated_cost}
                                                                onChange={(e) => updateItemCost(index, parseInt(e.target.value) || 0)}
                                                                className="w-32"
                                                            />
                                                            <div className="text-xs text-muted-foreground mt-1">
                                                                {formatCurrency(item.estimated_cost)}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="max-w-xs">
                                                            <div className="truncate" title={item.description}>
                                                                {item.description || '-'}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button
                                                                type="button"
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => removeItem(index)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                    
                                    <div className="mt-4 p-4 bg-muted rounded-lg">
                                        <div className="flex justify-between items-center text-lg font-semibold">
                                            <span>Total Estimasi Biaya:</span>
                                            <span className="text-green-600">
                                                {formatCurrency(getTotalEstimatedCost())}
                                            </span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    Belum ada item yang ditambahkan
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Submit */}
                    <div className="flex gap-4">
                        <Button type="submit" disabled={processing || items.length === 0}>
                            <Save className="h-4 w-4 mr-2" />
                            {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </Button>
                        
                        <Button type="button" variant="outline" asChild>
                            <a href={`/department-requests/${request.id}`}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Kembali
                            </a>
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
