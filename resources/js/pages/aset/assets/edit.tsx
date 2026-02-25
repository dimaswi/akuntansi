import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft, Info, Landmark, Save } from 'lucide-react';
import { toast } from '@/lib/toast';
import { useState } from 'react';
import { route } from 'ziggy-js';

interface Category { id: number; code: string; name: string; default_useful_life_years: number; default_depreciation_method: string; default_salvage_percentage: number }
interface Department { id: number; name: string }
interface Supplier { id: number; name: string }

interface Asset {
    id: number; code: string; name: string; description?: string;
    category_id: number; department_id?: number; supplier_id?: number;
    location?: string; brand?: string; model?: string; serial_number?: string; plate_number?: string;
    condition: string; warranty_expiry_date?: string; notes?: string;
    acquisition_date?: string; acquisition_type?: string; acquisition_cost?: number;
    useful_life_months?: number; salvage_value?: number; depreciation_method?: string;
    depreciation_start_date?: string; current_book_value?: number; accumulated_depreciation?: number;
    estimated_service_hours?: number; estimated_total_production?: number;
}

interface Props extends SharedData {
    asset: Asset;
    categories: Category[];
    departments: Department[];
    suppliers: Supplier[];
    hasDepreciations: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: <Landmark className="h-4 w-4" />, href: route('aset.dashboard') },
    { title: 'Daftar Aset', href: route('aset.assets.index') },
    { title: 'Edit', href: '#' },
];

