import React, { useState, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Download, Filter, RefreshCw, Search, DollarSign, TrendingUp } from 'lucide-react';
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
        title: 'Valuasi Stok',
        href: route('inventory.reports.stock-valuation'),
    },
];

interface ValuationItem {
    id: number;
    name: string;
    code: string;
    category: string;
    unit: string;
    current_stock: number;
    average_cost: number;
    total_value: number;
    last_purchase_cost: number;
    last_purchase_date: string;
    location: string;
    movement_this_month: number;
    percentage_of_total: number;
}

interface Props extends PageProps {
    items?: ValuationItem[];
    filters?: {
        search?: string;
        category?: string;
        location?: string;
        min_value?: string;
        max_value?: string;
    };
}

export default function StockValuation({ items = [], filters = {} }: Props) {
    const [localFilters, setLocalFilters] = useState(filters);
    const [isLoading, setIsLoading] = useState(false);
    const exportButtonRef = useRef<HTMLButtonElement>(null);

    // Mock data if no items provided
    const mockItems: ValuationItem[] = [
        {
            id: 1,
            name: 'Laptop Dell Inspiron',
            code: 'LPT-001',
            category: 'Elektronik',
            unit: 'Unit',
            current_stock: 5,
            average_cost: 15000000,
            total_value: 75000000,
            last_purchase_cost: 15500000,
            last_purchase_date: '2024-01-10',
            location: 'Gudang Utama',
            movement_this_month: 3,
            percentage_of_total: 68.5
        },
        {
            id: 2,
            name: 'Mouse Wireless Logitech',
            code: 'MSE-002',
            category: 'Elektronik',
            unit: 'Unit',
            current_stock: 25,
            average_cost: 250000,
            total_value: 6250000,
            last_purchase_cost: 275000,
            last_purchase_date: '2024-01-08',
            location: 'Gudang Utama',
            movement_this_month: 8,
            percentage_of_total: 5.7
        },
        {
            id: 3,
            name: 'Kertas A4 Sidu',
            code: 'PPR-003',
            category: 'Perlengkapan Kantor',
            unit: 'Rim',
            current_stock: 2,
            average_cost: 60000,
            total_value: 120000,
            last_purchase_cost: 65000,
            last_purchase_date: '2024-01-05',
            location: 'Gudang B',
            movement_this_month: 18,
            percentage_of_total: 0.1
        },
        {
            id: 4,
            name: 'Tinta Printer Canon',
            code: 'INK-004',
            category: 'Perlengkapan Kantor',
            unit: 'Cartridge',
            current_stock: 80,
            average_cost: 300000,
            total_value: 24000000,
            last_purchase_cost: 320000,
            last_purchase_date: '2024-01-12',
            location: 'Gudang Utama',
            movement_this_month: 12,
            percentage_of_total: 21.9
        },
        {
            id: 5,
            name: 'Monitor Samsung 24 inch',
            code: 'MON-005',
            category: 'Elektronik',
            unit: 'Unit',
            current_stock: 12,
            average_cost: 3500000,
            total_value: 42000000,
            last_purchase_cost: 3600000,
            last_purchase_date: '2024-01-07',
            location: 'Gudang Utama',
            movement_this_month: 4,
            percentage_of_total: 38.3
        }
    ];

    const displayItems = items.length > 0 ? items : mockItems;

    const getValueBadge = (percentage: number) => {
        if (percentage >= 50) {
            return <Badge className="bg-red-100 text-red-800">Tinggi</Badge>;
        } else if (percentage >= 20) {
            return <Badge className="bg-yellow-100 text-yellow-800">Sedang</Badge>;
        } else if (percentage >= 5) {
            return <Badge className="bg-blue-100 text-blue-800">Rendah</Badge>;
        } else {
            return <Badge className="bg-gray-100 text-gray-800">Minimal</Badge>;
        }
    };

    const getMovementIndicator = (movement: number) => {
        if (movement >= 15) {
            return <span className="text-green-600 flex items-center"><TrendingUp className="w-3 h-3 mr-1" />Cepat</span>;
        } else if (movement >= 5) {
            return <span className="text-yellow-600">Normal</span>;
        } else {
            return <span className="text-red-600">Lambat</span>;
        }
    };

    const handleFilterChange = (key: string, value: string) => {
        setLocalFilters(prev => ({
            ...prev,
            [key]: value === 'all' ? '' : value
        }));
    };

    const applyFilters = () => {
        setIsLoading(true);
        router.visit(route('inventory.reports.stock-valuation'), {
            data: localFilters,
            preserveState: true,
            onFinish: () => setIsLoading(false)
        });
    };

    const resetFilters = () => {
        setLocalFilters({});
        setIsLoading(true);
        router.visit(route('inventory.reports.stock-valuation'), {
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
        
        window.location.href = route('inventory.reports.export.stock-valuation') + '?' + params.toString();
        setTimeout(() => setIsLoading(false), 2000);
    };

    const totalValue = displayItems.reduce((sum, item) => sum + item.total_value, 0);
    const totalItems = displayItems.length;
    const highValueItems = displayItems.filter(item => item.percentage_of_total >= 20).length;
    const slowMovingItems = displayItems.filter(item => item.movement_this_month < 5).length;

    const Layout = ({ children }: { children: React.ReactNode }) => (
        <AppLayout breadcrumbs={breadcrumbs}>
            {children}
        </AppLayout>
    );

    return (
        <Layout>
            <Head title="Laporan Valuasi Stok" />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="font-semibold text-2xl text-gray-800 leading-tight">
                            Laporan Valuasi Stok
                        </h2>
                        <p className="text-gray-600 mt-1">
                            Valuasi inventori berdasarkan harga rata-rata per item
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
                                    <p className="text-sm font-medium text-gray-600">Total Nilai Stok</p>
                                    <p className="text-xl font-bold">
                                        Rp {totalValue.toLocaleString('id-ID')}
                                    </p>
                                </div>
                                <DollarSign className="h-8 w-8 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Item</p>
                                    <p className="text-2xl font-bold">{totalItems}</p>
                                </div>
                                <div className="text-blue-600">📦</div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Item Nilai Tinggi</p>
                                    <p className="text-2xl font-bold text-red-600">{highValueItems}</p>
                                </div>
                                <div className="text-red-600">🔴</div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Pergerakan Lambat</p>
                                    <p className="text-2xl font-bold text-orange-600">{slowMovingItems}</p>
                                </div>
                                <div className="text-orange-600">🐌</div>
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
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
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
                                <Label htmlFor="min_value">Nilai Minimum</Label>
                                <Input
                                    id="min_value"
                                    type="number"
                                    placeholder="0"
                                    value={localFilters.min_value || ''}
                                    onChange={(e) => handleFilterChange('min_value', e.target.value)}
                                />
                            </div>
                            
                            <div>
                                <Label htmlFor="max_value">Nilai Maksimum</Label>
                                <Input
                                    id="max_value"
                                    type="number"
                                    placeholder="999999999"
                                    value={localFilters.max_value || ''}
                                    onChange={(e) => handleFilterChange('max_value', e.target.value)}
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

                {/* Valuation Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Data Valuasi Stok</CardTitle>
                        <CardDescription>
                            Menampilkan {displayItems.length} item dengan valuasi berdasarkan harga rata-rata
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
                                        <th className="text-right p-2">Stok</th>
                                        <th className="text-right p-2">Harga Rata-rata</th>
                                        <th className="text-right p-2">Total Nilai</th>
                                        <th className="text-center p-2">% dari Total</th>
                                        <th className="text-center p-2">Pergerakan</th>
                                        <th className="text-right p-2">Harga Terakhir</th>
                                        <th className="text-center p-2">Tgl. Beli Terakhir</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayItems.map((item) => (
                                        <tr key={item.id} className="border-b hover:bg-gray-50">
                                            <td className="p-2">
                                                <div>
                                                    <div className="font-medium">{item.name}</div>
                                                    <div className="text-sm text-gray-500">{item.code}</div>
                                                </div>
                                            </td>
                                            <td className="p-2 text-sm">{item.category}</td>
                                            <td className="p-2 text-sm">{item.location}</td>
                                            <td className="p-2 text-right font-medium">
                                                {item.current_stock} {item.unit}
                                            </td>
                                            <td className="p-2 text-right">
                                                Rp {item.average_cost.toLocaleString('id-ID')}
                                            </td>
                                            <td className="p-2 text-right font-bold text-green-600">
                                                Rp {item.total_value.toLocaleString('id-ID')}
                                            </td>
                                            <td className="p-2 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="font-medium">{item.percentage_of_total.toFixed(1)}%</span>
                                                    {getValueBadge(item.percentage_of_total)}
                                                </div>
                                            </td>
                                            <td className="p-2 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="font-medium">{item.movement_this_month}</span>
                                                    <div className="text-xs">
                                                        {getMovementIndicator(item.movement_this_month)}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-2 text-right">
                                                <div className="text-sm">
                                                    Rp {item.last_purchase_cost.toLocaleString('id-ID')}
                                                </div>
                                                <div className={`text-xs ${
                                                    item.last_purchase_cost > item.average_cost 
                                                        ? 'text-red-600' 
                                                        : 'text-green-600'
                                                }`}>
                                                    {item.last_purchase_cost > item.average_cost ? '↑' : '↓'} 
                                                    {Math.abs(((item.last_purchase_cost - item.average_cost) / item.average_cost) * 100).toFixed(1)}%
                                                </div>
                                            </td>
                                            <td className="p-2 text-center text-sm">
                                                {new Date(item.last_purchase_date).toLocaleDateString('id-ID')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t-2 bg-gray-50 font-bold">
                                        <td colSpan={5} className="p-2 text-right">Total Keseluruhan:</td>
                                        <td className="p-2 text-right text-green-600">
                                            Rp {totalValue.toLocaleString('id-ID')}
                                        </td>
                                        <td className="p-2 text-center">100%</td>
                                        <td colSpan={3} className="p-2"></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                        
                        {displayItems.length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-gray-500">Tidak ada data yang ditemukan</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Analysis Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Analisis Valuasi</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span>Item dengan nilai {'>'}50% total:</span>
                                    <span className="font-bold text-red-600">
                                        {displayItems.filter(i => i.percentage_of_total >= 50).length} item
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Item dengan nilai 20-50% total:</span>
                                    <span className="font-bold text-yellow-600">
                                        {displayItems.filter(i => i.percentage_of_total >= 20 && i.percentage_of_total < 50).length} item
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Item dengan nilai {'<'}20% total:</span>
                                    <span className="font-bold text-green-600">
                                        {displayItems.filter(i => i.percentage_of_total < 20).length} item
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Rata-rata nilai per item:</span>
                                    <span className="font-bold">
                                        Rp {(totalValue / totalItems).toLocaleString('id-ID')}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Rekomendasi</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-start">
                                    <span className="text-red-500 mr-2">•</span>
                                    Fokus monitoring item dengan nilai tinggi ({'>'}50% total)
                                </li>
                                <li className="flex items-start">
                                    <span className="text-yellow-500 mr-2">•</span>
                                    Evaluasi strategi untuk item pergerakan lambat
                                </li>
                                <li className="flex items-start">
                                    <span className="text-blue-500 mr-2">•</span>
                                    Pertimbangkan peningkatan harga jual pada item dengan margin rendah
                                </li>
                                <li className="flex items-start">
                                    <span className="text-green-500 mr-2">•</span>
                                    Optimalisasi stok untuk item dengan pergerakan cepat
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </Layout>
    );
}
