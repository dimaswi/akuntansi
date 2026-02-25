import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Activity, ArrowLeft, Calendar, DollarSign, TrendingDown, TrendingUp } from 'lucide-react';

interface Akun {
    id: number;
    kode_akun: string;
    nama_akun: string;
    jenis_akun: string;
}

interface TransaksiKas {
    tanggal: string;
    keterangan: string;
    referensi: string;
    kas_masuk: number;
    kas_keluar: number;
    net: number;
}

interface ArusKasData {
    akun: Akun;
    transaksi: TransaksiKas[];
    total_masuk: number;
    total_keluar: number;
    net: number;
}

interface Props {
    periode_dari: string;
    periode_sampai: string;
    dataArusKas: ArusKasData[];
    totalKasMasuk: number;
    totalKasKeluar: number;
    netArusKas: number;
}

export default function ArusKas({ periode_dari, periode_sampai, dataArusKas, totalKasMasuk, totalKasKeluar, netArusKas }: Props) {
    const [periodeDari, setPeriodeDari] = useState(periode_dari);
    const [periodeSampai, setPeriodeSampai] = useState(periode_sampai);
    const [expandedAkun, setExpandedAkun] = useState<number | null>(null);

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
            month: '2-digit',
            year: 'numeric',
        });
    };

    const handleFilter = () => {
        router.get(
            route('akuntansi.laporan.arus-kas'),
            {
                periode_dari: periodeDari,
                periode_sampai: periodeSampai,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleExport = () => {
        // TODO: Implement export functionality
        console.log('Export arus kas');
    };

    const isPositiveFlow = netArusKas >= 0;

    return (
        <AppLayout>
            <Head title={`Arus Kas - ${formatDate(periode_dari)} s/d ${formatDate(periode_sampai)}`} />

            <div className="p-6 text-gray-900 dark:text-gray-100">
                {/* Period Filter */}
                <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex items-center gap-2 mb-4">
                        <div>
                            <Button type="button" variant="outline" onClick={() => window.history.back()} className="mb-4 gap-2">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </div>
                        <div>
                            <h3 className="flex items-center text-lg font-semibold text-gray-900 dark:text-gray-100">
                                <Calendar className="mr-2 h-5 w-5" />
                                Filter Periode
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Pilih periode untuk menampilkan laporan arus kas.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                            <Label htmlFor="periode_dari">Periode Dari</Label>
                            <Input id="periode_dari" type="date" value={periodeDari} onChange={(e) => setPeriodeDari(e.target.value)} />
                        </div>
                        <div>
                            <Label htmlFor="periode_sampai">Periode Sampai</Label>
                            <Input id="periode_sampai" type="date" value={periodeSampai} onChange={(e) => setPeriodeSampai(e.target.value)} />
                        </div>
                        <div className="flex items-end">
                            <Button onClick={handleFilter} className="w-full">
                                Refresh Laporan
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Kas Masuk</p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalKasMasuk)}</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-green-500" />
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Kas Keluar</p>
                                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totalKasKeluar)}</p>
                            </div>
                            <TrendingDown className="h-8 w-8 text-red-500" />
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Net Arus Kas</p>
                                <p
                                    className={`text-2xl font-bold ${isPositiveFlow ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                                >
                                    {formatCurrency(netArusKas)}
                                </p>
                            </div>
                            <Activity className={`h-8 w-8 ${isPositiveFlow ? 'text-green-500' : 'text-red-500'}`} />
                        </div>
                    </div>
                </div>

                {/* Arus Kas Summary */}
                <div className="mb-6 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                    <div className="border-b border-gray-200 p-6 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Ringkasan Arus Kas per Akun</h3>
                    </div>
                    <div className="p-6">
                        {dataArusKas.length === 0 ? (
                            <div className="py-8 text-center">
                                <DollarSign className="mx-auto mb-2 h-12 w-12 text-gray-400" />
                                <p className="text-gray-500">Tidak ada transaksi kas dalam periode ini</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[120px]">Kode Akun</TableHead>
                                        <TableHead>Nama Akun</TableHead>
                                        <TableHead className="w-[120px] text-right">Kas Masuk</TableHead>
                                        <TableHead className="w-[120px] text-right">Kas Keluar</TableHead>
                                        <TableHead className="w-[120px] text-right">Net Flow</TableHead>
                                        <TableHead className="w-[100px]">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dataArusKas.map((item) => (
                                        <React.Fragment key={item.akun.id}>
                                            <TableRow>
                                                <TableCell className="font-mono text-sm">{item.akun.kode_akun}</TableCell>
                                                <TableCell className="font-medium">{item.akun.nama_akun}</TableCell>
                                                <TableCell className="text-right font-mono text-green-600 dark:text-green-400">
                                                    {formatCurrency(item.total_masuk)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-red-600 dark:text-red-400">
                                                    {formatCurrency(item.total_keluar)}
                                                </TableCell>
                                                <TableCell
                                                    className={`text-right font-mono font-semibold ${item.net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                                                >
                                                    {formatCurrency(item.net)}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setExpandedAkun(expandedAkun === item.akun.id ? null : item.akun.id)}
                                                    >
                                                        {expandedAkun === item.akun.id ? 'Tutup' : 'Detail'}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>

                                            {/* Detail Transaksi */}
                                            {expandedAkun === item.akun.id && (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="bg-gray-50 dark:bg-gray-700">
                                                        <div className="py-4">
                                                            <h4 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">
                                                                Detail Transaksi {item.akun.nama_akun}
                                                            </h4>
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow>
                                                                        <TableHead className="w-[100px]">Tanggal</TableHead>
                                                                        <TableHead>Keterangan</TableHead>
                                                                        <TableHead className="w-[120px]">Referensi</TableHead>
                                                                        <TableHead className="w-[100px] text-right">Masuk</TableHead>
                                                                        <TableHead className="w-[100px] text-right">Keluar</TableHead>
                                                                        <TableHead className="w-[100px] text-right">Net</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {item.transaksi.map((transaksi, index) => (
                                                                        <TableRow key={index}>
                                                                            <TableCell className="font-mono text-sm">
                                                                                {formatDate(transaksi.tanggal)}
                                                                            </TableCell>
                                                                            <TableCell className="text-sm">{transaksi.keterangan}</TableCell>
                                                                            <TableCell className="font-mono text-sm">{transaksi.referensi}</TableCell>
                                                                            <TableCell className="text-right font-mono text-sm text-green-600 dark:text-green-400">
                                                                                {transaksi.kas_masuk > 0 ? formatCurrency(transaksi.kas_masuk) : '-'}
                                                                            </TableCell>
                                                                            <TableCell className="text-right font-mono text-sm text-red-600 dark:text-red-400">
                                                                                {transaksi.kas_keluar > 0
                                                                                    ? formatCurrency(transaksi.kas_keluar)
                                                                                    : '-'}
                                                                            </TableCell>
                                                                            <TableCell
                                                                                className={`text-right font-mono text-sm ${transaksi.net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                                                                            >
                                                                                {formatCurrency(transaksi.net)}
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </React.Fragment>
                                    ))}

                                    {/* Total Row */}
                                    <TableRow className="border-t-2 border-gray-300 dark:border-gray-600">
                                        <TableCell colSpan={2} className="font-bold">
                                            TOTAL
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-bold text-green-600 dark:text-green-400">
                                            {formatCurrency(totalKasMasuk)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-bold text-red-600 dark:text-red-400">
                                            {formatCurrency(totalKasKeluar)}
                                        </TableCell>
                                        <TableCell
                                            className={`text-right font-mono font-bold ${isPositiveFlow ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                                        >
                                            {formatCurrency(netArusKas)}
                                        </TableCell>
                                        <TableCell></TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </div>

                {/* Cash Flow Analysis */}
                <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                    <div className="border-b border-gray-200 p-6 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Analisis Arus Kas</h3>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <h4 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">Status Arus Kas</h4>
                                <Badge variant={isPositiveFlow ? 'default' : 'destructive'} className="px-3 py-1 text-sm">
                                    {isPositiveFlow ? 'POSITIVE CASH FLOW' : 'NEGATIVE CASH FLOW'}
                                </Badge>
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                    {isPositiveFlow ? 'Kas masuk lebih besar dari kas keluar' : 'Kas keluar lebih besar dari kas masuk'}
                                </p>
                            </div>
                            <div>
                                <h4 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">Rasio Kas</h4>
                                <p
                                    className={`text-2xl font-bold ${isPositiveFlow ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                                >
                                    {totalKasKeluar > 0 ? (totalKasMasuk / totalKasKeluar).toFixed(2) : '∞'}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Perbandingan kas masuk dengan kas keluar</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
