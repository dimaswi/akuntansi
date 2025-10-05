import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import FilterForm, { FilterField } from '@/components/filter-form';
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
import { Head, Link, router, usePage } from "@inertiajs/react";
import { Edit3, PlusCircle, Search, Trash, X, Loader2, Wallet, Eye, CheckCircle, Send } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { route } from "ziggy-js";
import { usePermission } from "@/hooks/use-permission";

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
        'penerimaan': 'bg-green-100 text-green-800',
        'pengeluaran': 'bg-red-100 text-red-800',
        'uang_muka_penerimaan': 'bg-blue-100 text-blue-800',
        'uang_muka_pengeluaran': 'bg-orange-100 text-orange-800',
        'transfer_masuk': 'bg-purple-100 text-purple-800',
        'transfer_keluar': 'bg-indigo-100 text-indigo-800',
    };

    return (
        <Badge className={colors[jenis] || 'bg-gray-100 text-gray-800'}>
            {jenis.replace(/_/g, ' ').toUpperCase()}
        </Badge>
    );
};

export default function CashTransactionIndex() {
    const { cashTransactions, filters, jenisTransaksi } = usePage<Props>().props;
    const { hasPermission } = usePermission();
    const [search, setSearch] = useState(filters.search);
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

    const handleSearch = (searchValue: string) => {
        router.get('/kas/cash-transactions', {
            search: searchValue,
            perPage: filters.perPage,
            status: filters.status,
            jenis_transaksi: filters.jenis_transaksi,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleStatusChange = (status: string) => {
        router.get('/kas/cash-transactions', {
            search: filters.search,
            perPage: filters.perPage,
            status: status === 'all' ? '' : status,
            jenis_transaksi: filters.jenis_transaksi,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleJenisTransaksiChange = (jenis: string) => {
        router.get('/kas/cash-transactions', {
            search: filters.search,
            perPage: filters.perPage,
            status: filters.status,
            jenis_transaksi: jenis === 'all' ? '' : jenis,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get('/kas/cash-transactions', {
            search: filters.search,
            perPage,
            status: filters.status,
            jenis_transaksi: filters.jenis_transaksi,
            page: 1,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handlePageChange = (page: number) => {
        router.get('/kas/cash-transactions', {
            search: filters.search,
            perPage: filters.perPage,
            status: filters.status,
            jenis_transaksi: filters.jenis_transaksi,
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

    const handleDeleteClick = (transaction: CashTransaction) => {
        setDeleteDialog({
            open: true,
            transaction: transaction,
            loading: false,
        });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteDialog.transaction) return;
        
        setDeleteDialog(prev => ({ ...prev, loading: true }));
        
        try {
            await router.delete(route('kas.cash-transactions.destroy', deleteDialog.transaction.id), {
                onSuccess: () => {
                    toast.success(`Transaksi ${deleteDialog.transaction?.nomor_transaksi} berhasil dihapus`);
                    setDeleteDialog({ open: false, transaction: null, loading: false });
                },
                onError: () => {
                    toast.error('Gagal menghapus transaksi');
                    setDeleteDialog(prev => ({ ...prev, loading: false }));
                }
            });
        } catch (error) {
            toast.error('Terjadi kesalahan saat menghapus transaksi');
            setDeleteDialog(prev => ({ ...prev, loading: false }));
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
        
        const queryParams = selectedTransactions.map(id => `ids[]=${id}`).join('&');
        router.visit(`/kas/cash-transactions/post-to-journal?${queryParams}`);
    };

    const handleSelectTransaction = (transactionId: number, checked: boolean) => {
        if (checked) {
            setSelectedTransactions(prev => [...prev, transactionId]);
        } else {
            setSelectedTransactions(prev => prev.filter(id => id !== transactionId));
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const draftTransactionIds = cashTransactions.data
                .filter(transaction => transaction.status === 'draft')
                .map(transaction => transaction.id);
            setSelectedTransactions(draftTransactionIds);
        } else {
            setSelectedTransactions([]);
        }
    };

    const handleFilter = (filterValues: Record<string, any>) => {
        router.get('/kas/cash-transactions', {
            search: search,
            perPage: filters.perPage,
            status: filterValues.status || '',
            jenis_transaksi: filterValues.jenis_transaksi || '',
            tanggal_dari: filterValues.tanggal_dari || '',
            tanggal_sampai: filterValues.tanggal_sampai || '',
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleResetFilter = () => {
        router.get('/kas/cash-transactions', {
            search: '',
            perPage: filters.perPage,
        }, {
            preserveState: true,
            replace: true,
        });
        setSearch('');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Transaksi Kas" />
            <div className="p-4 space-y-4">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Wallet className="h-6 w-6" />
                            Transaksi Kas
                        </h1>
                        <p className="text-muted-foreground">Kelola transaksi penerimaan dan pengeluaran kas</p>
                    </div>
                    <div className="flex space-x-2">
                        {hasPermission('kas.cash-management.daily-entry') && (
                            <Button asChild>
                                <Link href="/kas/cash-transactions/create">
                                    <PlusCircle className="h-4 w-4 mr-2" />
                                    Tambah Transaksi
                                </Link>
                            </Button>
                        )}
                        {selectedTransactions.length > 0 && (
                            <Button onClick={handleBatchPost} variant="outline">
                                <Send className="h-4 w-4 mr-2" />
                                Post Terpilih ({selectedTransactions.length})
                            </Button>
                        )}
                    </div>
                </div>

                {/* Filter Form */}
                <FilterForm
                    fields={filterFields}
                    onFilter={handleFilter}
                    onReset={handleResetFilter}
                    searchValue={search}
                    onSearchChange={setSearch}
                    onSearchSubmit={() => handleSearch(search)}
                />

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Wallet className="h-5 w-5" />
                                    Transaksi Kas
                                </CardTitle>
                                <CardDescription>
                                    Kelola transaksi penerimaan dan pengeluaran kas
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
                                {selectedTransactions.length > 0 && hasPermission('akuntansi.journal-posting.post') && (
                                    <Button
                                        onClick={handleBatchPost}
                                        variant="secondary"
                                        className="gap-2"
                                    >
                                        <CheckCircle className="h-4 w-4" />
                                        Posting ke Jurnal ({selectedTransactions.length})
                                    </Button>
                                )}
                                {hasPermission('kas.cash-management.daily-entry') && (
                                    <Button
                                        onClick={() => router.visit('/kas/cash-transactions/create')}
                                        className="gap-2"
                                    >
                                        <PlusCircle className="h-4 w-4" />
                                        Tambah Transaksi
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Filters */}
                        <div className="flex flex-col gap-4 md:flex-row md:items-end">
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
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={handleClearSearch}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </form>
                            </div>
                            <div className="flex gap-2">
                                <div>
                                    <Label>Status</Label>
                                    <Select
                                        value={filters.status || 'all'}
                                        onValueChange={handleStatusChange}
                                    >
                                        <SelectTrigger className="w-32">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua</SelectItem>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="posted">Posted</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Jenis</Label>
                                    <Select
                                        value={filters.jenis_transaksi || 'all'}
                                        onValueChange={handleJenisTransaksiChange}
                                    >
                                        <SelectTrigger className="w-40">
                                            <SelectValue placeholder="Jenis" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua</SelectItem>
                                            {Object.entries(jenisTransaksi).map(([key, value]) => (
                                                <SelectItem key={key} value={key}>
                                                    {value}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Per halaman</Label>
                                    <Select
                                        value={(filters?.perPage || 15).toString()}
                                        onValueChange={(value) => handlePerPageChange(parseInt(value))}
                                    >
                                        <SelectTrigger className="w-20">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="10">10</SelectItem>
                                            <SelectItem value="25">25</SelectItem>
                                            <SelectItem value="50">50</SelectItem>
                                            <SelectItem value="100">100</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">
                                            <Checkbox
                                                checked={selectedTransactions.length > 0 && selectedTransactions.length === cashTransactions.data.filter(t => t.status === 'draft').length}
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
                                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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
                                                            onCheckedChange={(checked) => 
                                                                handleSelectTransaction(transaction.id, checked as boolean)
                                                            }
                                                            aria-label={`Select transaction ${transaction.nomor_transaksi}`}
                                                        />
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {transaction.nomor_transaksi}
                                                </TableCell>
                                                <TableCell>
                                                    {formatDate(transaction.tanggal_transaksi)}
                                                </TableCell>
                                                <TableCell>
                                                    {getJenisTransaksiBadge(transaction.jenis_transaksi)}
                                                </TableCell>
                                                <TableCell className="font-mono">
                                                    {formatCurrency(transaction.jumlah)}
                                                </TableCell>
                                                <TableCell className="max-w-xs truncate">
                                                    {transaction.keterangan}
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(transaction.status)}
                                                </TableCell>
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
                        {cashTransactions.last_page > 1 && (
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">
                                    Menampilkan {cashTransactions.from} sampai {cashTransactions.to} dari {cashTransactions.total} entri
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(cashTransactions.current_page - 1)}
                                        disabled={cashTransactions.current_page === 1}
                                    >
                                        Sebelumnya
                                    </Button>
                                    <span className="text-sm">
                                        Halaman {cashTransactions.current_page} dari {cashTransactions.last_page}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(cashTransactions.current_page + 1)}
                                        disabled={cashTransactions.current_page === cashTransactions.last_page}
                                    >
                                        Selanjutnya
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Delete Dialog */}
                <Dialog open={deleteDialog.open} onOpenChange={(open) => !deleteDialog.loading && setDeleteDialog(prev => ({ ...prev, open }))}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Hapus Transaksi</DialogTitle>
                            <DialogDescription>
                                Apakah Anda yakin ingin menghapus transaksi <strong>{deleteDialog.transaction?.nomor_transaksi}</strong>?
                                Tindakan ini tidak dapat dibatalkan.
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
                            <Button
                                variant="destructive"
                                onClick={handleDeleteConfirm}
                                disabled={deleteDialog.loading}
                                className="gap-2"
                            >
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
