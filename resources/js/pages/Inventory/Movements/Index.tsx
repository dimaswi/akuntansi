import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
];

interface Location {
    id: number;
    name: string;
    code: string;
}

interface Movement {
    id: number;
    movement_number: string;
    item_name: string;
    item_code: string;
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
}

interface Props extends PageProps {
    movements: {
        data: Movement[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    locations: Location[];
    filters: {
        search?: string;
        movement_type?: string;
        location?: string;
        date_from?: string;
        date_to?: string;
    };
}

export default function MovementIndex({ movements, locations, filters }: Props) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [movementTypeFilter, setMovementTypeFilter] = useState(filters.movement_type || 'all');
    const [locationFilter, setLocationFilter] = useState(filters.location || 'all');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [showFilters, setShowFilters] = useState(false);

    const handleSearch = () => {
        router.get('/inventory/stock-movements', {
            search: searchTerm,
            movement_type: movementTypeFilter !== 'all' ? movementTypeFilter : undefined,
            location: locationFilter !== 'all' ? locationFilter : undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
        }, {
            preserveState: true,
            replace: true
        });
    };

    const handlePageChange = (page: number) => {
        router.get('/inventory/stock-movements', {
            ...filters,
            page
        }, {
            preserveState: true,
            replace: true
        });
    };

    const handleDelete = (movementId: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus perpindahan stok ini?')) {
            router.delete(`/inventory/stock-movements/${movementId}`);
        }
    };

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
            <Head title="Perpindahan Stok" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                {/* Header Section */}
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Perpindahan Stok
                    </h2>
                    <Button onClick={() => router.visit('/inventory/stock-movements/create')}>
                        ➕ Tambah Perpindahan
                    </Button>
                </div>

                {/* Search and Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Input
                                        placeholder="🔍 Cari berdasarkan nomor, barang, atau lokasi..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button 
                                        variant="outline" 
                                        onClick={() => setShowFilters(!showFilters)}
                                    >
                                        🔧 Filter
                                    </Button>
                                    <Button onClick={handleSearch}>
                                        🔍 Cari
                                    </Button>
                                </div>
                            </div>

                            {showFilters && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
                                    <Select value={movementTypeFilter} onValueChange={setMovementTypeFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Filter berdasarkan jenis" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Jenis</SelectItem>
                                            <SelectItem value="stock_in">Stok Masuk</SelectItem>
                                            <SelectItem value="stock_out">Stok Keluar</SelectItem>
                                            <SelectItem value="transfer_in">Transfer Masuk</SelectItem>
                                            <SelectItem value="transfer_out">Transfer Keluar</SelectItem>
                                            <SelectItem value="adjustment_plus">Penyesuaian (+)</SelectItem>
                                            <SelectItem value="adjustment_minus">Penyesuaian (-)</SelectItem>
                                            <SelectItem value="return">Retur</SelectItem>
                                            <SelectItem value="disposal">Disposal</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select value={locationFilter} onValueChange={setLocationFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Filter berdasarkan lokasi" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Lokasi</SelectItem>
                                            {locations.map((location) => (
                                                <SelectItem key={location.id} value={location.id.toString()}>
                                                    {location.name} ({location.code})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Input
                                        type="date"
                                        placeholder="Tanggal Dari"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                    />

                                    <Input
                                        type="date"
                                        placeholder="Tanggal Sampai"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Movements List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Perpindahan Stok ({movements.total})</CardTitle>
                        <CardDescription>Kelola perpindahan dan pergerakan stok inventori</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {movements.data.map((movement) => (
                                <div key={movement.id} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-medium">{movement.movement_number}</h3>
                                                    <Badge className={getMovementTypeColor(movement.movement_type)}>
                                                        {getMovementTypeLabel(movement.movement_type)}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    Barang: {movement.item_name} ({movement.item_code}) • 
                                                    Lokasi: {movement.location_name}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    Jenis Transaksi: {getTransactionTypeLabel(movement.transaction_type)}
                                                </p>
                                                {movement.batch_number && (
                                                    <p className="text-sm text-blue-600 mt-1">
                                                        Batch: {movement.batch_number}
                                                        {movement.expiry_date && ` • Kedaluwarsa: ${new Date(movement.expiry_date).toLocaleDateString('id-ID')}`}
                                                    </p>
                                                )}
                                                {movement.notes && (
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        Catatan: {movement.notes}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-sm font-medium">
                                                Kuantitas: {movement.quantity}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Biaya: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(movement.total_cost)}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Tanggal: {new Date(movement.movement_date).toLocaleDateString('id-ID')}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Dibuat: {movement.created_by_name}
                                            </p>
                                            {movement.approved_by_name && (
                                                <p className="text-sm text-green-600">
                                                    Disetujui: {movement.approved_by_name}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Button 
                                                size="sm" 
                                                variant="outline"
                                                onClick={() => router.visit(`/inventory/stock-movements/${movement.id}`)}
                                            >
                                                👁️
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                variant="outline"
                                                onClick={() => handleDelete(movement.id)}
                                            >
                                                🗑️
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            {movements.data.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    {searchTerm || movementTypeFilter !== 'all' || locationFilter !== 'all' || dateFrom || dateTo
                                        ? 'Tidak ada perpindahan stok yang sesuai dengan filter Anda.' 
                                        : 'Belum ada perpindahan stok yang dicatat.'}
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {movements.last_page > 1 && (
                            <div className="flex justify-center gap-2 mt-6">
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    disabled={movements.current_page === 1}
                                    onClick={() => handlePageChange(movements.current_page - 1)}
                                >
                                    ← Sebelumnya
                                </Button>
                                
                                {Array.from({ length: Math.min(5, movements.last_page) }, (_, i) => {
                                    const page = i + 1;
                                    return (
                                        <Button
                                            key={page}
                                            variant={movements.current_page === page ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => handlePageChange(page)}
                                        >
                                            {page}
                                        </Button>
                                    );
                                })}
                                
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    disabled={movements.current_page === movements.last_page}
                                    onClick={() => handlePageChange(movements.current_page + 1)}
                                >
                                    Selanjutnya →
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
