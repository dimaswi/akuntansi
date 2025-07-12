import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { PageProps, BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Inventori',
        href: '/inventory',
    },
    {
        title: 'Perpindahan Stok',
        href: '/inventory/stock-movements',
    },
    {
        title: 'Tambah',
        href: '/inventory/stock-movements/create',
    },
];

interface Item {
    id: number;
    name: string;
    code: string;
    unit_of_measure: string;
    category_name: string;
}

interface Location {
    id: number;
    name: string;
    code: string;
    location_type: string;
}

interface Props extends PageProps {
    items: Item[];
    locations: Location[];
}

export default function CreateMovement({ items, locations }: Props) {
    const [activeTab, setActiveTab] = useState('basic');
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
        notes: ''
    });

    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await router.post('/inventory/stock-movements', formData);
        } catch (error) {
            console.error('Error submitting form:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const movementTypes = [
        { value: 'stock_in', label: 'Stok Masuk' },
        { value: 'stock_out', label: 'Stok Keluar' },
        { value: 'transfer_in', label: 'Transfer Masuk' },
        { value: 'transfer_out', label: 'Transfer Keluar' },
        { value: 'adjustment_plus', label: 'Penyesuaian (+)' },
        { value: 'adjustment_minus', label:'Penyesuaian (-)' },
        { value: 'return', label: 'Retur' },
        { value: 'disposal', label: 'Disposal' }
    ];

    const transactionTypes = [
        { value: 'purchase_receipt', label: 'Penerimaan Pembelian' },
        { value: 'sales_issue', label: 'Pengeluaran Penjualan' },
        { value: 'department_requisition', label: 'Permintaan Departemen' },
        { value: 'inter_location_transfer', label: 'Transfer Antar Lokasi' },
        { value: 'stock_adjustment', label: 'Penyesuaian Stok' },
        { value: 'stock_count', label: 'Opname Stok' },
        { value: 'expired_disposal', label: 'Disposal Kedaluwarsa' },
        { value: 'damage_writeoff', label: 'Hapus Buku Rusak' },
        { value: 'return_to_supplier', label: 'Retur ke Supplier' }
    ];

    const Layout = ({ children }: { children: React.ReactNode }) => (
        <AppLayout breadcrumbs={breadcrumbs}>
            {children}
        </AppLayout>
    );

    return (
        <Layout>
            <Head title="Tambah Perpindahan Stok" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Tambah Perpindahan Stok Baru
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="basic">Info Dasar</TabsTrigger>
                            <TabsTrigger value="details">Detail Tambahan</TabsTrigger>
                        </TabsList>

                        {/* Basic Information Tab */}
                        <TabsContent value="basic">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Informasi Dasar Perpindahan</CardTitle>
                                    <CardDescription>
                                        Masukkan informasi dasar untuk perpindahan stok
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Barang *</label>
                                            <Select value={formData.item_id} onValueChange={(value) => setFormData(prev => ({ ...prev, item_id: value }))}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih barang" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {items.map((item) => (
                                                        <SelectItem key={item.id} value={item.id.toString()}>
                                                            {item.name} ({item.code}) - {item.category_name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.item_id && <p className="text-red-500 text-sm">{errors.item_id}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Lokasi *</label>
                                            <Select value={formData.location_id} onValueChange={(value) => setFormData(prev => ({ ...prev, location_id: value }))}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih lokasi" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {locations.map((location) => (
                                                        <SelectItem key={location.id} value={location.id.toString()}>
                                                            {location.name} ({location.code}) - {location.location_type}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.location_id && <p className="text-red-500 text-sm">{errors.location_id}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Jenis Perpindahan *</label>
                                            <Select value={formData.movement_type} onValueChange={(value) => setFormData(prev => ({ ...prev, movement_type: value }))}>
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
                                            {errors.movement_type && <p className="text-red-500 text-sm">{errors.movement_type}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Jenis Transaksi *</label>
                                            <Select value={formData.transaction_type} onValueChange={(value) => setFormData(prev => ({ ...prev, transaction_type: value }))}>
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
                                            {errors.transaction_type && <p className="text-red-500 text-sm">{errors.transaction_type}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Kuantitas *</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                placeholder="Masukkan kuantitas"
                                                value={formData.quantity}
                                                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            />
                                            {errors.quantity && <p className="text-red-500 text-sm">{errors.quantity}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Biaya per Unit</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                placeholder="Masukkan biaya per unit"
                                                value={formData.unit_cost}
                                                onChange={(e) => setFormData(prev => ({ ...prev, unit_cost: e.target.value }))}
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            />
                                            {errors.unit_cost && <p className="text-red-500 text-sm">{errors.unit_cost}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Tanggal Perpindahan *</label>
                                            <input
                                                type="date"
                                                value={formData.movement_date}
                                                onChange={(e) => setFormData(prev => ({ ...prev, movement_date: e.target.value }))}
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            />
                                            {errors.movement_date && <p className="text-red-500 text-sm">{errors.movement_date}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Total Biaya</label>
                                            <div className="px-3 py-2 bg-gray-50 border rounded-md text-gray-700">
                                                <span className="text-gray-500">Akan dihitung otomatis</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Additional Details Tab */}
                        <TabsContent value="details">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Detail Tambahan</CardTitle>
                                    <CardDescription>
                                        Informasi tambahan untuk perpindahan stok
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Nomor Batch</label>
                                            <input
                                                placeholder="Masukkan nomor batch (opsional)"
                                                value={formData.batch_number}
                                                onChange={(e) => setFormData(prev => ({ ...prev, batch_number: e.target.value }))}
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            />
                                            <p className="text-sm text-gray-500">
                                                Diperlukan untuk barang farmasi dengan tracking batch
                                            </p>
                                            {errors.batch_number && <p className="text-red-500 text-sm">{errors.batch_number}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Tanggal Kedaluwarsa</label>
                                            <input
                                                type="date"
                                                value={formData.expiry_date}
                                                onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            />
                                            <p className="text-sm text-gray-500">
                                                Diperlukan untuk barang dengan tanggal kedaluwarsa
                                            </p>
                                            {errors.expiry_date && <p className="text-red-500 text-sm">{errors.expiry_date}</p>}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Catatan</label>
                                        <textarea
                                            placeholder="Masukkan catatan tambahan (opsional)"
                                            value={formData.notes}
                                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                            rows={4}
                                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        />
                                        <p className="text-sm text-gray-500">
                                            Tambahkan informasi atau alasan perpindahan stok
                                        </p>
                                        {errors.notes && <p className="text-red-500 text-sm">{errors.notes}</p>}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    {/* Submit Button */}
                    <div className="flex justify-end gap-4 mt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit('/inventory/stock-movements')}
                        >
                            Batal
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Menyimpan...' : 'Simpan Perpindahan'}
                        </Button>
                    </div>
                </form>
            </div>
        </Layout>
    );
}
