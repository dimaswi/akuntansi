import { type Column, DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Edit3, Loader2, PlusCircle, Shield, Trash } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

interface Role {
    id: number; name: string; display_name: string; description: string;
    created_at: string; updated_at: string; users_count: number;
    permissions: { id: number; name: string; display_name: string; description: string; module: string }[];
}
interface PaginatedRoles { data: Role[]; current_page: number; last_page: number; per_page: number; total: number; from: number; to: number; }
interface Props extends SharedData { roles: PaginatedRoles; filters: { search: string; perPage: number }; }

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Roles', href: '/master/roles' }];

export default function Roles() {
    const { roles, filters } = usePage<Props>().props;
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; role: Role | null; loading: boolean }>({ open: false, role: null, loading: false });

    const navigate = (params: Record<string, any>) => router.get('/master/roles', params, { preserveState: true, replace: true });

    const handleDeleteConfirm = () => {
        if (!deleteDialog.role) return;
        setDeleteDialog((p) => ({ ...p, loading: true }));
        router.delete(route('roles.destroy', deleteDialog.role.id), {
            onSuccess: () => { toast.success(`Role ${deleteDialog.role?.display_name} berhasil dihapus`); setDeleteDialog({ open: false, role: null, loading: false }); },
            onError: () => { toast.error('Gagal menghapus role'); setDeleteDialog((p) => ({ ...p, loading: false })); },
        });
    };

    const columns: Column<Role>[] = [
        { key: 'no', label: 'No.', className: 'w-[50px]', render: (_row, _i, meta) => meta?.rowNumber },
        { key: 'name', label: 'Name', render: (row) => (<div className="flex items-center gap-2"><Shield className="h-4 w-4 text-muted-foreground" /><span className="font-mono text-sm">{row.name}</span></div>) },
        { key: 'display_name', label: 'Display Name', render: (row) => <span className="font-medium">{row.display_name}</span> },
        { key: 'description', label: 'Description', className: 'max-w-xs', render: (row) => <span className="truncate block">{row.description}</span> },
        { key: 'permissions', label: 'Permissions', render: (row) => <Badge variant="secondary">{row.permissions.length} permissions</Badge> },
        { key: 'users', label: 'Users', render: (row) => <Badge variant="outline">{row.users_count} users</Badge> },
        {
            key: 'aksi', label: '', render: (row) => (
                <div className="flex justify-end gap-1">
                    <Button variant="outline" size="sm" onClick={() => router.visit(route('roles.edit', row.id))}><Edit3 className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteDialog({ open: true, role: row, loading: false })} disabled={row.users_count > 0}><Trash className="h-4 w-4" /></Button>
                </div>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Roles" />
            <div className="p-4">
                <DataTable<Role>
                    columns={columns} data={roles.data} pagination={roles} rowKey={(r) => r.id}
                    searchValue={filters.search} searchPlaceholder="Cari nama atau display name..."
                    onSearch={(search) => navigate({ search, perPage: filters.perPage, page: 1 })}
                    onPageChange={(page) => navigate({ search: filters.search, perPage: filters.perPage, page })}
                    onPerPageChange={(perPage) => navigate({ search: filters.search, perPage, page: 1 })}
                    perPageOptions={[10, 20, 50, 100]}
                    emptyIcon={<Shield className="h-8 w-8 text-muted-foreground/50" />}
                    emptyText="Tidak ada data role yang ditemukan"
                    headerActions={<Button size="sm" onClick={() => router.visit('/master/roles/create')} className="gap-2"><PlusCircle className="h-4 w-4" />Tambah Role</Button>}
                />
            </div>
            <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, role: null, loading: false })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Hapus Role</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus role <strong>{deleteDialog.role?.display_name}</strong>? Tindakan ini tidak dapat dibatalkan.
                            {(deleteDialog.role?.users_count || 0) > 0 && (
                                <span className="block mt-2 text-destructive">Role ini tidak dapat dihapus karena masih digunakan oleh {deleteDialog.role?.users_count} user.</span>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialog({ open: false, role: null, loading: false })} disabled={deleteDialog.loading}>Batal</Button>
                        <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteDialog.loading || (deleteDialog.role?.users_count || 0) > 0} className="gap-2">{deleteDialog.loading && <Loader2 className="h-4 w-4 animate-spin" />}Hapus</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
