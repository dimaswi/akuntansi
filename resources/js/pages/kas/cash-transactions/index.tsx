import { FilterField } from '@/components/filter-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePermission } from '@/hooks/use-permission';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { CheckCircle, Edit3, Eye, Filter, Loader2, PlusCircle, Search, Send, Trash, Wallet, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

interface DaftarAkun {
    id: number;
    kode_akun: string;
    nama_akun: string;
    jenis_akun: string;
}

interface User {
    id: number;
    name: string;
}

interface CashTransaction {
    id: number;
    nomor_transaksi: string;
    tanggal_transaksi: string;
    jenis_transaksi: string;
    jumlah: number;
    keterangan: string;
    pihak_terkait?: string;
    referensi?: string;
    status: 'draft' | 'posted';
    daftar_akun_kas?: DaftarAkun;
    daftar_akun_lawan?: DaftarAkun;
    user?: User;
    posted_at?: string;
    created_at: string;
    updated_at: string;
}

interface PaginatedCashTransaction {
    data: CashTransaction[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Props extends SharedData {
    cashTransactions: PaginatedCashTransaction;
    filters: {
        search: string;
        perPage: number;
        status: string;
        jenis_transaksi: string;
        tanggal_dari?: string;
        tanggal_sampai?: string;
    };
    jenisTransaksi: Record<string, string>;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: <Wallet className="h-4 w-4" />,
        href: '/kas',
    },
    {
        title: 'Transaksi Kas',
        href: '/kas/cash-transactions',
    },
];

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'posted':
            return <Badge className="bg-green-100 text-green-800">Posted</Badge>;
        case 'draft':
            return <Badge variant="outline">Draft</Badge>;
        default:
            return <Badge variant="secondary">{status}</Badge>;
    }
};

const getJenisTransaksiBadge = (jenis: string) => {
    const colors: Record<string, string> = {
        penerimaan: 'bg-green-100 text-green-800',
        pengeluaran: 'bg-red-100 text-red-800',
        uang_muka_penerimaan: 'bg-blue-100 text-blue-800',
        uang_muka_pengeluaran: 'bg-orange-100 text-orange-800',
        transfer_masuk: 'bg-purple-100 text-purple-800',
        transfer_keluar: 'bg-indigo-100 text-indigo-800',
    };

    return <Badge className={colors[jenis] || 'bg-gray-100 text-gray-800'}>{jenis.replace(/_/g, ' ').toUpperCase()}</Badge>;
};

