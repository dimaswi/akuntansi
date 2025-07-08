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
    CheckCircle,
    AlertTriangle,
    BarChart3
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
    tanggal: string;
    dataAset: AkunSaldo[];
    dataKewajiban: AkunSaldo[];
    dataEkuitas: AkunSaldo[];
    labaRugiBerjalan: number;
    totalAset: number;
    totalKewajiban: number;
    totalEkuitas: number;
    balanced: boolean;
}

export default function Neraca({ 
    tanggal,
    dataAset,
    dataKewajiban,
    dataEkuitas,
    labaRugiBerjalan,
    totalAset,
    totalKewajiban,
    totalEkuitas,
    balanced
}: Props) {
    const [selectedDate, setSelectedDate] = useState(tanggal);

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

    const handleDateChange = () => {
        router.get(route('akuntansi.laporan.neraca'), { tanggal: selectedDate }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleExport = () => {
        // TODO: Implement export functionality
        console.log('Export neraca');
    };

    return (
        <AppLayout>
            <Head title={`Neraca - ${formatDate(tanggal)}`} />
            
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
                                    <h1 className="text-3xl font-bold mb-2">Neraca</h1>
                                    <p className="text-lg text-gray-600 dark:text-gray-400">
                                        Per {formatDate(tanggal)}
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

                        {/* Date Filter */}
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Calendar className="h-5 w-5 mr-2" />
                                    Pilih Tanggal Neraca
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-end space-x-4">
                                    <div>
                                        <Label htmlFor="tanggal">Tanggal</Label>
                                        <Input
                                            id="tanggal"
                                            type="date"
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                            className="w-48"
                                        />
                                    </div>
                                    <Button onClick={handleDateChange}>
                                        Refresh Neraca
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Balance Alert */}
                        <Alert className={`mb-6 ${balanced ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                            <div className="flex items-center">
                                {balanced ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                )}
                                <AlertDescription className={`ml-2 ${balanced ? 'text-green-800' : 'text-red-800'}`}>
                                    {balanced 
                                        ? 'Neraca Balance: Aset = Kewajiban + Ekuitas' 
                                        : `Neraca Tidak Balance! Selisih: ${formatCurrency(totalAset - (totalKewajiban + totalEkuitas))}`
                                    }
                                </AlertDescription>
                            </div>
                        </Alert>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                Total Aset
                                            </p>
                                            <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalAset)}</p>
                                        </div>
                                        <BarChart3 className="h-8 w-8 text-blue-500" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                Total Kewajiban
                                            </p>
                                            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalKewajiban)}</p>
                                        </div>
                                        <BarChart3 className="h-8 w-8 text-red-500" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                Total Ekuitas
                                            </p>
                                            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalEkuitas)}</p>
                                        </div>
                                        <BarChart3 className="h-8 w-8 text-green-500" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Neraca Table */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* ASET */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg font-bold">ASET</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Kode</TableHead>
                                                <TableHead>Nama Akun</TableHead>
                                                <TableHead className="text-right">Saldo</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {dataAset.map((item) => (
                                                <TableRow key={item.akun.id}>
                                                    <TableCell className="font-mono text-sm">
                                                        {item.akun.kode_akun}
                                                    </TableCell>
                                                    <TableCell>{item.akun.nama_akun}</TableCell>
                                                    <TableCell className="text-right font-mono">
                                                        {formatCurrency(item.saldo)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow className="bg-blue-50 dark:bg-blue-900/20">
                                                <TableCell colSpan={2} className="font-bold">
                                                    TOTAL ASET
                                                </TableCell>
                                                <TableCell className="text-right font-bold font-mono">
                                                    {formatCurrency(totalAset)}
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>

                            {/* KEWAJIBAN & EKUITAS */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg font-bold">KEWAJIBAN & EKUITAS</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Kode</TableHead>
                                                <TableHead>Nama Akun</TableHead>
                                                <TableHead className="text-right">Saldo</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {/* Kewajiban */}
                                            {dataKewajiban.length > 0 && (
                                                <>
                                                    <TableRow className="bg-gray-50 dark:bg-gray-700">
                                                        <TableCell colSpan={3} className="font-semibold">
                                                            KEWAJIBAN
                                                        </TableCell>
                                                    </TableRow>
                                                    {dataKewajiban.map((item) => (
                                                        <TableRow key={item.akun.id}>
                                                            <TableCell className="font-mono text-sm">
                                                                {item.akun.kode_akun}
                                                            </TableCell>
                                                            <TableCell>{item.akun.nama_akun}</TableCell>
                                                            <TableCell className="text-right font-mono">
                                                                {formatCurrency(item.saldo)}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                    <TableRow className="bg-red-50 dark:bg-red-900/20">
                                                        <TableCell colSpan={2} className="font-semibold">
                                                            Total Kewajiban
                                                        </TableCell>
                                                        <TableCell className="text-right font-semibold font-mono">
                                                            {formatCurrency(totalKewajiban)}
                                                        </TableCell>
                                                    </TableRow>
                                                </>
                                            )}

                                            {/* Ekuitas */}
                                            <TableRow className="bg-gray-50 dark:bg-gray-700">
                                                <TableCell colSpan={3} className="font-semibold">
                                                    EKUITAS
                                                </TableCell>
                                            </TableRow>
                                            {dataEkuitas.map((item) => (
                                                <TableRow key={item.akun.id}>
                                                    <TableCell className="font-mono text-sm">
                                                        {item.akun.kode_akun}
                                                    </TableCell>
                                                    <TableCell>{item.akun.nama_akun}</TableCell>
                                                    <TableCell className="text-right font-mono">
                                                        {formatCurrency(item.saldo)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {labaRugiBerjalan !== 0 && (
                                                <TableRow>
                                                    <TableCell className="font-mono text-sm">-</TableCell>
                                                    <TableCell>Laba/Rugi Berjalan</TableCell>
                                                    <TableCell className="text-right font-mono">
                                                        {formatCurrency(labaRugiBerjalan)}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                            <TableRow className="bg-green-50 dark:bg-green-900/20">
                                                <TableCell colSpan={2} className="font-semibold">
                                                    Total Ekuitas
                                                </TableCell>
                                                <TableCell className="text-right font-semibold font-mono">
                                                    {formatCurrency(totalEkuitas)}
                                                </TableCell>
                                            </TableRow>
                                            
                                            {/* Total Kewajiban + Ekuitas */}
                                            <TableRow className="bg-gray-100 dark:bg-gray-600">
                                                <TableCell colSpan={2} className="font-bold">
                                                    TOTAL KEWAJIBAN + EKUITAS
                                                </TableCell>
                                                <TableCell className="text-right font-bold font-mono">
                                                    {formatCurrency(totalKewajiban + totalEkuitas)}
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
