import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
    Calendar, 
    AlertTriangle,
    ArrowLeft,
    Lock,
    CheckCircle,
    Clock
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';

interface CreateMonthlyClosingProps {
    year: number;
    month: number;
    monthName: string;
    pendingTransactions: {
        cash_count: number;
        bank_count: number;
        giro_count: number;
        total_count: number;
    };
    validationChecks: {
        all_transactions_posted: boolean;
        no_pending_approvals: boolean;
        previous_month_closed: boolean;
        can_proceed: boolean;
    };
}

const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function CreateMonthlyClosing({ 
    year, 
    month, 
    monthName,
    pendingTransactions,
    validationChecks
}: CreateMonthlyClosingProps) {
    
    const { data, setData, post, processing, errors } = useForm({
        periode_tahun: year,
        periode_bulan: month,
        tanggal_cut_off: '',
        keterangan: '',
    });

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
            title: 'Initiate Closing',
            href: '#',
        },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validationChecks.can_proceed) {
            return;
        }

        post('/monthly-closing', {
            onSuccess: () => {
                router.get('/monthly-closing');
            }
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbItems}>
            <Head title={`Initiate Monthly Closing - ${monthName} ${year}`} />

            <div className="space-y-6">
                {/* Header */}
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
                        <h1 className="text-2xl font-bold">Initiate Monthly Closing</h1>
                        <p className="text-gray-600">
                            Memulai proses monthly closing untuk {monthName} {year}
                        </p>
                    </div>
                </div>

                {/* Validation Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5" />
                                Validation Checks
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">All transactions posted</span>
                                    {validationChecks.all_transactions_posted ? (
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                    ) : (
                                        <AlertTriangle className="h-4 w-4 text-red-600" />
                                    )}
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">No pending approvals</span>
                                    {validationChecks.no_pending_approvals ? (
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                    ) : (
                                        <AlertTriangle className="h-4 w-4 text-red-600" />
                                    )}
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Previous month closed</span>
                                    {validationChecks.previous_month_closed ? (
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                    ) : (
                                        <AlertTriangle className="h-4 w-4 text-red-600" />
                                    )}
                                </div>
                            </div>

                            {!validationChecks.can_proceed && (
                                <Alert className="border-red-200 bg-red-50">
                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                    <AlertDescription className="text-red-800">
                                        Tidak dapat melanjutkan monthly closing. Silakan selesaikan semua 
                                        validasi yang diperlukan terlebih dahulu.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                Pending Transactions
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Cash Transactions</span>
                                    <span className="font-mono text-sm">{pendingTransactions.cash_count}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Bank Transactions</span>
                                    <span className="font-mono text-sm">{pendingTransactions.bank_count}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Giro Transactions</span>
                                    <span className="font-mono text-sm">{pendingTransactions.giro_count}</span>
                                </div>
                                <div className="flex justify-between items-center border-t pt-2">
                                    <span className="text-sm font-medium">Total Pending</span>
                                    <span className="font-mono text-sm font-bold">{pendingTransactions.total_count}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Monthly Closing Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label htmlFor="periode_tahun">Tahun</Label>
                                    <Input
                                        id="periode_tahun"
                                        type="number"
                                        value={data.periode_tahun}
                                        readOnly
                                        className="bg-gray-50"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="periode_bulan">Bulan</Label>
                                    <Input
                                        id="periode_bulan"
                                        value={monthNames[data.periode_bulan - 1]}
                                        readOnly
                                        className="bg-gray-50"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="tanggal_cut_off">Tanggal Cut-off *</Label>
                                    <Input
                                        id="tanggal_cut_off"
                                        type="date"
                                        value={data.tanggal_cut_off}
                                        onChange={(e) => setData('tanggal_cut_off', e.target.value)}
                                        required
                                        className={errors.tanggal_cut_off ? 'border-red-500' : ''}
                                    />
                                    {errors.tanggal_cut_off && (
                                        <p className="text-red-500 text-sm mt-1">{errors.tanggal_cut_off}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="keterangan">Keterangan</Label>
                                <Textarea
                                    id="keterangan"
                                    value={data.keterangan}
                                    onChange={(e) => setData('keterangan', e.target.value)}
                                    placeholder="Catatan tambahan untuk monthly closing ini..."
                                    rows={4}
                                    className={errors.keterangan ? 'border-red-500' : ''}
                                />
                                {errors.keterangan && (
                                    <p className="text-red-500 text-sm mt-1">{errors.keterangan}</p>
                                )}
                            </div>

                            {validationChecks.can_proceed && (
                                <Alert className="border-blue-200 bg-blue-50">
                                    <Lock className="h-4 w-4 text-blue-600" />
                                    <AlertDescription className="text-blue-800">
                                        <strong>Perhatian:</strong> Setelah monthly closing dibuat, periode ini akan dikunci 
                                        dan tidak dapat dilakukan transaksi baru sampai proses closing selesai atau dibatalkan.
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="flex gap-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.get('/monthly-closing')}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing || !validationChecks.can_proceed}
                                    className="min-w-[150px]"
                                >
                                    {processing ? (
                                        <>
                                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="h-4 w-4 mr-2" />
                                            Initiate Closing
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
