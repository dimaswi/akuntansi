import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { Banknote, Loader2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { route } from 'ziggy-js';

interface DaftarAkun {
    id: number;
    kode_akun: string;
    nama_akun: string;
    jenis_akun: string;
}

interface SalaryBatch {
    id: number;
    batch_number: string;
    period_display: string;
    total_gaji_bersih: number;
    payment_account: DaftarAkun;
}

interface JournalEntry {
    account_name: string;
    type: 'debit' | 'credit';
    amount: number;
}

interface Props extends SharedData {
    batches: SalaryBatch[];
    journalPreview: JournalEntry[];
    daftarAkun: DaftarAkun[];
    nomorJurnalPreview: string;
}

interface DetailJurnalRow {
    id: string;
    daftar_akun_id: string;
    keterangan: string;
    jumlah_debit: number;
    jumlah_kredit: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: <Banknote className="h-4 w-4" />,
        href: '/penggajian',
    },
    {
        title: 'Penggajian',
        href: '/penggajian',
    },
    {
        title: 'Post to Journal',
        href: '#',
    },
];

export default function PostToJournal({ batches, journalPreview, daftarAkun, nomorJurnalPreview }: Props) {
    // Initialize detail jurnal dari preview + akun yang dipilih di batch
    const initialDetails: DetailJurnalRow[] = [];
    
    // Add debit entries dari preview
    journalPreview
        .filter(e => e.type === 'debit' && e.amount > 0)
        .forEach((entry, idx) => {
            initialDetails.push({
                id: `debit-${idx}`,
                daftar_akun_id: '', // User harus pilih
                keterangan: entry.account_name,
                jumlah_debit: entry.amount,
                jumlah_kredit: 0,
            });
        });

    // Add credit entry untuk gaji bersih (dari akun yang dipilih saat create batch)
    batches.forEach((batch) => {
        initialDetails.push({
            id: `credit-batch-${batch.id}`,
            daftar_akun_id: batch.payment_account.id.toString(),
            keterangan: `Pembayaran Gaji - ${batch.batch_number}`,
            jumlah_debit: 0,
            jumlah_kredit: batch.total_gaji_bersih,
        });
    });

    const [detailJurnal, setDetailJurnal] = useState<DetailJurnalRow[]>(initialDetails);

    const { data, setData, post, processing, errors } = useForm<{
        batch_ids: number[];
        detail_jurnal: any[];
    }>({
        batch_ids: batches.map(b => b.id),
        detail_jurnal: initialDetails as any,
    });

    // Calculate totals
    const totalDebit = detailJurnal.reduce((sum, d) => sum + parseFloat(d.jumlah_debit.toString() || '0'), 0);
    const totalKredit = detailJurnal.reduce((sum, d) => sum + parseFloat(d.jumlah_kredit.toString() || '0'), 0);
    const isBalanced = Math.abs(totalDebit - totalKredit) < 0.01;

    const handleAddRow = () => {
        const newRow: DetailJurnalRow = {
            id: `new-${Date.now()}`,
            daftar_akun_id: '',
            keterangan: '',
            jumlah_debit: 0,
            jumlah_kredit: 0,
        };
        setDetailJurnal([...detailJurnal, newRow]);
    };

    const handleRemoveRow = (id: string) => {
        // Jangan hapus baris dari batch (yang punya prefix credit-batch-)
        if (id.startsWith('credit-batch-')) {
            alert('Tidak bisa menghapus baris pembayaran gaji dari batch.');
            return;
        }
        setDetailJurnal(detailJurnal.filter(d => d.id !== id));
    };

    const handleRowChange = (id: string, field: keyof DetailJurnalRow, value: any) => {
        setDetailJurnal(detailJurnal.map(d => {
            if (d.id === id) {
                return { ...d, [field]: value };
            }
            return d;
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!isBalanced) {
            alert('Total debit dan kredit harus balance!');
            return;
        }

        // Validate all rows have account selected
        const hasEmptyAccount = detailJurnal.some(d => !d.daftar_akun_id);
        if (hasEmptyAccount) {
            alert('Semua baris harus memiliki akun yang dipilih.');
            return;
        }

        // Update form data
        setData('detail_jurnal', detailJurnal as any);
        
        // Submit
        post(route('penggajian.postToJurnal'));
    };

    const formatRupiah = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Post to Journal - Penggajian" />

            <div className="py-6">
                <div className="px-4 sm:px-6 lg:px-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Post to Journal - Gaji Karyawan</CardTitle>
                            <CardDescription>
                                Review dan sesuaikan entri jurnal sebelum posting
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Info Batches */}
                            <div className="space-y-2">
                                <Label>Batch Gaji yang Akan Diposting:</Label>
                                <div className="bg-muted p-4 rounded-md space-y-1">
                                    {batches.map((batch) => (
                                        <div key={batch.id} className="text-sm">
                                            <span className="font-medium">{batch.batch_number}</span> - {batch.period_display} -{' '}
                                            <span className="text-green-600 font-semibold">
                                                {formatRupiah(batch.total_gaji_bersih)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Nomor Jurnal Preview */}
                            <div>
                                <Label>Nomor Jurnal (Preview):</Label>
                                <p className="text-lg font-mono font-semibold">{nomorJurnalPreview}</p>
                            </div>

                            {/* Detail Jurnal Table */}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <Label>Detail Jurnal:</Label>
                                        <Button type="button" size="sm" variant="outline" onClick={handleAddRow}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Tambah Baris
                                        </Button>
                                    </div>

                                    <div className="border rounded-md overflow-hidden">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[300px]">Akun</TableHead>
                                                    <TableHead className="w-[300px]">Keterangan</TableHead>
                                                    <TableHead className="text-right w-[150px]">Debit</TableHead>
                                                    <TableHead className="text-right w-[150px]">Kredit</TableHead>
                                                    <TableHead className="w-[50px]"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {detailJurnal.map((detail, idx) => {
                                                    const selectedAccount = daftarAkun.find(a => a.id.toString() === detail.daftar_akun_id);
                                                    const isFromBatch = detail.id.startsWith('credit-batch-');
                                                    
                                                    return (
                                                        <TableRow key={detail.id}>
                                                            <TableCell>
                                                                {isFromBatch && selectedAccount ? (
                                                                    <div>
                                                                        <p className="text-xs font-medium">
                                                                            [{selectedAccount.kode_akun}] {selectedAccount.nama_akun}
                                                                        </p>
                                                                        <p className="text-xs text-muted-foreground">
                                                                            (Akun pembayaran dari batch)
                                                                        </p>
                                                                    </div>
                                                                ) : (
                                                                    <SearchableSelect
                                                                        value={detail.daftar_akun_id}
                                                                        onValueChange={(value) => handleRowChange(detail.id, 'daftar_akun_id', value)}
                                                                        options={daftarAkun.map((akun) => ({
                                                                            value: akun.id.toString(),
                                                                            label: `[${akun.kode_akun}] ${akun.nama_akun}`,
                                                                        }))}
                                                                        placeholder="Pilih akun..."
                                                                        searchPlaceholder="Cari akun..."
                                                                        emptyText="Tidak ada akun ditemukan"
                                                                        className="h-8 text-xs"
                                                                    />
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Input
                                                                    type="text"
                                                                    className="h-8 text-xs"
                                                                    value={detail.keterangan}
                                                                    onChange={(e) => handleRowChange(detail.id, 'keterangan', e.target.value)}
                                                                    placeholder="Keterangan..."
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Input
                                                                    type="number"
                                                                    className="h-8 text-xs text-right"
                                                                    value={detail.jumlah_debit || ''}
                                                                    onChange={(e) => handleRowChange(detail.id, 'jumlah_debit', parseFloat(e.target.value) || 0)}
                                                                    placeholder="0"
                                                                    step="0.01"
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Input
                                                                    type="number"
                                                                    className="h-8 text-xs text-right"
                                                                    value={detail.jumlah_kredit || ''}
                                                                    onChange={(e) => handleRowChange(detail.id, 'jumlah_kredit', parseFloat(e.target.value) || 0)}
                                                                    placeholder="0"
                                                                    step="0.01"
                                                                    disabled={isFromBatch}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                {!isFromBatch && (
                                                                    <Button
                                                                        type="button"
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        onClick={() => handleRemoveRow(detail.id)}
                                                                    >
                                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                                    </Button>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                                {/* Total Row */}
                                                <TableRow className="font-semibold bg-muted/50">
                                                    <TableCell colSpan={2} className="text-right">TOTAL:</TableCell>
                                                    <TableCell className="text-right">
                                                        {formatRupiah(totalDebit)}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {formatRupiah(totalKredit)}
                                                    </TableCell>
                                                    <TableCell></TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {/* Balance Indicator */}
                                    <div className={`mt-2 p-3 rounded-md ${isBalanced ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                        <div className="flex items-center justify-between text-sm font-medium">
                                            <span>Status Balance:</span>
                                            <span>
                                                {isBalanced ? '✓ Balance' : `✗ Tidak Balance (Selisih: ${formatRupiah(Math.abs(totalDebit - totalKredit))})`}
                                            </span>
                                        </div>
                                    </div>

                                    {errors.detail_jurnal && (
                                        <p className="text-sm text-red-600">{errors.detail_jurnal}</p>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end gap-3 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.visit(route('penggajian.index'))}
                                        disabled={processing}
                                    >
                                        Batal
                                    </Button>
                                    <Button type="submit" disabled={processing || !isBalanced}>
                                        {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Post to Journal
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
