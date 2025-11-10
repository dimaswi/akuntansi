import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePermission } from '@/hooks/use-permission';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Edit3, Loader2, Package, PlusCircle, Search, Trash, X, Filter, Home, Eye } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

interface ItemCategory {
    id: number;
    code: string;
    name: string;
    category_type: 'pharmacy' | 'general' | 'medical';
    parent_id: number | null;
    is_active: boolean;
    requires_batch_tracking: boolean;
    requires_expiry_tracking: boolean;
    parent?: ItemCategory;
    created_at: string;
    updated_at: string;
}

interface PaginatedItemCategory {
    data: ItemCategory[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Props extends SharedData {
    categories: PaginatedItemCategory;
    filters: {
        search: string;
        perPage: number;
        category_type: string;
        is_active: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: <Package className="h-4 w-4" />, href: '#' },
    {
        title: "Item Categories",
        href: '#',
    },
];

const categoryTypeLabels = {
    pharmacy: 'Farmasi',
    general: 'Umum',
    medical: 'Alat Kesehatan',
};

const categoryTypeColors = {
    pharmacy: 'bg-blue-100 text-blue-800',
    general: 'bg-green-100 text-green-800',
    medical: 'bg-purple-100 text-purple-800',
};

export default function ItemCategoryIndex() {
    const { categories, filters } = usePage<Props>().props;
    const { hasPermission } = usePermission();
    const [search, setSearch] = useState(filters.search);
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        category: ItemCategory | null;
        loading: boolean;
    }>({
        open: false,
        category: null,
        loading: false,
    });

    const handleSearch = (searchValue: string) => {
        router.get(
            '/item-categories',
            {
                search: searchValue,
                perPage: filters.perPage,
                category_type: filters.category_type || '',
                is_active: filters.is_active || '',
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

    const handleCategoryTypeChange = (type: string) => {
        router.get(
            '/item-categories',
            {
                search: filters.search || '',
                perPage: filters.perPage,
                category_type: type === 'all' ? '' : type,
                is_active: filters.is_active || '',
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleStatusChange = (status: string) => {
        router.get(
            '/item-categories',
            {
                search: filters.search || '',
                perPage: filters.perPage,
                category_type: filters.category_type || '',
                is_active: status === 'all' ? '' : status,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handlePerPageChange = (perPage: number) => {
        router.get(
            '/item-categories',
            {
                search: filters.search || '',
                perPage,
                category_type: filters.category_type || '',
                is_active: filters.is_active || '',
                page: 1,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handlePageChange = (page: number) => {
        router.get(
            '/item-categories',
            {
                search: filters.search || '',
                perPage: filters.perPage,
                category_type: filters.category_type || '',
                is_active: filters.is_active || '',
                page,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleDelete = async () => {
        if (!deleteDialog.category) return;

        setDeleteDialog((prev) => ({ ...prev, loading: true }));

        try {
            router.delete(route('item_categories.destroy', deleteDialog.category.id), {
                onSuccess: () => {
                    toast.success('Kategori berhasil dihapus');
                    setDeleteDialog({ open: false, category: null, loading: false });
                },
                onError: () => {
                    toast.error('Gagal menghapus kategori');
                    setDeleteDialog((prev) => ({ ...prev, loading: false }));
                },
            });
        } catch (error) {
            toast.error('Terjadi kesalahan');
            setDeleteDialog((prev) => ({ ...prev, loading: false }));
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kategori Barang" />

            <Card className="mt-4">
                <CardHeader>
                    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Kategori Barang
                            </CardTitle>
                            <CardDescription>Kelola kategori barang untuk farmasi, umum, dan alat kesehatan</CardDescription>
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
                            {hasPermission('inventory.categories.create') && (
                                <Button onClick={() => router.visit('/item-categories/create')} className="gap-2">
                                    <PlusCircle className="h-4 w-4" />
                                    Tambah Kategori
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Search Bar */}
                    <form onSubmit={handleSearchSubmit} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="search"
                                placeholder="Cari kode atau nama kategori..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Button type="submit" className="gap-2">
                            <Search className="h-4 w-4" />
                            Search
                        </Button>
                        {search && (
                            <Button type="button" variant="outline" onClick={handleClearSearch}>
                                Clear
                            </Button>
                        )}
                    </form>

                    {/* Collapsible Filters */}
                    {isFilterExpanded && (
                        <div className="p-4 border rounded-lg bg-gray-50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Tipe</Label>
                                    <Select value={filters.category_type || 'all'} onValueChange={handleCategoryTypeChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Tipe" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua</SelectItem>
                                            <SelectItem value="pharmacy">Farmasi</SelectItem>
                                            <SelectItem value="general">Umum</SelectItem>
                                            <SelectItem value="medical">Alat Kesehatan</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select value={filters.is_active || 'all'} onValueChange={handleStatusChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua</SelectItem>
                                            <SelectItem value="1">Aktif</SelectItem>
                                            <SelectItem value="0">Tidak Aktif</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
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
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Tipe</TableHead>
                                    <TableHead>Parent</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Batch</TableHead>
                                    <TableHead>Expiry</TableHead>
                                    <TableHead className="w-[100px] text-center">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {categories.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                                            Tidak ada kategori ditemukan
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    categories.data.map((category: ItemCategory, index: number) => (
                                        <TableRow key={category.id}>
                                            <TableCell>{(categories.current_page - 1) * categories.per_page + index + 1}</TableCell>
                                            <TableCell className="font-medium">{category.code}</TableCell>
                                            <TableCell>{category.name}</TableCell>
                                            <TableCell>
                                                <Badge className={categoryTypeColors[category.category_type]}>
                                                    {categoryTypeLabels[category.category_type]}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{category.parent?.name || '-'}</TableCell>
                                            <TableCell>
                                                <Badge variant={category.is_active ? 'default' : 'secondary'}>
                                                    {category.is_active ? 'Aktif' : 'Nonaktif'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {category.requires_batch_tracking ? (
                                                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                                        Ya
                                                    </Badge>
                                                ) : (
                                                    '-'
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {category.requires_expiry_tracking ? (
                                                    <Badge variant="outline" className="bg-orange-50 text-orange-700">
                                                        Ya
                                                    </Badge>
                                                ) : (
                                                    '-'
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-center gap-1">
                                                    {hasPermission('inventory.categories.view') && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => router.visit(route('item_categories.show', category.id))}
                                                            className="h-8 w-8 p-0"
                                                            title="Lihat Detail"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {hasPermission('inventory.categories.edit') && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => router.visit(route('item_categories.edit', category.id))}
                                                            className="h-8 w-8 p-0"
                                                            title="Edit"
                                                        >
                                                            <Edit3 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {hasPermission('inventory.categories.delete') && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                setDeleteDialog({
                                                                    open: true,
                                                                    category,
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
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {categories.last_page > 1 && (
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                                Menampilkan {categories.from} sampai {categories.to} dari {categories.total} kategori
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(categories.current_page - 1)}
                                    disabled={categories.current_page === 1}
                                >
                                    Sebelumnya
                                </Button>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, categories.last_page) }, (_, i) => {
                                        const page = Math.max(1, categories.current_page - 2) + i;
                                        if (page > categories.last_page) return null;
                                        return (
                                            <Button
                                                key={page}
                                                variant={page === categories.current_page ? 'default' : 'outline'}
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
                                    onClick={() => handlePageChange(categories.current_page + 1)}
                                    disabled={categories.current_page === categories.last_page}
                                >
                                    Selanjutnya
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Delete Dialog */}
            <Dialog
                open={deleteDialog.open}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteDialog({ open: false, category: null, loading: false });
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Kategori</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus kategori "{deleteDialog.category?.name}"? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialog({ open: false, category: null, loading: false })}
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
