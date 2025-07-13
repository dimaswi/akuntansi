import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import { 
    ArrowLeft, 
    Edit, 
    FileText, 
    CheckCircle, 
    XCircle, 
    Clock, 
    User, 
    Calendar,
    Building,
    Package,
    DollarSign,
    MessageCircle,
    Send,
    Trash
} from 'lucide-react';

export default function Show({ auth, requisition, can }) {
    const getStatusBadge = (status) => {
        const statusConfig = {
            'draft': { variant: 'secondary', icon: FileText, text: 'Draft' },
            'submitted': { variant: 'warning', icon: Clock, text: 'Submitted' },
            'approved': { variant: 'success', icon: CheckCircle, text: 'Approved' },
            'rejected': { variant: 'destructive', icon: XCircle, text: 'Rejected' },
            'cancelled': { variant: 'secondary', icon: XCircle, text: 'Cancelled' },
        };

        const config = statusConfig[status] || statusConfig.draft;
        const Icon = config.icon;

        return (
            <Badge variant={config.variant} className="flex items-center gap-1">
                <Icon className="h-3 w-3" />
                {config.text}
            </Badge>
        );
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleAction = (action) => {
        const actions = {
            submit: {
                message: 'Yakin ingin submit permintaan ini untuk approval?',
                route: route('requisitions.submit', requisition.id),
                method: 'put'
            },
            approve: {
                message: 'Yakin ingin approve permintaan ini?',
                route: route('requisitions.approve', requisition.id),
                method: 'put'
            },
            reject: {
                message: 'Yakin ingin reject permintaan ini?',
                route: route('requisitions.reject', requisition.id),
                method: 'put'
            },
            cancel: {
                message: 'Yakin ingin cancel permintaan ini?',
                route: route('requisitions.cancel', requisition.id),
                method: 'put'
            },
            delete: {
                message: 'Yakin ingin menghapus permintaan ini? Tindakan ini tidak dapat dibatalkan.',
                route: route('requisitions.destroy', requisition.id),
                method: 'delete'
            }
        };

        const actionConfig = actions[action];
        if (actionConfig && confirm(actionConfig.message)) {
            router[actionConfig.method](actionConfig.route);
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Detail Permintaan: {requisition.requisition_number}
                    </h2>
                    <div className="flex items-center gap-2">
                        {/* Action Buttons */}
                        {can.edit && requisition.status === 'draft' && (
                            <Link href={route('requisitions.edit', requisition.id)}>
                                <Button variant="outline" className="flex items-center gap-2">
                                    <Edit className="h-4 w-4" />
                                    Edit
                                </Button>
                            </Link>
                        )}
                        
                        {can.create && requisition.status === 'draft' && (
                            <Button 
                                onClick={() => handleAction('submit')}
                                className="flex items-center gap-2"
                            >
                                <Send className="h-4 w-4" />
                                Submit
                            </Button>
                        )}

                        {can.approve && requisition.status === 'submitted' && (
                            <>
                                <Button 
                                    onClick={() => handleAction('approve')}
                                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                                >
                                    <CheckCircle className="h-4 w-4" />
                                    Approve
                                </Button>
                                <Button 
                                    onClick={() => handleAction('reject')}
                                    variant="destructive"
                                    className="flex items-center gap-2"
                                >
                                    <XCircle className="h-4 w-4" />
                                    Reject
                                </Button>
                            </>
                        )}

                        {can.cancel && ['draft', 'submitted'].includes(requisition.status) && (
                            <Button 
                                onClick={() => handleAction('cancel')}
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                <XCircle className="h-4 w-4" />
                                Cancel
                            </Button>
                        )}

                        {can.delete && requisition.status === 'draft' && (
                            <Button 
                                onClick={() => handleAction('delete')}
                                variant="destructive"
                                className="flex items-center gap-2"
                            >
                                <Trash className="h-4 w-4" />
                                Hapus
                            </Button>
                        )}

                        <Button 
                            variant="outline" 
                            onClick={() => router.visit(route('requisitions.index'))}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Kembali
                        </Button>
                    </div>
                </div>
            }
        >
            <Head title={`Detail Permintaan - ${requisition.requisition_number}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Header Information */}
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Informasi Permintaan
                                </CardTitle>
                                {getStatusBadge(requisition.status)}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <FileText className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Nomor Permintaan</p>
                                        <p className="font-semibold">{requisition.requisition_number}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <Building className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Departemen</p>
                                        <p className="font-semibold">{requisition.department?.name}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <Calendar className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Tanggal Permintaan</p>
                                        <p className="font-semibold">{formatDate(requisition.requisition_date)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-yellow-100 rounded-lg">
                                        <DollarSign className="h-5 w-5 text-yellow-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Total Estimasi</p>
                                        <p className="font-semibold">{formatCurrency(requisition.total_estimated_cost)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-100 rounded-lg">
                                        <User className="h-5 w-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Dibuat Oleh</p>
                                        <p className="font-semibold">{requisition.created_by?.name}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-100 rounded-lg">
                                        <Clock className="h-5 w-5 text-gray-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Dibuat Pada</p>
                                        <p className="font-semibold">{formatDateTime(requisition.created_at)}</p>
                                    </div>
                                </div>
                            </div>

                            {requisition.description && (
                                <div className="mt-6">
                                    <h4 className="font-medium text-gray-900 mb-2">Deskripsi</h4>
                                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{requisition.description}</p>
                                </div>
                            )}

                            {requisition.notes && (
                                <div className="mt-4">
                                    <h4 className="font-medium text-gray-900 mb-2">Catatan</h4>
                                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{requisition.notes}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Items List */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Daftar Barang
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>No</TableHead>
                                        <TableHead>Nama Barang</TableHead>
                                        <TableHead>SKU</TableHead>
                                        <TableHead>Jumlah</TableHead>
                                        <TableHead>Estimasi Harga</TableHead>
                                        <TableHead>Subtotal</TableHead>
                                        <TableHead>Catatan</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {requisition.items.map((item, index) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell className="font-medium">
                                                {item.item?.name}
                                            </TableCell>
                                            <TableCell>{item.item?.sku}</TableCell>
                                            <TableCell>{item.quantity}</TableCell>
                                            <TableCell>{formatCurrency(item.estimated_price)}</TableCell>
                                            <TableCell className="font-medium">
                                                {formatCurrency(item.quantity * item.estimated_price)}
                                            </TableCell>
                                            <TableCell>
                                                {item.notes && (
                                                    <div className="flex items-center gap-1">
                                                        <MessageCircle className="h-4 w-4 text-gray-400" />
                                                        <span className="text-sm text-gray-600">{item.notes}</span>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            <div className="mt-4 pt-4 border-t">
                                <div className="text-right">
                                    <div className="text-lg font-semibold">
                                        Total Estimasi Biaya: {formatCurrency(requisition.total_estimated_cost)}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Approval History */}
                    {requisition.approved_at && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5" />
                                    Riwayat Approval
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {requisition.submitted_at && (
                                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                                            <Clock className="h-5 w-5 text-blue-600" />
                                            <div>
                                                <p className="font-medium">Submitted untuk approval</p>
                                                <p className="text-sm text-gray-600">
                                                    {formatDateTime(requisition.submitted_at)}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {requisition.approved_at && (
                                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                            <div>
                                                <p className="font-medium">
                                                    Approved oleh {requisition.approved_by?.name}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {formatDateTime(requisition.approved_at)}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {requisition.rejected_at && (
                                        <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                                            <XCircle className="h-5 w-5 text-red-600" />
                                            <div>
                                                <p className="font-medium">
                                                    Rejected oleh {requisition.rejected_by?.name}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {formatDateTime(requisition.rejected_at)}
                                                </p>
                                                {requisition.rejection_reason && (
                                                    <p className="text-sm text-red-600 mt-1">
                                                        Alasan: {requisition.rejection_reason}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {requisition.cancelled_at && (
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                            <XCircle className="h-5 w-5 text-gray-600" />
                                            <div>
                                                <p className="font-medium">
                                                    Cancelled oleh {requisition.cancelled_by?.name}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {formatDateTime(requisition.cancelled_at)}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
