import React from 'react';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, Package, Settings, Shield, User, Eye, FileText } from 'lucide-react';
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
        title: 'Detail',
        href: '#',
    },
];

interface Category {
    id: number;
    name: string;
    code: string;
}

interface Item {
    id: number;
    name: string;
    code: string;
    description?: string;
    category: Category;
    inventory_type: 'pharmacy' | 'general';
    unit_of_measure: string;
    pack_size?: number;
    standard_cost?: number;
    is_active: boolean;
    requires_approval: boolean;
    is_controlled_substance: boolean;
    requires_prescription: boolean;
    reorder_level: number;
    max_level?: number;
    safety_stock?: number;
    created_at: string;
    updated_at: string;
    pharmacy_details?: {
        generic_name?: string;
        brand_name?: string;
        strength?: string;
        dosage_form?: string;
        route_of_administration?: string;
        manufacturer?: string;
        registration_number?: string;
        therapeutic_class?: string;
        indication?: string;
        contraindication?: string;
        side_effects?: string;
        dosage_instructions?: string;
        storage_conditions?: string;
        pregnancy_category?: string;
        is_narcotic?: boolean;
        is_psychotropic?: boolean;
        max_dispensing_quantity?: number;
    };
    general_details?: {
        brand?: string;
        model?: string;
        serial_number?: string;
        warranty_period?: number;
        warranty_start_date?: string;
        supplier_part_number?: string;
        manufacturer_part_number?: string;
        color?: string;
        size?: string;
        weight?: number;
        material?: string;
        country_of_origin?: string;
    };
}

interface Props extends PageProps {
    item: Item;
}

