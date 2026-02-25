import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Activity, ArrowLeft, Calendar, DollarSign, Info } from 'lucide-react';
import { useState } from 'react';

interface Props {
    tanggal: string;
    totalAsetLancar: number;
    totalKewajibanLancar: number;
    totalKas: number;
    totalPersediaan: number;
    totalAset: number;
    totalKewajiban: number;
    totalEkuitas: number;
    modalKerja: number;
    currentRatio: number;
    quickRatio: number;
    cashRatio: number;
    debtToAssetRatio: number;
    debtToEquityRatio: number;
}

export default function AnalisisRasio({
    tanggal,
    totalAsetLancar,
    totalKewajibanLancar,
    totalKas,
    totalPersediaan,
    totalAset,
    totalKewajiban,
    totalEkuitas,
    modalKerja,
    currentRatio,
    quickRatio,
    cashRatio,
    debtToAssetRatio,
    debtToEquityRatio,
}: Props) {
    const [selectedDate, setSelectedDate] = useState(tanggal);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatRatio = (ratio: number) => {
        return ratio.toFixed(2);
    };

    const formatPercent = (ratio: number) => {
        return (ratio * 100).toFixed(2) + '%';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const handleDateChange = () => {
        router.get(
            route('akuntansi.laporan.analisis-rasio'),
            {
                tanggal: selectedDate,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleExport = () => {
        console.log('Export analisis rasio');
    };

    const getRatioStatus = (ratio: number, type: 'current' | 'quick' | 'cash') => {
        if (type === 'current') {
            if (ratio >= 2) return { status: 'Sangat Baik', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' };
            if (ratio >= 1) return { status: 'Baik', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' };
            return { status: 'Perlu Perhatian', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' };
        }
        if (type === 'quick') {
            if (ratio >= 1) return { status: 'Baik', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' };
            if (ratio >= 0.5) return { status: 'Cukup', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' };
            return { status: 'Kurang', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' };
        }
        if (type === 'cash') {
            if (ratio >= 0.5) return { status: 'Baik', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' };
            if (ratio >= 0.2) return { status: 'Cukup', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' };
            return { status: 'Kurang', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' };
        }
        return { status: '-', color: 'text-gray-600', bg: 'bg-gray-50' };
    };

    const currentStatus = getRatioStatus(currentRatio, 'current');
    const quickStatus = getRatioStatus(quickRatio, 'quick');
    const cashStatus = getRatioStatus(cashRatio, 'cash');

    return (
        <AppLayout>
            <Head title={`Analisis Rasio Keuangan - ${formatDate(tanggal)}`} />

            <div className="p-6 text-gray-900 dark:text-gray-100">
                {/* Filter Tanggal */}
                <div className="mb-6 rounded-lg border border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 p-4 dark:border-gray-700 dark:from-gray-800 dark:to-gray-700">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <Button type="button" variant="outline" onClick={() => window.history.back()} className="gap-2">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Analisis Rasio Keuangan</h2>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Per {formatDate(tanggal)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            <div>
                                <Label htmlFor="tanggal" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    Pilih Tanggal
                                </Label>
                                <Input
                                    id="tanggal"
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="mt-1 w-40"
                                />
                            </div>
                            <Button onClick={handleDateChange} className="mt-5">
                                Tampilkan
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Rasio Likuiditas */}
                    <div className="overflow-hidden rounded-lg border border-blue-300 bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50 dark:border-blue-700 dark:from-blue-900/20 dark:via-blue-800/20 dark:to-blue-900/20">
                        <div className="border-b border-blue-300 bg-blue-200 px-4 py-3 dark:border-blue-700 dark:bg-blue-800">
                            <h3 className="flex items-center text-base font-bold tracking-wide text-blue-900 uppercase dark:text-blue-100">
                                <DollarSign className="mr-2 h-5 w-5" />
                                Rasio Likuiditas
                            </h3>
                            <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">Kemampuan perusahaan membayar kewajiban jangka pendek</p>
                        </div>
                        <div className="p-4">
                            {/* Data Dasar */}
                            <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                                <div className="rounded-lg border border-blue-200 bg-white p-3 dark:border-blue-800 dark:bg-gray-800">
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Aset Lancar</p>
                                    <p className="font-mono text-sm font-bold text-gray-900 dark:text-gray-100">{formatCurrency(totalAsetLancar)}</p>
                                </div>
                                <div className="rounded-lg border border-blue-200 bg-white p-3 dark:border-blue-800 dark:bg-gray-800">
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Kewajiban Lancar</p>
                                    <p className="font-mono text-sm font-bold text-gray-900 dark:text-gray-100">
                                        {formatCurrency(totalKewajibanLancar)}
                                    </p>
                                </div>
                                <div className="rounded-lg border border-blue-200 bg-white p-3 dark:border-blue-800 dark:bg-gray-800">
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Modal Kerja</p>
                                    <p
                                        className={`font-mono text-sm font-bold ${modalKerja >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                                    >
                                        {formatCurrency(modalKerja)}
                                    </p>
                                </div>
                            </div>

                            {/* Rasio Cards */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                {/* Current Ratio */}
                                <div className={`rounded-lg border-2 p-4 ${currentStatus.bg} border-current`}>
                                    <div className="mb-2 flex items-center justify-between">
                                        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">Current Ratio</h4>
                                        <Badge className={currentStatus.color}>{currentStatus.status}</Badge>
                                    </div>
                                    <p className={`font-mono text-3xl font-bold ${currentStatus.color}`}>{formatRatio(currentRatio)}</p>
                                    <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">Aset Lancar / Kewajiban Lancar</p>
                                    <div className="mt-3 text-xs text-gray-700 dark:text-gray-300">
                                        <p>• ≥ 2.0 = Sangat Baik</p>
                                        <p>• 1.0-2.0 = Baik</p>
                                        <p>• &lt; 1.0 = Perlu Perhatian</p>
                                    </div>
                                </div>

                                {/* Quick Ratio */}
                                <div className={`rounded-lg border-2 p-4 ${quickStatus.bg} border-current`}>
                                    <div className="mb-2 flex items-center justify-between">
                                        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">Quick Ratio</h4>
                                        <Badge className={quickStatus.color}>{quickStatus.status}</Badge>
                                    </div>
                                    <p className={`font-mono text-3xl font-bold ${quickStatus.color}`}>{formatRatio(quickRatio)}</p>
                                    <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">(Aset Lancar - Persediaan) / Kewajiban Lancar</p>
                                    <div className="mt-3 text-xs text-gray-700 dark:text-gray-300">
                                        <p>• ≥ 1.0 = Baik</p>
                                        <p>• 0.5-1.0 = Cukup</p>
                                        <p>• &lt; 0.5 = Kurang</p>
                                    </div>
                                </div>

                                {/* Cash Ratio */}
                                <div className={`rounded-lg border-2 p-4 ${cashStatus.bg} border-current`}>
                                    <div className="mb-2 flex items-center justify-between">
                                        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">Cash Ratio</h4>
                                        <Badge className={cashStatus.color}>{cashStatus.status}</Badge>
                                    </div>
                                    <p className={`font-mono text-3xl font-bold ${cashStatus.color}`}>{formatRatio(cashRatio)}</p>
                                    <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">Kas / Kewajiban Lancar</p>
                                    <div className="mt-3 text-xs text-gray-700 dark:text-gray-300">
                                        <p>• ≥ 0.5 = Baik</p>
                                        <p>• 0.2-0.5 = Cukup</p>
                                        <p>• &lt; 0.2 = Kurang</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Rasio Solvabilitas */}
                    <div className="overflow-hidden rounded-lg border border-purple-300 bg-gradient-to-br from-purple-50 via-purple-100 to-purple-50 dark:border-purple-700 dark:from-purple-900/20 dark:via-purple-800/20 dark:to-purple-900/20">
                        <div className="border-b border-purple-300 bg-purple-200 px-4 py-3 dark:border-purple-700 dark:bg-purple-800">
                            <h3 className="flex items-center text-base font-bold tracking-wide text-purple-900 uppercase dark:text-purple-100">
                                <Activity className="mr-2 h-5 w-5" />
                                Rasio Solvabilitas
                            </h3>
                            <p className="mt-1 text-xs text-purple-700 dark:text-purple-300">Kemampuan perusahaan membayar semua kewajiban</p>
                        </div>
                        <div className="p-4">
                            {/* Data Dasar */}
                            <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                                <div className="rounded-lg border border-purple-200 bg-white p-3 dark:border-purple-800 dark:bg-gray-800">
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Total Aset</p>
                                    <p className="font-mono text-sm font-bold text-gray-900 dark:text-gray-100">{formatCurrency(totalAset)}</p>
                                </div>
                                <div className="rounded-lg border border-purple-200 bg-white p-3 dark:border-purple-800 dark:bg-gray-800">
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Total Kewajiban</p>
                                    <p className="font-mono text-sm font-bold text-gray-900 dark:text-gray-100">{formatCurrency(totalKewajiban)}</p>
                                </div>
                                <div className="rounded-lg border border-purple-200 bg-white p-3 dark:border-purple-800 dark:bg-gray-800">
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Total Ekuitas</p>
                                    <p className="font-mono text-sm font-bold text-gray-900 dark:text-gray-100">{formatCurrency(totalEkuitas)}</p>
                                </div>
                            </div>

                            {/* Rasio Cards */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {/* Debt to Asset Ratio */}
                                <div className="rounded-lg border-2 border-purple-200 bg-white p-4 dark:border-purple-800 dark:bg-gray-800">
                                    <h4 className="mb-2 text-sm font-bold text-gray-900 dark:text-gray-100">Debt to Asset Ratio</h4>
                                    <p className="font-mono text-3xl font-bold text-purple-600 dark:text-purple-400">
                                        {formatPercent(debtToAssetRatio)}
                                    </p>
                                    <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">Total Kewajiban / Total Aset</p>
                                    <div className="mt-3 text-xs text-gray-700 dark:text-gray-300">
                                        <p>Menunjukkan proporsi aset yang dibiayai hutang</p>
                                        <p className="mt-1">• &lt; 50% = Baik</p>
                                        <p>• 50-70% = Cukup</p>
                                        <p>• &gt; 70% = Tinggi</p>
                                    </div>
                                </div>

                                {/* Debt to Equity Ratio */}
                                <div className="rounded-lg border-2 border-purple-200 bg-white p-4 dark:border-purple-800 dark:bg-gray-800">
                                    <h4 className="mb-2 text-sm font-bold text-gray-900 dark:text-gray-100">Debt to Equity Ratio</h4>
                                    <p className="font-mono text-3xl font-bold text-purple-600 dark:text-purple-400">
                                        {formatPercent(debtToEquityRatio)}
                                    </p>
                                    <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">Total Kewajiban / Total Ekuitas</p>
                                    <div className="mt-3 text-xs text-gray-700 dark:text-gray-300">
                                        <p>Perbandingan hutang dengan modal sendiri</p>
                                        <p className="mt-1">• &lt; 100% = Baik</p>
                                        <p>• 100-200% = Cukup</p>
                                        <p>• &gt; 200% = Tinggi</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Info */}
                    <Alert className="border-gray-300 bg-gradient-to-r from-gray-50 to-gray-100 dark:border-gray-600 dark:from-gray-800 dark:to-gray-700">
                        <Info className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                            <strong>Catatan:</strong> Analisis rasio keuangan memberikan gambaran kondisi keuangan perusahaan. Interpretasi rasio
                            harus mempertimbangkan industri dan kondisi spesifik perusahaan. Konsultasikan dengan akuntan profesional untuk analisis
                            mendalam.
                        </AlertDescription>
                    </Alert>
                </div>
            </div>
        </AppLayout>
    );
}
