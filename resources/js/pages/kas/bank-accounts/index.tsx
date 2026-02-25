import { type Column, type FilterField, DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Building2, Edit3, Eye, Loader2, PlusCircle, RefreshCw, Trash } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

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
        jenis_rekening?: string;
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
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        account: BankAccount | null;
        loading: boolean;
    }>({
        open: false,
        account: null,
        loading: false,
    });

    const navigate = (p: Record<string, any>) =>
        router.get('/kas/bank-accounts', p, { preserveState: true, replace: true });

    const fp = {
        search: filters.search || '',
        status: filters.status || '',
        jenis_rekening: filters.jenis_rekening || '',
        perPage: filters.perPage,
    };

    const handleDeleteConfirm = async () => {
        if (!deleteDialog.account) return;
        setDeleteDialog((prev) => ({ ...prev, loading: true }));
        try {
            await router.delete(route('kas.bank-accounts.destroy', deleteDialog.account.id), {
                onSuccess: () => {
                    toast.success(`Rekening ${deleteDialog.account?.nama_bank} berhasil dihapus`);
                    setDeleteDialog({ open: false, account: null, loading: false });
                },
                onError: () => {
                    toast.error('Gagal menghapus rekening');
                    setDeleteDialog((prev) => ({ ...prev, loading: false }));
                },
            });
        } catch {
            toast.error('Terjadi kesalahan saat menghapus rekening');
            setDeleteDialog((prev) => ({ ...prev, loading: false }));
        }
    };

    const handleUpdateSaldo = (account: BankAccount) => {
        router.post(route('kas.bank-accounts.update-saldo', account.id), {}, {
            onSuccess: () => toast.success('Saldo berhasil diperbarui'),
            onError: () => toast.error('Gagal memperbarui saldo'),
        });
    };

    const columns: Column<BankAccount>[] = [
        { key: 'kode', label: 'Kode', className: 'font-medium', render: (row) => row.kode_rekening },
        {
            key: 'bank',
            label: 'Bank',
            render: (row) => (
                <div>
                    <p className="font-medium">{row.nama_bank}</p>
                    <p className="text-sm text-muted-foreground">{row.cabang}</p>
                </div>
            ),
        },
        {
            key: 'rekening',
            label: 'Rekening',
            render: (row) => (
                <div>
                    <p className="font-medium">{row.nama_rekening}</p>
                    <p className="text-sm text-muted-foreground font-mono">{row.nomor_rekening}</p>
                </div>
            ),
        },
        { key: 'jenis', label: 'Jenis', render: (row) => getJenisRekeningBadge(row.jenis_rekening) },
        { key: 'saldo_awal', label: 'Saldo Awal', className: 'font-mono', render: (row) => formatCurrency(row.saldo_awal) },
        { key: 'saldo_berjalan', label: 'Saldo Berjalan', className: 'font-mono', render: (row) => formatCurrency(row.saldo_berjalan) },
        { key: 'status', label: 'Status', render: (row) => getStatusBadge(row.is_aktif) },
        {
            key: 'aksi',
            label: 'Aksi',
            render: (row) => (
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => router.visit(`/kas/bank-accounts/${row.id}`)}>
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => router.visit(`/kas/bank-accounts/${row.id}/edit`)}>
                        <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleUpdateSaldo(row)} className="text-blue-600 hover:text-blue-700" title="Update Saldo">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setDeleteDialog({ open: true, account: row, loading: false })} className="text-destructive hover:text-destructive">
                        <Trash className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    const filterFields: FilterField[] = [
        {
            name: 'jenis_rekening',
            label: 'Jenis Rekening',
            type: 'select',
            value: fp.jenis_rekening,
            options: [
                { value: 'giro', label: 'Giro' },
                { value: 'tabungan', label: 'Tabungan' },
                { value: 'deposito', label: 'Deposito' },
            ],
        },
        {
            name: 'status',
            label: 'Status',
            type: 'select',
            value: fp.status,
            options: [
                { value: 'aktif', label: 'Aktif' },
                { value: 'tidak_aktif', label: 'Tidak Aktif' },
            ],
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Rekening Bank" />
            <div className="p-4">
                <DataTable<BankAccount>
                    pageTitle="Daftar Rekening Bank"
                    pageSubtitle="Kelola data rekening bank Anda di sini"
                    columns={columns}
                    data={bankAccounts.data}
                    pagination={bankAccounts}
                    searchValue={fp.search}
                    searchPlaceholder="Cari nama bank, nomor rekening..."
                    onSearch={(v) => navigate({ ...fp, search: v, page: 1 })}
                    filters={filterFields}
                    onFilterChange={(k, v) => navigate({ ...fp, [k]: v, page: 1 })}
                    onFilterReset={() => navigate({ search: '', status: '', jenis_rekening: '', perPage: fp.perPage, page: 1 })}
                    onPageChange={(p) => navigate({ ...fp, page: p })}
                    onPerPageChange={(n) => navigate({ ...fp, perPage: n, page: 1 })}
                    headerActions={
                        <Button onClick={() => router.visit('/kas/bank-accounts/create')} className="gap-2">
                            <PlusCircle className="h-4 w-4" />
                            Tambah Rekening
                        </Button>
                    }
                    emptyIcon={<Building2 className="h-8 w-8 text-muted-foreground/50" />}
                    emptyText="Tidak ada data rekening bank"
                    rowKey={(r) => r.id}
                />
            </div>

            {/* Delete Dialog */}
            <Dialog open={deleteDialog.open} onOpenChange={(open) => !deleteDialog.loading && setDeleteDialog((prev) => ({ ...prev, open }))}>
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
                        <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteDialog.loading} className="gap-2">
                            {deleteDialog.loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
