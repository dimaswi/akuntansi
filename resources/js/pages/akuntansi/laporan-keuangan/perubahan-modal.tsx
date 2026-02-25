import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Activity, ArrowLeft, Calendar, ChevronDown, ChevronRight, TrendingUp } from 'lucide-react';
import { useState } from 'react';

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
    detailModal,
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
            year: 'numeric',
        });
    };

    const handlePeriodeChange = () => {
        router.get(
            route('akuntansi.laporan.perubahan-modal'),
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
        // TODO: Implement export functionality
        console.log('Export perubahan modal');
    };

    return (
        <AppLayout>
            <Head title={`Perubahan Modal - ${formatDate(periode_dari)} s/d ${formatDate(periode_sampai)}`} />
            <div className="p-6 text-gray-900 dark:text-gray-100">
                {/* Filter Periode */}
                <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                    <div className='flex items-center gap-2 mb-4'>
                        <div>
                            <Button type="button" variant="outline" onClick={() => window.history.back()}>
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </div>
                        <div>
                            <h3 className="flex items-center text-lg font-semibold text-gray-900 dark:text-gray-100">
                                <Calendar className="mr-2 h-5 w-5" />
                                Filter Periode
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Pilih periode untuk menampilkan laporan perubahan modal.</p>
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
                            <Button onClick={handlePeriodeChange} className="w-full">
                                <TrendingUp className="mr-2 h-4 w-4" />
                                Generate Laporan
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Laporan Perubahan Modal */}
                <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                    <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 dark:border-gray-700 dark:from-gray-800 dark:to-gray-700">
                        <h3 className="text-base font-bold tracking-wide text-gray-900 uppercase dark:text-gray-100">Laporan Perubahan Modal</h3>
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                            Periode {formatDate(periode_dari)} s/d {formatDate(periode_sampai)}
                        </p>
                    </div>
                    <div className="p-4">
                        <div className="space-y-4">
                            {/* Ringkasan Perubahan Modal - Compact */}
                            <div className="overflow-hidden rounded-lg border border-gray-300 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:border-gray-600 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                                <div className="border-b border-gray-300 bg-gray-200 px-4 py-2 dark:border-gray-600 dark:bg-gray-700">
                                    <h4 className="text-sm font-bold tracking-wider text-gray-900 uppercase dark:text-gray-100">
                                        Ringkasan Perubahan Modal
                                    </h4>
                                </div>
                                <div className="p-3">
                                    <table className="w-full text-sm">
                                        <tbody>
                                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                                <td className="py-2 font-medium text-gray-700 dark:text-gray-300">Saldo Awal Modal</td>
                                                <td className="py-2 text-right">
                                                    <span
                                                        className={`font-mono font-semibold ${saldoAwalModal >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                                                    >
                                                        {formatCurrency(saldoAwalModal)}
                                                    </span>
                                                </td>
                                            </tr>
                                            {/* Laba Ditahan - Always show */}
                                            <tr
                                                className={`border-b border-gray-200 bg-blue-50/30 transition-colors dark:border-gray-700 dark:bg-blue-900/10 ${
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
                                                        {detailLabaDitahanPerBulan &&
                                                            detailLabaDitahanPerBulan.length > 0 &&
                                                            (expandedLabaDitahan ? (
                                                                <ChevronDown className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                            ) : (
                                                                <ChevronRight className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                            ))}
                                                        <Activity className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                        <span className="font-medium">Laba Ditahan (Akumulasi s/d Periode Lalu)</span>
                                                        {detailLabaDitahanPerBulan && detailLabaDitahanPerBulan.length > 0 ? (
                                                            <Badge variant="outline" className="ml-2 h-5 text-[10px]">
                                                                {detailLabaDitahanPerBulan.length} bulan
                                                            </Badge>
                                                        ) : (
                                                            <span className="ml-2 text-xs text-gray-500 italic dark:text-gray-400">
                                                                (tidak ada transaksi periode sebelumnya)
                                                            </span>
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="py-2 text-right">
                                                    <span
                                                        className={`font-mono font-semibold ${labaDitahan >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                                                    >
                                                        {labaDitahan >= 0 ? '+' : ''}
                                                        {formatCurrency(labaDitahan)}
                                                    </span>
                                                </td>
                                            </tr>
                                            {expandedLabaDitahan && detailLabaDitahanPerBulan && detailLabaDitahanPerBulan.length > 0 && (
                                                <tr>
                                                    <td colSpan={2} className="p-0">
                                                        <div className="border-l-4 border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3 dark:border-blue-600 dark:from-blue-900/20 dark:to-blue-800/20">
                                                            <div className="mb-2">
                                                                <span className="text-xs font-semibold tracking-wider text-blue-700 uppercase dark:text-blue-300">
                                                                    Detail Per Bulan
                                                                </span>
                                                            </div>
                                                            <div className="overflow-x-auto">
                                                                <table className="w-full text-xs">
                                                                    <thead>
                                                                        <tr className="border-b border-blue-300 dark:border-blue-700">
                                                                            <th className="px-2 py-2 text-left font-semibold text-blue-700 dark:text-blue-300">
                                                                                Periode
                                                                            </th>
                                                                            <th className="px-2 py-2 text-right font-semibold text-blue-700 dark:text-blue-300">
                                                                                Laba/Rugi Bulan Ini
                                                                            </th>
                                                                            <th className="px-2 py-2 text-right font-semibold text-blue-700 dark:text-blue-300">
                                                                                Akumulasi
                                                                            </th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {detailLabaDitahanPerBulan.map((detail, idx) => (
                                                                            <tr
                                                                                key={idx}
                                                                                className={`border-b border-blue-200 transition-colors hover:bg-blue-200/50 dark:border-blue-800/50 dark:hover:bg-blue-700/30 ${
                                                                                    idx % 2 === 0 ? 'bg-white/30 dark:bg-black/10' : ''
                                                                                }`}
                                                                            >
                                                                                <td className="px-2 py-2 font-medium text-gray-700 dark:text-gray-300">
                                                                                    {detail.bulan}
                                                                                </td>
                                                                                <td
                                                                                    className={`px-2 py-2 text-right font-mono font-semibold ${
                                                                                        detail.laba_rugi >= 0
                                                                                            ? 'text-green-600 dark:text-green-400'
                                                                                            : 'text-red-600 dark:text-red-400'
                                                                                    }`}
                                                                                >
                                                                                    {detail.laba_rugi >= 0 ? '+' : ''}
                                                                                    {formatCurrency(detail.laba_rugi)}
                                                                                </td>
                                                                                <td
                                                                                    className={`px-2 py-2 text-right font-mono font-bold ${
                                                                                        detail.saldo_akumulasi >= 0
                                                                                            ? 'text-green-600 dark:text-green-400'
                                                                                            : 'text-red-600 dark:text-red-400'
                                                                                    }`}
                                                                                >
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
                                                                <TrendingUp className="mr-2 h-4 w-4 text-green-600 dark:text-green-400" />
                                                                <span className="font-medium">Laba Periode Berjalan</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <TrendingUp className="mr-2 h-4 w-4 rotate-180 text-red-600 dark:text-red-400" />
                                                                <span className="font-medium">Rugi Periode Berjalan</span>
                                                            </>
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="py-2 text-right">
                                                    <span
                                                        className={`font-mono font-semibold ${labaRugiPeriode >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                                                    >
                                                        {labaRugiPeriode >= 0 ? '+' : ''}
                                                        {formatCurrency(labaRugiPeriode)}
                                                    </span>
                                                </td>
                                            </tr>
                                            {tambahanInvestasi !== 0 && (
                                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                                    <td className="py-2 font-medium text-gray-700 dark:text-gray-300">Tambahan Investasi</td>
                                                    <td className="py-2 text-right">
                                                        <span className="font-mono font-semibold text-green-600 dark:text-green-400">
                                                            +{formatCurrency(tambahanInvestasi)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            )}
                                            {penarikan !== 0 && (
                                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                                    <td className="py-2 font-medium text-gray-700 dark:text-gray-300">Penarikan/Dividen</td>
                                                    <td className="py-2 text-right">
                                                        <span className="font-mono font-semibold text-red-600 dark:text-red-400">
                                                            -{formatCurrency(penarikan)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            )}
                                            <tr className="border-t-2 border-gray-400 bg-gray-100 dark:border-gray-500 dark:bg-gray-800/50">
                                                <td className="py-3 font-bold text-gray-900 dark:text-gray-100">Saldo Akhir Modal</td>
                                                <td className="py-3 text-right">
                                                    <span
                                                        className={`font-mono text-base font-bold ${saldoAkhirModal >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                                                    >
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
                                <div className="overflow-hidden rounded-lg border border-gray-300 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:border-gray-600 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                                    <div className="border-b border-gray-300 bg-gray-200 px-4 py-2 dark:border-gray-600 dark:bg-gray-700">
                                        <h4 className="text-sm font-bold tracking-wider text-gray-900 uppercase dark:text-gray-100">
                                            Detail Per Akun Modal
                                        </h4>
                                    </div>
                                    <div className="p-3">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs">
                                                <thead>
                                                    <tr className="border-b-2 border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800">
                                                        <th className="px-2 py-2 text-left font-bold text-gray-700 dark:text-gray-300">Kode</th>
                                                        <th className="px-2 py-2 text-left font-bold text-gray-700 dark:text-gray-300">Nama Akun</th>
                                                        <th className="px-2 py-2 text-right font-bold text-gray-700 dark:text-gray-300">
                                                            Saldo Awal
                                                        </th>
                                                        <th className="px-2 py-2 text-right font-bold text-gray-700 dark:text-gray-300">Mutasi</th>
                                                        <th className="px-2 py-2 text-right font-bold text-gray-700 dark:text-gray-300">
                                                            Saldo Akhir
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {detailModal.map((detail, idx) => (
                                                        <tr
                                                            key={idx}
                                                            className={`border-b border-gray-200 transition-colors hover:bg-gray-200/50 dark:border-gray-700/50 dark:hover:bg-gray-700/50 ${
                                                                idx % 2 === 0 ? 'bg-white/50 dark:bg-black/10' : ''
                                                            }`}
                                                        >
                                                            <td className="px-2 py-2 font-mono font-semibold text-gray-700 dark:text-gray-300">
                                                                {detail.akun.kode_akun}
                                                            </td>
                                                            <td className="px-2 py-2 text-gray-700 dark:text-gray-300">{detail.akun.nama_akun}</td>
                                                            <td
                                                                className={`px-2 py-2 text-right font-mono font-semibold ${
                                                                    detail.saldo_awal >= 0
                                                                        ? 'text-green-600 dark:text-green-400'
                                                                        : 'text-red-600 dark:text-red-400'
                                                                }`}
                                                            >
                                                                {formatCurrency(detail.saldo_awal)}
                                                            </td>
                                                            <td
                                                                className={`px-2 py-2 text-right font-mono font-semibold ${
                                                                    detail.mutasi >= 0
                                                                        ? 'text-green-600 dark:text-green-400'
                                                                        : 'text-red-600 dark:text-red-400'
                                                                }`}
                                                            >
                                                                {detail.mutasi >= 0 ? '+' : ''}
                                                                {formatCurrency(detail.mutasi)}
                                                            </td>
                                                            <td
                                                                className={`px-2 py-2 text-right font-mono font-bold ${
                                                                    detail.saldo_akhir >= 0
                                                                        ? 'text-green-600 dark:text-green-400'
                                                                        : 'text-red-600 dark:text-red-400'
                                                                }`}
                                                            >
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
                            <div className="rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 p-3 dark:border-blue-800 dark:from-blue-900/20 dark:to-blue-800/20">
                                <div className="flex items-start space-x-2">
                                    <Activity className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                                    <div className="text-xs text-gray-700 dark:text-gray-300">
                                        <span className="font-semibold text-blue-700 dark:text-blue-300">Formula:</span>
                                        <div className="mt-1 space-y-1 font-mono text-xs">
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
        </AppLayout>
    );
}
