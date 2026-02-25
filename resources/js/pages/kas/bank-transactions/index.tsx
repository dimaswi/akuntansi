import { type Column, DataTable, type FilterField } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePermission } from '@/hooks/use-permission';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { CheckCircle, Edit3, Eye, Landmark, Loader2, PlusCircle, Trash } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

interface BankAccount { id: number; kode_rekening: string; nama_bank: string; nama_rekening: string; }
interface BankTransaction {
    id: number; nomor_transaksi: string; tanggal_transaksi: string; jenis_transaksi: string;
    jumlah: number; keterangan: string; pihak_terkait?: string; referensi?: string;
    status: string; is_posted: boolean; bank_account: BankAccount;
    daftar_akun?: { id: number; kode_akun: string; nama_akun: string };
    user?: { id: number; name: string }; created_at: string; updated_at: string;
}
interface PaginatedBankTransaction {
    data: BankTransaction[]; current_page: number; last_page: number;
    per_page: number; total: number; from: number; to: number;
}
interface Props extends SharedData {
    bankTransactions: PaginatedBankTransaction;
    filters: { search: string; perPage: number; status: string; jenis_transaksi: string; bank_account_id?: string; tanggal_dari?: string; tanggal_sampai?: string };
    bankAccounts: BankAccount[];
    jenisTransaksi: Record<string, string>;
}

const formatCurrency = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });

const breadcrumbs: BreadcrumbItem[] = [
    { title: <Landmark className="h-4 w-4" />, href: '/kas' },
    { title: 'Transaksi Bank', href: '/kas/bank-transactions' },
];

