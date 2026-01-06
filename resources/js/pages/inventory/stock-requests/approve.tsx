import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, PageProps } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft, CheckCircle, Home, Package, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/lib/toast';
import { route } from 'ziggy-js';

interface Item {
    id: number;
    code: string;
    name: string;
    unit_of_measure: string;
    central_stock: {
        quantity_on_hand: number;
        available_quantity: number;
        average_unit_cost: number;
    } | null;
}

interface StockRequestItem {
    id: number;
    item_id: number;
    quantity_requested: number;
    quantity_approved?: number;  // Track already approved quantity
    notes?: string;
    approval_notes?: string;  // Existing approval notes from previous approval
    item: Item;
    central_stock: {
        quantity_on_hand: number;
        available_quantity: number;
        average_unit_cost: number;
    } | null;
}

interface StockRequest {
    id: number;
    request_number: string;
    request_date: string;
    priority: string;
    notes?: string;
    department: {
        id: number;
        name: string;
    };
    requested_by: {
        id: number;
        name: string;
    };
    items: StockRequestItem[];
}

interface Props extends PageProps {
    stockRequest: StockRequest;
}

export default function approve() {
    const { stockRequest } = usePage<Props>().props;

    const breadcrumbItems: BreadcrumbItem[] = [
        { title: <Package className="h-4 w-4" />, href: '#' },
        { title: 'Permintaan Stok', href: route('stock-requests.index') },
        { title: stockRequest.request_number, href: route('stock-requests.show', stockRequest.id) },
        { title: 'Approve', href: '' },
    ];

    // Format number helper - smart formatting without trailing zeros
    const formatNumber = (num: number | string): string => {
        // Convert to number if string
        const value = typeof num === 'string' ? parseFloat(num) : num;
        
        // Check if it's a valid number
        if (isNaN(value)) return '0';
        
        // Check if it's a whole number (no decimals)
        const isWholeNumber = Number.isInteger(value);
        
        if (isWholeNumber) {
            // For whole numbers, use locale string only if >= 1000
            if (value >= 1000 || value <= -1000) {
                return value.toLocaleString('id-ID');
            }
            return value.toString();
        } else {
            // For decimal numbers, format with up to 2 decimal places
            if (Math.abs(value) >= 1000) {
                return value.toLocaleString('id-ID', { 
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2 
                });
            }
            // Remove trailing zeros for small decimals
            return value.toFixed(2).replace(/\.?0+$/, '');
        }
    };

    const [approvalData, setApprovalData] = useState(
        stockRequest.items
            .filter(item => {
                // Filter out items that are fully approved
                const remaining = item.quantity_requested - (item.quantity_approved || 0);
                return remaining > 0;
            })
            .map((item) => {
            // Calculate remaining quantity (if partial approval already done)
            const remaining = item.quantity_requested - (item.quantity_approved || 0);
            // Check if central stock is 0 or not available
            const centralStockQty = item.central_stock?.available_quantity ?? 0;
            const hasNoStock = centralStockQty <= 0;
            
            // Default approved qty is minimum of remaining and available stock
            // This ensures we don't default to more than what's available
            let defaultApprovedQty = 0;
            if (!hasNoStock && remaining > 0) {
                defaultApprovedQty = Math.min(remaining, centralStockQty);
            }
            
            // Auto-generate note if stock is insufficient
            let defaultNote = item.approval_notes || '';
            if (hasNoStock && !defaultNote) {
                defaultNote = 'Pending - stok pusat kosong';
            } else if (centralStockQty > 0 && centralStockQty < remaining && !defaultNote) {
                defaultNote = `Stok hanya ${centralStockQty}, diminta ${remaining}`;
            }
            
            return {
                id: item.id,  // stock_request_item ID (untuk backend)
                item_id: item.item_id,  // item ID (untuk lookup)
                quantity_approved: defaultApprovedQty,
                previously_approved: item.quantity_approved || 0,  // Track previous approval
                approval_notes: defaultNote,
                // Default not selected if no stock
                selected: !hasNoStock && remaining > 0,
            };
        })
    );

    const [rejectionReason, setRejectionReason] = useState('');
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<any>({});
    const [showRejectForm, setShowRejectForm] = useState(false);

    const updateApprovalQuantity = (itemId: number, quantity: number) => {
        setApprovalData((prev) =>
            prev.map((item) =>
                item.item_id === itemId
                    ? { ...item, quantity_approved: quantity }
                    : item
            )
        );
    };

    const updateApprovalNotes = (itemId: number, notes: string) => {
        setApprovalData((prev) =>
            prev.map((item) =>
                item.item_id === itemId
                    ? { ...item, approval_notes: notes }
                    : item
            )
        );
    };

    const toggleItemSelection = (itemId: number, selected: boolean) => {
        // Find the item to check if it has stock
        const stockRequestItem = stockRequest.items.find(i => i.item_id === itemId);
        const hasNoStock = (stockRequestItem?.central_stock?.available_quantity ?? 0) <= 0;
        
        // Don't allow selection if no stock
        if (selected && hasNoStock) {
            return;
        }
        
        setApprovalData((prev) =>
            prev.map((item) =>
                item.item_id === itemId
                    ? { 
                        ...item, 
                        selected,
                        // If unselected, set qty to 0 (pending)
                        quantity_approved: selected ? item.quantity_approved : 0,
                        // Auto-add note if pending
                        approval_notes: selected ? item.approval_notes : (item.approval_notes || 'Pending - belum diproses')
                    }
                    : item
            )
        );
    };

    const toggleAllItems = (selected: boolean) => {
        setApprovalData((prev) =>
            prev.map((item) => {
                const stockRequestItem = stockRequest.items.find(i => i.item_id === item.item_id);
                const remaining = stockRequestItem 
                    ? stockRequestItem.quantity_requested - (stockRequestItem.quantity_approved || 0)
                    : 0;
                const centralStock = stockRequestItem?.central_stock?.available_quantity ?? 0;
                const hasNoStock = centralStock <= 0;
                
                // Don't allow selection if no stock
                if (selected && hasNoStock) {
                    return {
                        ...item,
                        selected: false,
                        quantity_approved: 0,
                        approval_notes: item.approval_notes || 'Pending - stok pusat kosong'
                    };
                }
                
                return {
                    ...item,
                    selected,
                    quantity_approved: selected ? remaining : 0,
                    approval_notes: selected ? '' : 'Pending - belum diproses'
                };
            })
        );
    };

    // Only count items with stock for allSelected calculation
    const itemsWithStock = approvalData.filter((item) => {
        const stockRequestItem = stockRequest.items.find(i => i.item_id === item.item_id);
        return (stockRequestItem?.central_stock?.available_quantity ?? 0) > 0;
    });
    const allSelected = itemsWithStock.length > 0 && itemsWithStock.every((item) => item.selected);
    const someSelected = approvalData.some((item) => item.selected);

    const handleApprove = () => {
        // Get only selected items for validation
        const selectedItems = approvalData.filter((item) => item.selected);
        
        // Validate at least one item has qty > 0 OR all items are intentionally set to 0 (pending)
        const itemsWithQty = selectedItems.filter((item) => item.quantity_approved > 0);
        if (selectedItems.length > 0 && itemsWithQty.length === 0) {
            // All selected items have 0 qty - this is fine, they will be processed as pending
        }

        // Validate tidak melebihi sisa yang belum diapprove
        const exceedingItems = approvalData.filter((item) => {
            const stockRequestItem = stockRequest.items.find(i => i.item_id === item.item_id);
            if (!stockRequestItem) return false;
            const remaining = stockRequestItem.quantity_requested - (stockRequestItem.quantity_approved || 0);
            return item.quantity_approved > remaining;
        });
        
        if (exceedingItems.length > 0) {
            toast.error('Qty approve tidak boleh melebihi sisa yang belum diapprove');
            return;
        }

        setProcessing(true);
        router.post(
            route('stock-requests.approve.store', stockRequest.id),
            {
                action: 'approve',
                items: approvalData,
            } as any,
            {
                onError: (errors) => {
                    setErrors(errors);
                    toast.error(errors?.message || 'Failed to approve Permintaan Stok');
                },
                onFinish: () => setProcessing(false),
            }
        );
    };

    const handleReject = () => {
        if (!rejectionReason.trim()) {
            toast.error('Please provide a rejection reason');
            return;
        }

        setProcessing(true);
        router.post(
            route('stock-requests.approve.store', stockRequest.id),
            {
                action: 'reject',
                rejection_reason: rejectionReason,
            } as any,
            {
                onError: (errors) => {
                    setErrors(errors);
                    toast.error(errors?.message || 'Failed to reject Permintaan Stok');
                },
                onFinish: () => setProcessing(false),
            }
        );
    };

    const getTotalRequested = () => {
        return stockRequest.items.reduce((sum, item) => sum + item.quantity_requested, 0);
    };

    const getTotalApproved = () => {
        return approvalData.reduce((sum, item) => sum + item.quantity_approved, 0);
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

    return (
        <AppLayout breadcrumbs={breadcrumbItems}>
            <Head title={`Approve Permintaan Stok - ${stockRequest.request_number}`} />

            <div className="space-y-6 mt-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.visit(route('stock-requests.show', stockRequest.id))}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Kembali
                        </Button>
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">
                                Approve Permintaan Stok
                            </h1>
                            <p className="text-sm text-gray-600 mt-1">
                                {stockRequest.request_number}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {!showRejectForm ? (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowRejectForm(true)}
                                    disabled={processing}
                                >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Tolak
                                </Button>
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={handleApprove}
                                    disabled={processing}
                                >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    {processing ? 'Memproses...' : 'Approve Permintaan'}
                                </Button>
                            </>
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowRejectForm(false)}
                                disabled={processing}
                            >
                                Batal Tolak
                            </Button>
                        )}
                    </div>
                </div>

                {/* Request Summary */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Ringkasan Permintaan
                        </CardTitle>
                        <CardDescription>
                            Tinjau detail permintaan stok sebelum approval
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Nomor Permintaan</p>
                                <p className="text-base font-semibold mt-1">{stockRequest.request_number}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Tanggal Permintaan</p>
                                <p className="text-base font-semibold mt-1">
                                    {new Date(stockRequest.request_date).toLocaleDateString('id-ID')}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Prioritas</p>
                                <div className="mt-1">{getPriorityBadge(stockRequest.priority)}</div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Departemen</p>
                                <p className="text-base font-semibold mt-1">{stockRequest.department.name}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Peminta</p>
                                <p className="text-base font-semibold mt-1">{stockRequest.requested_by.name}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Item</p>
                                <p className="text-base font-semibold mt-1">{stockRequest.items.length} items</p>
                            </div>
                            {stockRequest.notes && (
                                <div className="md:col-span-3">
                                    <p className="text-sm font-medium text-gray-500">Catatan Permintaan</p>
                                    <p className="text-base mt-1">{stockRequest.notes}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Rejection Form (if showing) */}
                {showRejectForm && (
                    <Card className="border-red-200 bg-red-50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-900">
                                <XCircle className="h-5 w-5" />
                                Tolak Permintaan Stok
                            </CardTitle>
                            <CardDescription className="text-red-800">
                                Silakan berikan alasan penolakan untuk permintaan stok ini
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="rejection_reason" className="text-red-900">
                                        Alasan Penolakan <span className="text-red-600">*</span>
                                    </Label>
                                    <Textarea
                                        id="rejection_reason"
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        rows={3}
                                        placeholder="Jelaskan mengapa permintaan ini ditolak..."
                                        className="mt-2 bg-white"
                                    />
                                    {errors.rejection_reason && (
                                        <p className="text-sm text-red-700 mt-1">
                                            {errors.rejection_reason}
                                        </p>
                                    )}
                                </div>
                                <div className="flex justify-end">
                                    <Button
                                        variant="destructive"
                                        onClick={handleReject}
                                        disabled={processing}
                                    >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        {processing ? 'Memproses...' : 'Konfirmasi Penolakan'}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Approval Items */}
                {!showRejectForm && (
                    <>
                        <Card>
                            <CardHeader>
                                <CardTitle>Item Approval</CardTitle>
                                <CardDescription>
                                    Tinjau dan sesuaikan kuantitas yang disetujui untuk setiap item
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="border rounded-lg overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/50">
                                                <TableHead className="w-[50px] text-center">
                                                    <Checkbox
                                                        checked={allSelected}
                                                        onCheckedChange={(checked) => toggleAllItems(!!checked)}
                                                        aria-label="Select all"
                                                    />
                                                </TableHead>
                                                <TableHead className="w-[100px]">Kode Item</TableHead>
                                                <TableHead>Nama Item</TableHead>
                                                <TableHead className="w-[100px] text-center">Satuan</TableHead>
                                                <TableHead className="w-[120px] text-right">
                                                    Stok Pusat
                                                </TableHead>
                                                <TableHead className="w-[100px] text-right">
                                                    Diminta
                                                </TableHead>
                                                <TableHead className="w-[100px] text-right">
                                                    Sudah Approve
                                                </TableHead>
                                                <TableHead className="w-[100px] text-right">
                                                    Sisa Nanti
                                                </TableHead>
                                                <TableHead className="w-[150px]">
                                                    Qty Approve
                                                </TableHead>
                                                <TableHead className="w-[180px]">Catatan Peminta</TableHead>
                                                <TableHead className="w-[200px]">Catatan Logistik</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {stockRequest.items
                                                .filter(item => {
                                                    // Filter out items that are fully approved (no remaining qty)
                                                    const previouslyApproved = item.quantity_approved || 0;
                                                    const remaining = item.quantity_requested - previouslyApproved;
                                                    return remaining > 0;
                                                })
                                                .map((item, index) => {
                                                const itemData = approvalData.find((a) => a.item_id === item.item_id);
                                                const approvedQty = itemData?.quantity_approved || 0;
                                                const isSelected = itemData?.selected ?? true;
                                                const previouslyApproved = item.quantity_approved || 0;
                                                const remaining = item.quantity_requested - previouslyApproved;
                                                const sisaNanti = remaining - approvedQty;
                                                const centralStock = item.central_stock?.available_quantity ?? 0;
                                                const hasNoStock = centralStock <= 0;
                                                const isInsufficientStock = centralStock > 0 && approvedQty > centralStock;

                                                return (
                                                    <TableRow key={item.id} className={`${!isSelected ? 'bg-gray-50 opacity-60' : ''} ${hasNoStock ? 'bg-red-50' : ''}`}>
                                                        <TableCell className="text-center">
                                                            <Checkbox
                                                                checked={isSelected}
                                                                onCheckedChange={(checked) => toggleItemSelection(item.item_id, !!checked)}
                                                                aria-label={`Select ${item.item.name}`}
                                                                disabled={hasNoStock}  // Disable checkbox if no stock
                                                            />
                                                        </TableCell>
                                                        <TableCell className="font-medium">
                                                            {item.item.code}
                                                        </TableCell>
                                                        <TableCell>{item.item.name}</TableCell>
                                                        <TableCell className="text-center">
                                                            {item.item.unit_of_measure}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {item.central_stock && item.central_stock.available_quantity !== undefined ? (
                                                                <div className="space-y-1">
                                                                    <div className="font-semibold">
                                                                        {formatNumber(item.central_stock.available_quantity)}
                                                                    </div>
                                                                    {hasNoStock && (
                                                                        <Badge
                                                                            variant="destructive"
                                                                            className="text-xs"
                                                                        >
                                                                            Stok Kosong
                                                                        </Badge>
                                                                    )}
                                                                    {isInsufficientStock && !hasNoStock && (
                                                                        <Badge
                                                                            variant="destructive"
                                                                            className="text-xs"
                                                                        >
                                                                            Tidak Cukup
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    Tidak Ada Data Stok
                                                                </Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right font-semibold">
                                                            {formatNumber(item.quantity_requested)}
                                                        </TableCell>
                                                        <TableCell className="text-right text-green-600 font-semibold">
                                                            {previouslyApproved > 0 ? formatNumber(previouslyApproved) : '-'}
                                                        </TableCell>
                                                        <TableCell className="text-right text-blue-600 font-semibold">
                                                            {/* Sisa Nanti = remaining - qty yang akan diapprove sekarang */}
                                                            {sisaNanti > 0 ? formatNumber(sisaNanti) : (sisaNanti === 0 ? '0' : '-')}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                step="1"
                                                                min="0"
                                                                max={remaining}
                                                                value={approvedQty}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    let newQty = val === '' ? 0 : parseFloat(val);
                                                                    // Enforce max = remaining
                                                                    if (newQty > remaining) {
                                                                        newQty = remaining;
                                                                    }
                                                                    updateApprovalQuantity(
                                                                        item.item_id,
                                                                        newQty
                                                                    );
                                                                    // Auto-select if qty > 0
                                                                    if (newQty > 0 && !isSelected) {
                                                                        toggleItemSelection(item.item_id, true);
                                                                    }
                                                                }}
                                                                onBlur={(e) => {
                                                                    // Re-validate on blur
                                                                    const val = parseFloat(e.target.value) || 0;
                                                                    if (val > remaining) {
                                                                        updateApprovalQuantity(item.item_id, remaining);
                                                                        toast.error(`Qty tidak boleh melebihi sisa (${remaining})`);
                                                                    }
                                                                }}
                                                                disabled={!isSelected || hasNoStock}
                                                                className={`text-right ${
                                                                    isInsufficientStock || approvedQty > remaining
                                                                        ? 'border-red-500'
                                                                        : ''
                                                                } ${(!isSelected || hasNoStock) ? 'bg-gray-100' : ''}`}
                                                            />
                                                            {approvedQty > remaining && (
                                                                <p className="text-xs text-red-600 mt-1">
                                                                    Max: {formatNumber(remaining)}
                                                                </p>
                                                            )}
                                                            {hasNoStock && (
                                                                <Badge variant="destructive" className="mt-1 text-xs">
                                                                    Menunggu Stok
                                                                </Badge>
                                                            )}
                                                            {!isSelected && !hasNoStock && (
                                                                <Badge variant="secondary" className="mt-1 text-xs">
                                                                    Pending
                                                                </Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-sm text-gray-600">
                                                            {item.notes || '-'}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="text"
                                                                value={approvalData.find((a) => a.item_id === item.item_id)?.approval_notes || ''}
                                                                onChange={(e) => updateApprovalNotes(item.item_id, e.target.value)}
                                                                placeholder="Catatan untuk item ini..."
                                                                className="text-sm"
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>

                                {errors.items && (
                                    <p className="text-sm text-red-600 mt-2">{errors.items}</p>
                                )}

                                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-sm text-blue-800">
                                        <strong>Catatan:</strong> Centang item yang ingin diapprove. Item yang tidak dicentang akan menjadi <strong>Pending</strong> dan bisa diapprove nanti.
                                        Anda juga dapat mengisi qty dengan 0 jika ingin menunda approval item tersebut.
                                    </p>
                                </div>

                                {/* Summary */}
                                <div className="mt-4 flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-600">Item dipilih:</span>
                                        <Badge variant="default">{approvalData.filter(i => i.selected).length} / {approvalData.length}</Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-600">Item pending (belum diproses):</span>
                                        <Badge variant="secondary">{approvalData.filter(i => !i.selected).length}</Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-600">Menunggu stok:</span>
                                        <Badge variant="destructive">{
                                            stockRequest.items.filter(item => {
                                                const remaining = item.quantity_requested - (item.quantity_approved || 0);
                                                const hasNoStock = (item.central_stock?.available_quantity ?? 0) <= 0;
                                                return remaining > 0 && hasNoStock;
                                            }).length
                                        }</Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                    </>
                )}
            </div>
        </AppLayout>
    );
}
