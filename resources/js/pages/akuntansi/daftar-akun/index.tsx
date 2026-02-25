import { type Column, type FilterField, DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Calculator, Edit3, Loader2, PlusCircle, Trash } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface DaftarAkun {
    id: number;
    kode_akun: string;
    nama_akun: string;
    jenis_akun: 'aset' | 'kewajiban' | 'modal' | 'pendapatan' | 'beban';
    sub_jenis: string;
    saldo_normal: 'debit' | 'kredit';
    level: number;
    is_aktif: boolean;
    keterangan?: string;
    induk_akun?: DaftarAkun;
    created_at: string;
    updated_at: string;
}

interface PaginatedDaftarAkun {
    data: DaftarAkun[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Props extends SharedData {
    daftarAkun: PaginatedDaftarAkun;
    filters: { search: string; perPage: number; jenis_akun?: string; status?: string };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: (<Calculator className="h-4 w-4" />) as any, href: '/akuntansi' },
    { title: 'Daftar Akun', href: '/akuntansi/daftar-akun' },
];

const jenisAkunLabels: Record<string, string> = {
    aset: 'Aset', kewajiban: 'Kewajiban', modal: 'Modal', pendapatan: 'Pendapatan', beban: 'Beban',
};

export default function DaftarAkunIndex() {
    const { daftarAkun, filters } = usePage<Props>().props;
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; akun: DaftarAkun | null; loading: boolean }>({ open: false, akun: null, loading: false });

    const navigate = (params: Record<string, any>) =>
        router.get('/akuntansi/daftar-akun', params, { preserveState: true, replace: true });

    const handleDelete = () => {
        if (!deleteDialog.akun) return;
        setDeleteDialog((p) => ({ ...p, loading: true }));
        router.delete(`/akuntansi/daftar-akun/${deleteDialog.akun.id}`, {
            onSuccess: () => { toast.success('Akun berhasil dihapus'); setDeleteDialog({ open: false, akun: null, loading: false }); },
            onError: () => { toast.error('Gagal menghapus akun'); setDeleteDialog((p) => ({ ...p, loading: false })); },
        });
    };

    const columns: Column<DaftarAkun>[] = [
        { key: 'no', label: 'No', className: 'w-[50px]', render: (_r, _i, meta) => meta.rowNumber },
        { key: 'kode_akun', label: 'Kode', render: (row) => <span className="font-medium">{row.kode_akun}</span> },
        {
            key: 'nama_akun', label: 'Nama', render: (row) => (
                <div className="flex items-center" style={{ marginLeft: row.level > 1 ? `${(row.level - 1) * 16}px` : '0px' }}>
                    {row.level > 1 && <span className="mr-2 text-muted-foreground">└</span>}
                    {row.nama_akun}
                </div>
            ),
        },
        { key: 'jenis_akun', label: 'Jenis', render: (row) => <Badge variant="secondary">{jenisAkunLabels[row.jenis_akun]}</Badge> },
        { key: 'parent', label: 'Parent', render: (row) => row.induk_akun?.nama_akun || '-' },
        { key: 'status', label: 'Status', render: (row) => <Badge variant={row.is_aktif ? 'default' : 'secondary'}>{row.is_aktif ? 'Aktif' : 'Nonaktif'}</Badge> },
        { key: 'saldo_normal', label: 'Saldo Normal', render: (row) => <Badge variant="outline">{row.saldo_normal === 'debit' ? 'Debit' : 'Kredit'}</Badge> },
        { key: 'level', label: 'Level', render: (row) => <Badge variant="outline">Level {row.level}</Badge> },
        {
            key: 'aksi', label: '', className: 'w-[100px]', render: (row) => (
                <div className="flex justify-center gap-1">
                    <Button variant="outline" size="sm" onClick={() => router.visit(`/akuntansi/daftar-akun/${row.id}/edit`)} title="Edit"><Edit3 className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteDialog({ open: true, akun: row, loading: false })} title="Hapus"><Trash className="h-4 w-4" /></Button>
                </div>
            ),
        },
    ];

    const filterFields: FilterField[] = [
        {
            name: 'jenis_akun', label: 'Jenis Akun', type: 'select', placeholder: 'Semua Jenis',
            value: filters.jenis_akun || '',
            options: [
                { value: '__all__', label: 'Semua Jenis' },
                { value: 'aset', label: 'Aset' }, { value: 'kewajiban', label: 'Kewajiban' },
                { value: 'modal', label: 'Modal' }, { value: 'pendapatan', label: 'Pendapatan' }, { value: 'beban', label: 'Beban' },
            ],
        },
        {
            name: 'status', label: 'Status', type: 'select', placeholder: 'Semua Status',
            value: filters.status || '',
            options: [
                { value: '__all__', label: 'Semua Status' },
                { value: '1', label: 'Aktif' }, { value: '0', label: 'Nonaktif' },
            ],
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Daftar Akun" />
            <div className="p-4">
                <DataTable<DaftarAkun>
                    pageTitle="Daftar Akun"
                    pageSubtitle="Kelola daftar akun Anda di sini"
                    columns={columns} data={daftarAkun.data} pagination={daftarAkun} rowKey={(r) => r.id}
                    searchValue={filters.search} searchPlaceholder="Cari kode atau nama akun..."
                    onSearch={(search) => navigate({ search, perPage: filters.perPage, jenis_akun: filters.jenis_akun || '', status: filters.status || '', page: 1 })}
                    filters={filterFields}
                    onFilterChange={(name, value) => navigate({ search: filters.search || '', perPage: filters.perPage, jenis_akun: name === 'jenis_akun' ? value : filters.jenis_akun || '', status: name === 'status' ? value : filters.status || '', page: 1 })}
                    onFilterReset={() => navigate({ search: '', perPage: filters.perPage, jenis_akun: '', status: '', page: 1 })}
                    onPageChange={(page) => navigate({ search: filters.search || '', perPage: filters.perPage, jenis_akun: filters.jenis_akun || '', status: filters.status || '', page })}
                    onPerPageChange={(perPage) => navigate({ search: filters.search || '', perPage, jenis_akun: filters.jenis_akun || '', status: filters.status || '', page: 1 })}
                    perPageOptions={[10, 20, 50, 100]}
                    emptyIcon={<Calculator className="h-8 w-8 text-muted-foreground/50" />}
                    emptyText="Tidak ada akun ditemukan"
                    headerActions={<Button size="sm" onClick={() => router.visit('/akuntansi/daftar-akun/create')} className="gap-2"><PlusCircle className="h-4 w-4" />Tambah Akun</Button>}
                />
            </div>
            <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, akun: null, loading: false })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Akun</DialogTitle>
                        <DialogDescription>Apakah Anda yakin ingin menghapus akun "{deleteDialog.akun?.nama_akun}"? Tindakan ini tidak dapat dibatalkan.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialog({ open: false, akun: null, loading: false })} disabled={deleteDialog.loading}>Batal</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleteDialog.loading} className="gap-2">{deleteDialog.loading && <Loader2 className="h-4 w-4 animate-spin" />}Hapus</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
