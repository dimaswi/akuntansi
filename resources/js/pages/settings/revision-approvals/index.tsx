import { type Column, type FilterField, DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { CheckCircle, Eye, FileCheck } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface RevisionLog {
    id: number;
    journal_type: string;
    journal_id: number;
    action: string;
    reason: string;
    impact_amount: number;
    approval_status: 'pending' | 'approved' | 'rejected';
    revised_at: string;
    revised_by: { id: number; name: string };
    approved_by?: { id: number; name: string };
    approved_at?: string;
    closing_period: { id: number; period_name: string };
}

interface Props {
    revisions: { data: RevisionLog[]; current_page: number; last_page: number; per_page: number; total: number; from: number; to: number };
    periods: { id: number; period_name: string }[];
    statistics: { pending_count: number; today_count: number; week_count: number; month_count: number; high_value_count: number };
    filters: { status: string; period_id: string; date_from: string; date_to: string };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: <FileCheck className="h-4 w-4" />, href: '/settings' },
    { title: 'Approval Revisi', href: '' },
];

const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const statusCfg: Record<string, { label: string; variant: 'secondary' | 'default' | 'destructive' }> = {
    pending: { label: 'Pending', variant: 'secondary' },
    approved: { label: 'Approved', variant: 'default' },
    rejected: { label: 'Rejected', variant: 'destructive' },
};

export default function RevisionApprovalIndex({ revisions, periods, statistics, filters }: Props) {
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const navigate = (p: Record<string, any>) =>
        router.get(route('settings.revision-approvals.index'), p, { preserveState: true, preserveScroll: true });

    const fp = {
        status: filters.status || '',
        period_id: filters.period_id || '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
    };

    const toggleSelection = (id: number) =>
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));

    const handleBulkApprove = () => {
        if (selectedIds.length === 0) { toast.error('Pilih minimal 1 revisi untuk diapprove'); return; }
        if (confirm(`Yakin ingin approve ${selectedIds.length} revisi?`)) {
            router.post(route('settings.revision-approvals.bulk-approve'), { revision_ids: selectedIds }, {
                onSuccess: () => { toast.success(`${selectedIds.length} revisi berhasil diapprove`); setSelectedIds([]); },
                onError: () => toast.error('Gagal approve revisi'),
            });
        }
    };

    const columns: Column<RevisionLog>[] = [
        {
            key: 'checkbox', label: '',
            className: 'w-[50px]',
            render: (row) => (
                <Checkbox
                    checked={selectedIds.includes(row.id)}
                    onCheckedChange={() => toggleSelection(row.id)}
                    disabled={row.approval_status !== 'pending'}
                />
            ),
        },
        { key: 'no', label: 'No', className: 'w-[60px] text-center text-muted-foreground', render: (_row, _index, meta) => meta.rowNumber },
        { key: 'tanggal', label: 'Tanggal', className: 'text-sm', render: (row) => fmtDate(row.revised_at) },
        { key: 'periode', label: 'Periode', className: 'text-sm', render: (row) => row.closing_period.period_name },
        { key: 'jurnal', label: 'Jurnal', className: 'text-sm font-medium', render: (row) => `${row.journal_type} #${row.journal_id}` },
        { key: 'tipe', label: 'Tipe', render: (row) => <Badge variant="outline" className="capitalize text-xs">{row.action}</Badge> },
        { key: 'user', label: 'User', className: 'text-sm', render: (row) => row.revised_by.name },
        { key: 'nominal', label: 'Nominal', className: 'text-right text-sm font-mono', render: (row) => fmtCurrency(row.impact_amount) },
        { key: 'status', label: 'Status', render: (row) => { const c = statusCfg[row.approval_status] || statusCfg.pending; return <Badge variant={c.variant}>{c.label}</Badge>; } },
        {
            key: 'aksi', label: 'Aksi',
            className: 'text-right',
            render: (row) => (
                <Button variant="ghost" size="sm" onClick={() => router.visit(route('settings.revision-approvals.show', row.id))}>
                    <Eye className="h-4 w-4" />
                </Button>
            ),
        },
    ];

    const filterFields: FilterField[] = [
        { name: 'status', label: 'Status', type: 'select', value: fp.status, options: [{ value: 'pending', label: 'Pending' }, { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Rejected' }] },
        { name: 'period_id', label: 'Periode', type: 'select', value: fp.period_id, options: periods.map((p) => ({ value: p.id.toString(), label: p.period_name })) },
        { name: 'date_from', label: 'Dari Tanggal', type: 'date', value: fp.date_from },
        { name: 'date_to', label: 'Sampai Tanggal', type: 'date', value: fp.date_to },
    ];

    const statCards = [
        { label: 'Pending', sub: 'Menunggu approval', val: statistics.pending_count },
        { label: 'Hari Ini', sub: 'Revisi hari ini', val: statistics.today_count },
        { label: 'Minggu Ini', sub: 'Revisi minggu ini', val: statistics.week_count },
        { label: 'Bulan Ini', sub: 'Revisi bulan ini', val: statistics.month_count },
        { label: 'Nilai Tinggi', sub: '> 10 Juta', val: statistics.high_value_count },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Approval Revisi Jurnal" />
            <div className="p-4 space-y-4">
                {/* Statistics */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    {statCards.map((s) => (
                        <Card key={s.label}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{s.label}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{s.val}</div>
                                <p className="text-xs text-muted-foreground">{s.sub}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Table */}
                <DataTable<RevisionLog>
                    columns={columns}
                    data={revisions.data}
                    pagination={revisions}
                    searchValue=""
                    searchPlaceholder=""
                    onSearch={() => {}}
                    filters={filterFields}
                    onFilterChange={(k, v) => navigate({ ...fp, [k]: v, page: 1 })}
                    onFilterReset={() => navigate({ status: '', period_id: '', date_from: '', date_to: '', page: 1 })}
                    onPageChange={(p) => navigate({ ...fp, page: p })}
                    onPerPageChange={(n) => navigate({ ...fp, perPage: n, page: 1 })}
                    headerActions={
                        selectedIds.length > 0 ? (
                            <Button onClick={handleBulkApprove} className="gap-2">
                                <CheckCircle className="h-4 w-4" />
                                Approve {selectedIds.length} Revisi
                            </Button>
                        ) : undefined
                    }
                    emptyIcon={<FileCheck className="h-8 w-8 text-muted-foreground/50" />}
                    emptyText="Tidak ada revisi ditemukan"
                    rowKey={(r) => r.id}
                />
            </div>
        </AppLayout>
    );
}
