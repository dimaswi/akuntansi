import { type Column, type FilterField, DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Building2, Edit3, Loader2, Package, PlusCircle, Trash, Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/lib/toast';
import { route } from 'ziggy-js';

interface Department {
    id: number; name: string; code: string; level: number; parent_id?: number; is_active: boolean;
    parent?: { id: number; name: string }; created_at?: string; updated_at?: string;
}

interface PaginatedDepartments { data: Department[]; current_page: number; last_page: number; per_page: number; total: number; from: number; to: number; }
interface Props extends SharedData { departments: PaginatedDepartments; filters: { search: string; is_active?: string; perPage: number }; isLogistics: boolean; }

const breadcrumbs: BreadcrumbItem[] = [
    { title: <Package className="h-4 w-4" />, href: '#' },
    { title: 'Departments', href: '#' },
];

export default function DepartmentIndex() {
    const { departments, filters, isLogistics } = usePage<Props>().props;
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; department: Department | null; loading: boolean }>({ open: false, department: null, loading: false });

    const navigate = (params: Record<string, any>) => router.get('/departments', params, { preserveState: true, replace: true });
    const fp = { search: filters.search || '', perPage: filters.perPage, is_active: filters.is_active || '' };

    const handleDelete = () => {
        if (!deleteDialog.department) return;
        setDeleteDialog((p) => ({ ...p, loading: true }));
        router.delete(route('departments.destroy', deleteDialog.department.id), {
            onSuccess: () => setDeleteDialog({ open: false, department: null, loading: false }),
            onError: (errors) => { toast.error(errors?.message || 'Gagal menghapus departemen'); setDeleteDialog((p) => ({ ...p, loading: false })); },
        });
    };

    const columns: Column<Department>[] = [
        { key: 'no', label: 'No', className: 'w-[60px]', render: (_r, _i, meta) => meta.rowNumber },
        { key: 'code', label: 'Kode', render: (r) => <span className="font-medium font-mono cursor-pointer hover:text-blue-600" onClick={() => router.visit(route('departments.show', r.id))}>{r.code}</span> },
        { key: 'name', label: 'Nama Departemen', render: (r) => <span className="cursor-pointer hover:text-blue-600" onClick={() => router.visit(route('departments.show', r.id))}>{r.name}</span> },
        { key: 'level', label: 'Level', render: (r) => <Badge variant="outline">Level {r.level}</Badge> },
        { key: 'parent', label: 'Parent', render: (r) => r.parent ? r.parent.name : '-' },
        { key: 'status', label: 'Status', render: (r) => <Badge variant={r.is_active ? 'default' : 'secondary'}>{r.is_active ? 'Aktif' : 'Nonaktif'}</Badge> },
        { key: 'aksi', label: 'Aksi', className: 'w-[120px] text-center', render: (r) => (
            <div className="flex items-center justify-center gap-1">
                {isLogistics && <Button variant="ghost" size="sm" onClick={() => router.visit(route('departments.users', r.id))} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800" title="Kelola Users"><Users className="h-4 w-4" /></Button>}
                <Button variant="ghost" size="sm" onClick={() => router.visit(route('departments.edit', r.id))} className="h-8 w-8 p-0" title="Edit"><Edit3 className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleteDialog({ open: true, department: r, loading: false })} className="h-8 w-8 p-0 text-red-600 hover:text-red-800" title="Hapus"><Trash className="h-4 w-4" /></Button>
            </div>
        ) },
    ];

    const filterFields: FilterField[] = [
        { name: 'is_active', label: 'Status', type: 'select', value: filters.is_active || '', options: [{ value: '1', label: 'Aktif' }, { value: '0', label: 'Nonaktif' }] },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Data Departemen" />
            <div className="p-4">
                <DataTable<Department>
                    pageTitle="Data Departemen"
                    pageSubtitle="Kelola data departemen Anda di sini"
                    columns={columns} data={departments.data} pagination={departments} rowKey={(r) => r.id}
                    searchValue={filters.search} searchPlaceholder="Cari kode atau nama departemen..."
                    onSearch={(search) => navigate({ ...fp, search, page: 1 })}
                    filters={filterFields}
                    onFilterChange={(name, value) => navigate({ ...fp, [name]: value, page: 1 })}
                    onFilterReset={() => navigate({ search: '', perPage: filters.perPage, is_active: '', page: 1 })}
                    onPageChange={(page) => navigate({ ...fp, page })}
                    onPerPageChange={(perPage) => navigate({ ...fp, perPage, page: 1 })}
                    perPageOptions={[10, 20, 50, 100]}
                    emptyIcon={<Building2 className="h-8 w-8 text-muted-foreground/50" />}
                    emptyText="Tidak ada data departemen"
                    headerActions={<Button size="sm" onClick={() => router.visit(route('departments.create'))} className="gap-2"><PlusCircle className="h-4 w-4" />Tambah Departemen</Button>}
                />
            </div>

            <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, department: null, loading: false })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Departemen</DialogTitle>
                        <DialogDescription>Apakah Anda yakin ingin menghapus departemen "{deleteDialog.department?.name}"? Tindakan ini tidak dapat dibatalkan.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialog({ open: false, department: null, loading: false })} disabled={deleteDialog.loading}>Batal</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleteDialog.loading}>{deleteDialog.loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Hapus</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
