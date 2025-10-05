import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

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
                        <div className="mb-6 p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                            <div className="mb-4">
                                <h3 className="flex items-center text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    <Calendar className="h-5 w-5 mr-2" />
                                    Pilih Tanggal Neraca
                                </h3>
                            </div>
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
                        </div>

                        {/* Balance Status */}
                        <div className={`mb-6 p-4 border rounded-lg ${
                            balanced 
                                ? 'border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/20' 
                                : 'border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/20'
                        }`}>
                            <div className="flex items-center">
                                {balanced ? (
                                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                ) : (
                                    <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                )}
                                <p className={`ml-2 text-sm font-medium ${
                                    balanced 
                                        ? 'text-green-800 dark:text-green-200' 
                                        : 'text-red-800 dark:text-red-200'
                                }`}>
                                    {balanced 
                                        ? 'Neraca Balance: Aset = Kewajiban + Modal' 
                                        : `Neraca Tidak Balance! Selisih: ${formatCurrency(totalAset - (totalKewajiban + totalEkuitas))}`
                                    }
                                </p>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Total Aset
                                        </p>
                                        <p className={`text-xl font-bold ${
                                            totalAset >= 0 
                                                ? 'text-green-600 dark:text-green-400' 
                                                : 'text-red-600 dark:text-red-400'
                                        }`}>
                                            {formatCurrency(totalAset)}
                                        </p>
                                    </div>
                                    <BarChart3 className="h-6 w-6 text-gray-400" />
                                </div>
                            </div>

                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Total Kewajiban
                                        </p>
                                        <p className={`text-xl font-bold ${
                                            totalKewajiban >= 0 
                                                ? 'text-green-600 dark:text-green-400' 
                                                : 'text-red-600 dark:text-red-400'
                                        }`}>
                                            {formatCurrency(totalKewajiban)}
                                        </p>
                                    </div>
                                    <BarChart3 className="h-6 w-6 text-gray-400" />
                                </div>
                            </div>

                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Total Modal
                                        </p>
                                        <p className={`text-xl font-bold ${
                                            totalEkuitas >= 0 
                                                ? 'text-green-600 dark:text-green-400' 
                                                : 'text-red-600 dark:text-red-400'
                                        }`}>
                                            {formatCurrency(totalEkuitas)}
                                        </p>
                                    </div>
                                    <BarChart3 className="h-6 w-6 text-gray-400" />
                                </div>
                            </div>
                        </div>

                        {/* Neraca Table */}
                        <div className="space-y-8">
                            {/* ASET */}
                            <div>
                                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">ASET</h2>
                                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-32">Kode Akun</TableHead>
                                                <TableHead>Nama Akun</TableHead>
                                                <TableHead className="text-right w-48">Saldo</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {dataAset.map((item) => (
                                                <TableRow key={item.akun.id}>
                                                    <TableCell className="font-mono text-sm">
                                                        {item.akun.kode_akun}
                                                    </TableCell>
                                                    <TableCell>{item.akun.nama_akun}</TableCell>
                                                    <TableCell className={`text-right font-mono ${
                                                        item.saldo >= 0 
                                                            ? 'text-green-600 dark:text-green-400' 
                                                            : 'text-red-600 dark:text-red-400'
                                                    }`}>
                                                        {formatCurrency(item.saldo)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
                                                <TableCell colSpan={2} className="font-bold">
                                                    TOTAL ASET
                                                </TableCell>
                                                <TableCell className={`text-right font-bold font-mono ${
                                                    totalAset >= 0 
                                                        ? 'text-green-600 dark:text-green-400' 
                                                        : 'text-red-600 dark:text-red-400'
                                                }`}>
                                                    {formatCurrency(totalAset)}
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            {/* KEWAJIBAN & MODAL */}
                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">KEWAJIBAN & MODAL</h3>
                                </div>
                                <div className="p-6">
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
                                                            <TableCell className={`text-right font-mono ${item.saldo >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                                {formatCurrency(item.saldo)}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                    <TableRow className="border-t border-gray-200 dark:border-gray-600">
                                                        <TableCell colSpan={2} className="font-semibold">
                                                            Total Kewajiban
                                                        </TableCell>
                                                        <TableCell className={`text-right font-semibold font-mono ${totalKewajiban >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                            {formatCurrency(totalKewajiban)}
                                                        </TableCell>
                                                    </TableRow>
                                                </>
                                            )}

                                            {/* Modal */}
                                            <TableRow className="bg-gray-50 dark:bg-gray-700">
                                                <TableCell colSpan={3} className="font-semibold">
                                                    MODAL
                                                </TableCell>
                                            </TableRow>
                                            {dataEkuitas.map((item) => (
                                                <TableRow key={item.akun.id}>
                                                    <TableCell className="font-mono text-sm">
                                                        {item.akun.kode_akun}
                                                    </TableCell>
                                                    <TableCell>{item.akun.nama_akun}</TableCell>
                                                    <TableCell className={`text-right font-mono ${item.saldo >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                        {formatCurrency(item.saldo)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {labaRugiBerjalan !== 0 && (
                                                <TableRow>
                                                    <TableCell className="font-mono text-sm">-</TableCell>
                                                    <TableCell>Laba/Rugi Berjalan</TableCell>
                                                    <TableCell className={`text-right font-mono ${labaRugiBerjalan >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                        {formatCurrency(labaRugiBerjalan)}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                            <TableRow className="border-t border-gray-200 dark:border-gray-600">
                                                <TableCell colSpan={2} className="font-semibold">
                                                    Total Modal
                                                </TableCell>
                                                <TableCell className={`text-right font-semibold font-mono ${totalEkuitas >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                    {formatCurrency(totalEkuitas)}
                                                </TableCell>
                                            </TableRow>
                                            
                                            {/* Total Kewajiban + Modal */}
                                            <TableRow className="border-t-2 border-gray-300 dark:border-gray-600">
                                                <TableCell colSpan={2} className="font-bold">
                                                    TOTAL KEWAJIBAN + MODAL
                                                </TableCell>
                                                <TableCell className={`text-right font-bold font-mono ${(totalKewajiban + totalEkuitas) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                    {formatCurrency(totalKewajiban + totalEkuitas)}
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
