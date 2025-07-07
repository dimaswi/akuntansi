import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
    ArrowLeft, 
    Download, 
    Calendar,
    TrendingUp,
    Activity
} from 'lucide-react';
import { Link } from '@inertiajs/react';

interface Akun {
    id: number;
    kode_akun: string;
    nama_akun: string;
    jenis_akun: string;
}

interface DetailEkuitas {
    akun: Akun;
    saldo_awal: number;
    mutasi: number;
    saldo_akhir: number;
}

interface Props {
    periode_dari: string;
    periode_sampai: string;
    saldoAwalEkuitas: number;
    labaRugiPeriode: number;
    tambahanInvestasi: number;
    penarikan: number;
    saldoAkhirEkuitas: number;
    detailEkuitas: DetailEkuitas[];
}

export default function PerubahanEkuitas({ 
    periode_dari,
    periode_sampai,
    saldoAwalEkuitas,
    labaRugiPeriode,
    tambahanInvestasi,
    penarikan,
    saldoAkhirEkuitas,
    detailEkuitas
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
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const handlePeriodeChange = () => {
        router.get(route('akuntansi.laporan.perubahan-ekuitas'), { 
            periode_dari: periodeDari,
            periode_sampai: periodeSampai
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleExport = () => {
        // TODO: Implement export functionality
        console.log('Export perubahan ekuitas');
    };

    return (
        <AppLayout>
            <Head title={`Perubahan Ekuitas - ${formatDate(periode_dari)} s/d ${formatDate(periode_sampai)}`} />
            
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
                                    <div className="flex items-center space-x-2">
                                        <Activity className="h-6 w-6 text-orange-600" />
                                        <h1 className="text-2xl font-bold">Laporan Perubahan Ekuitas</h1>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        Periode: {formatDate(periode_dari)} - {formatDate(periode_sampai)}
                                    </p>
                                </div>
                            </div>
                            
                            <Button onClick={handleExport} className="mt-4 sm:mt-0">
                                <Download className="h-4 w-4 mr-2" />
                                Export
                            </Button>
                        </div>

                        {/* Filter Periode */}
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center">
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
                                        <Button onClick={handlePeriodeChange} className="w-full">
                                            <TrendingUp className="h-4 w-4 mr-2" />
                                            Generate Laporan
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Laporan Perubahan Ekuitas */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Laporan Perubahan Ekuitas</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    {/* Ringkasan Perubahan Ekuitas */}
                                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                        <h3 className="font-semibold text-lg mb-4">Ringkasan Perubahan Ekuitas</h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-600">
                                                <span>Saldo Awal Ekuitas</span>
                                                <span className="font-medium">{formatCurrency(saldoAwalEkuitas)}</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-600">
                                                <span className="text-green-600 dark:text-green-400">
                                                    {labaRugiPeriode >= 0 ? 'Laba Periode Berjalan' : 'Rugi Periode Berjalan'}
                                                </span>
                                                <span className={`font-medium ${labaRugiPeriode >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                    {formatCurrency(Math.abs(labaRugiPeriode))}
                                                </span>
                                            </div>
                                            {tambahanInvestasi > 0 && (
                                                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-600">
                                                    <span className="text-blue-600 dark:text-blue-400">Tambahan Investasi</span>
                                                    <span className="font-medium text-blue-600 dark:text-blue-400">
                                                        {formatCurrency(tambahanInvestasi)}
                                                    </span>
                                                </div>
                                            )}
                                            {penarikan > 0 && (
                                                <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-600">
                                                    <span className="text-red-600 dark:text-red-400">Penarikan/Dividen</span>
                                                    <span className="font-medium text-red-600 dark:text-red-400">
                                                        ({formatCurrency(penarikan)})
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex justify-between py-3 border-t-2 border-gray-300 dark:border-gray-500 font-bold text-lg">
                                                <span>Saldo Akhir Ekuitas</span>
                                                <span>{formatCurrency(saldoAkhirEkuitas)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Detail Per Akun Ekuitas */}
                                    {detailEkuitas.length > 0 && (
                                        <div>
                                            <h3 className="font-semibold text-lg mb-4">Detail Per Akun Ekuitas</h3>
                                            <div className="overflow-x-auto">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Kode Akun</TableHead>
                                                            <TableHead>Nama Akun</TableHead>
                                                            <TableHead className="text-right">Saldo Awal</TableHead>
                                                            <TableHead className="text-right">Mutasi</TableHead>
                                                            <TableHead className="text-right">Saldo Akhir</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {detailEkuitas.map((detail, index) => (
                                                            <TableRow key={index}>
                                                                <TableCell className="font-medium">
                                                                    {detail.akun.kode_akun}
                                                                </TableCell>
                                                                <TableCell>{detail.akun.nama_akun}</TableCell>
                                                                <TableCell className="text-right">
                                                                    {formatCurrency(detail.saldo_awal)}
                                                                </TableCell>
                                                                <TableCell className={`text-right ${detail.mutasi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                    {detail.mutasi >= 0 ? '+' : ''}{formatCurrency(detail.mutasi)}
                                                                </TableCell>
                                                                <TableCell className="text-right font-medium">
                                                                    {formatCurrency(detail.saldo_akhir)}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </div>
                                    )}

                                    {/* Informasi */}
                                    <Alert>
                                        <Activity className="h-4 w-4" />
                                        <AlertDescription>
                                            <strong>Informasi:</strong> Laporan perubahan ekuitas menunjukkan perubahan modal pemilik 
                                            selama periode tertentu. Saldo akhir ekuitas harus sama dengan nilai ekuitas di neraca pada 
                                            akhir periode yang sama.
                                        </AlertDescription>
                                    </Alert>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
