import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { toast } from '@/lib/toast';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft, CheckCircle, FileBarChart, Minus, Save, Send, TrendingDown, TrendingUp, XCircle } from 'lucide-react';
import { useState } from 'react';

interface StockOpnameItem {
    id: number;
    item_id: number;
    system_quantity: number;
    physical_quantity: number;
    variance: number;
    unit_price: number;
    variance_value: number;
    notes?: string;
    item: {
        id: number;
        code: string;
        name: string;
        unit_of_measure: string;
    };
}

interface StockOpname {
    id: number;
    opname_number: string;
    opname_date: string;
    status: 'draft' | 'submitted' | 'approved' | 'rejected';
    notes?: string;
    total_items_counted: number;
    total_variance_value: number;
    rejection_reason?: string;
    department: {
        id: number;
        name: string;
    };
    creator: {
        id: number;
        name: string;
    };
    approver?: {
        id: number;
        name: string;
    };
    approved_at?: string;
    created_at: string;
    items: StockOpnameItem[];
}

interface Props extends SharedData {
    opname: StockOpname;
    isLogistics: boolean;
    isDepartmentHead: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: <FileBarChart className="h-4 w-4" />, href: '/stock-opnames' },
    { title: 'Stock Opname', href: '/stock-opnames' },
    { title: 'Detail', href: '#' },
];

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
};

const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
};

