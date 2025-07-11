import React from 'react';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
    Calendar, 
    Clock, 
    CheckCircle, 
    AlertTriangle,
    ArrowLeft,
    Lock,
    Unlock,
    User,
    FileText,
    TrendingUp
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';

interface MonthlyClosing {
    id: number;
    periode_tahun: number;
    periode_bulan: number;
    periode: string;
    tanggal_cut_off: string;
    status: 'draft' | 'pending_approval' | 'approved' | 'closed' | 'reopened';
    keterangan?: string;
    initiated_by: {
        id: number;
        name: string;
    };
    approved_by?: {
        id: number;
        name: string;
    };
    closed_at?: string;
    reopened_at?: string;
    created_at: string;
    updated_at: string;
}

interface ShowMonthlyClosingProps {
    monthlyClosing: MonthlyClosing;
    canApprove: boolean;
    canClose: boolean;
    canReopen: boolean;
    transactionSummary: {
        cash_transactions: number;
        bank_transactions: number;
        giro_transactions: number;
        total_transactions: number;
        total_amount: number;
    };
}

const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function ShowMonthlyClosing({ 
    monthlyClosing,
    canApprove,
    canClose,
    canReopen,
    transactionSummary
}: ShowMonthlyClosingProps) {
    
    const breadcrumbItems: BreadcrumbItem[] = [
        {
            title: <Calendar className="h-4 w-4" />,
            href: '/akuntansi',
        },
        {
            title: 'Akuntansi',
            href: '/akuntansi',
        },
        {
            title: 'Monthly Closing',
            href: '/monthly-closing',
        },
        {
            title: monthlyClosing.periode,
            href: '#',
        },
    ];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'draft':
                return <Badge variant="outline" className="text-gray-600 border-gray-300"><FileText className="w-3 h-3 mr-1" /> Draft</Badge>;
            case 'pending_approval':
                return <Badge variant="outline" className="text-yellow-600 border-yellow-300"><Clock className="w-3 h-3 mr-1" /> Pending Approval</Badge>;
            case 'approved':
                return <Badge variant="outline" className="text-blue-600 border-blue-300"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
            case 'closed':
                return <Badge variant="outline" className="text-green-600 border-green-300"><Lock className="w-3 h-3 mr-1" /> Closed</Badge>;
            case 'reopened':
                return <Badge variant="outline" className="text-orange-600 border-orange-300"><Unlock className="w-3 h-3 mr-1" /> Reopened</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const handleApprove = () => {
        if (confirm('Apakah Anda yakin ingin menyetujui monthly closing ini?')) {
            router.patch(`/monthly-closing/${monthlyClosing.id}/approve`);
        }
    };

    const handleClose = () => {
        if (confirm('Apakah Anda yakin ingin menutup periode ini? Tindakan ini tidak dapat dibatalkan.')) {
            router.patch(`/monthly-closing/${monthlyClosing.id}/close`);
        }
    };

    const handleReopen = () => {
        if (confirm('Apakah Anda yakin ingin membuka kembali periode ini?')) {
            router.patch(`/monthly-closing/${monthlyClosing.id}/reopen`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbItems}>
            <Head title={`Monthly Closing - ${monthlyClosing.periode}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.get('/monthly-closing')}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">{monthlyClosing.periode}</h1>
                            <p className="text-gray-600">
                                Monthly closing details dan status
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {getStatusBadge(monthlyClosing.status)}
                    </div>
                </div>

                {/* Actions */}
                {(canApprove || canClose || canReopen) && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Actions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2">
                                {canApprove && monthlyClosing.status === 'pending_approval' && (
                                    <Button onClick={handleApprove} className="bg-blue-600 hover:bg-blue-700">
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Approve
                                    </Button>
                                )}
                                {canClose && monthlyClosing.status === 'approved' && (
                                    <Button onClick={handleClose} className="bg-green-600 hover:bg-green-700">
                                        <Lock className="h-4 w-4 mr-2" />
                                        Close Period
                                    </Button>
                                )}
                                {canReopen && monthlyClosing.status === 'closed' && (
                                    <Button onClick={handleReopen} variant="outline" className="border-orange-300 text-orange-600 hover:bg-orange-50">
                                        <Unlock className="h-4 w-4 mr-2" />
                                        Reopen Period
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Status Alert */}
                {monthlyClosing.status === 'closed' && (
                    <Alert className="border-green-200 bg-green-50">
                        <Lock className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                            <strong>Periode Ditutup:</strong> Periode {monthlyClosing.periode} telah ditutup. 
                            Tidak dapat dilakukan transaksi baru untuk periode ini.
                        </AlertDescription>
                    </Alert>
                )}

                {monthlyClosing.status === 'pending_approval' && (
                    <Alert className="border-yellow-200 bg-yellow-50">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-800">
                            <strong>Menunggu Approval:</strong> Monthly closing ini sedang menunggu persetujuan 
                            dari supervisor atau manager.
                        </AlertDescription>
                    </Alert>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Periode</label>
                                    <p className="font-medium">{monthlyClosing.periode}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Cut-off Date</label>
                                    <p className="font-medium">{formatDate(monthlyClosing.tanggal_cut_off)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Status</label>
                                    <div className="mt-1">
                                        {getStatusBadge(monthlyClosing.status)}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Created</label>
                                    <p className="font-medium">{formatDate(monthlyClosing.created_at)}</p>
                                </div>
                            </div>

                            {monthlyClosing.keterangan && (
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Keterangan</label>
                                    <p className="text-sm bg-gray-50 p-3 rounded-md mt-1">
                                        {monthlyClosing.keterangan}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Transaction Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Transaction Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Cash Transactions</span>
                                    <span className="font-mono">{transactionSummary.cash_transactions}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Bank Transactions</span>
                                    <span className="font-mono">{transactionSummary.bank_transactions}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Giro Transactions</span>
                                    <span className="font-mono">{transactionSummary.giro_transactions}</span>
                                </div>
                                <div className="flex justify-between items-center border-t pt-3">
                                    <span className="font-medium">Total Transactions</span>
                                    <span className="font-mono font-bold">{transactionSummary.total_transactions}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">Total Amount</span>
                                    <span className="font-mono font-bold">{formatCurrency(transactionSummary.total_amount)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* User Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                User Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-600">Initiated By</label>
                                <p className="font-medium">{monthlyClosing.initiated_by.name}</p>
                                <p className="text-sm text-gray-500">Created at {formatDate(monthlyClosing.created_at)}</p>
                            </div>

                            {monthlyClosing.approved_by && (
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Approved By</label>
                                    <p className="font-medium">{monthlyClosing.approved_by.name}</p>
                                    <p className="text-sm text-gray-500">Approved at {formatDate(monthlyClosing.updated_at)}</p>
                                </div>
                            )}

                            {monthlyClosing.closed_at && (
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Closed At</label>
                                    <p className="font-medium">{formatDate(monthlyClosing.closed_at)}</p>
                                </div>
                            )}

                            {monthlyClosing.reopened_at && (
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Reopened At</label>
                                    <p className="font-medium">{formatDate(monthlyClosing.reopened_at)}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Timeline */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                Timeline
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                    <div>
                                        <p className="font-medium">Created</p>
                                        <p className="text-sm text-gray-600">
                                            {formatDate(monthlyClosing.created_at)} by {monthlyClosing.initiated_by.name}
                                        </p>
                                    </div>
                                </div>

                                {monthlyClosing.approved_by && (
                                    <div className="flex items-start gap-3">
                                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                                        <div>
                                            <p className="font-medium">Approved</p>
                                            <p className="text-sm text-gray-600">
                                                {formatDate(monthlyClosing.updated_at)} by {monthlyClosing.approved_by.name}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {monthlyClosing.closed_at && (
                                    <div className="flex items-start gap-3">
                                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                                        <div>
                                            <p className="font-medium">Closed</p>
                                            <p className="text-sm text-gray-600">
                                                {formatDate(monthlyClosing.closed_at)}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {monthlyClosing.reopened_at && (
                                    <div className="flex items-start gap-3">
                                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                                        <div>
                                            <p className="font-medium">Reopened</p>
                                            <p className="text-sm text-gray-600">
                                                {formatDate(monthlyClosing.reopened_at)}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
