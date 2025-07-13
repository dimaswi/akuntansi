import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { DepartmentSearchableDropdown } from '@/components/ui/department-searchable-dropdown';
import { CategorySearchableDropdown } from '@/components/ui/category-searchable-dropdown';
import { SupplierSearchableDropdown } from '@/components/ui/supplier-searchable-dropdown';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router, usePage, useForm } from '@inertiajs/react';
import { Package, Save, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Inventory", href: "#" },
    { title: "Items", href: "/items" },
    { title: "Tambah Item", href: "#" },
];

export default function CreateItem() {
    const [inventoryType, setInventoryType] = useState<'pharmacy' | 'general'>('general');

    const { data, setData, post, processing, errors } = useForm<{
        code: string;
        name: string;
        description: string;
        category_id: number | null;
        department_id: number | null;
        supplier_id: number | null;
        inventory_type: 'pharmacy' | 'general';
        unit_of_measure: string;
        pack_size: number;
        reorder_level: number;
        max_level: number;
        safety_stock: number;
        standard_cost: number;
        last_purchase_cost: number;
        is_active: boolean;
        requires_approval: boolean;
        is_controlled_substance: boolean;
        requires_prescription: boolean;
        specifications: any;
        
        // Pharmacy specific fields
        bpom_registration: string;
        manufacturer: string;
        generic_name: string;
        strength: string;
        dosage_form: string;
        drug_classification: string;
        atc_code: string;
        contraindications: string;
        drug_interactions: any;
        storage_temp_min: number;
        storage_temp_max: number;
        minimum_expiry_months: number;
        
        // General specific fields
        is_consumable: boolean;
        is_returnable: boolean;
        requires_maintenance: boolean;
        warranty_months: number;
        usage_instructions: string;
        department_restrictions: any;
    }>({
        code: '',
        name: '',
        description: '',
        category_id: null,
        department_id: null,
        supplier_id: null,
        inventory_type: 'general',
        unit_of_measure: '',
        pack_size: 1,
        reorder_level: 0,
        max_level: 0,
        safety_stock: 0,
        standard_cost: 0,
        last_purchase_cost: 0,
        is_active: true,
        requires_approval: false,
        is_controlled_substance: false,
        requires_prescription: false,
        specifications: null,
        
        // Pharmacy specific fields
        bpom_registration: '',
        manufacturer: '',
        generic_name: '',
        strength: '',
        dosage_form: '',
        drug_classification: '',
        atc_code: '',
        contraindications: '',
        drug_interactions: null,
        storage_temp_min: 0,
        storage_temp_max: 0,
        minimum_expiry_months: 18,
        
        // General specific fields
        is_consumable: false,
        is_returnable: false,
        requires_maintenance: false,
        warranty_months: 0,
        usage_instructions: '',
        department_restrictions: null,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Clean up JSON fields - convert empty objects to null
        const cleanSpecifications = data.specifications && typeof data.specifications === 'object' && Object.keys(data.specifications).length > 0 ? data.specifications : null;
        const cleanDrugInteractions = data.drug_interactions && typeof data.drug_interactions === 'object' && Object.keys(data.drug_interactions).length > 0 ? data.drug_interactions : null;
        const cleanDepartmentRestrictions = data.department_restrictions && typeof data.department_restrictions === 'object' && Object.keys(data.department_restrictions).length > 0 ? data.department_restrictions : null;

        // Set cleaned data
        setData({
            ...data,
            specifications: cleanSpecifications,
            drug_interactions: cleanDrugInteractions,
            department_restrictions: cleanDepartmentRestrictions,
        });

        post(route('items.store'), {
            onSuccess: () => {
                toast.success('Item berhasil ditambahkan');
            },
            onError: (errors: any) => {
                console.log(errors);
                toast.error('Gagal menambah item. Periksa data yang dimasukkan.');
            },
        });
    };

    const handleInventoryTypeChange = (value: string) => {
        const newType = value as 'pharmacy' | 'general';
        setInventoryType(newType);
        setData('inventory_type', newType);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Item" />
            <div className="max-w-7xl p-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Package className="h-6 w-6 text-blue-600" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Tambah Item</h1>
                                <p className="text-sm text-gray-600">Buat item baru dalam sistem inventory</p>
                            </div>
                        </div>
                        <Button 
                            variant="outline" 
                            onClick={() => router.visit(route('items.index'))}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Kembali
                        </Button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Informasi Dasar</CardTitle>
                            <CardDescription>
                                Masukkan informasi dasar item
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="code">
                                        Kode Item <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="code"
                                        value={data.code}
                                        onChange={(e) => setData('code', e.target.value)}
                                        placeholder="Masukkan kode item"
                                        className={errors.code ? 'border-red-500' : ''}
                                    />
                                    {errors.code && (
                                        <Alert variant="destructive">
                                            <AlertDescription>{errors.code}</AlertDescription>
                                        </Alert>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="name">
                                        Nama Item <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Masukkan nama item"
                                        className={errors.name ? 'border-red-500' : ''}
                                    />
                                    {errors.name && (
                                        <Alert variant="destructive">
                                            <AlertDescription>{errors.name}</AlertDescription>
                                        </Alert>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Deskripsi</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Masukkan deskripsi item"
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Tipe Inventory <span className="text-red-500">*</span></Label>
                                    <Select value={data.inventory_type} onValueChange={handleInventoryTypeChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih tipe inventory" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="general">Umum</SelectItem>
                                            <SelectItem value="pharmacy">Farmasi</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Kategori <span className="text-red-500">*</span></Label>
                                    <CategorySearchableDropdown
                                        value={data.category_id}
                                        onValueChange={(value) => setData('category_id', value)}
                                        placeholder="Pilih kategori"
                                    />
                                    {errors.category_id && <p className="text-sm text-red-500">{errors.category_id}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Departemen</Label>
                                    <DepartmentSearchableDropdown
                                        value={data.department_id}
                                        onValueChange={(value) => setData('department_id', value)}
                                        placeholder="Pilih departemen"
                                    />
                                    {errors.department_id && <p className="text-sm text-red-500">{errors.department_id}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label>Supplier</Label>
                                    <SupplierSearchableDropdown
                                        value={data.supplier_id}
                                        onValueChange={(value) => setData('supplier_id', value)}
                                        placeholder="All Suppliers"
                                    />
                                    {errors.supplier_id && <p className="text-sm text-red-500">{errors.supplier_id}</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Inventory Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Informasi Inventory</CardTitle>
                            <CardDescription>
                                Masukkan detail stok dan satuan
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="unit_of_measure">
                                        Satuan <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="unit_of_measure"
                                        value={data.unit_of_measure}
                                        onChange={(e) => setData('unit_of_measure', e.target.value)}
                                        placeholder="Contoh: Pcs, Box, Botol"
                                        className={errors.unit_of_measure ? 'border-red-500' : ''}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="pack_size">
                                        Pack Size <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="pack_size"
                                        type="number"
                                        min={1}
                                        value={data.pack_size}
                                        onChange={(e) => setData('pack_size', Number(e.target.value))}
                                        placeholder="1"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="reorder_level">Level Reorder</Label>
                                    <Input
                                        id="reorder_level"
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        value={data.reorder_level}
                                        onChange={(e) => setData('reorder_level', Number(e.target.value))}
                                        placeholder="0"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="max_level">Level Maksimum</Label>
                                    <Input
                                        id="max_level"
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        value={data.max_level}
                                        onChange={(e) => setData('max_level', Number(e.target.value))}
                                        placeholder="0"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="safety_stock">Safety Stock</Label>
                                    <Input
                                        id="safety_stock"
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        value={data.safety_stock}
                                        onChange={(e) => setData('safety_stock', Number(e.target.value))}
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="standard_cost">
                                        Harga Standar <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="standard_cost"
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        value={data.standard_cost}
                                        onChange={(e) => setData('standard_cost', Number(e.target.value))}
                                        placeholder="0"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="last_purchase_cost">Harga Pembelian Terakhir</Label>
                                    <Input
                                        id="last_purchase_cost"
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        value={data.last_purchase_cost}
                                        onChange={(e) => setData('last_purchase_cost', Number(e.target.value))}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Pengaturan</CardTitle>
                            <CardDescription>
                                Atur status dan peraturan item
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="is_active"
                                        checked={data.is_active}
                                        onCheckedChange={(checked) => setData('is_active', !!checked)}
                                    />
                                    <Label htmlFor="is_active">Item aktif</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="requires_approval"
                                        checked={data.requires_approval}
                                        onCheckedChange={(checked) => setData('requires_approval', !!checked)}
                                    />
                                    <Label htmlFor="requires_approval">Memerlukan persetujuan</Label>
                                </div>

                                {inventoryType === 'pharmacy' && (
                                    <>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="is_controlled_substance"
                                                checked={data.is_controlled_substance}
                                                onCheckedChange={(checked) => setData('is_controlled_substance', !!checked)}
                                            />
                                            <Label htmlFor="is_controlled_substance">Obat terkontrol</Label>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="requires_prescription"
                                                checked={data.requires_prescription}
                                                onCheckedChange={(checked) => setData('requires_prescription', !!checked)}
                                            />
                                            <Label htmlFor="requires_prescription">Memerlukan resep</Label>
                                        </div>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Type Specific Details */}
                    {inventoryType === 'pharmacy' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Detail Farmasi</CardTitle>
                                <CardDescription>
                                    Informasi khusus untuk item farmasi
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="bpom_registration">Registrasi BPOM</Label>
                                        <Input
                                            id="bpom_registration"
                                            value={data.bpom_registration}
                                            onChange={(e) => setData('bpom_registration', e.target.value)}
                                            placeholder="Nomor registrasi BPOM"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="manufacturer">Manufacturer</Label>
                                        <Input
                                            id="manufacturer"
                                            value={data.manufacturer}
                                            onChange={(e) => setData('manufacturer', e.target.value)}
                                            placeholder="Nama produsen"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="generic_name">Nama Generik</Label>
                                        <Input
                                            id="generic_name"
                                            value={data.generic_name}
                                            onChange={(e) => setData('generic_name', e.target.value)}
                                            placeholder="Nama generik obat"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="strength">Kekuatan</Label>
                                        <Input
                                            id="strength"
                                            value={data.strength}
                                            onChange={(e) => setData('strength', e.target.value)}
                                            placeholder="Contoh: 500mg"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="dosage_form">Bentuk Sediaan</Label>
                                        <Input
                                            id="dosage_form"
                                            value={data.dosage_form}
                                            onChange={(e) => setData('dosage_form', e.target.value)}
                                            placeholder="Contoh: Tablet, Kapsul"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Klasifikasi Obat</Label>
                                        <Select value={data.drug_classification || 'none'} onValueChange={(value) => setData('drug_classification', value === 'none' ? '' : value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih klasifikasi" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Tidak ada klasifikasi</SelectItem>
                                                <SelectItem value="narkotika">Narkotika</SelectItem>
                                                <SelectItem value="psikotropika">Psikotropika</SelectItem>
                                                <SelectItem value="keras">Keras</SelectItem>
                                                <SelectItem value="bebas_terbatas">Bebas Terbatas</SelectItem>
                                                <SelectItem value="bebas">Bebas</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {inventoryType === 'general' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Detail Umum</CardTitle>
                                <CardDescription>
                                    Informasi khusus untuk item umum
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="is_consumable"
                                            checked={data.is_consumable}
                                            onCheckedChange={(checked) => setData('is_consumable', !!checked)}
                                        />
                                        <Label htmlFor="is_consumable">Item habis pakai</Label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="is_returnable"
                                            checked={data.is_returnable}
                                            onCheckedChange={(checked) => setData('is_returnable', !!checked)}
                                        />
                                        <Label htmlFor="is_returnable">Dapat dikembalikan</Label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="requires_maintenance"
                                            checked={data.requires_maintenance}
                                            onCheckedChange={(checked) => setData('requires_maintenance', !!checked)}
                                        />
                                        <Label htmlFor="requires_maintenance">Memerlukan maintenance</Label>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="warranty_months">Garansi (Bulan)</Label>
                                    <Input
                                        id="warranty_months"
                                        type="number"
                                        min={0}
                                        value={data.warranty_months}
                                        onChange={(e) => setData('warranty_months', Number(e.target.value))}
                                        placeholder="0"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="usage_instructions">Instruksi Penggunaan</Label>
                                    <Textarea
                                        id="usage_instructions"
                                        value={data.usage_instructions}
                                        onChange={(e) => setData('usage_instructions', e.target.value)}
                                        placeholder="Masukkan instruksi penggunaan"
                                        rows={3}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <div className="flex justify-end gap-3">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => router.visit(route('items.index'))}
                        >
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing && <Save className="mr-2 h-4 w-4 animate-spin" />}
                            Simpan
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
