import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
    ArrowLeft, 
    Download, 
    Calendar,
    PieChart,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Activity,
    Info
} from 'lucide-react';
import { Link } from '@inertiajs/react';

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
    debtToEquityRatio
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
            year: 'numeric'
        });
    };

    const handleDateChange = () => {
        router.get(route('akuntansi.laporan.analisis-rasio'), { 
            tanggal: selectedDate
        }, {
            preserveState: true,
            preserveScroll: true,
        });
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
                                        <PieChart className="h-6 w-6 text-pink-600" />
                                        <h1 className="text-2xl font-bold">Analisis Rasio Keuangan</h1>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        Per Tanggal: {formatDate(tanggal)}
                                    </p>
                                </div>
                            </div>
                            
                            <Button onClick={handleExport} className="mt-4 sm:mt-0">
                                <Download className="h-4 w-4 mr-2" />
                                Export
                            </Button>
                        </div>

                        {/* Filter Tanggal */}
                        <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
                            <div className="flex items-center space-x-4">
                                <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                <div className="flex-1">
                                    <Label htmlFor="tanggal" className="text-xs font-semibold">Pilih Tanggal</Label>
                                    <Input
                                        id="tanggal"
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                                <Button onClick={handleDateChange} className="mt-5">
                                    Tampilkan
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Rasio Likuiditas */}
                            <div className="bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50 dark:from-blue-900/20 dark:via-blue-800/20 dark:to-blue-900/20 rounded-lg border border-blue-300 dark:border-blue-700 overflow-hidden">
                                <div className="px-4 py-3 bg-blue-200 dark:bg-blue-800 border-b border-blue-300 dark:border-blue-700">
                                    <h3 className="font-bold text-base text-blue-900 dark:text-blue-100 uppercase tracking-wide flex items-center">
                                        <DollarSign className="h-5 w-5 mr-2" />
                                        Rasio Likuiditas
                                    </h3>
                                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">Kemampuan perusahaan membayar kewajiban jangka pendek</p>
                                </div>
                                <div className="p-4">
                                    {/* Data Dasar */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                                            <p className="text-xs text-gray-600 dark:text-gray-400">Aset Lancar</p>
                                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 font-mono">{formatCurrency(totalAsetLancar)}</p>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                                            <p className="text-xs text-gray-600 dark:text-gray-400">Kewajiban Lancar</p>
                                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 font-mono">{formatCurrency(totalKewajibanLancar)}</p>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                                            <p className="text-xs text-gray-600 dark:text-gray-400">Modal Kerja</p>
                                            <p className={`text-sm font-bold font-mono ${modalKerja >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                {formatCurrency(modalKerja)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Rasio Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* Current Ratio */}
                                        <div className={`rounded-lg p-4 border-2 ${currentStatus.bg} border-current`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">Current Ratio</h4>
                                                <Badge className={currentStatus.color}>{currentStatus.status}</Badge>
                                            </div>
                                            <p className={`text-3xl font-bold font-mono ${currentStatus.color}`}>{formatRatio(currentRatio)}</p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                                                Aset Lancar / Kewajiban Lancar
                                            </p>
                                            <div className="mt-3 text-xs text-gray-700 dark:text-gray-300">
                                                <p>• ≥ 2.0 = Sangat Baik</p>
                                                <p>• 1.0-2.0 = Baik</p>
                                                <p>• &lt; 1.0 = Perlu Perhatian</p>
                                            </div>
                                        </div>

                                        {/* Quick Ratio */}
                                        <div className={`rounded-lg p-4 border-2 ${quickStatus.bg} border-current`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">Quick Ratio</h4>
                                                <Badge className={quickStatus.color}>{quickStatus.status}</Badge>
                                            </div>
                                            <p className={`text-3xl font-bold font-mono ${quickStatus.color}`}>{formatRatio(quickRatio)}</p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                                                (Aset Lancar - Persediaan) / Kewajiban Lancar
                                            </p>
                                            <div className="mt-3 text-xs text-gray-700 dark:text-gray-300">
                                                <p>• ≥ 1.0 = Baik</p>
                                                <p>• 0.5-1.0 = Cukup</p>
                                                <p>• &lt; 0.5 = Kurang</p>
                                            </div>
                                        </div>

                                        {/* Cash Ratio */}
                                        <div className={`rounded-lg p-4 border-2 ${cashStatus.bg} border-current`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">Cash Ratio</h4>
                                                <Badge className={cashStatus.color}>{cashStatus.status}</Badge>
                                            </div>
                                            <p className={`text-3xl font-bold font-mono ${cashStatus.color}`}>{formatRatio(cashRatio)}</p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                                                Kas / Kewajiban Lancar
                                            </p>
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
                            <div className="bg-gradient-to-br from-purple-50 via-purple-100 to-purple-50 dark:from-purple-900/20 dark:via-purple-800/20 dark:to-purple-900/20 rounded-lg border border-purple-300 dark:border-purple-700 overflow-hidden">
                                <div className="px-4 py-3 bg-purple-200 dark:bg-purple-800 border-b border-purple-300 dark:border-purple-700">
                                    <h3 className="font-bold text-base text-purple-900 dark:text-purple-100 uppercase tracking-wide flex items-center">
                                        <Activity className="h-5 w-5 mr-2" />
                                        Rasio Solvabilitas
                                    </h3>
                                    <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">Kemampuan perusahaan membayar semua kewajiban</p>
                                </div>
                                <div className="p-4">
                                    {/* Data Dasar */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                                            <p className="text-xs text-gray-600 dark:text-gray-400">Total Aset</p>
                                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 font-mono">{formatCurrency(totalAset)}</p>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                                            <p className="text-xs text-gray-600 dark:text-gray-400">Total Kewajiban</p>
                                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 font-mono">{formatCurrency(totalKewajiban)}</p>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                                            <p className="text-xs text-gray-600 dark:text-gray-400">Total Ekuitas</p>
                                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 font-mono">{formatCurrency(totalEkuitas)}</p>
                                        </div>
                                    </div>

                                    {/* Rasio Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Debt to Asset Ratio */}
                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-purple-200 dark:border-purple-800">
                                            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">Debt to Asset Ratio</h4>
                                            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 font-mono">{formatPercent(debtToAssetRatio)}</p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                                                Total Kewajiban / Total Aset
                                            </p>
                                            <div className="mt-3 text-xs text-gray-700 dark:text-gray-300">
                                                <p>Menunjukkan proporsi aset yang dibiayai hutang</p>
                                                <p className="mt-1">• &lt; 50% = Baik</p>
                                                <p>• 50-70% = Cukup</p>
                                                <p>• &gt; 70% = Tinggi</p>
                                            </div>
                                        </div>

                                        {/* Debt to Equity Ratio */}
                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-purple-200 dark:border-purple-800">
                                            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">Debt to Equity Ratio</h4>
                                            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 font-mono">{formatPercent(debtToEquityRatio)}</p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                                                Total Kewajiban / Total Ekuitas
                                            </p>
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
                            <Alert className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-gray-300 dark:border-gray-600">
                                <Info className="h-4 w-4" />
                                <AlertDescription className="text-xs">
                                    <strong>Catatan:</strong> Analisis rasio keuangan memberikan gambaran kondisi keuangan perusahaan. 
                                    Interpretasi rasio harus mempertimbangkan industri dan kondisi spesifik perusahaan. 
                                    Konsultasikan dengan akuntan profesional untuk analisis mendalam.
                                </AlertDescription>
                            </Alert>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
