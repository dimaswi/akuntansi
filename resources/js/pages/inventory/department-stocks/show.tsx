import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, PageProps } from '@/types';
import { Head, router } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft, Building2, Filter, Package, Search } from 'lucide-react';
import { useState } from 'react';
import { route } from 'ziggy-js';

interface Department {
    id: number;
    name: string;
    code: string;
}

interface Category {
    id: number;
    code: string;
    name: string;
    description: string;
    parent_id: number | null;
    category_type: string;
    is_active: boolean;
    requires_batch_tracking: boolean;
    requires_expiry_tracking: boolean;
    storage_requirements: string | null;
    created_at: string;
    updated_at: string;
}

interface Item {
    id: number;
    code: string;
    name: string;
    unit_of_measure: string;
    category?: Category | null;
}

interface Stock {
    id: number;
    item_id: number;
    item: Item;
    quantity_on_hand: number;
    available_quantity: number;
    reserved_quantity: number;
    last_unit_cost: number;
    average_unit_cost: number;
    total_value: number;
    last_updated_at: string;
}

interface Props extends PageProps {
    department: Department;
    stocks: {
        data: Stock[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    summary: {
        total_items: number;
        total_quantity: number;
        total_available: number;
        total_reserved: number;
        total_value: number;
        low_stock_items: number;
    };
    filters: {
        search?: string;
        low_stock?: boolean;
        sort_by?: string;
        sort_order?: string;
    };
}

const breadcrumbItems: BreadcrumbItem[] = [
    { title: <Package className="h-4 w-4" />, href: '#' },
    { title: 'Stok Department', href: route('department-stocks.index') },
];

export default function Show({ department, stocks, summary, filters }: Props) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [lowStockFilter, setLowStockFilter] = useState(filters.low_stock || false);
    const [sortBy, setSortBy] = useState(filters.sort_by || 'item_code');
    const [sortOrder, setSortOrder] = useState(filters.sort_order || 'asc');
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);

    const handleSearch = () => {
        router.get(route('department-stocks.show', department.id), {
            search: searchTerm,
            low_stock: lowStockFilter ? '1' : undefined,
            sort_by: sortBy,
            sort_order: sortOrder,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setLowStockFilter(false);
        setSortBy('item_code');
        setSortOrder('asc');
        router.get(route('department-stocks.show', department.id), {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const formatNumber = (num: number | undefined | null): string => {
        if (num === undefined || num === null) return '0';
        // Jangan gunakan separator ribuan, tampilkan angka apa adanya
        return num.toString();
    };

    const formatCurrency = (value: number | undefined | null) => {
        if (value === undefined || value === null) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(value);
    };

    const formatDate = (date: string | null | undefined) => {
        if (!date) return 'Invalid Date';
        try {
            return new Date(date).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch (e) {
            return 'Invalid Date';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbItems}>
            <Head title={`Stok ${department.name}`} />

            <div className="mt-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Building2 className="h-6 w-6 text-gray-600" />
                            <h1 className="text-2xl font-semibold text-gray-900">
                                {department.name}
                            </h1>
                            <Badge variant="outline">{department.code}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Detail stok inventory department
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.visit(route('department-stocks.index'))}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Kembali
                    </Button>
                </div>

                {/* Summary Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Department Information
                        </CardTitle>
                        <CardDescription>
                            Summary of stock inventory for this department
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Item</p>
                                <p className="text-2xl font-bold mt-1">{summary.total_items}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Quantity</p>
                                <p className="text-2xl font-bold text-green-600 mt-1">
                                    {formatNumber(summary.total_quantity)}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Item Stok Rendah</p>
                                <p className={`text-2xl font-bold mt-1 ${summary.low_stock_items > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                    {summary.low_stock_items}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                                <p className="text-2xl font-bold text-blue-600 mt-1">
                                    {formatCurrency(summary.total_value)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Items Table */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="h-5 w-5" />
                                    Detail Stok Item
                                </CardTitle>
                                <CardDescription>
                                    Total {stocks.total} item
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                                    className="gap-2"
                                >
                                    <Filter className="h-4 w-4" />
                                    {isFilterExpanded ? 'Hide Filters' : 'Show Filters'}
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Search Bar */}
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search by item code or name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                            <Button onClick={handleSearch} className="gap-2">
                                <Search className="h-4 w-4" />
                                Search
                            </Button>
                            {(searchTerm || lowStockFilter) && (
                                <Button variant="outline" onClick={handleClearFilters}>
                                    Clear
                                </Button>
                            )}
                        </div>

                        {/* Collapsible Filters */}
                        {isFilterExpanded && (
                            <div className="p-4 border rounded-lg bg-gray-50">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>Filter Stok</Label>
                                        <Select 
                                            value={lowStockFilter ? 'low' : 'all'} 
                                            onValueChange={(value) => setLowStockFilter(value === 'low')}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Semua Stok</SelectItem>
                                                <SelectItem value="low">Stok Rendah Saja</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Sort By</Label>
                                        <Select value={sortBy} onValueChange={setSortBy}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="item_code">Item Code</SelectItem>
                                                <SelectItem value="quantity_on_hand">Quantity</SelectItem>
                                                <SelectItem value="total_value">Value</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Sort Order</Label>
                                        <Select value={sortOrder} onValueChange={setSortOrder}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="asc">Ascending</SelectItem>
                                                <SelectItem value="desc">Descending</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Table */}
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Kode</TableHead>
                                        <TableHead>Nama Item</TableHead>
                                        <TableHead>Kategori</TableHead>
                                        <TableHead className="text-center">Unit</TableHead>
                                        <TableHead className="text-right">On Hand</TableHead>
                                        <TableHead className="text-right">Reserved</TableHead>
                                        <TableHead className="text-right">Available</TableHead>
                                        <TableHead className="text-right">Unit Cost</TableHead>
                                        <TableHead className="text-right">Total Value</TableHead>
                                        <TableHead>Update Terakhir</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stocks.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                                <Package className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                                <p>Tidak ada stok item di department ini</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        stocks.data.map((stock) => (
                                            <TableRow key={stock.id} className="hover:bg-muted/50">
                                                <TableCell className="font-mono text-xs text-muted-foreground">
                                                    {stock.item.code}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {stock.item.name}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {stock.item.category?.name || '-'}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="outline" className="text-xs">
                                                        {stock.item.unit_of_measure}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-semibold">
                                                    {formatNumber(stock.quantity_on_hand)}
                                                </TableCell>
                                                <TableCell className="text-right text-sm">
                                                    {formatCurrency(stock.average_unit_cost)}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold text-blue-600">
                                                    {formatCurrency(stock.total_value)}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {formatDate(stock.last_updated_at)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {stocks.last_page > 1 && (
                            <div className="flex items-center justify-between mt-4">
                                <div className="text-sm text-muted-foreground">
                                    Showing {(stocks.current_page - 1) * stocks.per_page + 1} to{' '}
                                    {Math.min(stocks.current_page * stocks.per_page, stocks.total)} of{' '}
                                    {stocks.total} entries
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={stocks.current_page === 1}
                                        onClick={() =>
                                            router.get(route('department-stocks.show', {
                                                department: department.id,
                                                page: stocks.current_page - 1,
                                            }))
                                        }
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={stocks.current_page === stocks.last_page}
                                        onClick={() =>
                                            router.get(route('department-stocks.show', {
                                                department: department.id,
                                                page: stocks.current_page + 1,
                                            }))
                                        }
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
