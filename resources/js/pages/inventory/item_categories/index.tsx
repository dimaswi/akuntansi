import { type Column, type FilterField, DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePermission } from '@/hooks/use-permission';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Edit3, Eye, Loader2, Package, PlusCircle, Trash } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/lib/toast';
import { route } from 'ziggy-js';

interface ItemCategory {
    id: number; code: string; name: string; category_type: 'pharmacy' | 'general' | 'medical';
    parent_id: number | null; is_active: boolean; requires_batch_tracking: boolean;
    requires_expiry_tracking: boolean; parent?: ItemCategory; created_at: string; updated_at: string;
}

interface PaginatedItemCategory { data: ItemCategory[]; current_page: number; last_page: number; per_page: number; total: number; from: number; to: number; }
interface Props extends SharedData { categories: PaginatedItemCategory; filters: { search: string; perPage: number; category_type: string; is_active: string }; }

const breadcrumbs: BreadcrumbItem[] = [
    { title: <Package className="h-4 w-4" />, href: '#' },
    { title: 'Item Categories', href: '#' },
];

const typeLabels: Record<string, string> = { pharmacy: 'Farmasi', general: 'Umum', medical: 'Alat Kesehatan' };

export default function ItemCategoryIndex() {
    const { categories, filters } = usePage<Props>().props;
    const { hasPermission } = usePermission();
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; category: ItemCategory | null; loading: boolean }>({ open: false, category: null, loading: false });

    const navigate = (params: Record<string, any>) => router.get('/item-categories', params, { preserveState: true, replace: true });
    const fp = { search: filters.search || '', perPage: filters.perPage, category_type: filters.category_type || '', is_active: filters.is_active || '' };

    const handleDelete = () => {
        if (!deleteDialog.category) return;
        setDeleteDialog((p) => ({ ...p, loading: true }));
        router.delete(route('item_categories.destroy', deleteDialog.category.id), {
            onSuccess: () => setDeleteDialog({ open: false, category: null, loading: false }),
            onError: (errors) => { const msg = errors?.message || errors?.error || Object.values(errors)[0] || 'Gagal menghapus kategori'; toast.error(msg); setDeleteDialog({ open: false, category: null, loading: false }); },
        });
    };

    const columns: Column<ItemCategory>[] = [
        { key: 'no', label: 'No', className: 'w-[60px]', render: (_r, _i, meta) => meta.rowNumber },
        { key: 'code', label: 'Kode', render: (r) => <span className="font-medium">{r.code}</span> },
        { key: 'name', label: 'Nama', render: (r) => r.name },
        { key: 'type', label: 'Tipe', render: (r) => <Badge variant="secondary">{typeLabels[r.category_type] || r.category_type}</Badge> },
        { key: 'parent', label: 'Parent', render: (r) => r.parent?.name || '-' },
        { key: 'status', label: 'Status', render: (r) => <Badge variant={r.is_active ? 'default' : 'secondary'}>{r.is_active ? 'Aktif' : 'Nonaktif'}</Badge> },
        { key: 'batch', label: 'Batch', render: (r) => r.requires_batch_tracking ? <Badge variant="outline">Ya</Badge> : '-' },
        { key: 'expiry', label: 'Expiry', render: (r) => r.requires_expiry_tracking ? <Badge variant="outline">Ya</Badge> : '-' },
        { key: 'aksi', label: 'Aksi', className: 'w-[100px] text-center', render: (r) => (
            <div className="flex items-center justify-center gap-1">
                {hasPermission('inventory.categories.view') && <Button variant="ghost" size="sm" onClick={() => router.visit(route('item_categories.show', r.id))} className="h-8 w-8 p-0" title="Lihat Detail"><Eye className="h-4 w-4" /></Button>}
                {hasPermission('inventory.categories.edit') && <Button variant="ghost" size="sm" onClick={() => router.visit(route('item_categories.edit', r.id))} className="h-8 w-8 p-0" title="Edit"><Edit3 className="h-4 w-4" /></Button>}
                {hasPermission('inventory.categories.delete') && <Button variant="ghost" size="sm" onClick={() => setDeleteDialog({ open: true, category: r, loading: false })} className="h-8 w-8 p-0 text-red-600 hover:text-red-800" title="Hapus"><Trash className="h-4 w-4" /></Button>}
            </div>
        ) },
    ];

    const filterFields: FilterField[] = [
        { name: 'category_type', label: 'Tipe', type: 'select', value: filters.category_type || '', options: [{ value: 'pharmacy', label: 'Farmasi' }, { value: 'general', label: 'Umum' }, { value: 'medical', label: 'Alat Kesehatan' }] },
        { name: 'is_active', label: 'Status', type: 'select', value: filters.is_active || '', options: [{ value: '1', label: 'Aktif' }, { value: '0', label: 'Tidak Aktif' }] },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kategori Barang" />
            <div className="p-4">
                <DataTable<ItemCategory>
                    pageTitle="Kategori Barang"
                    pageSubtitle="Kelola kategori barang Anda di sini"
                    columns={columns} data={categories.data} pagination={categories} rowKey={(r) => r.id}
                    searchValue={filters.search} searchPlaceholder="Cari kode atau nama kategori..."
                    onSearch={(search) => navigate({ ...fp, search, page: 1 })}
                    filters={filterFields}
                    onFilterChange={(name, value) => navigate({ ...fp, [name]: value, page: 1 })}
                    onFilterReset={() => navigate({ search: '', perPage: filters.perPage, category_type: '', is_active: '', page: 1 })}
                    onPageChange={(page) => navigate({ ...fp, page })}
                    onPerPageChange={(perPage) => navigate({ ...fp, perPage, page: 1 })}
                    perPageOptions={[10, 20, 50, 100]}
                    emptyIcon={<Package className="h-8 w-8 text-muted-foreground/50" />}
                    emptyText="Tidak ada kategori ditemukan"
                    headerActions={hasPermission('inventory.categories.create') ? <Button size="sm" onClick={() => router.visit('/item-categories/create')} className="gap-2"><PlusCircle className="h-4 w-4" />Tambah Kategori</Button> : undefined}
                />
            </div>

            <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, category: null, loading: false })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Kategori</DialogTitle>
                        <DialogDescription>Apakah Anda yakin ingin menghapus kategori "{deleteDialog.category?.name}"? Tindakan ini tidak dapat dibatalkan.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialog({ open: false, category: null, loading: false })} disabled={deleteDialog.loading}>Batal</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleteDialog.loading}>{deleteDialog.loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Hapus</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
