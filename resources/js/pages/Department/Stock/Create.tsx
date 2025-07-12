import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { ArrowLeft, Save, Package } from 'lucide-react';
import { PageProps as InertiaPageProps } from '@inertiajs/core';

interface Department {
    id: number;
    name: string;
    code: string;
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

interface PageProps extends InertiaPageProps {
    department: Department;
    inventoryItems: InventoryItem[];
}

export default function Create() {
    const { department, inventoryItems } = usePage<PageProps>().props;
    const [selectedItemId, setSelectedItemId] = useState<number | undefined>();
    const [currentStock, setCurrentStock] = useState<number>(0);
    const [minimumStock, setMinimumStock] = useState<number>(0);
    const [maximumStock, setMaximumStock] = useState<number>(0);
    const [averageCost, setAverageCost] = useState<number>(0);
    const [locationCode, setLocationCode] = useState<string>('');
    const [rackPosition, setRackPosition] = useState<string>('');
    const [notes, setNotes] = useState<string>('');
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

    // Prepare inventory items options for combobox
    const inventoryItemOptions = inventoryItems.map(item => ({
        value: item.id.toString(),
        label: `${item.name} (${item.unit_of_measure})`,
        description: `${item.code} - ${item.category.name} - ${formatCurrency(item.standard_cost)}`
    }));

    const getSelectedItem = () => {
        return inventoryItems.find(item => item.id === selectedItemId);
    };

    const handleItemSelect = (itemId: string) => {
        const id = parseInt(itemId);
        setSelectedItemId(id);
        
        const item = inventoryItems.find(i => i.id === id);
        if (item) {
            setAverageCost(item.standard_cost);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedItemId) {
            alert('Mohon pilih item inventory');
            return;
        }

        if (currentStock < 0 || minimumStock < 0 || maximumStock < minimumStock) {
            alert('Pastikan nilai stok valid');
            return;
        }

        setProcessing(true);
        setErrors({});

        router.post('/department-stock', {
            department_id: department.id,
            inventory_item_id: selectedItemId,
            current_stock: currentStock,
            minimum_stock: minimumStock,
            maximum_stock: maximumStock,
            average_cost: averageCost,
            location_code: locationCode || null,
            rack_position: rackPosition || null,
            notes: notes || null
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

    const getTotalValue = () => {
        return currentStock * averageCost;
    };

    return (
        <AppLayout>
            <Head title={`Tambah Stok - ${department.name}`} />
            
            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-4 mb-4">
                            <Button variant="outline" asChild>
                                <Link href={`/department-stock?department_id=${department.id}`}>
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Kembali
                                </Link>
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold">Tambah Item Stok</h1>
                                <p className="text-gray-600">Tambah item inventory ke {department.name}</p>
                            </div>
                        </div>
                    </div>

                    {/* Department Info */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Informasi Departemen</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium">Kode Departemen</Label>
                                    <div className="text-lg font-semibold">{department.code}</div>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Nama Departemen</Label>
                                    <div className="text-lg font-semibold">{department.name}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Item Selection */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Pilih Item Inventory</CardTitle>
                                <CardDescription>
                                    Pilih item dari master inventory yang akan ditambahkan ke departemen
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="item">Item Inventory</Label>
                                    <Combobox
                                        options={inventoryItemOptions}
                                        value={selectedItemId?.toString() || ''}
                                        onValueChange={handleItemSelect}
                                        placeholder="Pilih item inventory..."
                                        searchPlaceholder="Cari item..."
                                        emptyText="Item tidak ditemukan"
                                        className="w-full"
                                    />
                                    {errors.inventory_item_id && (
                                        <p className="text-sm text-red-600 mt-1">{errors.inventory_item_id}</p>
                                    )}
                                </div>

                                {selectedItemId && (
                                    <div className="p-4 bg-blue-50 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Package className="h-5 w-5 text-blue-600" />
                                            <span className="font-medium text-blue-900">Item Terpilih</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-600">Nama:</span>
                                                <div className="font-medium">{getSelectedItem()?.name}</div>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Kode:</span>
                                                <div className="font-medium">{getSelectedItem()?.code}</div>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Kategori:</span>
                                                <div className="font-medium">{getSelectedItem()?.category.name}</div>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Satuan:</span>
                                                <div className="font-medium">{getSelectedItem()?.unit_of_measure}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Stock Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Informasi Stok</CardTitle>
                                <CardDescription>
                                    Atur jumlah stok dan batas minimum/maksimum
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="current_stock">Stok Awal</Label>
                                        <Input
                                            id="current_stock"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={currentStock}
                                            onChange={(e) => setCurrentStock(parseFloat(e.target.value) || 0)}
                                            placeholder="0"
                                        />
                                        {errors.current_stock && (
                                            <p className="text-sm text-red-600 mt-1">{errors.current_stock}</p>
                                        )}
                                    </div>
                                    
                                    <div>
                                        <Label htmlFor="average_cost">Harga Rata-rata</Label>
                                        <Input
                                            id="average_cost"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={averageCost}
                                            onChange={(e) => setAverageCost(parseFloat(e.target.value) || 0)}
                                            placeholder="0"
                                        />
                                        {errors.average_cost && (
                                            <p className="text-sm text-red-600 mt-1">{errors.average_cost}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="minimum_stock">Stok Minimum</Label>
                                        <Input
                                            id="minimum_stock"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={minimumStock}
                                            onChange={(e) => setMinimumStock(parseFloat(e.target.value) || 0)}
                                            placeholder="0"
                                        />
                                        {errors.minimum_stock && (
                                            <p className="text-sm text-red-600 mt-1">{errors.minimum_stock}</p>
                                        )}
                                    </div>
                                    
                                    <div>
                                        <Label htmlFor="maximum_stock">Stok Maksimum</Label>
                                        <Input
                                            id="maximum_stock"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={maximumStock}
                                            onChange={(e) => setMaximumStock(parseFloat(e.target.value) || 0)}
                                            placeholder="0"
                                        />
                                        {errors.maximum_stock && (
                                            <p className="text-sm text-red-600 mt-1">{errors.maximum_stock}</p>
                                        )}
                                    </div>
                                </div>

                                {(currentStock > 0 && averageCost > 0) && (
                                    <div className="p-4 bg-green-50 rounded-lg">
                                        <div className="text-sm text-green-800">
                                            <strong>Total Nilai Stok Awal: {formatCurrency(getTotalValue())}</strong>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Location Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Informasi Lokasi</CardTitle>
                                <CardDescription>
                                    Atur lokasi penyimpanan item di departemen (opsional)
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="location_code">Kode Lokasi</Label>
                                        <Input
                                            id="location_code"
                                            type="text"
                                            value={locationCode}
                                            onChange={(e) => setLocationCode(e.target.value)}
                                            placeholder="mis: A1, B2, WH-01"
                                        />
                                        {errors.location_code && (
                                            <p className="text-sm text-red-600 mt-1">{errors.location_code}</p>
                                        )}
                                    </div>
                                    
                                    <div>
                                        <Label htmlFor="rack_position">Posisi Rak</Label>
                                        <Input
                                            id="rack_position"
                                            type="text"
                                            value={rackPosition}
                                            onChange={(e) => setRackPosition(e.target.value)}
                                            placeholder="mis: Rak A Shelf 2, Lemari 1"
                                        />
                                        {errors.rack_position && (
                                            <p className="text-sm text-red-600 mt-1">{errors.rack_position}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="notes">Catatan</Label>
                                    <Textarea
                                        id="notes"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Catatan tambahan tentang item atau lokasi..."
                                        rows={3}
                                    />
                                    {errors.notes && (
                                        <p className="text-sm text-red-600 mt-1">{errors.notes}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Submit Button */}
                        <div className="flex justify-end gap-4">
                            <Button variant="outline" asChild>
                                <Link href={`/department-stock?department_id=${department.id}`}>
                                    Batal
                                </Link>
                            </Button>
                            <Button type="submit" disabled={processing || !selectedItemId}>
                                <Save className="h-4 w-4 mr-2" />
                                {processing ? 'Menyimpan...' : 'Simpan Item Stok'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
