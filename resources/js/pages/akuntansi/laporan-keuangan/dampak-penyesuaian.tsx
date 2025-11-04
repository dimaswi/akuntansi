import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    ArrowLeft, 
    Download, 
    Calendar,
    FileEdit,
    TrendingUp,
    TrendingDown,
    ChevronDown,
    ChevronRight,
    DollarSign,
    BarChart3
} from 'lucide-react';
import { Link } from '@inertiajs/react';

interface Akun {
    id: number;
    kode_akun: string;
    nama_akun: string;
    jenis_akun: string;
}

interface JurnalDetail {
    nomor_jurnal: string;
    tanggal: string;
    keterangan: string;
    debit: number;
    kredit: number;
    net: number;
}

interface DampakAkun {
    akun: Akun;
    total_debit: number;
    total_kredit: number;
    net: number;
    jurnal_list: JurnalDetail[];
}

interface Jurnal {
    id: number;
    nomor_jurnal: string;
    tanggal_transaksi: string;
    keterangan: string;
    total_debit: number;
    total_kredit: number;
}

interface Props {
    periode_dari: string;
    periode_sampai: string;
    jurnalPenyesuaian: Jurnal[];
    dampakPerJenisAkun: {
        aset: DampakAkun[];
        kewajiban: DampakAkun[];
        modal: DampakAkun[];
        pendapatan: DampakAkun[];
        beban: DampakAkun[];
    };
    dampakPendapatan: number;
    dampakBeban: number;
    dampakLabaRugi: number;
    dampakAset: number;
    dampakKewajiban: number;
    dampakModal: number;
    totalJurnalPenyesuaian: number;
}

