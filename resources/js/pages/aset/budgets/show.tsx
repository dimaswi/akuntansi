import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowRightLeft, CheckCircle, Edit3, FileText, Landmark, Send, ShoppingCart, Trash2 } from 'lucide-react';
import { route } from 'ziggy-js';

interface Realization {
    id: number;
    quantity: number;
    actual_cost: number;
    realization_date: string;
    notes?: string;
    asset?: { id: number; code: string; name: string };
    creator?: { id: number; name: string };
}

interface BudgetItem {
    id: number;
    item_name: string;
    description?: string;
    quantity: number;
    estimated_unit_cost: number;
    estimated_total_cost: number;
    priority: string;
    status: string;
    realized_quantity: number;
    realized_amount: number;
    realized_at?: string;
    rolled_from_id?: number;
    notes?: string;
    category?: { id: number; name: string };
    department?: { id: number; name: string };
    realizations: Realization[];
    rolled_from?: {
        id: number;
        budget?: { id: number; code: string; fiscal_year: number };
    };
}

interface Budget {
    id: number;
    code: string;
    fiscal_year: number;
    title: string;
    description?: string;
    total_budget: number;
    total_realized: number;
    status: string;
    items: BudgetItem[];
    creator?: { id: number; name: string };
    submitter?: { id: number; name: string };
    approver?: { id: number; name: string };
    submitted_at?: string;
    approved_at?: string;
    created_at: string;
}

interface Props extends SharedData {
    budget: Budget;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: <Landmark className="h-4 w-4" />, href: route('aset.dashboard') },
    { title: 'RAB Aset', href: route('aset.budgets.index') },
    { title: 'Detail', href: '#' },
];

const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
const fmtShortDate = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: string }> = {
    draft: { label: 'Draft', variant: 'secondary', icon: '📝' },
    submitted: { label: 'Diajukan', variant: 'outline', icon: '📤' },
    approved: { label: 'Disetujui', variant: 'default', icon: '✅' },
    closed: { label: 'Ditutup', variant: 'destructive', icon: '🔒' },
};

const itemStatusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending: { label: 'Pending', variant: 'outline' },
    partially_realized: { label: 'Sebagian', variant: 'secondary' },
    realized: { label: 'Terpenuhi', variant: 'default' },
    rolled_over: { label: 'Rollover', variant: 'destructive' },
    cancelled: { label: 'Dibatalkan', variant: 'destructive' },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
    high: { label: 'Tinggi', color: 'text-red-600' },
    medium: { label: 'Sedang', color: 'text-yellow-600' },
    low: { label: 'Rendah', color: 'text-green-600' },
};

