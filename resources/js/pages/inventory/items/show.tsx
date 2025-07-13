import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Package, ArrowLeft, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { route } from 'ziggy-js';

interface Item {
    id: number;
    code: string;
    name: string;
    description?: string;
    inventory_type: 'pharmacy' | 'general';
    unit_of_measure: string;
    pack_size: number;
    reorder_level: number;
    max_level: number;
    safety_stock: number;
    standard_cost: number;
    last_purchase_cost?: number;
    is_active: boolean;
    requires_approval: boolean;
    is_controlled_substance: boolean;
    requires_prescription: boolean;
    category?: {
        id: number;
        name: string;
    };
    department?: {
        id: number;
        name: string;
    };
    supplier?: {
        id: number;
        name: string;
    };
    pharmacy_detail?: {
        bpom_registration?: string;
        manufacturer?: string;
        generic_name?: string;
        strength?: string;
        dosage_form?: string;
        drug_classification?: string;
        atc_code?: string;
        contraindications?: string;
        drug_interactions?: any;
        storage_temp_min?: number;
        storage_temp_max?: number;
        minimum_expiry_months?: number;
    };
    general_detail?: {
        is_consumable: boolean;
        is_returnable: boolean;
        requires_maintenance: boolean;
        warranty_months?: number;
        usage_instructions?: string;
        department_restrictions?: any;
    };
    created_at: string;
    updated_at: string;
}

interface Props {
    item: Item;
}

