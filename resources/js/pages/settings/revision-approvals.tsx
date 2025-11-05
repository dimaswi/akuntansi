import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
    CheckCircle2, 
    XCircle, 
    Clock, 
    FileText, 
    AlertCircle,
    Eye,
    ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface RevisionLog {
    id: number;
    jurnal_id: number;
    jurnal: {
        nomor_jurnal: string;
        tanggal_transaksi: string;
        keterangan: string;
    };
    closing_period: {
        period_name: string;
        status: string;
    };
    revision_type: 'edit' | 'delete' | 'unpost' | 'reverse';
    revision_reason: string;
    impact_amount: number;
    requested_by_user: {
        name: string;
    };
    request_date: string;
    approval_status: 'pending' | 'approved' | 'rejected' | 'auto_approved';
    approved_by_user?: {
        name: string;
    };
    approval_date?: string;
    approval_notes?: string;
}

interface Props {
    revisions: {
        data: RevisionLog[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    stats: {
        pending: number;
        approved: number;
        rejected: number;
    };
    filters: {
        status: string;
        search: string;
    };
}

export default function RevisionApprovals({ revisions, stats, filters }: Props) {
    const [selectedRevision, setSelectedRevision] = useState<RevisionLog | null>(null);
    const [showDetailDialog, setShowDetailDialog] = useState(false);
    const [showApproveDialog, setShowApproveDialog] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [approvalNotes, setApprovalNotes] = useState('');
    const [processing, setProcessing] = useState(false);
    const [activeTab, setActiveTab] = useState(filters.status || 'pending');

    const revisionTypeLabels = {
        edit: 'Edit',
        delete: 'Hapus',
        unpost: 'Unpost',
        reverse: 'Reverse',
    };

    const statusBadgeVariant = (status: string) => {
        switch (status) {
            case 'pending':
                return 'default';
            case 'approved':
                return 'default';
            case 'rejected':
                return 'destructive';
            case 'auto_approved':
                return 'secondary';
            default:
                return 'default';
        }
    };

    const handleViewDetail = (revision: RevisionLog) => {
        setSelectedRevision(revision);
        setShowDetailDialog(true);
    };

    const handleApprove = (revision: RevisionLog) => {
        setSelectedRevision(revision);
        setApprovalNotes('');
        setShowApproveDialog(true);
    };

    const handleReject = (revision: RevisionLog) => {
        setSelectedRevision(revision);
        setApprovalNotes('');
        setShowRejectDialog(true);
    };

    const submitApproval = () => {
        if (!selectedRevision) return;

        setProcessing(true);
        router.post(
            route('settings.revision-approvals.approve', selectedRevision.id),
            { notes: approvalNotes },
            {
                onSuccess: () => {
                    setShowApproveDialog(false);
                    setSelectedRevision(null);
                    setApprovalNotes('');
                },
                onFinish: () => setProcessing(false),
            }
        );
    };

    const submitRejection = () => {
        if (!selectedRevision) return;

        if (!approvalNotes.trim()) {
            alert('Alasan penolakan harus diisi');
            return;
        }

        setProcessing(true);
        router.post(
            route('settings.revision-approvals.reject', selectedRevision.id),
            { notes: approvalNotes },
            {
                onSuccess: () => {
                    setShowRejectDialog(false);
                    setSelectedRevision(null);
                    setApprovalNotes('');
                },
                onFinish: () => setProcessing(false),
            }
        );
    };

    const handleFilterChange = (status: string) => {
        setActiveTab(status);
        router.get(
            route('settings.revision-approvals.index'),
            { status, search: filters.search },
            { preserveState: true, preserveScroll: true }
        );
    };

    const tabButtons = [
        { value: 'pending', label: `Pending (${stats.pending})` },
        { value: 'approved', label: `Approved (${stats.approved})` },
        { value: 'rejected', label: `Rejected (${stats.rejected})` },
        { value: 'all', label: 'Semua' },
    ];

    return (
        <AppLayout>
            <Head title="Approval Revisi Jurnal" />

            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold">Approval Revisi Jurnal</h1>
                    <p className="text-muted-foreground mt-2">
                        Kelola permintaan revisi jurnal pada periode tertutup
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Menunggu Approval
                            </CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.pending}</div>
                            <p className="text-xs text-muted-foreground">
                                Permintaan pending
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Disetujui
                            </CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.approved}</div>
                            <p className="text-xs text-muted-foreground">
                                Total approved
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Ditolak
                            </CardTitle>
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.rejected}</div>
                            <p className="text-xs text-muted-foreground">
                                Total rejected
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Daftar Permintaan Revisi</CardTitle>
                        <CardDescription>
                            Tinjau dan kelola permintaan revisi jurnal
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Tab Buttons */}
                        <div className="flex border-b mb-4">
                            {tabButtons.map((tab) => (
                                <button
                                    key={tab.value}
                                    className={`px-4 py-2 -mb-px border-b-2 font-medium focus:outline-none transition-colors ${
                                        activeTab === tab.value
                                            ? "border-blue-600 text-blue-600"
                                            : "border-transparent text-gray-500 hover:text-blue-600"
                                    }`}
                                    onClick={() => handleFilterChange(tab.value)}
                                    type="button"
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="mt-4">
                            {revisions.data.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                        <p>Tidak ada data</p>
                                    </div>
                                ) : (
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Tanggal</TableHead>
                                                    <TableHead>No. Jurnal</TableHead>
                                                    <TableHead>Periode</TableHead>
                                                    <TableHead>Tipe</TableHead>
                                                    <TableHead>Pemohon</TableHead>
                                                    <TableHead>Impact</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead className="text-right">Aksi</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {revisions.data.map((revision) => (
                                                    <TableRow key={revision.id}>
                                                        <TableCell>
                                                            {format(new Date(revision.request_date), 'dd MMM yyyy HH:mm', { locale: id })}
                                                        </TableCell>
                                                        <TableCell className="font-medium">
                                                            {revision.jurnal.nomor_jurnal}
                                                        </TableCell>
                                                        <TableCell>
                                                            {revision.closing_period.period_name}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline">
                                                                {revisionTypeLabels[revision.revision_type]}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            {revision.requested_by_user.name}
                                                        </TableCell>
                                                        <TableCell>
                                                            Rp {revision.impact_amount.toLocaleString('id-ID')}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant={statusBadgeVariant(revision.approval_status)}>
                                                                {revision.approval_status === 'pending' && 'Pending'}
                                                                {revision.approval_status === 'approved' && 'Approved'}
                                                                {revision.approval_status === 'rejected' && 'Rejected'}
                                                                {revision.approval_status === 'auto_approved' && 'Auto'}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleViewDetail(revision)}
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                                {revision.approval_status === 'pending' && (
                                                                    <>
                                                                        <Button
                                                                            variant="default"
                                                                            size="sm"
                                                                            onClick={() => handleApprove(revision)}
                                                                        >
                                                                            <CheckCircle2 className="h-4 w-4 mr-1" />
                                                                            Approve
                                                                        </Button>
                                                                        <Button
                                                                            variant="destructive"
                                                                            size="sm"
                                                                            onClick={() => handleReject(revision)}
                                                                        >
                                                                            <XCircle className="h-4 w-4 mr-1" />
                                                                            Reject
                                                                        </Button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </div>
                    </CardContent>
                </Card>
            </div>

            {/* Detail Dialog */}
            <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Detail Permintaan Revisi</DialogTitle>
                    </DialogHeader>
                    {selectedRevision && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-muted-foreground">No. Jurnal</Label>
                                    <p className="font-medium">{selectedRevision.jurnal.nomor_jurnal}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Tanggal Transaksi</Label>
                                    <p className="font-medium">
                                        {format(new Date(selectedRevision.jurnal.tanggal_transaksi), 'dd MMMM yyyy', { locale: id })}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Periode</Label>
                                    <p className="font-medium">{selectedRevision.closing_period.period_name}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Tipe Revisi</Label>
                                    <p className="font-medium">{revisionTypeLabels[selectedRevision.revision_type]}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Pemohon</Label>
                                    <p className="font-medium">{selectedRevision.requested_by_user.name}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Tanggal Permintaan</Label>
                                    <p className="font-medium">
                                        {format(new Date(selectedRevision.request_date), 'dd MMMM yyyy HH:mm', { locale: id })}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <Label className="text-muted-foreground">Keterangan Jurnal</Label>
                                <p className="font-medium">{selectedRevision.jurnal.keterangan}</p>
                            </div>

                            <div>
                                <Label className="text-muted-foreground">Alasan Revisi</Label>
                                <div className="mt-1 rounded-md border bg-muted/50 p-3">
                                    <p>{selectedRevision.revision_reason}</p>
                                </div>
                            </div>

                            <div>
                                <Label className="text-muted-foreground">Impact Amount</Label>
                                <p className="text-lg font-bold">
                                    Rp {selectedRevision.impact_amount.toLocaleString('id-ID')}
                                </p>
                            </div>

                            {selectedRevision.approval_status !== 'pending' && (
                                <div className="border-t pt-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-muted-foreground">Status</Label>
                                            <Badge variant={statusBadgeVariant(selectedRevision.approval_status)} className="mt-1">
                                                {selectedRevision.approval_status === 'approved' && 'Disetujui'}
                                                {selectedRevision.approval_status === 'rejected' && 'Ditolak'}
                                            </Badge>
                                        </div>
                                        {selectedRevision.approved_by_user && (
                                            <div>
                                                <Label className="text-muted-foreground">Oleh</Label>
                                                <p className="font-medium">{selectedRevision.approved_by_user.name}</p>
                                            </div>
                                        )}
                                    </div>
                                    {selectedRevision.approval_notes && (
                                        <div className="mt-4">
                                            <Label className="text-muted-foreground">Catatan</Label>
                                            <div className="mt-1 rounded-md border bg-muted/50 p-3">
                                                <p>{selectedRevision.approval_notes}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Approve Dialog */}
            <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Approve Revisi</DialogTitle>
                        <DialogDescription>
                            Anda akan menyetujui permintaan revisi ini. Jurnal akan diubah sesuai permintaan.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="approve-notes">Catatan (Opsional)</Label>
                            <Textarea
                                id="approve-notes"
                                placeholder="Tambahkan catatan jika diperlukan..."
                                value={approvalNotes}
                                onChange={(e) => setApprovalNotes(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowApproveDialog(false)}
                            disabled={processing}
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={submitApproval}
                            disabled={processing}
                        >
                            {processing ? 'Memproses...' : 'Approve'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Revisi</DialogTitle>
                        <DialogDescription>
                            Anda akan menolak permintaan revisi ini. Jurnal tidak akan diubah.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="reject-notes">
                                Alasan Penolakan <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="reject-notes"
                                placeholder="Jelaskan alasan penolakan..."
                                value={approvalNotes}
                                onChange={(e) => setApprovalNotes(e.target.value)}
                                rows={3}
                                className={!approvalNotes.trim() ? 'border-red-500' : ''}
                            />
                            <p className="text-sm text-muted-foreground mt-1">
                                Alasan penolakan wajib diisi
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowRejectDialog(false)}
                            disabled={processing}
                        >
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={submitRejection}
                            disabled={processing || !approvalNotes.trim()}
                        >
                            {processing ? 'Memproses...' : 'Reject'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