export default function EditAsset() {
    const { asset, categories, departments, suppliers, hasDepreciations } = usePage<Props>().props;
    const [isPreExisting, setIsPreExisting] = useState((asset.accumulated_depreciation ?? 0) > 0);

    const { data, setData, put, processing, errors } = useForm({
        name: asset.name,
        description: asset.description ?? '',
        category_id: asset.category_id?.toString() ?? '',
        department_id: asset.department_id?.toString() ?? '',
        supplier_id: asset.supplier_id?.toString() ?? '',
        location: asset.location ?? '',
        brand: asset.brand ?? '',
        model: asset.model ?? '',
        serial_number: asset.serial_number ?? '',
        plate_number: asset.plate_number ?? '',
        condition: asset.condition,
        warranty_expiry_date: asset.warranty_expiry_date ? asset.warranty_expiry_date.split('T')[0] : '',
        notes: asset.notes ?? '',
        // Financial fields (only used when no depreciations)
        acquisition_date: asset.acquisition_date ? asset.acquisition_date.split('T')[0] : '',
        acquisition_type: asset.acquisition_type ?? 'purchase',
        acquisition_cost: asset.acquisition_cost ?? 0,
        useful_life_months: asset.useful_life_months ?? 60,
        salvage_value: asset.salvage_value ?? 0,
        depreciation_method: asset.depreciation_method ?? 'straight_line',
        depreciation_start_date: asset.depreciation_start_date ? asset.depreciation_start_date.split('T')[0] : '',
        estimated_service_hours: asset.estimated_service_hours?.toString() ?? '',
        estimated_total_production: asset.estimated_total_production?.toString() ?? '',
        initial_accumulated_depreciation: asset.accumulated_depreciation ?? 0,
    });

    const handleAcquisitionDateChange = (date: string) => {
        setData((prev) => ({
            ...prev,
            acquisition_date: date,
            depreciation_start_date: date,
        }));
    };

    const handleAcquisitionCostChange = (cost: number) => {
        setData((prev) => {
            const cat = categories.find((c) => c.id === parseInt(prev.category_id));
            return {
                ...prev,
                acquisition_cost: cost,
                salvage_value: cat ? Math.round(cost * cat.default_salvage_percentage / 100) : prev.salvage_value,
            };
        });
    };

    const fmtCurrency = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('aset.assets.update', asset.id), {
            onError: () => toast.error('Gagal memperbarui aset'),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${asset.code}`} />

            <div className="space-y-6 p-4">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div>
                                    <Button type="button" variant="outline" onClick={() => window.history.back()} className="flex items-center gap-2">
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div>
                                    <CardTitle>Edit Aset  {asset.code}</CardTitle>
                                    <CardDescription>Perbarui informasi aset</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">
                                        Nama Aset <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className={errors.name ? 'border-red-500' : ''}
                                    />
                                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="category_id">
                                        Kategori <span className="text-red-500">*</span>
                                    </Label>
                                    <Select value={data.category_id} onValueChange={(v) => setData('category_id', v)}>
                                        <SelectTrigger className={errors.category_id ? 'border-red-500' : ''}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((c) => (
                                                <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.category_id && <p className="text-sm text-red-500">{errors.category_id}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Deskripsi</Label>
                                <Textarea id="description" value={data.description} onChange={(e) => setData('description', e.target.value)} rows={2} />
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="department_id">Departemen</Label>
                                    <Select value={data.department_id} onValueChange={(v) => setData('department_id', v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih departemen" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {departments.map((d) => (
                                                <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="supplier_id">Supplier</Label>
                                    <Select value={data.supplier_id} onValueChange={(v) => setData('supplier_id', v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih supplier" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {suppliers.map((s) => (
                                                <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div>
                                <CardTitle>Detail Aset</CardTitle>
                                <CardDescription>Detail fisik dan identitas aset</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="location">Lokasi</Label>
                                    <Input id="location" value={data.location} onChange={(e) => setData('location', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="brand">Merk/Brand</Label>
                                    <Input id="brand" value={data.brand} onChange={(e) => setData('brand', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="model">Model</Label>
                                    <Input id="model" value={data.model} onChange={(e) => setData('model', e.target.value)} />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="serial_number">Nomor Seri</Label>
                                    <Input id="serial_number" value={data.serial_number} onChange={(e) => setData('serial_number', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="plate_number">Nomor Plat</Label>
                                    <Input id="plate_number" value={data.plate_number} onChange={(e) => setData('plate_number', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="condition">
                                        Kondisi <span className="text-red-500">*</span>
                                    </Label>
                                    <Select value={data.condition} onValueChange={(v) => setData('condition', v)}>
                                        <SelectTrigger className={errors.condition ? 'border-red-500' : ''}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="excellent">Sangat Baik</SelectItem>
                                            <SelectItem value="good">Baik</SelectItem>
                                            <SelectItem value="fair">Cukup</SelectItem>
                                            <SelectItem value="poor">Kurang</SelectItem>
                                            <SelectItem value="damaged">Rusak</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="warranty_expiry_date">Garansi Sampai Dengan</Label>
                                    <Input id="warranty_expiry_date" type="date" value={data.warranty_expiry_date} onChange={(e) => setData('warranty_expiry_date', e.target.value)} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Informasi Keuangan & Penyusutan - hanya jika belum ada penyusutan */}
                    {!hasDepreciations ? (
                        <>
                            <Card>
                                <CardHeader>
                                    <div>
                                        <CardTitle>Informasi Perolehan</CardTitle>
                                        <CardDescription>Data perolehan dan nilai aset (bisa diubah karena belum ada penyusutan)</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="acquisition_date">Tanggal Perolehan</Label>
                                            <Input id="acquisition_date" type="date" value={data.acquisition_date} onChange={(e) => handleAcquisitionDateChange(e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="acquisition_type">Jenis Perolehan</Label>
                                            <Select value={data.acquisition_type} onValueChange={(v) => setData('acquisition_type', v)}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="purchase">Pembelian</SelectItem>
                                                    <SelectItem value="donation">Donasi</SelectItem>
                                                    <SelectItem value="transfer_in">Transfer Masuk</SelectItem>
                                                    <SelectItem value="leasing">Leasing</SelectItem>
                                                    <SelectItem value="self_built">Pembangunan Sendiri</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="acquisition_cost">Harga Perolehan</Label>
                                            <Input id="acquisition_cost" type="number" min={0} value={data.acquisition_cost} onChange={(e) => handleAcquisitionCostChange(parseFloat(e.target.value) || 0)} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <div>
                                        <CardTitle>Pengaturan Penyusutan</CardTitle>
                                        <CardDescription>Konfigurasi penyusutan aset</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="useful_life_months">Masa Manfaat (Bulan)</Label>
                                            <Input id="useful_life_months" type="number" min={1} value={data.useful_life_months} onChange={(e) => setData('useful_life_months', parseInt(e.target.value) || 60)} />
                                            <p className="text-xs text-muted-foreground">{Math.floor(data.useful_life_months / 12)} tahun {data.useful_life_months % 12} bulan</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="salvage_value">Nilai Residu</Label>
                                            <Input id="salvage_value" type="number" min={0} value={data.salvage_value} onChange={(e) => setData('salvage_value', parseFloat(e.target.value) || 0)} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="depreciation_method">Metode Penyusutan</Label>
                                            <Select value={data.depreciation_method} onValueChange={(v) => setData('depreciation_method', v)}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="straight_line">Garis Lurus</SelectItem>
                                                    <SelectItem value="declining_balance">Saldo Menurun</SelectItem>
                                                    <SelectItem value="double_declining">Saldo Menurun Ganda</SelectItem>
                                                    <SelectItem value="sum_of_years_digits">Jumlah Angka Tahun</SelectItem>
                                                    <SelectItem value="service_hours">Satuan Jam Kerja</SelectItem>
                                                    <SelectItem value="productive_output">Satuan Hasil Produksi</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="depreciation_start_date">Mulai Penyusutan</Label>
                                            <Input id="depreciation_start_date" type="date" value={data.depreciation_start_date} onChange={(e) => setData('depreciation_start_date', e.target.value)} />
                                            <p className="text-xs text-muted-foreground">Penyusutan dihitung otomatis dari tanggal ini hingga periode yang dipilih</p>
                                        </div>
                                    </div>
                                    {data.depreciation_method === 'service_hours' && (
                                        <div className="space-y-2">
                                            <Label htmlFor="estimated_service_hours">Estimasi Total Jam Kerja</Label>
                                            <Input id="estimated_service_hours" type="number" min={1} value={data.estimated_service_hours} onChange={(e) => setData('estimated_service_hours', e.target.value)} />
                                        </div>
                                    )}
                                    {data.depreciation_method === 'productive_output' && (
                                        <div className="space-y-2">
                                            <Label htmlFor="estimated_total_production">Estimasi Total Hasil Produksi</Label>
                                            <Input id="estimated_total_production" type="number" min={1} value={data.estimated_total_production} onChange={(e) => setData('estimated_total_production', e.target.value)} />
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Aset Migrasi */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>Data Awal (Migrasi)</CardTitle>
                                            <CardDescription>Untuk aset yang sudah ada sebelum sistem</CardDescription>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Label htmlFor="is_pre_existing" className="text-sm">Aset sudah ada sebelumnya</Label>
                                            <Switch
                                                id="is_pre_existing"
                                                checked={isPreExisting}
                                                onCheckedChange={(v) => {
                                                    setIsPreExisting(v);
                                                    if (!v) setData('initial_accumulated_depreciation', 0);
                                                }}
                                            />
                                        </div>
                                    </div>
                                </CardHeader>
                                {isPreExisting && (
                                    <CardContent className="space-y-6">
                                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                                            <div className="flex items-start gap-3">
                                                <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                                                <p className="text-sm text-blue-800">Masukkan akumulasi penyusutan yang sudah terjadi sebelum masuk ke sistem.</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                            <div className="space-y-2">
                                                <Label>Akumulasi Penyusutan Awal</Label>
                                                <Input type="number" min={0} value={data.initial_accumulated_depreciation} onChange={(e) => setData('initial_accumulated_depreciation', parseFloat(e.target.value) || 0)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Nilai Buku Awal</Label>
                                                <Input type="text" readOnly disabled value={fmtCurrency(Math.max(0, data.acquisition_cost - data.initial_accumulated_depreciation))} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Sisa Dapat Disusutkan</Label>
                                                <Input type="text" readOnly disabled value={fmtCurrency(Math.max(0, data.acquisition_cost - data.initial_accumulated_depreciation - data.salvage_value))} />
                                            </div>
                                        </div>
                                    </CardContent>
                                )}
                            </Card>
                        </>
                    ) : (
                        <Card>
                            <CardHeader>
                                <div>
                                    <CardTitle>Pengaturan Penyusutan</CardTitle>
                                    <CardDescription>Tanggal mulai penyusutan dapat diperbaiki meskipun sudah ada riwayat</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                                        <div className="text-sm text-amber-800">
                                            <p className="font-medium">Data keuangan terkunci</p>
                                            <p className="mt-1">Harga perolehan, metode, masa manfaat, dan nilai residu tidak dapat diubah karena sudah memiliki riwayat penyusutan. Anda masih bisa mengubah <strong>tanggal mulai penyusutan</strong> — jalankan ulang penyusutan untuk mengisi bulan yang tertinggal.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="depreciation_start_date">Mulai Penyusutan</Label>
                                        <Input id="depreciation_start_date" type="date" value={data.depreciation_start_date} onChange={(e) => setData('depreciation_start_date', e.target.value)} />
                                        <p className="text-xs text-muted-foreground">Ubah tanggal ini lalu jalankan Hitung Penyusutan untuk mengisi bulan yang terlewat secara otomatis</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle>Catatan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea id="notes" value={data.notes} onChange={(e) => setData('notes', e.target.value)} rows={3} />
                        </CardContent>
                    </Card>

                    <div className="flex justify-end space-x-4">
                        <Button type="button" variant="outline" onClick={() => router.visit(route('aset.assets.show', asset.id))}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
