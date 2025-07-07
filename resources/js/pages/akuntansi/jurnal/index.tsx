import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem, SharedData } from "@/types";
import { Head, router, usePage } from "@inertiajs/react";
import { Edit3, PlusCircle, Search, Trash, X, Loader2, BookOpen, Eye, Calculator } from "lucide-react";
import { useState } from "react";
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
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        jurnal: Jurnal | null;
        loading: boolean;
    }>({
        open: false,
        jurnal: null,
        loading: false,
    });
    
    const handleSearch = (value: string) => {
        router.get('/akuntansi/jurnal', {
            search: value,
            perPage: initialFilters.perPage,
            status: initialFilters.status,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleStatusFilter = (status: string) => {
        const filterValue = status === "all" ? "" : status;
        router.get('/akuntansi/jurnal', {
            search: initialFilters.search,
            perPage: initialFilters.perPage,
            status: filterValue,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get('/akuntansi/jurnal', {
            search: initialFilters.search,
            perPage,
            status: initialFilters.status,
            page: 1,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handlePageChange = (page: number) => {
        router.get('/akuntansi/jurnal', {
            search: initialFilters.search,
            perPage: initialFilters.perPage,
            status: initialFilters.status,
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

    const handleDeleteClick = (jurnal: Jurnal) => {
        setDeleteDialog({
            open: true,
            jurnal: jurnal,
            loading: false,
        });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteDialog.jurnal) return;
        
        setDeleteDialog(prev => ({ ...prev, loading: true }));
        
        try {
            await router.delete(route('akuntansi.jurnal.destroy', deleteDialog.jurnal.id), {
                onSuccess: () => {
                    toast.success(`Jurnal ${deleteDialog.jurnal?.nomor_jurnal} berhasil dihapus`);
                    setDeleteDialog({ open: false, jurnal: null, loading: false });
                },
                onError: () => {
                    toast.error('Gagal menghapus jurnal');
                    setDeleteDialog(prev => ({ ...prev, loading: false }));
                }
            });
        } catch (error) {
            toast.error('Terjadi kesalahan saat menghapus jurnal');
            setDeleteDialog(prev => ({ ...prev, loading: false }));
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialog({ open: false, jurnal: null, loading: false });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Jurnal" />
            <div className="max-w-7xl mx-auto p-4 sm:px-6 lg:px-8">
                {/* Filters and Actions */}
                <div className="mb-6 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        {/* Search and Filter */}
                        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder="Cari nomor jurnal atau keterangan..."
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
                            
                            <Select value={initialFilters.status || "all"} onValueChange={handleStatusFilter}>
                                <SelectTrigger className="w-32">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="posted">Posted</SelectItem>
                                    <SelectItem value="reversed">Reversed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        {/* Add Button */}
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex items-center gap-2 hover:bg-green-200"
                            onClick={() => router.visit(route('akuntansi.jurnal.create'))}
                        >
                            <PlusCircle className="h-4 w-4 text-green-500" />
                            Tambah Jurnal
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg border shadow-sm">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-gray-50">
                                <TableRow>
                                    <TableHead className="w-[50px]">No.</TableHead>
                                    <TableHead>Nomor Jurnal</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Keterangan</TableHead>
                                    <TableHead>Total Debit</TableHead>
                                    <TableHead>Total Kredit</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Dibuat Oleh</TableHead>
                                    <TableHead className="text-center">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {jurnal.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                            Tidak ada data jurnal
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    jurnal.data.map((item, index) => (
                                        <TableRow key={item.id} className="hover:bg-gray-50">
                                            <TableCell>
                                                {(jurnal.current_page - 1) * jurnal.per_page + index + 1}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {item.nomor_jurnal}
                                            </TableCell>
                                            <TableCell>
                                                {formatDate(item.tanggal_transaksi)}
                                            </TableCell>
                                            <TableCell className="max-w-xs truncate">
                                                {item.keterangan}
                                            </TableCell>
                                            <TableCell>
                                                {formatCurrency(item.total_debit)}
                                            </TableCell>
                                            <TableCell>
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
                                                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
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
                    {jurnal.last_page > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t">
                            <div className="text-sm text-muted-foreground">
                                Menampilkan {jurnal.from} sampai {jurnal.to} dari {jurnal.total} data
                            </div>
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
                                        const page = Math.max(1, Math.min(jurnal.last_page - 4, jurnal.current_page - 2)) + i;
                                        return (
                                            <Button
                                                key={page}
                                                variant={page === jurnal.current_page ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => handlePageChange(page)}
                                                className="w-8 h-8 p-0"
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
                        </div>
                    )}
                </div>

                {/* Delete Confirmation Dialog */}
                <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && handleDeleteCancel()}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Konfirmasi Hapus</DialogTitle>
                            <DialogDescription>
                                Apakah Anda yakin ingin menghapus jurnal <strong>{deleteDialog.jurnal?.nomor_jurnal}</strong>? 
                                Tindakan ini tidak dapat dibatalkan.
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