export default function DampakPenyesuaian({ 
    periode_dari,
    periode_sampai,
    jurnalPenyesuaian,
    dampakPerJenisAkun,
    dampakPendapatan,
    dampakBeban,
    dampakLabaRugi,
    dampakAset,
    dampakKewajiban,
    dampakModal,
    totalJurnalPenyesuaian
}: Props) {
    const [periodeDari, setPeriodeDari] = useState(periode_dari);
    const [periodeSampai, setPeriodeSampai] = useState(periode_sampai);
    const [expandedAkun, setExpandedAkun] = useState<Set<number>>(new Set());
    const [activeTab, setActiveTab] = useState<'summary' | 'detail' | 'jurnal'>('summary');

    const toggleAkun = (akunId: number) => {
        const newExpanded = new Set(expandedAkun);
        if (newExpanded.has(akunId)) {
            newExpanded.delete(akunId);
        } else {
            newExpanded.add(akunId);
        }
        setExpandedAkun(newExpanded);
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
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const handleFilter = () => {
        router.get(route('akuntansi.laporan.dampak-penyesuaian'), {
            periode_dari: periodeDari,
            periode_sampai: periodeSampai
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleExport = () => {
        console.log('Export dampak penyesuaian');
    };

    const renderDampakAkun = (dampakList: DampakAkun[], jenisAkun: string) => {
        if (dampakList.length === 0) {
            return (
                <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 dark:text-gray-400">
                        Tidak ada dampak pada {jenisAkun}
                    </TableCell>
                </TableRow>
            );
        }

        return dampakList.map((item) => (
            <React.Fragment key={item.akun.id}>
                <TableRow className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                    <TableCell 
                        onClick={() => toggleAkun(item.akun.id)}
                        className="font-medium"
                    >
                        <div className="flex items-center space-x-2">
                            {expandedAkun.has(item.akun.id) ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronRight className="h-4 w-4" />
                            )}
                            <span>{item.akun.kode_akun}</span>
                        </div>
                    </TableCell>
                    <TableCell>{item.akun.nama_akun}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.total_debit)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.total_kredit)}</TableCell>
                    <TableCell className="text-right">
                        <span className={item.net >= 0 ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-red-600 dark:text-red-400 font-semibold'}>
                            {formatCurrency(item.net)}
                        </span>
                    </TableCell>
                </TableRow>
                
                {/* Detail Jurnal Expanded */}
                {expandedAkun.has(item.akun.id) && (
                    <TableRow>
                        <TableCell colSpan={5} className="bg-gray-50 dark:bg-gray-900">
                            <div className="p-4">
                                <h4 className="text-sm font-semibold mb-2">Detail Jurnal Penyesuaian:</h4>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Tanggal</TableHead>
                                            <TableHead>No. Jurnal</TableHead>
                                            <TableHead>Keterangan</TableHead>
                                            <TableHead className="text-right">Debit</TableHead>
                                            <TableHead className="text-right">Kredit</TableHead>
                                            <TableHead className="text-right">Net</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {item.jurnal_list.map((jurnal, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="text-sm">{formatDate(jurnal.tanggal)}</TableCell>
                                                <TableCell className="text-sm">{jurnal.nomor_jurnal}</TableCell>
                                                <TableCell className="text-sm">{jurnal.keterangan}</TableCell>
                                                <TableCell className="text-sm text-right">{formatCurrency(jurnal.debit)}</TableCell>
                                                <TableCell className="text-sm text-right">{formatCurrency(jurnal.kredit)}</TableCell>
                                                <TableCell className="text-sm text-right">
                                                    <span className={jurnal.net >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                        {formatCurrency(jurnal.net)}
                                                    </span>
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
        ));
    };

    return (
        <AppLayout>
            <Head title={`Dampak Jurnal Penyesuaian - ${formatDate(periode_dari)} s/d ${formatDate(periode_sampai)}`} />
            
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
                                    <h1 className="text-3xl font-bold mb-2 flex items-center">
                                        <FileEdit className="h-8 w-8 mr-3 text-indigo-500" />
                                        Dampak Jurnal Penyesuaian
                                    </h1>
                                    <p className="text-lg text-gray-600 dark:text-gray-400">
                                        Periode: {formatDate(periode_dari)} s/d {formatDate(periode_sampai)}
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
                        <div className="mb-6 p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                            <div className="mb-4">
                                <h3 className="flex items-center text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    <Calendar className="h-5 w-5 mr-2" />
                                    Filter Periode
                                </h3>
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
                                    <Button onClick={handleFilter} className="w-full">
                                        Refresh Laporan
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                        Total Jurnal Penyesuaian
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <span className="text-2xl font-bold">{totalJurnalPenyesuaian}</span>
                                        <FileEdit className="h-6 w-6 text-indigo-500" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                        Dampak Laba/Rugi
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <span className={`text-2xl font-bold ${dampakLabaRugi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(dampakLabaRugi)}
                                        </span>
                                        {dampakLabaRugi >= 0 ? (
                                            <TrendingUp className="h-6 w-6 text-green-500" />
                                        ) : (
                                            <TrendingDown className="h-6 w-6 text-red-500" />
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                        Dampak Aset
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <span className={`text-2xl font-bold ${dampakAset >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(dampakAset)}
                                        </span>
                                        <BarChart3 className="h-6 w-6 text-blue-500" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                        Dampak Kewajiban + Modal
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <span className={`text-2xl font-bold ${(dampakKewajiban + dampakModal) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(dampakKewajiban + dampakModal)}
                                        </span>
                                        <DollarSign className="h-6 w-6 text-purple-500" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Tabs */}
                        <div className="mb-6">
                            <div className="border-b border-gray-200 dark:border-gray-700">
                                <nav className="-mb-px flex space-x-8">
                                    <button
                                        onClick={() => setActiveTab('summary')}
                                        className={`${
                                            activeTab === 'summary'
                                                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                                    >
                                        Ringkasan Dampak
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('detail')}
                                        className={`${
                                            activeTab === 'detail'
                                                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                                    >
                                        Detail Per Akun
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('jurnal')}
                                        className={`${
                                            activeTab === 'jurnal'
                                                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                                    >
                                        Daftar Jurnal ({totalJurnalPenyesuaian})
                                    </button>
                                </nav>
                            </div>
                        </div>

                        {/* Tab Content */}
                        {activeTab === 'summary' && (
                            <div className="space-y-6">
                                {/* Dampak Laba Rugi */}
                                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                                    <h3 className="text-xl font-bold mb-4">Dampak ke Laba/Rugi</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pendapatan</p>
                                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                {formatCurrency(dampakPendapatan)}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Beban</p>
                                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                                                {formatCurrency(dampakBeban)}
                                            </p>
                                        </div>
                                        <div className={`p-4 rounded-lg ${dampakLabaRugi >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Net Dampak Laba/Rugi</p>
                                            <p className={`text-2xl font-bold ${dampakLabaRugi >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                {formatCurrency(dampakLabaRugi)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Dampak Neraca */}
                                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                                    <h3 className="text-xl font-bold mb-4">Dampak ke Neraca</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Aset</p>
                                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                {formatCurrency(dampakAset)}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Kewajiban</p>
                                            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                                {formatCurrency(dampakKewajiban)}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Modal</p>
                                            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                                {formatCurrency(dampakModal)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'detail' && (
                            <div className="space-y-6">
                                {/* Aset */}
                                {dampakPerJenisAkun.aset.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-bold mb-3">Dampak ke Aset</h3>
                                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Kode Akun</TableHead>
                                                        <TableHead>Nama Akun</TableHead>
                                                        <TableHead className="text-right">Total Debit</TableHead>
                                                        <TableHead className="text-right">Total Kredit</TableHead>
                                                        <TableHead className="text-right">Net Dampak</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {renderDampakAkun(dampakPerJenisAkun.aset, 'Aset')}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                )}

                                {/* Kewajiban */}
                                {dampakPerJenisAkun.kewajiban.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-bold mb-3">Dampak ke Kewajiban</h3>
                                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Kode Akun</TableHead>
                                                        <TableHead>Nama Akun</TableHead>
                                                        <TableHead className="text-right">Total Debit</TableHead>
                                                        <TableHead className="text-right">Total Kredit</TableHead>
                                                        <TableHead className="text-right">Net Dampak</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {renderDampakAkun(dampakPerJenisAkun.kewajiban, 'Kewajiban')}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                )}

                                {/* Modal */}
                                {dampakPerJenisAkun.modal.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-bold mb-3">Dampak ke Modal</h3>
                                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Kode Akun</TableHead>
                                                        <TableHead>Nama Akun</TableHead>
                                                        <TableHead className="text-right">Total Debit</TableHead>
                                                        <TableHead className="text-right">Total Kredit</TableHead>
                                                        <TableHead className="text-right">Net Dampak</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {renderDampakAkun(dampakPerJenisAkun.modal, 'Modal')}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                )}

                                {/* Pendapatan */}
                                {dampakPerJenisAkun.pendapatan.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-bold mb-3">Dampak ke Pendapatan</h3>
                                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Kode Akun</TableHead>
                                                        <TableHead>Nama Akun</TableHead>
                                                        <TableHead className="text-right">Total Debit</TableHead>
                                                        <TableHead className="text-right">Total Kredit</TableHead>
                                                        <TableHead className="text-right">Net Dampak</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {renderDampakAkun(dampakPerJenisAkun.pendapatan, 'Pendapatan')}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                )}

                                {/* Beban */}
                                {dampakPerJenisAkun.beban.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-bold mb-3">Dampak ke Beban</h3>
                                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Kode Akun</TableHead>
                                                        <TableHead>Nama Akun</TableHead>
                                                        <TableHead className="text-right">Total Debit</TableHead>
                                                        <TableHead className="text-right">Total Kredit</TableHead>
                                                        <TableHead className="text-right">Net Dampak</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {renderDampakAkun(dampakPerJenisAkun.beban, 'Beban')}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'jurnal' && (
                            <div>
                                <h3 className="text-lg font-bold mb-3">Daftar Jurnal Penyesuaian</h3>
                                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                    {jurnalPenyesuaian.length === 0 ? (
                                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                            Tidak ada jurnal penyesuaian dalam periode ini
                                        </div>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Tanggal</TableHead>
                                                    <TableHead>No. Jurnal</TableHead>
                                                    <TableHead>Keterangan</TableHead>
                                                    <TableHead className="text-right">Total Debit</TableHead>
                                                    <TableHead className="text-right">Total Kredit</TableHead>
                                                    <TableHead className="text-center">Aksi</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {jurnalPenyesuaian.map((jurnal) => (
                                                    <TableRow key={jurnal.id}>
                                                        <TableCell>{formatDate(jurnal.tanggal_transaksi)}</TableCell>
                                                        <TableCell className="font-medium">{jurnal.nomor_jurnal}</TableCell>
                                                        <TableCell>{jurnal.keterangan}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(jurnal.total_debit)}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(jurnal.total_kredit)}</TableCell>
                                                        <TableCell className="text-center">
                                                            <Button asChild variant="ghost" size="sm">
                                                                <Link href={route('akuntansi.jurnal-penyesuaian.show', jurnal.id)}>
                                                                    Lihat Detail
                                                                </Link>
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
