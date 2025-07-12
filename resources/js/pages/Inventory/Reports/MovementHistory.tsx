import React, { useState, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Download, Filter, RefreshCw, Search, TrendingUp, TrendingDown } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { PageProps, BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: route('dashboard'),
    },
    {
        title: 'Inventori',
        href: route('inventory.dashboard'),
    },
    {
        title: 'Laporan',
        href: route('inventory.reports.index'),
    },
    {
        title: 'Riwayat Perpindahan',
        href: route('inventory.reports.movement-history'),
    },
];

interface MovementRecord {
    id: number;
    date: string;
    time: string;
    item_name: string;
    item_code: string;
    movement_type: 'in' | 'out' | 'transfer' | 'adjustment';
    quantity: number;
    unit: string;
    from_location?: string;
    to_location: string;
    reference_number: string;
    reference_type: 'purchase' | 'sale' | 'transfer' | 'adjustment' | 'return';
    user: string;
    notes?: string;
    cost_per_unit: number;
    total_value: number;
}

interface Props extends PageProps {
    movements?: MovementRecord[];
    filters?: {
        search?: string;
        movement_type?: string;
        location?: string;
        date_from?: string;
        date_to?: string;
        reference_type?: string;
    };
}

export default function MovementHistory({ movements = [], filters = {} }: Props) {
    const [localFilters, setLocalFilters] = useState(filters);
    const [isLoading, setIsLoading] = useState(false);
    const [dateFrom, setDateFrom] = useState<string>(filters.date_from || '');
    const [dateTo, setDateTo] = useState<string>(filters.date_to || '');
    const exportButtonRef = useRef<HTMLButtonElement>(null);

    // Mock data if no movements provided
    const mockMovements: MovementRecord[] = [
        {
            id: 1,
            date: '2024-01-15',
            time: '10:30:00',
            item_name: 'Laptop Dell Inspiron',
            item_code: 'LPT-001',
            movement_type: 'in',
            quantity: 10,
            unit: 'Unit',
            to_location: 'Gudang Utama',
            reference_number: 'PO-2024-001',
            reference_type: 'purchase',
            user: 'Admin',
            notes: 'Pembelian dari supplier PT. Teknologi Maju',
            cost_per_unit: 15000000,
            total_value: 150000000
        },
        {
            id: 2,
            date: '2024-01-15',
            time: '14:20:00',
            item_name: 'Mouse Wireless Logitech',
            item_code: 'MSE-002',
            movement_type: 'out',
            quantity: 5,
            unit: 'Unit',
            from_location: 'Gudang Utama',
            to_location: 'Toko',
            reference_number: 'SO-2024-002',
            reference_type: 'sale',
            user: 'Kasir 1',
            cost_per_unit: 250000,
            total_value: 1250000
        },
        {
            id: 3,
            date: '2024-01-14',
            time: '16:45:00',
            item_name: 'Kertas A4 Sidu',
            item_code: 'PPR-003',
            movement_type: 'transfer',
            quantity: 20,
            unit: 'Rim',
            from_location: 'Gudang Utama',
            to_location: 'Gudang B',
            reference_number: 'TRF-2024-001',
            reference_type: 'transfer',
            user: 'Supervisor',
            notes: 'Transfer untuk kebutuhan kantor cabang',
            cost_per_unit: 60000,
            total_value: 1200000
        },
        {
            id: 4,
            date: '2024-01-14',
            time: '09:15:00',
            item_name: 'Tinta Printer Canon',
            item_code: 'INK-004',
            movement_type: 'adjustment',
            quantity: -5,
            unit: 'Cartridge',
            to_location: 'Gudang Utama',
            reference_number: 'ADJ-2024-001',
            reference_type: 'adjustment',
            user: 'Admin',
            notes: 'Penyesuaian stok karena kerusakan',
            cost_per_unit: 300000,
            total_value: -1500000
        }
    ];

    const displayMovements = movements.length > 0 ? movements : mockMovements;

    const getMovementBadge = (type: string) => {
        const typeConfig = {
            in: { color: 'bg-green-100 text-green-800', label: 'Masuk', icon: <TrendingUp className="w-3 h-3" /> },
            out: { color: 'bg-red-100 text-red-800', label: 'Keluar', icon: <TrendingDown className="w-3 h-3" /> },
            transfer: { color: 'bg-blue-100 text-blue-800', label: 'Transfer', icon: '↔️' },
            adjustment: { color: 'bg-yellow-100 text-yellow-800', label: 'Penyesuaian', icon: '⚙️' }
        };
        
        const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.in;
        return (
            <Badge className={config.color}>
                <span className="flex items-center gap-1">
                    {config.icon}
                    {config.label}
                </span>
            </Badge>
        );
    };

    const getReferenceBadge = (type: string) => {
        const refConfig = {
            purchase: { color: 'bg-emerald-100 text-emerald-800', label: 'Pembelian' },
            sale: { color: 'bg-rose-100 text-rose-800', label: 'Penjualan' },
            transfer: { color: 'bg-indigo-100 text-indigo-800', label: 'Transfer' },
            adjustment: { color: 'bg-amber-100 text-amber-800', label: 'Penyesuaian' },
            return: { color: 'bg-purple-100 text-purple-800', label: 'Retur' }
        };
        
        const config = refConfig[type as keyof typeof refConfig] || refConfig.adjustment;
        return (
            <Badge variant="outline" className={config.color}>
                {config.label}
            </Badge>
        );
    };

    const handleFilterChange = (key: string, value: string) => {
        setLocalFilters(prev => ({
            ...prev,
            [key]: value === 'all' ? '' : value
        }));
    };

    const handleDateChange = (key: 'date_from' | 'date_to', value: string) => {
        if (key === 'date_from') {
            setDateFrom(value);
        } else {
            setDateTo(value);
        }
        
        setLocalFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const applyFilters = () => {
        setIsLoading(true);
        router.visit(route('inventory.reports.movement-history'), {
            data: localFilters,
            preserveState: true,
            onFinish: () => setIsLoading(false)
        });
    };

    const resetFilters = () => {
        setLocalFilters({});
        setDateFrom('');
        setDateTo('');
        setIsLoading(true);
        router.visit(route('inventory.reports.movement-history'), {
            onFinish: () => setIsLoading(false)
        });
    };

    const exportReport = (format: 'excel' | 'pdf') => {
        setIsLoading(true);
        const params = new URLSearchParams({
            ...localFilters,
            format,
            export: '1'
        });
        
        window.location.href = route('inventory.reports.export.movement-history') + '?' + params.toString();
        setTimeout(() => setIsLoading(false), 2000);
    };

    const totalIn = displayMovements.filter(m => m.movement_type === 'in').reduce((sum, m) => sum + Math.abs(m.total_value), 0);
    const totalOut = displayMovements.filter(m => m.movement_type === 'out').reduce((sum, m) => sum + Math.abs(m.total_value), 0);
    const totalTransfers = displayMovements.filter(m => m.movement_type === 'transfer').length;
    const totalAdjustments = displayMovements.filter(m => m.movement_type === 'adjustment').length;

    const Layout = ({ children }: { children: React.ReactNode }) => (
        <AppLayout breadcrumbs={breadcrumbs}>
            {children}
        </AppLayout>
    );

    return (
        <Layout>
            <Head title="Riwayat Perpindahan Stok" />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="font-semibold text-2xl text-gray-800 leading-tight">
                            Riwayat Perpindahan Stok
                        </h2>
                        <p className="text-gray-600 mt-1">
                            Laporan lengkap semua aktivitas perpindahan inventori
                        </p>
                    </div>
                    <div className="flex space-x-2">
                        <Button 
                            onClick={() => exportReport('excel')} 
                            variant="outline"
                            disabled={isLoading}
                            ref={exportButtonRef}
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Export Excel
                        </Button>
                        <Button 
                            onClick={() => exportReport('pdf')} 
                            variant="outline"
                            disabled={isLoading}
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Export PDF
                        </Button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Transaksi</p>
                                    <p className="text-2xl font-bold">{displayMovements.length}</p>
                                </div>
                                <div className="text-blue-600">📋</div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Nilai Masuk</p>
                                    <p className="text-lg font-bold text-green-600">
                                        Rp {totalIn.toLocaleString('id-ID')}
                                    </p>
                                </div>
                                <TrendingUp className="h-8 w-8 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Nilai Keluar</p>
                                    <p className="text-lg font-bold text-red-600">
                                        Rp {totalOut.toLocaleString('id-ID')}
                                    </p>
                                </div>
                                <TrendingDown className="h-8 w-8 text-red-600" />
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Transfer</p>
                                    <p className="text-2xl font-bold text-blue-600">{totalTransfers}</p>
                                </div>
                                <div className="text-blue-600">🔄</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Filter className="mr-2 h-5 w-5" />
                            Filter Laporan
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4 items-end">
                            <div>
                                <Label htmlFor="search">Pencarian</Label>
                                <Input
                                    id="search"
                                    placeholder="Item atau referensi..."
                                    value={localFilters.search || ''}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                />
                            </div>
                            
                            <div>
                                <Label htmlFor="movement_type">Jenis Perpindahan</Label>
                                <Select value={localFilters.movement_type || 'all'} onValueChange={(value) => handleFilterChange('movement_type', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Semua Jenis" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Jenis</SelectItem>
                                        <SelectItem value="in">Masuk</SelectItem>
                                        <SelectItem value="out">Keluar</SelectItem>
                                        <SelectItem value="transfer">Transfer</SelectItem>
                                        <SelectItem value="adjustment">Penyesuaian</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div>
                                <Label htmlFor="reference_type">Jenis Referensi</Label>
                                <Select value={localFilters.reference_type || 'all'} onValueChange={(value) => handleFilterChange('reference_type', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Semua Referensi" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Referensi</SelectItem>
                                        <SelectItem value="purchase">Pembelian</SelectItem>
                                        <SelectItem value="sale">Penjualan</SelectItem>
                                        <SelectItem value="transfer">Transfer</SelectItem>
                                        <SelectItem value="adjustment">Penyesuaian</SelectItem>
                                        <SelectItem value="return">Retur</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div>
                                <Label htmlFor="location">Lokasi</Label>
                                <Select value={localFilters.location || 'all'} onValueChange={(value) => handleFilterChange('location', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Semua Lokasi" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Lokasi</SelectItem>
                                        <SelectItem value="gudang-utama">Gudang Utama</SelectItem>
                                        <SelectItem value="gudang-b">Gudang B</SelectItem>
                                        <SelectItem value="toko">Toko</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div>
                                <Label>Tanggal Dari</Label>
                                <Input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => handleDateChange('date_from', e.target.value)}
                                />
                            </div>
                            
                            <div>
                                <Label>Tanggal Sampai</Label>
                                <Input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => handleDateChange('date_to', e.target.value)}
                                />
                            </div>
                            
                            <div className="flex space-x-2">
                                <Button onClick={applyFilters} disabled={isLoading}>
                                    <Search className="mr-2 h-4 w-4" />
                                    Terapkan
                                </Button>
                                <Button onClick={resetFilters} variant="outline" disabled={isLoading}>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Reset
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Movement History Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Riwayat Perpindahan</CardTitle>
                        <CardDescription>
                            Menampilkan {displayMovements.length} transaksi perpindahan stok
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-2">Tanggal & Waktu</th>
                                        <th className="text-left p-2">Item</th>
                                        <th className="text-center p-2">Jenis</th>
                                        <th className="text-right p-2">Qty</th>
                                        <th className="text-left p-2">Lokasi</th>
                                        <th className="text-left p-2">Referensi</th>
                                        <th className="text-left p-2">User</th>
                                        <th className="text-right p-2">Nilai</th>
                                        <th className="text-left p-2">Catatan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayMovements.map((movement) => (
                                        <tr key={movement.id} className="border-b hover:bg-gray-50">
                                            <td className="p-2">
                                                <div className="text-sm">
                                                    <div className="font-medium">
                                                        {new Date(movement.date).toLocaleDateString('id-ID')}
                                                    </div>
                                                    <div className="text-gray-500">
                                                        {movement.time.slice(0, 5)}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-2">
                                                <div>
                                                    <div className="font-medium">{movement.item_name}</div>
                                                    <div className="text-sm text-gray-500">{movement.item_code}</div>
                                                </div>
                                            </td>
                                            <td className="p-2 text-center">
                                                {getMovementBadge(movement.movement_type)}
                                            </td>
                                            <td className="p-2 text-right font-medium">
                                                <span className={movement.quantity < 0 ? 'text-red-600' : 'text-green-600'}>
                                                    {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                                                </span>
                                                <div className="text-sm text-gray-500">{movement.unit}</div>
                                            </td>
                                            <td className="p-2 text-sm">
                                                {movement.from_location && (
                                                    <div className="text-red-600">Dari: {movement.from_location}</div>
                                                )}
                                                <div className="text-green-600">Ke: {movement.to_location}</div>
                                            </td>
                                            <td className="p-2">
                                                <div className="space-y-1">
                                                    <div className="font-medium text-sm">{movement.reference_number}</div>
                                                    {getReferenceBadge(movement.reference_type)}
                                                </div>
                                            </td>
                                            <td className="p-2 text-sm">{movement.user}</td>
                                            <td className="p-2 text-right font-medium">
                                                <span className={movement.total_value < 0 ? 'text-red-600' : 'text-green-600'}>
                                                    Rp {Math.abs(movement.total_value).toLocaleString('id-ID')}
                                                </span>
                                                <div className="text-xs text-gray-500">
                                                    @Rp {movement.cost_per_unit.toLocaleString('id-ID')}
                                                </div>
                                            </td>
                                            <td className="p-2 text-sm text-gray-600 max-w-xs">
                                                {movement.notes && (
                                                    <div className="truncate" title={movement.notes}>
                                                        {movement.notes}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        {displayMovements.length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-gray-500">Tidak ada data yang ditemukan</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
