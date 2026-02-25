import { type Column, type FilterField, DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Calculator, Edit3, Eye, Loader2, PlusCircle, Trash } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

interface User { id: number; name: string; }

interface Jurnal {
    id: number; nomor_jurnal: string; tanggal_transaksi: string; keterangan: string;
    total_debit: number; total_kredit: number; status: string;
    created_at: string; updated_at: string; dibuat_oleh_user?: User;
}

interface PaginatedJurnal { data: Jurnal[]; current_page: number; last_page: number; per_page: number; total: number; from: number; to: number; }

interface Props extends SharedData {
    jurnals: PaginatedJurnal;
    filters: { search: string; perPage: number; status: string; tanggal_dari?: string; tanggal_sampai?: string };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: (<Calculator className="h-4 w-4" />) as any, href: '/akuntansi' },
    { title: 'Jurnal Penyesuaian', href: '/akuntansi/jurnal-penyesuaian' },
];

const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' }> = {
    draft: { label: 'Draft', variant: 'secondary' },
    posted: { label: 'Posted', variant: 'default' },
};

export default function JurnalPenyesuaianIndex() {
    const { jurnals, filters } = usePage<Props>().props;
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; jurnal: Jurnal | null; loading: boolean }>({ open: false, jurnal: null, loading: false });

    const navigate = (params: Record<string, any>) =>
        router.get('/akuntansi/jurnal-penyesuaian', params, { preserveState: true, replace: true });

    const handleDeleteConfirm = () => {
        if (!deleteDialog.jurnal) return;
        setDeleteDialog((p) => ({ ...p, loading: true }));
        router.delete(`/akuntansi/jurnal-penyesuaian/${deleteDialog.jurnal.id}`, {
            onSuccess: () => { toast.success('Jurnal penyesuaian berhasil dihapus'); setDeleteDialog({ open: false, jurnal: null, loading: false }); },
            onError: () => { toast.error('Gagal menghapus jurnal penyesuaian'); setDeleteDialog((p) => ({ ...p, loading: false })); },
        });
    };

    const columns: Column<Jurnal>[] = [
        { key: 'no', label: 'No', className: 'w-[50px]', render: (_r, _i, meta) => meta.rowNumber },
        { key: 'nomor_jurnal', label: 'Nomor Jurnal', render: (row) => <span className="font-medium">{row.nomor_jurnal}</span> },
        { key: 'tanggal', label: 'Tanggal', render: (row) => formatDate(row.tanggal_transaksi) },
        { key: 'keterangan', label: 'Keterangan', className: 'max-w-[300px]', render: (row) => <span className="truncate block">{row.keterangan}</span> },
        { key: 'total_debit', label: 'Total Debit', className: 'text-right', render: (row) => <span className="font-mono">{formatCurrency(row.total_debit)}</span> },
        { key: 'total_kredit', label: 'Total Kredit', className: 'text-right', render: (row) => <span className="font-mono">{formatCurrency(row.total_kredit)}</span> },
        { key: 'status', label: 'Status', render: (row) => { const c = statusConfig[row.status] || statusConfig.draft; return <Badge variant={c.variant}>{c.label}</Badge>; } },
        { key: 'dibuat_oleh', label: 'Dibuat Oleh', render: (row) => row.dibuat_oleh_user?.name || '-' },
        {
            key: 'aksi', label: '', className: 'w-[100px]', render: (row) => (
                <div className="flex justify-center gap-1">
                    <Button variant="outline" size="sm" onClick={() => router.visit(route('akuntansi.jurnal-penyesuaian.show', row.id))} title="Detail"><Eye className="h-4 w-4" /></Button>
                    {row.status === 'draft' && <Button variant="outline" size="sm" onClick={() => router.visit(route('akuntansi.jurnal-penyesuaian.edit', row.id))} title="Edit"><Edit3 className="h-4 w-4" /></Button>}
                    {row.status === 'draft' && <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteDialog({ open: true, jurnal: row, loading: false })} title="Hapus"><Trash className="h-4 w-4" /></Button>}
                </div>
            ),
        },
    ];

    const filterFields: FilterField[] = [
        {
            name: 'status', label: 'Status', type: 'select', placeholder: 'Semua Status',
            value: filters?.status || '',
            options: [
                { value: '__all__', label: 'Semua Status' },
                { value: 'draft', label: 'Draft' }, { value: 'posted', label: 'Posted' },
            ],
        },
        { name: 'tanggal_dari', label: 'Tanggal Dari', type: 'date', value: filters?.tanggal_dari || '' },
        { name: 'tanggal_sampai', label: 'Tanggal Sampai', type: 'date', value: filters?.tanggal_sampai || '' },
    ];

    const pag = jurnals || { current_page: 1, last_page: 1, per_page: 10, total: 0, from: 0, to: 0, data: [] as Jurnal[] };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Jurnal Penyesuaian" />
            <div className="p-4">
                <DataTable<Jurnal>
                    pageTitle="Daftar Jurnal Penyesuaian"
                    pageSubtitle="Kelola jurnal penyesuaian Anda di sini"
                    columns={columns} data={pag.data} pagination={pag} rowKey={(r) => r.id}
                    searchValue={filters?.search || ''} searchPlaceholder="Cari nomor jurnal atau keterangan..."
                    onSearch={(search) => navigate({ search, perPage: filters?.perPage || 10, status: filters?.status || '', tanggal_dari: filters?.tanggal_dari || '', tanggal_sampai: filters?.tanggal_sampai || '', page: 1 })}
                    filters={filterFields}
                    onFilterChange={(name, value) => navigate({ search: filters?.search || '', perPage: filters?.perPage || 10, status: name === 'status' ? value : filters?.status || '', tanggal_dari: name === 'tanggal_dari' ? value : filters?.tanggal_dari || '', tanggal_sampai: name === 'tanggal_sampai' ? value : filters?.tanggal_sampai || '', page: 1 })}
                    onFilterReset={() => navigate({ search: '', perPage: filters?.perPage || 10, status: '', tanggal_dari: '', tanggal_sampai: '', page: 1 })}
                    onPageChange={(page) => navigate({ search: filters?.search || '', perPage: filters?.perPage || 10, status: filters?.status || '', tanggal_dari: filters?.tanggal_dari || '', tanggal_sampai: filters?.tanggal_sampai || '', page })}
                    onPerPageChange={(perPage) => navigate({ search: filters?.search || '', perPage, status: filters?.status || '', tanggal_dari: filters?.tanggal_dari || '', tanggal_sampai: filters?.tanggal_sampai || '', page: 1 })}
                    emptyIcon={<Calculator className="h-8 w-8 text-muted-foreground/50" />}
                    emptyText="Tidak ada data jurnal penyesuaian"
                    headerActions={<Button size="sm" onClick={() => router.visit(route('akuntansi.jurnal-penyesuaian.create'))} className="gap-2"><PlusCircle className="h-4 w-4" />Tambah Jurnal Penyesuaian</Button>}
                />
            </div>
            <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, jurnal: null, loading: false })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Jurnal Penyesuaian</DialogTitle>
                        <DialogDescription>Apakah Anda yakin ingin menghapus jurnal penyesuaian "{deleteDialog.jurnal?.nomor_jurnal}"? Tindakan ini tidak dapat dibatalkan.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialog({ open: false, jurnal: null, loading: false })} disabled={deleteDialog.loading}>Batal</Button>
                        <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteDialog.loading} className="gap-2">{deleteDialog.loading && <Loader2 className="h-4 w-4 animate-spin" />}Hapus</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
