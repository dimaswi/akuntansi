import { type Column, type FilterField, DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Edit3, Eye, Loader2, Package, PlusCircle, Trash } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/lib/toast';

interface Department { id: number; name: string }
interface Category { id: number; name: string }
interface Supplier { id: number; name: string }

interface ItemStock {
    id: number;
    item_id: number;
    department_id: number | null;
    quantity_on_hand: number;
    reserved_quantity: number;
    available_quantity: number;
    last_unit_cost: number;
    average_unit_cost: number;
    total_value: number;
}

interface Item {
    id: number;
    code: string;
    name: string;
    description?: string;
    inventory_type: 'pharmacy' | 'general';
    unit_of_measure: string;
    pack_size: number;
    reorder_level: number;
    max_level: number;
    safety_stock: number;
    standard_cost: number;
    last_purchase_cost?: number;
    is_active: boolean;
    requires_approval: boolean;
    is_controlled_substance: boolean;
    requires_prescription: boolean;
    category?: { id: number; name: string };
    department?: { id: number; name: string };
    supplier?: { id: number; name: string };
    stocks?: ItemStock[];
}

interface PaginatedItems {
    data: Item[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Props extends SharedData {
    items: PaginatedItems;
    filters: {
        search: string;
        inventory_type?: string;
        category_id?: string;
        department_id?: string;
        supplier_id?: string;
        is_active?: string;
        stock_status?: string;
        perPage: number;
    };
    categories: Category[];
    departments: Department[];
    suppliers: Supplier[];
    isLogistics: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: <Package className="h-4 w-4" />, href: '#' },
    { title: 'Items', href: '#' },
];

const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

export default function ItemsIndex() {
    const { items, filters, categories, departments, suppliers, isLogistics } = usePage<Props>().props;

    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: Item | null; loading: boolean }>({
        open: false,
        item: null,
        loading: false,
    });

    const navigate = (p: Record<string, any>) =>
        router.get('/items', p, { preserveState: true, replace: true });

    const fp = {
        search: filters.search || '',
        inventory_type: filters.inventory_type || '',
        category_id: filters.category_id || '',
        department_id: filters.department_id || '',
        supplier_id: filters.supplier_id || '',
        is_active: filters.is_active || '',
        stock_status: filters.stock_status || '',
        perPage: filters.perPage,
    };

    const handleDelete = () => {
        if (!deleteDialog.item) return;
        setDeleteDialog((prev) => ({ ...prev, loading: true }));
        router.delete(route('items.destroy', deleteDialog.item.id), {
            onSuccess: () => setDeleteDialog({ open: false, item: null, loading: false }),
            onError: (errors) => {
                toast.error(errors?.message || 'Gagal menghapus item');
                setDeleteDialog((prev) => ({ ...prev, loading: false }));
            },
        });
    };