export default function ShowItem({ item }: Props) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detail Item - ${item.name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                            Detail Item: {item.name}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Kode: {item.code} • Kategori: {item.category.name}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            onClick={() => router.visit(`/inventory/items/${item.id}/edit`)}
                        >
                            <Settings className="h-4 w-4 mr-2" />
                            Edit
                        </Button>
                        <Button 
                            variant="outline" 
                            onClick={() => router.visit('/inventory/items')}
                        >
                            ← Back to Items
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Quick Stats */}
                    <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Status</p>
                                        <Badge variant={item.is_active ? 'default' : 'secondary'}>
                                            {item.is_active ? 'Aktif' : 'Tidak Aktif'}
                                        </Badge>
                                    </div>
                                    <Shield className="h-8 w-8 text-green-600" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Tipe Item</p>
                                        <p className="text-lg font-semibold">
                                            {item.inventory_type === 'pharmacy' ? 'Farmasi' : 'Umum'}
                                        </p>
                                    </div>
                                    <Package className="h-8 w-8 text-blue-600" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Reorder Level</p>
                                        <p className="text-lg font-semibold">{item.reorder_level} {item.unit_of_measure}</p>
                                    </div>
                                    <Eye className="h-8 w-8 text-yellow-600" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Standard Cost</p>
                                        <p className="text-lg font-semibold">
                                            {item.standard_cost ? formatCurrency(item.standard_cost) : '-'}
                                        </p>
                                    </div>
                                    <FileText className="h-8 w-8 text-purple-600" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-4">
                        <Tabs defaultValue="basic" className="w-full">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="basic">Informasi Dasar</TabsTrigger>
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
                                            Detail informasi dasar item inventori
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-sm font-medium text-gray-600">Nama Item</label>
                                                    <p className="text-lg">{item.name}</p>
                                                </div>
                                                
                                                <div>
                                                    <label className="text-sm font-medium text-gray-600">Kode Item</label>
                                                    <p className="text-lg font-mono">{item.code}</p>
                                                </div>
                                                
                                                <div>
                                                    <label className="text-sm font-medium text-gray-600">Kategori</label>
                                                    <p className="text-lg">{item.category.name} ({item.category.code})</p>
                                                </div>
                                                
                                                <div>
                                                    <label className="text-sm font-medium text-gray-600">Tipe Inventori</label>
                                                    <p className="text-lg">
                                                        {item.inventory_type === 'pharmacy' ? 'Farmasi' : 'Umum'}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-sm font-medium text-gray-600">Satuan</label>
                                                    <p className="text-lg">{item.unit_of_measure}</p>
                                                </div>
                                                
                                                <div>
                                                    <label className="text-sm font-medium text-gray-600">Ukuran Pack</label>
                                                    <p className="text-lg">{item.pack_size || '-'}</p>
                                                </div>
                                                
                                                <div>
                                                    <label className="text-sm font-medium text-gray-600">Biaya Standar</label>
                                                    <p className="text-lg">
                                                        {item.standard_cost ? formatCurrency(item.standard_cost) : '-'}
                                                    </p>
                                                </div>
                                                
                                                <div>
                                                    <label className="text-sm font-medium text-gray-600">Dibuat</label>
                                                    <p className="text-lg">{formatDate(item.created_at)}</p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {item.description && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-600">Deskripsi</label>
                                                <p className="text-lg mt-1">{item.description}</p>
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-600">Status & Pengaturan</label>
                                            <div className="flex flex-wrap gap-2">
                                                <Badge variant={item.is_active ? 'default' : 'secondary'}>
                                                    {item.is_active ? 'Aktif' : 'Tidak Aktif'}
                                                </Badge>
                                                {item.requires_approval && (
                                                    <Badge variant="outline">Perlu Persetujuan</Badge>
                                                )}
                                                {item.is_controlled_substance && (
                                                    <Badge variant="destructive">Zat Terkontrol</Badge>
                                                )}
                                                {item.requires_prescription && (
                                                    <Badge variant="secondary">Perlu Resep</Badge>
                                                )}
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
                                            Pengaturan level stok dan reorder
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-600">Reorder Level</label>
                                                <p className="text-2xl font-semibold text-yellow-600">
                                                    {item.reorder_level} {item.unit_of_measure}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    Level minimum untuk pemesanan ulang
                                                </p>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-600">Maximum Level</label>
                                                <p className="text-2xl font-semibold text-blue-600">
                                                    {item.max_level ? `${item.max_level} ${item.unit_of_measure}` : '-'}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    Level maksimum stok
                                                </p>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-600">Safety Stock</label>
                                                <p className="text-2xl font-semibold text-green-600">
                                                    {item.safety_stock ? `${item.safety_stock} ${item.unit_of_measure}` : '-'}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    Stok pengaman
                                                </p>
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
                                            Informasi khusus untuk item farmasi
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {item.inventory_type === 'pharmacy' && item.pharmacy_details ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {item.pharmacy_details.generic_name && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600">Nama Generik</label>
                                                        <p className="text-lg">{item.pharmacy_details.generic_name}</p>
                                                    </div>
                                                )}
                                                
                                                {item.pharmacy_details.brand_name && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600">Nama Brand</label>
                                                        <p className="text-lg">{item.pharmacy_details.brand_name}</p>
                                                    </div>
                                                )}
                                                
                                                {item.pharmacy_details.strength && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600">Kekuatan</label>
                                                        <p className="text-lg">{item.pharmacy_details.strength}</p>
                                                    </div>
                                                )}
                                                
                                                {item.pharmacy_details.dosage_form && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600">Bentuk Sediaan</label>
                                                        <p className="text-lg capitalize">{item.pharmacy_details.dosage_form}</p>
                                                    </div>
                                                )}
                                                
                                                {item.pharmacy_details.route_of_administration && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600">Rute Pemberian</label>
                                                        <p className="text-lg">{item.pharmacy_details.route_of_administration}</p>
                                                    </div>
                                                )}
                                                
                                                {item.pharmacy_details.manufacturer && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600">Pabrik</label>
                                                        <p className="text-lg">{item.pharmacy_details.manufacturer}</p>
                                                    </div>
                                                )}
                                                
                                                {item.pharmacy_details.registration_number && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600">No. Registrasi</label>
                                                        <p className="text-lg font-mono">{item.pharmacy_details.registration_number}</p>
                                                    </div>
                                                )}
                                                
                                                {item.pharmacy_details.therapeutic_class && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600">Kelas Terapi</label>
                                                        <p className="text-lg">{item.pharmacy_details.therapeutic_class}</p>
                                                    </div>
                                                )}
                                                
                                                {item.pharmacy_details.max_dispensing_quantity && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600">Maksimal Dispensing</label>
                                                        <p className="text-lg">{item.pharmacy_details.max_dispensing_quantity} {item.unit_of_measure}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <p>Detail farmasi tidak tersedia untuk item ini.</p>
                                                <p>Item ini bukan merupakan item farmasi atau belum memiliki detail farmasi.</p>
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
                                            Informasi khusus untuk item umum
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {item.inventory_type === 'general' && item.general_details ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {item.general_details.brand && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600">Brand</label>
                                                        <p className="text-lg">{item.general_details.brand}</p>
                                                    </div>
                                                )}
                                                
                                                {item.general_details.model && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600">Model</label>
                                                        <p className="text-lg">{item.general_details.model}</p>
                                                    </div>
                                                )}
                                                
                                                {item.general_details.serial_number && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600">Serial Number</label>
                                                        <p className="text-lg font-mono">{item.general_details.serial_number}</p>
                                                    </div>
                                                )}
                                                
                                                {item.general_details.warranty_period && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600">Periode Garansi</label>
                                                        <p className="text-lg">{item.general_details.warranty_period} bulan</p>
                                                    </div>
                                                )}
                                                
                                                {item.general_details.warranty_start_date && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600">Mulai Garansi</label>
                                                        <p className="text-lg">{formatDate(item.general_details.warranty_start_date)}</p>
                                                    </div>
                                                )}
                                                
                                                {item.general_details.supplier_part_number && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600">Part Number Supplier</label>
                                                        <p className="text-lg font-mono">{item.general_details.supplier_part_number}</p>
                                                    </div>
                                                )}
                                                
                                                {item.general_details.manufacturer_part_number && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600">Part Number Pabrik</label>
                                                        <p className="text-lg font-mono">{item.general_details.manufacturer_part_number}</p>
                                                    </div>
                                                )}
                                                
                                                {item.general_details.color && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600">Warna</label>
                                                        <p className="text-lg">{item.general_details.color}</p>
                                                    </div>
                                                )}
                                                
                                                {item.general_details.size && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600">Ukuran</label>
                                                        <p className="text-lg">{item.general_details.size}</p>
                                                    </div>
                                                )}
                                                
                                                {item.general_details.weight && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600">Berat</label>
                                                        <p className="text-lg">{item.general_details.weight} kg</p>
                                                    </div>
                                                )}
                                                
                                                {item.general_details.material && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600">Material</label>
                                                        <p className="text-lg">{item.general_details.material}</p>
                                                    </div>
                                                )}
                                                
                                                {item.general_details.country_of_origin && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-600">Negara Asal</label>
                                                        <p className="text-lg">{item.general_details.country_of_origin}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <p>Detail umum tidak tersedia untuk item ini.</p>
                                                <p>Item ini bukan merupakan item umum atau belum memiliki detail umum.</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
