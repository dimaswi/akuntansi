import React, { useState, useEffect } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableAccountSelect } from '@/components/ui/searchable-account-select';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    Plus,
    Trash2,
    FileText,
    Calendar,
    Hash,
    User,
    Landmark,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import { Link } from '@inertiajs/react';
import { toast } from 'sonner';

interface Akun {
    id: number;
    kode_akun: string;
    nama_akun: string;
    jenis_akun: string;
}

interface BankAccount {
    id: number;
    kode_rekening: string;
    nama_bank: string;
    nama_rekening: string;
    daftar_akun: Akun;
}

interface BankTransaction {
    id: number;
    nomor_transaksi: string;
    tanggal_transaksi: string;
    jenis_transaksi: string;
    pihak_terkait?: string;
    keterangan: string;
    jumlah: number;
    bank_account: BankAccount;
    user?: {
        name: string;
    } | null;
}

interface DetailJurnalRow {
    id: string;
    daftar_akun_id: string;
    keterangan: string;
    jumlah_debit: number;
    jumlah_kredit: number;
    is_readonly: boolean;
}

interface Props {
    bankTransaction: BankTransaction;
    daftarAkun: Akun[];
    nomorJurnalPreview: string;
}

export default function PostToJurnal({ bankTransaction, daftarAkun, nomorJurnalPreview }: Props) {
    // Handle undefined/null bankTransaction early
    if (!bankTransaction) {
        return (
            <AppLayout>
                <Head title="Post Transaksi Bank ke Jurnal" />
                <div className="max-w-7xl mx-auto p-4 sm:px-6 lg:px-8">
                    <div className="text-center py-12">
                        <p className="text-red-500">Error: Data transaksi tidak ditemukan</p>
                        <Link href="/kas/bank-transactions" className="text-blue-600 hover:underline mt-4 inline-block">
                            Kembali ke Daftar Transaksi
                        </Link>
                    </div>
                </div>
            </AppLayout>
        );
    }

    const { data, setData, post, processing, errors } = useForm({
        bank_transaction_id: bankTransaction.id,
        detail_jurnal: [] as any[]
    });

    const [detailRows, setDetailRows] = useState<DetailJurnalRow[]>([]);
    const [totalDebit, setTotalDebit] = useState(0);
    const [totalKredit, setTotalKredit] = useState(0);
    const [isBalance, setIsBalance] = useState(false);

    // Get bank account and COA
    const bankAccountData = bankTransaction.bank_account;
    const bankAccountCOA = bankTransaction.bank_account.daftar_akun;

    // Store original amount for validation
    const originalAmount = bankTransaction.jumlah;
    const isPenerimaan = ['setoran', 'transfer_masuk', 'kliring_masuk', 'bunga_bank'].includes(bankTransaction.jenis_transaksi);

    // Initialize with first row (bank account - now editable)
    useEffect(() => {
        if (!bankAccountCOA) {
            console.error('Bank account not found in transaction data');
            return;
        }

        const firstRow: DetailJurnalRow = {
            id: 'bank-auto',
            daftar_akun_id: bankAccountCOA.id.toString(),
            keterangan: bankTransaction.keterangan,
            jumlah_debit: isPenerimaan ? bankTransaction.jumlah : 0,
            jumlah_kredit: isPenerimaan ? 0 : bankTransaction.jumlah,
            is_readonly: false // Changed to false to make editable
        };

        setDetailRows([firstRow]);
    }, [bankTransaction]);

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
            keterangan: bankTransaction.keterangan, // Use transaction keterangan as default
            jumlah_debit: 0,
            jumlah_kredit: 0,
            is_readonly: false
        };
        setDetailRows([...detailRows, newRow]);
    };

    const removeRow = (id: string) => {
        setDetailRows(detailRows.filter(row => row.id !== id));
    };

    const updateRow = (id: string, field: keyof DetailJurnalRow, value: any) => {
        setDetailRows(detailRows.map(row => {
            if (row.id !== id) return row;
            
            // Validate if this is the bank row (first row) and amount exceeds original
            if (row.id === 'bank-auto') {
                if (field === 'jumlah_debit' && isPenerimaan) {
                    const newValue = Number(value);
                    if (newValue > originalAmount) {
                        toast.error(`Jumlah debit tidak boleh melebihi ${formatCurrency(originalAmount)}`);
                        return row; // Don't update
                    }
                } else if (field === 'jumlah_kredit' && !isPenerimaan) {
                    const newValue = Number(value);
                    if (newValue > originalAmount) {
                        toast.error(`Jumlah kredit tidak boleh melebihi ${formatCurrency(originalAmount)}`);
                        return row; // Don't update
                    }
                }
            }
            
            return { ...row, [field]: value };
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isBalance) return;

        post(route('kas.bank-transactions.post-to-journal'));
    };

    const getJenisColor = (jenis: string) => {
        const colors: Record<string, { bg: string; text: string; border: string }> = {
            'penerimaan': { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-700' },
            'pengeluaran': { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300', border: 'border-red-200 dark:border-red-700' },
            'transfer_masuk': { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-700' },
            'transfer_keluar': { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-700' },
        };
        return colors[jenis] || { bg: 'bg-gray-50 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-600' };
    };

    const jenisColor = getJenisColor(bankTransaction.jenis_transaksi);

    // Show loading if data not ready
    if (!bankTransaction || !bankAccountCOA) {
        return (
            <AppLayout>
                <Head title="Post Transaksi Bank ke Jurnal" />
                <div className="max-w-7xl mx-auto p-4 sm:px-6 lg:px-8">
                    <div className="text-center py-12">
                        <p className="text-gray-500 dark:text-gray-400">Loading data transaksi...</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Head title="Post Transaksi Bank ke Jurnal" />
            
            <div className="max-w-7xl mx-auto p-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center space-x-4 mb-2">
                        <Link href={route('kas.bank-transactions.index')}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Post ke Jurnal</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Cross-check transaksi bank ke jurnal akuntansi</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Left: Transaction Info */}
                    <div className="lg:col-span-1">
                        <Card className="border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 sticky top-4">
                            <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-700">
                                <CardTitle className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                                    <Landmark className="h-4 w-4 mr-2 text-gray-600 dark:text-gray-400" />
                                    Info Transaksi Bank
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-3">
                                <div>
                                    <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Nomor Transaksi</p>
                                    <p className="text-xs font-mono font-semibold text-gray-900 dark:text-gray-100">{bankTransaction.nomor_transaksi}</p>
                                </div>

                                <div>
                                    <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Tanggal</p>
                                    <div className="flex items-center text-xs text-gray-700 dark:text-gray-300">
                                        <Calendar className="h-3 w-3 mr-1.5 text-gray-500" />
                                        {formatDate(bankTransaction.tanggal_transaksi)}
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Jenis Transaksi</p>
                                    <Badge className={`text-[10px] px-2 py-0.5 h-5 font-medium ${jenisColor.text} ${jenisColor.bg} border ${jenisColor.border}`}>
                                        {bankTransaction.jenis_transaksi.replace(/_/g, ' ').toUpperCase()}
                                    </Badge>
                                </div>

                                <div>
                                    <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Akun Bank</p>
                                    <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">{bankAccountData.nama_bank}</p>
                                    <p className="text-[10px] font-mono text-gray-500 dark:text-gray-400 mt-0.5">A/N: {bankAccountData.nama_rekening}</p>
                                </div>

                                <div>
                                    <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Jumlah</p>
                                    <p className="text-lg font-bold font-mono text-gray-900 dark:text-gray-100">{formatCurrency(bankTransaction.jumlah)}</p>
                                </div>

                                <div>
                                    <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Pihak Terkait</p>
                                    <p className="text-xs text-gray-700 dark:text-gray-300">{bankTransaction.pihak_terkait}</p>
                                </div>

                                <div>
                                    <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Dibuat Oleh</p>
                                    <div className="flex items-center text-xs text-gray-700 dark:text-gray-300">
                                        <User className="h-3 w-3 mr-1.5 text-gray-500" />
                                        {bankTransaction.user?.name || 'Unknown'}
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                                    <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Keterangan</p>
                                    <p className="text-xs text-gray-700 dark:text-gray-300 italic">{bankTransaction.keterangan}</p>
                                </div>
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
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                                                            <th className="text-left py-2 px-3 text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-[200px]">Akun</th>
                                                            <th className="text-left py-2 px-3 text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Keterangan</th>
                                                            <th className="text-right py-2 px-3 text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-[120px]">Debit</th>
                                                            <th className="text-right py-2 px-3 text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-[120px]">Kredit</th>
                                                            <th className="text-center py-2 px-3 text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-[40px]"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {detailRows.map((row, index) => {
                                                            // Check if bank row exceeds original amount
                                                            const bankExceeded = row.id === 'bank-auto' && (
                                                                (isPenerimaan && row.jumlah_debit > originalAmount) ||
                                                                (!isPenerimaan && row.jumlah_kredit > originalAmount)
                                                            );
                                                            
                                                            return (
                                                            <tr
                                                                key={row.id}
                                                                className={`border-b border-gray-100 dark:border-gray-700/50 ${
                                                                    bankExceeded 
                                                                        ? 'bg-red-50 dark:bg-red-900/20' 
                                                                        : row.id === 'bank-auto' 
                                                                            ? 'bg-blue-50/50 dark:bg-blue-900/10' 
                                                                            : 'bg-white dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                                                }`}
                                                            >
                                                                <td className="py-2 px-3">
                                                                    {row.id === 'bank-auto' ? (
                                                                        <div className="flex items-center gap-2">
                                                                            <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                                                                                BANK
                                                                            </Badge>
                                                                            <div>
                                                                                <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">{bankAccountData.nama_bank}</p>
                                                                                <p className="text-[10px] font-mono text-gray-500 dark:text-gray-400">A/N: {bankAccountData.nama_rekening}</p>
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
                                                                </td>
                                                                <td className="py-2 px-3">
                                                                    <Input
                                                                        value={row.keterangan}
                                                                        onChange={(e) => updateRow(row.id, 'keterangan', e.target.value)}
                                                                        className="text-xs h-8 border-gray-300 dark:border-gray-600"
                                                                        placeholder="Keterangan untuk akun ini..."
                                                                    />
                                                                </td>
                                                                <td className="py-2 px-3">
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
                                                                </td>
                                                                <td className="py-2 px-3">
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
                                                                </td>
                                                                <td className="py-2 px-3 text-center">
                                                                    {row.id !== 'bank-auto' && (
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
                                                                </td>
                                                            </tr>
                                                            );
                                                        })}
                                                        
                                                        {/* Total Row */}
                                                        <tr className="bg-gray-100 dark:bg-gray-800 border-t-2 border-gray-300 dark:border-gray-600">
                                                            <td colSpan={2} className="py-2 px-3 text-right font-semibold text-gray-900 dark:text-gray-100">TOTAL</td>
                                                            <td className="py-2 px-3 text-right font-mono font-bold text-gray-900 dark:text-gray-100">
                                                                {formatCurrency(totalDebit)}
                                                            </td>
                                                            <td className="py-2 px-3 text-right font-mono font-bold text-gray-900 dark:text-gray-100">
                                                                {formatCurrency(totalKredit)}
                                                            </td>
                                                            <td></td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {errors.detail_jurnal && <p className="text-xs text-red-600 mt-1">{errors.detail_jurnal}</p>}
                                    </div>

                                    {/* Bank Amount Warning */}
                                    {(() => {
                                        const bankRow = detailRows.find(r => r.id === 'bank-auto');
                                        const bankExceeded = bankRow && (
                                            (isPenerimaan && bankRow.jumlah_debit > originalAmount) ||
                                            (!isPenerimaan && bankRow.jumlah_kredit > originalAmount)
                                        );
                                        
                                        if (bankExceeded) {
                                            return (
                                                <div className="p-3 rounded-lg border bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700">
                                                    <div className="flex items-center space-x-2">
                                                        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                                        <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                                                            Peringatan: Jumlah bank melebihi jumlah transaksi original ({formatCurrency(originalAmount)})
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}

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
                                                            ? 'Tambahkan minimal 1 akun lawan' 
                                                            : `Tidak Balance! Selisih: ${formatCurrency(Math.abs(totalDebit - totalKredit))}`
                                                        }
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center justify-end space-x-2 pt-2">
                                        <Link href={route('kas.bank-transactions.index')}>
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
