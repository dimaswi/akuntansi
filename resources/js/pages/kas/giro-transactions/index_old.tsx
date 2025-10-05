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
                ...Object.entries(jenisGiro).map(([value, label]) => ({
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
                ...Object.entries(statusGiro).map(([value, label]) => ({
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
                ...bankAccounts.map((account) => ({
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
            const draftTransactionIds = giroTransactions.data
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

    const handleCair = (id: number) => {
        router.post(route("kas.giro-transactions.cair", id), {}, {
            onSuccess: () => {
                toast.success("Giro berhasil dicairkan");
            },
            onError: (error) => {
                console.error("Cair error:", error);
                toast.error("Gagal mencairkan giro");
            },
        });
    };

    const handleTolak = (id: number) => {
        router.post(route("kas.giro-transactions.tolak", id), {}, {
            onSuccess: () => {
                toast.success("Giro berhasil ditolak");
            },
            onError: (error) => {
                console.error("Tolak error:", error);
                toast.error("Gagal menolak giro");
            },
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
        }).format(amount);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("id-ID", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const getStatusGiroBadge = (status: string) => {
        const statusConfig = {
            pending: { variant: "secondary" as const, label: "Pending" },
            cair: { variant: "default" as const, label: "Cair" },
            tolak: { variant: "destructive" as const, label: "Tolak" },
            jatuh_tempo: { variant: "outline" as const, label: "Jatuh Tempo" },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const getJenisGiroBadge = (jenis: string) => {
        const jenisConfig = {
            masuk: { variant: "default" as const, label: "Giro Masuk", color: "text-green-700 bg-green-50" },
            keluar: { variant: "secondary" as const, label: "Giro Keluar", color: "text-red-700 bg-red-50" },
        };

        const config = jenisConfig[jenis as keyof typeof jenisConfig] || jenisConfig.masuk;
        return (
            <Badge variant={config.variant} className={config.color}>
                {config.label}
            </Badge>
        );
    };

    const isJatuhTempo = (tanggalJatuhTempo: string) => {
        const today = new Date();
        const jatuhTempo = new Date(tanggalJatuhTempo);
        return jatuhTempo <= today;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Transaksi Giro" />

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
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                                className="flex items-center gap-2"
                            >
                                <Filter className="h-4 w-4" />
                                Filter
                            </Button>
                            <Button onClick={() => router.visit(route("kas.giro-transactions.create"))}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Tambah Giro
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Search */}
                    <div className="flex-1">
                        <Label htmlFor="search">Cari</Label>
                        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex gap-2">
                            <Input
                                id="search"
                                placeholder="Cari nomor giro, keterangan..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="flex-1"
                            />
                            <Button type="submit" size="icon">
                                <Search className="h-4 w-4" />
                            </Button>
                            <Button type="button" variant="outline" size="icon" onClick={() => { setSearch(''); handleReset(); }}>
                                <X className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>

                    {/* Filters */}
                    {isFilterExpanded && (
                        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                                <div className="grid gap-2">
                                    <Label className="text-sm font-medium">Bank Account</Label>
                                    <Select value={bankAccountId} onValueChange={setBankAccountId}>
                                        <SelectTrigger className="w-48">
                                            <SelectValue placeholder="Semua Bank Account" />
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
                                    <Label className="text-sm font-medium">Jenis Giro</Label>
                                    <Select value={jenisGiro} onValueChange={setJenisGiro}>
                                        <SelectTrigger className="w-48">
                                            <SelectValue placeholder="Semua Jenis" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Jenis</SelectItem>
                                            <SelectItem value="masuk">Giro Masuk</SelectItem>
                                            <SelectItem value="keluar">Giro Keluar</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-sm font-medium">Status Giro</Label>
                                    <Select value={statusGiro} onValueChange={setStatusGiro}>
                                        <SelectTrigger className="w-48">
                                            <SelectValue placeholder="Semua Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Status</SelectItem>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="cair">Cair</SelectItem>
                                            <SelectItem value="tolak">Tolak</SelectItem>
                                            <SelectItem value="jatuh_tempo">Jatuh Tempo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-sm font-medium">Tanggal Dari</Label>
                                    <Input
                                        type="date"
                                        value={tanggalDari}
                                        onChange={(e) => setTanggalDari(e.target.value)}
                                        className="w-48"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-sm font-medium">Tanggal Sampai</Label>
                                    <Input
                                        type="date"
                                        value={tanggalSampai}
                                        onChange={(e) => setTanggalSampai(e.target.value)}
                                        className="w-48"
                                    />
                                </div>
                                <Button variant="outline" onClick={handleReset} className="flex items-center gap-2">
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
                                        <TableHead className="w-[120px]">
                                            <Button variant="ghost" size="sm">
                                                No. Giro
                                                <ArrowUpDown className="ml-2 h-4 w-4" />
                                            </Button>
                                        </TableHead>
                                        <TableHead>
                                            <Button variant="ghost" size="sm">
                                                Tanggal
                                                <Calendar className="ml-2 h-4 w-4" />
                                            </Button>
                                        </TableHead>
                                        <TableHead>
                                            <Button variant="ghost" size="sm">
                                                Jatuh Tempo
                                                <Clock className="ml-2 h-4 w-4" />
                                            </Button>
                                        </TableHead>
                                        <TableHead>Bank Account</TableHead>
                                        <TableHead>Jenis</TableHead>
                                        <TableHead className="text-right">Jumlah</TableHead>
                                        <TableHead>Penerbit/Penerima</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Posted</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {!giroTransactions?.data?.length ? (
                                        <TableRow>
                                            <TableCell colSpan={10} className="text-center text-muted-foreground">
                                                Tidak ada transaksi giro ditemukan
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        (giroTransactions.data || []).map((transaction) => (
                                            <TableRow key={transaction.id}>
                                                <TableCell className="font-medium">
                                                    {transaction.nomor_giro}
                                                </TableCell>
                                                <TableCell>
                                                    {formatDate(transaction.tanggal_giro)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        <span>{formatDate(transaction.tanggal_jatuh_tempo)}</span>
                                                        {isJatuhTempo(transaction.tanggal_jatuh_tempo) && transaction.status_giro === 'pending' && (
                                                            <Badge variant="destructive" className="text-xs">
                                                                Overdue
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{transaction.bank_account.nama_bank}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {transaction.bank_account.kode_rekening}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getJenisGiroBadge(transaction.jenis_giro)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono">
                                                    <span
                                                        className={
                                                            transaction.jenis_giro === "masuk"
                                                                ? "text-green-600"
                                                                : "text-red-600"
                                                        }
                                                    >
                                                        {formatCurrency(transaction.jumlah)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    {transaction.jenis_giro === "masuk" 
                                                        ? transaction.penerbit || "-"
                                                        : transaction.penerima || "-"}
                                                </TableCell>
                                                <TableCell>{getStatusGiroBadge(transaction.status_giro)}</TableCell>
                                                <TableCell>
                                                    {transaction.is_posted ? (
                                                        <Badge variant="default">
                                                            <CheckCircle className="mr-1 h-3 w-3" />
                                                            Posted
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary">Draft</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                router.visit(
                                                                    route("kas.giro-transactions.show", transaction.id)
                                                                )
                                                            }
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        {!transaction.is_posted && (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        router.visit(
                                                                            route("kas.giro-transactions.edit", transaction.id)
                                                                        )
                                                                    }
                                                                >
                                                                    <Edit3 className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handlePost(transaction.id)}
                                                                >
                                                                    <CheckCircle className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setDeleteId(transaction.id);
                                                                        setShowDeleteDialog(true);
                                                                    }}
                                                                >
                                                                    <Trash className="h-4 w-4" />
                                                                </Button>
                                                            </>
                                                        )}
                                                        {transaction.status_giro === 'pending' && (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleCair(transaction.id)}
                                                                    title="Cairkan Giro"
                                                                >
                                                                    ✓
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleTolak(transaction.id)}
                                                                    title="Tolak Giro"
                                                                >
                                                                    ✗
                                                                </Button>
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
                        {(giroTransactions?.last_page || 0) > 1 && (
                            <div className="flex items-center justify-between mt-4">
                                <div className="text-sm text-muted-foreground">
                                    Menampilkan {((giroTransactions?.current_page || 1) - 1) * (giroTransactions?.per_page || 10) + 1} -{" "}
                                    {Math.min((giroTransactions?.current_page || 1) * (giroTransactions?.per_page || 10), giroTransactions?.total || 0)}{" "}
                                    dari {giroTransactions?.total || 0} transaksi
                                </div>
                                <div className="flex space-x-2">
                                    {(giroTransactions?.current_page || 1) > 1 && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                router.get(route("kas.giro-transactions.index"), {
                                                    ...(filters || {}),
                                                    page: (giroTransactions?.current_page || 1) - 1,
                                                })
                                            }
                                        >
                                            Sebelumnya
                                        </Button>
                                    )}
                                    {(giroTransactions?.current_page || 1) < (giroTransactions?.last_page || 1) && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                router.get(route("kas.giro-transactions.index"), {
                                                    ...(filters || {}),
                                                    page: (giroTransactions?.current_page || 1) + 1,
                                                })
                                            }
                                        >
                                            Selanjutnya
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Hapus</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus transaksi giro ini? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
