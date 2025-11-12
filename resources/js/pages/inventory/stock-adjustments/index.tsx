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
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { 
    ClipboardList, 
    Eye, 
    Filter, 
    PlusCircle, 
    Search,
    CheckCircle,
    XCircle,
    Send,
    FileCheck
} from 'lucide-react';
import { useState } from 'react';
import { route } from 'ziggy-js';

interface StockAdjustment {
    id: number;
    nomor_adjustment: string;
    tanggal_adjustment: string;
    tipe_adjustment: 'shortage' | 'overage';
    quantity: number;
    unit_price: number;
    total_amount: number;
    status: 'draft' | 'approved';
    jurnal_posted: boolean;
    keterangan?: string;
    item: {
        id: number;
        code: string;
        name: string;
    };
    approved_by?: {
        name: string;
    };
    approved_at?: string;
}

interface PaginatedAdjustments {
    data: StockAdjustment[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Props extends SharedData {
    adjustments: PaginatedAdjustments;
    filters: {
        search: string;
        tipe_adjustment: string;
        status: string;
        posted_only: string;
        date_from: string;
        date_to: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: <ClipboardList className="h-4 w-4" />, href: '#' },
    { title: 'Stock Adjustments', href: '#' },
];

const tipeLabels: Record<string, string> = {
    shortage: 'Kekurangan',
    overage: 'Kelebihan',
};

const tipeColors: Record<string, string> = {
    shortage: 'bg-red-100 text-red-800',
    overage: 'bg-green-100 text-green-800',
};

const statusLabels: Record<string, string> = {
    draft: 'Draft',
    approved: 'Approved',
};

const statusColors: Record<string, string> = {
    draft: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
};

export default function StockAdjustmentIndex({ adjustments, filters }: Props) {
    const { hasPermission } = usePermission();
    const [search, setSearch] = useState(filters.search);
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);

    const handleSearch = (searchValue: string) => {
        router.get(
            '/stock-adjustments',
            {
                ...filters,
                search: searchValue,
            },
            {
                preserveState: true,
                replace: true,
            }
        );
    };

    const handleFilterChange = (key: string, value: string) => {
        router.get(
            '/stock-adjustments',
            {
                ...filters,
                [key]: value,
            },
            {
                preserveState: true,
                replace: true,
            }
        );
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <>
            <Head title="Stock Adjustments" />
            <AppLayout breadcrumbs={breadcrumbs}>
                <Card className='mt-6'>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Stock Adjustments</CardTitle>
                                <CardDescription>
                                    Kelola penyesuaian stok (shortage/overage) di gudang pusat
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
                                {hasPermission('inventory.purchases.post-to-journal') && (
                                    <Button
                                        variant="outline"
                                        onClick={() => router.visit(route('stock-adjustments.showPostToJournal'))}
                                    >
                                        <Send className="mr-2 h-4 w-4" />
                                        Post to Jurnal
                                    </Button>
                                )}
                                {hasPermission('inventory.items.edit') && (
                                    <Button
                                        onClick={() => router.visit(route('stock-adjustments.create'))}
                                    >
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Buat Adjustment
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Search and Filter Section */}
                        <div className="mb-6 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Cari nomor adjustment atau nama barang..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleSearch(search);
                                                }
                                            }}
                                            className="pl-9"
                                        />
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                                >
                                    <Filter className="mr-2 h-4 w-4" />
                                    Filter
                                </Button>
                            </div>

