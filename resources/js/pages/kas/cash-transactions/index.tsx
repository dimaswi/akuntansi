import { type Column, DataTable, type FilterField } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePermission } from '@/hooks/use-permission';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { CheckCircle, Edit3, Eye, Loader2, PlusCircle, Trash, Wallet } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

// ─── Interfaces ──────────────────────────────────────────────────────
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
    daftar_akun_kas?: { id: number; kode_akun: string; nama_akun: string; jenis_akun: string };
    daftar_akun_lawan?: { id: number; kode_akun: string; nama_akun: string; jenis_akun: string };
    user?: { id: number; name: string };
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

// ─── Helpers ─────────────────────────────────────────────────────────
const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });

const breadcrumbs: BreadcrumbItem[] = [
    { title: <Wallet className="h-4 w-4" />, href: '/kas' },
    { title: 'Transaksi Kas', href: '/kas/cash-transactions' },
];

// ─── Page ────────────────────────────────────────────────────────────
export default function CashTransactionIndex() {
    const { cashTransactions, filters, jenisTransaksi } = usePage<Props>().props;
    const { hasPermission } = usePermission();

    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        transaction: CashTransaction | null;
        loading: boolean;
    }>({ open: false, transaction: null, loading: false });

    // ─── Navigation helper ───────────────────────────────────
    const navigate = (params: Record<string, any>) =>
        router.get('/kas/cash-transactions', params, { preserveState: true, replace: true });

    const currentFilters = () => ({
        search: filters.search,
        perPage: filters.perPage,
        status: filters.status,
        jenis_transaksi: filters.jenis_transaksi,
        tanggal_dari: filters.tanggal_dari || '',
        tanggal_sampai: filters.tanggal_sampai || '',
    });

    // ─── Selection ───────────────────────────────────────────
    const draftIds = cashTransactions.data.filter((t) => t.status === 'draft').map((t) => t.id);
    const allDraftSelected = draftIds.length > 0 && draftIds.every((id) => selectedIds.includes(id));

    const handleSelectAll = (checked: boolean) => {
        setSelectedIds(checked ? draftIds : []);
    };

    const handleSelectOne = (id: number, checked: boolean) => {
        setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
    };

    // ─── Delete ──────────────────────────────────────────────
    const handleDeleteConfirm = () => {
        if (!deleteDialog.transaction) return;
        setDeleteDialog((prev) => ({ ...prev, loading: true }));
        router.delete(route('kas.cash-transactions.destroy', deleteDialog.transaction.id), {
            onSuccess: () => {
                toast.success(`Transaksi ${deleteDialog.transaction?.nomor_transaksi} berhasil dihapus`);
                setDeleteDialog({ open: false, transaction: null, loading: false });
            },
            onError: () => {
                toast.error('Gagal menghapus transaksi');
                setDeleteDialog((prev) => ({ ...prev, loading: false }));
            },
        });
    };

    // ─── Batch post ──────────────────────────────────────────
    const handleBatchPost = () => {
        if (selectedIds.length === 0) return toast.error('Pilih minimal satu transaksi');
        const qs = selectedIds.map((id) => `ids[]=${id}`).join('&');
        router.visit(`/kas/cash-transactions/post-to-journal?${qs}`);
    };

    // ─── Columns ─────────────────────────────────────────────
    const columns: Column<CashTransaction>[] = [
        {
            key: 'checkbox',
            label: '',
            className: 'w-10',
            headerRender: () => (
                <Checkbox checked={allDraftSelected} onCheckedChange={handleSelectAll} aria-label="Select all" />
            ),
            render: (row) =>
                row.status === 'draft' ? (
                    <Checkbox
                        checked={selectedIds.includes(row.id)}
                        onCheckedChange={(c) => handleSelectOne(row.id, c as boolean)}
                        aria-label={`Select ${row.nomor_transaksi}`}
                    />
                ) : null,
        },
        {
            key: 'nomor',
            label: 'Nomor Transaksi',
            render: (row) => <span className="font-medium">{row.nomor_transaksi}</span>,
        },
        {
            key: 'tanggal',
            label: 'Tanggal',
            render: (row) => formatDate(row.tanggal_transaksi),
        },
        {
            key: 'jenis',
            label: 'Jenis',
            render: (row) => (
                <Badge variant="outline" className="text-xs">
                    {row.jenis_transaksi.replace(/_/g, ' ').toUpperCase()}
                </Badge>
            ),
        },
        {
            key: 'jumlah',
            label: 'Jumlah',
            render: (row) => <span className="font-mono">{formatCurrency(row.jumlah)}</span>,
        },
        {
            key: 'keterangan',
            label: 'Keterangan',
            className: 'max-w-xs',
            render: (row) => <span className="truncate block">{row.keterangan}</span>,
        },
        {
            key: 'status',
            label: 'Status',
            render: (row) =>
                row.status === 'posted' ? (
                    <Badge variant="secondary">Posted</Badge>
                ) : (
                    <Badge variant="outline">Draft</Badge>
                ),
        },
        {
            key: 'aksi',
            label: 'Aksi',
            render: (row) => (
                <div className="flex items-center gap-1">
                    {hasPermission('kas.cash-management.view') && (
                        <Button variant="outline" size="sm" onClick={() => router.visit(`/kas/cash-transactions/${row.id}`)}>
                            <Eye className="h-4 w-4" />
                        </Button>
                    )}
                    {row.status === 'draft' && (
                        <>
                            {hasPermission('kas.cash-management.daily-entry') && (
                                <Button variant="outline" size="sm" onClick={() => router.visit(`/kas/cash-transactions/${row.id}/edit`)}>
                                    <Edit3 className="h-4 w-4" />
                                </Button>
                            )}
                            {hasPermission('akuntansi.journal-posting.post') && (
                                <Button variant="outline" size="sm" onClick={() => router.visit(`/kas/cash-transactions/post-to-journal?id=${row.id}`)}>
                                    <CheckCircle className="h-4 w-4" />
                                </Button>
                            )}
                            {hasPermission('kas.cash-transaction.delete') && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => setDeleteDialog({ open: true, transaction: row, loading: false })}
                                >
                                    <Trash className="h-4 w-4" />
                                </Button>
                            )}
                        </>
                    )}
                </div>
            ),
        },
    ];

    // ─── Filters ─────────────────────────────────────────────
    const filterFields: FilterField[] = [
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
            name: 'jenis_transaksi',
            label: 'Jenis Transaksi',
            type: 'select',
            placeholder: 'Semua Jenis',
            options: [
                { value: '', label: 'Semua Jenis' },
                ...Object.entries(jenisTransaksi).map(([v, l]) => ({ value: v, label: l as string })),
            ],
            value: filters.jenis_transaksi || '',
        },
        { name: 'tanggal_dari', label: 'Tanggal Dari', type: 'date', value: filters.tanggal_dari || '' },
        { name: 'tanggal_sampai', label: 'Tanggal Sampai', type: 'date', value: filters.tanggal_sampai || '' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Transaksi Kas" />
            <div className="p-4">
                <DataTable<CashTransaction>
                    pageTitle="Daftar Transaksi Kas"
                    pageSubtitle="Kelola data transaksi kas Anda di sini"
                    columns={columns}
                    data={cashTransactions.data}
                    pagination={cashTransactions}
                    rowKey={(r) => r.id}
                    searchValue={filters.search}
                    searchPlaceholder="Cari nomor transaksi, keterangan..."
                    onSearch={(search) => navigate({ ...currentFilters(), search, page: 1 })}
                    filters={filterFields}
                    onFilterChange={(name, value) =>
                        navigate({ ...currentFilters(), [name]: value, page: 1 })
                    }
                    onFilterReset={() => navigate({ search: '', perPage: filters.perPage })}
                    onPageChange={(page) => navigate({ ...currentFilters(), page })}
                    onPerPageChange={(perPage) => navigate({ ...currentFilters(), perPage, page: 1 })}
                    perPageOptions={[10, 20, 30, 50]}
                    emptyIcon={<Wallet className="h-8 w-8 text-muted-foreground/50" />}
                    emptyText="Tidak ada data transaksi kas"
                    headerActions={
                        <>
                            {selectedIds.length > 0 && hasPermission('akuntansi.journal-posting.post') && (
                                <Button onClick={handleBatchPost} variant="secondary" size="sm" className="gap-2">
                                    <CheckCircle className="h-4 w-4" />
                                    Posting ({selectedIds.length})
                                </Button>
                            )}
                            <Button size="sm" onClick={() => router.visit('/kas/cash-transactions/create')} className="gap-2">
                                <PlusCircle className="h-4 w-4" />
                                Tambah
                            </Button>
                        </>
                    }
                />
            </div>

            {/* Delete Dialog */}
            <Dialog open={deleteDialog.open} onOpenChange={(open) => !deleteDialog.loading && setDeleteDialog((prev) => ({ ...prev, open }))}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Transaksi</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus transaksi <strong>{deleteDialog.transaction?.nomor_transaksi}</strong>? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialog({ open: false, transaction: null, loading: false })} disabled={deleteDialog.loading}>
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
