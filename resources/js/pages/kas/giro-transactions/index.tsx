import { type Column, DataTable, type FilterField } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePermission } from '@/hooks/use-permission';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { CheckCircle, Edit3, Eye, Loader2, PlusCircle, Receipt, Trash } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

interface BankAccount { id: number; kode_rekening: string; nama_bank: string; nama_rekening: string; }
interface GiroTransaction {
    id: number; nomor_giro: string; tanggal_giro: string; tanggal_jatuh_tempo: string;
    jenis_giro: string; jumlah: number; penerbit?: string; penerima?: string;
    keterangan: string; status_giro: string; is_posted: boolean;
    bank_account: BankAccount; daftar_akun?: { id: number; kode_akun: string; nama_akun: string };
    user?: { id: number; name: string }; created_at: string; updated_at: string;
}
interface PaginatedGiroTransaction {
    data: GiroTransaction[]; current_page: number; last_page: number;
    per_page: number; total: number; from: number; to: number;
}
interface Props extends SharedData {
    giroTransactions: PaginatedGiroTransaction;
    filters: { search: string; perPage: number; status_giro: string; jenis_giro: string; bank_account_id?: string; tanggal_dari?: string; tanggal_sampai?: string };
    bankAccounts: BankAccount[];
    jenisGiro: Record<string, string>;
    statusGiro: Record<string, string>;
}

const formatCurrency = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });

const breadcrumbs: BreadcrumbItem[] = [
    { title: <Receipt className="h-4 w-4" />, href: '/kas' },
    { title: 'Transaksi Giro', href: '/kas/giro-transactions' },
];