                            {isFilterExpanded && (
                                <div className="grid grid-cols-1 gap-4 rounded-lg border p-4 md:grid-cols-5">
                                    <div>
                                        <Label htmlFor="tipe">Tipe</Label>
                                        <SearchableSelect
                                            value={filters.tipe_adjustment || 'all'}
                                            onValueChange={(value) =>
                                                handleFilterChange('tipe_adjustment', value === 'all' ? '' : value)
                                            }
                                            options={[
                                                { value: 'all', label: 'Semua' },
                                                { value: 'shortage', label: 'Kekurangan' },
                                                { value: 'overage', label: 'Kelebihan' },
                                            ]}
                                            placeholder="Semua"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="status">Status</Label>
                                        <SearchableSelect
                                            value={filters.status || 'all'}
                                            onValueChange={(value) =>
                                                handleFilterChange('status', value === 'all' ? '' : value)
                                            }
                                            options={[
                                                { value: 'all', label: 'Semua' },
                                                { value: 'draft', label: 'Draft' },
                                                { value: 'approved', label: 'Approved' },
                                            ]}
                                            placeholder="Semua"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="date_from">Tanggal Dari</Label>
                                        <Input
                                            id="date_from"
                                            type="date"
                                            value={filters.date_from}
                                            onChange={(e) =>
                                                handleFilterChange('date_from', e.target.value)
                                            }
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="date_to">Tanggal Sampai</Label>
                                        <Input
                                            id="date_to"
                                            type="date"
                                            value={filters.date_to}
                                            onChange={(e) =>
                                                handleFilterChange('date_to', e.target.value)
                                            }
                                        />
                                    </div>

                                    <div className="flex items-end">
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                router.visit(route('stock-adjustments.index'))
                                            }
                                            className="w-full"
                                        >
                                            Reset Filter
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Table Section */}
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nomor</TableHead>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead>Barang</TableHead>
                                        <TableHead>Tipe</TableHead>
                                        <TableHead>Qty</TableHead>
                                        <TableHead>Nilai</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Jurnal</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {adjustments.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={9}
                                                className="text-center text-muted-foreground"
                                            >
                                                Tidak ada data stock adjustment
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        adjustments.data.map((adjustment) => (
                                            <TableRow key={adjustment.id}>
                                                <TableCell className="font-medium">
                                                    {adjustment.nomor_adjustment}
                                                </TableCell>
                                                <TableCell>
                                                    {format(
                                                        new Date(adjustment.tanggal_adjustment),
                                                        'dd MMM yyyy',
                                                        { locale: idLocale }
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">
                                                            {adjustment.item.name}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {adjustment.item.code}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={
                                                            tipeColors[adjustment.tipe_adjustment]
                                                        }
                                                    >
                                                        {tipeLabels[adjustment.tipe_adjustment]}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{adjustment.quantity}</TableCell>
                                                <TableCell>
                                                    {formatCurrency(adjustment.total_amount)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={statusColors[adjustment.status]}
                                                    >
                                                        {statusLabels[adjustment.status]}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {adjustment.jurnal_posted ? (
                                                        <Badge className="bg-green-100 text-green-800">
                                                            <CheckCircle className="mr-1 h-3 w-3" />
                                                            Posted
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-gray-100 text-gray-800">
                                                            <XCircle className="mr-1 h-3 w-3" />
                                                            Draft
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            router.visit(
                                                                route(
                                                                    'stock-adjustments.show',
                                                                    adjustment.id
                                                                )
                                                            )
                                                        }
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

                        {/* Pagination */}
                        {adjustments.last_page > 1 && (
                            <div className="mt-4 flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">
                                    Menampilkan {adjustments.from} - {adjustments.to} dari{' '}
                                    {adjustments.total} data
                                </div>
                                <div className="flex gap-2">
                                    {Array.from({ length: adjustments.last_page }, (_, i) => i + 1)
                                        .filter((page) => {
                                            const current = adjustments.current_page;
                                            return (
                                                page === 1 ||
                                                page === adjustments.last_page ||
                                                (page >= current - 1 && page <= current + 1)
                                            );
                                        })
                                        .map((page, index, array) => {
                                            if (index > 0 && array[index - 1] !== page - 1) {
                                                return (
                                                    <span key={`ellipsis-${page}`} className="px-2">
                                                        ...
                                                    </span>
                                                );
                                            }
                                            return (
                                                <Button
                                                    key={page}
                                                    variant={
                                                        page === adjustments.current_page
                                                            ? 'default'
                                                            : 'outline'
                                                    }
                                                    size="sm"
                                                    onClick={() =>
                                                        router.get(
                                                            route('stock-adjustments.index'),
                                                            {
                                                                ...filters,
                                                                page,
                                                            }
                                                        )
                                                    }
                                                >
                                                    {page}
                                                </Button>
                                            );
                                        })}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </AppLayout>
        </>
    );
}
