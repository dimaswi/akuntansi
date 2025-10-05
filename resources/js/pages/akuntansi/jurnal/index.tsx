import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem, SharedData } from "@/types";
import { Head, router, usePage } from "@inertiajs/react";
import { Edit3, PlusCircle, Search, Trash, X, Loader2, Eye, Calculator, Filter } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { route } from "ziggy-js";

interface User {
    id: number;
    name: string;
}

interface Jurnal {
    id: number;
    nomor_jurnal: string;
    tanggal_transaksi: string;
    keterangan: string;
    total_debit: number;
    total_kredit: number;
    status: string;
    created_at: string;
    updated_at: string;
    dibuat_oleh?: User;
}

interface PaginatedJurnal {
    data: Jurnal[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Props extends SharedData {
    jurnal: PaginatedJurnal;
    filters: {
        search: string;
        perPage: number;
        status: string;
        tanggal_dari?: string;
        tanggal_sampai?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: <Calculator className="h-4 w-4" />,
        href: '/akuntansi',
    },
    {
        title: 'Jurnal',
        href: '/akuntansi/jurnal',
    },
];

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
};

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

const getStatusBadge = (status: string) => {
    const statusConfig = {
        draft: { label: 'Draft', variant: 'secondary' as const },
        posted: { label: 'Posted', variant: 'default' as const },
        reversed: { label: 'Reversed', variant: 'destructive' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
};

export default function JurnalIndex() {
    const { jurnal, filters: initialFilters } = usePage<Props>().props;
    const [search, setSearch] = useState(initialFilters.search);
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        jurnal: Jurnal | null;
        loading: boolean;
    }>({
        open: false,
        jurnal: null,
        loading: false,
    });
    
    const handleSearch = (searchValue: string) => {
        router.get(
            '/akuntansi/jurnal',
            {
                search: searchValue,
                perPage: initialFilters.perPage,
                status: initialFilters.status || '',
                tanggal_dari: initialFilters.tanggal_dari || '',
                tanggal_sampai: initialFilters.tanggal_sampai || '',
                page: 1,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    // Check if any filter is active
    const hasActiveFilters = (initialFilters.status && initialFilters.status !== '') || 
                            (initialFilters.tanggal_dari && initialFilters.tanggal_dari !== '') ||
                            (initialFilters.tanggal_sampai && initialFilters.tanggal_sampai !== '') ||
                            (initialFilters.search && initialFilters.search !== '');

    const activeFilterCount = [
        initialFilters.status && initialFilters.status !== '',
        initialFilters.tanggal_dari && initialFilters.tanggal_dari !== '',
        initialFilters.tanggal_sampai && initialFilters.tanggal_sampai !== ''
    ].filter(Boolean).length;

    // Keep filter expanded if there are active filters
    useEffect(() => {
        if (hasActiveFilters) {
            setIsFilterExpanded(true);
        }
    }, [hasActiveFilters]);

    const handlePerPageChange = (perPage: number) => {
        router.get(
            '/akuntansi/jurnal',
            {
                search: initialFilters.search || '',
                perPage,
                status: initialFilters.status || '',
                tanggal_dari: initialFilters.tanggal_dari || '',
                tanggal_sampai: initialFilters.tanggal_sampai || '',
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
            '/akuntansi/jurnal',
            {
                search: initialFilters.search || '',
                perPage: initialFilters.perPage,
                status: initialFilters.status || '',
                tanggal_dari: initialFilters.tanggal_dari || '',
                tanggal_sampai: initialFilters.tanggal_sampai || '',
                page,
            },
            {
                preserveState: true,
                preserveScroll: true,
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

    const handleDeleteClick = (jurnal: Jurnal) => {
        setDeleteDialog({
            open: true,
            jurnal: jurnal,
            loading: false,
        });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteDialog.jurnal) return;

        setDeleteDialog((prev) => ({ ...prev, loading: true }));

        try {
            router.delete(`/akuntansi/jurnal/${deleteDialog.jurnal.id}`, {
                onSuccess: () => {
                    toast.success('Jurnal berhasil dihapus');
                    setDeleteDialog({ open: false, jurnal: null, loading: false });
                },
                onError: () => {
                    toast.error('Gagal menghapus jurnal');
                    setDeleteDialog((prev) => ({ ...prev, loading: false }));
                },
            });
        } catch (error) {
            toast.error('Terjadi kesalahan');
            setDeleteDialog((prev) => ({ ...prev, loading: false }));
        }
    };

    const handleStatusChange = (status: string) => {
        router.get(
            '/akuntansi/jurnal',
            {
                search: initialFilters.search || '',
                perPage: initialFilters.perPage,
                status: status === 'all' ? '' : status,
                tanggal_dari: initialFilters.tanggal_dari || '',
                tanggal_sampai: initialFilters.tanggal_sampai || '',
                page: 1,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleDateFromChange = (tanggalDari: string) => {
        router.get(
            '/akuntansi/jurnal',
            {
                search: initialFilters.search || '',
                perPage: initialFilters.perPage,
                status: initialFilters.status || '',
                tanggal_dari: tanggalDari,
                tanggal_sampai: initialFilters.tanggal_sampai || '',
                page: 1,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleDateToChange = (tanggalSampai: string) => {
        router.get(
            '/akuntansi/jurnal',
            {
                search: initialFilters.search || '',
                perPage: initialFilters.perPage,
                status: initialFilters.status || '',
                tanggal_dari: initialFilters.tanggal_dari || '',
                tanggal_sampai: tanggalSampai,
                page: 1,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleResetFilters = () => {
        setSearch('');
        router.get('/akuntansi/jurnal', {
            search: '',
            perPage: initialFilters.perPage,
            status: '',
            tanggal_dari: '',
            tanggal_sampai: '',
            page: 1,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Jurnal" />

            <Card className="mt-4">
                <CardHeader>
                    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Calculator className="h-5 w-5" />
                                Jurnal
                            </CardTitle>
                            <CardDescription>Kelola jurnal akuntansi dan transaksi keuangan</CardDescription>
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
                            <Button onClick={() => router.visit(route('akuntansi.jurnal.create'))} className="gap-2">
                                <PlusCircle className="h-4 w-4" />
                                Tambah Jurnal
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
                                placeholder="Cari nomor jurnal atau keterangan..."
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
                                    <Select value={initialFilters.status || 'all'} onValueChange={handleStatusChange}>
                                        <SelectTrigger className="w-48">
                                            <SelectValue placeholder="Pilih Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Status</SelectItem>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="posted">Posted</SelectItem>
                                            <SelectItem value="reversed">Reversed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-sm font-medium">Tanggal Dari</Label>
                                    <Input
                                        type="date"
                                        value={initialFilters.tanggal_dari || ''}
                                        onChange={(e) => handleDateFromChange(e.target.value)}
                                        className="w-48"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-sm font-medium">Tanggal Sampai</Label>
                                    <Input
                                        type="date"
                                        value={initialFilters.tanggal_sampai || ''}
                                        onChange={(e) => handleDateToChange(e.target.value)}
                                        className="w-48"
                                    />
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
                                    <TableHead>Nomor Jurnal</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Keterangan</TableHead>
                                    <TableHead className="text-right">Total Debit</TableHead>
                                    <TableHead className="text-right">Total Kredit</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Dibuat Oleh</TableHead>
                                    <TableHead className="w-[100px] text-center">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {jurnal.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                                            Tidak ada data jurnal
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    jurnal.data.map((item, index) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{(jurnal.current_page - 1) * jurnal.per_page + index + 1}</TableCell>
                                            <TableCell className="font-medium">
                                                {item.nomor_jurnal}
                                            </TableCell>
                                            <TableCell>
                                                {formatDate(item.tanggal_transaksi)}
                                            </TableCell>
                                            <TableCell className="max-w-[300px] truncate">
                                                {item.keterangan}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {formatCurrency(item.total_debit)}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {formatCurrency(item.total_kredit)}
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(item.status)}
                                            </TableCell>
                                            <TableCell>
                                                {item.dibuat_oleh?.name || '-'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => router.visit(route('akuntansi.jurnal.show', item.id))}
                                                        className="h-8 w-8 p-0"
                                                        title="Detail"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    {item.status === 'draft' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => router.visit(route('akuntansi.jurnal.edit', item.id))}
                                                            className="h-8 w-8 p-0"
                                                            title="Edit"
                                                        >
                                                            <Edit3 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {item.status === 'draft' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDeleteClick(item)}
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
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Label className="text-sm">Per halaman</Label>
                                <Select value={(initialFilters?.perPage || 10).toString()} onValueChange={(value) => handlePerPageChange(parseInt(value))}>
                                    <SelectTrigger className="w-20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="20">20</SelectItem>
                                        <SelectItem value="30">30</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Menampilkan {jurnal.from} sampai {jurnal.to} dari {jurnal.total} jurnal
                            </div>
                        </div>
                        {jurnal.last_page > 1 && (
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(jurnal.current_page - 1)}
                                    disabled={jurnal.current_page === 1}
                                >
                                    Sebelumnya
                                </Button>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, jurnal.last_page) }, (_, i) => {
                                        const page = Math.max(1, jurnal.current_page - 2) + i;
                                        if (page > jurnal.last_page) return null;
                                        return (
                                            <Button
                                                key={page}
                                                variant={page === jurnal.current_page ? 'default' : 'outline'}
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
                                    onClick={() => handlePageChange(jurnal.current_page + 1)}
                                    disabled={jurnal.current_page === jurnal.last_page}
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
                        setDeleteDialog({ open: false, jurnal: null, loading: false });
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Jurnal</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus jurnal "{deleteDialog.jurnal?.nomor_jurnal}"? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialog({ open: false, jurnal: null, loading: false })}
                            disabled={deleteDialog.loading}
                        >
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteDialog.loading}>
                            {deleteDialog.loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
