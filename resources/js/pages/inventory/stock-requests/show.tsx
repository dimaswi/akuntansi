import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, PageProps } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { 
    ArrowLeft, CheckCircle, Clock, Edit, Eye, FileText, Home, 
    Package, Send, Trash2, TruckIcon, XCircle, AlertTriangle 
} from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/lib/toast';
import { route } from 'ziggy-js';

interface StockRequestItem {
    id: number;
    item_id: number;
    quantity_requested: number;
    quantity_approved?: number;
    quantity_issued?: number;  // Backend sends quantity_issued
    notes?: string;
    approval_notes?: string;  // Notes from logistics for each item
    item: {
        id: number;
        code: string;
        name: string;
        unit_of_measure: string;
    };
}

interface StockRequest {
    id: number;
    request_number: string;
    request_date: string;
    status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'completed' | 'cancelled';
    priority: 'low' | 'normal' | 'high' | 'urgent';
    notes?: string;
    rejection_reason?: string;
    department: {
        id: number;
        name: string;
    };
    requested_by: {
        id: number;
        name: string;
    };
    approved_by?: {
        id: number;
        name: string;
    };
    completed_by?: {
        id: number;
        name: string;
    };
    submitted_at?: string;
    approved_at?: string;
    completed_at?: string;
    rejected_at?: string;
    can_edit: boolean;
    can_delete: boolean;
    can_submit: boolean;
    can_approve: boolean;
    can_complete: boolean;
    can_cancel: boolean;
}

interface Props extends PageProps {
    stockRequest: StockRequest;
    items: StockRequestItem[];
}

