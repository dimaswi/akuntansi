import { RevisionReasonDialog } from '@/components/closing-period/revision-reason-dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRevisionDialog } from '@/hooks/use-revision-dialog';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Calculator, CheckCircle, Edit, RotateCcw, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

interface DaftarAkun {
    id: number;
    kode_akun: string;
    nama_akun: string;
    jenis_akun: string;
    sub_jenis: string;
}

interface User {
    id: number;
    name: string;
}

interface DetailJurnal {
    id: number;
    daftar_akun_id: number;
    jumlah_debit: number;
    jumlah_kredit: number;
    keterangan: string;
    daftar_akun: DaftarAkun;
}

interface Jurnal {
    id: number;
    nomor_jurnal: string;
    tanggal_transaksi: string;
    jenis_referensi?: string;
    nomor_referensi?: string;
    keterangan: string;
    total_debit: number;
    total_kredit: number;
    status: string;
    created_at: string;
    updated_at: string;
    tanggal_posting?: string;
    dibuat_oleh?: User;
    diposting_oleh?: User;
    details: DetailJurnal[];
}

interface JurnalPageProps extends SharedData {
    jurnal: Jurnal;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: <Calculator className="h-4 w-4" />,
        href: '/akuntansi',
    },
    {
        title: 'Jurnal Penyesuaian',
        href: '/akuntansi/jurnal-penyesuaian',
    },
    {
        title: 'Detail Jurnal Penyesuaian',
        href: '#',
    },
];

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
};

const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