export default function StockOpnameShow() {
    const { opname, isLogistics, isDepartmentHead } = usePage<Props>().props;
    const [editMode, setEditMode] = useState(false);
    const [rejectDialog, setRejectDialog] = useState(false);

    // Form for updating physical counts
    const { data, setData, put, processing } = useForm({
        items: opname.items.map((item) => ({
            id: item.id,
            physical_quantity: item.physical_quantity,
            notes: item.notes || '',
        })),
    });

    // Form for rejection
    const rejectForm = useForm({
        rejection_reason: '',
    });

    const handleUpdateCounts = (e: React.FormEvent) => {
        e.preventDefault();

        put(route('stock-opnames.updateCounts', opname.id), {
            onSuccess: () => {
                setEditMode(false);
            },
            onError: (errors) => {
                toast.error(errors?.message || 'Gagal update physical count');
            },
        });
    };

    const handleSubmit = () => {
        router.post(
            route('stock-opnames.submit', opname.id),
            {},
            {
                onError: (errors) => {
                    toast.error(errors?.message || 'Gagal submit Stock Opname');
                },
            },
        );
    };

    const handleApprove = () => {
        router.post(
            route('stock-opnames.approve', opname.id),
            {},
            {
                onError: (errors) => {
                    toast.error(errors?.message || 'Gagal approve Stock Opname');
                },
            },
        );
    };

    const handleReject = () => {
        rejectForm.post(route('stock-opnames.reject', opname.id), {
            onSuccess: () => {
                setRejectDialog(false);
            },
            onError: (errors) => {
                toast.error(errors?.message || 'Gagal reject Stock Opname');
            },
        });
    };

    const updateItemQuantity = (itemId: number, value: string) => {
        const newItems = data.items.map((item) => (item.id === itemId ? { ...item, physical_quantity: parseFloat(value) || 0 } : item));
        setData('items', newItems);
    };

    const updateItemNotes = (itemId: number, value: string) => {
        const newItems = data.items.map((item) => (item.id === itemId ? { ...item, notes: value } : item));
        setData('items', newItems);
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            draft: { label: 'Draft', className: 'bg-gray-100 text-gray-800', icon: Minus },
            submitted: { label: 'Submitted', className: 'bg-blue-100 text-blue-800', icon: Send },
            approved: { label: 'Approved', className: 'bg-green-100 text-green-800', icon: CheckCircle },
            rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800', icon: XCircle },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
        const Icon = config.icon;

        return (
            <Badge className={config.className}>
                <Icon className="mr-1 h-3 w-3" />
                {config.label}
            </Badge>
        );
    };

    const getVarianceIndicator = (variance: number) => {
        if (variance === 0) {
            return (
                <div className="flex items-center gap-1 text-green-600">
                    <Minus className="h-4 w-4" />
                    <span className="font-medium">Match</span>
                </div>
            );
        } else if (variance > 0) {
            return (
                <div className="flex items-center gap-1 text-blue-600">
                    <TrendingUp className="h-4 w-4" />
                    <span className="font-medium">+{variance}</span>
                </div>
            );
        } else {
            return (
                <div className="flex items-center gap-1 text-red-600">
                    <TrendingDown className="h-4 w-4" />
                    <span className="font-medium">{variance}</span>
                </div>
            );
        }
    };

    const canEdit = opname.status === 'draft';
    const canSubmit = opname.status === 'draft';
    const canApprove = opname.status === 'submitted' && (isLogistics || isDepartmentHead);

    const totalVarianceItems = opname.items.filter((item) => item.variance !== 0).length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Stock Opname - ${opname.opname_number}`} />

            {/* Main Card */}
            <div className='p-4'>
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <div>
                                    <Button variant="outline" size="sm" onClick={() => window.history.back()} className="gap-2">
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CardTitle className="flex items-center gap-2">
                                        <FileBarChart className="h-5 w-5" />
                                        {opname.opname_number}
                                    </CardTitle>
                                    {getStatusBadge(opname.status)}
                                </div>
                                <CardDescription>
                                    Department: {opname.department.name} | Tanggal: {formatDate(opname.opname_date)}
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
                                {canEdit && !editMode && (
                                    <Button variant="outline" onClick={() => setEditMode(true)}>
                                        <Save className="mr-2 h-4 w-4" />
                                        Edit Count
                                    </Button>
                                )}
                                {canSubmit && (
                                    <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
                                        <Send className="mr-2 h-4 w-4" />
                                        Submit
                                    </Button>
                                )}
                                {canApprove && (
                                    <>
                                        <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Approve
                                        </Button>
                                        <Button variant="destructive" onClick={() => setRejectDialog(true)}>
                                            <XCircle className="mr-2 h-4 w-4" />
                                            Reject
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Summary Statistics */}
                        <div className="grid gap-4 rounded-lg bg-gray-50 p-4 md:grid-cols-3 dark:bg-gray-900">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Items</p>
                                <p className="mt-1 text-2xl font-bold">{opname.total_items_counted}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Items dengan Variance</p>
                                <p className="mt-1 text-2xl font-bold">{totalVarianceItems}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Variance Value</p>
                                <p
                                    className={`mt-1 text-2xl font-bold ${opname.total_variance_value > 0 ? 'text-blue-600' : opname.total_variance_value < 0 ? 'text-red-600' : 'text-green-600'}`}
                                >
                                    {formatCurrency(opname.total_variance_value)}
                                </p>
                            </div>
                        </div>

                        {/* Notes */}
                        {opname.notes && (
                            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
                                <h4 className="mb-2 text-sm font-semibold">Catatan</h4>
                                <p className="text-sm text-muted-foreground">{opname.notes}</p>
                            </div>
                        )}

                        {/* Rejection Reason */}
                        {opname.status === 'rejected' && opname.rejection_reason && (
                            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:bg-red-950/30">
                                <h4 className="mb-2 text-sm font-semibold text-red-900 dark:text-red-100">Alasan Penolakan</h4>
                                <p className="text-sm text-red-800 dark:text-red-200">{opname.rejection_reason}</p>
                            </div>
                        )}

                        {/* Info Draft Guide */}
                        {opname.status === 'draft' && (
                            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
                                <div className="flex gap-3">
                                    <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                                    <div>
                                        <h3 className="mb-1 text-sm font-semibold text-blue-900 dark:text-blue-100">Langkah Selanjutnya</h3>
                                        <ul className="list-inside list-disc space-y-1 text-sm text-blue-800 dark:text-blue-200">
                                            <li>Klik "Edit Count" untuk mengisi physical quantity</li>
                                            <li>Pastikan semua item sudah dihitung fisiknya</li>
                                            <li>Review variance yang terdeteksi</li>
                                            <li>Klik "Submit" untuk approval</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Items Table */}
                        <form onSubmit={handleUpdateCounts}>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[60px]">No</TableHead>
                                            <TableHead>Kode</TableHead>
                                            <TableHead>Nama Item</TableHead>
                                            <TableHead>UOM</TableHead>
                                            <TableHead className="text-right">Qty Sistem</TableHead>
                                            <TableHead className="text-right">Qty Fisik</TableHead>
                                            <TableHead className="text-center">Variance</TableHead>
                                            <TableHead className="text-right">Harga</TableHead>
                                            <TableHead className="text-right">Variance Value</TableHead>
                                            {editMode && <TableHead>Catatan</TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {opname.items.map((item, index) => (
                                            <TableRow key={item.id}>
                                                <TableCell>{index + 1}</TableCell>
                                                <TableCell className="font-mono text-sm">{item.item.code}</TableCell>
                                                <TableCell className="font-medium">{item.item.name}</TableCell>
                                                <TableCell>{item.item.unit_of_measure}</TableCell>
                                                <TableCell className="text-right">{item.system_quantity}</TableCell>
                                                <TableCell className="text-right">
                                                    {editMode ? (
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            value={data.items.find((i) => i.id === item.id)?.physical_quantity || 0}
                                                            onChange={(e) => updateItemQuantity(item.id, e.target.value)}
                                                            className="w-24 text-right"
                                                        />
                                                    ) : (
                                                        item.physical_quantity
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">{getVarianceIndicator(item.variance)}</TableCell>
                                                <TableCell className="text-right text-sm text-muted-foreground">
                                                    {formatCurrency(item.unit_price)}
                                                </TableCell>
                                                <TableCell
                                                    className={`text-right font-medium ${item.variance_value > 0 ? 'text-blue-600' : item.variance_value < 0 ? 'text-red-600' : 'text-green-600'}`}
                                                >
                                                    {formatCurrency(item.variance_value)}
                                                </TableCell>
                                                {editMode && (
                                                    <TableCell>
                                                        <Input
                                                            type="text"
                                                            placeholder="Catatan variance..."
                                                            value={data.items.find((i) => i.id === item.id)?.notes || ''}
                                                            onChange={(e) => updateItemNotes(item.id, e.target.value)}
                                                            className="w-48"
                                                        />
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {editMode && (
                                <div className="mt-4 flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={() => setEditMode(false)}>
                                        Batal
                                    </Button>
                                    <Button type="submit" disabled={processing}>
                                        <Save className="mr-2 h-4 w-4" />
                                        {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                                    </Button>
                                </div>
                            )}
                        </form>
                    </CardContent>
                </Card>
            </div>

            {/* Reject Dialog */}
            <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Stock Opname</DialogTitle>
                        <DialogDescription>Berikan alasan penolakan stock opname ini</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="rejection_reason">
                                Alasan Penolakan <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="rejection_reason"
                                placeholder="Jelaskan alasan penolakan..."
                                value={rejectForm.data.rejection_reason}
                                onChange={(e) => rejectForm.setData('rejection_reason', e.target.value)}
                                rows={4}
                            />
                            {rejectForm.errors.rejection_reason && <p className="text-sm text-red-500">{rejectForm.errors.rejection_reason}</p>}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setRejectDialog(false)}>
                            Batal
                        </Button>
                        <Button type="button" variant="destructive" onClick={handleReject} disabled={rejectForm.processing}>
                            {rejectForm.processing ? 'Memproses...' : 'Reject'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
