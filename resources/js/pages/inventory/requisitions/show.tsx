import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, PageProps } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Edit, Send, CheckCircle, XCircle, FileText, Calendar, User, Building, DollarSign, Package } from 'lucide-react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

interface RequisitionItem {
    id: number;
    quantity_requested: number;
    quantity_approved?: number;
    estimated_unit_price: number;
    notes?: string;
    approval_notes?: string;
    item: {
        id: number;
        code: string;
        name: string;
        unit_of_measure: string;
    };
}

interface Requisition {
    id: number;
    requisition_number: string;
    request_date: string;
    required_date: string;
    status: 'draft' | 'submitted' | 'approved' | 'partially_approved' | 'rejected' | 'cancelled';
    total_estimated_cost?: number;
    notes?: string;
    rejection_reason?: string;
    department: {
        id: number;
        name: string;
    };
    requester: {
        id: number;
        name: string;
    };
    approver?: {
        id: number;
        name: string;
    };
    approved_at?: string;
    rejected_at?: string;
    created_at: string;
    updated_at: string;
    items: RequisitionItem[];
}

interface Props extends PageProps {
    requisition: Requisition;
}

const breadcrumbItems = (requisition: Requisition): BreadcrumbItem[] => [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Inventory', href: '/inventory' },
    { title: 'Requisitions', href: route('requisitions.index') },
    { title: requisition.requisition_number, href: '' },
];

