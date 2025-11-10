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
import { Edit3, PlusCircle, Search, Trash, X, Loader2, Building2, Filter, Package } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { route } from "ziggy-js";

interface Department {
    id: number;
    name: string;
    code: string;
    level: number;
    parent_id?: number;
    is_active: boolean;
    parent?: {
        id: number;
        name: string;
    };
    created_at?: string;
    updated_at?: string;
}

interface PaginatedDepartments {
    data: Department[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Props extends SharedData {
    departments: PaginatedDepartments;
    filters: {
        search: string;
        is_active?: string;
        perPage: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: <Package className="h-4 w-4" />, href: '#' },
    {
        title: "Departments",
        href: '#',
    },
];

export default function DepartmentIndex() {
    const { departments, filters } = usePage<Props>().props;
    const [search, setSearch] = useState(filters.search);
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        department: Department | null;
        loading: boolean;
    }>({
        open: false,
        department: null,
        loading: false,
    });

    const handleSearch = (searchValue: string) => {
        router.get(
            '/departments',
            {
                search: searchValue,
                perPage: filters.perPage,
                is_active: filters.is_active || '',
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

    const handleStatusChange = (status: string) => {
        router.get(
            '/departments',
            {
                search: filters.search || '',
                perPage: filters.perPage,
                is_active: status === 'all' ? '' : status,
                page: 1,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    // Check if any filter is active
    const hasActiveFilters = (filters.is_active && filters.is_active !== '') ||
                            (filters.search && filters.search !== '');

    // Keep filter expanded if there are active filters
    useEffect(() => {
        if (hasActiveFilters) {
            setIsFilterExpanded(true);
        }
    }, [hasActiveFilters]);

    const handleResetFilters = () => {
        setSearch('');
        router.get('/departments', {
            search: '',
            perPage: filters.perPage,
            is_active: '',
            page: 1,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get(
            '/departments',
            {
                search: filters.search || '',
                perPage,
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
            '/departments',
            {
                search: filters.search || '',
                perPage: filters.perPage,
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
        if (!deleteDialog.department) return;

        setDeleteDialog((prev) => ({ ...prev, loading: true }));

        try {
            router.delete(route('departments.destroy', deleteDialog.department.id), {
                onSuccess: () => {
                    toast.success('Departemen berhasil dihapus');
                    setDeleteDialog({ open: false, department: null, loading: false });
                },
                onError: () => {
                    toast.error('Gagal menghapus departemen');
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
            <Head title="Data Departemen" />

            <Card className="mt-4">
                <CardHeader>
                    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                Data Departemen
                            </CardTitle>
                            <CardDescription>Kelola data departemen organisasi</CardDescription>
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
                            <Button onClick={() => router.visit(route('departments.create'))} className="gap-2">
                                <PlusCircle className="h-4 w-4" />
                                Tambah Departemen
                            </Button>
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
                                placeholder="Cari kode atau nama departemen..."
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
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
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
                                    <TableHead>Nama Departemen</TableHead>
                                    <TableHead>Level</TableHead>
                                    <TableHead>Parent</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-[100px] text-center">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {departments.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                                            Tidak ada data departemen
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    departments.data.map((department, index) => (
                                        <TableRow key={department.id}>
                                            <TableCell>{(departments.current_page - 1) * departments.per_page + index + 1}</TableCell>
                                            <TableCell className="font-medium font-mono">{department.code}</TableCell>
                                            <TableCell>{department.name}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">Level {department.level}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                {department.parent ? department.parent.name : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={department.is_active ? 'default' : 'secondary'}>
                                                    {department.is_active ? 'Aktif' : 'Nonaktif'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => router.visit(route('departments.edit', department.id))}
                                                        className="h-8 w-8 p-0"
                                                        title="Edit"
                                                    >
                                                        <Edit3 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            setDeleteDialog({
                                                                open: true,
                                                                department,
                                                                loading: false,
                                                            })
                                                        }
                                                        className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                                                        title="Hapus"
                                                    >
                                                        <Trash className="h-4 w-4" />
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
                                Menampilkan {departments.from} sampai {departments.to} dari {departments.total} departemen
                            </div>
                        </div>
                        {departments.last_page > 1 && (
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(departments.current_page - 1)}
                                    disabled={departments.current_page === 1}
                                >
                                    Sebelumnya
                                </Button>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, departments.last_page) }, (_, i) => {
                                        const page = Math.max(1, departments.current_page - 2) + i;
                                        if (page > departments.last_page) return null;
                                        return (
                                            <Button
                                                key={page}
                                                variant={page === departments.current_page ? 'default' : 'outline'}
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
                                    onClick={() => handlePageChange(departments.current_page + 1)}
                                    disabled={departments.current_page === departments.last_page}
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
                        setDeleteDialog({ open: false, department: null, loading: false });
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Departemen</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus departemen "{deleteDialog.department?.name}"? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialog({ open: false, department: null, loading: false })}
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
