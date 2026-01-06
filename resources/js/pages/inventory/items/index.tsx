import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem, SharedData } from "@/types";
import { Head, router, usePage } from "@inertiajs/react";
import { Edit3, PlusCircle, Search, Trash, X, Loader2, Eye, Package, Filter, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from '@/lib/toast';
import { route } from "ziggy-js";

interface Department {
    id: number;
    name: string;
}

interface ItemStock {
    id: number;
    item_id: number;
    department_id: number | null; // null = central warehouse
    quantity_on_hand: number;
    reserved_quantity: number;
    available_quantity: number;
    last_unit_cost: number;
    average_unit_cost: number;
    total_value: number;
}

interface Item {
    id: number;
    code: string;
    name: string;
    description?: string;
    inventory_type: 'pharmacy' | 'general';
    unit_of_measure: string;
    pack_size: number;
    reorder_level: number;
    max_level: number;
    safety_stock: number;
    standard_cost: number;
    last_purchase_cost?: number;
    is_active: boolean;
    requires_approval: boolean;
    is_controlled_substance: boolean;
    requires_prescription: boolean;
    category?: {
        id: number;
        name: string;
    };
    department?: {
        id: number;
        name: string;
    };
    supplier?: {
        id: number;
        name: string;
    };
    stocks?: ItemStock[]; // Central warehouse (logistics) or department stock (non-logistics)
}

interface Category {
    id: number;
    name: string;
}

interface Supplier {
    id: number;
    name: string;
}

interface PaginatedItems {
    data: Item[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Props extends SharedData {
    items: PaginatedItems;
    filters: {
        search: string;
        inventory_type?: string;
        category_id?: string;
        department_id?: string;
        supplier_id?: string;
        is_active?: string;
        stock_status?: string;
        perPage: number;
    };
    categories: Category[];
    departments: Department[];
    suppliers: Supplier[];
    isLogistics: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: <Package className="h-4 w-4" />, href: '#' },
    {
        title: "Items",
        href: '#',
    },
];

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
};

export default function ItemsIndex() {
    const { items, filters, categories, departments, suppliers, isLogistics } = usePage<Props>().props;
    const [search, setSearch] = useState(filters.search);
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        item: Item | null;
        loading: boolean;
    }>({
        open: false,
        item: null,
        loading: false,
    });

    const handleSearch = (searchValue: string) => {
        router.get(
            '/items',
            {
                search: searchValue,
                perPage: filters.perPage,
                inventory_type: filters.inventory_type || '',
                category_id: filters.category_id || '',
                department_id: filters.department_id || '',
                supplier_id: filters.supplier_id || '',
                is_active: filters.is_active || '',
                stock_status: filters.stock_status || '',
                page: 1,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSearch(search);
    };

    const handleClearSearch = () => {
        setSearch('');
        handleSearch('');
    };

    const handleInventoryTypeChange = (type: string) => {
        router.get(
            '/items',
            {
                search: filters.search || '',
                perPage: filters.perPage,
                inventory_type: type === 'all' ? '' : type,
                category_id: filters.category_id || '',
                department_id: filters.department_id || '',
                supplier_id: filters.supplier_id || '',
                is_active: filters.is_active || '',
                stock_status: filters.stock_status || '',
                page: 1,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleCategoryChange = (category: string) => {
        router.get(
            '/items',
            {
                search: filters.search || '',
                perPage: filters.perPage,
                inventory_type: filters.inventory_type || '',
                category_id: category === 'all' ? '' : category,
                department_id: filters.department_id || '',
                supplier_id: filters.supplier_id || '',
                is_active: filters.is_active || '',
                stock_status: filters.stock_status || '',
                page: 1,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleDepartmentChange = (department: string) => {
        router.get(
            '/items',
            {
                search: filters.search || '',
                perPage: filters.perPage,
                inventory_type: filters.inventory_type || '',
                category_id: filters.category_id || '',
                department_id: department === 'all' ? '' : department,
                supplier_id: filters.supplier_id || '',
                is_active: filters.is_active || '',
                stock_status: filters.stock_status || '',
                page: 1,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleSupplierChange = (supplier: string) => {
        router.get(
            '/items',
            {
                search: filters.search || '',
                perPage: filters.perPage,
                inventory_type: filters.inventory_type || '',
                category_id: filters.category_id || '',
                department_id: filters.department_id || '',
                supplier_id: supplier === 'all' ? '' : supplier,
                is_active: filters.is_active || '',
                stock_status: filters.stock_status || '',
                page: 1,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleStatusChange = (status: string) => {
        router.get(
            '/items',
            {
                search: filters.search || '',
                perPage: filters.perPage,
                inventory_type: filters.inventory_type || '',
                category_id: filters.category_id || '',
                department_id: filters.department_id || '',
                supplier_id: filters.supplier_id || '',
                is_active: status === 'all' ? '' : status,
                stock_status: filters.stock_status || '',
                page: 1,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleStockStatusChange = (stockStatus: string) => {
        router.get(
            '/items',
            {
                search: filters.search || '',
                perPage: filters.perPage,
                inventory_type: filters.inventory_type || '',
                category_id: filters.category_id || '',
                department_id: filters.department_id || '',
                supplier_id: filters.supplier_id || '',
                is_active: filters.is_active || '',
                stock_status: stockStatus === 'all' ? '' : stockStatus,
                page: 1,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    // Check if any filter is active
    const hasActiveFilters = (filters.inventory_type && filters.inventory_type !== '') || 
                            (filters.category_id && filters.category_id !== '') ||
                            (filters.department_id && filters.department_id !== '') ||
                            (filters.supplier_id && filters.supplier_id !== '') ||
                            (filters.is_active && filters.is_active !== '') ||
                            (filters.stock_status && filters.stock_status !== '') ||
                            (filters.search && filters.search !== '');

    // Keep filter expanded if there are active filters
    useEffect(() => {
        if (hasActiveFilters) {
            setIsFilterExpanded(true);
        }
    }, [hasActiveFilters]);

    const handleResetFilters = () => {
        setSearch('');
        router.get('/items', {
            search: '',
            perPage: filters.perPage,
            inventory_type: '',
            category_id: '',
            department_id: '',
            supplier_id: '',
            is_active: '',
            stock_status: '',
            page: 1,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get(
            '/items',
            {
                search: filters.search || '',
                perPage,
                inventory_type: filters.inventory_type || '',
                category_id: filters.category_id || '',
                department_id: filters.department_id || '',
                supplier_id: filters.supplier_id || '',
                is_active: filters.is_active || '',
                page: 1,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const handlePageChange = (page: number) => {
        router.get(
            '/items',
            {
                search: filters.search || '',
                perPage: filters.perPage,
                inventory_type: filters.inventory_type || '',
                category_id: filters.category_id || '',
                department_id: filters.department_id || '',
                supplier_id: filters.supplier_id || '',
                is_active: filters.is_active || '',
                page,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const handleDelete = async () => {
        if (!deleteDialog.item) return;

        setDeleteDialog((prev) => ({ ...prev, loading: true }));

        try {
            router.delete(route('items.destroy', deleteDialog.item.id), {
                onSuccess: () => {
                    setDeleteDialog({ open: false, item: null, loading: false });
                },
                onError: (errors) => {
                    toast.error(errors?.message || 'Gagal menghapus item');
                    setDeleteDialog((prev) => ({ ...prev, loading: false }));
                },
            });
        } catch (error) {
            toast.error('Terjadi kesalahan');
            setDeleteDialog((prev) => ({ ...prev, loading: false }));
        }
    };

    const getInventoryTypeBadge = (type: string) => {
        return type === 'pharmacy' ? (
            <Badge className="bg-green-100 text-green-800">
                Farmasi
            </Badge>
        ) : (
            <Badge className="bg-blue-100 text-blue-800">
                Umum
            </Badge>
        );
    };

    const getStatusBadge = (isActive: boolean) => {
        return isActive ? (
            <Badge variant="default">Aktif</Badge>
        ) : (
            <Badge variant="secondary">Nonaktif</Badge>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Data Barang" />

            <Card className="mt-4">
                <CardHeader>
                    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Data Barang
                            </CardTitle>
                            <CardDescription>
                                {isLogistics 
                                    ? 'Kelola data barang inventory farmasi dan umum untuk semua departemen'
                                    : 'Daftar barang yang tersedia untuk departemen Anda'
                                }
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                                className="gap-2"
                            >
                                <Filter className="h-4 w-4" />
                                {isFilterExpanded ? 'Tutup Filter' : 'Filter'}
                            </Button>
                            {isLogistics && (
                                <Button onClick={() => router.visit(route('items.create'))} className="gap-2">
                                    <PlusCircle className="h-4 w-4" />
                                    Tambah Barang
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Search */}
                    <div className="flex-1">
                        <Label htmlFor="search">Cari</Label>
                        <form onSubmit={handleSearchSubmit} className="flex gap-2">
                            <Input
                                id="search"
                                placeholder="Cari kode atau nama barang..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="flex-1"
                            />
                            <Button type="submit" variant="outline" size="icon">
                                <Search className="h-4 w-4" />
                            </Button>
                            {search && (
                                <Button type="button" variant="outline" size="icon" onClick={handleClearSearch}>
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </form>
                    </div>

                    {/* Filters */}
                    {isFilterExpanded && (
                        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-end flex-wrap">
                                <div className="grid gap-2">
                                    <Label className="text-sm font-medium">Tipe Inventory</Label>
                                    <Select value={filters.inventory_type || 'all'} onValueChange={handleInventoryTypeChange}>
                                        <SelectTrigger className="w-48">
                                            <SelectValue placeholder="Pilih Tipe" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Tipe</SelectItem>
                                            <SelectItem value="pharmacy">Farmasi</SelectItem>
                                            <SelectItem value="general">Umum</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-sm font-medium">Kategori</Label>
                                    <Select value={filters.category_id || 'all'} onValueChange={handleCategoryChange}>
                                        <SelectTrigger className="w-48">
                                            <SelectValue placeholder="Pilih Kategori" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Kategori</SelectItem>
                                            {categories.map((category) => (
                                                <SelectItem key={category.id} value={category.id.toString()}>
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {isLogistics && (
                                    <div className="grid gap-2">
                                        <Label className="text-sm font-medium">Departemen</Label>
                                        <Select value={filters.department_id || 'all'} onValueChange={handleDepartmentChange}>
                                            <SelectTrigger className="w-48">
                                                <SelectValue placeholder="Pilih Departemen" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Semua Departemen</SelectItem>
                                                {departments.map((department) => (
                                                    <SelectItem key={department.id} value={department.id.toString()}>
                                                        {department.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                <div className="grid gap-2">
                                    <Label className="text-sm font-medium">Supplier</Label>
                                    <Select value={filters.supplier_id || 'all'} onValueChange={handleSupplierChange}>
                                        <SelectTrigger className="w-48">
                                            <SelectValue placeholder="Pilih Supplier" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Supplier</SelectItem>
                                            {suppliers.map((supplier) => (
                                                <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                                    {supplier.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-sm font-medium">Status Stok</Label>
                                    <Select value={filters.stock_status || 'all'} onValueChange={handleStockStatusChange}>
                                        <SelectTrigger className="w-48">
                                            <SelectValue placeholder="Pilih Status Stok" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Status Stok</SelectItem>
                                            <SelectItem value="out_of_stock">
                                                <div className="flex items-center gap-2">
                                                    <AlertTriangle className="h-4 w-4 text-red-500" />
                                                    <span>Out of Stock</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="low_stock">
                                                <div className="flex items-center gap-2">
                                                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                                                    <span>Low Stock</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="below_safety">
                                                <div className="flex items-center gap-2">
                                                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                                    <span>Below Safety Stock</span>
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-sm font-medium">Status</Label>
                                    <Select value={filters.is_active || 'all'} onValueChange={handleStatusChange}>
                                        <SelectTrigger className="w-36">
                                            <SelectValue placeholder="Pilih Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Status</SelectItem>
                                            <SelectItem value="1">Aktif</SelectItem>
                                            <SelectItem value="0">Nonaktif</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {hasActiveFilters && (
                                    <Button variant="outline" onClick={handleResetFilters} className="flex items-center gap-2">
                                        <X className="h-4 w-4" />
                                        Reset Filter
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Table */}
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[60px]">No</TableHead>
                                    <TableHead>Kode</TableHead>
                                    <TableHead>Nama Barang</TableHead>
                                    <TableHead>Tipe</TableHead>
                                    <TableHead>Kategori</TableHead>
                                    {isLogistics && <TableHead>Departemen</TableHead>}
                                    <TableHead>Satuan</TableHead>
                                    <TableHead className="text-right">Stok</TableHead>
                                    <TableHead className="text-right">Min</TableHead>
                                    <TableHead className="text-right">Max</TableHead>
                                    <TableHead className="text-right">Harga</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-[100px] text-center">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={isLogistics ? 13 : 12} className="py-8 text-center text-muted-foreground">
                                            Tidak ada data barang
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    items.data.map((item, index) => {
                                        // Get stock based on user type
                                        const stock = item.stocks?.[0]; // First stock (central for logistics, department for others)
                                        const currentStock = stock?.quantity_on_hand || 0;
                                        const minStock = item.reorder_level || 0;
                                        const maxStock = item.max_level || 0;
                                        
                                        return (
                                            <TableRow key={item.id}>
                                                <TableCell>{(items.current_page - 1) * items.per_page + index + 1}</TableCell>
                                                <TableCell className="font-medium">{item.code}</TableCell>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{item.name}</div>
                                                        {item.description && (
                                                            <div className="text-sm text-muted-foreground">
                                                                {item.description.length > 40 
                                                                    ? `${item.description.substring(0, 40)}...` 
                                                                    : item.description
                                                                }
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{getInventoryTypeBadge(item.inventory_type)}</TableCell>
                                                <TableCell>{item.category?.name || '-'}</TableCell>
                                                {isLogistics && (
                                                    <TableCell>
                                                        {stock?.department_id 
                                                            ? departments.find(d => d.id === stock.department_id)?.name || '-'
                                                            : 'Central Warehouse'
                                                        }
                                                    </TableCell>
                                                )}
                                                <TableCell>{item.unit_of_measure}</TableCell>
                                                <TableCell className="text-right">
                                                    <Badge 
                                                        variant={currentStock <= minStock ? "destructive" : "default"}
                                                        className={currentStock <= minStock ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}
                                                    >
                                                        {currentStock}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">{minStock}</TableCell>
                                                <TableCell className="text-right">{maxStock}</TableCell>
                                                <TableCell className="text-right font-mono">
                                                    {formatCurrency(item.standard_cost)}
                                                </TableCell>
                                                <TableCell>{getStatusBadge(item.is_active)}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => router.visit(route('items.show', item.id))}
                                                            className="h-8 w-8 p-0"
                                                            title="Detail"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        {isLogistics && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => router.visit(route('items.edit', item.id))}
                                                                className="h-8 w-8 p-0"
                                                                title="Edit"
                                                            >
                                                                <Edit3 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {isLogistics && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() =>
                                                                    setDeleteDialog({
                                                                        open: true,
                                                                        item,
                                                                        loading: false,
                                                                    })
                                                                }
                                                                className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                                                                title="Hapus"
                                                            >
                                                                <Trash className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Label className="text-sm">Per halaman</Label>
                                <Select value={(filters?.perPage || 15).toString()} onValueChange={(value) => handlePerPageChange(parseInt(value))}>
                                    <SelectTrigger className="w-20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="15">15</SelectItem>
                                        <SelectItem value="25">25</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Menampilkan {items.from} sampai {items.to} dari {items.total} barang
                            </div>
                        </div>
                        {items.last_page > 1 && (
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(items.current_page - 1)}
                                    disabled={items.current_page === 1}
                                >
                                    Sebelumnya
                                </Button>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, items.last_page) }, (_, i) => {
                                        const page = Math.max(1, items.current_page - 2) + i;
                                        if (page > items.last_page) return null;
                                        return (
                                            <Button
                                                key={page}
                                                variant={page === items.current_page ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => handlePageChange(page)}
                                                className="w-8"
                                            >
                                                {page}
                                            </Button>
                                        );
                                    })}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(items.current_page + 1)}
                                    disabled={items.current_page === items.last_page}
                                >
                                    Selanjutnya
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Delete Dialog */}
            <Dialog
                open={deleteDialog.open}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteDialog({ open: false, item: null, loading: false });
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Barang</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus barang "{deleteDialog.item?.name}"? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialog({ open: false, item: null, loading: false })}
                            disabled={deleteDialog.loading}
                        >
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleteDialog.loading}>
                            {deleteDialog.loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
