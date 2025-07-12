import React from 'react';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { PageProps, BreadcrumbItem } from '@/types';

interface Movement {
    id: number;
    movement_number: string;
    item_name: string;
    item_code: string;
    unit_of_measure: string;
    location_name: string;
    location_code: string;
    movement_type: string;
    transaction_type: string;
    quantity: number;
    unit_cost: number;
    total_cost: number;
    movement_date: string;
    batch_number?: string;
    expiry_date?: string;
    notes?: string;
    created_by_name: string;
    approved_by_name?: string;
    approved_at?: string;
    created_at: string;
    updated_at: string;
}

interface Props extends PageProps {
    movement: Movement;
}

export default function ShowMovement({ movement }: Props) {
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
            title: movement.movement_number,
            href: '#',
        },
    ];

    const getMovementTypeLabel = (type: string) => {
        const types: { [key: string]: string } = {
            'stock_in': 'Stok Masuk',
            'stock_out': 'Stok Keluar',
            'transfer_in': 'Transfer Masuk',
            'transfer_out': 'Transfer Keluar',
            'adjustment_plus': 'Penyesuaian (+)',
            'adjustment_minus': 'Penyesuaian (-)',
            'return': 'Retur',
            'disposal': 'Disposal'
        };
        return types[type] || type;
    };

    const getMovementTypeColor = (type: string) => {
        const colors: { [key: string]: string } = {
            'stock_in': 'bg-green-100 text-green-800',
            'stock_out': 'bg-red-100 text-red-800',
            'transfer_in': 'bg-blue-100 text-blue-800',
            'transfer_out': 'bg-orange-100 text-orange-800',
            'adjustment_plus': 'bg-emerald-100 text-emerald-800',
            'adjustment_minus': 'bg-amber-100 text-amber-800',
            'return': 'bg-purple-100 text-purple-800',
            'disposal': 'bg-gray-100 text-gray-800'
        };
        return colors[type] || 'bg-gray-100 text-gray-800';
    };

    const getTransactionTypeLabel = (type: string) => {
        const types: { [key: string]: string } = {
            'purchase_receipt': 'Penerimaan Pembelian',
            'sales_issue': 'Pengeluaran Penjualan',
            'department_requisition': 'Permintaan Departemen',
            'inter_location_transfer': 'Transfer Antar Lokasi',
            'stock_adjustment': 'Penyesuaian Stok',
            'stock_count': 'Opname Stok',
            'expired_disposal': 'Disposal Kedaluwarsa',
            'damage_writeoff': 'Hapus Buku Rusak',
            'return_to_supplier': 'Retur ke Supplier'
        };
        return types[type] || type;
    };

    const Layout = ({ children }: { children: React.ReactNode }) => (
        <AppLayout breadcrumbs={breadcrumbs}>
            {children}
        </AppLayout>
    );

    return (
        <Layout>
            <Head title={`Detail Perpindahan - ${movement.movement_number}`} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                            Detail Perpindahan Stok
                        </h2>
                        <p className="text-gray-600">{movement.movement_number}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            variant="outline"
                            onClick={() => router.visit('/inventory/stock-movements')}
                        >
                            ← Kembali
                        </Button>
                        <Button 
                            variant="outline"
                            onClick={() => window.print()}
                        >
                            🖨️ Cetak
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Information */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Movement Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    Informasi Perpindahan
                                    <Badge className={getMovementTypeColor(movement.movement_type)}>
                                        {getMovementTypeLabel(movement.movement_type)}
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Nomor Perpindahan</label>
                                        <p className="text-lg font-semibold">{movement.movement_number}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Tanggal Perpindahan</label>
                                        <p className="text-lg">{new Date(movement.movement_date).toLocaleDateString('id-ID', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Jenis Perpindahan</label>
                                        <p className="text-lg">{getMovementTypeLabel(movement.movement_type)}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Jenis Transaksi</label>
                                        <p className="text-lg">{getTransactionTypeLabel(movement.transaction_type)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Item Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Informasi Barang</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Nama Barang</label>
                                        <p className="text-lg font-semibold">{movement.item_name}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Kode Barang</label>
                                        <p className="text-lg">{movement.item_code}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Kuantitas</label>
                                        <p className="text-lg font-semibold text-blue-600">
                                            {movement.quantity} {movement.unit_of_measure}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Lokasi</label>
                                        <p className="text-lg">{movement.location_name} ({movement.location_code})</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Cost Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Informasi Biaya</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Biaya per Unit</label>
                                        <p className="text-lg">
                                            {new Intl.NumberFormat('id-ID', { 
                                                style: 'currency', 
                                                currency: 'IDR' 
                                            }).format(movement.unit_cost)}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Total Biaya</label>
                                        <p className="text-lg font-semibold text-green-600">
                                            {new Intl.NumberFormat('id-ID', { 
                                                style: 'currency', 
                                                currency: 'IDR' 
                                            }).format(movement.total_cost)}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Additional Information */}
                        {(movement.batch_number || movement.expiry_date || movement.notes) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Informasi Tambahan</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {movement.batch_number && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Nomor Batch</label>
                                            <p className="text-lg">{movement.batch_number}</p>
                                        </div>
                                    )}
                                    {movement.expiry_date && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Tanggal Kedaluwarsa</label>
                                            <p className="text-lg">
                                                {new Date(movement.expiry_date).toLocaleDateString('id-ID', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    )}
                                    {movement.notes && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Catatan</label>
                                            <p className="text-lg">{movement.notes}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar Information */}
                    <div className="space-y-6">
                        {/* Status */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Status</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Badge className={getMovementTypeColor(movement.movement_type)}>
                                        {getMovementTypeLabel(movement.movement_type)}
                                    </Badge>
                                </div>
                                {movement.approved_by_name ? (
                                    <div className="p-3 bg-green-50 rounded-lg">
                                        <p className="text-sm font-medium text-green-800">Telah Disetujui</p>
                                        <p className="text-sm text-green-600">
                                            oleh {movement.approved_by_name}
                                        </p>
                                        <p className="text-xs text-green-500">
                                            {new Date(movement.approved_at!).toLocaleDateString('id-ID')}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="p-3 bg-yellow-50 rounded-lg">
                                        <p className="text-sm font-medium text-yellow-800">Menunggu Persetujuan</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Audit Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Informasi Audit</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Dibuat Oleh</label>
                                    <p className="text-sm">{movement.created_by_name}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Tanggal Dibuat</label>
                                    <p className="text-sm">
                                        {new Date(movement.created_at).toLocaleString('id-ID')}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Terakhir Diubah</label>
                                    <p className="text-sm">
                                        {new Date(movement.updated_at).toLocaleString('id-ID')}
                                    </p>
                                </div>
                                {movement.approved_by_name && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Disetujui Oleh</label>
                                        <p className="text-sm">{movement.approved_by_name}</p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(movement.approved_at!).toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Aksi</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Button 
                                    className="w-full" 
                                    variant="outline"
                                    onClick={() => window.print()}
                                >
                                    🖨️ Cetak Detail
                                </Button>
                                <Button 
                                    className="w-full" 
                                    variant="outline"
                                    onClick={() => router.visit('/inventory/stock-movements')}
                                >
                                    📋 Lihat Semua Perpindahan
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
