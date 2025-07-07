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
import { Edit3, PlusCircle, Search, Trash, X, Loader2, Building2, Eye, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { route } from "ziggy-js";

interface DaftarAkun {
    id: number;
    kode_akun: string;
    nama_akun: string;
}

interface BankAccount {
    id: number;
    kode_rekening: string;
    nama_bank: string;
    nama_rekening: string;
    nomor_rekening: string;
    cabang?: string;
    saldo_awal: number;
    saldo_berjalan: number;
    jenis_rekening: string;
    keterangan?: string;
    is_aktif: boolean;
    daftar_akun?: DaftarAkun;
    created_at: string;
    updated_at: string;
}

interface PaginatedBankAccount {
    data: BankAccount[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Props extends SharedData {
    bankAccounts: PaginatedBankAccount;
    filters: {
        search: string;
        perPage: number;
        status: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: <Building2 className="h-4 w-4" />,
        href: '/kas',
    },
    {
        title: 'Rekening Bank',
        href: '/kas/bank-accounts',
    },
];

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
};

const getStatusBadge = (isAktif: boolean) => {
    return isAktif ? (
        <Badge className="bg-green-100 text-green-800">Aktif</Badge>
    ) : (
        <Badge variant="secondary">Tidak Aktif</Badge>
    );
};

const getJenisRekeningBadge = (jenis: string) => {
    const colors: Record<string, string> = {
        'giro': 'bg-blue-100 text-blue-800',
        'tabungan': 'bg-green-100 text-green-800',
        'deposito': 'bg-purple-100 text-purple-800',
    };

    return (
        <Badge className={colors[jenis] || 'bg-gray-100 text-gray-800'}>
            {jenis.toUpperCase()}
        </Badge>
    );
};

export default function BankAccountIndex() {
    const { bankAccounts, filters } = usePage<Props>().props;
    const [search, setSearch] = useState(filters.search);
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        account: BankAccount | null;
        loading: boolean;
    }>({
        open: false,
        account: null,
        loading: false,
    });

    const handleSearch = (searchValue: string) => {
        router.get('/kas/bank-accounts', {
            search: searchValue,
            perPage: filters.perPage,
            status: filters.status,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleStatusChange = (status: string) => {
        router.get('/kas/bank-accounts', {
            search: filters.search,
            perPage: filters.perPage,
            status: status === 'all' ? '' : status,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handlePerPageChange = (perPage: number) => {
        router.get('/kas/bank-accounts', {
            search: filters.search,
            perPage,
            status: filters.status,
            page: 1,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handlePageChange = (page: number) => {
        router.get('/kas/bank-accounts', {
            search: filters.search,
            perPage: filters.perPage,
            status: filters.status,
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

    const handleDeleteClick = (account: BankAccount) => {
        setDeleteDialog({
            open: true,
            account: account,
            loading: false,
        });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteDialog.account) return;
        
        setDeleteDialog(prev => ({ ...prev, loading: true }));
        
        try {
            await router.delete(route('kas.bank-accounts.destroy', deleteDialog.account.id), {
                onSuccess: () => {
                    toast.success(`Rekening ${deleteDialog.account?.nama_bank} berhasil dihapus`);
                    setDeleteDialog({ open: false, account: null, loading: false });
                },
                onError: () => {
                    toast.error('Gagal menghapus rekening');
                    setDeleteDialog(prev => ({ ...prev, loading: false }));
                }
            });
        } catch (error) {
            toast.error('Terjadi kesalahan saat menghapus rekening');
            setDeleteDialog(prev => ({ ...prev, loading: false }));
        }
    };

    const handleUpdateSaldo = (account: BankAccount) => {
        router.post(route('kas.bank-accounts.update-saldo', account.id), {}, {
            onSuccess: () => {
                toast.success(`Saldo rekening ${account.nama_bank} berhasil diperbarui`);
            },
            onError: () => {
                toast.error('Gagal memperbarui saldo rekening');
            }
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Rekening Bank" />
            <div className="p-4">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5" />
                                    Rekening Bank
                                </CardTitle>
                                <CardDescription>
                                    Kelola data rekening bank perusahaan
                                </CardDescription>
                            </div>
                            <Button
                                onClick={() => router.visit('/kas/bank-accounts/create')}
                                className="gap-2"
                            >
                                <PlusCircle className="h-4 w-4" />
                                Tambah Rekening
                            </Button>
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
                                        placeholder="Cari nama bank, nomor rekening..."
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
                                        value={filters.status}
                                        onValueChange={handleStatusChange}
                                    >
                                        <SelectTrigger className="w-32">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua</SelectItem>
                                            <SelectItem value="aktif">Aktif</SelectItem>
                                            <SelectItem value="tidak_aktif">Tidak Aktif</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Per halaman</Label>
                                    <Select
                                        value={filters.perPage.toString()}
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
                                        <TableHead>Kode</TableHead>
                                        <TableHead>Bank</TableHead>
                                        <TableHead>Rekening</TableHead>
                                        <TableHead>Jenis</TableHead>
                                        <TableHead>Saldo Awal</TableHead>
                                        <TableHead>Saldo Berjalan</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {bankAccounts.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                                Tidak ada data rekening bank
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        bankAccounts.data.map((account) => (
                                            <TableRow key={account.id}>
                                                <TableCell className="font-medium">
                                                    {account.kode_rekening}
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{account.nama_bank}</p>
                                                        <p className="text-sm text-muted-foreground">{account.cabang}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{account.nama_rekening}</p>
                                                        <p className="text-sm text-muted-foreground font-mono">{account.nomor_rekening}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getJenisRekeningBadge(account.jenis_rekening)}
                                                </TableCell>
                                                <TableCell className="font-mono">
                                                    {formatCurrency(account.saldo_awal)}
                                                </TableCell>
                                                <TableCell className="font-mono">
                                                    {formatCurrency(account.saldo_berjalan)}
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(account.is_aktif)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => router.visit(`/kas/bank-accounts/${account.id}`)}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => router.visit(`/kas/bank-accounts/${account.id}/edit`)}
                                                        >
                                                            <Edit3 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleUpdateSaldo(account)}
                                                            className="text-blue-600 hover:text-blue-700"
                                                            title="Update Saldo"
                                                        >
                                                            <RefreshCw className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDeleteClick(account)}
                                                            className="text-destructive hover:text-destructive"
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
                        {bankAccounts.last_page > 1 && (
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">
                                    Menampilkan {bankAccounts.from} sampai {bankAccounts.to} dari {bankAccounts.total} entri
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(bankAccounts.current_page - 1)}
                                        disabled={bankAccounts.current_page === 1}
                                    >
                                        Sebelumnya
                                    </Button>
                                    <span className="text-sm">
                                        Halaman {bankAccounts.current_page} dari {bankAccounts.last_page}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(bankAccounts.current_page + 1)}
                                        disabled={bankAccounts.current_page === bankAccounts.last_page}
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
                            <DialogTitle>Hapus Rekening Bank</DialogTitle>
                            <DialogDescription>
                                Apakah Anda yakin ingin menghapus rekening <strong>{deleteDialog.account?.nama_bank} - {deleteDialog.account?.nama_rekening}</strong>?
                                Tindakan ini tidak dapat dibatalkan.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setDeleteDialog({ open: false, account: null, loading: false })}
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
