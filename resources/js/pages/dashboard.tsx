import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    TrendingUp, 
    TrendingDown, 
    DollarSign, 
    Wallet, 
    BarChart3,
    PieChart,
    Activity,
    AlertCircle,
    ArrowUpRight,
    ArrowDownRight,
    Calendar
} from 'lucide-react';
import { 
    LineChart, 
    Line, 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    ResponsiveContainer,
    Area,
    AreaChart,
    Cell
} from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

interface DataHarian {
    tanggal: number;
    tanggal_full: string;
    pendapatan: number;
    beban: number;
    laba_rugi: number;
    margin: number;
}

interface TopItem {
    nama: string;
    total: number;
}

interface Props {
    bulan: string | null;
    dataHarian: DataHarian[];
    statistik: {
        totalPendapatan: number;
        totalBeban: number;
        labaRugi: number;
        marginRataRata: number;
    };
    kasBank: {
        total: number;
        detail: { nama: string; saldo: number }[];
    };
    topPendapatan: TopItem[];
    topBeban: TopItem[];
    posisiKeuangan: {
        aset: number;
        kewajiban: number;
        ekuitas: number;
    };
    rasioLikuiditas: {
        aset_lancar: number;
        kewajiban_lancar: number;
        current_ratio: number;
    };
}

