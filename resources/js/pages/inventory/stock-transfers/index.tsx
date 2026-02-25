import { type Column, type FilterField, DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePermission } from '@/hooks/use-permission';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { ArrowRightLeft, Eye, PlusCircle } from 'lucide-react';

interface Item { id: number; code: string; name: string }
interface Department { id: number; code: string; name: string }

interface StockTransfer {
    id: number;
    nomor_transfer: string;
    tanggal_transfer: string;
    from_department_id: number | null;
    to_department_id: number;
    item_id: number;
    quantity: number;
    status: 'draft' | 'approved' | 'received';
    approved_by: number | null;
    approved_at: string | null;
    received_by: number | null;
    received_at: string | null;
    keterangan: string | null;
    item: Item;
    from_department: Department | null;
    to_department: Department;
}

interface PaginatedTransfers {
    data: StockTransfer[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Props extends SharedData {
    transfers: PaginatedTransfers;
    departments: Department[];
    filters: {
        search?: string;
        from_department_id?: string;
        to_department_id?: string;
        status?: string;
        date_from?: string;
        date_to?: string;
    };
}

const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

const statusCfg: Record<string, { variant: 'secondary' | 'default' | 'outline'; label: string }> = {
    draft: { variant: 'secondary', label: 'Draft' },
    approved: { variant: 'default', label: 'Approved' },
    received: { variant: 'outline', label: 'Received' },
};

export default function Index() {
    const { transfers, departments, filters } = usePage<Props>().props;
    const { hasPermission } = usePermission();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Inventory', href: '/inventory' },
        { title: 'Stock Transfer', href: route('stock-transfers.index') },
    ];

    const navigate = (p: Record<string, any>) =>
        router.get(route('stock-transfers.index'), p, { preserveState: true, preserveScroll: true });

    const fp = {
        search: filters.search || '',
        from_department_id: filters.from_department_id || '',
        to_department_id: filters.to_department_id || '',
        status: filters.status || '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
    };

    const deptOptions = departments.map((d) => ({ value: d.id.toString(), label: `${d.code} - ${d.name}` }));

    const columns: Column<StockTransfer>[] = [
        { key: 'nomor_transfer', label: 'Nomor Transfer', className: 'w-[140px] font-medium', render: (row) => row.nomor_transfer },
        { key: 'tanggal', label: 'Tanggal', className: 'w-[120px]', render: (row) => fmtDate(row.tanggal_transfer) },
        {
            key: 'barang', label: 'Barang',
            render: (row) => (
                <div>
                    <div className="font-medium">{row.item.name}</div>
                    <div className="text-xs text-gray-500">{row.item.code}</div>
                </div>
            ),
        },
        {
            key: 'dari', label: 'Dari',
            render: (row) =>
                row.from_department ? (
                    <div>
                        <div className="font-medium">{row.from_department.name}</div>
                        <div className="text-xs text-gray-500">{row.from_department.code}</div>
                    </div>
                ) : (
                    <Badge variant="outline">Gudang Pusat</Badge>
                ),
        },
        {
            key: 'ke', label: 'Ke',
            render: (row) => (
                <div>
                    <div className="font-medium">{row.to_department.name}</div>
                    <div className="text-xs text-gray-500">{row.to_department.code}</div>
                </div>
            ),
        },
        { key: 'qty', label: 'Qty', className: 'text-right font-medium', render: (row) => row.quantity.toLocaleString('id-ID') },
        {
            key: 'status', label: 'Status',
            className: 'text-center',
            render: (row) => {
                const c = statusCfg[row.status] || statusCfg.draft;
                return <Badge variant={c.variant}>{c.label}</Badge>;
            },
        },
        {
            key: 'aksi', label: 'Aksi',
            className: 'text-center w-[100px]',
            render: (row) => (
                <Button variant="ghost" size="sm" onClick={() => router.visit(route('stock-transfers.show', row.id))}>
                    <Eye className="h-4 w-4" />
                </Button>
            ),
        },
    ];

    const filterFields: FilterField[] = [
        {
            name: 'from_department_id',
            label: 'Dari Departemen',
            type: 'select',
            value: fp.from_department_id,
            options: [{ value: 'null', label: 'Gudang Pusat' }, ...deptOptions],
        },
        {
            name: 'to_department_id',
            label: 'Ke Departemen',
            type: 'select',
            value: fp.to_department_id,
            options: deptOptions,
        },
        {
            name: 'status',
            label: 'Status',
            type: 'select',
            value: fp.status,
            options: [
                { value: 'draft', label: 'Draft' },
                { value: 'approved', label: 'Approved' },
                { value: 'received', label: 'Received' },
            ],
        },
        { name: 'date_from', label: 'Dari Tanggal', type: 'date', value: fp.date_from },
        { name: 'date_to', label: 'Sampai Tanggal', type: 'date', value: fp.date_to },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Transfer Stok" />
            <div className="p-4">
                <DataTable<StockTransfer>
                    pageTitle="Daftar Transfer Stok"
                    pageSubtitle="Kelola data transfer stok Anda di sini"
                    columns={columns}
                    data={transfers.data}
                    pagination={transfers}
                    searchValue={fp.search}
                    searchPlaceholder="Cari nomor transfer atau nama barang..."
                    onSearch={(v) => navigate({ ...fp, search: v, page: 1 })}
                    filters={filterFields}
                    onFilterChange={(k, v) => navigate({ ...fp, [k]: v, page: 1 })}
                    onFilterReset={() => navigate({})}
                    onPageChange={(p) => navigate({ ...fp, page: p })}
                    onPerPageChange={(n) => navigate({ ...fp, perPage: n, page: 1 })}
                    headerActions={
                        hasPermission('inventory.items.create') ? (
                            <Button onClick={() => router.visit(route('stock-transfers.create'))} className="gap-2">
                                <PlusCircle className="h-4 w-4" />
                                Tambah Transfer
                            </Button>
                        ) : undefined
                    }
                    emptyIcon={<ArrowRightLeft className="h-8 w-8 text-muted-foreground/50" />}
                    emptyText="Tidak ada data transfer stok"
                    rowKey={(r) => r.id}
                />
            </div>
        </AppLayout>
    );
}
