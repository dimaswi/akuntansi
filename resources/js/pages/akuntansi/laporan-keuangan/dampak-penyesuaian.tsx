import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from '@inertiajs/react';
import { ArrowLeft, BarChart3, Calendar, ChevronDown, ChevronRight, DollarSign, FileEdit, TrendingDown, TrendingUp } from 'lucide-react';

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
    totalJurnalPenyesuaian,
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
            year: 'numeric',
        });
    };

    const handleFilter = () => {
        router.get(
            route('akuntansi.laporan.dampak-penyesuaian'),
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
                <TableRow className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                    <TableCell onClick={() => toggleAkun(item.akun.id)} className="font-medium">
                        <div className="flex items-center space-x-2">
                            {expandedAkun.has(item.akun.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            <span>{item.akun.kode_akun}</span>
                        </div>
                    </TableCell>
                    <TableCell>{item.akun.nama_akun}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.total_debit)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.total_kredit)}</TableCell>
                    <TableCell className="text-right">
                        <span
                            className={
                                item.net >= 0 ? 'font-semibold text-green-600 dark:text-green-400' : 'font-semibold text-red-600 dark:text-red-400'
                            }
                        >
                            {formatCurrency(item.net)}
                        </span>
                    </TableCell>
                </TableRow>

                {/* Detail Jurnal Expanded */}
                {expandedAkun.has(item.akun.id) && (
                    <TableRow>
                        <TableCell colSpan={5} className="bg-gray-50 dark:bg-gray-900">
                            <div className="p-4">
                                <h4 className="mb-2 text-sm font-semibold">Detail Jurnal Penyesuaian:</h4>
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
                                                <TableCell className="text-right text-sm">{formatCurrency(jurnal.debit)}</TableCell>
                                                <TableCell className="text-right text-sm">{formatCurrency(jurnal.kredit)}</TableCell>
                                                <TableCell className="text-right text-sm">
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
            <div className="p-6 text-gray-900 dark:text-gray-100">
                {/* Period Filter */}
                <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                    <div className='flex items-center gap-2 mb-4'>
                        <div>
                            <Button type="button" variant="outline" onClick={() => window.history.back()} className="gap-2">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </div>
                        <div>
                            <h3 className="flex items-center text-lg font-semibold text-gray-900 dark:text-gray-100">
                                <Calendar className="mr-2 h-5 w-5" />
                                Filter Periode
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Pilih periode untuk menampilkan laporan dampak jurnal penyesuaian.
                            </p>
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

                {/* Summary Cards */}
                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Jurnal Penyesuaian</CardTitle>
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
                            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Dampak Laba/Rugi</CardTitle>
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
                            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Dampak Aset</CardTitle>
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
                            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Dampak Kewajiban + Modal</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <span className={`text-2xl font-bold ${dampakKewajiban + dampakModal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                } border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap`}
                            >
                                Ringkasan Dampak
                            </button>
                            <button
                                onClick={() => setActiveTab('detail')}
                                className={`${
                                    activeTab === 'detail'
                                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                } border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap`}
                            >
                                Detail Per Akun
                            </button>
                            <button
                                onClick={() => setActiveTab('jurnal')}
                                className={`${
                                    activeTab === 'jurnal'
                                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                } border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap`}
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
                        <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
                            <h3 className="mb-4 text-xl font-bold">Dampak ke Laba/Rugi</h3>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                                    <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">Pendapatan</p>
                                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(dampakPendapatan)}</p>
                                </div>
                                <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
                                    <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">Beban</p>
                                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(dampakBeban)}</p>
                                </div>
                                <div
                                    className={`rounded-lg p-4 ${dampakLabaRugi >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}
                                >
                                    <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">Net Dampak Laba/Rugi</p>
                                    <p
                                        className={`text-2xl font-bold ${dampakLabaRugi >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                                    >
                                        {formatCurrency(dampakLabaRugi)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Dampak Neraca */}
                        <div className="rounded-lg border border-gray-200 p-6 dark:border-gray-700">
                            <h3 className="mb-4 text-xl font-bold">Dampak ke Neraca</h3>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                                    <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">Aset</p>
                                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(dampakAset)}</p>
                                </div>
                                <div className="rounded-lg bg-purple-50 p-4 dark:bg-purple-900/20">
                                    <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">Kewajiban</p>
                                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{formatCurrency(dampakKewajiban)}</p>
                                </div>
                                <div className="rounded-lg bg-orange-50 p-4 dark:bg-orange-900/20">
                                    <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">Modal</p>
                                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{formatCurrency(dampakModal)}</p>
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
                                <h3 className="mb-3 text-lg font-bold">Dampak ke Aset</h3>
                                <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
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
                                        <TableBody>{renderDampakAkun(dampakPerJenisAkun.aset, 'Aset')}</TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}

                        {/* Kewajiban */}
                        {dampakPerJenisAkun.kewajiban.length > 0 && (
                            <div>
                                <h3 className="mb-3 text-lg font-bold">Dampak ke Kewajiban</h3>
                                <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
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
                                        <TableBody>{renderDampakAkun(dampakPerJenisAkun.kewajiban, 'Kewajiban')}</TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}

                        {/* Modal */}
                        {dampakPerJenisAkun.modal.length > 0 && (
                            <div>
                                <h3 className="mb-3 text-lg font-bold">Dampak ke Modal</h3>
                                <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
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
                                        <TableBody>{renderDampakAkun(dampakPerJenisAkun.modal, 'Modal')}</TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}

                        {/* Pendapatan */}
                        {dampakPerJenisAkun.pendapatan.length > 0 && (
                            <div>
                                <h3 className="mb-3 text-lg font-bold">Dampak ke Pendapatan</h3>
                                <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
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
                                        <TableBody>{renderDampakAkun(dampakPerJenisAkun.pendapatan, 'Pendapatan')}</TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}

                        {/* Beban */}
                        {dampakPerJenisAkun.beban.length > 0 && (
                            <div>
                                <h3 className="mb-3 text-lg font-bold">Dampak ke Beban</h3>
                                <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
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
                                        <TableBody>{renderDampakAkun(dampakPerJenisAkun.beban, 'Beban')}</TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'jurnal' && (
                    <div>
                        <h3 className="mb-3 text-lg font-bold">Daftar Jurnal Penyesuaian</h3>
                        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                            {jurnalPenyesuaian.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 dark:text-gray-400">Tidak ada jurnal penyesuaian dalam periode ini</div>
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
                                                        <Link href={route('akuntansi.jurnal-penyesuaian.show', jurnal.id)}>Lihat Detail</Link>
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
        </AppLayout>
    );
}
