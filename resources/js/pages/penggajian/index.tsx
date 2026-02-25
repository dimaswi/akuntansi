import { type Column, type FilterField, DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePermission } from '@/hooks/use-permission';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Banknote, Edit3, Eye, FileSpreadsheet, PlusCircle, Send, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface SalaryBatch {
    id: number;
    batch_number: string;
    period_month: number;
    period_year: number;
    period_display: string;
    description?: string;
    total_employees: number;
    total_pendapatan: number;
    total_potongan: number;
    total_gaji_bersih: number;
    status: 'draft' | 'posted';
    journal_id?: number;
    journal?: { id: number; journal_number: string };
    creator?: { id: number; name: string };
    posted_by?: number;
    posted_at?: string;
    created_at: string;
    can_edit: boolean;
    can_post: boolean;
}

interface Props extends SharedData {
    batches: SalaryBatch[];
    filters: { search: string; status: string; period_year: string; period_month: string };
    summary: { total_draft: number; total_posted: number; total_employees_all: number; total_gaji_bersih_posted: number };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: <Banknote className="h-4 w-4" />, href: '/penggajian' },
    { title: 'Penggajian', href: '/penggajian' },
];

const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const months = [
    { value: '1', label: 'Januari' }, { value: '2', label: 'Februari' }, { value: '3', label: 'Maret' },
    { value: '4', label: 'April' }, { value: '5', label: 'Mei' }, { value: '6', label: 'Juni' },
    { value: '7', label: 'Juli' }, { value: '8', label: 'Agustus' }, { value: '9', label: 'September' },
    { value: '10', label: 'Oktober' }, { value: '11', label: 'November' }, { value: '12', label: 'Desember' },
];