export default function Dashboard({ 
    bulan,
    dataHarian,
    statistik,
    kasBank,
    topPendapatan,
    topBeban,
    posisiKeuangan,
    rasioLikuiditas
}: Props) {
    // Default to current month if bulan is null (first load)
    const currentMonth = new Date().toISOString().slice(0, 7);
    const [selectedMonth, setSelectedMonth] = useState(bulan || currentMonth);
    const [isLoading, setIsLoading] = useState(false);

    // Compute sign flags and safe maxima for progress bars so negative totals
    // render correctly (color + bar width) and we avoid division by zero.
    const pendapatanPositif = statistik && statistik.totalPendapatan >= 0;
    const bebanPositif = statistik && statistik.totalBeban >= 0;
    const topPendapatanMax = topPendapatan && topPendapatan.length ? Math.abs(topPendapatan[0].total) || 1 : 1;
    const topBebanMax = topBeban && topBeban.length ? Math.abs(topBeban[0].total) || 1 : 1;
    const safeWidth = (value: number, max: number) => `${Math.min(100, max === 0 ? 0 : (Math.abs(value) / max) * 100)}%`;
    
    // Check if we're in empty state (no data loaded yet)
    const isEmpty = bulan === null;

    const formatCurrency = (amount: number) => {
        const absAmount = Math.abs(amount);
        if (absAmount >= 1000000000) {
            return (amount >= 0 ? '' : '-') + 'Rp ' + (absAmount / 1000000000).toFixed(1) + 'M';
        } else if (absAmount >= 1000000) {
            return (amount >= 0 ? '' : '-') + 'Rp ' + (absAmount / 1000000).toFixed(1) + 'Jt';
        } else if (absAmount >= 1000) {
            return (amount >= 0 ? '' : '-') + 'Rp ' + (absAmount / 1000).toFixed(1) + 'Rb';
        }
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatCurrencyFull = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMonth = e.target.value;
        setSelectedMonth(newMonth);
        setIsLoading(true);
        router.get(route('dashboard'), { bulan: newMonth }, {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => setIsLoading(false),
        });
    };    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                    <p className="font-semibold text-sm mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} style={{ color: entry.color }} className="text-xs font-medium">
                            {entry.name}: {formatCurrencyFull(entry.value)}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard Keuangan</h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {isEmpty ? 'Pilih bulan untuk melihat data' : 'Ringkasan performa keuangan perusahaan'}
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        <input 
                            type="month"
                            value={selectedMonth}
                            onChange={handleMonthChange}
                            disabled={isLoading}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    </div>
                </div>
                
                {/* Loading Indicator with Progress Bar */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-52 space-y-4">
                        <div className="w-full max-w-md">
                            <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-gray-400 via-gray-600 to-gray-400 dark:from-gray-500 dark:via-gray-300 dark:to-gray-500 animate-pulse">
                                    <div className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="flex space-x-1">
                                <div className="h-2 w-2 bg-gray-600 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="h-2 w-2 bg-gray-600 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="h-2 w-2 bg-gray-600 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Memuat data keuangan...</span>
                        </div>
                    </div>
                )}
                
                {/* Empty State - Modern Monochrome Compact */}
                {isEmpty && !isLoading && (
                    <div className="relative mx-auto pt-36 max-w-2xl">
                        {/* Gradient Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-2xl opacity-50"></div>
                        
                        {/* Content */}
                        <div className="relative border border-gray-200 dark:border-gray-700 rounded-2xl p-8 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                            <div className="flex items-start space-x-6">
                                {/* Icon Section */}
                                <div className="flex-shrink-0">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-gradient-to-br from-gray-400 to-gray-600 dark:from-gray-500 dark:to-gray-300 rounded-xl blur-lg opacity-20"></div>
                                        <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 p-4 rounded-xl border border-gray-300 dark:border-gray-600">
                                            <BarChart3 className="h-10 w-10 text-gray-700 dark:text-gray-300" strokeWidth={1.5} />
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Text Section */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 tracking-tight">
                                        Dashboard Keuangan
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                                        Pilih periode bulan untuk menampilkan analisis performa keuangan lengkap dengan grafik, tren, dan metrik bisnis.
                                    </p>
                                    
                                    {/* Feature List - Compact */}
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                                            <div className="h-1.5 w-1.5 rounded-full bg-gray-400 dark:bg-gray-500"></div>
                                            <span>Pendapatan & Beban</span>
                                        </div>
                                        <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                                            <div className="h-1.5 w-1.5 rounded-full bg-gray-400 dark:bg-gray-500"></div>
                                            <span>Grafik Harian</span>
                                        </div>
                                        <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                                            <div className="h-1.5 w-1.5 rounded-full bg-gray-400 dark:bg-gray-500"></div>
                                            <span>Kas & Bank</span>
                                        </div>
                                        <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                                            <div className="h-1.5 w-1.5 rounded-full bg-gray-400 dark:bg-gray-500"></div>
                                            <span>Rasio Likuiditas</span>
                                        </div>
                                    </div>
                                    
                                    {/* CTA */}
                                    <div className="mt-6 flex items-center space-x-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                                        <Calendar className="h-3.5 w-3.5" />
                                        <span>Gunakan filter bulan di atas untuk memulai</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Dashboard Content - Only show when data is loaded */}
                {!isEmpty && !isLoading && (
                    <>

                {/* KPI Cards */}
                <div className="grid auto-rows-min gap-4 md:grid-cols-4">
                    {/* Total Pendapatan */}
                    <Card className={`border-l-4 ${pendapatanPositif ? 'border-l-green-500' : 'border-l-red-500'}`}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center justify-between">
                                Total Pendapatan
                                {pendapatanPositif ? (
                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                ) : (
                                    <TrendingDown className="h-4 w-4 text-red-600" />
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${pendapatanPositif ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {statistik ? formatCurrency(statistik.totalPendapatan) : 'Rp 0'}
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {new Date(selectedMonth + '-01').toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Total Beban */}
                    <Card className={`border-l-4 ${bebanPositif ? 'border-l-red-500' : 'border-l-green-500'}`}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center justify-between">
                                Total Beban
                                {bebanPositif ? (
                                    <TrendingDown className="h-4 w-4 text-red-600" />
                                ) : (
                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${bebanPositif ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                {statistik ? formatCurrency(statistik.totalBeban) : 'Rp 0'}
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {new Date(selectedMonth + '-01').toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Laba/Rugi */}
                    <Card className={`border-l-4 ${statistik && statistik.labaRugi >= 0 ? 'border-l-blue-500' : 'border-l-orange-500'}`}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center justify-between">
                                {statistik && statistik.labaRugi >= 0 ? 'Laba Bersih' : 'Rugi Bersih'}
                                {statistik && statistik.labaRugi >= 0 ? 
                                    <ArrowUpRight className="h-4 w-4 text-blue-600" /> : 
                                    <ArrowDownRight className="h-4 w-4 text-orange-600" />
                                }
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${statistik && statistik.labaRugi >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                {statistik ? formatCurrency(statistik.labaRugi) : 'Rp 0'}
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {new Date(selectedMonth + '-01').toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Margin */}
                    <Card className="border-l-4 border-l-purple-500">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center justify-between">
                                Margin Rata-rata
                                <Activity className="h-4 w-4 text-purple-600" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                {statistik ? statistik.marginRataRata.toFixed(2) : '0.00'}%
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Profit Margin</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Row */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Pendapatan vs Beban Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                                Pendapatan vs Beban per Bulan
                            </CardTitle>
                            <CardDescription>Perbandingan head-to-head bulanan</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={dataHarian}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="tanggal" />
                                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Bar dataKey="pendapatan" name="Pendapatan">
                                        {dataHarian?.map((entry, index) => (
                                            <Cell key={`cell-pendapatan-${index}`} fill={entry.pendapatan >= 0 ? '#10b981' : '#ef4444'} />
                                        ))}
                                    </Bar>
                                    <Bar dataKey="beban" name="Beban">
                                        {dataHarian?.map((entry, index) => (
                                            <Cell key={`cell-beban-${index}`} fill={entry.beban >= 0 ? '#ef4444' : '#10b981'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Margin Trend Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
                                Tren Margin per Bulan
                            </CardTitle>
                            <CardDescription>Persentase margin keuntungan</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={dataHarian}>
                                    <defs>
                                        <linearGradient id="colorMargin" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="tanggal" />
                                    <YAxis tickFormatter={(value) => `${value}%`} />
                                    <Tooltip formatter={(value: any) => `${value}%`} />
                                    <Area type="monotone" dataKey="margin" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorMargin)" name="Margin %" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Bottom Section */}
                <div className="grid gap-4 md:grid-cols-3">
                    {/* Kas & Bank */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-base">
                                <Wallet className="h-5 w-5 mr-2 text-green-600" />
                                Kas & Bank
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-4">
                                {formatCurrency(kasBank.total)}
                            </div>
                            <div className="space-y-2">
                                {kasBank.detail.slice(0, 5).map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600 dark:text-gray-400 truncate">{item.nama}</span>
                                        <span className="font-mono font-semibold">{formatCurrency(item.saldo)}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top Pendapatan */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-base">
                                <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                                Top 5 Pendapatan
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {topPendapatan.map((item, idx) => (
                                    <div key={idx}>
                                        <div className="flex justify-between items-center text-sm mb-1">
                                            <span className="text-gray-700 dark:text-gray-300 text-xs truncate flex-1">{item.nama}</span>
                                            <span className="font-mono font-semibold text-xs text-green-600 dark:text-green-400 ml-2">
                                                {formatCurrency(item.total)}
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                            <div 
                                                className={`h-1.5 rounded-full ${item.total >= 0 ? 'bg-green-600' : 'bg-red-600'}`} 
                                                style={{ width: safeWidth(item.total, topPendapatanMax) }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top Beban */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-base">
                                <TrendingDown className="h-5 w-5 mr-2 text-red-600" />
                                Top 5 Beban
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {topBeban.map((item, idx) => (
                                    <div key={idx}>
                                        <div className="flex justify-between items-center text-sm mb-1">
                                            <span className="text-gray-700 dark:text-gray-300 text-xs truncate flex-1">{item.nama}</span>
                                            <span className="font-mono font-semibold text-xs text-red-600 dark:text-red-400 ml-2">
                                                {formatCurrency(item.total)}
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                            <div 
                                                className={`h-1.5 rounded-full ${item.total >= 0 ? 'bg-red-600' : 'bg-green-600'}`} 
                                                style={{ width: safeWidth(item.total, topBebanMax) }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Financial Position & Liquidity */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Posisi Keuangan */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-base">
                                <PieChart className="h-5 w-5 mr-2 text-indigo-600" />
                                Posisi Keuangan
                            </CardTitle>
                            <CardDescription>Balance Sheet Overview</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <span className="font-semibold text-sm">Total Aset</span>
                                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                                        {formatCurrency(posisiKeuangan.aset)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                    <span className="font-semibold text-sm">Total Kewajiban</span>
                                    <span className="font-mono font-bold text-red-600 dark:text-red-400">
                                        {formatCurrency(posisiKeuangan.kewajiban)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    <span className="font-semibold text-sm">Total Ekuitas</span>
                                    <span className="font-mono font-bold text-green-600 dark:text-green-400">
                                        {formatCurrency(posisiKeuangan.ekuitas)}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Rasio Likuiditas */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-base">
                                <Activity className="h-5 w-5 mr-2 text-purple-600" />
                                Rasio Likuiditas
                            </CardTitle>
                            <CardDescription>Current Ratio Assessment</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center mb-4">
                                <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                                    {rasioLikuiditas.current_ratio.toFixed(2)}
                                </div>
                                <Badge variant={rasioLikuiditas.current_ratio >= 2 ? 'default' : rasioLikuiditas.current_ratio >= 1 ? 'secondary' : 'destructive'}>
                                    {rasioLikuiditas.current_ratio >= 2 ? 'Sangat Baik' : rasioLikuiditas.current_ratio >= 1 ? 'Baik' : 'Perlu Perhatian'}
                                </Badge>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Aset Lancar</span>
                                    <span className="font-mono font-semibold">{formatCurrency(rasioLikuiditas.aset_lancar)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Kewajiban Lancar</span>
                                    <span className="font-mono font-semibold">{formatCurrency(rasioLikuiditas.kewajiban_lancar)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                </>
                )}
            </div>
        </AppLayout>
    );
}
