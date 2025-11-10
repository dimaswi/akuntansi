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
import { Filter, Package, Search, Warehouse } from 'lucide-react';
import { useState } from 'react';
import { route } from 'ziggy-js';

interface Category {
    id: number;
    code: string;
    name: string;
}

interface Item {
    id: number;
    code: string;
    name: string;
    unit_of_measure: string;
    category?: Category | null;
    reorder_level: number;
    safety_stock: number;
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
        has_reserved?: boolean;
        sort_by?: string;
        sort_order?: string;
    };
}

const breadcrumbItems: BreadcrumbItem[] = [
    { title: <Package className="h-4 w-4" />, href: '#' },
    { title: 'Gudang Pusat', href: route('central-warehouse.index') },
];

export default function Index({ stocks, summary, filters }: Props) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [lowStockFilter, setLowStockFilter] = useState(filters.low_stock || false);
    const [hasReservedFilter, setHasReservedFilter] = useState(filters.has_reserved || false);
    const [sortBy, setSortBy] = useState(filters.sort_by || 'item_code');
    const [sortOrder, setSortOrder] = useState(filters.sort_order || 'asc');
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);

    const handleSearch = () => {
        router.get(route('central-warehouse.index'), {
            search: searchTerm,
            low_stock: lowStockFilter ? '1' : undefined,
            has_reserved: hasReservedFilter ? '1' : undefined,
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
        setHasReservedFilter(false);
        setSortBy('item_code');
        setSortOrder('asc');
        router.get(route('central-warehouse.index'), {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const formatNumber = (num: number | undefined | null): string => {
        if (num === undefined || num === null) return '0';
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
        if (!date) return '-';
        try {
            return new Date(date).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch (e) {
            return '-';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbItems}>
            <Head title="Gudang Pusat" />

            <div className="mt-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Warehouse className="h-6 w-6 text-gray-600" />
                            <h1 className="text-2xl font-semibold text-gray-900">
                                Gudang Pusat
                            </h1>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Stok inventory di gudang pusat
                        </p>
                    </div>
                </div>

                {/* Summary Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Warehouse Information
                        </CardTitle>
                        <CardDescription>
                            Summary of stock inventory in central warehouse
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
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
                                <p className="text-sm font-medium text-muted-foreground">Reserved</p>
                                <p className="text-2xl font-bold text-orange-600 mt-1">
                                    {formatNumber(summary.total_reserved)}
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
                <Card className="mt-6">
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
                            {(searchTerm || lowStockFilter || hasReservedFilter) && (
                                <Button variant="outline" onClick={handleClearFilters}>
                                    Clear
                                </Button>
                            )}
                        </div>

                        {/* Collapsible Filters */}
                        {isFilterExpanded && (
                            <div className="p-4 border rounded-lg bg-gray-50">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                                        <Label>Filter Reserved</Label>
                                        <Select 
                                            value={hasReservedFilter ? 'yes' : 'all'} 
                                            onValueChange={(value) => setHasReservedFilter(value === 'yes')}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Semua</SelectItem>
                                                <SelectItem value="yes">Ada Reserved</SelectItem>
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
                                                <SelectItem value="reserved_quantity">Reserved</SelectItem>
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
                                            <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                                                <Package className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                                <p>Tidak ada stok item di gudang pusat</p>
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
                                                <TableCell className="text-right text-orange-600 font-semibold">
                                                    {formatNumber(stock.reserved_quantity)}
                                                </TableCell>
                                                <TableCell className="text-right text-green-600 font-semibold">
                                                    {formatNumber(stock.available_quantity)}
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
                                            router.get(route('central-warehouse.index', {
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
                                            router.get(route('central-warehouse.index', {
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
