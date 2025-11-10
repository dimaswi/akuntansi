import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Package, Plus, Edit, Trash2, Eye, Search, Filter } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

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
    category: {
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
    pharmacy_detail?: {
        bpom_registration?: string;
        manufacturer?: string;
        generic_name?: string;
        strength?: string;
        dosage_form?: string;
        drug_classification?: string;
    };
    general_detail?: {
        is_consumable: boolean;
        is_returnable: boolean;
        requires_maintenance: boolean;
        warranty_months?: number;
    };
}

interface Category {
    id: number;
    name: string;
}

interface Department {
    id: number;
    name: string;
}

interface Supplier {
    id: number;
    name: string;
}

interface Props {
    items: {
        data: Item[];
        links: any[];
        meta: {
            current_page: number;
            last_page: number;
            per_page: number;
            total: number;
        };
    };
    filters: {
        search?: string;
        inventory_type?: string;
        category_id?: string;
        department_id?: string;
        supplier_id?: string;
        is_active?: string;
        requires_approval?: string;
        is_controlled_substance?: string;
        perPage?: number;
    };
    categories: Category[];
    departments: Department[];
    suppliers: Supplier[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Inventory", href: "#" },
    { title: "Items", href: "/items" },
];

export default function ItemsIndex() {
    const { items, filters, categories, departments, suppliers }: Props = usePage().props as any;
    const [searchValue, setSearchValue] = useState(filters?.search || '');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);