export default function GiroTransactionIndex() {
    const { giroTransactions, filters, bankAccounts, jenisGiro, statusGiro } = usePage<Props>().props;
    const { hasPermission } = usePermission();
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; transaction: GiroTransaction | null; loading: boolean }>({ open: false, transaction: null, loading: false });

    const navigate = (params: Record<string, any>) => router.get('/kas/giro-transactions', params, { preserveState: true, replace: true });
    const currentFilters = () => ({ search: filters.search, perPage: filters.perPage, status_giro: filters.status_giro, jenis_giro: filters.jenis_giro, bank_account_id: filters.bank_account_id || '', tanggal_dari: filters.tanggal_dari || '', tanggal_sampai: filters.tanggal_sampai || '' });

    const draftIds = (giroTransactions?.data || []).filter((t) => t.status_giro === 'draft').map((t) => t.id);
    const allDraftSelected = draftIds.length > 0 && draftIds.every((id) => selectedIds.includes(id));

    const handleDeleteConfirm = () => {
        if (!deleteDialog.transaction) return;
        setDeleteDialog((p) => ({ ...p, loading: true }));
        router.delete(route('kas.giro-transactions.destroy', deleteDialog.transaction.id), {
            onSuccess: () => { toast.success(`Giro ${deleteDialog.transaction?.nomor_giro} berhasil dihapus`); setDeleteDialog({ open: false, transaction: null, loading: false }); },
            onError: () => { toast.error('Gagal menghapus giro'); setDeleteDialog((p) => ({ ...p, loading: false })); },
        });
    };

    const handleBatchPost = () => {
        if (selectedIds.length === 0) return toast.error('Pilih minimal satu giro');
        router.visit(route('kas.giro-transactions.show-post-to-journal', { id: selectedIds[0] }));
    };

    const columns: Column<GiroTransaction>[] = [
        {
            key: 'checkbox', label: '', className: 'w-10',
            headerRender: () => <Checkbox checked={allDraftSelected} onCheckedChange={(c) => setSelectedIds(c ? draftIds : [])} aria-label="Select all" />,
            render: (row) => row.status_giro === 'draft' ? <Checkbox checked={selectedIds.includes(row.id)} onCheckedChange={(c) => setSelectedIds((p) => (c ? [...p, row.id] : p.filter((x) => x !== row.id)))} /> : null,
        },
        { key: 'nomor', label: 'Nomor Giro', render: (row) => <span className="font-medium">{row.nomor_giro}</span> },
        { key: 'tanggal', label: 'Tanggal', render: (row) => formatDate(row.tanggal_giro) },
        { key: 'jatuh_tempo', label: 'Jatuh Tempo', render: (row) => formatDate(row.tanggal_jatuh_tempo) },
        { key: 'bank', label: 'Bank Account', render: (row) => (<div><p className="font-medium">{row.bank_account.nama_bank}</p><p className="text-sm text-muted-foreground">{row.bank_account.kode_rekening}</p></div>) },
        { key: 'jenis', label: 'Jenis', render: (row) => <Badge variant="secondary" className="text-xs">{row.jenis_giro.replace(/_/g, ' ').toUpperCase()}</Badge> },
        { key: 'jumlah', label: 'Jumlah', render: (row) => <span className="font-mono">{formatCurrency(row.jumlah)}</span> },
        { key: 'pihak', label: 'Penerbit/Penerima', render: (row) => row.jenis_giro === 'masuk' ? row.penerbit || '-' : row.penerima || '-' },
        { key: 'status', label: 'Status', render: (row) => <Badge variant="outline" className="text-xs">{row.status_giro.replace(/_/g, ' ').charAt(0).toUpperCase() + row.status_giro.replace(/_/g, ' ').slice(1)}</Badge> },
        {
            key: 'aksi', label: 'Aksi', render: (row) => (
                <div className="flex items-center gap-1">
                    {hasPermission('kas.cash-management.view') && <Button variant="outline" size="sm" onClick={() => router.visit(`/kas/giro-transactions/${row.id}`)}><Eye className="h-4 w-4" /></Button>}
                    {row.status_giro === 'draft' && (<>
                        {hasPermission('kas.cash-management.daily-entry') && <Button variant="outline" size="sm" onClick={() => router.visit(`/kas/giro-transactions/${row.id}/edit`)}><Edit3 className="h-4 w-4" /></Button>}
                        {hasPermission('akuntansi.journal-posting.post') && <Button variant="outline" size="sm" onClick={() => router.visit(route('kas.giro-transactions.show-post-to-journal', { id: row.id }))}><CheckCircle className="h-4 w-4" /></Button>}
                        {hasPermission('kas.giro-transaction.delete') && <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteDialog({ open: true, transaction: row, loading: false })}><Trash className="h-4 w-4" /></Button>}
                    </>)}
                </div>
            ),
        },
    ];

    const filterFields: FilterField[] = [
        { name: 'status_giro', label: 'Status Giro', type: 'select', placeholder: 'Semua Status', options: [{ value: '', label: 'Semua Status' }, ...Object.entries(statusGiro || {}).map(([v, l]) => ({ value: v, label: l as string }))], value: filters.status_giro || '' },
        { name: 'jenis_giro', label: 'Jenis Giro', type: 'select', placeholder: 'Semua Jenis', options: [{ value: '', label: 'Semua Jenis' }, ...Object.entries(jenisGiro || {}).map(([v, l]) => ({ value: v, label: l as string }))], value: filters.jenis_giro || '' },
        { name: 'bank_account_id', label: 'Bank Account', type: 'select', placeholder: 'Semua Bank', options: [{ value: '', label: 'Semua Bank Account' }, ...(bankAccounts || []).map((a) => ({ value: a.id.toString(), label: `${a.kode_rekening} - ${a.nama_bank}` }))], value: filters.bank_account_id || '' },
        { name: 'tanggal_dari', label: 'Tanggal Dari', type: 'date', value: filters.tanggal_dari || '' },
        { name: 'tanggal_sampai', label: 'Tanggal Sampai', type: 'date', value: filters.tanggal_sampai || '' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Transaksi Giro" />
            <div className="p-4">
                <DataTable<GiroTransaction>
                    pageTitle="Daftar Transaksi Giro"
                    pageSubtitle="Kelola data transaksi giro Anda di sini"
                    columns={columns} data={giroTransactions?.data || []} pagination={giroTransactions} rowKey={(r) => r.id}
                    searchValue={filters.search} searchPlaceholder="Cari nomor giro, keterangan..."
                    onSearch={(search) => navigate({ ...currentFilters(), search, page: 1 })}
                    filters={filterFields}
                    onFilterChange={(name, value) => navigate({ ...currentFilters(), [name]: value, page: 1 })}
                    onFilterReset={() => navigate({ search: '', perPage: filters.perPage })}
                    onPageChange={(page) => navigate({ ...currentFilters(), page })}
                    onPerPageChange={(perPage) => navigate({ ...currentFilters(), perPage, page: 1 })}
                    perPageOptions={[10, 20, 30, 50]}
                    emptyIcon={<Receipt className="h-8 w-8 text-muted-foreground/50" />}
                    emptyText="Tidak ada data transaksi giro"
                    headerActions={<>
                        {selectedIds.length > 0 && hasPermission('akuntansi.journal-posting.post') && (
                            <Button onClick={handleBatchPost} variant="secondary" size="sm" className="gap-2"><CheckCircle className="h-4 w-4" />Posting ({selectedIds.length})</Button>
                        )}
                        <Button size="sm" onClick={() => router.visit('/kas/giro-transactions/create')} className="gap-2"><PlusCircle className="h-4 w-4" />Tambah</Button>
                    </>}
                />
            </div>

            <Dialog open={deleteDialog.open} onOpenChange={(open) => !deleteDialog.loading && setDeleteDialog((p) => ({ ...p, open }))}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Giro</DialogTitle>
                        <DialogDescription>Apakah Anda yakin ingin menghapus giro <strong>{deleteDialog.transaction?.nomor_giro}</strong>? Tindakan ini tidak dapat dibatalkan.</DialogDescription>
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