import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle, XCircle, Eye, Filter, FileCheck } from 'lucide-react';
import { toast } from 'sonner';
import { BreadcrumbItem } from '@/types';

interface User {
    id: number;
    name: string;
}

interface ClosingPeriod {
    id: number;
    period_name: string;
}

interface RevisionLog {
    id: number;
    journal_type: string;
    journal_id: number;
    action: string;
    reason: string;
    impact_amount: number;
    approval_status: 'pending' | 'approved' | 'rejected';
    revised_at: string;
    revised_by: User;
    approved_by?: User;
    approved_at?: string;
    closing_period: ClosingPeriod;
}

interface PaginatedData {
    data: RevisionLog[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Statistics {
    pending_count: number;
    today_count: number;
    week_count: number;
    month_count: number;
    high_value_count: number;
}

interface Props {
    revisions: PaginatedData;
    periods: ClosingPeriod[];
    statistics: Statistics;
    filters: {
        status: string;
        period_id: string;
        date_from: string;
        date_to: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: <FileCheck className="h-4 w-4" />, href: '/settings' },
    { title: 'Approval Revisi', href: '/settings/revision-approvals' },
];

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
};

const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export default function RevisionApprovalIndex({ revisions, periods, statistics, filters }: Props) {
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [showFilter, setShowFilter] = useState(false);
    const [filterStatus, setFilterStatus] = useState(filters.status || 'all');
    const [filterPeriod, setFilterPeriod] = useState(filters.period_id || 'all');
    const [filterDateFrom, setFilterDateFrom] = useState(filters.date_from || '');
    const [filterDateTo, setFilterDateTo] = useState(filters.date_to || '');

    const handleFilterChange = () => {
        router.get(
            route('settings.revision-approvals.index'),
            {
                status: filterStatus,
                period_id: filterPeriod,
                date_from: filterDateFrom,
                date_to: filterDateTo,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const toggleSelection = (id: number) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === revisions.data.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(revisions.data.map((r) => r.id));
        }
    };

    const handleBulkApprove = () => {
        if (selectedIds.length === 0) {
            toast.error('Pilih minimal 1 revisi untuk diapprove');
            return;
        }

        if (confirm(`Yakin ingin approve ${selectedIds.length} revisi?`)) {
            router.post(
                route('settings.revision-approvals.bulk-approve'),
                { revision_ids: selectedIds },
                {
                    onSuccess: () => {
                        toast.success(`${selectedIds.length} revisi berhasil diapprove`);
                        setSelectedIds([]);
                    },
                    onError: (errors) => {
                        toast.error('Gagal approve revisi');
                        console.error(errors);
                    },
                }
            );
        }
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            pending: { label: 'Pending', variant: 'secondary' as const },
            approved: { label: 'Approved', variant: 'default' as const },
            rejected: { label: 'Rejected', variant: 'destructive' as const },
        };
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const handlePageChange = (page: number) => {
        router.get(
            route('settings.revision-approvals.index'),
            {
                ...filters,
                page,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Approval Revisi Jurnal" />

            <div className="flex h-full flex-1 flex-col space-y-8 p-8">
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Approval Revisi Jurnal</h2>
                        <p className="text-muted-foreground">
                            Kelola permintaan revisi jurnal pada periode tertutup
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setShowFilter(!showFilter)}
                        className="gap-2"
                    >
                        <Filter className="h-4 w-4" />
                        {showFilter ? 'Sembunyikan Filter' : 'Tampilkan Filter'}
                    </Button>
                    {(filterStatus !== 'all' || filterPeriod !== 'all' || filterDateFrom || filterDateTo) && (
                        <Badge variant="secondary" className="gap-1">
                            Filter Aktif
                            <XCircle 
                                className="h-3 w-3 cursor-pointer" 
                                onClick={() => {
                                    setFilterStatus('all');
                                    setFilterPeriod('all');
                                    setFilterDateFrom('');
                                    setFilterDateTo('');
                                    router.get(route('settings.revision-approvals.index'));
                                }}
                            />
                        </Badge>
                    )}
                </div>
                </div>

                {/* Statistics */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.pending_count}</div>
                            <p className="text-xs text-muted-foreground">Menunggu approval</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Hari Ini</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.today_count}</div>
                            <p className="text-xs text-muted-foreground">Revisi hari ini</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Minggu Ini</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.week_count}</div>
                            <p className="text-xs text-muted-foreground">Revisi minggu ini</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Bulan Ini</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.month_count}</div>
                            <p className="text-xs text-muted-foreground">Revisi bulan ini</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Nilai Tinggi</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.high_value_count}</div>
                            <p className="text-xs text-muted-foreground">&gt; 10 Juta</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter Toggle Button */}
                

                {/* Filters - Collapsible */}
                {showFilter && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Filter</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                <SearchableSelect
                                    value={filterStatus}
                                    onValueChange={setFilterStatus}
                                    options={[
                                        { value: 'all', label: 'Semua Status' },
                                        { value: 'pending', label: 'Pending' },
                                        { value: 'approved', label: 'Approved' },
                                        { value: 'rejected', label: 'Rejected' },
                                    ]}
                                    placeholder="Pilih Status"
                                    searchPlaceholder="Cari status..."
                                />

                                <SearchableSelect
                                    value={filterPeriod}
                                    onValueChange={setFilterPeriod}
                                    options={[
                                        { value: 'all', label: 'Semua Periode' },
                                        ...periods.map((period) => ({
                                            value: period.id.toString(),
                                            label: period.period_name,
                                        })),
                                    ]}
                                    placeholder="Pilih Periode"
                                    searchPlaceholder="Cari periode..."
                                />

                                <Input
                                    type="date"
                                    value={filterDateFrom}
                                    onChange={(e) => setFilterDateFrom(e.target.value)}
                                    placeholder="Dari Tanggal"
                                />

                                <Input
                                    type="date"
                                    value={filterDateTo}
                                    onChange={(e) => setFilterDateTo(e.target.value)}
                                    placeholder="Sampai Tanggal"
                                />

                                <Button onClick={handleFilterChange}>
                                    <Filter className="h-4 w-4 mr-2" />
                                    Terapkan Filter
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Main Table */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-sm font-medium">Daftar Revisi</CardTitle>
                                <CardDescription>
                                    Menampilkan {revisions.from || 0} - {revisions.to || 0} dari {revisions.total} revisi
                                </CardDescription>
                            </div>
                            {selectedIds.length > 0 && (
                                <Button onClick={handleBulkApprove}>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Approve {selectedIds.length} Revisi
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {revisions.data.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                Tidak ada revisi ditemukan
                            </div>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]">
                                                <Checkbox
                                                    checked={selectedIds.length === revisions.data.length && revisions.data.length > 0}
                                                    onCheckedChange={toggleSelectAll}
                                                    disabled={filterStatus !== 'pending'}
                                                />
                                            </TableHead>
                                            <TableHead className="w-[80px]">No</TableHead>
                                            <TableHead>Tanggal</TableHead>
                                            <TableHead>Periode</TableHead>
                                            <TableHead>Jurnal</TableHead>
                                            <TableHead>Tipe</TableHead>
                                            <TableHead>User</TableHead>
                                            <TableHead className="text-right">Nominal</TableHead>
                                            <TableHead className="w-[120px]">Status</TableHead>
                                            <TableHead className="w-[100px] text-right">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {revisions.data.map((revision, index) => (
                                            <TableRow key={revision.id}>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedIds.includes(revision.id)}
                                                        onCheckedChange={() => toggleSelection(revision.id)}
                                                        disabled={revision.approval_status !== 'pending'}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-center text-sm text-muted-foreground">
                                                    {(revisions.current_page - 1) * revisions.per_page + index + 1}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {formatDate(revision.revised_at)}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {revision.closing_period.period_name}
                                                </TableCell>
                                                <TableCell className="text-sm font-medium">
                                                    {revision.journal_type} #{revision.journal_id}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="capitalize text-xs">
                                                        {revision.action}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {revision.revised_by.name}
                                                </TableCell>
                                                <TableCell className="text-sm text-right font-mono">
                                                    {formatCurrency(revision.impact_amount)}
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(revision.approval_status)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            router.visit(
                                                                route('settings.revision-approvals.show', revision.id)
                                                            )
                                                        }
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                {/* Pagination */}
                                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                                    <div className="text-sm text-muted-foreground">
                                        Halaman {revisions.current_page} dari {revisions.last_page}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePageChange(revisions.current_page - 1)}
                                            disabled={revisions.current_page === 1}
                                        >
                                            Sebelumnya
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePageChange(revisions.current_page + 1)}
                                            disabled={revisions.current_page === revisions.last_page}
                                        >
                                            Selanjutnya
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
