import { useState, FormEvent } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { CheckCircle, XCircle, FileCheck, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { BreadcrumbItem } from '@/types';

interface User {
    id: number;
    name: string;
    email: string;
}

interface ClosingPeriod {
    id: number;
    period_code: string;
    period_name: string;
}

interface JournalDetail {
    id: number;
    akun_id: number;
    kode_akun: string;
    nama_akun: string;
    debit: number;
    kredit: number;
    keterangan: string;
}

interface Journal {
    id: number;
    no_jurnal: string;
    tanggal: string;
    keterangan: string;
    total_debit: number;
    total_kredit: number;
    detail_jurnal: JournalDetail[];
}

interface RevisionLog {
    id: number;
    journal_type: string;
    journal_id: number;
    action: 'create' | 'update' | 'delete';
    old_data: any;
    new_data: any;
    reason: string;
    impact_amount: number;
    approval_status: 'pending' | 'approved' | 'rejected';
    approval_notes: string | null;
    revised_at: string;
    approved_at: string | null;
    revised_by: User;
    approved_by?: User;
    closing_period: ClosingPeriod;
    journal?: Journal;
}

interface Props {
    revision: RevisionLog;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: <FileCheck className="h-4 w-4" />, href: '/settings' },
    { title: 'Approval Revisi', href: '/settings/revision-approvals' },
];

const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
};

