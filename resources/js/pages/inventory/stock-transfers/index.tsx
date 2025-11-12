import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePermission } from '@/hooks/use-permission';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ArrowRightLeft, Eye, PlusCircle, Search, Filter } from 'lucide-react';
import { useState } from 'react';
import { route } from 'ziggy-js';

interface Item {
    id: number;
    code: string;
    name: string;
}

interface Department {
    id: number;
    code: string;
    name: string;
}

interface User {
    id: number;
    name: string;
}

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

export default function Index({ transfers, departments, filters }: Props) {
    const { hasPermission } = usePermission();
    const [search, setSearch] = useState(filters.search || '');
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Inventory', href: '/inventory' },
        { title: 'Stock Transfer', href: route('stock-transfers.index') },
    ];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('stock-transfers.index'), 
            { ...filters, search },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleFilter = (filterName: string, value: string) => {
        router.get(route('stock-transfers.index'), 
            { ...filters, [filterName]: value },
            { preserveState: true, preserveScroll: true }
        );
    };

    const clearFilters = () => {
        router.get(route('stock-transfers.index'));
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: any; label: string }> = {
            draft: { variant: 'secondary', label: 'Draft' },
            approved: { variant: 'default', label: 'Approved' },
            received: { variant: 'success', label: 'Received' },
        };
        const config = variants[status] || variants.draft;
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Transfer Stok" />

            <div className="mt-4 space-y-4">
                {/* Header Card */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <ArrowRightLeft className="h-5 w-5" />
                                    Transfer Stok Antar Departemen
                                </CardTitle>
                                <CardDescription>
                                    Kelola transfer barang dari gudang pusat ke departemen atau antar departemen
                                </CardDescription>
                            </div>
                            {hasPermission('inventory.items.create') && (
                                <Button onClick={() => router.visit(route('stock-transfers.create'))} className="gap-2">
                                    <PlusCircle className="h-4 w-4" />
                                    Tambah Transfer
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Search Bar */}
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input
                                    placeholder="Cari nomor transfer atau nama barang..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSearch(e);
                                        }
                                    }}
                                    className="pl-10"
                                />
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                                className="gap-2"
                            >
                                <Filter className="h-4 w-4" />
                                Filter
                            </Button>
                        </div>

                        {/* Filters */}
                        {isFilterExpanded && (
                            <Card className="border-dashed">
                                <CardContent className="pt-6">
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
                                        {/* From Department Filter */}
                                        <div className="space-y-2">
                                            <Label>Dari Departemen</Label>
                                            <SearchableSelect
                                                options={[
                                                    { value: '', label: 'Semua' },
                                                    { value: 'null', label: 'Gudang Pusat' },
                                                    ...departments.map((dept) => ({
                                                        value: dept.id.toString(),
                                                        label: `${dept.code} - ${dept.name}`,
                                                    })),
                                                ]}
                                                value={filters.from_department_id || ''}
                                                onValueChange={(value) => handleFilter('from_department_id', value)}
                                                placeholder="Pilih departemen asal"
                                            />
                                        </div>

                                        {/* To Department Filter */}
                                        <div className="space-y-2">
                                            <Label>Ke Departemen</Label>
                                            <SearchableSelect
                                                options={[
                                                    { value: '', label: 'Semua' },
                                                    ...departments.map((dept) => ({
                                                        value: dept.id.toString(),
                                                        label: `${dept.code} - ${dept.name}`,
                                                    })),
                                                ]}
                                                value={filters.to_department_id || ''}
                                                onValueChange={(value) => handleFilter('to_department_id', value)}
                                                placeholder="Pilih departemen tujuan"
                                            />
                                        </div>

                                        {/* Status Filter */}
                                        <div className="space-y-2">
                                            <Label>Status</Label>
                                            <SearchableSelect
                                                options={[
                                                    { value: '', label: 'Semua Status' },
                                                    { value: 'draft', label: 'Draft' },
                                                    { value: 'approved', label: 'Approved' },
                                                    { value: 'received', label: 'Received' },
                                                ]}
                                                value={filters.status || ''}
                                                onValueChange={(value) => handleFilter('status', value)}
                                                placeholder="Semua Status"
                                            />
                                        </div>

                                        {/* Date From Filter */}
                                        <div className="space-y-2">
                                            <Label>Dari Tanggal</Label>
                                            <Input
                                                type="date"
                                                value={filters.date_from || ''}
                                                onChange={(e) => handleFilter('date_from', e.target.value)}
                                            />
                                        </div>

                                        {/* Date To Filter */}
                                        <div className="space-y-2">
                                            <Label>Sampai Tanggal</Label>
                                            <Input
                                                type="date"
                                                value={filters.date_to || ''}
                                                onChange={(e) => handleFilter('date_to', e.target.value)}
                                            />
                                        </div>
                                        
                                        {/* Reset Button */}
                                        <div className="flex items-end">
                                            <Button variant="outline" onClick={clearFilters} className="w-full">
                                                Reset Filter
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Table */}
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[140px]">Nomor Transfer</TableHead>
                                        <TableHead className="w-[120px]">Tanggal</TableHead>
                                        <TableHead>Barang</TableHead>
                                        <TableHead>Dari</TableHead>
                                        <TableHead>Ke</TableHead>
                                        <TableHead className="text-right">Qty</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                        <TableHead className="text-center w-[100px]">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transfers.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center text-gray-500">
                                                Tidak ada data transfer stok
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        transfers.data.map((transfer) => (
                                            <TableRow key={transfer.id}>
                                                <TableCell className="font-medium">
                                                    {transfer.nomor_transfer}
                                                </TableCell>
                                                <TableCell>
                                                    {formatDate(transfer.tanggal_transfer)}
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{transfer.item.name}</div>
                                                        <div className="text-xs text-gray-500">
                                                            {transfer.item.code}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {transfer.from_department ? (
                                                        <div>
                                                            <div className="font-medium">
                                                                {transfer.from_department.name}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {transfer.from_department.code}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <Badge variant="outline">Gudang Pusat</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">
                                                            {transfer.to_department.name}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {transfer.to_department.code}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {transfer.quantity.toLocaleString('id-ID')}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {getStatusBadge(transfer.status)}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => router.visit(route('stock-transfers.show', transfer.id))}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination Info */}
                        {transfers.data.length > 0 && (
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-500">
                                    Menampilkan {transfers.from} - {transfers.to} dari {transfers.total} transfer
                                </p>
                                {transfers.last_page > 1 && (
                                    <div className="flex gap-2">
                                        {Array.from({ length: transfers.last_page }, (_, i) => i + 1).map((page) => (
                                            <Button
                                                key={page}
                                                variant={page === transfers.current_page ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => router.get(route('stock-transfers.index', { ...filters, page }))}
                                            >
                                                {page}
                                            </Button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
