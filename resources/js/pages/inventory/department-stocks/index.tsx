import { type Column, DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, PageProps } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Building2, Eye, Package } from 'lucide-react';
import { route } from 'ziggy-js';

interface Department {
    id: number; name: string; code: string;
    total_items: number; total_quantity: number; total_value: number; items_count: number;
}

interface PaginatedDepartments { data: Department[]; current_page: number; last_page: number; per_page: number; total: number; from: number; to: number; }
interface Props extends PageProps { departments: PaginatedDepartments; filters: { search?: string; perPage?: number }; }

const breadcrumbs: BreadcrumbItem[] = [
    { title: <Package className="h-4 w-4" />, href: '#' },
    { title: 'Stok Department', href: '' },
];

const fmtCurrency = (v: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);
const fmtNumber = (n: number | undefined | null) => (n == null ? '0' : (n >= 1000 || n <= -1000) ? n.toLocaleString('id-ID') : n.toString());

export default function Index({ departments, filters }: Props) {
    const navigate = (params: Record<string, any>) => router.get(route('department-stocks.index'), params, { preserveState: true, replace: true });

    const columns: Column<Department>[] = [
        { key: 'code', label: 'Kode', render: (r) => <span className="font-medium">{r.code}</span> },
        { key: 'name', label: 'Nama Department', render: (r) => (<div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" /><span className="font-semibold">{r.name}</span></div>) },
        { key: 'total_items', label: 'Total Item', className: 'text-center', render: (r) => <Badge variant="secondary">{r.total_items} items</Badge> },
        { key: 'total_qty', label: 'Total Qty', className: 'text-right', render: (r) => <span className="font-semibold">{fmtNumber(r.total_quantity)}</span> },
        { key: 'total_value', label: 'Total Nilai', className: 'text-right', render: (r) => <span className="font-semibold text-green-600">{fmtCurrency(r.total_value)}</span> },
        { key: 'aksi', label: '', className: 'text-right', render: (r) => (
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); router.visit(route('department-stocks.show', r.id)); }} className="gap-2"><Eye className="h-4 w-4" />View</Button>
        ) },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Stok Department" />
            <div className="p-4">
                <DataTable<Department>
                    pageTitle="Stok Department"
                    pageSubtitle="Kelola stok item Anda per department"
                    columns={columns} data={departments.data} pagination={departments} rowKey={(r) => r.id}
                    searchValue={filters.search} searchPlaceholder="Cari department..."
                    onSearch={(search) => navigate({ search, perPage: filters.perPage, page: 1 })}
                    onPageChange={(page) => navigate({ search: filters.search, perPage: filters.perPage, page })}
                    onPerPageChange={(perPage) => navigate({ search: filters.search, perPage, page: 1 })}
                    onRowClick={(r) => router.visit(route('department-stocks.show', r.id))}
                    emptyIcon={<Package className="h-8 w-8 text-muted-foreground/50" />}
                    emptyText="Tidak ada data department"
                />
            </div>
        </AppLayout>
    );
}
