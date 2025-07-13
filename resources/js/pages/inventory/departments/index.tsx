import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Building2, Edit3, Filter, Loader2, PlusCircle, Search, Trash, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

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

interface Props {
    departments: PaginatedDepartments;
    filters: {
        search: string;
        perPage: number;
        is_active: string;
    };
    flash?: { success?: string };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Inventory', href: '#' },
    { title: 'Departemen', href: '/departments' },
];

export default function DepartmentIndex() {
    const { departments, filters }: Props = usePage().props as any;
    const [search, setSearch] = useState(filters?.search || '');
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        department: Department | null;
        loading: boolean;
    }>({ open: false, department: null, loading: false });

    const handleSearch = (value: string) => {
        router.get(
            '/departments',
            {
                search: value || '',
                perPage: filters?.perPage,
                is_active: (filters?.is_active === 'all' ? '' : filters?.is_active) || '',
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

    const handleStatusChange = (value: string) => {
        router.get(
            '/departments',
            {
                search: filters?.search || '',
                perPage: filters?.perPage,
                is_active: value === 'all' ? '' : value,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handlePerPageChange = (value: string) => {
        router.get(
            '/departments',
            {
                search: filters?.search || '',
                perPage: parseInt(value),
                is_active: (filters?.is_active === 'all' ? '' : filters?.is_active) || '',
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleDeleteClick = (department: Department) => {
        setDeleteDialog({ open: true, department, loading: false });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteDialog.department) return;
        setDeleteDialog((prev) => ({ ...prev, loading: true }));
        try {
            await router.delete(route('departments.destroy', deleteDialog.department.id), {
                onSuccess: () => {
                    toast.success(`Departemen ${deleteDialog.department?.name} berhasil dihapus`);
                    setDeleteDialog({ open: false, department: null, loading: false });
                },
                onError: () => {
                    toast.error('Gagal menghapus departemen');
                    setDeleteDialog((prev) => ({ ...prev, loading: false }));
                },
            });
        } catch (error) {
            toast.error('Terjadi kesalahan saat menghapus departemen');
            setDeleteDialog((prev) => ({ ...prev, loading: false }));
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialog({ open: false, department: null, loading: false });
    };

    const handlePageChange = (page: number) => {
        router.get(
            '/departments',
            {
                search: filters?.search || '',
                perPage: filters?.perPage,
                is_active: (filters?.is_active === 'all' ? '' : filters?.is_active) || '',
                page,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Daftar Departemen" />
            <div className="max-w-7xl p-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Building2 className="h-6 w-6 text-blue-600" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Departemen</h1>
                                <p className="text-sm text-gray-600">Kelola data departemen organisasi</p>
                            </div>
                        </div>
                        <Button onClick={() => router.visit(route('departments.create'))} className="flex items-center gap-2">
                            <PlusCircle className="h-4 w-4" />
                            Tambah Departemen
                        </Button>
                    </div>
                </div>

                {/* Filters Card */}
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            <CardTitle className="text-base">Filter & Pencarian</CardTitle>
                        </div>
                        <CardDescription>Gunakan filter di bawah untuk mempersempit hasil pencarian</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-4 lg:flex-row pb-4">
                            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 lg:flex-1">
                                <div className="relative flex-1">
                                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder="Cari kode/nama departemen..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pr-10 pl-10"
                                    />
                                    {search && (
                                        <button
                                            type="button"
                                            onClick={handleClearSearch}
                                            className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground transition-colors hover:text-foreground"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                                <Button type="submit" variant="outline">
                                    Cari
                                </Button>
                            </form>
                            <div className="flex flex-col gap-4 sm:flex-row lg:w-auto">
                                <div className="flex flex-col gap-2">
                                    <Select value={filters?.is_active || 'all'} onValueChange={handleStatusChange}>
                                        <SelectTrigger className="w-[140px]">
                                            <SelectValue placeholder="Semua Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Status</SelectItem>
                                            <SelectItem value="1">Aktif</SelectItem>
                                            <SelectItem value="0">Nonaktif</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Select value={filters?.perPage?.toString() || '15'} onValueChange={handlePerPageChange}>
                                        <SelectTrigger className="w-[100px]">
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
                            </div>
                        </div>

                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="w-[60px]">No</TableHead>
                                        <TableHead>Kode</TableHead>
                                        <TableHead>Nama</TableHead>
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
                                                <div className="flex flex-col items-center gap-2">
                                                    <Building2 className="h-8 w-8 text-muted-foreground/50" />
                                                    <span>Tidak ada data departemen</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        departments.data.map((department, index) => (
                                            <TableRow key={department.id} className="hover:bg-muted/50">
                                                <TableCell className="text-center font-medium">
                                                    {(departments.current_page - 1) * departments.per_page + index + 1}
                                                </TableCell>
                                                <TableCell className="font-mono text-sm">{department.code}</TableCell>
                                                <TableCell className="font-medium">{department.name}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">Level {department.level}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {department.parent ? (
                                                        <span className="text-sm text-muted-foreground">{department.parent.name}</span>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground italic">-</span>
                                                    )}
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
                                                            onClick={() => handleDeleteClick(department)}
                                                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
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

                        {departments.last_page > 1 && (
                            <div className="flex items-center justify-between border-t px-6 py-4">
                                <div className="text-sm text-muted-foreground">
                                    Menampilkan {departments.from} sampai {departments.to} dari {departments.total} data
                                </div>
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
                                            const page = Math.max(1, Math.min(departments.last_page - 4, departments.current_page - 2)) + i;
                                            return (
                                                <Button
                                                    key={page}
                                                    variant={page === departments.current_page ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => handlePageChange(page)}
                                                    className="h-8 w-8 p-0"
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
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Delete Confirmation Dialog */}
                <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && handleDeleteCancel()}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Konfirmasi Hapus</DialogTitle>
                            <DialogDescription>
                                Apakah Anda yakin ingin menghapus departemen <strong>{deleteDialog.department?.name}</strong>? Tindakan ini tidak
                                dapat dibatalkan.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={handleDeleteCancel} disabled={deleteDialog.loading}>
                                Batal
                            </Button>
                            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteDialog.loading}>
                                {deleteDialog.loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Hapus
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