export default function show() {
    const { stockRequest, items } = usePage<Props>().props;
    const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');

    // Check if there's remaining quantity to approve (partial approval)
    const hasRemainingToApprove = () => {
        if (stockRequest.status !== 'approved') return false;
        return items.some(item => {
            const requested = item.quantity_requested || 0;
            const approved = item.quantity_approved || 0;
            return approved < requested;
        });
    };

    const breadcrumbItems: BreadcrumbItem[] = [
        { title: <Package className="h-4 w-4" />, href: '#' },
        { title: 'Permintaan Stok', href: route('stock-requests.index') },
        { title: stockRequest.request_number, href: '' },
    ];

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            draft: { variant: 'secondary' as const, icon: Edit, label: 'Draft' },
            submitted: { variant: 'default' as const, icon: Clock, label: 'Submitted' },
            approved: { variant: 'default' as const, icon: CheckCircle, label: 'Approved' },
            rejected: { variant: 'destructive' as const, icon: XCircle, label: 'Rejected' },
            completed: { variant: 'default' as const, icon: CheckCircle, label: 'Completed' },
            cancelled: { variant: 'secondary' as const, icon: XCircle, label: 'Cancelled' },
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

    const getPriorityBadge = (priority: string) => {
        const priorityConfig = {
            low: { variant: 'secondary' as const, label: 'Low', icon: null },
            normal: { variant: 'default' as const, label: 'Normal', icon: null },
            high: { variant: 'default' as const, label: 'High', icon: null },
            urgent: { variant: 'destructive' as const, icon: AlertTriangle, label: 'Urgent' },
        };

        const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.normal;
        const Icon = config.icon;

        return (
            <Badge variant={config.variant} className="inline-flex items-center gap-1">
                {Icon && <Icon className="h-3 w-3" />}
                {config.label}
            </Badge>
        );
    };

    const handleSubmit = () => {
        router.post(route('stock-requests.submit', stockRequest.id), {}, {
            onSuccess: () => {
                setSubmitDialogOpen(false);
            },
            onError: (errors) => toast.error(errors?.message || 'Failed to submit Permintaan Stok'),
        });
    };

    const handleDelete = () => {
        router.delete(route('stock-requests.destroy', stockRequest.id), {
            onSuccess: () => {
                setDeleteDialogOpen(false);
            },
            onError: (errors) => toast.error(errors?.message || 'Failed to delete Permintaan Stok'),
        });
    };

    const handleCancel = () => {
        if (!cancelReason.trim()) {
            toast.error('Please provide a reason for cancellation');
            return;
        }
        
        router.post(route('stock-requests.cancel', stockRequest.id), {
            reason: cancelReason,
        }, {
            onSuccess: () => {
                setCancelDialogOpen(false);
                setCancelReason('');
            },
            onError: (errors) => toast.error(errors?.message || 'Failed to cancel Permintaan Stok'),
        });
    };

    const handleComplete = () => {
        router.post(route('stock-requests.complete', stockRequest.id), {}, {
            onSuccess: () => {
                setCompleteDialogOpen(false);
            },
            onError: (errors) => toast.error(errors?.message || 'Failed to complete Permintaan Stok'),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbItems}>
            <Head title={`Permintaan Stok - ${stockRequest.request_number}`} />

            <div className="space-y-6 mt-6">
                {/* Header with Actions */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.visit(route('stock-requests.index'))}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-semibold text-gray-900">
                                    {stockRequest.request_number}
                                </h1>
                                {getStatusBadge(stockRequest.status)}
                                {getPriorityBadge(stockRequest.priority)}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                                Permintaan Stok details and items
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {stockRequest.can_edit && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.visit(route('stock-requests.edit', stockRequest.id))}
                            >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                        )}
                        {stockRequest.can_submit && (
                            <Button
                                variant="default"
                                size="sm"
                                onClick={() => setSubmitDialogOpen(true)}
                            >
                                <Send className="h-4 w-4 mr-2" />
                                Submit
                            </Button>
                        )}
                        {stockRequest.can_approve && !hasRemainingToApprove() && (
                            <Button
                                variant="default"
                                size="sm"
                                onClick={() => router.visit(route('stock-requests.approve', stockRequest.id))}
                            >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                            </Button>
                        )}
                        {stockRequest.can_approve && hasRemainingToApprove() && (
                            <Button
                                variant="default"
                                size="sm"
                                onClick={() => router.visit(route('stock-requests.approve', stockRequest.id))}
                            >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve Sisanya
                            </Button>
                        )}
                        {stockRequest.can_complete && (
                            <Button
                                variant="default"
                                size="sm"
                                onClick={() => setCompleteDialogOpen(true)}
                            >
                                <TruckIcon className="h-4 w-4 mr-2" />
                                Complete
                            </Button>
                        )}
                        {stockRequest.can_cancel && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCancelDialogOpen(true)}
                            >
                                <XCircle className="h-4 w-4 mr-2" />
                                Cancel
                            </Button>
                        )}
                        {stockRequest.can_delete && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setDeleteDialogOpen(true)}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </Button>
                        )}
                    </div>
                </div>

                {/* Partial Approval Warning */}
                {stockRequest.status === 'approved' && hasRemainingToApprove() && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-yellow-800">Partial Approval</h4>
                                <p className="text-sm text-yellow-700 mt-1">
                                    Beberapa item belum di-approve sepenuhnya. Klik "Approve Sisanya" untuk melanjutkan approval,
                                    atau klik "Complete" untuk menyelesaikan permintaan dengan item yang sudah di-approve saja.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Request Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Request Information
                        </CardTitle>
                        <CardDescription>
                            Basic information about this Permintaan Stok
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Request Number</p>
                                <p className="text-base font-semibold mt-1">{stockRequest.request_number}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Request Date</p>
                                <p className="text-base font-semibold mt-1">
                                    {new Date(stockRequest.request_date).toLocaleDateString('id-ID')}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Department</p>
                                <p className="text-base font-semibold mt-1">{stockRequest.department.name}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Requester</p>
                                <p className="text-base font-semibold mt-1">{stockRequest.requested_by.name}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Status</p>
                                <div className="mt-1">{getStatusBadge(stockRequest.status)}</div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Priority</p>
                                <div className="mt-1">{getPriorityBadge(stockRequest.priority)}</div>
                            </div>
                            {stockRequest.approved_by && (
                                <>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Approved By</p>
                                        <p className="text-base font-semibold mt-1">{stockRequest.approved_by.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Approved At</p>
                                        <p className="text-base font-semibold mt-1">
                                            {stockRequest.approved_at ? new Date(stockRequest.approved_at).toLocaleDateString('id-ID') : '-'}
                                        </p>
                                    </div>
                                </>
                            )}
                            {stockRequest.completed_at && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Completed At</p>
                                    <p className="text-base font-semibold mt-1">
                                        {new Date(stockRequest.completed_at).toLocaleDateString('id-ID')}
                                    </p>
                                </div>
                            )}
                            {stockRequest.rejected_at && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Rejected At</p>
                                    <p className="text-base font-semibold mt-1">
                                        {new Date(stockRequest.rejected_at).toLocaleDateString('id-ID')}
                                    </p>
                                </div>
                            )}
                            {stockRequest.notes && (
                                <div className="md:col-span-2 lg:col-span-3">
                                    <p className="text-sm font-medium text-gray-500">Notes</p>
                                    <p className="text-base mt-1">{stockRequest.notes}</p>
                                </div>
                            )}
                            {stockRequest.rejection_reason && (
                                <div className="md:col-span-2 lg:col-span-3">
                                    <p className="text-sm font-medium text-gray-500">Rejection Reason</p>
                                    <div className="mt-1 p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <p className="text-base text-red-800">{stockRequest.rejection_reason}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Request Items */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Request Items
                        </CardTitle>
                        <CardDescription>
                            Items included in this Permintaan Stok
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="w-[100px]">Item Code</TableHead>
                                        <TableHead>Item Name</TableHead>
                                        <TableHead className="w-[100px] text-center">Unit</TableHead>
                                        <TableHead className="w-[120px] text-right">Qty Requested</TableHead>
                                        {(stockRequest.status === 'approved' || stockRequest.status === 'completed') && (
                                            <TableHead className="w-[120px] text-right">Qty Approved</TableHead>
                                        )}
                                        {stockRequest.status === 'completed' && (
                                            <TableHead className="w-[120px] text-right">Qty Completed</TableHead>
                                        )}
                                        <TableHead>Catatan Peminta</TableHead>
                                        {(stockRequest.status === 'approved' || stockRequest.status === 'completed') && (
                                            <TableHead>Catatan Logistik</TableHead>
                                        )}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((item: any) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.item.code}</TableCell>
                                            <TableCell>{item.item.name}</TableCell>
                                            <TableCell className="text-center">{item.item.unit_of_measure}</TableCell>
                                            <TableCell className="text-right font-semibold">
                                                {item.quantity_requested.toLocaleString()}
                                            </TableCell>
                                            {(stockRequest.status === 'approved' || stockRequest.status === 'completed') && (
                                                <TableCell className="text-right font-semibold">
                                                    {item.quantity_approved > 0 ? (
                                                        <span className="text-green-600">{item.quantity_approved.toLocaleString()}</span>
                                                    ) : (
                                                        <Badge variant="secondary" className="text-xs">Pending</Badge>
                                                    )}
                                                </TableCell>
                                            )}
                                            {stockRequest.status === 'completed' && (
                                                <TableCell className="text-right font-semibold text-blue-600">
                                                    {item.quantity_issued?.toLocaleString() || '-'}
                                                </TableCell>
                                            )}
                                            <TableCell className="text-sm text-gray-600">
                                                {item.notes || '-'}
                                            </TableCell>
                                            {(stockRequest.status === 'approved' || stockRequest.status === 'completed') && (
                                                <TableCell className="text-sm text-blue-700">
                                                    {item.approval_notes || '-'}
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Submit Confirmation Dialog */}
            <AlertDialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Submit Permintaan Stok?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to submit this request? Once submitted, it will be sent for approval and cannot be edited.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSubmit}>
                            Submit
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the Permintaan Stok and remove the data from the server.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Cancel Confirmation Dialog */}
            <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Permintaan Stok?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to cancel this request? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                        <Label htmlFor="cancel-reason">Cancellation Reason *</Label>
                        <Textarea
                            id="cancel-reason"
                            placeholder="Please provide a reason for cancelling this request..."
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            className="mt-2"
                            rows={3}
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setCancelReason('')}>No, Keep It</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancel}>
                            Yes, Cancel Request
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Complete Confirmation Dialog */}
            <AlertDialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Complete Permintaan Stok?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to complete this request? This will transfer items to the department and cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleComplete}>
                            Complete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
