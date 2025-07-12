import React, { useState, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Download, Filter, RefreshCw, Search } from 'lucide-react';
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
        title: 'Level Stok',
        href: route('inventory.reports.stock-level'),
    },
];

interface StockItem {
    id: number;
    item_name: string;
    code: string;
    unit_of_measure: string;
    reorder_level: number;
    location_name: string;
    location_code: string;
    current_stock: number;
    average_cost: number;
    value: number;
    last_updated: string;
    stock_status: 'normal' | 'low' | 'out' | 'overstock';
}

interface Props extends PageProps {
    items?: StockItem[];
    filters?: {
        search?: string;
        category?: string;
        location?: string;
        status?: string;
    };
}

export default function StockLevel({ items = [], filters = {} }: Props) {
    const [localFilters, setLocalFilters] = useState(filters);
    const [isLoading, setIsLoading] = useState(false);
    const exportButtonRef = useRef<HTMLButtonElement>(null);

    // Mock data if no items provided
    const mockItems: StockItem[] = [
        {
            id: 1,
            item_name: 'Laptop Dell Inspiron',
            code: 'LPT-001',
            unit_of_measure: 'Unit',
            current_stock: 5,
            reorder_level: 10,
            location_name: 'Gudang Utama',
            location_code: 'GU001',
            average_cost: 15000000,
            value: 75000000,
            last_updated: '2024-01-15 10:30:00',
            stock_status: 'low'
        },
        {
            id: 2,
            item_name: 'Mouse Wireless Logitech',
            code: 'MSE-002',
            unit_of_measure: 'Unit',
            current_stock: 25,
            reorder_level: 20,
            location_name: 'Gudang Utama',
            location_code: 'GU001',
            average_cost: 250000,
            value: 6250000,
            last_updated: '2024-01-15 09:15:00',
            stock_status: 'normal'
        },
        {
            id: 3,
            item_name: 'Kertas A4 Sidu',
            code: 'PPR-003',
            unit_of_measure: 'Rim',
            current_stock: 2,
            reorder_level: 5,
            location_name: 'Gudang B',
            location_code: 'GB001',
            average_cost: 60000,
            value: 120000,
            last_updated: '2024-01-14 16:45:00',
            stock_status: 'out'
        },
        {
            id: 4,
            item_name: 'Tinta Printer Canon',
            code: 'INK-004',
            unit_of_measure: 'Cartridge',
            current_stock: 0,
            reorder_level: 10,
            location_name: 'Gudang Utama',
            location_code: 'GU001',
            average_cost: 300000,
            value: 0,
            last_updated: '2024-01-15 11:20:00',
            stock_status: 'out'
        }
    ];

    const displayItems = items.length > 0 ? items : mockItems;

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            normal: { color: 'bg-green-100 text-green-800', label: 'Normal' },
            low: { color: 'bg-yellow-100 text-yellow-800', label: 'Stok Rendah' },
            out: { color: 'bg-red-100 text-red-800', label: 'Habis' },
            overstock: { color: 'bg-blue-100 text-blue-800', label: 'Overstock' }
        };
        
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.normal;
        return (
            <Badge className={config.color}>
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

    const applyFilters = () => {
        setIsLoading(true);
        router.visit(route('inventory.reports.stock-level'), {
            data: localFilters,
            preserveState: true,
            onFinish: () => setIsLoading(false)
        });
    };

    const resetFilters = () => {
        setLocalFilters({});
        setIsLoading(true);
        router.visit(route('inventory.reports.stock-level'), {
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
        
        window.location.href = route('inventory.reports.export.stock-level') + '?' + params.toString();
        setTimeout(() => setIsLoading(false), 2000);
    };

    const totalValue = displayItems.reduce((sum, item) => sum + item.value, 0);
    const outOfStockItems = displayItems.filter(item => item.stock_status === 'out').length;
    const lowStockItems = displayItems.filter(item => item.stock_status === 'low').length;

    const Layout = ({ children }: { children: React.ReactNode }) => (
        <AppLayout breadcrumbs={breadcrumbs}>
            {children}
        </AppLayout>
    );

    return (
        <Layout>
            <Head title="Laporan Level Stok" />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="font-semibold text-2xl text-gray-800 leading-tight">
                            Laporan Level Stok
                        </h2>
                        <p className="text-gray-600 mt-1">
                            Monitoring level stok untuk semua item inventori
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
                                    <p className="text-sm font-medium text-gray-600">Total Item</p>
                                    <p className="text-2xl font-bold">{displayItems.length}</p>
                                </div>
                                <div className="text-blue-600">📦</div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Item Habis</p>
                                    <p className="text-2xl font-bold text-red-600">{outOfStockItems}</p>
                                </div>
                                <AlertCircle className="h-8 w-8 text-red-600" />
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Stok Rendah</p>
                                    <p className="text-2xl font-bold text-yellow-600">{lowStockItems}</p>
                                </div>
                                <div className="text-yellow-600">⚠️</div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Nilai</p>
                                    <p className="text-lg font-bold">
                                        Rp {totalValue.toLocaleString('id-ID')}
                                    </p>
                                </div>
                                <div className="text-green-600">💰</div>
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
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                            <div>
                                <Label htmlFor="search">Pencarian</Label>
                                <Input
                                    id="search"
                                    placeholder="Nama item atau kode..."
                                    value={localFilters.search || ''}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                />
                            </div>
                            
                            <div>
                                <Label htmlFor="category">Kategori</Label>
                                <Select value={localFilters.category || 'all'} onValueChange={(value) => handleFilterChange('category', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Semua Kategori" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Kategori</SelectItem>
                                        <SelectItem value="elektronik">Elektronik</SelectItem>
                                        <SelectItem value="perlengkapan-kantor">Perlengkapan Kantor</SelectItem>
                                        <SelectItem value="furniture">Furniture</SelectItem>
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
                                <Label htmlFor="status">Status</Label>
                                <Select value={localFilters.status || 'all'} onValueChange={(value) => handleFilterChange('status', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Semua Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Status</SelectItem>
                                        <SelectItem value="normal">Normal</SelectItem>
                                        <SelectItem value="low">Stok Rendah</SelectItem>
                                        <SelectItem value="critical">Kritis</SelectItem>
                                        <SelectItem value="overstock">Overstock</SelectItem>
                                    </SelectContent>
                                </Select>
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

                {/* Stock Level Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Data Level Stok</CardTitle>
                        <CardDescription>
                            Menampilkan {displayItems.length} item dengan status stok terkini
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-2">Item</th>
                                        <th className="text-left p-2">Kategori</th>
                                        <th className="text-left p-2">Lokasi</th>
                                        <th className="text-right p-2">Stok Saat Ini</th>
                                        <th className="text-right p-2">Reorder Level</th>
                                        <th className="text-center p-2">Persentase</th>
                                        <th className="text-center p-2">Status</th>
                                        <th className="text-right p-2">Nilai</th>
                                        <th className="text-center p-2">Update Terakhir</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayItems.map((item) => (
                                        <tr key={item.id} className="border-b hover:bg-gray-50">
                                            <td className="p-2">
                                                <div>
                                                    <div className="font-medium">{item.item_name}</div>
                                                    <div className="text-sm text-gray-500">{item.code}</div>
                                                </div>
                                            </td>
                                            <td className="p-2 text-sm">-</td>
                                            <td className="p-2 text-sm">{item.location_name}</td>
                                            <td className="p-2 text-right font-medium">
                                                {item.current_stock} {item.unit_of_measure}
                                            </td>
                                            <td className="p-2 text-right text-sm">
                                                <div>{item.reorder_level}</div>
                                            </td>
                                            <td className="p-2 text-center">
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div 
                                                        className={`h-2 rounded-full ${
                                                            item.stock_status === 'out' ? 'bg-red-500' :
                                                            item.stock_status === 'low' ? 'bg-yellow-500' :
                                                            item.stock_status === 'overstock' ? 'bg-blue-500' :
                                                            'bg-green-500'
                                                        }`}
                                                        style={{ 
                                                            width: `${Math.min(Math.round((item.current_stock / (item.reorder_level * 2)) * 100), 100)}%` 
                                                        }}
                                                    ></div>
                                                </div>
                                                <div className="text-xs mt-1">
                                                    {Math.min(Math.round((item.current_stock / (item.reorder_level * 2)) * 100), 100)}%
                                                </div>
                                            </td>
                                            <td className="p-2 text-center">
                                                {getStatusBadge(item.stock_status)}
                                            </td>
                                            <td className="p-2 text-right font-medium">
                                                Rp {(item.value || 0).toLocaleString('id-ID')}
                                            </td>
                                            <td className="p-2 text-center text-sm text-gray-500">
                                                {new Date(item.last_updated).toLocaleDateString('id-ID')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        {displayItems.length === 0 && (
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
