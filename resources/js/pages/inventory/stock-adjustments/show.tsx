import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { usePermission } from '@/hooks/use-permission';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { useState } from 'react';
import {
    ArrowLeft,
    CheckCircle,
    ClipboardList,
    Edit,
    Send,
    Trash2,
    XCircle,
    Calendar,
    Hash,
    Package,
    TrendingDown,
    TrendingUp,
    User,
    FileText,
    AlertCircle
} from 'lucide-react';
import { route } from 'ziggy-js';

interface Item {
    id: number;
    code: string;
    name: string;
}

interface Jurnal {
    id: number;
    nomor_jurnal: string;
    tanggal_transaksi: string;
    details: JurnalDetail[];
}

interface JurnalDetail {
    kode_akun: string;
    nama_akun: string;
    jumlah_debit: number;
    jumlah_kredit: number;
}

interface StockAdjustment {
    id: number;
    nomor_adjustment: string;
    tanggal_adjustment: string;
    tipe_adjustment: 'shortage' | 'overage';
    quantity: number;
    unit_price: number;
    total_amount: number;
    keterangan?: string;
    status: 'draft' | 'approved';
    jurnal_posted: boolean;
    item: Item;
    approved_by?: {
        name: string;
    };
    approved_at?: string;
    jurnal?: Jurnal;
    created_at: string;
}

interface Props extends SharedData {
    adjustment: StockAdjustment;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: <ClipboardList className="h-4 w-4" />, href: '#' },
    { title: 'Stock Adjustments', href: route('stock-adjustments.index') },
    { title: 'Detail', href: '#' },
];