const getStatusBadge = (status: string) => {
    const statusConfig = {
        draft: { label: 'Draft', variant: 'secondary' as const },
        posted: { label: 'Posted', variant: 'default' as const },
        reversed: { label: 'Reversed', variant: 'destructive' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
};

export default function JurnalPenyesuaianShow({ jurnal }: JurnalPageProps) {
    const [dialogState, setDialogState] = useState<{
        open: boolean;
        type: 'post' | 'unpost' | 'reverse' | 'delete' | null;
    }>({ open: false, type: null });

    const [currentActionType, setCurrentActionType] = useState<'edit' | 'delete' | 'unpost' | 'reverse'>('delete');

    // Use revision dialog hook
    const {
        showDialog,
        revisionData,
        makeRequest,
        submitWithRevision,
        closeDialog: closeRevisionDialog,
    } = useRevisionDialog({
        onSuccess: () => {
            if (currentActionType === 'delete') {
                toast.success('Jurnal penyesuaian berhasil dihapus');
                router.visit(route('akuntansi.jurnal-penyesuaian.index'));
            } else if (currentActionType === 'unpost') {
                toast.success('Posting jurnal penyesuaian berhasil dibatalkan');
            } else if (currentActionType === 'reverse') {
                toast.success('Jurnal penyesuaian berhasil dibalik');
            }
        },
        onError: (errors) => {
            toast.error('Gagal memproses jurnal penyesuaian');
        },
    });

    const openDialog = (type: 'post' | 'unpost' | 'reverse' | 'delete') => {
        setDialogState({ open: true, type });
    };

    const closeDialog = () => {
        setDialogState({ open: false, type: null });
    };

    const handleConfirmAction = () => {
        const { type } = dialogState;
        closeDialog();

        switch (type) {
            case 'post':
                // Post tidak perlu revision dialog
                router.post(
                    route('akuntansi.jurnal-penyesuaian.post', jurnal?.id),
                    {},
                    {
                        onSuccess: () => {
                            toast.success('Jurnal penyesuaian berhasil diposting');
                        },
                        onError: () => {
                            toast.error('Gagal memposting jurnal penyesuaian');
                        },
                    },
                );
                break;
            case 'unpost':
                setCurrentActionType('unpost');
                makeRequest('post', route('akuntansi.jurnal-penyesuaian.unpost', jurnal?.id), {});
                break;
            case 'reverse':
                setCurrentActionType('reverse');
                makeRequest('post', route('akuntansi.jurnal-penyesuaian.reverse', jurnal?.id), {});
                break;
            case 'delete':
                setCurrentActionType('delete');
                makeRequest('delete', route('akuntansi.jurnal-penyesuaian.destroy', jurnal?.id), {});
                break;
        }
    };

    const getDialogContent = () => {
        switch (dialogState.type) {
            case 'post':
                return {
                    title: 'Posting Jurnal Penyesuaian',
                    description: 'Apakah Anda yakin ingin memposting jurnal penyesuaian ini? Jurnal yang sudah diposting tidak dapat diubah.',
                    confirmText: 'Ya, Posting',
                };
            case 'unpost':
                return {
                    title: 'Batal Posting Jurnal Penyesuaian',
                    description:
                        'Apakah Anda yakin ingin membatalkan posting jurnal penyesuaian ini? Jurnal akan kembali ke status draft dan dapat diubah kembali.',
                    confirmText: 'Ya, Batal Posting',
                };
            case 'reverse':
                return {
                    title: 'Reverse Jurnal Penyesuaian',
                    description: 'Apakah Anda yakin ingin membalik jurnal penyesuaian ini? Jurnal yang dibalik tidak dapat diubah lagi.',
                    confirmText: 'Ya, Reverse',
                };
            case 'delete':
                return {
                    title: 'Hapus Jurnal Penyesuaian',
                    description: 'Apakah Anda yakin ingin menghapus jurnal penyesuaian ini? Tindakan ini tidak dapat dibatalkan.',
                    confirmText: 'Ya, Hapus',
                };
            default:
                return { title: '', description: '', confirmText: '' };
        }
    };

    if (!jurnal) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Jurnal Penyesuaian Tidak Ditemukan" />
                <div className="p-4 sm:px-6 lg:px-8">
                    <div className="rounded-lg border border-red-200 bg-red-50 p-6">
                        <h2 className="mb-2 text-lg font-semibold text-red-800">Jurnal Penyesuaian Tidak Ditemukan</h2>
                        <p className="text-red-700">Jurnal penyesuaian yang Anda cari tidak ditemukan atau mungkin telah dihapus.</p>
                        <div className="mt-4">
                            <Button
                                variant="outline"
                                onClick={() => router.visit(route('akuntansi.jurnal-penyesuaian.index'))}
                                className="flex items-center gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detail Jurnal Penyesuaian - ${jurnal.nomor_jurnal}`} />
            <div className="p-4 sm:px-6 lg:px-8">
                {/* Jurnal Information */}
                <div className="mb-6 rounded-lg border bg-white">
                    <div className="p-4">
                        <div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => router.visit(route('akuntansi.jurnal-penyesuaian.index'))}
                                        className="flex items-center gap-2"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                    <div>
                                        <CardTitle>{jurnal.nomor_jurnal}</CardTitle>
                                        <CardDescription>Detail jurnal penyesuaian</CardDescription>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {jurnal.status === 'draft' && (
                                        <>
                                            <Button
                                                variant="outline"
                                                onClick={() => router.visit(route('akuntansi.jurnal-penyesuaian.edit', jurnal.id))}
                                                className="flex items-center gap-2"
                                            >
                                                <Edit className="h-4 w-4" />
                                                Edit Jurnal Penyesuaian
                                            </Button>
                                            <Button
                                                variant="default"
                                                onClick={() => openDialog('post')}
                                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                                            >
                                                <CheckCircle className="h-4 w-4" />
                                                Posting Jurnal
                                            </Button>
                                            <Button variant="destructive" onClick={() => openDialog('delete')} className="flex items-center gap-2">
                                                <Trash2 className="h-4 w-4" />
                                                Hapus Jurnal
                                            </Button>
                                        </>
                                    )}
                                    {jurnal.status === 'posted' && (
                                        <>
                                            <Button
                                                variant="outline"
                                                onClick={() => openDialog('unpost')}
                                                className="flex items-center gap-2 border-blue-300 text-blue-600 hover:bg-blue-50"
                                            >
                                                <CheckCircle className="h-4 w-4" />
                                                Batal Posting
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => openDialog('reverse')}
                                                className="flex items-center gap-2 border-orange-300 text-orange-600 hover:bg-orange-50"
                                            >
                                                <RotateCcw className="h-4 w-4" />
                                                Reverse Jurnal
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Nomor Jurnal</label>
                                <p className="text-lg font-semibold text-gray-900">{jurnal.nomor_jurnal}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Tanggal Transaksi</label>
                                <p className="text-lg text-gray-900">{formatDate(jurnal.tanggal_transaksi)}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Status</label>
                                <div className="mt-1">{getStatusBadge(jurnal.status)}</div>
                            </div>
                            {jurnal.jenis_referensi && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Jenis Referensi</label>
                                    <p className="text-lg text-gray-900 capitalize">{jurnal.jenis_referensi}</p>
                                </div>
                            )}
                            {jurnal.nomor_referensi && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Nomor Referensi</label>
                                    <p className="text-lg text-gray-900">{jurnal.nomor_referensi}</p>
                                </div>
                            )}
                            <div>
                                <label className="text-sm font-medium text-gray-500">Total Debit</label>
                                <p className="text-lg font-semibold text-green-600">{formatCurrency(Number(jurnal.total_debit))}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Total Kredit</label>
                                <p className="text-lg font-semibold text-red-600">{formatCurrency(Number(jurnal.total_kredit))}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Dibuat Oleh</label>
                                <p className="text-lg text-gray-900">{jurnal.dibuat_oleh?.name || '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Tanggal Dibuat</label>
                                <p className="text-lg text-gray-900">{formatDateTime(jurnal.created_at)}</p>
                            </div>
                            {jurnal.tanggal_posting && (
                                <>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Diposting Oleh</label>
                                        <p className="text-lg text-gray-900">{jurnal.diposting_oleh?.name || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Tanggal Posting</label>
                                        <p className="text-lg text-gray-900">{formatDateTime(jurnal.tanggal_posting)}</p>
                                    </div>
                                </>
                            )}
                        </div>
                        {jurnal.keterangan && (
                            <div className="mt-6">
                                <label className="text-sm font-medium text-gray-500">Keterangan</label>
                                <p className="mt-2 rounded-md bg-gray-50 p-3 text-gray-900">{jurnal.keterangan}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Detail Jurnal */}
                <div className="mb-6 rounded-lg border bg-white">
                    <div className="border-b border-gray-200 px-6 py-4">
                        <h2 className="text-lg font-semibold text-gray-900">Detail Jurnal Penyesuaian</h2>
                        <p className="text-sm text-gray-600">Rincian debit dan kredit jurnal penyesuaian</p>
                    </div>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-gray-50">
                                <TableRow>
                                    <TableHead className="w-[10%]">No.</TableHead>
                                    <TableHead className="w-[40%]">Akun</TableHead>
                                    <TableHead className="w-[20%]">Debit</TableHead>
                                    <TableHead className="w-[20%]">Kredit</TableHead>
                                    <TableHead className="w-[10%]">Keterangan</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {jurnal.details && jurnal.details.length > 0 ? (
                                    jurnal.details.map((detail, index) => (
                                        <TableRow key={detail.id}>
                                            <TableCell className="font-medium">{index + 1}</TableCell>
                                            <TableCell>
                                                <div className="font-medium">{detail.daftar_akun?.kode_akun || '-'}</div>
                                                <div className="text-sm text-gray-500">{detail.daftar_akun?.nama_akun || '-'}</div>
                                            </TableCell>
                                            <TableCell className="font-medium text-green-600">
                                                {Number(detail.jumlah_debit) > 0 ? formatCurrency(Number(detail.jumlah_debit)) : '-'}
                                            </TableCell>
                                            <TableCell className="font-medium text-red-600">
                                                {Number(detail.jumlah_kredit) > 0 ? formatCurrency(Number(detail.jumlah_kredit)) : '-'}
                                            </TableCell>
                                            <TableCell className="text-sm">{detail.keterangan || '-'}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                                            Tidak ada detail jurnal penyesuaian
                                        </TableCell>
                                    </TableRow>
                                )}
                                <TableRow className="bg-gray-50 font-medium">
                                    <TableCell colSpan={2}>Total</TableCell>
                                    <TableCell className="font-bold text-green-600">{formatCurrency(Number(jurnal.total_debit))}</TableCell>
                                    <TableCell className="font-bold text-red-600">{formatCurrency(Number(jurnal.total_kredit))}</TableCell>
                                    <TableCell></TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Actions */}
                <div className="rounded-lg border bg-white">
                    <div className="border-b border-gray-200 px-6 py-4">
                        <h2 className="text-lg font-semibold text-gray-900">Aksi</h2>
                        <p className="text-sm text-gray-600">Tindakan yang dapat dilakukan pada jurnal penyesuaian ini</p>
                    </div>
                    <div className="p-6">
                        <div className="flex flex-wrap gap-3">
                            {jurnal.status === 'reversed' && (
                                <div className="text-sm text-gray-500 italic">
                                    Jurnal penyesuaian ini telah di-reverse. Tidak ada aksi yang dapat dilakukan.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <AlertDialog open={dialogState.open} onOpenChange={closeDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{getDialogContent().title}</AlertDialogTitle>
                        <AlertDialogDescription>{getDialogContent().description}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmAction}>{getDialogContent().confirmText}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Revision Reason Dialog */}
            <RevisionReasonDialog
                open={showDialog}
                onOpenChange={closeRevisionDialog}
                onSubmit={submitWithRevision}
                periodName={revisionData?.period_name}
                actionType={currentActionType}
            />
        </AppLayout>
    );
}
