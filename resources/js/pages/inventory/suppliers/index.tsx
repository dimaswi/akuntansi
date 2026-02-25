import { type Column, type FilterField, DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Edit3, Eye, Loader2, Mail, MapPin, Package, Phone, PlusCircle, Power, PowerOff, Trash, Truck } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/lib/toast';
import { route } from 'ziggy-js';

interface Supplier {
    id: number; name: string; address?: string; phone?: string; email?: string;
    is_active: boolean; items_count?: number; created_at: string; updated_at: string;
}

interface PaginatedSuppliers { data: Supplier[]; current_page: number; last_page: number; per_page: number; total: number; from: number; to: number; }
interface Props extends SharedData { suppliers: PaginatedSuppliers; filters: { search: string; is_active?: string; perPage: number }; isLogistics: boolean; }

const breadcrumbs: BreadcrumbItem[] = [
    { title: <Package className="h-4 w-4" />, href: '#' },
    { title: 'Data Supplier', href: '/suppliers' },
];

export default function SuppliersIndex() {
    const { suppliers, filters, isLogistics } = usePage<Props>().props;
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; supplier: Supplier | null; loading: boolean }>({ open: false, supplier: null, loading: false });

    const navigate = (params: Record<string, any>) => router.get('/suppliers', params, { preserveState: true, replace: true });

    const handleDelete = () => {
        if (!deleteDialog.supplier) return;
        setDeleteDialog((p) => ({ ...p, loading: true }));
        router.delete(route('suppliers.destroy', deleteDialog.supplier.id), {
            onSuccess: () => setDeleteDialog({ open: false, supplier: null, loading: false }),
            onError: (errors) => { toast.error(errors?.message || 'Gagal menghapus supplier'); setDeleteDialog((p) => ({ ...p, loading: false })); },
        });
    };

    const handleToggleStatus = (supplier: Supplier) => {
        const action = supplier.is_active ? 'menonaktifkan' : 'mengaktifkan';
        router.post(route('suppliers.toggle-status', supplier.id), {}, {
            onError: (errors) => toast.error(errors?.message || `Gagal ${action} supplier`),
        });
    };

    const columns: Column<Supplier>[] = [
        { key: 'no', label: 'No', className: 'w-[60px]', render: (_r, _i, meta) => meta.rowNumber },
        { key: 'name', label: 'Nama Supplier', render: (r) => <span className="font-medium">{r.name}</span> },
        { key: 'kontak', label: 'Kontak', render: (r) => (
            <div className="space-y-1">
                {r.phone && <div className="flex items-center gap-1 text-sm"><Phone className="h-3 w-3 text-muted-foreground" />{r.phone}</div>}
                {r.email && <div className="flex items-center gap-1 text-sm"><Mail className="h-3 w-3 text-muted-foreground" />{r.email}</div>}
                {!r.phone && !r.email && <span className="text-sm text-muted-foreground">-</span>}
            </div>
        ) },
        { key: 'alamat', label: 'Alamat', render: (r) => r.address ? (
            <div className="flex items-start gap-1 text-sm max-w-xs"><MapPin className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" /><span className="line-clamp-2">{r.address}</span></div>
        ) : <span className="text-sm text-muted-foreground">-</span> },
        { key: 'items', label: 'Jumlah Item', render: (r) => <Badge variant="outline">{r.items_count || 0}</Badge> },
        { key: 'status', label: 'Status', render: (r) => <Badge variant={r.is_active ? 'default' : 'secondary'}>{r.is_active ? 'Aktif' : 'Nonaktif'}</Badge> },
        { key: 'aksi', label: 'Aksi', className: 'w-[150px] text-center', render: (r) => (
            <div className="flex items-center justify-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => router.visit(route('suppliers.show', r.id))} className="h-8 w-8 p-0" title="Detail"><Eye className="h-4 w-4" /></Button>
                {isLogistics && (<>
                    <Button variant="ghost" size="sm" onClick={() => router.visit(route('suppliers.edit', r.id))} className="h-8 w-8 p-0" title="Edit"><Edit3 className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(r)} className={`h-8 w-8 p-0 ${r.is_active ? 'text-orange-600 hover:text-orange-800' : 'text-green-600 hover:text-green-800'}`} title={r.is_active ? 'Nonaktifkan' : 'Aktifkan'}>{r.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}</Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteDialog({ open: true, supplier: r, loading: false })} className="h-8 w-8 p-0 text-red-600 hover:text-red-800" title="Hapus"><Trash className="h-4 w-4" /></Button>
                </>)}
            </div>
        ) },
    ];

    const filterFields: FilterField[] = [
        { name: 'is_active', label: 'Status', type: 'select', value: filters.is_active || '', options: [{ value: '1', label: 'Aktif' }, { value: '0', label: 'Nonaktif' }] },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Data Supplier" />
            <div className="p-4">
                <DataTable<Supplier>
                    pageTitle="Data Supplier"
                    pageSubtitle="Kelola data supplier Anda di sini"
                    columns={columns} data={suppliers.data} pagination={suppliers} rowKey={(r) => r.id}
                    searchValue={filters.search} searchPlaceholder="Cari nama supplier..."
                    onSearch={(search) => navigate({ search, perPage: filters.perPage, is_active: filters.is_active || '', page: 1 })}
                    filters={filterFields}
                    onFilterChange={(name, value) => navigate({ search: filters.search, perPage: filters.perPage, [name]: value, page: 1 })}
                    onFilterReset={() => navigate({ search: '', perPage: filters.perPage, is_active: '', page: 1 })}
                    onPageChange={(page) => navigate({ search: filters.search, perPage: filters.perPage, is_active: filters.is_active || '', page })}
                    onPerPageChange={(perPage) => navigate({ search: filters.search, perPage, is_active: filters.is_active || '', page: 1 })}
                    perPageOptions={[10, 20, 50, 100]}
                    emptyIcon={<Truck className="h-8 w-8 text-muted-foreground/50" />}
                    emptyText="Tidak ada data supplier"
                    headerActions={isLogistics ? <Button size="sm" onClick={() => router.visit(route('suppliers.create'))} className="gap-2"><PlusCircle className="h-4 w-4" />Tambah Supplier</Button> : undefined}
                />
            </div>

            <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, supplier: null, loading: false })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Supplier</DialogTitle>
                        <DialogDescription>Apakah Anda yakin ingin menghapus supplier "{deleteDialog.supplier?.name}"? Tindakan ini tidak dapat dibatalkan.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialog({ open: false, supplier: null, loading: false })} disabled={deleteDialog.loading}>Batal</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleteDialog.loading}>{deleteDialog.loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Hapus</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
