import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { BookOpenCheck, ChevronLeft, ChevronRight, Edit3, Eye, Filter, PlusCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ClosingPeriod {
    id: number;
    period_code: string;
    period_name: string;
    period_type: string;
    period_start: string;
    period_end: string;
    cutoff_date: string;
    hard_close_date: string | null;
    status: 'open' | 'soft_close' | 'hard_close';
}

interface PaginatedData {
    data: ClosingPeriod[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Props {
    periods: PaginatedData;
    years: number[];
    filters: {
        status: string;
        year: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: <BookOpenCheck className="h-4 w-4" />,
        href: '/settings/closing-periods/list',
    },
    {
        title: 'Periode Tutup Buku',
        href: '/settings/closing-periods/list',
    },
];

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

const getStatusBadge = (status: string) => {
    const statusConfig = {
        open: { label: 'Open', variant: 'default' as const, className: 'bg-emerald-500' },
        soft_close: { label: 'Soft Close', variant: 'secondary' as const, className: 'bg-amber-500 text-white' },
        hard_close: { label: 'Hard Close', variant: 'destructive' as const, className: 'bg-red-500' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open;
    return (
        <Badge variant={config.variant} className={config.className}>
            {config.label}
        </Badge>
    );
};

export default function ClosingPeriodsIndex({ periods, years, filters }: Props) {
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);

    const hasActiveFilters = (filters.status && filters.status !== '') || (filters.year && filters.year !== '');
    const activeFilterCount = [filters.status && filters.status !== '', filters.year && filters.year !== ''].filter(Boolean).length;

    useEffect(() => {
        if (hasActiveFilters) {
            setIsFilterExpanded(true);
        }
    }, [hasActiveFilters]);

    const handleFilterChange = (key: string, value: string) => {
        router.get(
            route('settings.closing-periods.list'),
            {
                ...filters,
                [key]: value === 'all' ? '' : value,
                page: 1,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleClearFilters = () => {
        router.get(
            route('settings.closing-periods.list'),
            {},
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handlePageChange = (page: number) => {
        router.get(
            route('settings.closing-periods.list'),
            {
                ...filters,
                page,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Periode Tutup Buku" />

            <div className="space-y-4 py-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Periode Tutup Buku</h1>
                        <p className="text-sm text-muted-foreground">Kelola periode akuntansi dan cut off date</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                        variant={isFilterExpanded ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                        className="relative"
                    >
                        <Filter className="mr-2 h-4 w-4" />
                        Filter
                        {activeFilterCount > 0 && (
                            <Badge variant="destructive" className="ml-2 flex h-5 w-5 items-center justify-center rounded-full p-0">
                                {activeFilterCount}
                            </Badge>
                        )}
                    </Button>

                    {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                            Clear Filters
                        </Button>
                    )}
                    <Button onClick={() => router.visit(route('settings.closing-periods.create'))}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Buat Periode
                    </Button>
                    </div>
                </div>

                {/* Filter Expanded */}
                {isFilterExpanded && (
                    <div className="rounded-lg border bg-card p-4">
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Status</label>
                                <Select value={filters.status || 'all'} onValueChange={(value) => handleFilterChange('status', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Semua Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Status</SelectItem>
                                        <SelectItem value="open">Open</SelectItem>
                                        <SelectItem value="soft_close">Soft Close</SelectItem>
                                        <SelectItem value="hard_close">Hard Close</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tahun</label>
                                <Select value={filters.year || 'all'} onValueChange={(value) => handleFilterChange('year', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Semua Tahun" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Tahun</SelectItem>
                                        {years.map((year) => (
                                            <SelectItem key={year} value={year.toString()}>
                                                {year}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="rounded-lg border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[60px]">No</TableHead>
                                <TableHead>Nama Periode</TableHead>
                                <TableHead>Tipe</TableHead>
                                <TableHead>Tanggal Mulai</TableHead>
                                <TableHead>Tanggal Selesai</TableHead>
                                <TableHead>Cutoff Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {periods.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                        Belum ada periode tutup buku
                                    </TableCell>
                                </TableRow>
                            ) : (
                                periods.data.map((period, index) => (
                                    <TableRow key={period.id}>
                                        <TableCell className="font-medium">{periods.from + index}</TableCell>
                                        <TableCell className="font-medium">
                                            <div>
                                                <div>{period.period_name}</div>
                                                <div className="text-xs text-muted-foreground">{period.period_code}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground capitalize">{period.period_type}</TableCell>
                                        <TableCell className="text-muted-foreground">{formatDate(period.period_start)}</TableCell>
                                        <TableCell className="text-muted-foreground">{formatDate(period.period_end)}</TableCell>
                                        <TableCell className="text-muted-foreground">{formatDate(period.cutoff_date)}</TableCell>
                                        <TableCell>{getStatusBadge(period.status)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {period.status === 'open' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => router.visit(route('settings.closing-periods.edit', period.id))}
                                                        title="Edit"
                                                    >
                                                        <Edit3 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => router.visit(route('settings.closing-periods.show', period.id))}
                                                    title="Detail"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {periods.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Menampilkan {periods.from} - {periods.to} dari {periods.total} periode
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(periods.current_page - 1)}
                                disabled={periods.current_page === 1}
                            >
                                <ChevronLeft className="mr-1 h-4 w-4" />
                                Previous
                            </Button>
                            <div className="text-sm">
                                Page {periods.current_page} of {periods.last_page}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(periods.current_page + 1)}
                                disabled={periods.current_page === periods.last_page}
                            >
                                Next
                                <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
