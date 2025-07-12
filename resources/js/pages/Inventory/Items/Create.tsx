import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
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
        title: 'Barang',
        href: '/inventory/items',
    },
    {
        title: 'Tambah',
        href: '/inventory/items/create',
    },
];

interface Category {
    id: number;
    name: string;
    code: string;
}

interface Props extends PageProps {
    categories: Category[];
}

export default function CreateItem({ categories }: Props) {
    const [formData, setFormData] = useState({
        // Basic Info
        name: '',
        code: '',
        description: '',
        category_id: '',
        inventory_type: 'general',
        unit_of_measure: '',
        pack_size: '',
        standard_cost: '',
        is_active: true,
        requires_approval: false,
        is_controlled_substance: false,
        requires_prescription: false,
        
        // Stock Info
        reorder_level: '',
        max_level: '',
        safety_stock: '',
        
        // Pharmacy Details
        generic_name: '',
        brand_name: '',
        strength: '',
        dosage_form: '',
        route_of_administration: '',
        manufacturer: '',
        registration_number: '',
        therapeutic_class: '',
        indication: '',
        contraindication: '',
        side_effects: '',
        dosage_instructions: '',
        storage_conditions: '',
        pregnancy_category: '',
        is_narcotic: false,
        is_psychotropic: false,
        max_dispensing_quantity: '',
        
        // General Details
        brand: '',
        model: '',
        serial_number: '',
        warranty_period: '',
        warranty_start_date: '',
        supplier_part_number: '',
        manufacturer_part_number: '',
        color: '',
        size: '',
        weight: '',
        material: '',
        country_of_origin: '',
    });

    const [errors, setErrors] = useState<{[key: string]: string}>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        const submitData = {
            ...formData,
            standard_cost: parseFloat(formData.standard_cost) || 0,
            pack_size: parseInt(formData.pack_size) || null,
            reorder_level: parseFloat(formData.reorder_level) || 0,
            max_level: formData.max_level ? parseFloat(formData.max_level) : null,
            safety_stock: formData.safety_stock ? parseFloat(formData.safety_stock) : null,
            warranty_period: formData.warranty_period ? parseInt(formData.warranty_period) : null,
            weight: formData.weight ? parseFloat(formData.weight) : null,
            max_dispensing_quantity: formData.max_dispensing_quantity ? parseFloat(formData.max_dispensing_quantity) : null,
        };

        router.post('/inventory/items', submitData, {
            onSuccess: () => {
                router.visit('/inventory/items');
            },
            onError: (errors) => {
                setErrors(errors);
                setIsSubmitting(false);
            }
        });
    };

    const updateFormData = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Barang" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Tambah Barang Baru
                    </h2>
                    <Button variant="outline" onClick={() => router.visit('/inventory/items')}>
                        ← Kembali ke Daftar Barang
                    </Button>
                </div>

                <form onSubmit={handleSubmit}>
                    <Tabs defaultValue="basic" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="basic">Info Dasar</TabsTrigger>
                            <TabsTrigger value="stock">Manajemen Stok</TabsTrigger>
                            <TabsTrigger value="pharmacy">Detail Farmasi</TabsTrigger>
                            <TabsTrigger value="general">Detail Umum</TabsTrigger>
                        </TabsList>

                        {/* Basic Information Tab */}
                        <TabsContent value="basic">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Informasi Dasar</CardTitle>
                                    <CardDescription>
                                        Masukkan informasi dasar untuk barang inventori
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Nama Barang *</label>
                                            <Input
                                                placeholder="Masukkan nama barang"
                                                value={formData.name}
                                                onChange={(e) => updateFormData('name', e.target.value)}
                                            />
                                            {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Kode Barang *</label>
                                            <Input
                                                placeholder="Masukkan kode barang yang unik"
                                                value={formData.code}
                                                onChange={(e) => updateFormData('code', e.target.value)}
                                            />
                                            {errors.code && <p className="text-red-500 text-sm">{errors.code}</p>}
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Kategori *</label>
                                            <Select value={formData.category_id} onValueChange={(value) => updateFormData('category_id', value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih kategori" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {categories.map((category) => (
                                                        <SelectItem key={category.id} value={category.id.toString()}>
                                                            {category.name} ({category.code})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.category_id && <p className="text-red-500 text-sm">{errors.category_id}</p>}
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Jenis Barang *</label>
                                            <Select value={formData.inventory_type} onValueChange={(value) => updateFormData('inventory_type', value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih jenis barang" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="general">Barang Umum</SelectItem>
                                                    <SelectItem value="pharmacy">Barang Farmasi</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.inventory_type && <p className="text-red-500 text-sm">{errors.inventory_type}</p>}
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Satuan *</label>
                                            <Input
                                                placeholder="contoh: pcs, kg, liter"
                                                value={formData.unit_of_measure}
                                                onChange={(e) => updateFormData('unit_of_measure', e.target.value)}
                                            />
                                            {errors.unit_of_measure && <p className="text-red-500 text-sm">{errors.unit_of_measure}</p>}
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Ukuran Kemasan</label>
                                            <Input
                                                placeholder="Masukkan ukuran kemasan"
                                                type="number"
                                                value={formData.pack_size}
                                                onChange={(e) => updateFormData('pack_size', e.target.value)}
                                            />
                                            {errors.pack_size && <p className="text-red-500 text-sm">{errors.pack_size}</p>}
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Harga Standar</label>
                                            <Input
                                                placeholder="Masukkan harga standar"
                                                type="number"
                                                
                                                value={formData.standard_cost}
                                                onChange={(e) => updateFormData('standard_cost', e.target.value)}
                                            />
                                            {errors.standard_cost && <p className="text-red-500 text-sm">{errors.standard_cost}</p>}
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Deskripsi</label>
                                        <Textarea
                                            placeholder="Masukkan deskripsi barang"
                                            value={formData.description}
                                            onChange={(e) => updateFormData('description', e.target.value)}
                                            rows={3}
                                        />
                                        {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="is_active"
                                                checked={formData.is_active}
                                                onCheckedChange={(checked) => updateFormData('is_active', checked)}
                                            />
                                            <label htmlFor="is_active" className="text-sm font-medium">
                                                Aktif
                                            </label>
                                        </div>
                                        
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="requires_approval"
                                                checked={formData.requires_approval}
                                                onCheckedChange={(checked) => updateFormData('requires_approval', checked)}
                                            />
                                            <label htmlFor="requires_approval" className="text-sm font-medium">
                                                Memerlukan Persetujuan
                                            </label>
                                        </div>
                                        
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="is_controlled_substance"
                                                checked={formData.is_controlled_substance}
                                                onCheckedChange={(checked) => updateFormData('is_controlled_substance', checked)}
                                            />
                                            <label htmlFor="is_controlled_substance" className="text-sm font-medium">
                                                Zat Terkontrol
                                            </label>
                                        </div>
                                        
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="requires_prescription"
                                                checked={formData.requires_prescription}
                                                onCheckedChange={(checked) => updateFormData('requires_prescription', checked)}
                                            />
                                            <label htmlFor="requires_prescription" className="text-sm font-medium">
                                                Memerlukan Resep
                                            </label>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Stock Management Tab */}
                        <TabsContent value="stock">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Manajemen Stok</CardTitle>
                                    <CardDescription>
                                        Konfigurasi level stok dan pengaturan pemesanan ulang
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Level Pemesanan Ulang *</label>
                                            <Input
                                                placeholder="Masukkan level pemesanan ulang"
                                                type="number"
                                                
                                                value={formData.reorder_level}
                                                onChange={(e) => updateFormData('reorder_level', e.target.value)}
                                            />
                                            {errors.reorder_level && <p className="text-red-500 text-sm">{errors.reorder_level}</p>}
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Level Maksimum</label>
                                            <Input
                                                placeholder="Masukkan level maksimum"
                                                type="number"
                                                
                                                value={formData.max_level}
                                                onChange={(e) => updateFormData('max_level', e.target.value)}
                                            />
                                            {errors.max_level && <p className="text-red-500 text-sm">{errors.max_level}</p>}
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Stok Pengaman</label>
                                            <Input
                                                placeholder="Masukkan stok pengaman"
                                                type="number"
                                                
                                                value={formData.safety_stock}
                                                onChange={(e) => updateFormData('safety_stock', e.target.value)}
                                            />
                                            {errors.safety_stock && <p className="text-red-500 text-sm">{errors.safety_stock}</p>}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Pharmacy Details Tab */}
                        <TabsContent value="pharmacy">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Detail Farmasi</CardTitle>
                                    <CardDescription>
                                        Informasi tambahan untuk barang farmasi
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {formData.inventory_type === 'pharmacy' ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Nama Generik</label>
                                                <Input
                                                    placeholder="Masukkan nama generik"
                                                    value={formData.generic_name}
                                                    onChange={(e) => updateFormData('generic_name', e.target.value)}
                                                />
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Nama Merek</label>
                                                <Input
                                                    placeholder="Masukkan nama merek"
                                                    value={formData.brand_name}
                                                    onChange={(e) => updateFormData('brand_name', e.target.value)}
                                                />
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Kekuatan</label>
                                                <Input
                                                    placeholder="contoh: 500mg"
                                                    value={formData.strength}
                                                    onChange={(e) => updateFormData('strength', e.target.value)}
                                                />
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Bentuk Sediaan</label>
                                                <Select value={formData.dosage_form} onValueChange={(value) => updateFormData('dosage_form', value)}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Pilih bentuk sediaan" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="tablet">Tablet</SelectItem>
                                                        <SelectItem value="capsule">Kapsul</SelectItem>
                                                        <SelectItem value="syrup">Sirup</SelectItem>
                                                        <SelectItem value="injection">Injeksi</SelectItem>
                                                        <SelectItem value="cream">Krim</SelectItem>
                                                        <SelectItem value="ointment">Salep</SelectItem>
                                                        <SelectItem value="drops">Tetes</SelectItem>
                                                        <SelectItem value="inhaler">Inhaler</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Rute Pemberian</label>
                                                <Input
                                                    placeholder="contoh: Oral, Topikal"
                                                    value={formData.route_of_administration}
                                                    onChange={(e) => updateFormData('route_of_administration', e.target.value)}
                                                />
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Produsen</label>
                                                <Input
                                                    placeholder="Masukkan nama produsen"
                                                    value={formData.manufacturer}
                                                    onChange={(e) => updateFormData('manufacturer', e.target.value)}
                                                />
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Nomor Registrasi</label>
                                                <Input
                                                    placeholder="Masukkan nomor registrasi"
                                                    value={formData.registration_number}
                                                    onChange={(e) => updateFormData('registration_number', e.target.value)}
                                                />
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Kelas Terapi</label>
                                                <Input
                                                    placeholder="Masukkan kelas terapi"
                                                    value={formData.therapeutic_class}
                                                    onChange={(e) => updateFormData('therapeutic_class', e.target.value)}
                                                />
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Kuantitas Dispensing Maksimum</label>
                                                <Input
                                                    placeholder="Masukkan kuantitas dispensing maksimum"
                                                    type="number"
                                                    
                                                    value={formData.max_dispensing_quantity}
                                                    onChange={(e) => updateFormData('max_dispensing_quantity', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <p>Detail farmasi hanya tersedia untuk barang farmasi.</p>
                                            <p>Silakan ubah jenis barang ke "Barang Farmasi" untuk mengakses kolom ini.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* General Details Tab */}
                        <TabsContent value="general">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Detail Umum</CardTitle>
                                    <CardDescription>
                                        Informasi tambahan untuk barang umum
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {formData.inventory_type === 'general' ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Merek</label>
                                                <Input
                                                    placeholder="Masukkan merek"
                                                    value={formData.brand}
                                                    onChange={(e) => updateFormData('brand', e.target.value)}
                                                />
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Model</label>
                                                <Input
                                                    placeholder="Masukkan model"
                                                    value={formData.model}
                                                    onChange={(e) => updateFormData('model', e.target.value)}
                                                />
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Nomor Seri</label>
                                                <Input
                                                    placeholder="Masukkan nomor seri"
                                                    value={formData.serial_number}
                                                    onChange={(e) => updateFormData('serial_number', e.target.value)}
                                                />
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Periode Garansi (bulan)</label>
                                                <Input
                                                    placeholder="Masukkan periode garansi"
                                                    type="number"
                                                    value={formData.warranty_period}
                                                    onChange={(e) => updateFormData('warranty_period', e.target.value)}
                                                />
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Tanggal Mulai Garansi</label>
                                                <Input
                                                    type="date"
                                                    value={formData.warranty_start_date}
                                                    onChange={(e) => updateFormData('warranty_start_date', e.target.value)}
                                                />
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Nomor Part Supplier</label>
                                                <Input
                                                    placeholder="Masukkan nomor part supplier"
                                                    value={formData.supplier_part_number}
                                                    onChange={(e) => updateFormData('supplier_part_number', e.target.value)}
                                                />
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Nomor Part Produsen</label>
                                                <Input
                                                    placeholder="Masukkan nomor part produsen"
                                                    value={formData.manufacturer_part_number}
                                                    onChange={(e) => updateFormData('manufacturer_part_number', e.target.value)}
                                                />
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Warna</label>
                                                <Input
                                                    placeholder="Masukkan warna"
                                                    value={formData.color}
                                                    onChange={(e) => updateFormData('color', e.target.value)}
                                                />
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Ukuran</label>
                                                <Input
                                                    placeholder="Masukkan ukuran"
                                                    value={formData.size}
                                                    onChange={(e) => updateFormData('size', e.target.value)}
                                                />
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Berat (kg)</label>
                                                <Input
                                                    placeholder="Masukkan berat"
                                                    type="number"
                                                    
                                                    value={formData.weight}
                                                    onChange={(e) => updateFormData('weight', e.target.value)}
                                                />
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Material</label>
                                                <Input
                                                    placeholder="Masukkan material"
                                                    value={formData.material}
                                                    onChange={(e) => updateFormData('material', e.target.value)}
                                                />
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Negara Asal</label>
                                                <Input
                                                    placeholder="Masukkan negara asal"
                                                    value={formData.country_of_origin}
                                                    onChange={(e) => updateFormData('country_of_origin', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <p>Detail umum hanya tersedia untuk barang umum.</p>
                                            <p>Silakan ubah jenis barang ke "Barang Umum" untuk mengakses kolom ini.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    {/* Submit Button */}
                    <div className="flex justify-end gap-4 mt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit('/inventory/items')}
                        >
                            Batal
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Membuat...' : 'Tambah Barang'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
