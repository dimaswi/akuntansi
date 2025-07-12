import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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
        title: 'Laporan',
        href: '/inventory/reports',
    },
    {
        title: 'Level Stok',
        href: '/inventory/reports/stock-level',
    },
];

interface Location {
    id: number;
    name: string;
    code: string;
}

interface Item {
    id: number;
    name: string;
    code: string;
    unit: string;
    minimum_stock: number;
}

interface StockLevel {
    id: number;
    item_name: string;
    code: string;
    unit: string;
    minimum_stock: number;
    location_name: string;
    location_code: string;
    current_stock: number;
    stock_status: 'low' | 'out' | 'normal';
}

interface Summary {
    total_items: number;
    low_stock: number;
    out_of_stock: number;
    normal_stock: number;
}

interface Props extends PageProps {
    locations: Location[];
    items: Item[];
}

export default function StockLevelReport({ locations, items, auth }: Props) {
    const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
    const [summary, setSummary] = useState<Summary>({ total_items: 0, low_stock: 0, out_of_stock: 0, normal_stock: 0 });
    const [loading, setLoading] = useState(false);
    
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [locationFilter, setLocationFilter] = useState('all');
    const [itemFilter, setItemFilter] = useState('all');
    const [stockStatusFilter, setStockStatusFilter] = useState('all');
    const [showFilters, setShowFilters] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                search: searchTerm,
                location_id: locationFilter !== 'all' ? locationFilter : '',
                item_id: itemFilter !== 'all' ? itemFilter : '',
                stock_status: stockStatusFilter !== 'all' ? stockStatusFilter : ''
            });

            const response = await fetch(`/inventory/reports/stock-level-data?${params}`);
            const result = await response.json();
            
            setStockLevels(result.data);
            setSummary(result.summary);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSearch = () => {
        fetchData();
    };

    const getStockStatusColor = (status: string) => {
        switch (status) {
            case 'low':
                return 'bg-yellow-100 text-yellow-800';
            case 'out':
                return 'bg-red-100 text-red-800';
            case 'normal':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStockStatusLabel = (status: string) => {
        switch (status) {
            case 'low':
                return 'Stok Rendah';
            case 'out':
                return 'Habis';
            case 'normal':
                return 'Normal';
            default:
                return status;
        }
    };

    const handleExport = () => {
        const exportParams = new URLSearchParams({
            location: locationFilter !== 'all' ? locationFilter : '',
            item: itemFilter !== 'all' ? itemFilter : '',
            status: stockStatusFilter !== 'all' ? stockStatusFilter : '',
            search: searchTerm || '',
        });
        
        window.open(route('inventory.reports.export.stock-level') + '?' + exportParams.toString(), '_blank');
    };

    const Layout = ({ children }: { children: React.ReactNode }) => (
        <AppLayout breadcrumbs={breadcrumbs}>
            {children}
        </AppLayout>
    );

    // Check if user has export permission
    const hasExportPermission = auth.permissions.includes('inventory.report.export');

    return (
        <Layout>
            <Head title="Laporan Level Stok" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Header Section */}
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                            Laporan Level Stok
                        </h2>
                        <p className="text-gray-600">
                            Pantau level stok saat ini untuk semua item di berbagai lokasi
                        </p>
                    </div>
                    {hasExportPermission && (
                        <Button onClick={handleExport} variant="outline">
                            📄 Export
                        </Button>
                    )}
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Total Item</p>
                                    <p className="text-2xl font-bold">{summary.total_items}</p>
                                </div>
                                <div className="text-2xl">📦</div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Stok Normal</p>
                                    <p className="text-2xl font-bold text-green-600">{summary.normal_stock}</p>
                                </div>
                                <div className="text-2xl">✅</div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Stok Rendah</p>
                                    <p className="text-2xl font-bold text-yellow-600">{summary.low_stock}</p>
                                </div>
                                <div className="text-2xl">⚠️</div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Habis</p>
                                    <p className="text-2xl font-bold text-red-600">{summary.out_of_stock}</p>
                                </div>
                                <div className="text-2xl">❌</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search and Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Input
                                        placeholder="🔍 Cari berdasarkan nama item, kode, atau lokasi..."
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
                                    <Button onClick={handleSearch} disabled={loading}>
                                        {loading ? '⏳' : '🔍'} Cari
                                    </Button>
                                </div>
                            </div>

                            {showFilters && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
                                    <Select value={locationFilter} onValueChange={setLocationFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Filter lokasi" />
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

                                    <Select value={itemFilter} onValueChange={setItemFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Filter item" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Item</SelectItem>
                                            {items.map((item) => (
                                                <SelectItem key={item.id} value={item.id.toString()}>
                                                    {item.name} ({item.code})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select value={stockStatusFilter} onValueChange={setStockStatusFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Filter status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Status</SelectItem>
                                            <SelectItem value="normal">Stok Normal</SelectItem>
                                            <SelectItem value="low">Stok Rendah</SelectItem>
                                            <SelectItem value="out">Habis</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Button 
                                        variant="outline" 
                                        onClick={() => {
                                            setSearchTerm('');
                                            setLocationFilter('all');
                                            setItemFilter('all');
                                            setStockStatusFilter('all');
                                            fetchData();
                                        }}
                                    >
                                        🔄 Reset
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Stock Levels Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Level Stok ({stockLevels.length} item)</CardTitle>
                        <CardDescription>Data level stok untuk semua item inventori</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center items-center py-8">
                                <div className="text-lg">⏳ Memuat data...</div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {stockLevels.map((stock) => (
                                    <div key={`${stock.id}-${stock.location_name}`} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-medium">{stock.item_name}</h3>
                                                        <Badge className={getStockStatusColor(stock.stock_status)}>
                                                            {getStockStatusLabel(stock.stock_status)}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        Kode: {stock.code} • Lokasi: {stock.location_name} ({stock.location_code})
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Unit: {stock.unit} • Min. Stok: {stock.minimum_stock}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-2">
                                                <div>
                                                    <p className="text-lg font-bold">
                                                        {stock.current_stock}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {stock.unit}
                                                    </p>
                                                </div>
                                                {stock.stock_status === 'low' && (
                                                    <div className="text-2xl">⚠️</div>
                                                )}
                                                {stock.stock_status === 'out' && (
                                                    <div className="text-2xl">❌</div>
                                                )}
                                                {stock.stock_status === 'normal' && (
                                                    <div className="text-2xl">✅</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                
                                {stockLevels.length === 0 && !loading && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        {searchTerm || locationFilter !== 'all' || itemFilter !== 'all' || stockStatusFilter !== 'all'
                                            ? 'Tidak ada data yang sesuai dengan filter Anda.' 
                                            : 'Belum ada data stok yang tersedia.'}
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