export default function ShowStockAdjustment({ adjustment }: Props) {
    const { hasPermission } = usePermission();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showApproveDialog, setShowApproveDialog] = useState(false);
    const [showPostDialog, setShowPostDialog] = useState(false);

    const handleDelete = () => {
        router.delete(route('stock-adjustments.destroy', adjustment.id));
        setShowDeleteDialog(false);
    };

    const handleApprove = () => {
        router.post(route('stock-adjustments.approve', adjustment.id));
        setShowApproveDialog(false);
    };

    const handlePostToJournal = () => {
        router.post(route('stock-adjustments.postToJournal', adjustment.id));
        setShowPostDialog(false);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const tipeIcon =
        adjustment.tipe_adjustment === 'shortage' ? (
            <TrendingDown className="h-5 w-5 text-red-600" />
        ) : (
            <TrendingUp className="h-5 w-5 text-green-600" />
        );

    const tipeLabel =
        adjustment.tipe_adjustment === 'shortage' ? 'Shortage (Kekurangan)' : 'Overage (Kelebihan)';
    const tipeColor =
        adjustment.tipe_adjustment === 'shortage'
            ? 'bg-red-100 text-red-800'
            : 'bg-green-100 text-green-800';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Adjustment ${adjustment.nomor_adjustment}`} />

            <div className="mt-4 space-y-4">
                {/* Back Button */}
                <Button
                    variant="outline"
                    onClick={() => router.visit(route('stock-adjustments.index'))}
                    className="gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Kembali ke List
                </Button>

                {/* Header Card */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <ClipboardList className="h-5 w-5" />
                                    Adjustment {adjustment.nomor_adjustment}
                                </CardTitle>
                                <CardDescription>Detail stock adjustment</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                {adjustment.status === 'draft' &&
                                    hasPermission('inventory.items.edit') && (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    router.visit(
                                                        route('stock-adjustments.edit', adjustment.id)
                                                    )
                                                }
                                                className="gap-2"
                                            >
                                                <Edit className="h-4 w-4" />
                                                Edit
                                            </Button>
                                            {hasPermission('inventory.items.delete') && (
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => setShowDeleteDialog(true)}
                                                    className="gap-2"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    Hapus
                                                </Button>
                                            )}
                                            <Button
                                                variant="default"
                                                size="sm"
                                                onClick={() => setShowApproveDialog(true)}
                                                className="gap-2"
                                            >
                                                <CheckCircle className="h-4 w-4" />
                                                Approve & Update Stok
                                            </Button>
                                        </>
                                    )}
                                {adjustment.status === 'approved' &&
                                    !adjustment.jurnal_posted &&
                                    hasPermission('inventory.purchases.post-to-journal') && (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => router.visit(route('stock-adjustments.showPostToJournal'))}
                                                className="gap-2"
                                            >
                                                <Send className="h-4 w-4" />
                                                Batch Post to Jurnal
                                            </Button>
                                            <Button
                                                variant="default"
                                                size="sm"
                                                onClick={() => setShowPostDialog(true)}
                                                className="gap-2"
                                            >
                                                <Send className="h-4 w-4" />
                                                Post to Jurnal
                                            </Button>
                                        </>
                                    )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Status Badges */}
                        <div className="flex gap-2">
                            <Badge className={tipeColor}>{tipeLabel}</Badge>
                            <Badge
                                className={
                                    adjustment.status === 'approved'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                }
                            >
                                {adjustment.status === 'approved' ? 'Approved' : 'Draft'}
                            </Badge>
                            {adjustment.jurnal_posted ? (
                                <Badge variant="default" className="gap-1">
                                    <CheckCircle className="h-3 w-3" />
                                    Posted to Jurnal
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="gap-1">
                                    <XCircle className="h-3 w-3" />
                                    Belum Diposting
                                </Badge>
                            )}
                        </div>

                        {/* Info Notice */}
                        {adjustment.status === 'approved' && !adjustment.jurnal_posted && (
                            <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
                                <AlertCircle className="h-5 w-5 text-blue-600" />
                                <div className="flex-1 text-sm">
                                    <p className="font-medium text-blue-900">
                                        Stok sudah diupdate
                                    </p>
                                    <p className="text-blue-700">
                                        Adjustment sudah approved dan stok telah diupdate. Silakan post to jurnal untuk mencatat ke akuntansi.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Adjustment Details */}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {/* Left Column */}
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Hash className="mt-1 h-5 w-5 text-gray-400" />
                                    <div className="flex-1">
                                        <div className="text-sm text-gray-500">Nomor Adjustment</div>
                                        <div className="font-medium">{adjustment.nomor_adjustment}</div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Calendar className="mt-1 h-5 w-5 text-gray-400" />
                                    <div className="flex-1">
                                        <div className="text-sm text-gray-500">Tanggal</div>
                                        <div className="font-medium">
                                            {format(
                                                new Date(adjustment.tanggal_adjustment),
                                                'dd MMMM yyyy',
                                                { locale: idLocale }
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    {tipeIcon}
                                    <div className="flex-1">
                                        <div className="text-sm text-gray-500">Tipe Adjustment</div>
                                        <div className="font-medium">{tipeLabel}</div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Package className="mt-1 h-5 w-5 text-gray-400" />
                                    <div className="flex-1">
                                        <div className="text-sm text-gray-500">Barang</div>
                                        <div className="font-medium">{adjustment.item.name}</div>
                                        <div className="text-sm text-gray-500">
                                            {adjustment.item.code}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Hash className="mt-1 h-5 w-5 text-gray-400" />
                                    <div className="flex-1">
                                        <div className="text-sm text-gray-500">Quantity</div>
                                        <div className="font-medium">{adjustment.quantity}</div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <FileText className="mt-1 h-5 w-5 text-gray-400" />
                                    <div className="flex-1">
                                        <div className="text-sm text-gray-500">Unit Price</div>
                                        <div className="font-medium">
                                            {formatCurrency(adjustment.unit_price)}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <FileText className="mt-1 h-5 w-5 text-gray-400" />
                                    <div className="flex-1">
                                        <div className="text-sm text-gray-500">Total Nilai</div>
                                        <div className="text-lg font-semibold text-primary">
                                            {formatCurrency(adjustment.total_amount)}
                                        </div>
                                    </div>
                                </div>

                                {adjustment.approved_by && (
                                    <div className="flex items-start gap-3">
                                        <User className="mt-1 h-5 w-5 text-gray-400" />
                                        <div className="flex-1">
                                            <div className="text-sm text-gray-500">Approved By</div>
                                            <div className="font-medium">
                                                {adjustment.approved_by.name}
                                            </div>
                                            {adjustment.approved_at && (
                                                <div className="text-sm text-gray-500">
                                                    {format(
                                                        new Date(adjustment.approved_at),
                                                        'dd MMM yyyy HH:mm',
                                                        { locale: idLocale }
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Keterangan */}
                        {adjustment.keterangan && (
                            <div className="rounded-lg border bg-gray-50 p-4">
                                <div className="text-sm font-medium text-gray-700">Keterangan:</div>
                                <div className="mt-1 text-gray-600">{adjustment.keterangan}</div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Jurnal Entry Card */}
                {adjustment.jurnal && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Jurnal Entry
                            </CardTitle>
                            <CardDescription>
                                Nomor Jurnal: {adjustment.jurnal.nomor_jurnal}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Kode Akun</TableHead>
                                            <TableHead>Nama Akun</TableHead>
                                            <TableHead className="text-right">Debit</TableHead>
                                            <TableHead className="text-right">Kredit</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {adjustment.jurnal.details.map((detail, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium">
                                                    {detail.kode_akun}
                                                </TableCell>
                                                <TableCell>{detail.nama_akun}</TableCell>
                                                <TableCell className="text-right">
                                                    {detail.jumlah_debit > 0
                                                        ? formatCurrency(detail.jumlah_debit)
                                                        : '-'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {detail.jumlah_kredit > 0
                                                        ? formatCurrency(detail.jumlah_kredit)
                                                        : '-'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Stock Adjustment?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus adjustment {adjustment.nomor_adjustment}?
                            Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Approve Confirmation Dialog */}
            <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Approve Stock Adjustment?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin approve adjustment ini? Stok akan langsung diupdate
                            sesuai dengan adjustment. Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleApprove}>
                            Approve & Update Stok
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Post to Journal Confirmation Dialog */}
            <AlertDialog open={showPostDialog} onOpenChange={setShowPostDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Post ke Jurnal?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin posting adjustment ini ke jurnal? Data akan dicatat
                            ke sistem akuntansi. Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handlePostToJournal}>
                            Post to Jurnal
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