    const columns: Column<Item>[] = [
        { key: 'no', label: 'No', className: 'w-[60px]', render: (_row, _index, meta) => meta.rowNumber },
        { key: 'kode', label: 'Kode', className: 'font-medium', render: (row) => row.code },
        {
            key: 'nama_barang', label: 'Nama Barang',
            render: (row) => (
                <div>
                    <div className="font-medium">{row.name}</div>
                    {row.description && (
                        <div className="text-sm text-muted-foreground">
                            {row.description.length > 40 ? `${row.description.substring(0, 40)}...` : row.description}
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'tipe', label: 'Tipe',
            render: (row) =>
                row.inventory_type === 'pharmacy' ? (
                    <Badge className="bg-green-100 text-green-800">Farmasi</Badge>
                ) : (
                    <Badge className="bg-blue-100 text-blue-800">Umum</Badge>
                ),
        },
        { key: 'kategori', label: 'Kategori', render: (row) => row.category?.name || '-' },
        ...(isLogistics
            ? [
                  {
                      key: 'departemen', label: 'Departemen',
                      render: (row: Item) => {
                          const stock = row.stocks?.[0];
                          return stock?.department_id
                              ? departments.find((d) => d.id === stock.department_id)?.name || '-'
                              : 'Central Warehouse';
                      },
                  } as Column<Item>,
              ]
            : []),
        { key: 'satuan', label: 'Satuan', render: (row) => row.unit_of_measure },
        {
            key: 'stok', label: 'Stok',
            className: 'text-right',
            render: (row) => {
                const qty = row.stocks?.[0]?.quantity_on_hand || 0;
                const min = row.reorder_level || 0;
                return (
                    <Badge
                        variant={qty <= min ? 'destructive' : 'default'}
                        className={qty <= min ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}
                    >
                        {qty}
                    </Badge>
                );
            },
        },
        { key: 'min', label: 'Min', className: 'text-right', render: (row) => row.reorder_level || 0 },
        { key: 'max', label: 'Max', className: 'text-right', render: (row) => row.max_level || 0 },
        { key: 'harga', label: 'Harga', className: 'text-right font-mono', render: (row) => fmtCurrency(row.standard_cost) },
        {
            key: 'status', label: 'Status',
            render: (row) => (row.is_active ? <Badge variant="default">Aktif</Badge> : <Badge variant="secondary">Nonaktif</Badge>),
        },
        {
            key: 'aksi', label: 'Aksi',
            className: 'w-[100px] text-center',
            render: (row) => (
                <div className="flex items-center justify-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => router.visit(route('items.show', row.id))} className="h-8 w-8 p-0" title="Detail">
                        <Eye className="h-4 w-4" />
                    </Button>
                    {isLogistics && (
                        <Button variant="ghost" size="sm" onClick={() => router.visit(route('items.edit', row.id))} className="h-8 w-8 p-0" title="Edit">
                            <Edit3 className="h-4 w-4" />
                        </Button>
                    )}
                    {isLogistics && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteDialog({ open: true, item: row, loading: false })}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                            title="Hapus"
                        >
                            <Trash className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    const filterFields: FilterField[] = [
        {
            name: 'inventory_type',
            label: 'Tipe Inventory',
            type: 'select',
            value: fp.inventory_type,
            options: [
                { value: 'pharmacy', label: 'Farmasi' },
                { value: 'general', label: 'Umum' },
            ],
        },
        {
            name: 'category_id',
            label: 'Kategori',
            type: 'select',
            value: fp.category_id,
            options: categories.map((c) => ({ value: c.id.toString(), label: c.name })),
        },
        ...(isLogistics
            ? [
                  {
                      name: 'department_id',
                      label: 'Departemen',
                      type: 'select' as const,
                      value: fp.department_id,
                      options: departments.map((d) => ({ value: d.id.toString(), label: d.name })),
                  },
              ]
            : []),
        {
            name: 'supplier_id',
            label: 'Supplier',
            type: 'select',
            value: fp.supplier_id,
            options: suppliers.map((s) => ({ value: s.id.toString(), label: s.name })),
        },
        {
            name: 'stock_status',
            label: 'Status Stok',
            type: 'select',
            value: fp.stock_status,
            options: [
                { value: 'out_of_stock', label: 'Out of Stock' },
                { value: 'low_stock', label: 'Low Stock' },
                { value: 'below_safety', label: 'Below Safety Stock' },
            ],
        },
        {
            name: 'is_active',
            label: 'Status',
            type: 'select',
            value: fp.is_active,
            options: [
                { value: '1', label: 'Aktif' },
                { value: '0', label: 'Nonaktif' },
            ],
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Data Barang" />
            <div className="p-4">
                <DataTable<Item>
                    pageTitle="Data Barang"
                    pageSubtitle="Kelola data barang Anda di sini"
                    columns={columns}
                    data={items.data}
                    pagination={items}
                    searchValue={fp.search}
                    searchPlaceholder="Cari kode atau nama barang..."
                    onSearch={(v) => navigate({ ...fp, search: v, page: 1 })}
                    filters={filterFields}
                    onFilterChange={(k, v) => navigate({ ...fp, [k]: v, page: 1 })}
                    onFilterReset={() =>
                        navigate({
                            search: '',
                            inventory_type: '',
                            category_id: '',
                            department_id: '',
                            supplier_id: '',
                            is_active: '',
                            stock_status: '',
                            perPage: fp.perPage,
                            page: 1,
                        })
                    }
                    onPageChange={(p) => navigate({ ...fp, page: p })}
                    onPerPageChange={(n) => navigate({ ...fp, perPage: n, page: 1 })}
                    perPageOptions={[10, 20, 50, 100]}
                    headerActions={
                        isLogistics ? (
                            <Button onClick={() => router.visit(route('items.create'))} className="gap-2">
                                <PlusCircle className="h-4 w-4" />
                                Tambah Barang
                            </Button>
                        ) : undefined
                    }
                    emptyIcon={<Package className="h-8 w-8 text-muted-foreground/50" />}
                    emptyText="Tidak ada data barang"
                    rowKey={(r) => r.id}
                />
            </div>

            {/* Delete Dialog */}
            <Dialog open={deleteDialog.open} onOpenChange={(open) => { if (!open) setDeleteDialog({ open: false, item: null, loading: false }); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Barang</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus barang "{deleteDialog.item?.name}"? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialog({ open: false, item: null, loading: false })} disabled={deleteDialog.loading}>
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleteDialog.loading}>
                            {deleteDialog.loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
