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
    DollarSign,
    Activity
} from 'lucide-react';
import { Link } from '@inertiajs/react';

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

export default function ArusKas({ 
    periode_dari,
    periode_sampai,
    dataArusKas,
    totalKasMasuk,
    totalKasKeluar,
    netArusKas
}: Props) {
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
            year: 'numeric'
        });
    };

    const handleFilter = () => {
        router.get(route('akuntansi.laporan.arus-kas'), {
            periode_dari: periodeDari,
            periode_sampai: periodeSampai
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleExport = () => {
        // TODO: Implement export functionality
        console.log('Export arus kas');
    };

    const isPositiveFlow = netArusKas >= 0;

    return (
        <AppLayout>
            <Head title={`Arus Kas - ${formatDate(periode_dari)} s/d ${formatDate(periode_sampai)}`} />
            
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
                                    <h1 className="text-3xl font-bold mb-2">Laporan Arus Kas</h1>
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
                                                Total Kas Masuk
                                            </p>
                                            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalKasMasuk)}</p>
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
                                                Total Kas Keluar
                                            </p>
                                            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalKasKeluar)}</p>
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
                                                Net Arus Kas
                                            </p>
                                            <p className={`text-2xl font-bold ${isPositiveFlow ? 'text-green-600' : 'text-red-600'}`}>
                                                {formatCurrency(netArusKas)}
                                            </p>
                                        </div>
                                        <Activity className={`h-8 w-8 ${isPositiveFlow ? 'text-green-500' : 'text-red-500'}`} />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Arus Kas Summary */}
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle>Ringkasan Arus Kas per Akun</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {dataArusKas.length === 0 ? (
                                    <div className="text-center py-8">
                                        <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                        <p className="text-gray-500">Tidak ada transaksi kas dalam periode ini</p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[120px]">Kode Akun</TableHead>
                                                <TableHead>Nama Akun</TableHead>
                                                <TableHead className="text-right w-[120px]">Kas Masuk</TableHead>
                                                <TableHead className="text-right w-[120px]">Kas Keluar</TableHead>
                                                <TableHead className="text-right w-[120px]">Net Flow</TableHead>
                                                <TableHead className="w-[100px]">Aksi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {dataArusKas.map((item) => (
                                                <React.Fragment key={item.akun.id}>
                                                    <TableRow>
                                                        <TableCell className="font-mono text-sm">
                                                            {item.akun.kode_akun}
                                                        </TableCell>
                                                        <TableCell className="font-medium">
                                                            {item.akun.nama_akun}
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono text-green-600">
                                                            {formatCurrency(item.total_masuk)}
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono text-red-600">
                                                            {formatCurrency(item.total_keluar)}
                                                        </TableCell>
                                                        <TableCell className={`text-right font-mono font-semibold ${item.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
                                                                    <h4 className="font-semibold mb-3">Detail Transaksi {item.akun.nama_akun}</h4>
                                                                    <Table>
                                                                        <TableHeader>
                                                                            <TableRow>
                                                                                <TableHead className="w-[100px]">Tanggal</TableHead>
                                                                                <TableHead>Keterangan</TableHead>
                                                                                <TableHead className="w-[120px]">Referensi</TableHead>
                                                                                <TableHead className="text-right w-[100px]">Masuk</TableHead>
                                                                                <TableHead className="text-right w-[100px]">Keluar</TableHead>
                                                                                <TableHead className="text-right w-[100px]">Net</TableHead>
                                                                            </TableRow>
                                                                        </TableHeader>
                                                                        <TableBody>
                                                                            {item.transaksi.map((transaksi, index) => (
                                                                                <TableRow key={index}>
                                                                                    <TableCell className="font-mono text-sm">
                                                                                        {formatDate(transaksi.tanggal)}
                                                                                    </TableCell>
                                                                                    <TableCell className="text-sm">
                                                                                        {transaksi.keterangan}
                                                                                    </TableCell>
                                                                                    <TableCell className="font-mono text-sm">
                                                                                        {transaksi.referensi}
                                                                                    </TableCell>
                                                                                    <TableCell className="text-right font-mono text-sm text-green-600">
                                                                                        {transaksi.kas_masuk > 0 ? formatCurrency(transaksi.kas_masuk) : '-'}
                                                                                    </TableCell>
                                                                                    <TableCell className="text-right font-mono text-sm text-red-600">
                                                                                        {transaksi.kas_keluar > 0 ? formatCurrency(transaksi.kas_keluar) : '-'}
                                                                                    </TableCell>
                                                                                    <TableCell className={`text-right font-mono text-sm ${transaksi.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
                                            <TableRow className="bg-gray-100 dark:bg-gray-600">
                                                <TableCell colSpan={2} className="font-bold">
                                                    TOTAL
                                                </TableCell>
                                                <TableCell className="text-right font-bold font-mono text-green-600">
                                                    {formatCurrency(totalKasMasuk)}
                                                </TableCell>
                                                <TableCell className="text-right font-bold font-mono text-red-600">
                                                    {formatCurrency(totalKasKeluar)}
                                                </TableCell>
                                                <TableCell className={`text-right font-bold font-mono ${isPositiveFlow ? 'text-green-600' : 'text-red-600'}`}>
                                                    {formatCurrency(netArusKas)}
                                                </TableCell>
                                                <TableCell></TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>

                        {/* Cash Flow Analysis */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Analisis Arus Kas</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="font-semibold mb-2">Status Arus Kas</h3>
                                        <Badge variant={isPositiveFlow ? "default" : "destructive"} className="text-sm px-3 py-1">
                                            {isPositiveFlow ? "POSITIVE CASH FLOW" : "NEGATIVE CASH FLOW"}
                                        </Badge>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            {isPositiveFlow 
                                                ? "Kas masuk lebih besar dari kas keluar" 
                                                : "Kas keluar lebih besar dari kas masuk"
                                            }
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-2">Rasio Kas</h3>
                                        <p className="text-2xl font-bold">
                                            {totalKasKeluar > 0 ? (totalKasMasuk / totalKasKeluar).toFixed(2) : '∞'}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Perbandingan kas masuk dengan kas keluar
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