    const handleSearch = (value: string) => {
        router.get('/items', {
            search: value || '',
            inventory_type: (filters?.inventory_type === 'all' ? '' : filters?.inventory_type) || '',
            category_id: (filters?.category_id === 'all' ? '' : filters?.category_id) || '',
            department_id: (filters?.department_id === 'all' ? '' : filters?.department_id) || '',
            supplier_id: (filters?.supplier_id === 'all' ? '' : filters?.supplier_id) || '',
            is_active: (filters?.is_active === 'all' ? '' : filters?.is_active) || '',
            perPage: filters?.perPage,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleInventoryTypeChange = (value: string) => {
        router.get('/items', {
            search: filters?.search || '',
            inventory_type: value === 'all' ? '' : value,
            category_id: (filters?.category_id === 'all' ? '' : filters?.category_id) || '',
            department_id: (filters?.department_id === 'all' ? '' : filters?.department_id) || '',
            supplier_id: (filters?.supplier_id === 'all' ? '' : filters?.supplier_id) || '',
            is_active: (filters?.is_active === 'all' ? '' : filters?.is_active) || '',
            perPage: filters?.perPage,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleCategoryChange = (value: string) => {
        router.get('/items', {
            search: filters?.search || '',
            inventory_type: (filters?.inventory_type === 'all' ? '' : filters?.inventory_type) || '',
            category_id: value === 'all' ? '' : value,
            department_id: (filters?.department_id === 'all' ? '' : filters?.department_id) || '',
            supplier_id: (filters?.supplier_id === 'all' ? '' : filters?.supplier_id) || '',
            is_active: (filters?.is_active === 'all' ? '' : filters?.is_active) || '',
            perPage: filters?.perPage,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleStatusChange = (value: string) => {
        router.get('/items', {
            search: filters?.search || '',
            inventory_type: (filters?.inventory_type === 'all' ? '' : filters?.inventory_type) || '',
            category_id: (filters?.category_id === 'all' ? '' : filters?.category_id) || '',
            department_id: (filters?.department_id === 'all' ? '' : filters?.department_id) || '',
            supplier_id: (filters?.supplier_id === 'all' ? '' : filters?.supplier_id) || '',
            is_active: value === 'all' ? '' : value,
            perPage: filters?.perPage,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handlePerPageChange = (value: string) => {
        router.get('/items', {
            search: filters?.search || '',
            inventory_type: (filters?.inventory_type === 'all' ? '' : filters?.inventory_type) || '',
            category_id: (filters?.category_id === 'all' ? '' : filters?.category_id) || '',
            department_id: (filters?.department_id === 'all' ? '' : filters?.department_id) || '',
            supplier_id: (filters?.supplier_id === 'all' ? '' : filters?.supplier_id) || '',
            is_active: (filters?.is_active === 'all' ? '' : filters?.is_active) || '',
            perPage: parseInt(value),
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handlePageChange = (page: number) => {
        router.get('/items', {
            search: filters?.search || '',
            inventory_type: (filters?.inventory_type === 'all' ? '' : filters?.inventory_type) || '',
            category_id: (filters?.category_id === 'all' ? '' : filters?.category_id) || '',
            department_id: (filters?.department_id === 'all' ? '' : filters?.department_id) || '',
            supplier_id: (filters?.supplier_id === 'all' ? '' : filters?.supplier_id) || '',
            is_active: (filters?.is_active === 'all' ? '' : filters?.is_active) || '',
            perPage: filters?.perPage,
            page,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleDelete = async (id: number) => {
        setItemToDelete(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (itemToDelete) {
            try {
                await router.delete(route('items.destroy', itemToDelete));
                toast.success('Item berhasil dihapus');
                setDeleteDialogOpen(false);
                setItemToDelete(null);
            } catch (error) {
                toast.error('Gagal menghapus item');
            }
        }
    };

    const getInventoryTypeBadge = (type: string) => {
        return type === 'pharmacy' ? (
            <Badge variant="default" className="bg-green-100 text-green-800">
                Farmasi
            </Badge>
        ) : (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Umum
            </Badge>
        );
    };

    const getStatusBadge = (isActive: boolean) => {
        return isActive ? (
            <Badge variant="default" className="bg-green-100 text-green-800">
                Aktif
            </Badge>
        ) : (
            <Badge variant="destructive" className="bg-red-100 text-red-800">
                Nonaktif
            </Badge>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Items" />
            <div className="max-w-7xl p-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Package className="h-6 w-6 text-blue-600" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Manajemen Items</h1>
                                <p className="text-sm text-gray-600">Kelola data items inventory farmasi dan umum</p>
                            </div>
                        </div>
                        <Button 
                            onClick={() => router.visit(route('items.create'))}
                            className="flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Tambah Item
                        </Button>
                    </div>
                </div>

                {/* Filters Card */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filter & Pencarian
                        </CardTitle>
                        <CardDescription>
                            Filter dan cari items berdasarkan kriteria tertentu
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="search">Pencarian</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="search"
                                        placeholder="Cari kode, nama item..."
                                        value={searchValue}
                                        onChange={(e) => setSearchValue(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleSearch(searchValue);
                                            }
                                        }}
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Tipe Inventory</Label>
                                <Select value={filters?.inventory_type || 'all'} onValueChange={handleInventoryTypeChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih tipe" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Tipe</SelectItem>
                                        <SelectItem value="pharmacy">Farmasi</SelectItem>
                                        <SelectItem value="general">Umum</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Kategori</Label>
                                <Select value={filters?.category_id || 'all'} onValueChange={handleCategoryChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih kategori" />
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

                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={filters?.is_active || 'all'} onValueChange={handleStatusChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Status</SelectItem>
                                        <SelectItem value="1">Aktif</SelectItem>
                                        <SelectItem value="0">Nonaktif</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Label htmlFor="perPage">Items per halaman:</Label>
                                <Select value={filters?.perPage?.toString() || '15'} onValueChange={handlePerPageChange}>
                                    <SelectTrigger className="w-20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="15">15</SelectItem>
                                        <SelectItem value="25">25</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button 
                                variant="outline" 
                                onClick={() => handleSearch(searchValue)}
                                className="flex items-center gap-2"
                            >
                                <Search className="h-4 w-4" />
                                Cari
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Data Table Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Data Items</CardTitle>
                        <CardDescription>
                            Total {items.meta.total} items ditemukan
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {items.data.length === 0 ? (
                            <div className="text-center py-8">
                                <Package className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada items</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Belum ada items yang tersedia. Tambahkan item pertama Anda.
                                </p>
                                <div className="mt-6">
                                    <Button onClick={() => router.visit(route('items.create'))}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Tambah Item
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[100px]">Kode</TableHead>
                                                <TableHead>Nama Item</TableHead>
                                                <TableHead>Tipe</TableHead>
                                                <TableHead>Kategori</TableHead>
                                                <TableHead>Satuan</TableHead>
                                                <TableHead>Stok Min</TableHead>
                                                <TableHead>Stok Max</TableHead>
                                                <TableHead>Harga Standar</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Aksi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {items.data.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell className="font-medium">{item.code}</TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium">{item.name}</div>
                                                            {item.description && (
                                                                <div className="text-sm text-muted-foreground">
                                                                    {item.description.length > 50 
                                                                        ? `${item.description.substring(0, 50)}...` 
                                                                        : item.description
                                                                    }
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{getInventoryTypeBadge(item.inventory_type)}</TableCell>
                                                    <TableCell>{item.category.name}</TableCell>
                                                    <TableCell>{item.unit_of_measure}</TableCell>
                                                    <TableCell>{item.reorder_level}</TableCell>
                                                    <TableCell>{item.max_level}</TableCell>
                                                    <TableCell>Rp {item.standard_cost.toLocaleString('id-ID')}</TableCell>
                                                    <TableCell>{getStatusBadge(item.is_active)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => router.visit(route('items.show', item.id))}
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => router.visit(route('items.edit', item.id))}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDelete(item.id)}
                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination */}
                                {items.meta.last_page > 1 && (
                                    <div className="flex items-center justify-between space-x-2 py-4">
                                        <div className="text-sm text-muted-foreground">
                                            Menampilkan {((items.meta.current_page - 1) * items.meta.per_page) + 1} sampai{' '}
                                            {Math.min(items.meta.current_page * items.meta.per_page, items.meta.total)} dari{' '}
                                            {items.meta.total} items
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handlePageChange(items.meta.current_page - 1)}
                                                disabled={items.meta.current_page <= 1}
                                            >
                                                Sebelumnya
                                            </Button>
                                            <div className="flex items-center space-x-1">
                                                {Array.from({ length: Math.min(5, items.meta.last_page) }, (_, i) => {
                                                    const page = i + Math.max(1, items.meta.current_page - 2);
                                                    if (page > items.meta.last_page) return null;
                                                    return (
                                                        <Button
                                                            key={page}
                                                            variant={page === items.meta.current_page ? "default" : "outline"}
                                                            size="sm"
                                                            onClick={() => handlePageChange(page)}
                                                        >
                                                            {page}
                                                        </Button>
                                                    );
                                                })}
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handlePageChange(items.meta.current_page + 1)}
                                                disabled={items.meta.current_page >= items.meta.last_page}
                                            >
                                                Selanjutnya
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Item?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus item ini? Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data terkait.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setItemToDelete(null)}>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
