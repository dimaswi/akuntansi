import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import React, { useCallback, useState } from 'react';

interface Item {
    id: number;
    name: string;
    sku: string;
}

interface Location {
    id: number;
    name: string;
    code: string;
}

interface Props {
    items: Item[];
    locations: Location[];
}

export default function CreateMovement({ items, locations }: Props) {
    const [activeTab, setActiveTab] = useState('basic');

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Perpindahan Stok', href: '/inventory/stock-movements' },
        { title: 'Tambah Perpindahan Stok', href: '/inventory/stock-movements/create' },
    ];

    // State untuk form data
    const [formData, setFormData] = useState({
        item_id: '',
        location_id: '',
        movement_type: '',
        transaction_type: '',
        quantity: '',
        unit_cost: '',
        movement_date: new Date().toISOString().split('T')[0],
        batch_number: '',
        expiry_date: '',
        notes: '',
    });

    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fungsi untuk update field tanpa re-render berlebihan
    const updateField = useCallback((field: string, value: string) => {
        setFormData((current) => ({
            ...current,
            [field]: value,
        }));
    }, []);

    const movementTypes = [
        { value: 'in', label: 'Masuk' },
        { value: 'out', label: 'Keluar' },
        { value: 'transfer', label: 'Transfer' },
        { value: 'adjustment', label: 'Penyesuaian' },
    ];

    const transactionTypes = [
        { value: 'purchase', label: 'Pembelian' },
        { value: 'sale', label: 'Penjualan' },
        { value: 'return', label: 'Retur' },
        { value: 'production', label: 'Produksi' },
        { value: 'consumption', label: 'Konsumsi' },
        { value: 'waste', label: 'Limbah' },
        { value: 'other', label: 'Lainnya' },
    ];

    const calculateTotalCost = useCallback(() => {
        const quantity = parseFloat(formData.quantity) || 0;
        const unitCost = parseFloat(formData.unit_cost) || 0;
        return (quantity * unitCost).toFixed(2);
    }, [formData.quantity, formData.unit_cost]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        try {
            router.post('/inventory/stock-movements', formData, {
                onError: (errors) => {
                    setErrors(errors);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            });
        } catch (error) {
            console.error('Error submitting form:', error);
            setIsSubmitting(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="max-w-7xl p-6">
                <div className="flex items-center justify-between">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">Tambah Perpindahan Stok</h1>
                        <p className="text-gray-600">Buat perpindahan stok baru untuk item inventory</p>
                    </div>

                    <div>
                        <Button variant="outline" onClick={() => router.visit('/inventory/stock-movements')}>
                            <ArrowLeft className="mr-2" />
                            Kembali
                        </Button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="basic">Informasi Dasar</TabsTrigger>
                            <TabsTrigger value="additional">Detail Tambahan</TabsTrigger>
                        </TabsList>

                        <TabsContent value="basic" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Informasi Dasar Perpindahan</CardTitle>
                                    <CardDescription>Masukkan informasi dasar untuk perpindahan stok</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Item *</label>
                                            <Select value={formData.item_id} onValueChange={(value) => updateField('item_id', value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih item" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {items.map((item) => (
                                                        <SelectItem key={item.id} value={item.id.toString()}>
                                                            {item.name} ({item.sku})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.item_id && <p className="text-sm text-red-500">{errors.item_id}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Lokasi *</label>
                                            <Select value={formData.location_id} onValueChange={(value) => updateField('location_id', value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih lokasi" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {locations.map((location) => (
                                                        <SelectItem key={location.id} value={location.id.toString()}>
                                                            {location.name} ({location.code})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.location_id && <p className="text-sm text-red-500">{errors.location_id}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Jenis Perpindahan *</label>
                                            <Select value={formData.movement_type} onValueChange={(value) => updateField('movement_type', value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih jenis perpindahan" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {movementTypes.map((type) => (
                                                        <SelectItem key={type.value} value={type.value}>
                                                            {type.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.movement_type && <p className="text-sm text-red-500">{errors.movement_type}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Jenis Transaksi *</label>
                                            <Select
                                                value={formData.transaction_type}
                                                onValueChange={(value) => updateField('transaction_type', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih jenis transaksi" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {transactionTypes.map((type) => (
                                                        <SelectItem key={type.value} value={type.value}>
                                                            {type.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.transaction_type && <p className="text-sm text-red-500">{errors.transaction_type}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Kuantitas *</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                placeholder="Masukkan kuantitas"
                                                value={formData.quantity}
                                                onChange={(e) => updateField('quantity', e.target.value)}
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            />
                                            {errors.quantity && <p className="text-sm text-red-500">{errors.quantity}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Biaya per Unit</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                placeholder="Masukkan biaya per unit"
                                                value={formData.unit_cost}
                                                onChange={(e) => updateField('unit_cost', e.target.value)}
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            />
                                            {errors.unit_cost && <p className="text-sm text-red-500">{errors.unit_cost}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Tanggal Perpindahan *</label>
                                            <input
                                                type="date"
                                                value={formData.movement_date}
                                                onChange={(e) => updateField('movement_date', e.target.value)}
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            />
                                            {errors.movement_date && <p className="text-sm text-red-500">{errors.movement_date}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Total Biaya</label>
                                            <div className="flex h-10 w-full items-center rounded-md border border-input bg-gray-50 px-3 py-2 text-sm text-gray-600">
                                                Rp {calculateTotalCost()}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="additional" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Detail Tambahan</CardTitle>
                                    <CardDescription>Informasi tambahan untuk perpindahan stok (opsional)</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Nomor Batch</label>
                                            <input
                                                type="text"
                                                placeholder="Masukkan nomor batch"
                                                value={formData.batch_number}
                                                onChange={(e) => updateField('batch_number', e.target.value)}
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            />
                                            {errors.batch_number && <p className="text-sm text-red-500">{errors.batch_number}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Tanggal Kedaluwarsa</label>
                                            <input
                                                type="date"
                                                value={formData.expiry_date}
                                                onChange={(e) => updateField('expiry_date', e.target.value)}
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            />
                                            {errors.expiry_date && <p className="text-sm text-red-500">{errors.expiry_date}</p>}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Catatan</label>
                                        <textarea
                                            placeholder="Masukkan catatan tambahan"
                                            value={formData.notes}
                                            onChange={(e) => updateField('notes', e.target.value)}
                                            rows={4}
                                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        />
                                        {errors.notes && <p className="text-sm text-red-500">{errors.notes}</p>}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    <div className="flex justify-end space-x-4 border-t pt-6">
                        <Button type="button" variant="outline" onClick={() => router.get('/inventory/stock-movements')} disabled={isSubmitting}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Menyimpan...' : 'Simpan Perpindahan'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
