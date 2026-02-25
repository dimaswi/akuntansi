import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    ArrowLeft,
    Send,
    ClipboardList,
    Calendar,
    Package,
    AlertCircle,
    CheckCircle2,
    Info,
    FileText,
    TrendingDown,
    TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { route } from 'ziggy-js';
import { BreadcrumbItem, PageProps } from '@/types';

interface StockAdjustment {
    id: number;
    nomor_adjustment: string;
    tanggal_adjustment: string;
    tipe_adjustment: 'shortage' | 'overage';
    item: {
        code: string;
        name: string;
    };
    quantity: number;
    total_amount: number;
}

interface Props extends PageProps {
    adjustments: StockAdjustment[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: <ClipboardList className="h-4 w-4" />, href: '#' },
    { title: 'Stock Adjustments', href: route('stock-adjustments.index') },
    { title: 'Post to Jurnal', href: '#' },
];

export default function PostToJournal({ adjustments }: Props) {
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(adjustments.map(a => a.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedIds([...selectedIds, id]);
        } else {
            setSelectedIds(selectedIds.filter(i => i !== id));
        }
    };

    const handlePostToJournal = () => {
        if (selectedIds.length === 0) {
            return;
        }

        setIsProcessing(true);
        router.post(
            route('stock-adjustments.postToJurnal'),
            { adjustment_ids: selectedIds },
            {
                onFinish: () => setIsProcessing(false),
            }
        );
    };

    const totalSelected = adjustments
        .filter(a => selectedIds.includes(a.id))
        .reduce((sum, a) => sum + a.total_amount, 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Post Stock Adjustment ke Jurnal" />

            <div className="p-4 space-y-4">

                {/* Info Card - Penjelasan Jurnal Entry */}
                <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                            <Info className="h-4 w-4" />
                            Penjelasan Jurnal Entry
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-blue-800 dark:text-blue-200">
                        <div>
                            <p className="font-medium mb-2 flex items-center gap-2">
                                <TrendingDown className="h-4 w-4 text-red-600" />
                                <strong>SHORTAGE (Kekurangan Stok)</strong>
                            </p>
                            <div className="bg-white dark:bg-blue-900/30 rounded-lg p-4 space-y-2 font-mono text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <FileText className="h-3 w-3" />
                                        <strong>Debit:</strong> Selisih/Loss (484)
                                    </span>
                                    <span className="text-gray-600 dark:text-gray-300">Rp XXX</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <FileText className="h-3 w-3" />
                                        <strong>Credit:</strong> Inventory (1-1300)
                                    </span>
                                    <span className="text-gray-600 dark:text-gray-300">Rp XXX</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <p className="font-medium mb-2 flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                                <strong>OVERAGE (Kelebihan Stok)</strong>
                            </p>
                            <div className="bg-white dark:bg-blue-900/30 rounded-lg p-4 space-y-2 font-mono text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <FileText className="h-3 w-3" />
                                        <strong>Debit:</strong> Inventory (1-1300)
                                    </span>
                                    <span className="text-gray-600 dark:text-gray-300">Rp XXX</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <FileText className="h-3 w-3" />
                                        <strong>Credit:</strong> Selisih/Gain (484)
                                    </span>
                                    <span className="text-gray-600 dark:text-gray-300">Rp XXX</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-2 text-xs">
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-medium">Catatan Penting:</p>
                                <ul className="list-disc list-inside space-y-1 mt-1 text-xs">
                                    <li>Stok sudah diupdate saat approval</li>
                                    <li>Posting ke jurnal mencatat selisih ke akuntansi</li>
                                    <li>Nomor jurnal: <strong>JIA/YYYY/MM/XXXX</strong> (Jurnal Inventory Adjustment)</li>
                                    <li>Setelah diposting, tidak bisa dibatalkan</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Selection Summary */}
                {selectedIds.length > 0 && (
                    <Card className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-700">
                        <CardContent className="py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    <div>
                                        <p className="font-semibold text-green-900 dark:text-green-100">
                                            {selectedIds.length} item dipilih
                                        </p>
                                        <p className="text-sm text-green-700 dark:text-green-300">
                                            Total nilai: {formatCurrency(totalSelected)}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    onClick={handlePostToJournal}
                                    disabled={isProcessing}
                                    className="gap-2"
                                >
                                    <Send className="h-4 w-4" />
                                    {isProcessing ? 'Memposting...' : 'Post ke Jurnal'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Main Table */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <ClipboardList className="h-5 w-5" />
                                    Daftar Stock Adjustment
                                </CardTitle>
                                <CardDescription>
                                    Pilih adjustment yang ingin diposting ke jurnal
                                </CardDescription>
                            </div>
                            {adjustments.length > 0 && (
                                <Badge variant="secondary" className="text-sm">
                                    {adjustments.length} item siap
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {adjustments.length === 0 ? (
                            <div className="text-center py-12">
                                <ClipboardList className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                <p className="text-gray-500 dark:text-gray-400">
                                    Tidak ada adjustment yang perlu diposting
                                </p>
                                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                                    Semua adjustment yang approved sudah diposting ke jurnal
                                </p>
                            </div>
                        ) : (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12">
                                                <Checkbox
                                                    checked={selectedIds.length === adjustments.length}
                                                    onCheckedChange={handleSelectAll}
                                                />
                                            </TableHead>
                                            <TableHead>Nomor</TableHead>
                                            <TableHead>
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    Tanggal
                                                </div>
                                            </TableHead>
                                            <TableHead>Tipe</TableHead>
                                            <TableHead>
                                                <div className="flex items-center gap-1">
                                                    <Package className="h-3 w-3" />
                                                    Barang
                                                </div>
                                            </TableHead>
                                            <TableHead className="text-right">Qty</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {adjustments.map((adjustment) => (
                                            <TableRow
                                                key={adjustment.id}
                                                className={
                                                    selectedIds.includes(adjustment.id)
                                                        ? 'bg-blue-50 dark:bg-blue-900/20'
                                                        : ''
                                                }
                                            >
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedIds.includes(adjustment.id)}
                                                        onCheckedChange={(checked) =>
                                                            handleSelectOne(adjustment.id, checked as boolean)
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {adjustment.nomor_adjustment}
                                                </TableCell>
                                                <TableCell>
                                                    {format(
                                                        new Date(adjustment.tanggal_adjustment),
                                                        'dd MMM yyyy',
                                                        { locale: idLocale }
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={
                                                            adjustment.tipe_adjustment === 'shortage'
                                                                ? 'bg-red-100 text-red-800'
                                                                : 'bg-green-100 text-green-800'
                                                        }
                                                    >
                                                        {adjustment.tipe_adjustment === 'shortage' ? (
                                                            <TrendingDown className="h-3 w-3 mr-1" />
                                                        ) : (
                                                            <TrendingUp className="h-3 w-3 mr-1" />
                                                        )}
                                                        {adjustment.tipe_adjustment === 'shortage'
                                                            ? 'Shortage'
                                                            : 'Overage'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">
                                                            {adjustment.item.name}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {adjustment.item.code}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {adjustment.quantity}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatCurrency(adjustment.total_amount)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
