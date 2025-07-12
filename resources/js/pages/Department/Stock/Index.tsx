import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { 
    Eye, 
    FileX, 
    Plus, 
    Search, 
    Package, 
    AlertTriangle, 
    TrendingDown,
    Calculator
} from 'lucide-react';
import { PageProps as InertiaPageProps } from '@inertiajs/core';

interface DepartmentInventoryLocation {
    id: number;
    department_id: number;
    inventory_item: {
        id: number;
        name: string;
        code: string;
        unit_of_measure: string;
        category: {
            id: number;
            name: string;
        };
    };
    current_stock: number;
    minimum_stock: number;
    maximum_stock: number;
    reserved_stock: number;
    average_cost: number;
    location_code?: string;
    rack_position?: string;
    is_active: boolean;
}

interface Department {
    id: number;
    name: string;
    code: string;
}

interface Category {
    id: number;
    name: string;
}

interface StockStats {
    total_items: number;
    items_with_stock: number;
    low_stock_items: number;
    zero_stock_items: number;
    total_stock_value: number;
}

interface PageProps extends InertiaPageProps {
    stockLocations: {
        data: DepartmentInventoryLocation[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    department: Department;
    departments: Department[];
    categories: Category[];
    filters: {
        search?: string;
        category?: string;
        stock_status?: string;
    };
    stats: StockStats;
}

export default function Index() {
    const { stockLocations, department, departments, categories, filters, stats } = usePage<PageProps>().props;
    const [search, setSearch] = useState(filters.search || '');
    const [category, setCategory] = useState(filters.category || 'all');
    const [stockStatus, setStockStatus] = useState(filters.stock_status || 'all');
    const [selectedDepartment, setSelectedDepartment] = useState(department.id.toString());

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (category && category !== 'all') params.append('category', category);
        if (stockStatus && stockStatus !== 'all') params.append('stock_status', stockStatus);
        
        window.location.href = `/department-stock?department_id=${selectedDepartment}&${params.toString()}`;
    };

    const handleDepartmentChange = (deptId: string) => {
        setSelectedDepartment(deptId);
        window.location.href = `/department-stock?department_id=${deptId}`;
    };

    const handleReset = () => {
        setSearch('');
        setCategory('all');
        setStockStatus('all');
        window.location.href = `/department-stock?department_id=${selectedDepartment}`;
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
        }).format(amount);
    };

    const getStockStatusBadge = (location: DepartmentInventoryLocation) => {
        if (location.current_stock === 0) {
            return <Badge variant="destructive">Habis</Badge>;
        } else if (location.current_stock <= location.minimum_stock) {
            return <Badge variant="destructive">Stok Rendah</Badge>;
        } else if (location.current_stock > location.maximum_stock) {
            return <Badge className="bg-orange-100 text-orange-800">Overstock</Badge>;
        } else {
            return <Badge variant="default" className="bg-green-100 text-green-800">Normal</Badge>;
        }
    };

    const getAvailableStock = (location: DepartmentInventoryLocation) => {
        return location.current_stock - location.reserved_stock;
    };

    return (
        <AppLayout>
            <Head title={`Stok Inventori - ${department.name}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center">
                                    <Package className="h-8 w-8 text-blue-600" />
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Total Item</p>
                                        <div className="text-2xl font-bold">{stats.total_items}</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center">
                                    <Package className="h-8 w-8 text-green-600" />
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Ada Stok</p>
                                        <div className="text-2xl font-bold">{stats.items_with_stock}</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center">
                                    <AlertTriangle className="h-8 w-8 text-yellow-600" />
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Stok Rendah</p>
                                        <div className="text-2xl font-bold">{stats.low_stock_items}</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center">
                                    <TrendingDown className="h-8 w-8 text-red-600" />
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Stok Habis</p>
                                        <div className="text-2xl font-bold">{stats.zero_stock_items}</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center">
                                    <Calculator className="h-8 w-8 text-purple-600" />
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Nilai Stok</p>
                                        <div className="text-lg font-bold">{formatCurrency(stats.total_stock_value)}</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Stok Inventori - {department.name}</CardTitle>
                                    <CardDescription>
                                        Kelola stok barang di departemen Anda
                                    </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button asChild>
                                        <Link href={`/departments/${department.id}/stock/create`}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Tambah Item
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline">
                                        <Link href={`/departments/${department.id}/stock/opname`}>
                                            <Calculator className="h-4 w-4 mr-2" />
                                            Stock Opname
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* Filters */}
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                                <div>
                                    <Select value={selectedDepartment} onValueChange={handleDepartmentChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih Departemen" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {departments.map((dept) => (
                                                <SelectItem key={dept.id} value={dept.id.toString()}>
                                                    {dept.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="relative">
                                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <Input
                                        placeholder="Cari nama/kode barang..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-10"
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    />
                                </div>
                                
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Semua Kategori" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Kategori</SelectItem>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id.toString()}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={stockStatus} onValueChange={setStockStatus}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Status Stok" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Status</SelectItem>
                                        <SelectItem value="available">Ada Stok</SelectItem>
                                        <SelectItem value="low">Stok Rendah</SelectItem>
                                        <SelectItem value="zero">Stok Habis</SelectItem>
                                        <SelectItem value="over">Overstock</SelectItem>
                                    </SelectContent>
                                </Select>

                                <div className="flex gap-2">
                                    <Button onClick={handleSearch} className="flex-1">
                                        <Search className="h-4 w-4 mr-2" />
                                        Cari
                                    </Button>
                                    <Button variant="outline" onClick={handleReset}>
                                        <FileX className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Kode</TableHead>
                                            <TableHead>Nama Barang</TableHead>
                                            <TableHead>Kategori</TableHead>
                                            <TableHead>Stok Saat Ini</TableHead>
                                            <TableHead>Stok Tersedia</TableHead>
                                            <TableHead>Min/Max</TableHead>
                                            <TableHead>Lokasi</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Nilai Stok</TableHead>
                                            <TableHead className="text-right">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {stockLocations.data.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={10} className="text-center py-8">
                                                    <div className="text-gray-500">
                                                        <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                                        <div className="text-lg font-medium">Belum ada item</div>
                                                        <div className="text-sm">
                                                            Tambah item pertama untuk memulai manajemen stok
                                                        </div>
                                                        <Button asChild className="mt-4">
                                                            <Link href={`/department-stock/create?department_id=${department.id}`}>
                                                                <Plus className="h-4 w-4 mr-2" />
                                                                Tambah Item Pertama
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            stockLocations.data.map((location) => (
                                                <TableRow key={location.id} className={!location.is_active ? 'opacity-50' : ''}>
                                                    <TableCell className="font-mono">
                                                        {location.inventory_item.code}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium">{location.inventory_item.name}</div>
                                                            <div className="text-sm text-gray-500">
                                                                {location.inventory_item.unit_of_measure}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{location.inventory_item.category.name}</TableCell>
                                                    <TableCell>
                                                        <div className="font-medium">{location.current_stock}</div>
                                                        {location.reserved_stock > 0 && (
                                                            <div className="text-xs text-orange-600">
                                                                ({location.reserved_stock} reserved)
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>{getAvailableStock(location)}</TableCell>
                                                    <TableCell>
                                                        <div className="text-sm">
                                                            <div>Min: {location.minimum_stock}</div>
                                                            <div>Max: {location.maximum_stock}</div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-sm">
                                                            {location.location_code && (
                                                                <div>Kode: {location.location_code}</div>
                                                            )}
                                                            {location.rack_position && (
                                                                <div>Rak: {location.rack_position}</div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {getStockStatusBadge(location)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {formatCurrency(location.current_stock * location.average_cost)}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button variant="outline" size="sm" asChild>
                                                                <Link href={`/department-stock/${location.id}`}>
                                                                    <Eye className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            {stockLocations.last_page > 1 && (
                                <div className="flex items-center justify-between mt-6">
                                    <div className="text-sm text-gray-700">
                                        Menampilkan {((stockLocations.current_page - 1) * stockLocations.per_page) + 1} hingga{' '}
                                        {Math.min(stockLocations.current_page * stockLocations.per_page, stockLocations.total)} dari{' '}
                                        {stockLocations.total} item
                                    </div>
                                    <div className="flex gap-2">
                                        {stockLocations.current_page > 1 && (
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/department-stock?department_id=${selectedDepartment}&page=${stockLocations.current_page - 1}`}>
                                                    Sebelumnya
                                                </Link>
                                            </Button>
                                        )}
                                        {stockLocations.current_page < stockLocations.last_page && (
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/department-stock?department_id=${selectedDepartment}&page=${stockLocations.current_page + 1}`}>
                                                    Selanjutnya
                                                </Link>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
