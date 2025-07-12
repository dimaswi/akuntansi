import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
        title: 'Laporan',
        href: '/inventory/reports',
    },
    {
        title: 'Valuasi Stok',
        href: '/inventory/reports/stock-valuation',
    },
];

interface Location {
    id: number;
    name: string;
    code: string;
}

interface StockValuation {
    item_id: number;
    item_name: string;
    code: string;
    unit: string;
    location_name: string;
    location_code: string;
    quantity: number;
    average_cost: number;
    total_value: number;
}

interface Summary {
    total_items: number;
    total_quantity: number;
    total_value: number;
    average_value_per_item: number;
}

interface Props extends PageProps {
    locations: Location[];
}

export default function StockValuationReport({ locations, auth }: Props) {
    const [stockValuation, setStockValuation] = useState<StockValuation[]>([]);
    const [summary, setSummary] = useState<Summary>({ 
        total_items: 0, 
        total_quantity: 0, 
        total_value: 0, 
        average_value_per_item: 0 
    });
    const [loading, setLoading] = useState(false);
    
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [locationFilter, setLocationFilter] = useState('all');
    const [showFilters, setShowFilters] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                search: searchTerm,
                location_id: locationFilter !== 'all' ? locationFilter : ''
            });

            const response = await fetch(`/inventory/reports/stock-valuation-data?${params}`);
            const result = await response.json();
            
            setStockValuation(result.data);
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

    const handleExport = () => {
        const exportParams = new URLSearchParams({
            location: locationFilter !== 'all' ? locationFilter : '',
            search: searchTerm || '',
        });
        
        window.open(route('inventory.reports.export.stock-valuation') + '?' + exportParams.toString(), '_blank');
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
            <Head title="Valuasi Stok" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Header Section */}
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                            Laporan Valuasi Stok
                        </h2>
                        <p className="text-gray-600">
                            Laporan nilai stok berdasarkan biaya rata-rata per item
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
                                    <p className="text-sm text-gray-600">Total Kuantitas</p>
                                    <p className="text-2xl font-bold text-blue-600">{summary.total_quantity}</p>
                                </div>
                                <div className="text-2xl">📊</div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Total Nilai</p>
                                    <p className="text-xl font-bold text-green-600">
                                        {new Intl.NumberFormat('id-ID', { 
                                            style: 'currency', 
                                            currency: 'IDR',
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 0
                                        }).format(summary.total_value)}
                                    </p>
                                </div>
                                <div className="text-2xl">💰</div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Rata-rata per Item</p>
                                    <p className="text-lg font-bold text-purple-600">
                                        {new Intl.NumberFormat('id-ID', { 
                                            style: 'currency', 
                                            currency: 'IDR',
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 0
                                        }).format(summary.average_value_per_item)}
                                    </p>
                                </div>
                                <div className="text-2xl">📈</div>
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
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
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

                                    <Button 
                                        variant="outline" 
                                        onClick={() => {
                                            setSearchTerm('');
                                            setLocationFilter('all');
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

                {/* Stock Valuation Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Valuasi Stok ({stockValuation.length} item)</CardTitle>
                        <CardDescription>Nilai stok berdasarkan biaya rata-rata</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center items-center py-8">
                                <div className="text-lg">⏳ Memuat data...</div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {stockValuation.map((stock, index) => (
                                    <div key={`${stock.item_id}-${stock.location_name}`} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-medium">{stock.item_name}</h3>
                                                        <span className="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                                            #{index + 1}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        Kode: {stock.code} • Lokasi: {stock.location_name} ({stock.location_code})
                                                    </p>
                                                    <p className="text-sm text-blue-600">
                                                        Unit: {stock.unit} • 
                                                        Biaya Rata-rata: {new Intl.NumberFormat('id-ID', { 
                                                            style: 'currency', 
                                                            currency: 'IDR' 
                                                        }).format(stock.average_cost)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-4">
                                                <div className="text-center">
                                                    <p className="text-sm text-gray-600">Kuantitas</p>
                                                    <p className="text-lg font-bold">
                                                        {stock.quantity}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{stock.unit}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm text-gray-600">Total Nilai</p>
                                                    <p className="text-lg font-bold text-green-600">
                                                        {new Intl.NumberFormat('id-ID', { 
                                                            style: 'currency', 
                                                            currency: 'IDR',
                                                            minimumFractionDigits: 0,
                                                            maximumFractionDigits: 0
                                                        }).format(stock.total_value)}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {((stock.total_value / summary.total_value) * 100).toFixed(1)}% dari total
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                
                                {stockValuation.length === 0 && !loading && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        {searchTerm || locationFilter !== 'all'
                                            ? 'Tidak ada data yang sesuai dengan filter Anda.' 
                                            : 'Belum ada data stok yang tersedia.'}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Summary Footer */}
                        {stockValuation.length > 0 && (
                            <div className="mt-6 pt-4 border-t">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <p className="text-sm text-blue-600">Total Item</p>
                                        <p className="text-xl font-bold text-blue-800">{summary.total_items}</p>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-lg">
                                        <p className="text-sm text-green-600">Total Kuantitas</p>
                                        <p className="text-xl font-bold text-green-800">{summary.total_quantity}</p>
                                    </div>
                                    <div className="bg-purple-50 p-4 rounded-lg">
                                        <p className="text-sm text-purple-600">Total Nilai Stok</p>
                                        <p className="text-xl font-bold text-purple-800">
                                            {new Intl.NumberFormat('id-ID', { 
                                                style: 'currency', 
                                                currency: 'IDR',
                                                minimumFractionDigits: 0,
                                                maximumFractionDigits: 0
                                            }).format(summary.total_value)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
