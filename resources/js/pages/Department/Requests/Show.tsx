import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Edit, FileText, Calendar, User, Building, Package, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { PageProps, BreadcrumbItem } from '@/types';

interface Department {
    id: number;
    name: string;
    code: string;
}

interface User {
    id: number;
    name: string;
    nip: string;
}

interface InventoryItem {
    id: number;
    name: string;
    code: string;
    unit_of_measure: string;
    standard_cost: number;
    category: {
        id: number;
        name: string;
    };
}

interface RequestItem {
    id: number;
    item_id?: number;
    custom_item_name?: string;
    description?: string;
    quantity_requested: number;
    quantity_approved?: number;
    estimated_cost: number;
    approved_cost?: number;
    inventory_item?: InventoryItem;
}

interface DepartmentRequest {
    id: number;
    request_number: string;
    department: Department;
    requested_by: User;
    approved_by?: User;
    purpose: string;
    status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'fulfilled';
    priority: 'low' | 'medium' | 'high';
    needed_date: string;
    notes?: string;
    approval_notes?: string;
    items: RequestItem[];
    total_estimated_cost: number;
    total_approved_cost?: number;
    request_date: string;
    submitted_at?: string;
    approved_at?: string;
    rejected_at?: string;
    created_at: string;
    updated_at: string;
}

interface ShowProps extends PageProps {
    request: DepartmentRequest;
}