export default function CashTransactionIndex() {
    const { cashTransactions, filters, jenisTransaksi } = usePage<Props>().props;
    const { hasPermission } = usePermission();
    const [search, setSearch] = useState(filters.search);
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        transaction: CashTransaction | null;
        loading: boolean;
    }>({
        open: false,
        transaction: null,
        loading: false,
    });

    // Filter fields configuration
    const filterFields: FilterField[] = [
        {
            name: 'jenis_transaksi',
            label: 'Jenis Transaksi',
            type: 'select',
            placeholder: 'Semua Jenis',
            options: [
                { value: '', label: 'Semua Jenis' },
                ...Object.entries(jenisTransaksi).map(([value, label]) => ({
                    value,
                    label: label as string,
                })),
            ],
            value: filters.jenis_transaksi || '',
        },
        {
            name: 'status',
            label: 'Status',
            type: 'select',
            placeholder: 'Semua Status',
            options: [
                { value: '', label: 'Semua Status' },
                { value: 'draft', label: 'Draft' },
                { value: 'posted', label: 'Posted' },
            ],
            value: filters.status || '',
        },
        {
            name: 'tanggal_dari',
            label: 'Tanggal Dari',
            type: 'date',
            value: filters.tanggal_dari || '',
        },
        {
            name: 'tanggal_sampai',
            label: 'Tanggal Sampai',
            type: 'date',
            value: filters.tanggal_sampai || '',
        },
    ];

    // Check if any filters are active and keep filter expanded
    useEffect(() => {
        const hasActiveFilters = 
            filters.jenis_transaksi || 
            filters.status || 
            filters.tanggal_dari || 
            filters.tanggal_sampai ||
            (filters.search && filters.search.trim() !== '');
            
        if (hasActiveFilters) {
            setIsFilterExpanded(true);
        }
    }, [filters]);

    const handleSearch = (searchValue: string) => {
        router.get(
            '/kas/cash-transactions',
            {
                search: searchValue,
                perPage: filters.perPage,
                status: filters.status,
                jenis_transaksi: filters.jenis_transaksi,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleStatusChange = (status: string) => {
        router.get(
            '/kas/cash-transactions',
            {
                search: filters.search,
                perPage: filters.perPage,
                status: status === 'all' ? '' : status,
                jenis_transaksi: filters.jenis_transaksi,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleJenisTransaksiChange = (jenis: string) => {
        router.get(
            '/kas/cash-transactions',
            {
                search: filters.search,
                perPage: filters.perPage,
                status: filters.status,
                jenis_transaksi: jenis === 'all' ? '' : jenis,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleDateFromChange = (tanggalDari: string) => {
        router.get(
            '/kas/cash-transactions',
            {
                search: filters.search,
                perPage: filters.perPage,
                status: filters.status,
                jenis_transaksi: filters.jenis_transaksi,
                tanggal_dari: tanggalDari,
                tanggal_sampai: filters.tanggal_sampai || '',
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleDateToChange = (tanggalSampai: string) => {
        router.get(
            '/kas/cash-transactions',
            {
                search: filters.search,
                perPage: filters.perPage,
                status: filters.status,
                jenis_transaksi: filters.jenis_transaksi,
                tanggal_dari: filters.tanggal_dari || '',
                tanggal_sampai: tanggalSampai,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handlePerPageChange = (perPage: number) => {
        router.get(
            '/kas/cash-transactions',
            {
                search: filters.search,
                perPage,
                status: filters.status,
                jenis_transaksi: filters.jenis_transaksi,
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
            '/kas/cash-transactions',
            {
                search: filters.search,
                perPage: filters.perPage,
                status: filters.status,
                jenis_transaksi: filters.jenis_transaksi,
                page,
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

    const handleDeleteClick = (transaction: CashTransaction) => {
        setDeleteDialog({
            open: true,
            transaction: transaction,
            loading: false,
        });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteDialog.transaction) return;

        setDeleteDialog((prev) => ({ ...prev, loading: true }));

        try {
            await router.delete(route('kas.cash-transactions.destroy', deleteDialog.transaction.id), {
                onSuccess: () => {
                    toast.success(`Transaksi ${deleteDialog.transaction?.nomor_transaksi} berhasil dihapus`);
                    setDeleteDialog({ open: false, transaction: null, loading: false });
                },
                onError: () => {
                    toast.error('Gagal menghapus transaksi');
                    setDeleteDialog((prev) => ({ ...prev, loading: false }));
                },
            });
        } catch (error) {
            toast.error('Terjadi kesalahan saat menghapus transaksi');
            setDeleteDialog((prev) => ({ ...prev, loading: false }));
        }
    };

    const [selectedTransactions, setSelectedTransactions] = useState<number[]>([]);

    const handlePost = (transaction: CashTransaction) => {
        // Redirect to batch posting page with single transaction
        router.visit(`/kas/cash-transactions/post-to-journal?ids[]=${transaction.id}`);
    };

    const handleBatchPost = () => {
        if (selectedTransactions.length === 0) {
            toast.error('Pilih minimal satu transaksi untuk diposting');
            return;
        }

        const queryParams = selectedTransactions.map((id) => `ids[]=${id}`).join('&');
        router.visit(`/kas/cash-transactions/post-to-journal?${queryParams}`);
    };

    const handleSelectTransaction = (transactionId: number, checked: boolean) => {
        if (checked) {
            setSelectedTransactions((prev) => [...prev, transactionId]);
        } else {
            setSelectedTransactions((prev) => prev.filter((id) => id !== transactionId));
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const draftTransactionIds = cashTransactions.data
                .filter((transaction) => transaction.status === 'draft')
                .map((transaction) => transaction.id);
            setSelectedTransactions(draftTransactionIds);
        } else {
            setSelectedTransactions([]);
        }
    };

    const handleFilter = (filterValues: Record<string, any>) => {
        router.get(
            '/kas/cash-transactions',
            {
                search: search,
                perPage: filters.perPage,
                status: filterValues.status || '',
                jenis_transaksi: filterValues.jenis_transaksi || '',
                tanggal_dari: filterValues.tanggal_dari || '',
                tanggal_sampai: filterValues.tanggal_sampai || '',
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleResetFilter = () => {
        router.get(
            '/kas/cash-transactions',
            {
                search: '',
                perPage: filters.perPage,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
        setSearch('');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Transaksi Kas" />
            <div className="space-y-4 p-4">
                {/* Header */}


                <Card className="mt-4">
                    <CardHeader>
                        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Wallet className="h-5 w-5" />
                                    Transaksi Kas
                                </CardTitle>
                                <CardDescription>Kelola transaksi penerimaan dan pengeluaran kas</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setIsFilterExpanded(!isFilterExpanded)} className="gap-2">
                                    <Filter className="h-4 w-4" />
                                    {isFilterExpanded ? 'Tutup Filter' : 'Filter'}
                                </Button>
                                {selectedTransactions.length > 0 && hasPermission('akuntansi.journal-posting.post') && (
                                    <Button onClick={handleBatchPost} variant="secondary" className="gap-2">
                                        <CheckCircle className="h-4 w-4" />
                                        Posting ke Jurnal ({selectedTransactions.length})
                                    </Button>
                                )}

                                <Button onClick={() => router.visit('/kas/cash-transactions/create')} className="gap-2">
                                    <PlusCircle className="h-4 w-4" />
                                    Tambah Transaksi
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
                                    placeholder="Cari nomor transaksi, keterangan..."
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
                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                                    <div className="grid gap-2">
                                        <Label className="text-sm font-medium">Status</Label>
                                        <Select value={filters.status || 'all'} onValueChange={handleStatusChange}>
                                            <SelectTrigger className="w-48">
                                                <SelectValue placeholder="Pilih Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Semua Status</SelectItem>
                                                <SelectItem value="draft">Draft</SelectItem>
                                                <SelectItem value="posted">Posted</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-sm font-medium">Jenis Transaksi</Label>
                                        <Select value={filters.jenis_transaksi || 'all'} onValueChange={handleJenisTransaksiChange}>
                                            <SelectTrigger className="w-48">
                                                <SelectValue placeholder="Pilih Jenis" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Semua Jenis</SelectItem>
                                                {Object.entries(jenisTransaksi).map(([key, value]) => (
                                                    <SelectItem key={key} value={key}>
                                                        {value}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-sm font-medium">Tanggal Dari</Label>
                                        <Input
                                            type="date"
                                            value={filters.tanggal_dari || ''}
                                            onChange={(e) => handleDateFromChange(e.target.value)}
                                            className="w-48"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-sm font-medium">Tanggal Sampai</Label>
                                        <Input
                                            type="date"
                                            value={filters.tanggal_sampai || ''}
                                            onChange={(e) => handleDateToChange(e.target.value)}
                                            className="w-48"
                                        />
                                    </div>
                                    <Button variant="outline" onClick={handleResetFilter} className="flex items-center gap-2">
                                        <X className="h-4 w-4" />
                                        Reset Filter
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Table */}
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">
                                            <Checkbox
                                                checked={
                                                    selectedTransactions.length > 0 &&
                                                    selectedTransactions.length === cashTransactions.data.filter((t) => t.status === 'draft').length
                                                }
                                                onCheckedChange={handleSelectAll}
                                                aria-label="Select all"
                                            />
                                        </TableHead>
                                        <TableHead>Nomor Transaksi</TableHead>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead>Jenis</TableHead>
                                        <TableHead>Jumlah</TableHead>
                                        <TableHead>Keterangan</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {cashTransactions.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                                                Tidak ada data transaksi kas
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        cashTransactions.data.map((transaction) => (
                                            <TableRow key={transaction.id}>
                                                <TableCell>
                                                    {transaction.status === 'draft' && (
                                                        <Checkbox
                                                            checked={selectedTransactions.includes(transaction.id)}
                                                            onCheckedChange={(checked) => handleSelectTransaction(transaction.id, checked as boolean)}
                                                            aria-label={`Select transaction ${transaction.nomor_transaksi}`}
                                                        />
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-medium">{transaction.nomor_transaksi}</TableCell>
                                                <TableCell>{formatDate(transaction.tanggal_transaksi)}</TableCell>
                                                <TableCell>{getJenisTransaksiBadge(transaction.jenis_transaksi)}</TableCell>
                                                <TableCell className="font-mono">{formatCurrency(transaction.jumlah)}</TableCell>
                                                <TableCell className="max-w-xs truncate">{transaction.keterangan}</TableCell>
                                                <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {hasPermission('kas.cash-management.view') && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => router.visit(`/kas/cash-transactions/${transaction.id}`)}
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {transaction.status === 'draft' && (
                                                            <>
                                                                {hasPermission('kas.cash-management.daily-entry') && (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => router.visit(`/kas/cash-transactions/${transaction.id}/edit`)}
                                                                    >
                                                                        <Edit3 className="h-4 w-4" />
                                                                    </Button>
                                                                )}
                                                                {hasPermission('akuntansi.journal-posting.post') && (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => handlePost(transaction)}
                                                                        className="text-green-600 hover:text-green-700"
                                                                    >
                                                                        <CheckCircle className="h-4 w-4" />
                                                                    </Button>
                                                                )}
                                                                {hasPermission('kas.cash-transaction.delete') && (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => handleDeleteClick(transaction)}
                                                                        className="text-destructive hover:text-destructive"
                                                                    >
                                                                        <Trash className="h-4 w-4" />
                                                                    </Button>
                                                                )}
                                                            </>
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
                                    <Select
                                        value={(filters?.perPage || 15).toString()}
                                        onValueChange={(value) => handlePerPageChange(parseInt(value))}
                                    >
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
                                    Menampilkan {cashTransactions.from} sampai {cashTransactions.to} dari {cashTransactions.total} transaksi
                                </div>
                            </div>
                            {cashTransactions.last_page > 1 && (
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(cashTransactions.current_page - 1)}
                                        disabled={cashTransactions.current_page === 1}
                                    >
                                        Sebelumnya
                                    </Button>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(5, cashTransactions.last_page) }, (_, i) => {
                                            const page = Math.max(1, cashTransactions.current_page - 2) + i;
                                            if (page > cashTransactions.last_page) return null;
                                            return (
                                                <Button
                                                    key={page}
                                                    variant={page === cashTransactions.current_page ? 'default' : 'outline'}
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
                                        onClick={() => handlePageChange(cashTransactions.current_page + 1)}
                                        disabled={cashTransactions.current_page === cashTransactions.last_page}
                                    >
                                        Selanjutnya
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Delete Dialog */}
                <Dialog open={deleteDialog.open} onOpenChange={(open) => !deleteDialog.loading && setDeleteDialog((prev) => ({ ...prev, open }))}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Hapus Transaksi</DialogTitle>
                            <DialogDescription>
                                Apakah Anda yakin ingin menghapus transaksi <strong>{deleteDialog.transaction?.nomor_transaksi}</strong>? Tindakan ini
                                tidak dapat dibatalkan.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setDeleteDialog({ open: false, transaction: null, loading: false })}
                                disabled={deleteDialog.loading}
                            >
                                Batal
                            </Button>
                            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteDialog.loading} className="gap-2">
                                {deleteDialog.loading && <Loader2 className="h-4 w-4 animate-spin" />}
                                Hapus
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
