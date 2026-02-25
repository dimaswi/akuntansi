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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePermission } from '@/hooks/use-permission';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, ArrowRightLeft, CheckCircle, Edit, PackageCheck, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { route } from 'ziggy-js';

interface Item {
    id: number;
    code: string;
    name: string;
}

interface Department {
    id: number;
    code: string;
    name: string;
}

interface User {
    id: number;
    name: string;
}

interface StockTransfer {
    id: number;
    nomor_transfer: string;
    tanggal_transfer: string;
    from_department_id: number | null;
    to_department_id: number;
    item_id: number;
    quantity: number;
    status: 'draft' | 'approved' | 'received';
    approved_by: number | null;
    approved_at: string | null;
    received_by: number | null;
    received_at: string | null;
    keterangan: string | null;
    item: Item;
    from_department: Department | null;
    to_department: Department;
    approved_by_user: User | null;
    received_by_user: User | null;
}

interface Props extends SharedData {
    transfer: StockTransfer;
}

export default function Show({ transfer }: Props) {
    const { hasPermission } = usePermission();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showApproveDialog, setShowApproveDialog] = useState(false);
    const [showReceiveDialog, setShowReceiveDialog] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Inventory', href: '/inventory' },
        { title: 'Stock Transfer', href: route('stock-transfers.index') },
        { title: transfer.nomor_transfer, href: '#' },
    ];

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: any; label: string }> = {
            draft: { variant: 'secondary', label: 'Draft' },
            approved: { variant: 'default', label: 'Approved' },
            received: { variant: 'success', label: 'Received' },
        };
        const config = variants[status] || variants.draft;
        return <Badge variant={config.variant} className="text-sm">{config.label}</Badge>;
    };

    const handleDelete = () => {
        router.delete(route('stock-transfers.destroy', transfer.id), {
            onSuccess: () => router.visit(route('stock-transfers.index')),
        });
    };

    const handleApprove = () => {
        router.post(route('stock-transfers.approve', transfer.id), {}, {
            preserveScroll: true,
            onSuccess: () => setShowApproveDialog(false),
        });
    };

    const handleReceive = () => {
        router.post(route('stock-transfers.receive', transfer.id), {}, {
            preserveScroll: true,
            onSuccess: () => setShowReceiveDialog(false),
        });
    };

    const canEdit = transfer.status === 'draft' && hasPermission('inventory.items.edit');
    const canDelete = transfer.status === 'draft' && hasPermission('inventory.items.delete');
    const canApprove = transfer.status === 'draft' && hasPermission('inventory.purchases.approve');
    const canReceive = transfer.status === 'approved' && hasPermission('inventory.purchases.approve');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Transfer ${transfer.nomor_transfer}`} />

            <div className="p-4 space-y-4">
                {/* Main Info Card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.visit(route('stock-transfers.index'))}
                                >
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Kembali
                                </Button>
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <ArrowRightLeft className="h-5 w-5" />
                                        {transfer.nomor_transfer}
                                        {getStatusBadge(transfer.status)}
                                    </CardTitle>
                                    <CardDescription>
                                        Dibuat pada {formatDateTime(transfer.tanggal_transfer)}
                                    </CardDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {canEdit && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => router.visit(route('stock-transfers.edit', transfer.id))}
                                    >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                    </Button>
                                )}
                                {canDelete && (
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => setShowDeleteDialog(true)}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Hapus
                                    </Button>
                                )}
                                {canApprove && (
                                    <Button
                                        size="sm"
                                        onClick={() => setShowApproveDialog(true)}
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Approve & Kurangi Stok
                                    </Button>
                                )}
                                {canReceive && (
                                    <Button
                                        size="sm"
                                        onClick={() => setShowReceiveDialog(true)}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        <PackageCheck className="h-4 w-4 mr-2" />
                                        Terima Barang
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Transfer Info */}
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 mb-3">Informasi Transfer</h3>
                                <dl className="space-y-2">
                                    <div>
                                        <dt className="text-sm text-gray-500">Tanggal Transfer</dt>
                                        <dd className="text-sm font-medium">{formatDate(transfer.tanggal_transfer)}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm text-gray-500">Dari</dt>
                                        <dd className="text-sm font-medium">
                                            {transfer.from_department ? (
                                                <div>
                                                    <div>{transfer.from_department.name}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {transfer.from_department.code}
                                                    </div>
                                                </div>
                                            ) : (
                                                <Badge variant="outline">Gudang Pusat</Badge>
                                            )}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm text-gray-500">Ke Departemen</dt>
                                        <dd className="text-sm font-medium">
                                            <div>{transfer.to_department.name}</div>
                                            <div className="text-xs text-gray-500">
                                                {transfer.to_department.code}
                                            </div>
                                        </dd>
                                    </div>
                                </dl>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 mb-3">Detail Barang</h3>
                                <dl className="space-y-2">
                                    <div>
                                        <dt className="text-sm text-gray-500">Kode Barang</dt>
                                        <dd className="text-sm font-medium">{transfer.item.code}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm text-gray-500">Nama Barang</dt>
                                        <dd className="text-sm font-medium">{transfer.item.name}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm text-gray-500">Jumlah</dt>
                                        <dd className="text-lg font-bold text-blue-600">
                                            {transfer.quantity.toLocaleString('id-ID')} unit
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        </div>

                        {/* Keterangan */}
                        {transfer.keterangan && (
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 mb-2">Keterangan</h3>
                                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                                    {transfer.keterangan}
                                </p>
                            </div>
                        )}

                        {/* Approval Info */}
                        {transfer.status !== 'draft' && (
                            <div className="border-t pt-6">
                                <h3 className="text-sm font-semibold text-gray-500 mb-3">Informasi Approval</h3>
                                <div className="grid gap-6 sm:grid-cols-2">
                                    {transfer.approved_at && (
                                        <div>
                                            <dt className="text-sm text-gray-500">Approved By</dt>
                                            <dd className="text-sm font-medium">{transfer.approved_by_user?.name}</dd>
                                            <dd className="text-xs text-gray-500">
                                                {formatDateTime(transfer.approved_at)}
                                            </dd>
                                        </div>
                                    )}
                                    {transfer.received_at && (
                                        <div>
                                            <dt className="text-sm text-gray-500">Diterima Oleh</dt>
                                            <dd className="text-sm font-medium">{transfer.received_by_user?.name}</dd>
                                            <dd className="text-xs text-gray-500">
                                                {formatDateTime(transfer.received_at)}
                                            </dd>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus transfer ini? Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Approve Confirmation Dialog */}
            <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Konfirmasi Approve Transfer</AlertDialogTitle>
                        <AlertDialogDescription>
                            Dengan approve transfer ini, stok barang akan dikurangi dari {transfer.from_department ? 
                            `departemen ${transfer.from_department.name}` : 'gudang pusat'}. 
                            Tindakan ini tidak dapat dibatalkan. Lanjutkan?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleApprove}>
                            Ya, Approve & Kurangi Stok
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Receive Confirmation Dialog */}
            <AlertDialog open={showReceiveDialog} onOpenChange={setShowReceiveDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Konfirmasi Penerimaan Barang</AlertDialogTitle>
                        <AlertDialogDescription>
                            Dengan menerima barang ini, stok akan ditambahkan ke departemen {transfer.to_department.name}.
                            Proses transfer akan selesai. Lanjutkan?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleReceive} className="bg-green-600 hover:bg-green-700">
                            Ya, Terima Barang
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
