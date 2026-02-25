import { type Column, type FilterField, DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Edit3, Landmark, Loader2, PlusCircle, Trash } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/lib/toast';

interface Account { id: number; kode_akun: string; nama_akun: string }
interface Category {
    id: number;
    code: string;
    name: string;
    description?: string;
    default_useful_life_years: number;
    default_depreciation_method: string;
    default_salvage_percentage: number;
    is_active: boolean;
    assets_count: number;
    account_asset?: Account;
    account_depreciation?: Account;
    account_expense?: Account;
}

interface PaginatedCategories {
    data: Category[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Props extends SharedData {
    categories: PaginatedCategories;
    filters: { search?: string; is_active?: string; perPage?: number };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: <Landmark className="h-4 w-4" />, href: '/aset' },
    { title: 'Kategori Aset', href: '#' },
];

const methodLabels: Record<string, string> = {
    straight_line: 'Garis Lurus',
    declining_balance: 'Saldo Menurun',
    double_declining: 'Saldo Menurun Ganda',
    sum_of_years_digits: 'Jumlah Angka Tahun',
    service_hours: 'Satuan Jam Kerja',
    productive_output: 'Satuan Hasil Produksi',
};

export default function CategoriesIndex() {
    const { categories, filters } = usePage<Props>().props;
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: Category | null; loading: boolean }>({ open: false, item: null, loading: false });

    const nav = (params: Record<string, string | number>) => {
        router.get('/aset/categories', { ...filters, ...params }, { preserveState: true, replace: true });
    };

    const handleDelete = () => {
        if (!deleteDialog.item) return;
        setDeleteDialog((p) => ({ ...p, loading: true }));
        router.delete(`/aset/categories/${deleteDialog.item.id}`, {
            onSuccess: () => { setDeleteDialog({ open: false, item: null, loading: false }); },
            onError: () => { setDeleteDialog((p) => ({ ...p, loading: false })); toast.error('Gagal menghapus'); },
        });
    };

    const columns: Column<Category>[] = [
        { key: 'code', label: 'Kode', className: 'w-24', render: (r) => <span className="font-mono text-sm">{r.code}</span> },
        { key: 'name', label: 'Nama Kategori', render: (r) => <div><p className="font-medium">{r.name}</p>{r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}</div> },
        { key: 'method', label: 'Metode Penyusutan', render: (r) => methodLabels[r.default_depreciation_method] ?? r.default_depreciation_method },
        { key: 'life', label: 'Masa Manfaat', className: 'w-28', render: (r) => `${r.default_useful_life_years} tahun` },
        { key: 'salvage', label: 'Residu', className: 'w-20', render: (r) => `${r.default_salvage_percentage}%` },
        { key: 'count', label: 'Jumlah Aset', className: 'w-28', render: (r) => <Badge variant="secondary">{r.assets_count}</Badge> },
        { key: 'status', label: 'Status', className: 'w-24', render: (r) => <Badge variant={r.is_active ? 'default' : 'secondary'}>{r.is_active ? 'Aktif' : 'Nonaktif'}</Badge> },
        {
            key: 'actions', label: '', className: 'w-24',
            render: (r) => (
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => router.visit(`/aset/categories/${r.id}/edit`)}><Edit3 className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteDialog({ open: true, item: r, loading: false })} disabled={r.assets_count > 0}><Trash className="h-4 w-4" /></Button>
                </div>
            ),
        },
    ];

    const filterFields: FilterField[] = [
        { name: 'is_active', label: 'Status', type: 'select', options: [{ value: '1', label: 'Aktif' }, { value: '0', label: 'Nonaktif' }], value: filters.is_active ?? '' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kategori Aset" />
            <div className="p-4">
                <DataTable
                    columns={columns}
                    data={categories.data}
                    pagination={categories}
                    searchValue={filters.search ?? ''}
                    searchPlaceholder="Cari kategori..."
                    onSearch={(v) => nav({ search: v, page: 1 })}
                    filters={filterFields}
                    onFilterChange={(name, val) => nav({ [name]: val, page: 1 })}
                    onFilterReset={() => router.get('/aset/categories', {}, { preserveState: true, replace: true })}
                    onPageChange={(p) => nav({ page: p })}
                    onPerPageChange={(pp) => nav({ perPage: pp, page: 1 })}
                    headerActions={<Button onClick={() => router.visit('/aset/categories/create')}><PlusCircle className="mr-2 h-4 w-4" />Tambah Kategori</Button>}
                    rowKey={(r) => r.id}
                    emptyIcon={<Landmark className="h-12 w-12 text-muted-foreground/50" />}
                    emptyText="Belum ada kategori aset"
                    pageTitle="Kategori Aset"
                    pageSubtitle="Kelola kategori aset dan pengaturan penyusutan"
                />
            </div>

            <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, item: null, loading: false })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Kategori</DialogTitle>
                        <DialogDescription>Yakin ingin menghapus kategori <strong>{deleteDialog.item?.name}</strong>?</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialog({ open: false, item: null, loading: false })}>Batal</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleteDialog.loading}>
                            {deleteDialog.loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