export default function Index({ batches, filters }: Props) {
    const { hasPermission } = usePermission();
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; batch: SalaryBatch | null }>({ open: false, batch: null });
    const [deleting, setDeleting] = useState(false);

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());

    const navigate = (p: Record<string, any>) =>
        router.get(route('penggajian.index'), p, { preserveState: true, preserveScroll: true });

    const fp = {
        search: filters.search || '',
        status: filters.status || '',
        period_year: filters.period_year || '',
        period_month: filters.period_month || '',
    };

    const pagination = {
        current_page: 1,
        last_page: 1,
        per_page: batches.length || 10,
        total: batches.length,
        from: batches.length > 0 ? 1 : 0,
        to: batches.length,
    };

    const handleDelete = () => {
        if (!deleteDialog.batch) return;
        setDeleting(true);
        router.delete(route('penggajian.destroy', deleteDialog.batch.id), {
            onSuccess: () => { toast.success('Batch gaji berhasil dihapus'); setDeleteDialog({ open: false, batch: null }); },
            onError: (errors) => { toast.error(errors[0] || 'Gagal menghapus batch gaji'); },
            onFinish: () => setDeleting(false),
        });
    };

    const columns: Column<SalaryBatch>[] = [
        { key: 'batch_number', label: 'Batch Number', className: 'font-mono text-sm', render: (row) => row.batch_number },
        { key: 'periode', label: 'Periode', className: 'font-medium', render: (row) => row.period_display },
        { key: 'keterangan', label: 'Keterangan', render: (row) => <div className="max-w-xs truncate text-sm text-gray-600">{row.description || '-'}</div> },
        { key: 'karyawan', label: 'Karyawan', className: 'text-center', render: (row) => row.total_employees },
        { key: 'total_gaji_bersih', label: 'Total Gaji Bersih', className: 'text-right font-medium', render: (row) => fmtCurrency(row.total_gaji_bersih) },
        {
            key: 'status', label: 'Status',
            className: 'text-center',
            render: (row) => (
                <div>
                    <Badge variant="outline" className={row.status === 'posted' ? 'border-green-300 bg-green-50 text-green-600' : 'border-gray-300 text-gray-600'}>
                        {row.status === 'posted' ? 'Posted' : 'Draft'}
                    </Badge>
                    {row.journal && <div className="mt-1 text-xs text-gray-500">{row.journal.journal_number}</div>}
                </div>
            ),
        },
        {
            key: 'actions', label: 'Actions',
            className: 'text-center',
            render: (row) => (
                <div className="flex items-center justify-center gap-1">
                    {row.can_edit && hasPermission('penggajian.input-gaji') && (
                        <Link href={route('penggajian.input-gaji', row.id)}>
                            <Button variant="ghost" size="sm" title="Isi Gaji"><FileSpreadsheet className="h-4 w-4" /></Button>
                        </Link>
                    )}
                    {row.can_post && hasPermission('penggajian.post-to-journal') && (
                        <Button variant="ghost" size="sm" onClick={() => router.get(route('penggajian.showPostToJournal'), { batch_ids: [row.id] })} title="Post ke Jurnal">
                            <Send className="h-4 w-4" />
                        </Button>
                    )}
                    {row.can_edit && hasPermission('penggajian.edit') && (
                        <Link href={route('penggajian.edit', row.id)}>
                            <Button variant="ghost" size="sm" title="Edit"><Edit3 className="h-4 w-4" /></Button>
                        </Link>
                    )}
                    {row.can_edit && hasPermission('penggajian.delete') && (
                        <Button variant="ghost" size="sm" onClick={() => setDeleteDialog({ open: true, batch: row })} title="Hapus">
                            <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                    )}
                    {!row.can_edit && (
                        <Link href={route('penggajian.input-gaji', row.id)}>
                            <Button variant="ghost" size="sm" title="Lihat Detail"><Eye className="h-4 w-4" /></Button>
                        </Link>
                    )}
                </div>
            ),
        },
    ];

    const filterFields: FilterField[] = [
        { name: 'status', label: 'Status', type: 'select', value: fp.status, options: [{ value: 'draft', label: 'Draft' }, { value: 'posted', label: 'Posted' }] },
        { name: 'period_year', label: 'Tahun', type: 'select', value: fp.period_year, options: years.map((y) => ({ value: y, label: y })) },
        { name: 'period_month', label: 'Bulan', type: 'select', value: fp.period_month, options: months },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Penggajian" />
            <div className="p-4">
                <DataTable<SalaryBatch>
                    columns={columns}
                    data={batches}
                    pagination={pagination}
                    searchValue={fp.search}
                    searchPlaceholder="Cari batch number..."
                    onSearch={(v) => navigate({ ...fp, search: v, page: 1 })}
                    filters={filterFields}
                    onFilterChange={(k, v) => navigate({ ...fp, [k]: v, page: 1 })}
                    onFilterReset={() => navigate({ search: '', status: '', period_year: '', period_month: '', page: 1 })}
                    onPageChange={(p) => navigate({ ...fp, page: p })}
                    onPerPageChange={(n) => navigate({ ...fp, perPage: n, page: 1 })}
                    headerActions={
                        hasPermission('penggajian.create') ? (
                            <Button onClick={() => router.visit(route('penggajian.create'))} className="gap-2">
                                <PlusCircle className="h-4 w-4" />
                                Buat Batch Baru
                            </Button>
                        ) : undefined
                    }
                    emptyIcon={<Banknote className="h-8 w-8 text-muted-foreground/50" />}
                    emptyText="Belum ada data batch gaji"
                    rowKey={(b) => b.id}
                />
            </div>

            {/* Delete Dialog */}
            <Dialog open={deleteDialog.open} onOpenChange={(open) => !deleting && setDeleteDialog({ ...deleteDialog, open })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Hapus</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus batch <strong>{deleteDialog.batch?.batch_number}</strong>?
                            <br />Data gaji karyawan di batch ini juga akan terhapus.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialog({ open: false, batch: null })} disabled={deleting}>Batal</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>{deleting ? 'Menghapus...' : 'Hapus'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
