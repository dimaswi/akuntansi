import { type Column, type FilterField, DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Edit3, Eye, Landmark, Loader2, PlusCircle, Trash } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/lib/toast';

interface Category { id: number; name: string }
interface Department { id: number; name: string }
interface Supplier { id: number; name: string }

interface Asset {
    id: number;
    code: string;
    name: string;
    description?: string;
    acquisition_date: string;
    acquisition_cost: number;
    current_book_value: number;
    status: string;
    condition: string;
    brand?: string;
    model?: string;
    location?: string;
    category?: Category;
    department?: Department;
    supplier?: Supplier;
}

interface PaginatedAssets {
    data: Asset[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Props extends SharedData {
    assets: PaginatedAssets;
    filters: Record<string, string>;
    categories: Category[];
    departments: Department[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: <Landmark className="h-4 w-4" />, href: '/aset' },
    { title: 'Daftar Aset', href: '#' },
];

const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    active: { label: 'Aktif', variant: 'default' },
    maintenance: { label: 'Maintenance', variant: 'outline' },
    disposed: { label: 'Dihapusbukukan', variant: 'destructive' },
    inactive: { label: 'Nonaktif', variant: 'secondary' },
};

const conditionMap: Record<string, string> = {
    excellent: 'Sangat Baik',
    good: 'Baik',
    fair: 'Cukup',
    poor: 'Kurang',
    damaged: 'Rusak',
};

export default function AssetsIndex() {
    const { assets, filters, categories, departments } = usePage<Props>().props;
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: Asset | null; loading: boolean }>({ open: false, item: null, loading: false });

    const nav = (params: Record<string, string | number>) => {
        router.get('/aset/assets', { ...filters, ...params }, { preserveState: true, replace: true });
    };

    const handleDelete = () => {
        if (!deleteDialog.item) return;
        setDeleteDialog((p) => ({ ...p, loading: true }));
        router.delete(`/aset/assets/${deleteDialog.item.id}`, {
            onSuccess: () => { setDeleteDialog({ open: false, item: null, loading: false }); },
            onError: () => { setDeleteDialog((p) => ({ ...p, loading: false })); toast.error('Gagal menghapus aset'); },
        });
    };

    const columns: Column<Asset>[] = [
        { key: 'code', label: 'Kode', className: 'w-36', render: (r) => <span className="font-mono text-sm font-medium">{r.code}</span> },
        {
            key: 'name', label: 'Nama Aset',
            render: (r) => (
                <div>
                    <p className="font-medium">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.category?.name} {r.brand && `· ${r.brand}`} {r.model && r.model}</p>
                </div>
            ),
        },
        { key: 'department', label: 'Departemen', className: 'w-32', render: (r) => r.department?.name ?? '-' },
        { key: 'location', label: 'Lokasi', className: 'w-32', render: (r) => r.location ?? '-' },
        { key: 'acquisition_cost', label: 'Nilai Perolehan', className: 'w-36', render: (r) => fmtCurrency(r.acquisition_cost) },
        { key: 'book_value', label: 'Nilai Buku', className: 'w-36', render: (r) => fmtCurrency(r.current_book_value) },
        { key: 'condition', label: 'Kondisi', className: 'w-24', render: (r) => conditionMap[r.condition] ?? r.condition },
        {
            key: 'status', label: 'Status', className: 'w-28',
            render: (r) => {
                const s = statusMap[r.status];
                return <Badge variant={s?.variant ?? 'secondary'}>{s?.label ?? r.status}</Badge>;
            },
        },
        {
            key: 'actions', label: '', className: 'w-28',
            render: (r) => (
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => router.visit(`/aset/assets/${r.id}`)}><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => router.visit(`/aset/assets/${r.id}/edit`)}><Edit3 className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteDialog({ open: true, item: r, loading: false })}><Trash className="h-4 w-4" /></Button>
                </div>
            ),
        },
    ];

    const filterFields: FilterField[] = [
        { name: 'category_id', label: 'Kategori', type: 'select', options: categories.map((c) => ({ value: c.id.toString(), label: c.name })), value: filters.category_id ?? '' },
        { name: 'department_id', label: 'Departemen', type: 'select', options: departments.map((d) => ({ value: d.id.toString(), label: d.name })), value: filters.department_id ?? '' },
        { name: 'status', label: 'Status', type: 'select', options: Object.entries(statusMap).map(([k, v]) => ({ value: k, label: v.label })), value: filters.status ?? '' },
        { name: 'condition', label: 'Kondisi', type: 'select', options: Object.entries(conditionMap).map(([k, v]) => ({ value: k, label: v })), value: filters.condition ?? '' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Daftar Aset" />
            <div className="p-4">
                <DataTable
                    columns={columns}
                    data={assets.data}
                    pagination={assets}
                    searchValue={filters.search ?? ''}
                    searchPlaceholder="Cari aset..."
                    onSearch={(v) => nav({ search: v, page: 1 })}
                    filters={filterFields}
                    onFilterChange={(name, val) => nav({ [name]: val, page: 1 })}
                    onFilterReset={() => router.get('/aset/assets', {}, { preserveState: true, replace: true })}
                    onPageChange={(p) => nav({ page: p })}
                    onPerPageChange={(pp) => nav({ perPage: pp, page: 1 })}
                    headerActions={<Button onClick={() => router.visit('/aset/assets/create')}><PlusCircle className="mr-2 h-4 w-4" />Tambah Aset</Button>}
                    rowKey={(r) => r.id}
                    emptyIcon={<Landmark className="h-12 w-12 text-muted-foreground/50" />}
                    emptyText="Belum ada data aset"
                    pageTitle="Daftar Aset"
                    pageSubtitle="Kelola data aset tetap perusahaan"
                />
            </div>

            <Dialog open={deleteDialog.open} onOpenChange={(o) => !o && setDeleteDialog({ open: false, item: null, loading: false })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Aset</DialogTitle>
                        <DialogDescription>Yakin ingin menghapus aset <strong>{deleteDialog.item?.code} - {deleteDialog.item?.name}</strong>?</DialogDescription>
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
