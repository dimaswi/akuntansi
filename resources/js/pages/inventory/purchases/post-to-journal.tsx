import React, { useState, useEffect } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableAccountSelect } from '@/components/ui/searchable-account-select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    ArrowLeft,
    Plus,
    Trash2,
    FileText,
    Calendar,
    Hash,
    User,
    ShoppingCart,
    AlertCircle,
    CheckCircle2,
    Building2,
    Package
} from 'lucide-react';
import { Link } from '@inertiajs/react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';
import { BreadcrumbItem, PageProps } from '@/types';

interface Akun {
    id: number;
    kode_akun: string;
    nama_akun: string;
    jenis_akun: string;
}

interface Purchase {
    id: number;
    purchase_number: string;
    purchase_date: string;
    total_amount: number;
    notes?: string;
    supplier: {
        id: number;
        name: string;
    };
    creator: {
        id: number;
        name: string;
    };
    akun_kas?: Akun;
    akun_kas_id: number;
}

interface DetailJurnalRow {
    id: string;
    daftar_akun_id: string;
    keterangan: string;
    jumlah_debit: number;
    jumlah_kredit: number;
    is_readonly: boolean;
}

interface Props extends PageProps {
    purchase: Purchase;
    daftarAkun: Akun[];
    nomorJurnalPreview: string;
}