const getStatusBadge = (status: string) => {
    const statusConfig = {
        draft: { variant: 'secondary' as const, icon: Edit, label: 'Draft' },
        submitted: { variant: 'default' as const, icon: Send, label: 'Submitted' },
        approved: { variant: 'default' as const, icon: CheckCircle, label: 'Approved' },
        partially_approved: { variant: 'default' as const, icon: CheckCircle, label: 'Partially Approved' },
        rejected: { variant: 'destructive' as const, icon: XCircle, label: 'Rejected' },
        cancelled: { variant: 'destructive' as const, icon: XCircle, label: 'Cancelled' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;

    return (
        <Badge variant={config.variant} className="inline-flex items-center gap-1">
            <Icon className="h-3 w-3" />
            {config.label}
        </Badge>
    );
};

export default function RequisitionShow() {
    const { requisition } = usePage<Props>().props;

    const handleSubmit = () => {
        if (confirm(`Are you sure you want to submit requisition ${requisition.requisition_number} for approval?`)) {
            router.put(route('requisitions.submit', requisition.id), {}, {
                onSuccess: () => {
                    toast.success('Requisition submitted for approval');
                },
                onError: () => {
                    toast.error('Failed to submit requisition');
                }
            });
        }
    };

    const handleApprove = () => {
        if (confirm(`Are you sure you want to approve requisition ${requisition.requisition_number}?`)) {
            router.put(route('requisitions.approve', requisition.id), {}, {
                onSuccess: () => {
                    toast.success('Requisition approved successfully');
                },
                onError: () => {
                    toast.error('Failed to approve requisition');
                }
            });
        }
    };

    const handleReject = () => {
        const reason = prompt(`Please provide a reason for rejecting requisition ${requisition.requisition_number}:`);
        if (reason) {
            router.put(route('requisitions.reject', requisition.id), { rejection_reason: reason }, {
                onSuccess: () => {
                    toast.success('Requisition rejected');
                },
                onError: () => {
                    toast.error('Failed to reject requisition');
                }
            });
        }
    };

    const handleCancel = () => {
        if (confirm(`Are you sure you want to cancel requisition ${requisition.requisition_number}?`)) {
            router.put(route('requisitions.cancel', requisition.id), {}, {
                onSuccess: () => {
                    toast.success('Requisition cancelled');
                },
                onError: () => {
                    toast.error('Failed to cancel requisition');
                }
            });
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const calculateTotal = () => {
        return requisition.items.reduce(
            (total, item) => total + (item.quantity_requested * item.estimated_unit_price),
            0
        );
    };

    const getApprovedTotal = () => {
        return requisition.items.reduce(
            (total, item) => total + ((item.quantity_approved || 0) * item.estimated_unit_price),
            0
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbItems(requisition)}>
            <Head title={`Requisition ${requisition.requisition_number}`} />

            <div className="space-y-6">
                {/* Header */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Requisition Details
                                </CardTitle>
                                <CardDescription>
                                    {requisition.requisition_number}
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => router.get(route('requisitions.index'))}
                                    className="gap-2"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Back to List
                                </Button>
                                
                                {/* Action Buttons */}
                                {requisition.status === 'draft' && (
                                    <>
                                        <Button
                                            variant="outline"
                                            onClick={() => router.get(route('requisitions.edit', requisition.id))}
                                            className="gap-2"
                                        >
                                            <Edit className="h-4 w-4" />
                                            Edit
                                        </Button>
                                        <Button
                                            onClick={handleSubmit}
                                            className="gap-2"
                                        >
                                            <Send className="h-4 w-4" />
                                            Submit for Approval
                                        </Button>
                                    </>
                                )}

                                {requisition.status === 'submitted' && (
                                    <>
                                        <Button
                                            onClick={handleApprove}
                                            className="gap-2 bg-green-600 hover:bg-green-700"
                                        >
                                            <CheckCircle className="h-4 w-4" />
                                            Approve
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            onClick={handleReject}
                                            className="gap-2"
                                        >
                                            <XCircle className="h-4 w-4" />
                                            Reject
                                        </Button>
                                    </>
                                )}

                                {(requisition.status === 'draft' || requisition.status === 'submitted') && (
                                    <Button
                                        variant="outline"
                                        onClick={handleCancel}
                                        className="gap-2 text-destructive"
                                    >
                                        <XCircle className="h-4 w-4" />
                                        Cancel
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {/* Basic Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Request Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm text-muted-foreground">Requisition Number</Label>
                                    <p className="font-medium">{requisition.requisition_number}</p>
                                </div>
                                <div>
                                    <Label className="text-sm text-muted-foreground">Status</Label>
                                    <div className="mt-1">
                                        {getStatusBadge(requisition.status)}
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-sm text-muted-foreground">Request Date</Label>
                                    <p className="font-medium">{formatDate(requisition.request_date)}</p>
                                </div>
                                <div>
                                    <Label className="text-sm text-muted-foreground">Required Date</Label>
                                    <p className="font-medium">{formatDate(requisition.required_date)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                People Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <Label className="text-sm text-muted-foreground">Department</Label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Building className="h-4 w-4 text-muted-foreground" />
                                        <p className="font-medium">{requisition.department.name}</p>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-sm text-muted-foreground">Requester</Label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <p className="font-medium">{requisition.requester.name}</p>
                                    </div>
                                </div>
                                {requisition.approver && (
                                    <div>
                                        <Label className="text-sm text-muted-foreground">Approver</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                            <p className="font-medium">{requisition.approver.name}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Notes */}
                {(requisition.notes || requisition.rejection_reason) && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Notes</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {requisition.notes && (
                                <div>
                                    <Label className="text-sm text-muted-foreground">Request Notes</Label>
                                    <p className="mt-1 p-3 bg-muted rounded-md">{requisition.notes}</p>
                                </div>
                            )}
                            {requisition.rejection_reason && (
                                <div>
                                    <Label className="text-sm text-muted-foreground">Rejection Reason</Label>
                                    <p className="mt-1 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive">
                                        {requisition.rejection_reason}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Items */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Requisition Items
                        </CardTitle>
                        <CardDescription>
                            {requisition.items.length} item(s) requested
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item Code</TableHead>
                                        <TableHead>Item Name</TableHead>
                                        <TableHead>Unit</TableHead>
                                        <TableHead>Qty Requested</TableHead>
                                        {(requisition.status === 'approved' || requisition.status === 'partially_approved') && (
                                            <TableHead>Qty Approved</TableHead>
                                        )}
                                        <TableHead>Est. Unit Price</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead>Notes</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {requisition.items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-mono">{item.item.code}</TableCell>
                                            <TableCell>
                                                <div className="font-medium">{item.item.name}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {item.item.unit_of_measure}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{item.quantity_requested}</TableCell>
                                            {(requisition.status === 'approved' || requisition.status === 'partially_approved') && (
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <span>{item.quantity_approved || 0}</span>
                                                        {item.quantity_approved !== item.quantity_requested && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                Partial
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            )}
                                            <TableCell>{formatCurrency(item.estimated_unit_price)}</TableCell>
                                            <TableCell>{formatCurrency(item.quantity_requested * item.estimated_unit_price)}</TableCell>
                                            <TableCell>
                                                {item.notes ? (
                                                    <span className="text-sm text-muted-foreground">{item.notes}</span>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Totals */}
                            <div className="border-t bg-muted/50 p-4 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">Total Estimated Cost:</span>
                                    <span className="text-lg font-bold">
                                        {formatCurrency(calculateTotal())}
                                    </span>
                                </div>
                                {(requisition.status === 'approved' || requisition.status === 'partially_approved') && (
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium">Approved Cost:</span>
                                        <span className="text-lg font-bold text-green-600">
                                            {formatCurrency(getApprovedTotal())}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Timeline */}
                <Card>
                    <CardHeader>
                        <CardTitle>Timeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <div>
                                    <p className="font-medium">Requisition Created</p>
                                    <p className="text-sm text-muted-foreground">
                                        {formatDateTime(requisition.created_at)} by {requisition.requester.name}
                                    </p>
                                </div>
                            </div>
                            
                            {requisition.status !== 'draft' && (
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                    <div>
                                        <p className="font-medium">Submitted for Approval</p>
                                        <p className="text-sm text-muted-foreground">
                                            {formatDateTime(requisition.updated_at)}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {requisition.approved_at && (
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <div>
                                        <p className="font-medium">Approved</p>
                                        <p className="text-sm text-muted-foreground">
                                            {formatDateTime(requisition.approved_at)} by {requisition.approver?.name}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {requisition.rejected_at && (
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    <div>
                                        <p className="font-medium">Rejected</p>
                                        <p className="text-sm text-muted-foreground">
                                            {formatDateTime(requisition.rejected_at)} by {requisition.approver?.name}
                                        </p>
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
