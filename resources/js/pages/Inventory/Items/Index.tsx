import { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import AppLayout from '@/layouts/app-layout';
import { PageProps, BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Inventory',
        href: '/inventory',
    },
    {
        title: 'Items',
        href: '/inventory/items',
    },
];

interface Category {
    id: number;
    name: string;
}

interface DepartmentInfo {
    department_name: string;
    department_code: string;
    department_stock: number;
    department_reserved: number;
    department_available: number;
    min_stock: number;
    max_stock: number;
}

interface Department {
    id: number;
    name: string;
    code: string;
}

interface Item {
    id: number;
    name: string;
    code: string;
    description?: string;
    category: Category;
    reorder_level: number;
    current_stock: number;
    available_stock: number;
    reserved_stock: number;
    unit: string;
    standard_cost: number;
    type: 'pharmacy' | 'general';
    status: 'active' | 'inactive';
    pack_size: number;
    max_level: number;
    safety_stock: number;
    last_updated: string;
    department_info?: DepartmentInfo;
}

interface Props extends PageProps {
    items?: {
        data: Item[];
        links: any[];
        meta: {
            current_page: number;
            from: number;
            last_page: number;
            path: string;
            per_page: number;
            to: number;
            total: number;
        };
    };
    categories?: Category[];
    filters?: {
        search: string;
        category: string;
        status: string;
        type: string;
    };
    can_view_all_departments?: boolean;
    user_department?: Department;
}

// Helper functions
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

const getStockStatus = (currentStock: number, reorderLevel: number) => {
    if (currentStock === 0) {
        return { label: 'Habis', color: 'bg-red-100 text-red-800' };
    } else if (currentStock <= reorderLevel) {
        return { label: 'Stok Rendah', color: 'bg-yellow-100 text-yellow-800' };
    } else {
        return { label: 'Tersedia', color: 'bg-green-100 text-green-800' };
    }
};