export default function ShowRevisionApproval({ revision }: Props) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [approvalNotes, setApprovalNotes] = useState('');
    const [rejectNotes, setRejectNotes] = useState('');
    const [showRejectForm, setShowRejectForm] = useState(false);

    const handleApprove = (e: FormEvent) => {
        e.preventDefault();

        if (confirm('Yakin ingin approve revisi ini?')) {
            setIsProcessing(true);
            router.post(
                route('settings.revision-approvals.approve', revision.id),
                { notes: approvalNotes },
                {
                    onSuccess: () => {
                        toast.success('Revisi berhasil diapprove');
                    },
                    onError: (errors) => {
                        toast.error('Gagal approve revisi');
                        console.error(errors);
                    },
                    onFinish: () => {
                        setIsProcessing(false);
                    },
                }
            );
        }
    };

    const handleReject = (e: FormEvent) => {
        e.preventDefault();

        if (!rejectNotes || rejectNotes.trim().length < 10) {
            toast.error('Alasan reject harus minimal 10 karakter');
            return;
        }

        if (confirm('Yakin ingin reject revisi ini?')) {
            setIsProcessing(true);
            router.post(
                route('settings.revision-approvals.reject', revision.id),
                { notes: rejectNotes },
                {
                    onSuccess: () => {
                        toast.success('Revisi berhasil direject');
                    },
                    onError: (errors) => {
                        toast.error('Gagal reject revisi');
                        console.error(errors);
                    },
                    onFinish: () => {
                        setIsProcessing(false);
                        setShowRejectForm(false);
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

    const renderDataComparison = () => {
        if (revision.action === 'delete') {
            return (
                <Alert variant="destructive">
                    <AlertDescription>
                        <strong>Hapus Jurnal</strong> - Jurnal akan dihapus dari sistem
                    </AlertDescription>
                </Alert>
            );
        }

        if (revision.action === 'create') {
            return (
                <Alert>
                    <AlertDescription>
                        <strong>Buat Jurnal Baru</strong> - Jurnal baru akan ditambahkan
                    </AlertDescription>
                </Alert>
            );
        }

        // For update action, show comparison
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <p className="text-sm font-medium mb-2">Data Lama</p>
                    <pre className="text-xs bg-muted p-3 rounded border overflow-auto max-h-96">
                        {JSON.stringify(revision.old_data, null, 2)}
                    </pre>
                </div>
                <div>
                    <p className="text-sm font-medium mb-2">Data Baru</p>
                    <pre className="text-xs bg-muted p-3 rounded border overflow-auto max-h-96">
                        {JSON.stringify(revision.new_data, null, 2)}
                    </pre>
                </div>
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detail Revisi #${revision.id}`} />

            <div className="flex h-full flex-1 flex-col space-y-8 p-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Detail Revisi #{revision.id}</h2>
                        <div className="flex items-center gap-2 mt-2">
                            {getStatusBadge(revision.approval_status)}
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => router.visit(route('settings.revision-approvals.index'))}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Kembali
                    </Button>
                </div>

                {/* Warning if already processed */}
                {revision.approval_status !== 'pending' && (
                    <Alert>
                        <AlertDescription>
                            Revisi ini sudah <strong>{revision.approval_status}</strong> oleh{' '}
                            <strong>{revision.approved_by?.name}</strong> pada{' '}
                            {revision.approved_at && formatDate(revision.approved_at)}
                        </AlertDescription>
                    </Alert>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Revision Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Informasi Revisi</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Tanggal Revisi</p>
                                        <p className="font-medium">{formatDate(revision.revised_at)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Direvisi Oleh</p>
                                        <p className="font-medium">{revision.revised_by.name}</p>
                                        <p className="text-xs text-muted-foreground">{revision.revised_by.email}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Periode</p>
                                        <p className="font-medium">{revision.closing_period.period_name}</p>
                                        <p className="text-xs text-muted-foreground">{revision.closing_period.period_code}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Impact Nominal</p>
                                        <p className="font-medium text-lg font-mono">{formatCurrency(revision.impact_amount)}</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground">Jurnal</p>
                                    <p className="font-medium">
                                        {revision.journal_type} #{revision.journal_id}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground">Aksi</p>
                                    <Badge variant="outline" className="capitalize text-xs">
                                        {revision.action}
                                    </Badge>
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground mb-2">Alasan Revisi</p>
                                    <div className="text-sm bg-muted p-3 rounded-md border">
                                        {revision.reason}
                                    </div>
                                </div>

                                {revision.approval_notes && (
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-2">Catatan Approval</p>
                                        <div className="text-sm bg-muted p-3 rounded-md border">
                                            {revision.approval_notes}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Data Comparison */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Perbandingan Data</CardTitle>
                                <CardDescription className="text-xs">
                                    {revision.action === 'update' && 'Data lama vs data baru'}
                                    {revision.action === 'delete' && 'Jurnal yang akan dihapus'}
                                    {revision.action === 'create' && 'Jurnal baru yang akan dibuat'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>{renderDataComparison()}</CardContent>
                        </Card>

                        {/* Journal Detail (if exists) */}
                        {revision.journal && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium">Detail Jurnal</CardTitle>
                                    <CardDescription className="text-xs">
                                        {revision.journal.no_jurnal} - {formatDate(revision.journal.tanggal)}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="mb-4">
                                        <p className="text-sm text-muted-foreground">Keterangan</p>
                                        <p className="text-sm">{revision.journal.keterangan}</p>
                                    </div>

                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Akun</TableHead>
                                                <TableHead>Keterangan</TableHead>
                                                <TableHead className="text-right">Debit</TableHead>
                                                <TableHead className="text-right">Kredit</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {revision.journal.detail_jurnal.map((detail) => (
                                                <TableRow key={detail.id}>
                                                    <TableCell>
                                                        <div>
                                                            <p className="font-medium text-sm">{detail.kode_akun}</p>
                                                            <p className="text-xs text-muted-foreground">{detail.nama_akun}</p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-sm">{detail.keterangan}</TableCell>
                                                    <TableCell className="text-right font-mono text-sm">
                                                        {detail.debit > 0 ? formatCurrency(detail.debit) : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono text-sm">
                                                        {detail.kredit > 0 ? formatCurrency(detail.kredit) : '-'}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow className="font-bold bg-muted/50 border-t-2">
                                                <TableCell colSpan={2}>Total</TableCell>
                                                <TableCell className="text-right font-mono">
                                                    {formatCurrency(revision.journal.total_debit)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono">
                                                    {formatCurrency(revision.journal.total_kredit)}
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right Column: Actions */}
                    <div className="space-y-6">
                        {revision.approval_status === 'pending' && (
                            <>
                                {/* Approve Form */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4" />
                                            Approve Revisi
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <form onSubmit={handleApprove} className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="approval_notes" className="text-sm">
                                                    Catatan (Opsional)
                                                </Label>
                                                <Textarea
                                                    id="approval_notes"
                                                    value={approvalNotes}
                                                    onChange={(e) => setApprovalNotes(e.target.value)}
                                                    placeholder="Tambahkan catatan..."
                                                    rows={3}
                                                    className="text-sm"
                                                />
                                            </div>
                                            <Button
                                                type="submit"
                                                className="w-full"
                                                disabled={isProcessing}
                                            >
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                {isProcessing ? 'Memproses...' : 'Approve'}
                                            </Button>
                                        </form>
                                    </CardContent>
                                </Card>

                                {/* Reject Form */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                                            <XCircle className="h-4 w-4" />
                                            Reject Revisi
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {!showRejectForm ? (
                                            <Button
                                                variant="destructive"
                                                className="w-full"
                                                onClick={() => setShowRejectForm(true)}
                                            >
                                                <XCircle className="h-4 w-4 mr-2" />
                                                Reject
                                            </Button>
                                        ) : (
                                            <form onSubmit={handleReject} className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="reject_notes" className="text-sm">
                                                        Alasan Reject <span className="text-destructive">*</span>
                                                    </Label>
                                                    <Textarea
                                                        id="reject_notes"
                                                        value={rejectNotes}
                                                        onChange={(e) => setRejectNotes(e.target.value)}
                                                        placeholder="Jelaskan alasan (min. 10 karakter)..."
                                                        rows={4}
                                                        className="text-sm"
                                                    />
                                                    <p className="text-xs text-muted-foreground">
                                                        {rejectNotes.length} / 10 karakter
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="flex-1"
                                                        onClick={() => setShowRejectForm(false)}
                                                    >
                                                        Batal
                                                    </Button>
                                                    <Button
                                                        type="submit"
                                                        variant="destructive"
                                                        className="flex-1"
                                                        disabled={isProcessing || rejectNotes.trim().length < 10}
                                                    >
                                                        Reject
                                                    </Button>
                                                </div>
                                            </form>
                                        )}
                                    </CardContent>
                                </Card>
                            </>
                        )}

                        {/* Status Info (if already processed) */}
                        {revision.approval_status !== 'pending' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium">Status Approval</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Status</p>
                                        <div className="mt-1">{getStatusBadge(revision.approval_status)}</div>
                                    </div>
                                    {revision.approved_by && (
                                        <>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Diproses Oleh</p>
                                                <p className="font-medium">{revision.approved_by.name}</p>
                                                <p className="text-xs text-muted-foreground">{revision.approved_by.email}</p>
                                            </div>
                                            {revision.approved_at && (
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Tanggal</p>
                                                    <p className="font-medium text-sm">{formatDate(revision.approved_at)}</p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