export default function BankTransactionIndex() {
    const { bankTransactions, filters, bankAccounts, jenisTransaksi } = usePage<Props>().props;
    const { hasPermission } = usePermission();
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; transaction: BankTransaction | null; loading: boolean }>({ open: false, transaction: null, loading: false });

    const navigate = (params: Record<string, any>) => router.get('/kas/bank-transactions', params, { preserveState: true, replace: true });
    const currentFilters = () => ({ search: filters.search, perPage: filters.perPage, status: filters.status, jenis_transaksi: filters.jenis_transaksi, bank_account_id: filters.bank_account_id || '', tanggal_dari: filters.tanggal_dari || '', tanggal_sampai: filters.tanggal_sampai || '' });

    const draftIds = (bankTransactions?.data || []).filter((t) => t.status === 'draft').map((t) => t.id);
    const allDraftSelected = draftIds.length > 0 && draftIds.every((id) => selectedIds.includes(id));

    const handleDeleteConfirm = () => {
        if (!deleteDialog.transaction) return;
        setDeleteDialog((p) => ({ ...p, loading: true }));
        router.delete(route('kas.bank-transactions.destroy', deleteDialog.transaction.id), {
            onSuccess: () => { toast.success(`Transaksi ${deleteDialog.transaction?.nomor_transaksi} berhasil dihapus`); setDeleteDialog({ open: false, transaction: null, loading: false }); },
            onError: () => { toast.error('Gagal menghapus transaksi'); setDeleteDialog((p) => ({ ...p, loading: false })); },
        });
    };

    const handleBatchPost = () => {
        if (selectedIds.length === 0) return toast.error('Pilih minimal satu transaksi');
        router.visit(route('kas.bank-transactions.show-post-to-journal', { id: selectedIds[0] }));
    };

    const columns: Column<BankTransaction>[] = [
        {
            key: 'checkbox', label: '', className: 'w-10',
            headerRender: () => <Checkbox checked={allDraftSelected} onCheckedChange={(c) => setSelectedIds(c ? draftIds : [])} aria-label="Select all" />,
            render: (row) => row.status === 'draft' ? <Checkbox checked={selectedIds.includes(row.id)} onCheckedChange={(c) => setSelectedIds((p) => (c ? [...p, row.id] : p.filter((x) => x !== row.id)))} /> : null,
        },
        { key: 'nomor', label: 'Nomor Transaksi', render: (row) => <span className="font-medium">{row.nomor_transaksi}</span> },
        { key: 'tanggal', label: 'Tanggal', render: (row) => formatDate(row.tanggal_transaksi) },
        { key: 'bank', label: 'Bank Account', render: (row) => (<div><p className="font-medium">{row.bank_account.nama_bank}</p></div>) },
        { key: 'jenis', label: 'Jenis', render: (row) => <Badge variant="outline" className="text-xs">{row.jenis_transaksi.replace(/_/g, ' ').toUpperCase()}</Badge> },
        { key: 'jumlah', label: 'Jumlah', render: (row) => <span className="font-mono">{formatCurrency(row.jumlah)}</span> },
        { key: 'keterangan', label: 'Keterangan', className: 'max-w-xs', render: (row) => <span className="truncate block">{row.keterangan}</span> },
        { key: 'status', label: 'Status', render: (row) => row.status === 'posted' ? <Badge variant="secondary">Posted</Badge> : <Badge variant="outline">Draft</Badge> },
        {
            key: 'aksi', label: 'Aksi', render: (row) => (
                <div className="flex items-center gap-1">
                    {hasPermission('kas.cash-management.view') && <Button variant="outline" size="sm" onClick={() => router.visit(`/kas/bank-transactions/${row.id}`)}><Eye className="h-4 w-4" /></Button>}
                    {row.status === 'draft' && (<>
                        {hasPermission('kas.cash-management.daily-entry') && <Button variant="outline" size="sm" onClick={() => router.visit(`/kas/bank-transactions/${row.id}/edit`)}><Edit3 className="h-4 w-4" /></Button>}
                        {hasPermission('akuntansi.journal-posting.post') && <Button variant="outline" size="sm" onClick={() => router.visit(route('kas.bank-transactions.show-post-to-journal', { id: row.id }))}><CheckCircle className="h-4 w-4" /></Button>}
                        {hasPermission('kas.bank-transaction.delete') && <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteDialog({ open: true, transaction: row, loading: false })}><Trash className="h-4 w-4" /></Button>}
                    </>)}
                </div>
            ),
        },
    ];

    const filterFields: FilterField[] = [
        { name: 'status', label: 'Status', type: 'select', placeholder: 'Semua Status', options: [{ value: '', label: 'Semua Status' }, { value: 'draft', label: 'Draft' }, { value: 'posted', label: 'Posted' }], value: filters.status || '' },
        { name: 'jenis_transaksi', label: 'Jenis Transaksi', type: 'select', placeholder: 'Semua Jenis', options: [{ value: '', label: 'Semua Jenis' }, ...Object.entries(jenisTransaksi || {}).map(([v, l]) => ({ value: v, label: l as string }))], value: filters.jenis_transaksi || '' },
        { name: 'bank_account_id', label: 'Bank Account', type: 'select', placeholder: 'Semua Bank', options: [{ value: '', label: 'Semua Bank Account' }, ...(bankAccounts || []).map((a) => ({ value: a.id.toString(), label: `${a.kode_rekening} - ${a.nama_bank}` }))], value: filters.bank_account_id || '' },
        { name: 'tanggal_dari', label: 'Tanggal Dari', type: 'date', value: filters.tanggal_dari || '' },
        { name: 'tanggal_sampai', label: 'Tanggal Sampai', type: 'date', value: filters.tanggal_sampai || '' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Transaksi Bank" />
            <div className="p-4">
                <DataTable<BankTransaction>
                    pageTitle="Daftar Transaksi Bank"
                    pageSubtitle="Kelola data transaksi bank Anda di sini"
                    columns={columns} data={bankTransactions?.data || []} pagination={bankTransactions} rowKey={(r) => r.id}
                    searchValue={filters.search} searchPlaceholder="Cari nomor transaksi, keterangan..."
                    onSearch={(search) => navigate({ ...currentFilters(), search, page: 1 })}
                    filters={filterFields}
                    onFilterChange={(name, value) => navigate({ ...currentFilters(), [name]: value, page: 1 })}
                    onFilterReset={() => navigate({ search: '', perPage: filters.perPage })}
                    onPageChange={(page) => navigate({ ...currentFilters(), page })}
                    onPerPageChange={(perPage) => navigate({ ...currentFilters(), perPage, page: 1 })}
                    perPageOptions={[10, 20, 30, 50]}
                    emptyIcon={<Landmark className="h-8 w-8 text-muted-foreground/50" />}
                    emptyText="Tidak ada data transaksi bank"
                    headerActions={<>
                        {selectedIds.length > 0 && hasPermission('akuntansi.journal-posting.post') && (
                            <Button onClick={handleBatchPost} variant="secondary" size="sm" className="gap-2"><CheckCircle className="h-4 w-4" />Posting ({selectedIds.length})</Button>
                        )}
                        <Button size="sm" onClick={() => router.visit('/kas/bank-transactions/create')} className="gap-2"><PlusCircle className="h-4 w-4" />Tambah</Button>
                    </>}
                />
            </div>

            <Dialog open={deleteDialog.open} onOpenChange={(open) => !deleteDialog.loading && setDeleteDialog((p) => ({ ...p, open }))}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Transaksi</DialogTitle>
                        <DialogDescription>Apakah Anda yakin ingin menghapus transaksi <strong>{deleteDialog.transaction?.nomor_transaksi}</strong>? Tindakan ini tidak dapat dibatalkan.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialog({ open: false, transaction: null, loading: false })} disabled={deleteDialog.loading}>Batal</Button>
                        <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteDialog.loading} className="gap-2">{deleteDialog.loading && <Loader2 className="h-4 w-4 animate-spin" />}Hapus</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