export default function Index({ items, categories, filters, can_view_all_departments, user_department }: Props) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [categoryFilter, setCategoryFilter] = useState(filters?.category || 'all');
    const [statusFilter, setStatusFilter] = useState(filters?.status || 'all');
    const [typeFilter, setTypeFilter] = useState(filters?.type || 'all');
    const [showFilters, setShowFilters] = useState(false);

    // Form-based search - only search when form is submitted
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        
        const params: Record<string, string> = {};
        
        if (searchTerm.trim()) {
            params.search = searchTerm.trim();
        }
        if (categoryFilter !== 'all') {
            params.category = categoryFilter;
        }
        if (statusFilter !== 'all') {
            params.status = statusFilter;
        }
        if (typeFilter !== 'all') {
            params.type = typeFilter;
        }

        router.get('/inventory/items', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleFilterChange = () => {
        const params: Record<string, string> = {};
        
        if (searchTerm.trim()) {
            params.search = searchTerm.trim();
        }
        if (categoryFilter !== 'all') {
            params.category = categoryFilter;
        }
        if (statusFilter !== 'all') {
            params.status = statusFilter;
        }
        if (typeFilter !== 'all') {
            params.type = typeFilter;
        }

        router.get('/inventory/items', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setSearchTerm('');
        setCategoryFilter('all');
        setStatusFilter('all');
        setTypeFilter('all');
        router.get('/inventory/items', {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handlePageChange = (url: string) => {
        router.get(url, {
            search: searchTerm || undefined,
            category: categoryFilter !== 'all' ? categoryFilter : undefined,
            status: statusFilter !== 'all' ? statusFilter : undefined,
            type: typeFilter !== 'all' ? typeFilter : undefined,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Convert categories for Combobox
    const categoryOptions = (categories || []).map(category => ({
        value: category.id.toString(),
        label: category.name,
        description: `Kategori: ${category.name}`
    }));

    return (
        <AppLayout>
            <Head title="Items" />
            
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Items</h1>
                        <p className="text-muted-foreground">
                            Kelola item inventory rumah sakit
                        </p>
                    </div>
                    <Button 
                        onClick={() => router.visit('/inventory/items/create')}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        ➕ Tambah Item
                    </Button>
                </div>

                {/* Search Form - Enter to search */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Input
                                        placeholder="🔍 Cari obat berdasarkan nama, kode, atau deskripsi... (Tekan Enter untuk mencari)"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pr-10"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button 
                                        type="submit"
                                        variant="default"
                                        className="min-w-[100px]"
                                    >
                                        🔍 Cari
                                    </Button>
                                    <Button 
                                        type="button"
                                        variant="outline" 
                                        onClick={() => setShowFilters(!showFilters)}
                                    >
                                        🔧 Filter
                                    </Button>
                                    <Button 
                                        type="button"
                                        onClick={handleReset} 
                                        variant="outline"
                                    >
                                        🔄 Reset
                                    </Button>
                                </div>
                            </form>

                            {showFilters && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">Kategori</label>
                                        <Combobox
                                            options={[
                                                { value: 'all', label: 'Semua Kategori', description: 'Tampilkan semua kategori' },
                                                ...categoryOptions
                                            ]}
                                            value={categoryFilter}
                                            onValueChange={(value) => {
                                                setCategoryFilter(value);
                                                setTimeout(handleFilterChange, 100);
                                            }}
                                            placeholder="Pilih kategori..."
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium mb-2 block">Status</label>
                                        <Select value={statusFilter} onValueChange={(value) => {
                                            setStatusFilter(value);
                                            setTimeout(handleFilterChange, 100);
                                        }}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Filter berdasarkan status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Semua Status</SelectItem>
                                                <SelectItem value="active">Aktif</SelectItem>
                                                <SelectItem value="inactive">Tidak Aktif</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium mb-2 block">Tipe</label>
                                        <Select value={typeFilter} onValueChange={(value) => {
                                            setTypeFilter(value);
                                            setTimeout(handleFilterChange, 100);
                                        }}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Filter berdasarkan tipe" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Semua Tipe</SelectItem>
                                                <SelectItem value="pharmacy">Pharmacy/Obat</SelectItem>
                                                <SelectItem value="general">General/Umum</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Items List */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            💊 Daftar Obat & Item
                            <Badge variant="secondary">{items?.meta?.total || 0} items</Badge>
                            {!can_view_all_departments && user_department && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    {user_department.name} ({user_department.code})
                                </Badge>
                            )}
                        </CardTitle>
                        <CardDescription>
                            {can_view_all_departments ? (
                                <>
                                    Menampilkan semua item dari seluruh departemen • 
                                    {items?.meta?.from || 0}-{items?.meta?.to || 0} dari {items?.meta?.total || 0} items
                                </>
                            ) : (
                                <>
                                    Menampilkan item yang tersedia di departemen {user_department?.name} • 
                                    {items?.meta?.from || 0}-{items?.meta?.to || 0} dari {items?.meta?.total || 0} items
                                </>
                            )}
                            {searchTerm && (
                                <span className="ml-2">
                                    • Pencarian: "<span className="font-medium">{searchTerm}</span>"
                                </span>
                            )}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!items?.data || items.data.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">💊</div>
                                <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                                    {searchTerm ? 'Tidak ada obat ditemukan' : 'Belum ada obat'}
                                </h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {searchTerm 
                                        ? `Coba ubah kata kunci pencarian "${searchTerm}" atau filter yang dipilih`
                                        : 'Mulai tambahkan obat dan item inventory'
                                    }
                                </p>
                                <div className="flex gap-2 justify-center">
                                    {searchTerm && (
                                        <Button 
                                            onClick={handleReset}
                                            variant="outline"
                                        >
                                            🔄 Reset Pencarian
                                        </Button>
                                    )}
                                    <Button 
                                        onClick={() => router.visit('/inventory/items/create')}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        ➕ Tambah Item Pertama
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {items?.data?.map((item) => {
                                    const stockStatus = getStockStatus(item.current_stock, item.reorder_level);
                                    
                                    return (
                                        <div key={item.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h3 className="font-semibold text-lg">{item.name}</h3>
                                                                <Badge variant={item.type === 'pharmacy' ? 'default' : 'secondary'}>
                                                                    {item.type === 'pharmacy' ? '💊 Obat' : '📦 General'}
                                                                </Badge>
                                                                <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                                                                    {item.status === 'active' ? '✅ Aktif' : '⏸️ Nonaktif'}
                                                                </Badge>
                                                            </div>
                                                            <div className="text-sm text-muted-foreground space-y-1">
                                                                <div className="flex flex-wrap gap-4">
                                                                    <span>Kode: <span className="font-mono font-medium">{item.code}</span></span>
                                                                    <span>Pack Size: <span className="font-medium">{item.pack_size}</span></span>
                                                                </div>
                                                                <div className="flex flex-wrap gap-4">
                                                                    <span>Kategori: <span className="font-medium">{item.category.name}</span></span>
                                                                    <span>Unit: <span className="font-medium">{item.unit}</span></span>
                                                                    <span>Harga: <span className="font-medium">{formatCurrency(item.standard_cost)}</span></span>
                                                                </div>
                                                                {item.department_info && (
                                                                    <div className="bg-blue-50 border border-blue-200 rounded-md p-2 mt-2">
                                                                        <div className="text-xs font-medium text-blue-800 mb-1">
                                                                            📍 Stok di {item.department_info.department_name}
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-3 text-xs">
                                                                            <span className="text-blue-700">
                                                                                Stok: <span className="font-bold">{item.department_info.department_stock}</span>
                                                                            </span>
                                                                            <span className="text-blue-700">
                                                                                Tersedia: <span className="font-bold">{item.department_info.department_available}</span>
                                                                            </span>
                                                                            <span className="text-blue-700">
                                                                                Reserved: <span className="font-bold">{item.department_info.department_reserved}</span>
                                                                            </span>
                                                                            <span className="text-blue-700">
                                                                                Min: <span className="font-bold">{item.department_info.min_stock}</span>
                                                                            </span>
                                                                            <span className="text-blue-700">
                                                                                Max: <span className="font-bold">{item.department_info.max_stock}</span>
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {item.description && (
                                                                    <div>Deskripsi: <span className="font-medium">{item.description}</span></div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold">{item.current_stock}</div>
                                                        <div className="text-xs text-muted-foreground">Stok Saat Ini</div>
                                                        <div className="text-xs text-muted-foreground">Reorder: {item.reorder_level}</div>
                                                        <div className="text-xs text-muted-foreground">Max: {item.max_level}</div>
                                                        <Badge className={stockStatus.color}>
                                                            {stockStatus.label}
                                                        </Badge>
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => router.visit(`/inventory/items/${item.id}/edit`)}
                                                        >
                                                            ✏️ Edit
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => router.visit(`/inventory/items/${item.id}`)}
                                                        >
                                                            👁️ Detail
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Pagination */}
                        {(items?.meta?.last_page || 0) > 1 && (
                            <div className="flex justify-center gap-2 mt-6">
                                {items?.links?.map((link, index) => (
                                    <Button
                                        key={index}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => link.url && handlePageChange(link.url)}
                                        disabled={!link.url}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
