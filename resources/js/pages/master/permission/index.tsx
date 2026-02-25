import { type Column, DataTable, type FilterField } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData, Permission, PaginatedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Edit3, Key, Loader2, Plus, PlusCircle, Trash } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

interface Props {
    permissions: PaginatedData<Permission>;
    modules: string[];
    filters: { search: string; module: string; perPage: number };
}

export default function PermissionIndex({ permissions, modules, filters }: Props) {
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; permission: Permission | null; loading: boolean }>({ open: false, permission: null, loading: false });
    const [moduleModalOpen, setModuleModalOpen] = useState(false);
    const [newModuleName, setNewModuleName] = useState('');

    const breadcrumbs: BreadcrumbItem[] = [{ title: 'Permissions', href: '/master/permissions' }];

    const navigate = (params: Record<string, any>) => router.get(route('permissions.index'), params, { preserveState: true, replace: true });
    const currentFilters = () => ({ search: filters.search, module: filters.module, perPage: filters.perPage });

    const handleDeleteConfirm = () => {
        if (!deleteDialog.permission) return;
        setDeleteDialog((p) => ({ ...p, loading: true }));
        router.delete(route('permissions.destroy', deleteDialog.permission.id), {
            onSuccess: () => { toast.success('Permission berhasil dihapus'); setDeleteDialog({ open: false, permission: null, loading: false }); },
            onError: (errors) => { toast.error(Object.values(errors).flat().join(', ')); setDeleteDialog((p) => ({ ...p, loading: false })); },
        });
    };

    const columns: Column<Permission>[] = [
        { key: 'no', label: 'No.', className: 'w-[50px]', render: (_row, _i, meta) => meta?.rowNumber },
        { key: 'name', label: 'Name', render: (row) => (<div className="flex items-center gap-2"><Key className="h-4 w-4 text-muted-foreground" /><span className="font-mono text-sm">{row.name}</span></div>) },
        { key: 'display_name', label: 'Display Name', render: (row) => <span className="font-medium">{row.display_name}</span> },
        { key: 'module', label: 'Module', render: (row) => <Badge variant="secondary">{row.module || 'No Module'}</Badge> },
        { key: 'description', label: 'Description', className: 'max-w-xs', render: (row) => <span className="truncate block">{row.description || '-'}</span> },
        {
            key: 'roles', label: 'Roles', render: (row) => (
                <div className="flex flex-wrap gap-1">
                    {row.roles && row.roles.length > 0 ? row.roles.map((r: any) => <Badge key={r.id} variant="outline" className="text-xs">{r.display_name}</Badge>) : <span className="text-muted-foreground text-sm italic">Tidak ada role</span>}
                </div>
            ),
        },
        {
            key: 'aksi', label: '', render: (row) => (
                <div className="flex justify-end gap-1">
                    <Button variant="outline" size="sm" onClick={() => router.visit(route('permissions.edit', row.id))}><Edit3 className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteDialog({ open: true, permission: row, loading: false })}><Trash className="h-4 w-4" /></Button>
                </div>
            ),
        },
    ];

    const filterFields: FilterField[] = [
        {
            name: 'module', label: 'Module', type: 'select', placeholder: 'Semua Module',
            options: [{ value: '', label: 'Semua Module' }, ...modules.map((m) => ({ value: m, label: m }))],
            value: filters.module || '',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Permissions" />
            <div className="p-4">
                <DataTable<Permission>
                    columns={columns} data={permissions.data} pagination={permissions} rowKey={(r) => r.id}
                    searchValue={filters.search} searchPlaceholder="Cari nama atau display name..."
                    onSearch={(search) => navigate({ ...currentFilters(), search, page: 1 })}
                    filters={filterFields}
                    onFilterChange={(name, value) => navigate({ ...currentFilters(), [name]: value, page: 1 })}
                    onFilterReset={() => navigate({ search: '', perPage: filters.perPage })}
                    onPageChange={(page) => navigate({ ...currentFilters(), page })}
                    onPerPageChange={(perPage) => navigate({ ...currentFilters(), perPage, page: 1 })}
                    perPageOptions={[10, 20, 50, 100]}
                    emptyIcon={<Key className="h-8 w-8 text-muted-foreground/50" />}
                    emptyText="Tidak ada data permission yang ditemukan"
                    headerActions={<>
                        <Button variant="outline" size="sm" onClick={() => setModuleModalOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Tambah Module</Button>
                        <Button size="sm" onClick={() => router.visit(route('permissions.create'))} className="gap-2"><PlusCircle className="h-4 w-4" />Tambah Permission</Button>
                    </>}
                />
            </div>

            {/* Delete Dialog */}
            <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, permission: null, loading: false })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Hapus Permission</DialogTitle>
                        <DialogDescription>Apakah Anda yakin ingin menghapus permission <strong>{deleteDialog.permission?.display_name}</strong>? Tindakan ini tidak dapat dibatalkan.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialog({ open: false, permission: null, loading: false })} disabled={deleteDialog.loading}>Batal</Button>
                        <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteDialog.loading} className="gap-2">{deleteDialog.loading && <Loader2 className="h-4 w-4 animate-spin" />}Hapus</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Module Modal */}
            <Dialog open={moduleModalOpen} onOpenChange={setModuleModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Tambah Module Baru</DialogTitle>
                        <DialogDescription>Buat module baru untuk mengelompokkan permission.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="moduleName">Nama Module</Label>
                        <Input id="moduleName" placeholder="Contoh: users, products, orders" value={newModuleName} onChange={(e) => setNewModuleName(e.target.value)} className="mt-2" onKeyDown={(e) => { if (e.key === 'Enter') router.visit(route('permissions.create', { module: newModuleName })); }} />
                        <p className="text-xs text-muted-foreground mt-2">Anda akan diarahkan ke halaman create permission dengan module ini.</p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setModuleModalOpen(false); setNewModuleName(''); }}>Batal</Button>
                        <Button onClick={() => router.visit(route('permissions.create', { module: newModuleName }))} disabled={!newModuleName.trim()} className="gap-2"><Plus className="h-4 w-4" />Buat Module</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
