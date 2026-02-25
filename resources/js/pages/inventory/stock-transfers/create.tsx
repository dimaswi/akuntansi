import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRightLeft, Save } from 'lucide-react';
import { useState } from 'react';
import { route } from 'ziggy-js';

interface DepartmentStock {
    department_id: number;
    quantity_on_hand: number;
}

interface Item {
    id: number;
    code: string;
    name: string;
    unit: string;
    department_stocks: DepartmentStock[];
}

interface Department {
    id: number;
    code: string;
    name: string;
}

interface Props extends SharedData {
    departments: Department[];
    items: Item[];
}

export default function Create({ departments, items }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        tanggal_transfer: new Date().toISOString().split('T')[0],
        from_department_id: '',
        to_department_id: '',
        item_id: '',
        quantity: '',
        keterangan: '',
    });

    const [selectedItem, setSelectedItem] = useState<Item | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Inventory', href: '/inventory' },
        { title: 'Stock Transfer', href: route('stock-transfers.index') },
        { title: 'Buat Transfer', href: '#' },
    ];

    const handleSelectItem = (itemId: string) => {
        const item = items.find((i) => i.id.toString() === itemId);
        if (item) {
            setSelectedItem(item);
            setData('item_id', itemId);
        }
    };

    // Get available items for selected from_department with quantity > 0
    const getAvailableItems = () => {
        if (!data.from_department_id) return [];

        return items.filter((item) => {
            // Find stock for this specific department
            const deptStock = item.department_stocks.find((stock) => stock.department_id.toString() === data.from_department_id);
            // Only return item if stock exists AND quantity > 0
            return deptStock && deptStock.quantity_on_hand > 0;
        });
    };

    // Get available stock for selected item based on from_department_id
    const getAvailableStock = (): number => {
        if (!selectedItem || !data.from_department_id) return 0;

        const deptStock = selectedItem.department_stocks.find((stock) => stock.department_id.toString() === data.from_department_id);
        return deptStock ? deptStock.quantity_on_hand : 0;
    };

    // Reset selected item when from_department changes
    const handleFromDepartmentChange = (value: string) => {
        setData('from_department_id', value);
        // Reset item if department changes
        setSelectedItem(null);
        setData('item_id', '');
    };

    const formatNumber = (value: number) => {
        return value.toLocaleString('id-ID');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('stock-transfers.store'), {
            preserveState: true,
        });
    };

    const fromDepartmentOptions = departments.map((dept) => ({
        value: dept.id.toString(),
        label: `${dept.code} - ${dept.name}`,
    }));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Buat Transfer Stok" />

            <div className="space-y-4 p-4">
                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div>
                                    <Button type="button" variant="outline" onClick={() => window.history.back()}>
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <ArrowRightLeft className="h-5 w-5" />
                                        Buat Transfer Stok Baru
                                    </CardTitle>
                                    <CardDescription>Buat transfer barang dari gudang pusat ke departemen atau antar departemen</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Tanggal Transfer */}
                            <div className="space-y-2">
                                <Label htmlFor="tanggal_transfer">
                                    Tanggal Transfer <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="tanggal_transfer"
                                    type="date"
                                    value={data.tanggal_transfer}
                                    onChange={(e) => setData('tanggal_transfer', e.target.value)}
                                    className={errors.tanggal_transfer ? 'border-red-500' : ''}
                                />
                                {errors.tanggal_transfer && <p className="text-sm text-red-500">{errors.tanggal_transfer}</p>}
                            </div>

                            {/* From Department */}
                            <div className="space-y-2">
                                <Label htmlFor="from_department_id">
                                    Dari <span className="text-red-500">*</span>
                                </Label>
                                <SearchableSelect
                                    options={fromDepartmentOptions}
                                    value={data.from_department_id}
                                    onValueChange={handleFromDepartmentChange}
                                    placeholder="Pilih departemen asal"
                                    searchPlaceholder="Cari departemen..."
                                />
                                {errors.from_department_id && <p className="text-sm text-red-500">{errors.from_department_id}</p>}
                            </div>

                            {/* To Department */}
                            <div className="space-y-2">
                                <Label htmlFor="to_department_id">
                                    Ke Departemen <span className="text-red-500">*</span>
                                </Label>
                                <SearchableSelect
                                    options={departments.map((dept) => ({
                                        value: dept.id.toString(),
                                        label: `${dept.code} - ${dept.name}`,
                                    }))}
                                    value={data.to_department_id}
                                    onValueChange={(value) => setData('to_department_id', value)}
                                    placeholder="Pilih departemen tujuan"
                                    searchPlaceholder="Cari departemen..."
                                />
                                {errors.to_department_id && <p className="text-sm text-red-500">{errors.to_department_id}</p>}
                            </div>

                            {/* Item */}
                            <div className="space-y-2">
                                <Label htmlFor="item_id">
                                    Barang <span className="text-red-500">*</span>
                                </Label>
                                {!data.from_department_id ? (
                                    <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 p-3">
                                        <span className="text-sm text-amber-700">Pilih departemen asal terlebih dahulu</span>
                                    </div>
                                ) : getAvailableItems().length === 0 ? (
                                    <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3">
                                        <span className="text-sm text-red-700">Tidak ada barang tersedia di department ini</span>
                                    </div>
                                ) : (
                                    <SearchableSelect
                                        options={getAvailableItems().map((item) => ({
                                            value: item.id.toString(),
                                            label: `${item.code} - ${item.name}`,
                                        }))}
                                        value={data.item_id}
                                        onValueChange={handleSelectItem}
                                        placeholder="Pilih barang"
                                        searchPlaceholder="Cari barang..."
                                        emptyText="Barang tidak ditemukan"
                                    />
                                )}
                                {errors.item_id && <p className="text-sm text-red-500">{errors.item_id}</p>}
                            </div>

                            {/* Selected Item Display */}
                            {selectedItem && (
                                <Card className="border-2 border-gray-200">
                                    <CardContent className="p-4">
                                        <div className="mb-3 flex items-center justify-between">
                                            <h4 className="text-sm font-semibold tracking-wide text-gray-700 uppercase">Item Terpilih</h4>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedItem(null);
                                                    setData('item_id', '');
                                                }}
                                            >
                                                <span className="text-xs">Clear</span>
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <p className="mb-1 text-xs text-gray-500">Kode Barang</p>
                                                <p className="text-sm font-semibold">{selectedItem.code}</p>
                                            </div>
                                            <div>
                                                <p className="mb-1 text-xs text-gray-500">Nama Barang</p>
                                                <p className="text-sm font-semibold">{selectedItem.name}</p>
                                            </div>
                                            <div>
                                                <p className="mb-1 text-xs text-gray-500">Stok Tersedia</p>
                                                <p className="text-sm font-semibold text-blue-600">
                                                    {formatNumber(getAvailableStock())} {selectedItem.unit}
                                                </p>
                                                {!data.from_department_id && (
                                                    <p className="mt-1 text-xs text-amber-600">Pilih department asal dulu</p>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Quantity */}
                            <div className="space-y-2">
                                <Label htmlFor="quantity">
                                    Jumlah <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    min="1"
                                    value={data.quantity}
                                    onChange={(e) => setData('quantity', e.target.value)}
                                    placeholder="Masukkan jumlah barang"
                                    className={errors.quantity ? 'border-red-500' : ''}
                                />
                                {errors.quantity && <p className="text-sm text-red-500">{errors.quantity}</p>}
                            </div>

                            {/* Keterangan */}
                            <div className="space-y-2">
                                <Label htmlFor="keterangan">Keterangan</Label>
                                <Textarea
                                    id="keterangan"
                                    value={data.keterangan}
                                    onChange={(e) => setData('keterangan', e.target.value)}
                                    placeholder="Keterangan tambahan (opsional)"
                                    rows={3}
                                />
                                {errors.keterangan && <p className="text-sm text-red-500">{errors.keterangan}</p>}
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex justify-end gap-2 border-t pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.visit(route('stock-transfers.index'))}
                                    disabled={processing}
                                >
                                    Batal
                                </Button>
                                <Button type="submit" disabled={processing} className="gap-2">
                                    <Save className="h-4 w-4" />
                                    {processing ? 'Menyimpan...' : 'Simpan Transfer'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