export default function DepartmentRequestShow({ request }: ShowProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Permintaan Departemen',
            href: '/department-requests',
        },
        {
            title: request.request_number,
            href: `/department-requests/${request.id}`,
        },
    ];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            draft: <Badge variant="outline" className="text-gray-600"><FileText className="h-3 w-3 mr-1" />Draft</Badge>,
            submitted: <Badge variant="outline" className="text-blue-600"><AlertCircle className="h-3 w-3 mr-1" />Diajukan</Badge>,
            approved: <Badge variant="outline" className="text-green-600"><CheckCircle className="h-3 w-3 mr-1" />Disetujui</Badge>,
            rejected: <Badge variant="outline" className="text-red-600"><XCircle className="h-3 w-3 mr-1" />Ditolak</Badge>,
            fulfilled: <Badge variant="outline" className="text-purple-600"><Package className="h-3 w-3 mr-1" />Terpenuhi</Badge>
        };
        return badges[status as keyof typeof badges];
    };

    const getPriorityBadge = (priority: string) => {
        const badges = {
            low: <Badge variant="outline" className="text-blue-600">Rendah</Badge>,
            medium: <Badge variant="outline" className="text-yellow-600">Sedang</Badge>,
            high: <Badge variant="outline" className="text-red-600">Tinggi</Badge>
        };
        return badges[priority as keyof typeof badges];
    };

    const canEdit = request.status === 'draft' || request.status === 'submitted';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detail ${request.request_number}`} />
            
            <div className="p-4 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold">Detail Permintaan</h1>
                        <p className="text-muted-foreground">{request.request_number}</p>
                    </div>
                    <div className="flex gap-2">
                        {canEdit && (
                            <Button asChild>
                                <Link href={`/department-requests/${request.id}/edit`}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                </Link>
                            </Button>
                        )}
                        <Button variant="outline" asChild>
                            <Link href="/department-requests">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Kembali
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Request Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Informasi Permintaan
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                    <Building className="h-4 w-4" />
                                    Departemen
                                </div>
                                <div>
                                    <div className="font-semibold">{request.department.name}</div>
                                    <div className="text-sm text-muted-foreground">{request.department.code}</div>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                    <User className="h-4 w-4" />
                                    Pemohon
                                </div>
                                <div>
                                    <div className="font-semibold">{request.requested_by.name}</div>
                                    <div className="text-sm text-muted-foreground">{request.requested_by.nip}</div>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    Tanggal Permintaan
                                </div>
                                <div className="font-semibold">
                                    {formatDate(request.request_date)}
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    Tanggal Dibutuhkan
                                </div>
                                <div className="font-semibold">
                                    {formatDate(request.needed_date)}
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-muted-foreground">Status</div>
                                <div>{getStatusBadge(request.status)}</div>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-muted-foreground">Prioritas</div>
                                <div>{getPriorityBadge(request.priority)}</div>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-muted-foreground">Total Estimasi</div>
                                <div className="font-semibold text-green-600">
                                    {formatCurrency(request.total_estimated_cost)}
                                </div>
                                {request.total_approved_cost && (
                                    <div className="text-sm text-muted-foreground">
                                        Disetujui: {formatCurrency(request.total_approved_cost)}
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Purpose */}
                <Card>
                    <CardHeader>
                        <CardTitle>Tujuan Permintaan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-700">{request.purpose}</p>
                    </CardContent>
                </Card>

                {/* Items */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Daftar Item ({request.items.length})
                        </CardTitle>
                        <CardDescription>
                            Item yang diminta dalam permintaan ini
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {request.items.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Barang</TableHead>
                                        <TableHead>Kategori</TableHead>
                                        <TableHead>Jumlah Diminta</TableHead>
                                        {request.status === 'approved' && <TableHead>Jumlah Disetujui</TableHead>}
                                        <TableHead>Estimasi Biaya</TableHead>
                                        {request.status === 'approved' && <TableHead>Biaya Disetujui</TableHead>}
                                        <TableHead>Deskripsi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {request.items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">
                                                        {item.inventory_item?.name || item.custom_item_name}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {item.inventory_item?.code}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {item.inventory_item && (
                                                    <Badge variant="outline">
                                                        {item.inventory_item.category.name}
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{item.quantity_requested}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {item.inventory_item?.unit_of_measure}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            {request.status === 'approved' && (
                                                <TableCell>
                                                    <div className="font-medium text-green-600">
                                                        {item.quantity_approved || 0}
                                                    </div>
                                                </TableCell>
                                            )}
                                            <TableCell>
                                                <div className="font-medium">
                                                    {formatCurrency(item.estimated_cost)}
                                                </div>
                                            </TableCell>
                                            {request.status === 'approved' && (
                                                <TableCell>
                                                    <div className="font-medium text-green-600">
                                                        {formatCurrency(item.approved_cost || 0)}
                                                    </div>
                                                </TableCell>
                                            )}
                                            <TableCell>
                                                <div className="max-w-xs truncate" title={item.description}>
                                                    {item.description || '-'}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                Tidak ada item dalam permintaan ini
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Notes */}
                {(request.notes || request.approval_notes) && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Catatan</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {request.notes && (
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground mb-2">
                                        Catatan Pemohon:
                                    </div>
                                    <p className="text-gray-700">{request.notes}</p>
                                </div>
                            )}
                            
                            {request.approval_notes && (
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground mb-2">
                                        Catatan Persetujuan:
                                    </div>
                                    <p className="text-gray-700">{request.approval_notes}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Timeline */}
                <Card>
                    <CardHeader>
                        <CardTitle>Timeline</CardTitle>
                        <CardDescription>
                            Riwayat status permintaan
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                    <FileText className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                    <div className="font-medium">Permintaan Dibuat</div>
                                    <div className="text-sm text-muted-foreground">
                                        {formatDate(request.created_at)}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        Oleh: {request.requested_by.name}
                                    </div>
                                </div>
                            </div>
                            
                            {request.submitted_at && (
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                                        <AlertCircle className="h-4 w-4 text-orange-600" />
                                    </div>
                                    <div>
                                        <div className="font-medium">Permintaan Diajukan</div>
                                        <div className="text-sm text-muted-foreground">
                                            {formatDate(request.submitted_at)}
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {request.approved_at && (
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                    </div>
                                    <div>
                                        <div className="font-medium">Permintaan Disetujui</div>
                                        <div className="text-sm text-muted-foreground">
                                            {formatDate(request.approved_at)}
                                        </div>
                                        {request.approved_by && (
                                            <div className="text-sm text-muted-foreground">
                                                Oleh: {request.approved_by.name}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            
                            {request.rejected_at && (
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                                        <XCircle className="h-4 w-4 text-red-600" />
                                    </div>
                                    <div>
                                        <div className="font-medium">Permintaan Ditolak</div>
                                        <div className="text-sm text-muted-foreground">
                                            {formatDate(request.rejected_at)}
                                        </div>
                                        {request.approved_by && (
                                            <div className="text-sm text-muted-foreground">
                                                Oleh: {request.approved_by.name}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
