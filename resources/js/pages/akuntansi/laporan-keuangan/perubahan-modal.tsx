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
    TrendingUp,
    Activity,
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

interface DetailModal {
    akun: Akun;
    saldo_awal: number;
    mutasi: number;
    saldo_akhir: number;
}

interface DetailLabaDitahan {
    bulan: string;
    tahun: number;
    bulan_num: number;
    periode_dari: string;
    periode_sampai: string;
    laba_rugi: number;
    saldo_akumulasi: number;
}

interface Props {
    periode_dari: string;
    periode_sampai: string;
    saldoAwalModal: number;
    labaDitahan: number;
    detailLabaDitahanPerBulan: DetailLabaDitahan[];
    labaRugiPeriode: number;
    tambahanInvestasi: number;
    penarikan: number;
    saldoAkhirModal: number;
    detailModal: DetailModal[];
}

export default function PerubahanModal({ 
    periode_dari,
    periode_sampai,
    saldoAwalModal,
    labaDitahan,
    detailLabaDitahanPerBulan,
    labaRugiPeriode,
    tambahanInvestasi,
    penarikan,
    saldoAkhirModal,
    detailModal
}: Props) {
    const [periodeDari, setPeriodeDari] = useState(periode_dari);
    const [periodeSampai, setPeriodeSampai] = useState(periode_sampai);
    const [expandedLabaDitahan, setExpandedLabaDitahan] = useState(false);

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
        router.get(route('akuntansi.laporan.perubahan-modal'), { 
            periode_dari: periodeDari,
            periode_sampai: periodeSampai
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleExport = () => {
        // TODO: Implement export functionality
        console.log('Export perubahan modal');
    };

    return (
        <AppLayout>
            <Head title={`Perubahan Modal - ${formatDate(periode_dari)} s/d ${formatDate(periode_sampai)}`} />
            
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
                                        <h1 className="text-2xl font-bold">Laporan Perubahan Modal</h1>
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
                                    <Button onClick={handlePeriodeChange} className="w-full">
                                        <TrendingUp className="h-4 w-4 mr-2" />
                                        Generate Laporan
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Laporan Perubahan Modal */}
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
                                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide">Laporan Perubahan Modal</h3>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Periode {formatDate(periode_dari)} s/d {formatDate(periode_sampai)}</p>
                            </div>
                            <div className="p-4">
                                <div className="space-y-4">
                                    {/* Ringkasan Perubahan Modal - Compact */}
                                    <div className="bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
                                        <div className="px-4 py-2 bg-gray-200 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
                                            <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 uppercase tracking-wider">Ringkasan Perubahan Modal</h4>
                                        </div>
                                        <div className="p-3">
                                            <table className="w-full text-sm">
                                                <tbody>
                                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                                        <td className="py-2 text-gray-700 dark:text-gray-300 font-medium">Saldo Awal Modal</td>
                                                        <td className="py-2 text-right">
                                                            <span className={`font-mono font-semibold ${saldoAwalModal >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                                {formatCurrency(saldoAwalModal)}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                    {/* Laba Ditahan - Always show */}
                                                    <tr 
                                                        className={`border-b border-gray-200 dark:border-gray-700 bg-blue-50/30 dark:bg-blue-900/10 transition-colors ${
                                                            detailLabaDitahanPerBulan && detailLabaDitahanPerBulan.length > 0 
                                                                ? 'cursor-pointer hover:bg-blue-100/50 dark:hover:bg-blue-900/20' 
                                                                : ''
                                                        }`}
                                                        onClick={() => {
                                                            if (detailLabaDitahanPerBulan && detailLabaDitahanPerBulan.length > 0) {
                                                                setExpandedLabaDitahan(!expandedLabaDitahan);
                                                            }
                                                        }}
                                                    >
                                                        <td className="py-2 text-gray-700 dark:text-gray-300">
                                                            <span className="flex items-center">
                                                                {detailLabaDitahanPerBulan && detailLabaDitahanPerBulan.length > 0 && (
                                                                    expandedLabaDitahan ? (
                                                                        <ChevronDown className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                                                                    ) : (
                                                                        <ChevronRight className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                                                                    )
                                                                )}
                                                                <Activity className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                                                                <span className="font-medium">Laba Ditahan (Akumulasi s/d Periode Lalu)</span>
                                                                {detailLabaDitahanPerBulan && detailLabaDitahanPerBulan.length > 0 ? (
                                                                    <Badge variant="outline" className="ml-2 text-[10px] h-5">
                                                                        {detailLabaDitahanPerBulan.length} bulan
                                                                    </Badge>
                                                                ) : (
                                                                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 italic">
                                                                        (tidak ada transaksi periode sebelumnya)
                                                                    </span>
                                                                )}
                                                            </span>
                                                        </td>
                                                        <td className="py-2 text-right">
                                                            <span className={`font-mono font-semibold ${labaDitahan >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                                {labaDitahan >= 0 ? '+' : ''}{formatCurrency(labaDitahan)}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                    {expandedLabaDitahan && detailLabaDitahanPerBulan && detailLabaDitahanPerBulan.length > 0 && (
                                                        <tr>
                                                            <td colSpan={2} className="p-0">
                                                                <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-l-4 border-blue-500 dark:border-blue-600 px-4 py-3">
                                                                    <div className="mb-2">
                                                                        <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">Detail Per Bulan</span>
                                                                    </div>
                                                                    <div className="overflow-x-auto">
                                                                        <table className="w-full text-xs">
                                                                            <thead>
                                                                                <tr className="border-b border-blue-300 dark:border-blue-700">
                                                                                    <th className="text-left py-2 px-2 font-semibold text-blue-700 dark:text-blue-300">Periode</th>
                                                                                    <th className="text-right py-2 px-2 font-semibold text-blue-700 dark:text-blue-300">Laba/Rugi Bulan Ini</th>
                                                                                    <th className="text-right py-2 px-2 font-semibold text-blue-700 dark:text-blue-300">Akumulasi</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {detailLabaDitahanPerBulan.map((detail, idx) => (
                                                                                    <tr 
                                                                                        key={idx}
                                                                                        className={`border-b border-blue-200 dark:border-blue-800/50 hover:bg-blue-200/50 dark:hover:bg-blue-700/30 transition-colors ${
                                                                                            idx % 2 === 0 ? 'bg-white/30 dark:bg-black/10' : ''
                                                                                        }`}
                                                                                    >
                                                                                        <td className="py-2 px-2 text-gray-700 dark:text-gray-300 font-medium">
                                                                                            {detail.bulan}
                                                                                        </td>
                                                                                        <td className={`py-2 px-2 text-right font-mono font-semibold ${
                                                                                            detail.laba_rugi >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                                                                        }`}>
                                                                                            {detail.laba_rugi >= 0 ? '+' : ''}{formatCurrency(detail.laba_rugi)}
                                                                                        </td>
                                                                                        <td className={`py-2 px-2 text-right font-mono font-bold ${
                                                                                            detail.saldo_akumulasi >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                                                                        }`}>
                                                                                            {formatCurrency(detail.saldo_akumulasi)}
                                                                                        </td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                                        <td className="py-2 text-gray-700 dark:text-gray-300">
                                                            <span className="flex items-center">
                                                                {labaRugiPeriode >= 0 ? (
                                                                    <>
                                                                        <TrendingUp className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                                                                        <span className="font-medium">Laba Periode Berjalan</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <TrendingUp className="h-4 w-4 mr-2 text-red-600 dark:text-red-400 rotate-180" />
                                                                        <span className="font-medium">Rugi Periode Berjalan</span>
                                                                    </>
                                                                )}
                                                            </span>
                                                        </td>
                                                        <td className="py-2 text-right">
                                                            <span className={`font-mono font-semibold ${labaRugiPeriode >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                                {labaRugiPeriode >= 0 ? '+' : ''}{formatCurrency(labaRugiPeriode)}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                    {tambahanInvestasi !== 0 && (
                                                        <tr className="border-b border-gray-200 dark:border-gray-700">
                                                            <td className="py-2 text-gray-700 dark:text-gray-300 font-medium">Tambahan Investasi</td>
                                                            <td className="py-2 text-right">
                                                                <span className="font-mono font-semibold text-green-600 dark:text-green-400">
                                                                    +{formatCurrency(tambahanInvestasi)}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    )}
                                                    {penarikan !== 0 && (
                                                        <tr className="border-b border-gray-200 dark:border-gray-700">
                                                            <td className="py-2 text-gray-700 dark:text-gray-300 font-medium">Penarikan/Dividen</td>
                                                            <td className="py-2 text-right">
                                                                <span className="font-mono font-semibold text-red-600 dark:text-red-400">
                                                                    -{formatCurrency(penarikan)}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    )}
                                                    <tr className="border-t-2 border-gray-400 dark:border-gray-500 bg-gray-100 dark:bg-gray-800/50">
                                                        <td className="py-3 font-bold text-gray-900 dark:text-gray-100">Saldo Akhir Modal</td>
                                                        <td className="py-3 text-right">
                                                            <span className={`font-mono font-bold text-base ${saldoAkhirModal >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                                {formatCurrency(saldoAkhirModal)}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Detail Per Akun Modal - Compact */}
                                    {detailModal && detailModal.length > 0 && (
                                        <div className="bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
                                            <div className="px-4 py-2 bg-gray-200 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
                                                <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 uppercase tracking-wider">Detail Per Akun Modal</h4>
                                            </div>
                                            <div className="p-3">
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-xs">
                                                        <thead>
                                                            <tr className="border-b-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800">
                                                                <th className="text-left py-2 px-2 font-bold text-gray-700 dark:text-gray-300">Kode</th>
                                                                <th className="text-left py-2 px-2 font-bold text-gray-700 dark:text-gray-300">Nama Akun</th>
                                                                <th className="text-right py-2 px-2 font-bold text-gray-700 dark:text-gray-300">Saldo Awal</th>
                                                                <th className="text-right py-2 px-2 font-bold text-gray-700 dark:text-gray-300">Mutasi</th>
                                                                <th className="text-right py-2 px-2 font-bold text-gray-700 dark:text-gray-300">Saldo Akhir</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {detailModal.map((detail, idx) => (
                                                                <tr 
                                                                    key={idx}
                                                                    className={`border-b border-gray-200 dark:border-gray-700/50 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors ${
                                                                        idx % 2 === 0 ? 'bg-white/50 dark:bg-black/10' : ''
                                                                    }`}
                                                                >
                                                                    <td className="py-2 px-2 font-mono font-semibold text-gray-700 dark:text-gray-300">
                                                                        {detail.akun.kode_akun}
                                                                    </td>
                                                                    <td className="py-2 px-2 text-gray-700 dark:text-gray-300">
                                                                        {detail.akun.nama_akun}
                                                                    </td>
                                                                    <td className={`py-2 px-2 text-right font-mono font-semibold ${
                                                                        detail.saldo_awal >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                                                    }`}>
                                                                        {formatCurrency(detail.saldo_awal)}
                                                                    </td>
                                                                    <td className={`py-2 px-2 text-right font-mono font-semibold ${
                                                                        detail.mutasi >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                                                    }`}>
                                                                        {detail.mutasi >= 0 ? '+' : ''}{formatCurrency(detail.mutasi)}
                                                                    </td>
                                                                    <td className={`py-2 px-2 text-right font-mono font-bold ${
                                                                        detail.saldo_akhir >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                                                    }`}>
                                                                        {formatCurrency(detail.saldo_akhir)}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Formula Perhitungan - Compact Info Box */}
                                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                                        <div className="flex items-start space-x-2">
                                            <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                            <div className="text-xs text-gray-700 dark:text-gray-300">
                                                <span className="font-semibold text-blue-700 dark:text-blue-300">Formula:</span>
                                                <div className="mt-1 font-mono text-xs space-y-1">
                                                    <div>Modal Akhir = Modal Awal + Laba Ditahan + Laba/Rugi Periode + Investasi - Penarikan</div>
                                                    <div className="text-[10px] text-gray-600 dark:text-gray-400">
                                                        * Laba Ditahan = Akumulasi laba/rugi dari awal perusahaan sampai periode sebelumnya
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}