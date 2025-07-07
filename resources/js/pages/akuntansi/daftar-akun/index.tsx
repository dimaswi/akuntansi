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
import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem, SharedData } from "@/types";
import { Head, router, usePage } from "@inertiajs/react";
import { Edit3, PlusCircle, Search, Trash, X, Loader2, Calculator } from "lucide-react";
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
    const { daftarAkun, filters: initialFilters } = usePage<Props>().props;
    const [search, setSearch] = useState(initialFilters.search);
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        akun: DaftarAkun | null;
        loading: boolean;
    }>({
        open: false,
        akun: null,
        loading: false,
    });
    
    const handleSearch = (value: string) => {
        router.get('/akuntansi/daftar-akun', {
            search: value,
            perPage: initialFilters.perPage,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get('/akuntansi/daftar-akun', {
            search: initialFilters.search,
            perPage,
            page: 1,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handlePageChange = (page: number) => {
        router.get('/akuntansi/daftar-akun', {
            search: initialFilters.search,
            perPage: initialFilters.perPage,
            page,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSearch(search);
    };

    const handleClearSearch = () => {
        setSearch('');
        handleSearch('');
    };

    useEffect(() => {
        setSearch(initialFilters.search);
    }, [initialFilters.search]);

    const handleDeleteConfirm = async () => {
        if (!deleteDialog.akun) return;

        setDeleteDialog(prev => ({ ...prev, loading: true }));

        try {
            router.delete(`/akuntansi/daftar-akun/${deleteDialog.akun.id}`, {
                onSuccess: () => {
                    toast.success('Akun berhasil dihapus');
                    setDeleteDialog({ open: false, akun: null, loading: false });
                },
                onError: () => {
                    toast.error('Gagal menghapus akun');
                    setDeleteDialog(prev => ({ ...prev, loading: false }));
                },
            });
        } catch (error) {
            toast.error('Terjadi kesalahan');
            setDeleteDialog(prev => ({ ...prev, loading: false }));
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialog({ open: false, akun: null, loading: false });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Daftar Akun" />
            <div className="p-4">
                <div className="mb-4 flex items-center justify-between">
                    <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Cari kode atau nama akun..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 pr-10 w-64"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={handleClearSearch}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        <Button type="submit" variant="outline" size="sm">
                            Cari
                        </Button>
                    </form>
                    
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-2 hover:bg-green-200"
                        onClick={() => router.visit('/akuntansi/daftar-akun/create')}
                    >
                        <PlusCircle className="h-4 w-4 text-green-500" />
                        Tambah
                    </Button>
                </div>
                
                <div className="w-full overflow-x-auto rounded-md border">
                    <Table>
                        <TableHeader className="bg-gray-100">
                            <TableRow>
                                <TableHead className="w-[50px]">No.</TableHead>
                                <TableHead>Kode Akun</TableHead>
                                <TableHead>Nama Akun</TableHead>
                                <TableHead>Jenis Akun</TableHead>
                                <TableHead>Saldo Normal</TableHead>
                                <TableHead>Level</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-[100px]">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {daftarAkun.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                        Tidak ada data ditemukan
                                    </TableCell>
                                </TableRow>
                            ) : (
                                daftarAkun.data.map((akun, index) => (
                                    <TableRow key={akun.id}>
                                        <TableCell className="font-medium">
                                            {(daftarAkun.current_page - 1) * daftarAkun.per_page + index + 1}
                                        </TableCell>
                                        <TableCell className="font-mono font-medium">
                                            {akun.kode_akun}
                                        </TableCell>
                                        <TableCell>
                                            <div className={`${akun.level > 1 ? 'ml-' + (akun.level - 1) * 4 : ''}`}>
                                                {akun.nama_akun}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={jenisAkunColors[akun.jenis_akun]}>
                                                {jenisAkunLabels[akun.jenis_akun]}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={akun.saldo_normal === 'debit' ? 'default' : 'secondary'}>
                                                {akun.saldo_normal.toUpperCase()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{akun.level}</TableCell>
                                        <TableCell>
                                            <Badge variant={akun.is_aktif ? 'default' : 'secondary'}>
                                                {akun.is_aktif ? 'Aktif' : 'Tidak Aktif'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => router.visit(`/akuntansi/daftar-akun/${akun.id}/edit`)}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <Edit3 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setDeleteDialog({ open: true, akun, loading: false })}
                                                    className="h-8 w-8 p-0 hover:bg-red-50 hover:border-red-200"
                                                >
                                                    <Trash className="h-4 w-4 text-red-500" />
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
                {daftarAkun.last_page > 1 && (
                    <div className="mt-4 flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Menampilkan {daftarAkun.from} sampai {daftarAkun.to} dari {daftarAkun.total} entri
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(daftarAkun.current_page - 1)}
                                disabled={daftarAkun.current_page === 1}
                            >
                                Sebelumnya
                            </Button>
                            <span className="text-sm">
                                Halaman {daftarAkun.current_page} dari {daftarAkun.last_page}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(daftarAkun.current_page + 1)}
                                disabled={daftarAkun.current_page === daftarAkun.last_page}
                            >
                                Selanjutnya
                            </Button>
                        </div>
                    </div>
                )}

                {/* Per Page Selector */}
                <div className="mt-4 flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Tampilkan per halaman:</span>
                    <select
                        value={initialFilters.perPage}
                        onChange={(e) => handlePerPageChange(Number(e.target.value))}
                        className="border rounded px-2 py-1 text-sm"
                    >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialog.open} onOpenChange={() => !deleteDialog.loading && handleDeleteCancel()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Penghapusan</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus akun <strong>{deleteDialog.akun?.nama_akun}</strong>?
                            Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={handleDeleteCancel}
                            disabled={deleteDialog.loading}
                        >
                            Batal
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={handleDeleteConfirm}
                            disabled={deleteDialog.loading}
                        >
                            {deleteDialog.loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
