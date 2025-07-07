import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
    ArrowLeft, 
    Download, 
    Calendar,
    TrendingUp,
    TrendingDown,
    DollarSign
} from 'lucide-react';
import { Link } from '@inertiajs/react';

interface Akun {
    id: number;
    kode_akun: string;
    nama_akun: string;
    jenis_akun: string;
}

interface AkunSaldo {
    akun: Akun;
    saldo: number;
}

interface Props {
    periode_dari: string;
    periode_sampai: string;
    dataPendapatan: AkunSaldo[];
    dataBeban: AkunSaldo[];
    totalPendapatan: number;
    totalBeban: number;
    labaRugi: number;
}

export default function LabaRugi({ 
    periode_dari,
    periode_sampai,
    dataPendapatan,
    dataBeban,
    totalPendapatan,
    totalBeban,
    labaRugi
}: Props) {
    const [periodeDari, setPeriodeDari] = useState(periode_dari);
    const [periodeSampai, setPeriodeSampai] = useState(periode_sampai);

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
            year: 'numeric'
        });
    };

    const handleFilter = () => {
        router.get(route('akuntansi.laporan.laba-rugi'), {
            periode_dari: periodeDari,
            periode_sampai: periodeSampai
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleExport = () => {
        // TODO: Implement export functionality
        console.log('Export laba rugi');
    };

    const isProfit = labaRugi >= 0;

    return (
        <AppLayout>
            <Head title={`Laba Rugi - ${formatDate(periode_dari)} s/d ${formatDate(periode_sampai)}`} />
            
            <div className="max-w-7xl p-4 sm:px-6 lg:px-8">
                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                    <div className="p-6 text-gray-900 dark:text-gray-100">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                            <div className="flex items-center space-x-4">
                                <Button asChild variant="outline" size="sm">
                                    <Link href={route('akuntansi.laporan.index')}>
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Kembali
                                    </Link>
                                </Button>
                                <div>
                                    <h1 className="text-3xl font-bold mb-2">Laporan Laba Rugi</h1>
                                    <p className="text-lg text-gray-600 dark:text-gray-400">
                                        {formatDate(periode_dari)} - {formatDate(periode_sampai)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex space-x-2 mt-4 sm:mt-0">
                                <Button onClick={handleExport} variant="outline">
                                    <Download className="h-4 w-4 mr-2" />
                                    Export
                                </Button>
                            </div>
                        </div>

                        {/* Period Filter */}
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Calendar className="h-5 w-5 mr-2" />
                                    Filter Periode
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <Label htmlFor="periode_dari">Periode Dari</Label>
                                        <Input
                                            id="periode_dari"
                                            type="date"
                                            value={periodeDari}
                                            onChange={(e) => setPeriodeDari(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="periode_sampai">Periode Sampai</Label>
                                        <Input
                                            id="periode_sampai"
                                            type="date"
                                            value={periodeSampai}
                                            onChange={(e) => setPeriodeSampai(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <Button onClick={handleFilter} className="w-full">
                                            Refresh Laporan
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                Total Pendapatan
                                            </p>
                                            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPendapatan)}</p>
                                        </div>
                                        <TrendingUp className="h-8 w-8 text-green-500" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                Total Beban
                                            </p>
                                            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalBeban)}</p>
                                        </div>
                                        <TrendingDown className="h-8 w-8 text-red-500" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                {isProfit ? 'Laba Bersih' : 'Rugi Bersih'}
                                            </p>
                                            <p className={`text-2xl font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                                                {formatCurrency(Math.abs(labaRugi))}
                                            </p>
                                        </div>
                                        <DollarSign className={`h-8 w-8 ${isProfit ? 'text-green-500' : 'text-red-500'}`} />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Laba Rugi Table */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Laporan Laba Rugi</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[120px]">Kode Akun</TableHead>
                                            <TableHead>Nama Akun</TableHead>
                                            <TableHead className="text-right w-[150px]">Jumlah</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {/* PENDAPATAN */}
                                        <TableRow className="bg-green-50 dark:bg-green-900/20">
                                            <TableCell colSpan={3} className="font-bold text-lg">
                                                PENDAPATAN
                                            </TableCell>
                                        </TableRow>
                                        {dataPendapatan.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center text-gray-500 py-4">
                                                    Tidak ada data pendapatan
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            dataPendapatan.map((item) => (
                                                <TableRow key={item.akun.id}>
                                                    <TableCell className="font-mono text-sm">
                                                        {item.akun.kode_akun}
                                                    </TableCell>
                                                    <TableCell>{item.akun.nama_akun}</TableCell>
                                                    <TableCell className="text-right font-mono">
                                                        {formatCurrency(item.saldo)}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                        <TableRow className="bg-green-100 dark:bg-green-800/30">
                                            <TableCell colSpan={2} className="font-bold">
                                                TOTAL PENDAPATAN
                                            </TableCell>
                                            <TableCell className="text-right font-bold font-mono">
                                                {formatCurrency(totalPendapatan)}
                                            </TableCell>
                                        </TableRow>

                                        {/* BEBAN */}
                                        <TableRow className="bg-red-50 dark:bg-red-900/20">
                                            <TableCell colSpan={3} className="font-bold text-lg pt-6">
                                                BEBAN
                                            </TableCell>
                                        </TableRow>
                                        {dataBeban.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center text-gray-500 py-4">
                                                    Tidak ada data beban
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            dataBeban.map((item) => (
                                                <TableRow key={item.akun.id}>
                                                    <TableCell className="font-mono text-sm">
                                                        {item.akun.kode_akun}
                                                    </TableCell>
                                                    <TableCell>{item.akun.nama_akun}</TableCell>
                                                    <TableCell className="text-right font-mono">
                                                        {formatCurrency(item.saldo)}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                        <TableRow className="bg-red-100 dark:bg-red-800/30">
                                            <TableCell colSpan={2} className="font-bold">
                                                TOTAL BEBAN
                                            </TableCell>
                                            <TableCell className="text-right font-bold font-mono">
                                                {formatCurrency(totalBeban)}
                                            </TableCell>
                                        </TableRow>

                                        {/* LABA/RUGI BERSIH */}
                                        <TableRow className={`${isProfit ? 'bg-green-200 dark:bg-green-700/40' : 'bg-red-200 dark:bg-red-700/40'}`}>
                                            <TableCell colSpan={2} className="font-bold text-lg pt-4">
                                                {isProfit ? 'LABA BERSIH' : 'RUGI BERSIH'}
                                            </TableCell>
                                            <TableCell className={`text-right font-bold font-mono text-lg pt-4 ${isProfit ? 'text-green-700' : 'text-red-700'}`}>
                                                {formatCurrency(Math.abs(labaRugi))}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Performance Indicator */}
                        <Card className="mt-6">
                            <CardHeader>
                                <CardTitle>Analisis Kinerja</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="font-semibold mb-2">Margin Laba</h3>
                                        <p className="text-2xl font-bold">
                                            {totalPendapatan > 0 ? ((labaRugi / totalPendapatan) * 100).toFixed(2) : '0'}%
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Persentase laba terhadap pendapatan
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-2">Status Keuangan</h3>
                                        <Badge variant={isProfit ? "default" : "destructive"} className="text-sm px-3 py-1">
                                            {isProfit ? "PROFITABLE" : "LOSS"}
                                        </Badge>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            Kondisi keuangan periode ini
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
