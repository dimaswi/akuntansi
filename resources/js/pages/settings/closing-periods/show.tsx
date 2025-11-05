import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    BookOpenCheck,
    Lock,
    Unlock,
    AlertTriangle,
    FileText,
    CheckCircle2,
    Clock,
    AlertCircle,
    Info,
    ArrowLeft,
    Edit3,
} from 'lucide-react';
import { toast } from 'sonner';

interface User {
    id: number;
    name: string;
}

interface RevisionLog {
    id: number;
    journal_type: string;
    journal_id: number;
    action: string;
    reason: string;
    impact_amount: number;
    approval_status: string;
    revised_by: User;
    approved_by?: User;
    revised_at: string;
    approved_at?: string;
}

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
    soft_closed_at: string | null;
    hard_closed_at: string | null;
    reopened_at: string | null;
    soft_closed_by?: User;
    hard_closed_by?: User;
    reopened_by?: User;
    reopen_reason?: string;
    notes?: string;
    statistics: {
        total_journals: number;
        posted_journals: number;
        draft_journals: number;
        total_revisions: number;
        pending_approvals: number;
    };
    recent_revisions: RevisionLog[];
}

interface Props {
    period: ClosingPeriod;
}

export default function ShowClosingPeriod({ period }: Props) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [showReopenDialog, setShowReopenDialog] = useState(false);
    const [reopenReason, setReopenReason] = useState('');

    const getStatusBadge = (status: string) => {
        const badges = {
            open: <Badge className="bg-green-500">Open</Badge>,
            soft_close: <Badge className="bg-yellow-500">Soft Close</Badge>,
            hard_close: <Badge className="bg-red-500">Hard Close</Badge>,
        };
        return badges[status as keyof typeof badges] || badges.open;
    };

    const getApprovalBadge = (status: string) => {
        const badges = {
            pending: <Badge variant="outline" className="border-yellow-500 text-yellow-700">Pending</Badge>,
            approved: <Badge variant="outline" className="border-green-500 text-green-700">Approved</Badge>,
            rejected: <Badge variant="outline" className="border-red-500 text-red-700">Rejected</Badge>,
        };
        return badges[status as keyof typeof badges];
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const handleSoftClose = () => {
        if (period.statistics.draft_journals > 0) {
            toast.error('Tidak bisa soft close: masih ada jurnal draft');
            return;
        }

        if (confirm('Yakin ingin soft close periode ini? Jurnal masih bisa diedit dengan persetujuan.')) {
            setIsProcessing(true);
            router.post(
                route('settings.closing-periods.soft-close', period.id),
                {},
                {
                    onSuccess: () => {
                        toast.success('Periode berhasil di-soft close');
                    },
                    onError: (errors) => {
                        toast.error('Gagal soft close periode');
                        console.error(errors);
                    },
                    onFinish: () => {
                        setIsProcessing(false);
                    },
                }
            );
        }
    };

    const handleHardClose = () => {
        if (period.statistics.pending_approvals > 0) {
            toast.error('Tidak bisa hard close: masih ada pending approval');
            return;
        }

        if (confirm('Yakin ingin hard close periode ini? Jurnal TIDAK BISA diedit setelah hard close!')) {
            setIsProcessing(true);
            router.post(
                route('settings.closing-periods.hard-close', period.id),
                {},
                {
                    onSuccess: () => {
                        toast.success('Periode berhasil di-hard close');
                    },
                    onError: (errors) => {
                        toast.error('Gagal hard close periode');
                        console.error(errors);
                    },
                    onFinish: () => {
                        setIsProcessing(false);
                    },
                }
            );
        }
    };

    const handleReopen = () => {
        if (!reopenReason || reopenReason.trim().length < 20) {
            toast.error('Alasan harus minimal 20 karakter');
            return;
        }

        setIsProcessing(true);
        router.post(
            route('settings.closing-periods.reopen', period.id),
            { reason: reopenReason },
            {
                onSuccess: () => {
                    toast.success('Periode berhasil dibuka kembali');
                    setShowReopenDialog(false);
                    setReopenReason('');
                },
                onError: (errors) => {
                    toast.error('Gagal membuka periode');
                    console.error(errors);
                },
                onFinish: () => {
                    setIsProcessing(false);
                },
            }
        );
    };

    return (
        <AppLayout>
            <Head title={`Detail Periode: ${period.period_name}`} />

            <div className="p-6">
                {/* Breadcrumb */}
                <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
                    <BookOpenCheck className="h-4 w-4" />
                    <span>Periode Tutup Buku</span>
                    <span>/</span>
                    <span className="text-foreground">{period.period_name}</span>
                </div>

                {/* Header */}
                <div className="mb-6 flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">{period.period_name}</h1>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-sm text-muted-foreground">{period.period_code}</span>
                            <span className="text-muted-foreground">•</span>
                            {getStatusBadge(period.status)}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {period.status === 'open' && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.visit(route('settings.closing-periods.edit', period.id))}
                            >
                                <Edit3 className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.visit(route('settings.closing-periods.list'))}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Kembali
                        </Button>
                    </div>
                </div>

                {/* Warning for Draft Journals */}
                {period.status === 'open' && period.statistics.draft_journals > 0 && (
                    <div className="mb-6 flex items-start gap-3 rounded-md border border-amber-500/50 bg-amber-50/50 p-4">
                        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-medium text-amber-900">
                                Periode ini memiliki <strong>{period.statistics.draft_journals} jurnal draft</strong>
                            </p>
                            <p className="text-amber-700 mt-1">Posting semua jurnal sebelum soft close.</p>
                        </div>
                    </div>
                )}

                {/* Warning for Pending Approvals */}
                {period.status === 'soft_close' && period.statistics.pending_approvals > 0 && (
                    <div className="mb-6 flex items-start gap-3 rounded-md border border-orange-500/50 bg-orange-50/50 p-4">
                        <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-medium text-orange-900">
                                Periode ini memiliki <strong>{period.statistics.pending_approvals} pending approval</strong>
                            </p>
                            <p className="text-orange-700 mt-1">Approve semua revisi sebelum hard close.</p>
                        </div>
                    </div>
                )}

                {/* Info - Reopen Reason */}
                {period.reopen_reason && (
                    <div className="mb-6 flex items-start gap-3 rounded-md border bg-muted/50 p-4">
                        <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="text-sm text-muted-foreground">
                            <p className="font-medium text-foreground">Alasan Reopen:</p>
                            <p className="mt-1">{period.reopen_reason}</p>
                            {period.reopened_by && (
                                <p className="mt-1 text-xs">
                                    Oleh: {period.reopened_by.name} • {formatDate(period.reopened_at!)}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Details & Stats */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Period Information */}
                        <div className="rounded-md border bg-card p-6">
                            <h3 className="font-medium mb-4">Informasi Periode</h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Tipe Periode</p>
                                        <p className="font-medium capitalize">{period.period_type}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Kode Periode</p>
                                        <p className="font-medium">{period.period_code}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Tanggal Mulai</p>
                                        <p className="font-medium">{formatDate(period.period_start)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Tanggal Selesai</p>
                                        <p className="font-medium">{formatDate(period.period_end)}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Cutoff Date (Soft Close)</p>
                                        <p className="font-medium">{formatDate(period.cutoff_date)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Hard Close Date</p>
                                        <p className="font-medium">
                                            {period.hard_close_date ? formatDate(period.hard_close_date) : '-'}
                                        </p>
                                    </div>
                                </div>

                                {period.notes && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Catatan</p>
                                        <p className="text-sm">{period.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Statistics - Compact Grid */}
                        <div className="rounded-md border bg-card p-6">
                            <h3 className="font-medium mb-4">Statistik Jurnal</h3>
                            <div className="grid grid-cols-5 gap-4">
                                <div className="text-center">
                                    <FileText className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                                    <p className="text-lg font-semibold">{period.statistics.total_journals}</p>
                                    <p className="text-xs text-muted-foreground">Total</p>
                                </div>
                                <div className="text-center">
                                    <CheckCircle2 className="h-6 w-6 mx-auto mb-1 text-emerald-600" />
                                    <p className="text-lg font-semibold">{period.statistics.posted_journals}</p>
                                    <p className="text-xs text-muted-foreground">Posted</p>
                                </div>
                                <div className="text-center">
                                    <Clock className="h-6 w-6 mx-auto mb-1 text-amber-600" />
                                    <p className="text-lg font-semibold">{period.statistics.draft_journals}</p>
                                    <p className="text-xs text-muted-foreground">Draft</p>
                                </div>
                                <div className="text-center">
                                    <FileText className="h-6 w-6 mx-auto mb-1 text-blue-600" />
                                    <p className="text-lg font-semibold">{period.statistics.total_revisions}</p>
                                    <p className="text-xs text-muted-foreground">Revisi</p>
                                </div>
                                <div className="text-center">
                                    <AlertCircle className="h-6 w-6 mx-auto mb-1 text-orange-600" />
                                    <p className="text-lg font-semibold">{period.statistics.pending_approvals}</p>
                                    <p className="text-xs text-muted-foreground">Pending</p>
                                </div>
                            </div>
                        </div>

                        {/* Recent Revisions */}
                        {period.recent_revisions.length > 0 && (
                            <div className="rounded-md border bg-card p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="font-medium">Revisi Terakhir</h3>
                                        <p className="text-sm text-muted-foreground">10 revisi terbaru pada periode ini</p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => router.visit(route('settings.revision-approvals.index', { period_id: period.id }))}
                                    >
                                        Lihat Semua
                                    </Button>
                                </div>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Tanggal</TableHead>
                                            <TableHead>Jurnal</TableHead>
                                            <TableHead>Aksi</TableHead>
                                            <TableHead>User</TableHead>
                                            <TableHead className="text-right">Nominal</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {period.recent_revisions.map((revision) => (
                                            <TableRow key={revision.id}>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {formatDate(revision.revised_at)}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {revision.journal_type} #{revision.journal_id}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="capitalize">
                                                        {revision.action}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {revision.revised_by.name}
                                                </TableCell>
                                                <TableCell className="text-sm text-right font-medium">
                                                    {formatCurrency(revision.impact_amount)}
                                                </TableCell>
                                                <TableCell>
                                                    {getApprovalBadge(revision.approval_status)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Actions & History */}
                    <div className="space-y-6">
                        {/* Actions */}
                        <div className="rounded-md border bg-card p-6">
                            <h3 className="font-medium mb-4">Aksi</h3>
                            <div className="space-y-3">
                                {period.status === 'open' && (
                                    <Button
                                        className="w-full"
                                        onClick={handleSoftClose}
                                        disabled={isProcessing || period.statistics.draft_journals > 0}
                                    >
                                        <Lock className="h-4 w-4 mr-2" />
                                        Soft Close Periode
                                    </Button>
                                )}

                                {period.status === 'soft_close' && (
                                    <Button
                                        className="w-full bg-orange-600 hover:bg-orange-700"
                                        onClick={handleHardClose}
                                        disabled={isProcessing || period.statistics.pending_approvals > 0}
                                    >
                                        <Lock className="h-4 w-4 mr-2" />
                                        Hard Close Periode
                                    </Button>
                                )}

                                {period.status !== 'open' && (
                                    <Button
                                        className="w-full"
                                        variant="outline"
                                        onClick={() => setShowReopenDialog(true)}
                                        disabled={isProcessing}
                                    >
                                        <Unlock className="h-4 w-4 mr-2" />
                                        Buka Kembali Periode
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Status History */}
                        <div className="rounded-md border bg-card p-6">
                            <h3 className="font-medium mb-4">Riwayat Status</h3>
                            <div className="space-y-3">
                                {period.soft_closed_at && (
                                    <div className="border-l-2 border-amber-500 pl-3">
                                        <p className="text-sm font-medium">Soft Close</p>
                                        <p className="text-xs text-muted-foreground">{formatDate(period.soft_closed_at)}</p>
                                        {period.soft_closed_by && (
                                            <p className="text-xs text-muted-foreground">Oleh: {period.soft_closed_by.name}</p>
                                        )}
                                    </div>
                                )}

                                {period.hard_closed_at && (
                                    <div className="border-l-2 border-red-500 pl-3">
                                        <p className="text-sm font-medium">Hard Close</p>
                                        <p className="text-xs text-muted-foreground">{formatDate(period.hard_closed_at)}</p>
                                        {period.hard_closed_by && (
                                            <p className="text-xs text-muted-foreground">Oleh: {period.hard_closed_by.name}</p>
                                        )}
                                    </div>
                                )}

                                {period.reopened_at && (
                                    <div className="border-l-2 border-emerald-500 pl-3">
                                        <p className="text-sm font-medium">Dibuka Kembali</p>
                                        <p className="text-xs text-muted-foreground">{formatDate(period.reopened_at)}</p>
                                        {period.reopened_by && (
                                            <p className="text-xs text-muted-foreground">Oleh: {period.reopened_by.name}</p>
                                        )}
                                    </div>
                                )}

                                {!period.soft_closed_at && (
                                    <p className="text-sm text-muted-foreground italic">Periode masih open</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reopen Dialog */}
            <Dialog open={showReopenDialog} onOpenChange={setShowReopenDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Buka Kembali Periode</DialogTitle>
                        <DialogDescription>
                            Masukkan alasan membuka kembali periode yang sudah ditutup (minimal 20 karakter).
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="reopen_reason">Alasan <span className="text-red-500">*</span></Label>
                            <Textarea
                                id="reopen_reason"
                                value={reopenReason}
                                onChange={(e) => setReopenReason(e.target.value)}
                                placeholder="Contoh: Terdapat kesalahan material pada jurnal penyesuaian bulan Desember yang perlu diperbaiki segera..."
                                rows={4}
                            />
                            <p className="text-xs text-gray-500">
                                {reopenReason.length} / 20 karakter minimum
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowReopenDialog(false)}
                            disabled={isProcessing}
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={handleReopen}
                            disabled={isProcessing || reopenReason.trim().length < 20}
                        >
                            {isProcessing ? 'Memproses...' : 'Buka Periode'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