export default function ShowItem() {
    const { item }: Props = usePage().props as any;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: "Inventory", href: "#" },
        { title: "Items", href: "/items" },
        { title: item.name, href: "#" },
    ];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detail Item - ${item.name}`} />
            <div className="max-w-7xl p-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Package className="h-6 w-6 text-blue-600" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{item.name}</h1>
                                <p className="text-sm text-gray-600">{item.code}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                onClick={() => router.visit(route('items.index'))}
                                className="flex items-center gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Kembali
                            </Button>
                            <Button 
                                onClick={() => router.visit(route('items.edit', item.id))}
                                className="flex items-center gap-2"
                            >
                                <Edit className="h-4 w-4" />
                                Edit
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Informasi Dasar</CardTitle>
                            <CardDescription>
                                Detail umum tentang item
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Kode Item</p>
                                    <p className="text-sm font-mono">{item.code}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Tipe Inventory</p>
                                    <Badge variant={item.inventory_type === 'pharmacy' ? 'default' : 'secondary'}>
                                        {item.inventory_type === 'pharmacy' ? 'Farmasi' : 'Umum'}
                                    </Badge>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-gray-500">Nama Item</p>
                                <p className="text-sm">{item.name}</p>
                            </div>

                            {item.description && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Deskripsi</p>
                                    <p className="text-sm">{item.description}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Kategori</p>
                                    <p className="text-sm">{item.category?.name || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Departemen</p>
                                    <p className="text-sm">{item.department?.name || '-'}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-gray-500">Supplier</p>
                                <p className="text-sm">{item.supplier?.name || '-'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Status & Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Status & Pengaturan</CardTitle>
                            <CardDescription>
                                Status aktif dan pengaturan khusus
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2">
                                    {item.is_active ? (
                                        <>
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                            <span className="text-sm text-green-700">Aktif</span>
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="h-4 w-4 text-red-600" />
                                            <span className="text-sm text-red-700">Tidak Aktif</span>
                                        </>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {item.requires_approval ? (
                                        <>
                                            <CheckCircle className="h-4 w-4 text-orange-600" />
                                            <span className="text-sm text-orange-700">Perlu Approval</span>
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="h-4 w-4 text-gray-600" />
                                            <span className="text-sm text-gray-700">Tidak Perlu Approval</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {item.inventory_type === 'pharmacy' && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        {item.is_controlled_substance ? (
                                            <>
                                                <CheckCircle className="h-4 w-4 text-red-600" />
                                                <span className="text-sm text-red-700">Obat Terkontrol</span>
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="h-4 w-4 text-gray-600" />
                                                <span className="text-sm text-gray-700">Bukan Obat Terkontrol</span>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {item.requires_prescription ? (
                                            <>
                                                <CheckCircle className="h-4 w-4 text-yellow-600" />
                                                <span className="text-sm text-yellow-700">Perlu Resep</span>
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="h-4 w-4 text-gray-600" />
                                                <span className="text-sm text-gray-700">Bebas</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div>
                                <p className="text-sm font-medium text-gray-500">Dibuat</p>
                                <p className="text-sm">{formatDate(item.created_at)}</p>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-gray-500">Terakhir Diupdate</p>
                                <p className="text-sm">{formatDate(item.updated_at)}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Inventory Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Informasi Inventory</CardTitle>
                            <CardDescription>
                                Detail stok, satuan, dan harga
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Satuan</p>
                                    <p className="text-sm">{item.unit_of_measure}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Pack Size</p>
                                    <p className="text-sm">{item.pack_size}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Reorder Level</p>
                                    <p className="text-sm">{item.reorder_level}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Max Level</p>
                                    <p className="text-sm">{item.max_level}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Safety Stock</p>
                                    <p className="text-sm">{item.safety_stock}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Harga Standar</p>
                                    <p className="text-sm font-semibold text-blue-600">{formatCurrency(item.standard_cost)}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Harga Pembelian Terakhir</p>
                                    <p className="text-sm font-semibold text-green-600">
                                        {item.last_purchase_cost ? formatCurrency(item.last_purchase_cost) : '-'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Type Specific Details */}
                    {item.inventory_type === 'pharmacy' && item.pharmacy_detail && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Detail Farmasi</CardTitle>
                                <CardDescription>
                                    Informasi khusus farmasi
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Registrasi BPOM</p>
                                        <p className="text-sm">{item.pharmacy_detail.bpom_registration || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Manufacturer</p>
                                        <p className="text-sm">{item.pharmacy_detail.manufacturer || '-'}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Nama Generik</p>
                                        <p className="text-sm">{item.pharmacy_detail.generic_name || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Kekuatan</p>
                                        <p className="text-sm">{item.pharmacy_detail.strength || '-'}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Bentuk Sediaan</p>
                                        <p className="text-sm">{item.pharmacy_detail.dosage_form || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Klasifikasi Obat</p>
                                        <p className="text-sm">
                                            {item.pharmacy_detail.drug_classification ? (
                                                <Badge variant="outline">
                                                    {item.pharmacy_detail.drug_classification}
                                                </Badge>
                                            ) : '-'}
                                        </p>
                                    </div>
                                </div>

                                {item.pharmacy_detail.atc_code && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">ATC Code</p>
                                        <p className="text-sm font-mono">{item.pharmacy_detail.atc_code}</p>
                                    </div>
                                )}

                                {item.pharmacy_detail.contraindications && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Kontraindikasi</p>
                                        <p className="text-sm">{item.pharmacy_detail.contraindications}</p>
                                    </div>
                                )}

                                {(item.pharmacy_detail.storage_temp_min || item.pharmacy_detail.storage_temp_max) && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Suhu Penyimpanan</p>
                                        <p className="text-sm">
                                            {item.pharmacy_detail.storage_temp_min}°C - {item.pharmacy_detail.storage_temp_max}°C
                                        </p>
                                    </div>
                                )}

                                {item.pharmacy_detail.minimum_expiry_months && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Minimum Expiry</p>
                                        <p className="text-sm">{item.pharmacy_detail.minimum_expiry_months} bulan</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {item.inventory_type === 'general' && item.general_detail && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Detail Umum</CardTitle>
                                <CardDescription>
                                    Informasi khusus item umum
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        {item.general_detail.is_consumable ? (
                                            <>
                                                <CheckCircle className="h-4 w-4 text-blue-600" />
                                                <span className="text-sm text-blue-700">Item Habis Pakai</span>
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="h-4 w-4 text-gray-600" />
                                                <span className="text-sm text-gray-700">Item Tidak Habis Pakai</span>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {item.general_detail.is_returnable ? (
                                            <>
                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                                <span className="text-sm text-green-700">Dapat Dikembalikan</span>
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="h-4 w-4 text-gray-600" />
                                                <span className="text-sm text-gray-700">Tidak Dapat Dikembalikan</span>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {item.general_detail.requires_maintenance ? (
                                            <>
                                                <CheckCircle className="h-4 w-4 text-orange-600" />
                                                <span className="text-sm text-orange-700">Perlu Maintenance</span>
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="h-4 w-4 text-gray-600" />
                                                <span className="text-sm text-gray-700">Tidak Perlu Maintenance</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {item.general_detail.warranty_months && item.general_detail.warranty_months > 0 ? (
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Garansi</p>
                                        <p className="text-sm">{item.general_detail.warranty_months} bulan</p>
                                    </div>
                                ) : 
                                <div>
                                        <p className="text-sm font-medium text-gray-500">Garansi</p>
                                        <p className="text-sm">0 bulan</p>
                                    </div>
                                }

                                {item.general_detail.usage_instructions ? (
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Instruksi Penggunaan</p>
                                        <p className="text-sm">{item.general_detail.usage_instructions}</p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Instruksi Penggunaan</p>
                                        <p className="text-sm">Tidak ada instruksi penggunaan</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