export default function ShowBudget() {
    const { budget } = usePage<Props>().props;
    const st = statusConfig[budget.status];
    const pct = budget.total_budget > 0 ? (budget.total_realized / budget.total_budget) * 100 : 0;

    const handleSubmit = () => {
        router.post(route('aset.budgets.submit', budget.id), {}, {
        });
    };

    const handleApprove = () => {
        router.post(route('aset.budgets.approve', budget.id), {}, {
        });
    };

    const handleDelete = () => {
        if (!confirm('Yakin ingin menghapus RAB ini?')) return;
        router.delete(route('aset.budgets.destroy', budget.id));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`RAB ${budget.code}`} />
            <div className="space-y-6 p-4">
                {/* Header */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Button type="button" variant="outline" onClick={() => router.visit(route('aset.budgets.index'))}>
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-xl">{budget.code}</CardTitle>
                                        <CardDescription>{budget.title}</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={st?.variant} className="text-sm">
                                            {st?.icon} {st?.label}
                                        </Badge>
                                        {budget.status === 'draft' && (
                                            <>
                                                <Button variant="outline" size="sm" onClick={() => router.visit(route('aset.budgets.edit', budget.id))}>
                                                    <Edit3 className="mr-1 h-4 w-4" />Edit
                                                </Button>
                                                <Button size="sm" onClick={handleSubmit}>
                                                    <Send className="mr-1 h-4 w-4" />Ajukan
                                                </Button>
                                                <Button variant="destructive" size="sm" onClick={handleDelete}>
                                                    <Trash2 className="mr-1 h-4 w-4" />Hapus
                                                </Button>
                                            </>
                                        )}
                                        {budget.status === 'submitted' && (
                                            <Button size="sm" onClick={handleApprove}>
                                                <CheckCircle className="mr-1 h-4 w-4" />Setujui
                                            </Button>
                                        )}
                                        {(budget.status === 'approved' || budget.status === 'closed') &&
                                            budget.items.some((i) => ['pending', 'partially_realized'].includes(i.status)) && (
                                            <Button variant="outline" size="sm" onClick={() => router.visit(route('aset.budgets.rollover', budget.id))}>
                                                <ArrowRightLeft className="mr-1 h-4 w-4" />Rollover
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Tahun Anggaran</p>
                                <p className="text-2xl font-bold">{budget.fiscal_year}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Anggaran</p>
                                <p className="text-lg font-bold">{fmtCurrency(budget.total_budget)}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Terealisasi</p>
                                <p className="text-lg font-bold text-green-600">{fmtCurrency(budget.total_realized)}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Sisa Anggaran</p>
                                <p className="text-lg font-bold text-orange-600">{fmtCurrency(budget.total_budget - budget.total_realized)}</p>
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-muted-foreground">Progress Realisasi</span>
                                <span className="text-sm font-medium">{pct.toFixed(1)}%</span>
                            </div>
                            <Progress value={pct} className="h-3" />
                        </div>
                        {budget.description && (
                            <p className="mt-4 text-sm text-muted-foreground">{budget.description}</p>
                        )}
                        <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                            {budget.creator && <span>Dibuat oleh: <strong>{budget.creator.name}</strong></span>}
                            {budget.submitter && <span>Diajukan oleh: <strong>{budget.submitter.name}</strong> ({budget.submitted_at ? fmtShortDate(budget.submitted_at) : ''})</span>}
                            {budget.approver && <span>Disetujui oleh: <strong>{budget.approver.name}</strong> ({budget.approved_at ? fmtShortDate(budget.approved_at) : ''})</span>}
                        </div>
                    </CardContent>
                </Card>

                {/* Items Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Daftar Item RAB ({budget.items.length} item)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-10">#</TableHead>
                                        <TableHead>Nama Barang</TableHead>
                                        <TableHead>Kategori</TableHead>
                                        <TableHead>Departemen</TableHead>
                                        <TableHead className="text-center">Prioritas</TableHead>
                                        <TableHead className="text-center">Qty</TableHead>
                                        <TableHead className="text-right">Estimasi</TableHead>
                                        <TableHead className="text-center">Realisasi</TableHead>
                                        <TableHead className="text-right">Biaya Aktual</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                        {budget.status === 'approved' && <TableHead className="text-center">Aksi</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {budget.items.map((item, idx) => {
                                        const iSt = itemStatusConfig[item.status];
                                        const pr = priorityConfig[item.priority];
                                        const canRealize = budget.status === 'approved' && ['pending', 'partially_realized'].includes(item.status);
                                        return (
                                            <TableRow key={item.id}>
                                                <TableCell className="text-center font-mono">{idx + 1}</TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{item.item_name}</p>
                                                        {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                                                        {item.rolled_from && (
                                                            <p className="text-xs text-blue-500">Rollover dari {item.rolled_from.budget?.code}</p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{item.category?.name ?? '-'}</TableCell>
                                                <TableCell>{item.department?.name ?? '-'}</TableCell>
                                                <TableCell className="text-center">
                                                    <span className={`text-sm font-medium ${pr?.color}`}>{pr?.label}</span>
                                                </TableCell>
                                                <TableCell className="text-center">{item.quantity}</TableCell>
                                                <TableCell className="text-right">{fmtCurrency(item.estimated_total_cost)}</TableCell>
                                                <TableCell className="text-center">
                                                    <span className="font-medium">{item.realized_quantity}/{item.quantity}</span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {item.realized_amount > 0 ? fmtCurrency(item.realized_amount) : '-'}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <Badge variant={iSt?.variant}>{iSt?.label}</Badge>
                                                        {item.realized_at && (
                                                            <span className="text-xs text-green-600">{fmtShortDate(item.realized_at)}</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                {budget.status === 'approved' && (
                                                    <TableCell className="text-center">
                                                        {canRealize && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => router.visit(route('aset.budgets.realize', item.id))}
                                                            >
                                                                <ShoppingCart className="mr-1 h-3 w-3" />
                                                                Realisasi
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        );
                                    })}
                                    {budget.items.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={11} className="py-8 text-center text-muted-foreground">
                                                Belum ada item
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Realization History */}
                {budget.items.some((i) => i.realizations.length > 0) && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShoppingCart className="h-5 w-5" />
                                Riwayat Realisasi
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead>Item RAB</TableHead>
                                        <TableHead className="text-center">Qty</TableHead>
                                        <TableHead className="text-right">Biaya Aktual</TableHead>
                                        <TableHead>Aset Terbentuk</TableHead>
                                        <TableHead>Oleh</TableHead>
                                        <TableHead>Catatan</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {budget.items
                                        .flatMap((item) =>
                                            item.realizations.map((r) => ({ ...r, itemName: item.item_name }))
                                        )
                                        .sort((a, b) => new Date(b.realization_date).getTime() - new Date(a.realization_date).getTime())
                                        .map((r) => (
                                            <TableRow key={r.id}>
                                                <TableCell>{fmtShortDate(r.realization_date)}</TableCell>
                                                <TableCell className="font-medium">{r.itemName}</TableCell>
                                                <TableCell className="text-center">{r.quantity}</TableCell>
                                                <TableCell className="text-right">{fmtCurrency(r.actual_cost)}</TableCell>
                                                <TableCell>
                                                    {r.asset ? (
                                                        <Button
                                                            variant="link"
                                                            size="sm"
                                                            className="h-auto p-0"
                                                            onClick={() => router.visit(route('aset.assets.show', r.asset!.id))}
                                                        >
                                                            {r.asset.code} - {r.asset.name}
                                                        </Button>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>{r.creator?.name ?? '-'}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">{r.notes ?? '-'}</TableCell>
                                            </TableRow>
                                        ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
