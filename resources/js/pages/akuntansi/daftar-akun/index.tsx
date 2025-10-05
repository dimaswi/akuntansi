import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem, SharedData } from "@/types";
import { Head, router, usePage } from "@inertiajs/react";
import { Edit3, PlusCircle, Search, Trash, X, Loader2, Calculator, Filter } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { route } from "ziggy-js";

interface DaftarAkun {
    id: number;
    kode_akun: string;
    nama_akun: string;
    jenis_akun: 'aset' | 'kewajiban' | 'modal' | 'pendapatan' | 'beban';
    sub_jenis: string;
    saldo_normal: 'debit' | 'kredit';
    level: number;
    is_aktif: boolean;
    keterangan?: string;
    induk_akun?: DaftarAkun;
    created_at: string;
    updated_at: string;
}

interface PaginatedDaftarAkun {
    data: DaftarAkun[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Props extends SharedData {
    daftarAkun: PaginatedDaftarAkun;
    filters: {
        search: string;
        perPage: number;
        jenis_akun?: string;
        status?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: <Calculator className="h-4 w-4" />,
        href: '/akuntansi',
    },
    {
        title: 'Daftar Akun',
        href: '/akuntansi/daftar-akun',
    },
];

const jenisAkunLabels = {
    aset: 'Aset',
    kewajiban: 'Kewajiban', 
    modal: 'Modal',
    pendapatan: 'Pendapatan',
    beban: 'Beban'
};

const jenisAkunColors = {
    aset: 'bg-blue-100 text-blue-800',
    kewajiban: 'bg-red-100 text-red-800',
    modal: 'bg-green-100 text-green-800', 
    pendapatan: 'bg-yellow-100 text-yellow-800',
    beban: 'bg-purple-100 text-purple-800'
};


export default function DaftarAkunIndex() {
    const { daftarAkun, filters } = usePage<Props>().props;
    const [search, setSearch] = useState(filters.search);
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        akun: DaftarAkun | null;
        loading: boolean;
    }>({
        open: false,
        akun: null,
        loading: false,
    });

    const handleSearch = (searchValue: string) => {
        router.get(
            '/akuntansi/daftar-akun',
            {
                search: searchValue,
                perPage: filters.perPage,
                jenis_akun: filters.jenis_akun || '',
                status: filters.status || '',
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

    const handleJenisAkunChange = (jenis: string) => {
        router.get(
            '/akuntansi/daftar-akun',
            {
                search: filters.search || '',
                perPage: filters.perPage,
                jenis_akun: jenis === 'all' ? '' : jenis,
                status: filters.status || '',
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
            '/akuntansi/daftar-akun',
            {
                search: filters.search || '',
                perPage: filters.perPage,
                jenis_akun: filters.jenis_akun || '',
                status: status === 'all' ? '' : status,
                page: 1,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    // Check if any filter is active
    const hasActiveFilters = (filters.jenis_akun && filters.jenis_akun !== '') || 
                            (filters.status && filters.status !== '') ||
                            (filters.search && filters.search !== '');

    // Keep filter expanded if there are active filters
    useEffect(() => {
        if (hasActiveFilters) {
            setIsFilterExpanded(true);
        }
    }, [hasActiveFilters]);

    const handleResetFilters = () => {
        setSearch('');
        router.get('/akuntansi/daftar-akun', {
            search: '',
            perPage: filters.perPage,
            jenis_akun: '',
            status: '',
            page: 1,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get(
            '/akuntansi/daftar-akun',
            {
                search: filters.search || '',
                perPage,
                jenis_akun: filters.jenis_akun || '',
                status: filters.status || '',
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
            '/akuntansi/daftar-akun',
            {
                search: filters.search || '',
                perPage: filters.perPage,
                jenis_akun: filters.jenis_akun || '',
                status: filters.status || '',
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
        if (!deleteDialog.akun) return;

        setDeleteDialog((prev) => ({ ...prev, loading: true }));

        try {
            router.delete(`/akuntansi/daftar-akun/${deleteDialog.akun.id}`, {
                onSuccess: () => {
                    toast.success('Akun berhasil dihapus');
                    setDeleteDialog({ open: false, akun: null, loading: false });
                },
                onError: () => {
                    toast.error('Gagal menghapus akun');
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
            <Head title="Daftar Akun" />

            <Card className="mt-4">
                <CardHeader>
                    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Calculator className="h-5 w-5" />
                                Daftar Akun
                            </CardTitle>
                            <CardDescription>Kelola chart of accounts dan akun-akun keuangan</CardDescription>
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
                            <Button onClick={() => router.visit('/akuntansi/daftar-akun/create')} className="gap-2">
                                <PlusCircle className="h-4 w-4" />
                                Tambah Akun
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
                                placeholder="Cari kode atau nama akun..."
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
                                    <Label className="text-sm font-medium">Jenis Akun</Label>
                                    <Select value={filters.jenis_akun || 'all'} onValueChange={handleJenisAkunChange}>
                                        <SelectTrigger className="w-48">
                                            <SelectValue placeholder="Pilih Jenis Akun" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Jenis</SelectItem>
                                            <SelectItem value="aset">Aset</SelectItem>
                                            <SelectItem value="kewajiban">Kewajiban</SelectItem>
                                            <SelectItem value="modal">Modal</SelectItem>
                                            <SelectItem value="pendapatan">Pendapatan</SelectItem>
                                            <SelectItem value="beban">Beban</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-sm font-medium">Status</Label>
                                    <Select value={filters.status || 'all'} onValueChange={handleStatusChange}>
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
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Jenis</TableHead>
                                    <TableHead>Parent</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Saldo Normal</TableHead>
                                    <TableHead>Level</TableHead>
                                    <TableHead className="w-[100px] text-center">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {daftarAkun.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                                            Tidak ada akun ditemukan
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    daftarAkun.data.map((akun: DaftarAkun, index: number) => (
                                        <TableRow key={akun.id}>
                                            <TableCell>{(daftarAkun.current_page - 1) * daftarAkun.per_page + index + 1}</TableCell>
                                            <TableCell className="font-medium">{akun.kode_akun}</TableCell>
                                            <TableCell>
                                                <div 
                                                    className="flex items-center"
                                                    style={{ 
                                                        marginLeft: akun.level > 1 ? `${(akun.level - 1) * 16}px` : '0px' 
                                                    }}
                                                >
                                                    {akun.level > 1 && (
                                                        <span className="text-gray-400 mr-2">
                                                            {'└'.repeat(1)} 
                                                        </span>
                                                    )}
                                                    {akun.nama_akun}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={jenisAkunColors[akun.jenis_akun]}>
                                                    {jenisAkunLabels[akun.jenis_akun]}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{akun.induk_akun?.nama_akun || '-'}</TableCell>
                                            <TableCell>
                                                <Badge variant={akun.is_aktif ? 'default' : 'secondary'}>
                                                    {akun.is_aktif ? 'Aktif' : 'Nonaktif'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={akun.saldo_normal === 'debit' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}>
                                                    {akun.saldo_normal === 'debit' ? 'Debit' : 'Kredit'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    Level {akun.level}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => router.visit(`/akuntansi/daftar-akun/${akun.id}/edit`)}
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
                                                                akun,
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
                                Menampilkan {daftarAkun.from} sampai {daftarAkun.to} dari {daftarAkun.total} akun
                            </div>
                        </div>
                        {daftarAkun.last_page > 1 && (
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(daftarAkun.current_page - 1)}
                                    disabled={daftarAkun.current_page === 1}
                                >
                                    Sebelumnya
                                </Button>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, daftarAkun.last_page) }, (_, i) => {
                                        const page = Math.max(1, daftarAkun.current_page - 2) + i;
                                        if (page > daftarAkun.last_page) return null;
                                        return (
                                            <Button
                                                key={page}
                                                variant={page === daftarAkun.current_page ? 'default' : 'outline'}
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
                                    onClick={() => handlePageChange(daftarAkun.current_page + 1)}
                                    disabled={daftarAkun.current_page === daftarAkun.last_page}
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
                        setDeleteDialog({ open: false, akun: null, loading: false });
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Akun</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus akun "{deleteDialog.akun?.nama_akun}"? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialog({ open: false, akun: null, loading: false })}
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
