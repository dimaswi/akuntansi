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
    Filter, 
    Calculator,
    TrendingUp,
    TrendingDown,
    FileText,
    Calendar
} from 'lucide-react';
import { Link } from '@inertiajs/react';

interface Akun {
    id: number;
    kode_akun: string;
    nama_akun: string;
    jenis_akun: string;
}

interface Transaksi {
    id: number;
    tanggal: string;
    keterangan: string;
    referensi: string;
    debet: number;
    kredit: number;
    saldo: number;
}

interface Props {
    akun: Akun;
    saldoAwal: number;
    saldoAkhir: number;
    mutasiDebet: number;
    mutasiKredit: number;
    transaksi: Transaksi[];
    filters: {
        periode_dari: string;
        periode_sampai: string;
    };
}

export default function BukuBesarShow({ 
    akun, 
    saldoAwal, 
    saldoAkhir, 
    mutasiDebet, 
    mutasiKredit, 
    transaksi, 
    filters 
}: Props) {
    const [periodeDari, setPeriodeDari] = useState(filters.periode_dari);
    const [periodeSampai, setPeriodeSampai] = useState(filters.periode_sampai);

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

    const getJenisAkunBadge = (jenisAkun: string) => {
        const variants: Record<string, any> = {
            'aset': 'default',
            'kewajiban': 'destructive',
            'ekuitas': 'secondary',
            'pendapatan': 'success',
            'beban': 'warning'
        };
        
        return (
            <Badge variant={variants[jenisAkun] || 'outline'}>
                {jenisAkun?.charAt(0).toUpperCase() + jenisAkun?.slice(1)}
            </Badge>
        );
    };

    const handleFilter = () => {
        const params = {
            periode_dari: periodeDari,
            periode_sampai: periodeSampai,
        };

        router.get(route('akuntansi.buku-besar.show', akun.id), params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleExport = () => {
        // TODO: Implement export functionality
        console.log('Export detail buku besar');
    };

    return (
        <AppLayout>
            <Head title={`Buku Besar - ${akun.nama_akun}`} />
            
            <div className="max-w-7xl p-4 sm:px-6 lg:px-8">
                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                    <div className="p-6 text-gray-900 dark:text-gray-100">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                            <div className="flex items-center space-x-4">
                                <Button asChild variant="outline" size="sm">
                                    <Link href={route('akuntansi.buku-besar.index')}>
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Kembali
                                    </Link>
                                </Button>
                                <div>
                                    <h1 className="text-3xl font-bold mb-2">Detail Buku Besar</h1>
                                    <div className="flex items-center space-x-4">
                                        <p className="text-lg font-semibold">
                                            {akun.kode_akun} - {akun.nama_akun}
                                        </p>
                                        {getJenisAkunBadge(akun.jenis_akun)}
                                    </div>
                                </div>
                            </div>
                            <div className="flex space-x-2 mt-4 sm:mt-0">
                                <Button onClick={handleExport} variant="outline">
                                    <Download className="h-4 w-4 mr-2" />
                                    Export
                                </Button>
                            </div>
                        </div>

                        {/* Filter Periode */}
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
                                            <Filter className="h-4 w-4 mr-2" />
                                            Terapkan Filter
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                Saldo Awal
                                            </p>
                                            <p className="text-2xl font-bold">{formatCurrency(saldoAwal)}</p>
                                        </div>
                                        <Calculator className="h-8 w-8 text-blue-500" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                Total Debet
                                            </p>
                                            <p className="text-2xl font-bold text-green-600">{formatCurrency(mutasiDebet)}</p>
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
                                                Total Kredit
                                            </p>
                                            <p className="text-2xl font-bold text-red-600">{formatCurrency(mutasiKredit)}</p>
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
                                                Saldo Akhir
                                            </p>
                                            <p className="text-2xl font-bold">{formatCurrency(saldoAkhir)}</p>
                                        </div>
                                        <FileText className="h-8 w-8 text-purple-500" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Tabel Transaksi Detail */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Detail Transaksi</CardTitle>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Periode: {formatDate(periodeDari)} - {formatDate(periodeSampai)} 
                                    ({transaksi.length} transaksi)
                                </p>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[100px]">Tanggal</TableHead>
                                                <TableHead>Keterangan</TableHead>
                                                <TableHead className="w-[120px]">Referensi</TableHead>
                                                <TableHead className="text-right w-[120px]">Debet</TableHead>
                                                <TableHead className="text-right w-[120px]">Kredit</TableHead>
                                                <TableHead className="text-right w-[120px]">Saldo</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {/* Saldo Awal */}
                                            <TableRow className="bg-gray-50 dark:bg-gray-700">
                                                <TableCell colSpan={3} className="font-medium text-center">
                                                    <strong>Saldo Awal ({formatDate(periodeDari)})</strong>
                                                </TableCell>
                                                <TableCell className="text-right font-mono">-</TableCell>
                                                <TableCell className="text-right font-mono">-</TableCell>
                                                <TableCell className="text-right font-mono font-bold">
                                                    {formatCurrency(saldoAwal)}
                                                </TableCell>
                                            </TableRow>

                                            {/* Transaksi */}
                                            {transaksi.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-8">
                                                        <div className="flex flex-col items-center">
                                                            <FileText className="h-12 w-12 text-gray-400 mb-2" />
                                                            <p className="text-gray-500">Tidak ada transaksi dalam periode ini</p>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                transaksi.map((item, index) => (
                                                    <TableRow key={item.id}>
                                                        <TableCell className="font-mono">
                                                            {formatDate(item.tanggal)}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="max-w-xs truncate" title={item.keterangan}>
                                                                {item.keterangan}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="font-mono text-sm">
                                                            {item.referensi}
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono">
                                                            {item.debet > 0 ? (
                                                                <span className="text-green-600 font-semibold">
                                                                    {formatCurrency(item.debet)}
                                                                </span>
                                                            ) : '-'}
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono">
                                                            {item.kredit > 0 ? (
                                                                <span className="text-red-600 font-semibold">
                                                                    {formatCurrency(item.kredit)}
                                                                </span>
                                                            ) : '-'}
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono font-medium">
                                                            {formatCurrency(item.saldo)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}

                                            {/* Saldo Akhir */}
                                            <TableRow className="bg-gray-50 dark:bg-gray-700 border-t-2">
                                                <TableCell colSpan={3} className="font-medium text-center">
                                                    <strong>Saldo Akhir ({formatDate(periodeSampai)})</strong>
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-bold text-green-600">
                                                    {formatCurrency(mutasiDebet)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-bold text-red-600">
                                                    {formatCurrency(mutasiKredit)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-bold text-lg">
                                                    {formatCurrency(saldoAkhir)}
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
