import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft, ClipboardList, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { route } from 'ziggy-js';

interface Item {
    id: number;
    kode_barang: string;
    nama_barang: string;
    harga_beli: number;
    stok_pusat: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: <ClipboardList className="h-4 w-4" />, href: '#' },
    { title: 'Stock Adjustments', href: route('stock-adjustments.index') },
    { title: 'Buat Adjustment Baru', href: '#' },
];

export default function CreateStockAdjustment() {
    const { data, setData, post, processing, errors } = useForm({
        item_id: '',
        tanggal_adjustment: new Date().toISOString().split('T')[0],
        tipe_adjustment: 'shortage',
        quantity: '',
        keterangan: '',
    });

    const [items, setItems] = useState<Item[]>([]);
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [isLoadingItems, setIsLoadingItems] = useState(false);

    // Load all items on mount for searchable select
    useEffect(() => {
        loadItems();
    }, []);

    const loadItems = async () => {
        setIsLoadingItems(true);
        try {
            const response = await fetch(route('stock-adjustments.searchItems') + '?search=', {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            const result = await response.json();
            setItems(Array.isArray(result) ? result : result.data || []);
        } catch (error) {
            console.error('Error loading items:', error);
            setItems([]);
        } finally {
            setIsLoadingItems(false);
        }
    };

    const handleSelectItem = (itemId: string) => {
        const item = items.find((i) => i.id.toString() === itemId);
        if (item) {
            setSelectedItem(item);
            setData('item_id', itemId);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const estimatedValue = selectedItem && data.quantity ? selectedItem.harga_beli * parseFloat(data.quantity) : 0;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('stock-adjustments.store'), {
            preserveState: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Buat Adjustment Baru" />

            <div className="p-4">
                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => router.visit(route('stock-adjustments.index'))}
                                        className="gap-2"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <ClipboardList className="h-5 w-5" />
                                        Buat Stock Adjustment Baru
                                    </CardTitle>
                                    <CardDescription>Catat penyesuaian stok untuk barang inventory Anda</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Search Item */}
                            <div className="h-auto space-y-2">
                                <Label htmlFor="search_item">
                                    Cari Barang <span className="text-red-500">*</span>
                                </Label>
                                <SearchableSelect
                                    value={data.item_id}
                                    onValueChange={handleSelectItem}
                                    options={items.map((item) => ({
                                        value: item.id.toString(),
                                        label: `${item.kode_barang} - ${item.nama_barang} (Stok: ${item.stok_pusat})`,
                                    }))}
                                    placeholder={isLoadingItems ? 'Loading...' : 'Pilih barang'}
                                    searchPlaceholder="Cari barang..."
                                    emptyText="Barang tidak ditemukan"
                                />
                                {errors.item_id && <p className="text-sm text-red-500">{errors.item_id}</p>}
                            </div>

                            {/* Search Results - Remove this section as it's replaced by SearchableSelect */}

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
                                                className="h-6 text-xs text-gray-500 hover:text-gray-700"
                                            >
                                                Ganti Item
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <p className="text-xs tracking-wide text-gray-500 uppercase">Nama Barang</p>
                                                <p className="text-sm font-semibold text-gray-900">{selectedItem.nama_barang}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs tracking-wide text-gray-500 uppercase">Kode Barang</p>
                                                <p className="font-mono text-sm font-medium text-gray-900">{selectedItem.kode_barang}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs tracking-wide text-gray-500 uppercase">Stok Pusat</p>
                                                <p className="text-sm font-bold text-gray-900">{selectedItem.stok_pusat} unit</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs tracking-wide text-gray-500 uppercase">Harga Beli</p>
                                                <p className="text-sm font-semibold text-gray-900">{formatCurrency(selectedItem.harga_beli)}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                {/* Tanggal Adjustment */}
                                <div className="space-y-2">
                                    <Label htmlFor="tanggal_adjustment">
                                        Tanggal Adjustment <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="tanggal_adjustment"
                                        type="date"
                                        value={data.tanggal_adjustment}
                                        onChange={(e) => setData('tanggal_adjustment', e.target.value)}
                                        required
                                    />
                                    {errors.tanggal_adjustment && <p className="text-sm text-red-500">{errors.tanggal_adjustment}</p>}
                                </div>

                                {/* Tipe Adjustment */}
                                <div className="space-y-2">
                                    <Label htmlFor="tipe_adjustment">
                                        Tipe Adjustment <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={data.tipe_adjustment}
                                        onValueChange={(value) => setData('tipe_adjustment', value as 'shortage' | 'overage')}
                                    >
                                        <SelectTrigger id="tipe_adjustment">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="shortage">Shortage (Kekurangan)</SelectItem>
                                            <SelectItem value="overage">Overage (Kelebihan)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.tipe_adjustment && <p className="text-sm text-red-500">{errors.tipe_adjustment}</p>}
                                </div>

                                {/* Quantity */}
                                <div className="space-y-2">
                                    <Label htmlFor="quantity">
                                        Quantity <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="quantity"
                                        type="number"
                                        min="1"
                                        value={data.quantity}
                                        onChange={(e) => setData('quantity', e.target.value)}
                                        placeholder="Jumlah selisih"
                                        required
                                    />
                                    {errors.quantity && <p className="text-sm text-red-500">{errors.quantity}</p>}
                                </div>

                                {/* Estimated Value */}
                                <div className="space-y-2">
                                    <Label>Estimasi Nilai</Label>
                                    <div className="flex h-10 w-full rounded-md border border-input bg-gray-50 px-3 py-2 text-sm">
                                        {formatCurrency(estimatedValue)}
                                    </div>
                                    <p className="text-xs text-muted-foreground">Dihitung dari quantity × harga beli item</p>
                                </div>
                            </div>

                            {/* Keterangan */}
                            <div className="space-y-2">
                                <Label htmlFor="keterangan">Keterangan</Label>
                                <Textarea
                                    id="keterangan"
                                    value={data.keterangan}
                                    onChange={(e) => setData('keterangan', e.target.value)}
                                    placeholder="Catatan atau alasan adjustment (opsional)"
                                    rows={3}
                                />
                                {errors.keterangan && <p className="text-sm text-red-500">{errors.keterangan}</p>}
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex justify-end gap-4 border-t pt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.visit(route('stock-adjustments.index'))}
                                    disabled={processing}
                                >
                                    Batal
                                </Button>
                                <Button type="submit" disabled={processing} className="gap-2">
                                    <Save className="h-4 w-4" />
                                    {processing ? 'Menyimpan...' : 'Simpan Adjustment'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
