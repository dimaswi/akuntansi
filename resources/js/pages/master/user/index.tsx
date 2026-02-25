import { type Column, DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Edit3, Loader2, PlusCircle, Trash, Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

interface User {
    id: number; name: string; nip: string; role_id: number | null; department_id: number | null;
    role?: { id: number; name: string; display_name: string; description: string };
    department?: { id: number; name: string; description?: string };
    created_at: string; updated_at: string;
}
interface PaginatedUsers { data: User[]; current_page: number; last_page: number; per_page: number; total: number; from: number; to: number; }
interface Props extends SharedData { users: PaginatedUsers; filters: { search: string; perPage: number }; }

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Users', href: '/master/users' }];

export default function UsersIndex() {
    const { users, filters } = usePage<Props>().props;
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; user: User | null; loading: boolean }>({ open: false, user: null, loading: false });

    const navigate = (params: Record<string, any>) => router.get('/master/users', params, { preserveState: true, replace: true });

    const handleDeleteConfirm = () => {
        if (!deleteDialog.user) return;
        setDeleteDialog((p) => ({ ...p, loading: true }));
        router.delete(route('users.destroy', deleteDialog.user.id), {
            onSuccess: () => { toast.success(`User ${deleteDialog.user?.name} berhasil dihapus`); setDeleteDialog({ open: false, user: null, loading: false }); },
            onError: () => { toast.error('Gagal menghapus user'); setDeleteDialog((p) => ({ ...p, loading: false })); },
        });
    };

    const columns: Column<User>[] = [
        { key: 'no', label: 'No.', className: 'w-[50px]', render: (_row, _i, meta) => meta?.rowNumber },
        { key: 'name', label: 'Name', render: (row) => row.name },
        { key: 'nip', label: 'NIP', render: (row) => row.nip },
        { key: 'role', label: 'Role', render: (row) => row.role ? <Badge variant="secondary">{row.role.display_name}</Badge> : <Badge variant="outline">No Role</Badge> },
        {
            key: 'aksi', label: '', render: (row) => (
                <div className="flex justify-end gap-1">
                    <Button variant="outline" size="sm" onClick={() => router.visit(route('users.edit', row.id))}><Edit3 className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteDialog({ open: true, user: row, loading: false })}><Trash className="h-4 w-4" /></Button>
                </div>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users" />
            <div className="p-4">
                <DataTable<User>
                    columns={columns} data={users.data} pagination={users} rowKey={(r) => r.id}
                    searchValue={filters.search} searchPlaceholder="Cari nama atau NIP..."
                    onSearch={(search) => navigate({ search, perPage: filters.perPage, page: 1 })}
                    onPageChange={(page) => navigate({ search: filters.search, perPage: filters.perPage, page })}
                    onPerPageChange={(perPage) => navigate({ search: filters.search, perPage, page: 1 })}
                    perPageOptions={[10, 20, 50, 100]}
                    emptyIcon={<Users className="h-8 w-8 text-muted-foreground/50" />}
                    emptyText="Tidak ada data user yang ditemukan"
                    headerActions={<Button size="sm" onClick={() => router.visit('/master/users/create')} className="gap-2"><PlusCircle className="h-4 w-4" />Tambah</Button>}
                />
            </div>
            <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, user: null, loading: false })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Hapus User</DialogTitle>
                        <DialogDescription>Apakah Anda yakin ingin menghapus user <strong>{deleteDialog.user?.name}</strong>? Tindakan ini tidak dapat dibatalkan.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialog({ open: false, user: null, loading: false })} disabled={deleteDialog.loading}>Batal</Button>
                        <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteDialog.loading} className="gap-2">{deleteDialog.loading && <Loader2 className="h-4 w-4 animate-spin" />}Hapus</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}