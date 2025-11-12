import React, { useState, useEffect } from 'react';
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
    BarChart3,
    ChevronDown,
    ChevronRight
} from 'lucide-react';
import { Link } from '@inertiajs/react';

interface Akun {
    id: number;
    kode_akun: string;
    nama_akun: string;
    jenis_akun: string;
}

interface DetailTransaksi {
    id: number;
    tanggal: string;
    nomor_jurnal: string;
    keterangan: string;
    debit: number;
    kredit: number;
    saldo: number;
}

interface AkunSaldo {
    akun: Akun;
    saldo: number;
    detail_transaksi: DetailTransaksi[];
}

interface Props {
    periode_dari: string;
    periode_sampai: string;
    include_penyesuaian: boolean;
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
    periode_dari,
    periode_sampai,
    include_penyesuaian,
    dataAset,
    dataKewajiban,
    dataEkuitas,
    labaRugiBerjalan,
    totalAset,
    totalKewajiban,
    totalEkuitas,
    balanced
}: Props) {
    const [periodeDari, setPeriodeDari] = useState(periode_dari);
    const [periodeSampai, setPeriodeSampai] = useState(periode_sampai);
    const [includePenyesuaian, setIncludePenyesuaian] = useState(include_penyesuaian);
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

    // Auto-reload ketika toggle jurnal penyesuaian berubah
    useEffect(() => {
        if (includePenyesuaian !== include_penyesuaian) {
            router.get(route('akuntansi.laporan.neraca'), { 
                periode_dari: periodeDari,
                periode_sampai: periodeSampai,
                include_penyesuaian: includePenyesuaian ? 1 : 0
            }, {
                preserveState: true,
                preserveScroll: true,
            });
        }
    }, [includePenyesuaian]);

    const toggleRow = (akunId: number) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(akunId)) {
            newExpanded.delete(akunId);
        } else {
            newExpanded.add(akunId);
        }
        setExpandedRows(newExpanded);
    };

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
        router.get(route('akuntansi.laporan.neraca'), { 
            periode_dari: periodeDari,
            periode_sampai: periodeSampai,
            include_penyesuaian: includePenyesuaian ? 1 : 0
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleExport = () => {
        // TODO: Implement export functionality
        console.log('Export neraca');
    };

    console.log("Get Data Periode Dari" : periodeDari);
    console.log("Get Data Periode Sampai" : periodeSampai);

    return (
        <AppLayout>
            <Head title={`Neraca - ${formatDate(periode_sampai)}`} />
            
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
                                        Per {formatDate(periode_sampai)}
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
                                    Pilih Periode Neraca
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    Neraca akan menampilkan posisi keuangan per tanggal sampai, dan laba/rugi berjalan untuk periode yang dipilih
                                </p>
                            </div>
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
                                    <Button onClick={handleDateChange} className="w-full">
                                        Refresh Neraca
                                    </Button>
                                </div>
                            </div>
                            
                            {/* Toggle Jurnal Penyesuaian */}
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <label className="flex items-center space-x-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={includePenyesuaian}
                                        onChange={(e) => setIncludePenyesuaian(e.target.checked)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <div>
                                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            Sertakan Jurnal Penyesuaian
                                        </span>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Aktifkan untuk melihat neraca setelah jurnal penyesuaian periode akhir
                                        </p>
                                    </div>
                                </label>
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
                                                <TableHead className="w-[50px]"></TableHead>
                                                <TableHead className="w-32">Kode Akun</TableHead>
                                                <TableHead>Nama Akun</TableHead>
                                                <TableHead className="text-right w-48">Saldo</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {dataAset.map((item) => (
                                                <React.Fragment key={item.akun.id}>
                                                    <TableRow 
                                                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                                                        onClick={() => toggleRow(item.akun.id)}
                                                    >
                                                        <TableCell>
                                                            {expandedRows.has(item.akun.id) ? (
                                                                <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                                            ) : (
                                                                <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                                            )}
                                                        </TableCell>
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
                                                    {expandedRows.has(item.akun.id) && (
                                                        <TableRow>
                                                            <TableCell colSpan={4} className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-0 border-l-4 border-gray-400 dark:border-gray-600">
                                                                <div className="px-4 py-3">
                                                                    <div className="mb-2 flex items-center justify-between">
                                                                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Detail Transaksi</span>
                                                                        <Badge variant="outline" className="text-xs">
                                                                            {item.detail_transaksi.length} transaksi
                                                                        </Badge>
                                                                    </div>
                                                                    <div className="overflow-x-auto">
                                                                        <table className="w-full text-xs">
                                                                            <thead>
                                                                                <tr className="border-b border-gray-300 dark:border-gray-700">
                                                                                    <th className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">Tanggal</th>
                                                                                    <th className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">No. Jurnal</th>
                                                                                    <th className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">Keterangan</th>
                                                                                    <th className="text-right py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">Debit</th>
                                                                                    <th className="text-right py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">Kredit</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {item.detail_transaksi.map((detail, idx) => (
                                                                                    <tr 
                                                                                        key={detail.id} 
                                                                                        className={`border-b border-gray-200 dark:border-gray-700/50 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors ${
                                                                                            idx % 2 === 0 ? 'bg-white/30 dark:bg-black/10' : ''
                                                                                        }`}
                                                                                    >
                                                                                        <td className="py-2 px-2 text-gray-700 dark:text-gray-300">{detail.tanggal}</td>
                                                                                        <td className="py-2 px-2 font-mono text-gray-600 dark:text-gray-400">{detail.nomor_jurnal}</td>
                                                                                        <td className="py-2 px-2 text-gray-700 dark:text-gray-300 max-w-xs truncate" title={detail.keterangan}>{detail.keterangan}</td>
                                                                                        <td className={`py-2 px-2 text-right font-mono font-semibold ${
                                                                                            detail.debit > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-600'
                                                                                        }`}>
                                                                                            {detail.debit > 0 ? formatCurrency(detail.debit) : '-'}
                                                                                        </td>
                                                                                        <td className={`py-2 px-2 text-right font-mono font-semibold ${
                                                                                            detail.kredit > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-600'
                                                                                        }`}>
                                                                                            {detail.kredit > 0 ? formatCurrency(detail.kredit) : '-'}
                                                                                        </td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                            <TableRow className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
                                                <TableCell></TableCell>
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
                                                <TableHead className="w-[50px]"></TableHead>
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
                                                        <TableCell colSpan={4} className="font-semibold">
                                                            KEWAJIBAN
                                                        </TableCell>
                                                    </TableRow>
                                                    {dataKewajiban.map((item) => (
                                                        <React.Fragment key={item.akun.id}>
                                                            <TableRow 
                                                                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                                                                onClick={() => toggleRow(item.akun.id)}
                                                            >
                                                                <TableCell>
                                                                    {expandedRows.has(item.akun.id) ? (
                                                                        <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                                                    ) : (
                                                                        <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                                                    )}
                                                                </TableCell>
                                                                <TableCell className="font-mono text-sm">
                                                                    {item.akun.kode_akun}
                                                                </TableCell>
                                                                <TableCell>{item.akun.nama_akun}</TableCell>
                                                                <TableCell className={`text-right font-mono ${item.saldo >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                                    {formatCurrency(item.saldo)}
                                                                </TableCell>
                                                            </TableRow>
                                                            {expandedRows.has(item.akun.id) && (
                                                                <TableRow>
                                                                    <TableCell colSpan={4} className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-0 border-l-4 border-gray-400 dark:border-gray-600">
                                                                        <div className="px-4 py-3">
                                                                            <div className="mb-2 flex items-center justify-between">
                                                                                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Detail Transaksi</span>
                                                                                <Badge variant="outline" className="text-xs">
                                                                                    {item.detail_transaksi.length} transaksi
                                                                                </Badge>
                                                                            </div>
                                                                            <div className="overflow-x-auto">
                                                                                <table className="w-full text-xs">
                                                                                    <thead>
                                                                                        <tr className="border-b border-gray-300 dark:border-gray-700">
                                                                                            <th className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">Tanggal</th>
                                                                                            <th className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">No. Jurnal</th>
                                                                                            <th className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">Keterangan</th>
                                                                                            <th className="text-right py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">Debit</th>
                                                                                            <th className="text-right py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">Kredit</th>
                                                                                        </tr>
                                                                                    </thead>
                                                                                    <tbody>
                                                                                        {item.detail_transaksi.map((detail, idx) => (
                                                                                            <tr 
                                                                                                key={detail.id} 
                                                                                                className={`border-b border-gray-200 dark:border-gray-700/50 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors ${
                                                                                                    idx % 2 === 0 ? 'bg-white/30 dark:bg-black/10' : ''
                                                                                                }`}
                                                                                            >
                                                                                                <td className="py-2 px-2 text-gray-700 dark:text-gray-300">{detail.tanggal}</td>
                                                                                                <td className="py-2 px-2 font-mono text-gray-600 dark:text-gray-400">{detail.nomor_jurnal}</td>
                                                                                                <td className="py-2 px-2 text-gray-700 dark:text-gray-300 max-w-xs truncate" title={detail.keterangan}>{detail.keterangan}</td>
                                                                                                <td className={`py-2 px-2 text-right font-mono font-semibold ${
                                                                                                    detail.debit > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-600'
                                                                                                }`}>
                                                                                                    {detail.debit > 0 ? formatCurrency(detail.debit) : '-'}
                                                                                                </td>
                                                                                                <td className={`py-2 px-2 text-right font-mono font-semibold ${
                                                                                                    detail.kredit > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-600'
                                                                                                }`}>
                                                                                                    {detail.kredit > 0 ? formatCurrency(detail.kredit) : '-'}
                                                                                                </td>
                                                                                            </tr>
                                                                                        ))}
                                                                                    </tbody>
                                                                                </table>
                                                                            </div>
                                                                        </div>
                                                                    </TableCell>
                                                                </TableRow>
                                                            )}
                                                        </React.Fragment>
                                                    ))}
                                                    <TableRow className="border-t border-gray-200 dark:border-gray-600">
                                                        <TableCell></TableCell>
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
                                                <TableCell colSpan={4} className="font-semibold">
                                                    MODAL
                                                </TableCell>
                                            </TableRow>
                                            {dataEkuitas.map((item) => (
                                                <React.Fragment key={item.akun.id}>
                                                    <TableRow 
                                                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                                                        onClick={() => toggleRow(item.akun.id)}
                                                    >
                                                        <TableCell>
                                                            {expandedRows.has(item.akun.id) ? (
                                                                <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                                            ) : (
                                                                <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="font-mono text-sm">
                                                            {item.akun.kode_akun}
                                                        </TableCell>
                                                        <TableCell>{item.akun.nama_akun}</TableCell>
                                                        <TableCell className={`text-right font-mono ${item.saldo >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                            {formatCurrency(item.saldo)}
                                                        </TableCell>
                                                    </TableRow>
                                                    {expandedRows.has(item.akun.id) && (
                                                        <TableRow>
                                                            <TableCell colSpan={4} className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-0 border-l-4 border-gray-400 dark:border-gray-600">
                                                                <div className="px-4 py-3">
                                                                    <div className="mb-2 flex items-center justify-between">
                                                                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Detail Transaksi</span>
                                                                        <Badge variant="outline" className="text-xs">
                                                                            {item.detail_transaksi.length} transaksi
                                                                        </Badge>
                                                                    </div>
                                                                    <div className="overflow-x-auto">
                                                                        <table className="w-full text-xs">
                                                                            <thead>
                                                                                <tr className="border-b border-gray-300 dark:border-gray-700">
                                                                                    <th className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">Tanggal</th>
                                                                                    <th className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">No. Jurnal</th>
                                                                                    <th className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">Keterangan</th>
                                                                                    <th className="text-right py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">Debit</th>
                                                                                    <th className="text-right py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">Kredit</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {item.detail_transaksi.map((detail, idx) => (
                                                                                    <tr 
                                                                                        key={detail.id} 
                                                                                        className={`border-b border-gray-200 dark:border-gray-700/50 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors ${
                                                                                            idx % 2 === 0 ? 'bg-white/30 dark:bg-black/10' : ''
                                                                                        }`}
                                                                                    >
                                                                                        <td className="py-2 px-2 text-gray-700 dark:text-gray-300">{detail.tanggal}</td>
                                                                                        <td className="py-2 px-2 font-mono text-gray-600 dark:text-gray-400">{detail.nomor_jurnal}</td>
                                                                                        <td className="py-2 px-2 text-gray-700 dark:text-gray-300 max-w-xs truncate" title={detail.keterangan}>{detail.keterangan}</td>
                                                                                        <td className={`py-2 px-2 text-right font-mono font-semibold ${
                                                                                            detail.debit > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-600'
                                                                                        }`}>
                                                                                            {detail.debit > 0 ? formatCurrency(detail.debit) : '-'}
                                                                                        </td>
                                                                                        <td className={`py-2 px-2 text-right font-mono font-semibold ${
                                                                                            detail.kredit > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-600'
                                                                                        }`}>
                                                                                            {detail.kredit > 0 ? formatCurrency(detail.kredit) : '-'}
                                                                                        </td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                            {labaRugiBerjalan !== 0 && (
                                                <TableRow>
                                                    <TableCell></TableCell>
                                                    <TableCell className="font-mono text-sm">-</TableCell>
                                                    <TableCell>Laba/Rugi Berjalan</TableCell>
                                                    <TableCell className={`text-right font-mono ${labaRugiBerjalan >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                        {formatCurrency(labaRugiBerjalan)}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                            <TableRow className="border-t border-gray-200 dark:border-gray-600">
                                                <TableCell></TableCell>
                                                <TableCell colSpan={2} className="font-semibold">
                                                    Total Modal
                                                </TableCell>
                                                <TableCell className={`text-right font-semibold font-mono ${totalEkuitas >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                    {formatCurrency(totalEkuitas)}
                                                </TableCell>
                                            </TableRow>
                                            
                                            {/* Total Kewajiban + Modal */}
                                            <TableRow className="border-t-2 border-gray-300 dark:border-gray-600">
                                                <TableCell></TableCell>
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