export default function PostToJournal() {
    const { purchase, daftarAkun, nomorJurnalPreview } = usePage<Props>().props;

    const breadcrumbItems: BreadcrumbItem[] = [
        { title: <Package className="h-4 w-4" />, href: '#' },
        { title: 'Purchase Orders', href: route('purchases.index') },
        { title: purchase?.purchase_number || 'Post to Journal', href: purchase ? route('purchases.show', purchase.id) : '#' },
        { title: 'Post to Journal', href: '' }
    ];

    // Handle undefined/null purchase early
    if (!purchase) {
        return (
            <AppLayout breadcrumbs={breadcrumbItems}>
                <Head title="Post Purchase ke Jurnal" />
                <div className="max-w-7xl mx-auto p-4 sm:px-6 lg:px-8">
                    <div className="text-center py-12">
                        <p className="text-red-500">Error: Data purchase order tidak ditemukan</p>
                        <Link href={route('purchases.index')} className="text-blue-600 hover:underline mt-4 inline-block">
                            Kembali ke Daftar Purchase Orders
                        </Link>
                    </div>
                </div>
            </AppLayout>
        );
    }

    const { data, setData, post, processing, errors } = useForm({
        purchase_id: purchase.id,
        detail_jurnal: [] as any[]
    });

    const [detailRows, setDetailRows] = useState<DetailJurnalRow[]>([]);
    const [totalDebit, setTotalDebit] = useState(0);
    const [totalKredit, setTotalKredit] = useState(0);
    const [isBalance, setIsBalance] = useState(false);

    // Get account (inventory or expense account)
    const purchaseAccount = purchase.akun_kas;
    const originalAmount = purchase.total_amount;

    // Initialize with first row (hutang usaha - KREDIT for purchase)
    // and second row (inventory/expense - DEBIT)
    useEffect(() => {
        if (!purchaseAccount) {
            console.error('Purchase account not found in purchase data');
            return;
        }

        // Hutang Usaha (Accounts Payable) - KREDIT
        const hutangRow: DetailJurnalRow = {
            id: 'hutang-auto',
            daftar_akun_id: '', // User needs to select AP account
            keterangan: `Hutang PO ${purchase.purchase_number} - ${purchase.supplier.name}`,
            jumlah_debit: 0,
            jumlah_kredit: purchase.total_amount,
            is_readonly: false
        };

        // Inventory/Expense Account - DEBIT
        const inventoryRow: DetailJurnalRow = {
            id: 'inventory-auto',
            daftar_akun_id: purchase.akun_kas_id.toString(),
            keterangan: `Pembelian ${purchase.purchase_number} - ${purchase.supplier.name}`,
            jumlah_debit: purchase.total_amount,
            jumlah_kredit: 0,
            is_readonly: false
        };

        setDetailRows([inventoryRow, hutangRow]);
    }, [purchase]);

    // Calculate totals and balance
    useEffect(() => {
        const debit = detailRows.reduce((sum, row) => sum + Number(row.jumlah_debit), 0);
        const kredit = detailRows.reduce((sum, row) => sum + Number(row.jumlah_kredit), 0);

        setTotalDebit(debit);
        setTotalKredit(kredit);
        setIsBalance(debit === kredit && debit > 0 && detailRows.length >= 2);

        // Update form data
        setData('detail_jurnal', detailRows.map(row => ({
            daftar_akun_id: Number(row.daftar_akun_id),
            keterangan: row.keterangan,
            jumlah_debit: Number(row.jumlah_debit),
            jumlah_kredit: Number(row.jumlah_kredit)
        })));
    }, [detailRows]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    const addRow = () => {
        const newRow: DetailJurnalRow = {
            id: `new-row-${Date.now()}`,
            daftar_akun_id: '',
            keterangan: `${purchase.purchase_number} - ${purchase.supplier.name}`,
            jumlah_debit: 0,
            jumlah_kredit: 0,
            is_readonly: false
        };
        setDetailRows([...detailRows, newRow]);
    };

    const removeRow = (id: string) => {
        // Don't allow removing auto rows
        if (id === 'hutang-auto' || id === 'inventory-auto') {
            toast.error('Baris otomatis tidak dapat dihapus');
            return;
        }
        setDetailRows(detailRows.filter(row => row.id !== id));
    };

    const updateRow = (id: string, field: keyof DetailJurnalRow, value: any) => {
        setDetailRows(detailRows.map(row => {
            if (row.id !== id) return row;
            return { ...row, [field]: value };
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isBalance) {
            toast.error('Jurnal tidak balance! Debit harus sama dengan Kredit');
            return;
        }

        post(route('purchases.postToJournal'), {
            onSuccess: () => {
                toast.success('Purchase order berhasil di-post ke jurnal');
            },
            onError: () => {
                toast.error('Gagal post ke jurnal');
            }
        });
    };

    // Show loading if data not ready
    if (!purchase || !purchaseAccount) {
        return (
            <AppLayout breadcrumbs={breadcrumbItems}>
                <Head title="Post Purchase ke Jurnal" />
                <div className="max-w-7xl mx-auto p-4 sm:px-6 lg:px-8">
                    <div className="text-center py-12">
                        <p className="text-gray-500 dark:text-gray-400">Loading data purchase order...</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbItems}>
            <Head title="Post Purchase ke Jurnal" />
            
            <div className="max-w-7xl mx-auto p-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center space-x-4 mb-2">
                        <Link href={route('purchases.show', purchase.id)}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Post ke Jurnal</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Cross-check purchase order ke jurnal akuntansi</p>
                        </div>
                    </div>
                </div>

                {/* Info Card - Penjelasan Jurnal Entry */}
                <div className="mb-6">
                    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />
                                Penjelasan Jurnal Entry
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
                            <div>
                                <p className="font-medium mb-2">Purchase Order akan dicatat dengan jurnal:</p>
                                <div className="bg-white dark:bg-blue-900/30 rounded-lg p-4 space-y-2 font-mono text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-2">
                                            <FileText className="h-3 w-3" />
                                            <strong>Debit:</strong> Inventory/Beban ({purchaseAccount.kode_akun})
                                        </span>
                                        <span className="text-gray-600 dark:text-gray-300">{formatCurrency(purchase.total_amount)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-2">
                                            <FileText className="h-3 w-3" />
                                            <strong>Credit:</strong> Hutang Usaha (pilih akun di bawah)
                                        </span>
                                        <span className="text-gray-600 dark:text-gray-300">{formatCurrency(purchase.total_amount)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-start gap-2 text-xs">
                                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-medium">Catatan Penting:</p>
                                    <ul className="list-disc list-inside space-y-1 mt-1 text-xs">
                                        <li>Anda bisa menambah baris jurnal jika diperlukan</li>
                                        <li>Nomor jurnal: <strong>{nomorJurnalPreview}</strong></li>
                                        <li>Total Debit harus sama dengan Total Kredit</li>
                                        <li>Setelah diposting, tidak bisa dibatalkan</li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Left: Purchase Info */}
                    <div className="lg:col-span-1">
                        <Card className="border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 sticky top-4">
                            <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-700">
                                <CardTitle className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                                    <ShoppingCart className="h-4 w-4 mr-2 text-gray-600 dark:text-gray-400" />
                                    Info Purchase Order
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-3">
                                <div>
                                    <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Nomor PO</p>
                                    <p className="text-xs font-mono font-semibold text-gray-900 dark:text-gray-100">{purchase.purchase_number}</p>
                                </div>

                                <div>
                                    <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Tanggal</p>
                                    <div className="flex items-center text-xs text-gray-700 dark:text-gray-300">
                                        <Calendar className="h-3 w-3 mr-1.5 text-gray-500" />
                                        {formatDate(purchase.purchase_date)}
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Supplier</p>
                                    <div className="flex items-center text-xs text-gray-700 dark:text-gray-300">
                                        <Building2 className="h-3 w-3 mr-1.5 text-gray-500" />
                                        {purchase.supplier.name}
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Akun Inventory/Beban</p>
                                    <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">{purchaseAccount.nama_akun}</p>
                                    <p className="text-[10px] font-mono text-gray-500 dark:text-gray-400 mt-0.5">{purchaseAccount.kode_akun}</p>
                                </div>

                                <div>
                                    <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total Pembelian</p>
                                    <p className="text-lg font-bold font-mono text-gray-900 dark:text-gray-100">{formatCurrency(purchase.total_amount)}</p>
                                </div>

                                <div>
                                    <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Dibuat Oleh</p>
                                    <div className="flex items-center text-xs text-gray-700 dark:text-gray-300">
                                        <User className="h-3 w-3 mr-1.5 text-gray-500" />
                                        {purchase.creator.name}
                                    </div>
                                </div>

                                {purchase.notes && (
                                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                                        <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Keterangan</p>
                                        <p className="text-xs text-gray-700 dark:text-gray-300 italic">{purchase.notes}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: Journal Form */}
                    <div className="lg:col-span-2">
                        <form onSubmit={handleSubmit}>
                            <Card className="border-gray-200 dark:border-gray-700 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
                                <CardHeader className="pb-4 border-b border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                                            <FileText className="h-4 w-4 mr-2 text-gray-600 dark:text-gray-400" />
                                            Form Jurnal
                                        </CardTitle>
                                        <Badge variant="outline" className="text-[10px] font-mono">
                                            <Hash className="h-3 w-3 mr-1" />
                                            {nomorJurnalPreview}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-4">
                                    {/* Detail Jurnal Table */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Detail Jurnal</Label>
                                            <Button
                                                type="button"
                                                onClick={addRow}
                                                size="sm"
                                                variant="outline"
                                                className="h-7 text-xs"
                                            >
                                                <Plus className="h-3 w-3 mr-1" />
                                                Tambah Baris
                                            </Button>
                                        </div>

                                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                            <div className="overflow-x-auto">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                                                            <TableHead className="text-left py-2 px-3 text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-[200px]">Akun</TableHead>
                                                            <TableHead className="text-left py-2 px-3 text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Keterangan</TableHead>
                                                            <TableHead className="text-right py-2 px-3 text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-[120px]">Debit</TableHead>
                                                            <TableHead className="text-right py-2 px-3 text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-[120px]">Kredit</TableHead>
                                                            <TableHead className="text-center py-2 px-3 text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-[40px]"></TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {detailRows.map((row, index) => {
                                                            const selectedAccount = daftarAkun.find(a => a.id === Number(row.daftar_akun_id));
                                                            const isAutoRow = row.id === 'inventory-auto' || row.id === 'hutang-auto';
                                                            
                                                            return (
                                                            <TableRow
                                                                key={row.id}
                                                                className={`border-b border-gray-100 dark:border-gray-700/50 ${
                                                                    row.id === 'inventory-auto' 
                                                                        ? 'bg-blue-50/50 dark:bg-blue-900/10' 
                                                                        : row.id === 'hutang-auto'
                                                                            ? 'bg-orange-50/50 dark:bg-orange-900/10'
                                                                            : 'bg-white dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                                                }`}
                                                            >
                                                                <TableCell className="py-2 px-3">
                                                                    {row.id === 'inventory-auto' ? (
                                                                        <div className="flex items-center gap-2">
                                                                            <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                                                                                INVENTORY
                                                                            </Badge>
                                                                            <div>
                                                                                <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">{purchaseAccount.nama_akun}</p>
                                                                                <p className="text-[10px] font-mono text-gray-500 dark:text-gray-400">{purchaseAccount.kode_akun}</p>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <SearchableAccountSelect
                                                                            accounts={daftarAkun}
                                                                            value={row.daftar_akun_id}
                                                                            onValueChange={(value) => updateRow(row.id, 'daftar_akun_id', value)}
                                                                            placeholder="Pilih akun..."
                                                                        />
                                                                    )}
                                                                </TableCell>
                                                                <TableCell className="py-2 px-3">
                                                                    <Input
                                                                        value={row.keterangan}
                                                                        onChange={(e) => updateRow(row.id, 'keterangan', e.target.value)}
                                                                        className="text-xs h-8 border-gray-300 dark:border-gray-600"
                                                                        placeholder="Keterangan untuk akun ini..."
                                                                    />
                                                                </TableCell>
                                                                <TableCell className="py-2 px-3">
                                                                    <div className="relative">
                                                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500">Rp</span>
                                                                        <Input
                                                                            type="number"
                                                                            value={row.jumlah_debit}
                                                                            onChange={(e) => updateRow(row.id, 'jumlah_debit', Number(e.target.value))}
                                                                            className="text-xs h-8 text-right font-mono border-gray-300 dark:border-gray-600 pl-8"
                                                                            min="0"
                                                                            step="1"
                                                                            placeholder="0"
                                                                        />
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="py-2 px-3">
                                                                    <div className="relative">
                                                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500">Rp</span>
                                                                        <Input
                                                                            type="number"
                                                                            value={row.jumlah_kredit}
                                                                            onChange={(e) => updateRow(row.id, 'jumlah_kredit', Number(e.target.value))}
                                                                            className="text-xs h-8 text-right font-mono border-gray-300 dark:border-gray-600 pl-8"
                                                                            min="0"
                                                                            step="1"
                                                                            placeholder="0"
                                                                        />
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="py-2 px-3 text-center">
                                                                    {!isAutoRow && (
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => removeRow(row.id)}
                                                                            className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900/20"
                                                                        >
                                                                            <Trash2 className="h-3 w-3 text-red-600 dark:text-red-400" />
                                                                        </Button>
                                                                    )}
                                                                </TableCell>
                                                            </TableRow>
                                                            );
                                                        })}
                                                        
                                                        {/* Total Row */}
                                                        <TableRow className="bg-gray-100 dark:bg-gray-800 border-t-2 border-gray-300 dark:border-gray-600">
                                                            <TableCell colSpan={2} className="py-2 px-3 text-right font-semibold text-gray-900 dark:text-gray-100">TOTAL</TableCell>
                                                            <TableCell className="py-2 px-3 text-right font-mono font-bold text-gray-900 dark:text-gray-100">
                                                                {formatCurrency(totalDebit)}
                                                            </TableCell>
                                                            <TableCell className="py-2 px-3 text-right font-mono font-bold text-gray-900 dark:text-gray-100">
                                                                {formatCurrency(totalKredit)}
                                                            </TableCell>
                                                            <TableCell></TableCell>
                                                        </TableRow>
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </div>

                                        {errors.detail_jurnal && <p className="text-xs text-red-600 mt-1">{errors.detail_jurnal}</p>}
                                    </div>

                                    {/* Balance Status */}
                                    <div className={`p-3 rounded-lg border ${isBalance ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'}`}>
                                        <div className="flex items-center space-x-2">
                                            {isBalance ? (
                                                <>
                                                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                    <span className="text-xs font-semibold text-green-700 dark:text-green-300">Jurnal Balance - Siap diposting!</span>
                                                </>
                                            ) : (
                                                <>
                                                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                                    <span className="text-xs font-semibold text-red-700 dark:text-red-300">
                                                        {detailRows.length < 2 
                                                            ? 'Minimal 2 akun diperlukan' 
                                                            : `Tidak Balance! Selisih: ${formatCurrency(Math.abs(totalDebit - totalKredit))}`
                                                        }
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center justify-end space-x-2 pt-2">
                                        <Link href={route('purchases.show', purchase.id)}>
                                            <Button type="button" variant="outline" size="sm" className="h-8 text-xs">
                                                Batal
                                            </Button>
                                        </Link>
                                        <Button 
                                            type="submit" 
                                            size="sm" 
                                            className="h-8 text-xs"
                                            disabled={!isBalance || processing}
                                        >
                                            {processing ? 'Memposting...' : 'Post ke Jurnal'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </form>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
