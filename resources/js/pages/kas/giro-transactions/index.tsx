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
import { CheckCircle, Edit3, Eye, Filter, Loader2, PlusCircle, Search, Trash, Receipt, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

interface BankAccount {
    id: number;
    kode_rekening: string;
    nama_bank: string;
    nama_rekening: string;
}

interface DaftarAkun {
    id: number;
    kode_akun: string;
    nama_akun: string;
}

interface User {
    id: number;
    name: string;
}

interface GiroTransaction {
    id: number;
    nomor_giro: string;
    tanggal_giro: string;
    tanggal_jatuh_tempo: string;
    jenis_giro: string;
    jumlah: number;
    penerbit?: string;
    penerima?: string;
    keterangan: string;
    status_giro: string;
    is_posted: boolean;
    bank_account: BankAccount;
    daftar_akun?: DaftarAkun;
    user?: User;
    created_at: string;
    updated_at: string;
}

interface PaginatedGiroTransaction {
    data: GiroTransaction[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Props extends SharedData {
    giroTransactions: PaginatedGiroTransaction;
    filters: {
        search: string;
        perPage: number;
        status_giro: string;
        jenis_giro: string;
        bank_account_id?: string;
        tanggal_dari?: string;
        tanggal_sampai?: string;
    };
    bankAccounts: BankAccount[];
    jenisGiro: Record<string, string>;
    statusGiro: Record<string, string>;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: <Receipt className="h-4 w-4" />,
        href: '/kas',
    },
    {
        title: 'Transaksi Giro',
        href: '/kas/giro-transactions',
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
        case 'cleared':
            return <Badge className="bg-blue-100 text-blue-800">Cleared</Badge>;
        case 'bounced':
            return <Badge className="bg-red-100 text-red-800">Bounced</Badge>;
        case 'pending':
            return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
        case 'cair':
            return <Badge className="bg-green-100 text-green-800">Cair</Badge>;
        case 'tolak':
            return <Badge className="bg-red-100 text-red-800">Tolak</Badge>;
        default:
            return <Badge variant="secondary">{status}</Badge>;
    }
};

const getJenisGiroBadge = (jenis: string) => {
    const colors: Record<string, string> = {
        masuk: 'bg-green-100 text-green-800',
        keluar: 'bg-red-100 text-red-800',
    };

    return <Badge className={colors[jenis] || 'bg-gray-100 text-gray-800'}>{jenis.replace(/_/g, ' ').toUpperCase()}</Badge>;
};

export default function GiroTransactionIndex() {
    const { giroTransactions, filters, bankAccounts, jenisGiro, statusGiro } = usePage<Props>().props;
    const { hasPermission } = usePermission();
    const [search, setSearch] = useState(filters.search);
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        transaction: GiroTransaction | null;
        loading: boolean;
    }>({
        open: false,
        transaction: null,
        loading: false,
    });

    // Filter fields configuration
    const filterFields: FilterField[] = [
        {
            name: 'jenis_giro',
            label: 'Jenis Giro',
            type: 'select',
            placeholder: 'Semua Jenis',
            options: [
                { value: '', label: 'Semua Jenis' },
                ...Object.entries(jenisGiro || {}).map(([value, label]) => ({
                    value,
                    label: label as string,
                })),
            ],
            value: filters.jenis_giro || '',
        },
        {
            name: 'status_giro',
            label: 'Status Giro',
            type: 'select',
            placeholder: 'Semua Status',
            options: [
                { value: '', label: 'Semua Status' },
                ...Object.entries(statusGiro || {}).map(([value, label]) => ({
                    value,
                    label: label as string,
                })),
            ],
            value: filters.status_giro || '',
        },
        {
            name: 'bank_account_id',
            label: 'Bank Account',
            type: 'select',
            placeholder: 'Semua Bank',
            options: [
                { value: '', label: 'Semua Bank Account' },
                ...(bankAccounts || []).map((account) => ({
                    value: account.id.toString(),
                    label: `${account.kode_rekening} - ${account.nama_bank}`,
                })),
            ],
            value: filters.bank_account_id || '',
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
            filters.jenis_giro || 
            filters.status_giro || 
            filters.bank_account_id ||
            filters.tanggal_dari || 
            filters.tanggal_sampai ||
            (filters.search && filters.search.trim() !== '');
            
        if (hasActiveFilters) {
            setIsFilterExpanded(true);
        }
    }, [filters]);

    const handleSearch = (searchValue: string) => {
        router.get(
            '/kas/giro-transactions',
            {
                search: searchValue,
                perPage: filters.perPage,
                status_giro: filters.status_giro,
                jenis_giro: filters.jenis_giro,
                bank_account_id: filters.bank_account_id,
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

    const handleDeleteClick = (transaction: GiroTransaction) => {
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
            await router.delete(route('kas.giro-transactions.destroy', deleteDialog.transaction.id), {
                onSuccess: () => {
                    toast.success(`Transaksi ${deleteDialog.transaction?.nomor_giro} berhasil dihapus`);
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

    const handlePost = (transaction: GiroTransaction) => {
        // Redirect to batch posting page with single transaction
        router.visit(`/kas/giro-transactions/post-to-journal?ids[]=${transaction.id}`);
    };

    const [selectedTransactions, setSelectedTransactions] = useState<number[]>([]);

    const handleBatchPost = () => {
        if (selectedTransactions.length === 0) {
            toast.error('Pilih minimal satu transaksi untuk diposting');
            return;
        }

        const queryParams = selectedTransactions.map((id) => `ids[]=${id}`).join('&');
        router.visit(`/kas/giro-transactions/post-to-journal?${queryParams}`);
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
            const draftTransactionIds = (giroTransactions?.data || [])
                .filter((transaction) => transaction.status_giro === 'draft')
                .map((transaction) => transaction.id);
            setSelectedTransactions(draftTransactionIds);
        } else {
            setSelectedTransactions([]);
        }
    };

    const handleFilter = (filterValues: Record<string, any>) => {
        router.get(
            '/kas/giro-transactions',
            {
                search: search,
                perPage: filters.perPage,
                status_giro: filterValues.status_giro || '',
                jenis_giro: filterValues.jenis_giro || '',
                bank_account_id: filterValues.bank_account_id || '',
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
            '/kas/giro-transactions',
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

    const handlePerPageChange = (perPage: number) => {
        router.get(
            '/kas/giro-transactions',
            {
                search: filters.search,
                perPage,
                status_giro: filters.status_giro,
                jenis_giro: filters.jenis_giro,
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
            '/kas/giro-transactions',
            {
                search: filters.search,
                perPage: filters.perPage,
                status_giro: filters.status_giro,
                jenis_giro: filters.jenis_giro,
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
            <Head title="Transaksi Giro" />
            <div className="space-y-4 p-4">
                <Card className="mt-4">
                    <CardHeader>
                        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Receipt className="h-5 w-5" />
                                    Transaksi Giro
                                </CardTitle>
                                <CardDescription>Kelola transaksi giro masuk dan keluar</CardDescription>
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
                                <Button onClick={() => router.visit('/kas/giro-transactions/create')} className="gap-2">
                                    <PlusCircle className="h-4 w-4" />
                                    Tambah Giro
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
                                    placeholder="Cari nomor giro, keterangan..."
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
                                        <Label className="text-sm font-medium">Status Giro</Label>
                                        <Select value={filters.status_giro || 'all'} onValueChange={(value) => handleFilter({...filters, status_giro: value === 'all' ? '' : value})}>
                                            <SelectTrigger className="w-48">
                                                <SelectValue placeholder="Pilih Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Semua Status</SelectItem>
                                                {Object.entries(statusGiro || {}).map(([key, value]) => (
                                                    <SelectItem key={key} value={key}>
                                                        {value}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-sm font-medium">Jenis Giro</Label>
                                        <Select value={filters.jenis_giro || 'all'} onValueChange={(value) => handleFilter({...filters, jenis_giro: value === 'all' ? '' : value})}>
                                            <SelectTrigger className="w-48">
                                                <SelectValue placeholder="Pilih Jenis" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Semua Jenis</SelectItem>
                                                {Object.entries(jenisGiro || {}).map(([key, value]) => (
                                                    <SelectItem key={key} value={key}>
                                                        {value}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-sm font-medium">Bank Account</Label>
                                        <Select value={filters.bank_account_id || 'all'} onValueChange={(value) => handleFilter({...filters, bank_account_id: value === 'all' ? '' : value})}>
                                            <SelectTrigger className="w-48">
                                                <SelectValue placeholder="Pilih Bank" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Semua Bank Account</SelectItem>
                                                {(bankAccounts || []).map((account) => (
                                                    <SelectItem key={account.id} value={account.id.toString()}>
                                                        {account.kode_rekening} - {account.nama_bank}
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
                                            onChange={(e) => handleFilter({...filters, tanggal_dari: e.target.value})}
                                            className="w-48"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-sm font-medium">Tanggal Sampai</Label>
                                        <Input
                                            type="date"
                                            value={filters.tanggal_sampai || ''}
                                            onChange={(e) => handleFilter({...filters, tanggal_sampai: e.target.value})}
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
                                                    selectedTransactions.length === (giroTransactions?.data || []).filter((t) => t.status_giro === 'draft').length
                                                }
                                                onCheckedChange={handleSelectAll}
                                                aria-label="Select all"
                                            />
                                        </TableHead>
                                        <TableHead>Nomor Giro</TableHead>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead>Jatuh Tempo</TableHead>
                                        <TableHead>Bank Account</TableHead>
                                        <TableHead>Jenis</TableHead>
                                        <TableHead>Jumlah</TableHead>
                                        <TableHead>Penerbit/Penerima</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {!giroTransactions?.data?.length ? (
                                        <TableRow>
                                            <TableCell colSpan={10} className="py-8 text-center text-muted-foreground">
                                                Tidak ada data transaksi giro
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        giroTransactions.data.map((transaction) => (
                                            <TableRow key={transaction.id}>
                                                <TableCell>
                                                    {transaction.status_giro === 'draft' && (
                                                        <Checkbox
                                                            checked={selectedTransactions.includes(transaction.id)}
                                                            onCheckedChange={(checked) => handleSelectTransaction(transaction.id, checked as boolean)}
                                                            aria-label={`Select transaction ${transaction.nomor_giro}`}
                                                        />
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-medium">{transaction.nomor_giro}</TableCell>
                                                <TableCell>{formatDate(transaction.tanggal_giro)}</TableCell>
                                                <TableCell>{formatDate(transaction.tanggal_jatuh_tempo)}</TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{transaction.bank_account.nama_bank}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {transaction.bank_account.kode_rekening}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{getJenisGiroBadge(transaction.jenis_giro)}</TableCell>
                                                <TableCell className="font-mono">{formatCurrency(transaction.jumlah)}</TableCell>
                                                <TableCell>
                                                    {transaction.jenis_giro === "masuk" 
                                                        ? transaction.penerbit || "-"
                                                        : transaction.penerima || "-"}
                                                </TableCell>
                                                <TableCell>{getStatusBadge(transaction.status_giro)}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {hasPermission('kas.cash-management.view') && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => router.visit(`/kas/giro-transactions/${transaction.id}`)}
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {transaction.status_giro === 'draft' && (
                                                            <>
                                                                {hasPermission('kas.cash-management.daily-entry') && (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => router.visit(`/kas/giro-transactions/${transaction.id}/edit`)}
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
                                                                {hasPermission('kas.giro-transaction.delete') && (
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
                                    Menampilkan {giroTransactions?.from || 0} sampai {giroTransactions?.to || 0} dari {giroTransactions?.total || 0} transaksi
                                </div>
                            </div>
                            {(giroTransactions?.last_page || 0) > 1 && (
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange((giroTransactions?.current_page || 1) - 1)}
                                        disabled={(giroTransactions?.current_page || 1) === 1}
                                    >
                                        Sebelumnya
                                    </Button>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(5, giroTransactions?.last_page || 1) }, (_, i) => {
                                            const page = Math.max(1, (giroTransactions?.current_page || 1) - 2) + i;
                                            if (page > (giroTransactions?.last_page || 1)) return null;
                                            return (
                                                <Button
                                                    key={page}
                                                    variant={page === (giroTransactions?.current_page || 1) ? 'default' : 'outline'}
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
                                        onClick={() => handlePageChange((giroTransactions?.current_page || 1) + 1)}
                                        disabled={(giroTransactions?.current_page || 1) === (giroTransactions?.last_page || 1)}
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
                                Apakah Anda yakin ingin menghapus transaksi <strong>{deleteDialog.transaction?.nomor_giro}</strong>? Tindakan ini
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