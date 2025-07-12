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
        title: 'Buat Permintaan Baru',
        href: '/department-requests/create',
    },
];

interface Department {
    id: number;
    name: string;
    code: string;
    monthly_budget_limit: number;
}

interface InventoryItem {
    id: number;
    name: string;
    code: string;
    unit_of_measure: string;
    standard_cost: number;
    available_stock?: number; // Available for transfer requests
    category: {
        id: number;
        name: string;
    };
}

interface RequestItem {
    inventory_item_id: number;
    quantity: number;
    estimated_cost: number;
    notes?: string;
}

interface FormData {
    purpose: string;
    priority: 'low' | 'medium' | 'high';
    [key: string]: any;
}

interface CreateProps extends PageProps {
    department: Department;
    inventoryItems: InventoryItem[];
    departments: Department[];
    can_view_all_items?: boolean;
    can_view_all_departments?: boolean;
}

export default function DepartmentRequestCreate({ 
    department, 
    inventoryItems, 
    departments, 
    can_view_all_items, 
    can_view_all_departments 
}: CreateProps) {
    const [items, setItems] = useState<RequestItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<number | undefined>();
    const [requestType, setRequestType] = useState<'procurement' | 'transfer'>('procurement');
    const [targetDepartmentId, setTargetDepartmentId] = useState<number | undefined>();
    const [availableItems, setAvailableItems] = useState<InventoryItem[]>(inventoryItems);
    const [loadingItems, setLoadingItems] = useState<boolean>(false);
    const [quantity, setQuantity] = useState<number>(1);
    const [estimatedCost, setEstimatedCost] = useState<number>(0);
    const [notes, setNotes] = useState<string>('');
    const [purpose, setPurpose] = useState<string>('');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
    const [neededDate, setNeededDate] = useState<string>('');
    const [processing, setProcessing] = useState<boolean>(false);
    const [errors, setErrors] = useState<any>({});

    // Function to fetch items based on department and request type
    const fetchItemsByDepartment = async (deptId?: number, reqType: string = 'procurement') => {
        if (reqType === 'procurement') {
            setAvailableItems(inventoryItems);
            return;
        }

        if (!deptId) {
            setAvailableItems([]);
            return;
        }

        setLoadingItems(true);
        try {
            const response = await fetch(`/department-requests/api/items-by-department?department_id=${deptId}&request_type=${reqType}`);
            const data = await response.json();
            setAvailableItems(data.items || []);
        } catch (error) {
            console.error('Error fetching items:', error);
            setAvailableItems([]);
        } finally {
            setLoadingItems(false);
        }
    };

    // Effect to fetch items when request type or target department changes
    React.useEffect(() => {
        if (requestType === 'transfer' && targetDepartmentId) {
            fetchItemsByDepartment(targetDepartmentId, requestType);
        } else if (requestType === 'procurement') {
            setAvailableItems(inventoryItems);
        } else {
            setAvailableItems([]);
        }
        
        // Reset selected item when items change
        setSelectedItem(undefined);
        setEstimatedCost(0);
    }, [requestType, targetDepartmentId]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Helper function to get inventory item by ID
    const addItem = () => {
        if (!selectedItem || quantity <= 0 || estimatedCost <= 0) {
            return;
        }

        // Validate stock for transfer requests
        if (requestType === 'transfer') {
            const selectedItemData = getInventoryItemById(selectedItem);
            if (selectedItemData && selectedItemData.available_stock !== undefined) {
                if (quantity > selectedItemData.available_stock) {
                    alert(`Stok tidak mencukupi. Stok tersedia: ${selectedItemData.available_stock}`);
                    return;
                }
            }
        }

        const existingItemIndex = items.findIndex(item => item.inventory_item_id === selectedItem);
        
        if (existingItemIndex >= 0) {
            // Update existing item
            const updatedItems = [...items];
            updatedItems[existingItemIndex] = {
                ...updatedItems[existingItemIndex],
                quantity: updatedItems[existingItemIndex].quantity + quantity,
                estimated_cost: updatedItems[existingItemIndex].estimated_cost + estimatedCost,
                notes: notes || updatedItems[existingItemIndex].notes
            };
            setItems(updatedItems);
        } else {
            // Add new item
            const newItem: RequestItem = {
                inventory_item_id: selectedItem,
                quantity,
                estimated_cost: estimatedCost,
                notes: notes || undefined
            };
            setItems([...items, newItem]);
        }

        // Reset form
        setSelectedItem(undefined);
        setQuantity(1);
        setEstimatedCost(0);
        setNotes('');
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItemQuantity = (index: number, newQuantity: number) => {
        if (newQuantity <= 0) return;
        
        const updatedItems = [...items];
        const item = updatedItems[index];
        const unitCost = item.estimated_cost / item.quantity;
        
        updatedItems[index] = {
            ...item,
            quantity: newQuantity,
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
        
        const item = availableItems.find(i => i.id === id);
        if (item) {
            setEstimatedCost(item.standard_cost * quantity);
        }
    };

    const handleQuantityChange = (newQuantity: number) => {
        setQuantity(newQuantity);
        
        if (selectedItem) {
            const item = availableItems.find(i => i.id === selectedItem);
            if (item) {
                setEstimatedCost(item.standard_cost * newQuantity);
            }
        }
    };

    // Prepare inventory items options for combobox
    const inventoryItemOptions = availableItems.map(item => ({
        value: item.id.toString(),
        label: `${item.name} (${item.unit_of_measure})`,
        description: requestType === 'transfer' && item.available_stock !== undefined
            ? `${item.code} - ${item.category.name} - Stok: ${item.available_stock} - ${formatCurrency(item.standard_cost)}`
            : `${item.code} - ${item.category.name} - ${formatCurrency(item.standard_cost)}`
    }));

    const getInventoryItemById = (id: number) => {
        return availableItems.find(item => item.id === id);
    };

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

        if (requestType === 'transfer' && !targetDepartmentId) {
            alert('Mohon pilih departemen sumber untuk permintaan transfer');
            return;
        }

        setProcessing(true);
        setErrors({});

        // Transform items to match controller expectations
        const transformedItems = items.map(item => ({
            item_id: item.inventory_item_id,
            custom_item_name: null,
            description: item.notes || null,
            quantity_requested: item.quantity,
            estimated_cost: item.estimated_cost
        }));

        router.post('/department-requests', {
            department_id: department.id,
            request_type: requestType,
            target_department_id: targetDepartmentId,
            purpose,
            priority,
            needed_date: neededDate,
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
            <Head title="Buat Permintaan Baru" />
            
            <div className="p-4 space-y-6">
                {/* Department Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            Informasi Departemen
                            {!can_view_all_items && (
                                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                    Scope: Item Departemen
                                </Badge>
                            )}
                            {can_view_all_items && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    Scope: Semua Item
                                </Badge>
                            )}
                        </CardTitle>
                        <CardDescription>
                            Permintaan akan dibuat untuk departemen berikut.
                            {!can_view_all_items && (
                                <span className="text-orange-600 font-medium"> Item yang tersedia hanya dari departemen ini.</span>
                            )}
                            {can_view_all_items && (
                                <span className="text-green-600 font-medium"> Anda dapat memilih dari semua item inventory.</span>
                            )}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label className="text-sm font-medium">Kode Departemen</Label>
                                <div className="text-lg font-semibold">{department.code}</div>
                            </div>
                            <div>
                                <Label className="text-sm font-medium">Nama Departemen</Label>
                                <div className="text-lg font-semibold">{department.name}</div>
                            </div>
                            <div>
                                <Label className="text-sm font-medium">Limit Budget Bulanan</Label>
                                <div className="text-lg font-semibold text-green-600">
                                    {formatCurrency(department.monthly_budget_limit)}
                                </div>
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
                                Isi informasi umum permintaan barang
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="request_type">Jenis Permintaan</Label>
                                <Select value={requestType} onValueChange={(value: 'procurement' | 'transfer') => {
                                    setRequestType(value);
                                    if (value === 'procurement') {
                                        setTargetDepartmentId(undefined);
                                    }
                                }}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih jenis permintaan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="procurement">Pengadaan Barang Baru</SelectItem>
                                        <SelectItem value="transfer">Transfer dari Departemen Lain</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="mt-2 text-sm text-gray-600">
                                    {requestType === 'procurement' ? 
                                        'Membeli atau mengadakan barang baru dari supplier' : 
                                        'Meminta transfer barang dari departemen lain'
                                    }
                                </div>
                                {errors.request_type && (
                                    <p className="text-sm text-red-600 mt-1">{errors.request_type}</p>
                                )}
                            </div>

                            {requestType === 'transfer' && (
                                <div>
                                    <Label htmlFor="target_department">Dari Departemen</Label>
                                    <Select value={targetDepartmentId?.toString() || ''} onValueChange={(value) => setTargetDepartmentId(parseInt(value))}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih departemen sumber" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {departments.map((dept) => (
                                                <SelectItem key={dept.id} value={dept.id.toString()}>
                                                    {dept.name} ({dept.code})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <div className="mt-1 text-sm text-gray-600">
                                        Pilih departemen yang memiliki stok barang yang ingin diminta
                                    </div>
                                    {errors.target_department_id && (
                                        <p className="text-sm text-red-600 mt-1">{errors.target_department_id}</p>
                                    )}
                                </div>
                            )}

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
                                    {loadingItems ? (
                                        <div className="flex items-center space-x-2 h-10 px-3 border rounded-md bg-gray-50">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                                            <span className="text-sm text-gray-600">Memuat item...</span>
                                        </div>
                                    ) : (
                                        <Combobox
                                            options={inventoryItemOptions}
                                            value={selectedItem?.toString() || ''}
                                            onValueChange={handleItemSelect}
                                            placeholder="Pilih barang..."
                                            searchPlaceholder="Cari barang..."
                                            emptyText="Barang tidak ditemukan"
                                            className="w-full"
                                        />
                                    )}
                                    {selectedItem && requestType === 'transfer' && (
                                        <div className="mt-1 text-sm">
                                            {(() => {
                                                const item = getInventoryItemById(selectedItem);
                                                if (item && item.available_stock !== undefined) {
                                                    return (
                                                        <span className="text-blue-600">
                                                            Stok tersedia: {item.available_stock} {item.unit_of_measure}
                                                        </span>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </div>
                                    )}
                                </div>
                                
                                <div>
                                    <Label htmlFor="quantity">Jumlah</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        max={(() => {
                                            if (requestType === 'transfer' && selectedItem) {
                                                const item = getInventoryItemById(selectedItem);
                                                return item?.available_stock || undefined;
                                            }
                                            return undefined;
                                        })()}
                                        value={quantity}
                                        onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                                    />
                                    {requestType === 'transfer' && selectedItem && (() => {
                                        const item = getInventoryItemById(selectedItem);
                                        if (item?.available_stock !== undefined && quantity > item.available_stock) {
                                            return (
                                                <div className="text-sm text-red-600 mt-1">
                                                    Jumlah melebihi stok tersedia ({item.available_stock})
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}
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
                                    <Button 
                                        type="button" 
                                        onClick={addItem} 
                                        disabled={
                                            !selectedItem || 
                                            quantity <= 0 || 
                                            estimatedCost <= 0 ||
                                            (requestType === 'transfer' && (() => {
                                                const item = getInventoryItemById(selectedItem);
                                                return item?.available_stock !== undefined && quantity > item.available_stock;
                                            })())
                                        }
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Tambah
                                    </Button>
                                </div>
                            </div>
                            
                            <div>
                                <Label htmlFor="notes">Catatan (Opsional)</Label>
                                <Input
                                    placeholder="Catatan untuk item ini..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
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
                                                <TableHead>Catatan</TableHead>
                                                <TableHead>Aksi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {items.map((item, index) => {
                                                const inventoryItem = getInventoryItemById(item.inventory_item_id);
                                                return (
                                                    <TableRow key={index}>
                                                        <TableCell>
                                                            <div>
                                                                <div className="font-medium">{inventoryItem?.name}</div>
                                                                <div className="text-sm text-muted-foreground">
                                                                    {inventoryItem?.code}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline">
                                                                {inventoryItem?.category.name}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                value={item.quantity}
                                                                onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 1)}
                                                                className="w-20"
                                                            />
                                                            <div className="text-xs text-muted-foreground mt-1">
                                                                {inventoryItem?.unit_of_measure}
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
                                                            <div className="truncate" title={item.notes}>
                                                                {item.notes || '-'}
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
                                        {getTotalEstimatedCost() > department.monthly_budget_limit && (
                                            <div className="text-sm text-red-600 mt-2">
                                                ⚠️ Total melebihi limit budget bulanan departemen
                                            </div>
                                        )}
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
                            {processing ? 'Menyimpan...' : 'Simpan Permintaan'}
                        </Button>
                        
                        <Button type="button" variant="outline" asChild>
                            <a href="/department-requests">
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
