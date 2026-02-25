import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
    TrendingUp, 
    TrendingDown, 
    Wallet, 
    BarChart3,
    PieChart,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    Package
} from 'lucide-react';
import { 
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
} from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard Akuntansi',
        href: '/dashboard/accounting',
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
    canAccessInventoryDashboard?: boolean;
}

export default function DashboardAccounting({ 
    bulan,
    dataHarian,
    statistik,
    kasBank,
    topPendapatan,
    topBeban,
    posisiKeuangan,
    rasioLikuiditas,
    canAccessInventoryDashboard = false
}: Props) {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const [selectedMonth, setSelectedMonth] = useState(bulan || currentMonth);
    const [isLoading, setIsLoading] = useState(false);

    const pendapatanPositif = statistik && statistik.totalPendapatan >= 0;
    const bebanPositif = statistik && statistik.totalBeban >= 0;
    const topPendapatanMax = topPendapatan && topPendapatan.length ? Math.abs(topPendapatan[0].total) || 1 : 1;
    const topBebanMax = topBeban && topBeban.length ? Math.abs(topBeban[0].total) || 1 : 1;
    const safeWidth = (value: number, max: number) => `${Math.min(100, max === 0 ? 0 : (Math.abs(value) / max) * 100)}%`;
    
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
        router.get(route('dashboard.accounting'), { bulan: newMonth }, {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => setIsLoading(false),
        });
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-popover text-popover-foreground p-3 border border-border rounded-md shadow-md">
                    <p className="font-semibold text-xs mb-1.5">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-xs">
                            <span className="text-muted-foreground">{entry.name}:</span>{' '}
                            <span className="font-medium">{formatCurrencyFull(entry.value)}</span>
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard Akuntansi" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                {/* Tabs - Only show if user has access to inventory dashboard */}
                {canAccessInventoryDashboard && (
                    <div className="flex border-b mb-2 gap-0">
                        <button
                            className="px-4 py-2 -mb-px border-b-2 text-sm font-medium transition-colors border-foreground text-foreground flex items-center gap-2"
                        >
                            <BarChart3 className="h-4 w-4" />
                            Akuntansi
                        </button>
                        <button
                            onClick={() => router.visit(route('inventory.dashboard'))}
                            className="px-4 py-2 -mb-px border-b-2 text-sm font-medium transition-colors border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground flex items-center gap-2"
                        >
                            <Package className="h-4 w-4" />
                            Inventory
                        </button>
                    </div>
                )}

                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-semibold">Dashboard Akuntansi</h1>
                        <p className="text-sm text-muted-foreground">
                            {isEmpty ? 'Pilih bulan untuk melihat data' : 'Ringkasan performa keuangan perusahaan'}
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <input 
                            type="month"
                            value={selectedMonth}
                            onChange={handleMonthChange}
                            disabled={isLoading}
                            className="px-3 py-2 border border-input rounded-md bg-background text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    </div>
                </div>
                
                {/* Loading Indicator */}
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
                
                {/* Empty State */}
                {isEmpty && !isLoading && (
                    <div className="relative mx-auto pt-36 max-w-2xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-2xl opacity-50"></div>
                        <div className="relative border border-gray-200 dark:border-gray-700 rounded-2xl p-8 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                            <div className="flex items-start space-x-6">
                                <div className="flex-shrink-0">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-gradient-to-br from-gray-400 to-gray-600 dark:from-gray-500 dark:to-gray-300 rounded-xl blur-lg opacity-20"></div>
                                        <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 p-4 rounded-xl border border-gray-300 dark:border-gray-600">
                                            <BarChart3 className="h-10 w-10 text-gray-700 dark:text-gray-300" strokeWidth={1.5} />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 tracking-tight">
                                        Dashboard Keuangan
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                                        Pilih periode bulan untuk menampilkan analisis performa keuangan lengkap dengan grafik, tren, dan metrik bisnis.
                                    </p>
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
                                    <div className="mt-6 flex items-center space-x-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                                        <Calendar className="h-3.5 w-3.5" />
                                        <span>Gunakan filter bulan di atas untuk memulai</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Dashboard Content */}
                {!isEmpty && !isLoading && (
                    <>
                {/* KPI Cards */}
                <div className="grid auto-rows-min gap-4 md:grid-cols-4">
                    <div className="border rounded-lg p-4 bg-card">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Pendapatan</span>
                            {pendapatanPositif ? <TrendingUp className="h-4 w-4 text-foreground" /> : <TrendingDown className="h-4 w-4 text-muted-foreground" />}
                        </div>
                        <div className="text-2xl font-bold tabular-nums">
                            {statistik ? formatCurrency(statistik.totalPendapatan) : 'Rp 0'}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {new Date(selectedMonth + '-01').toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })}
                        </p>
                    </div>

                    <div className="border rounded-lg p-4 bg-card">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Beban</span>
                            {bebanPositif ? <TrendingDown className="h-4 w-4 text-foreground" /> : <TrendingUp className="h-4 w-4 text-muted-foreground" />}
                        </div>
                        <div className="text-2xl font-bold tabular-nums">
                            {statistik ? formatCurrency(statistik.totalBeban) : 'Rp 0'}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {new Date(selectedMonth + '-01').toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })}
                        </p>
                    </div>

                    <div className="border rounded-lg p-4 bg-card">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                {statistik && statistik.labaRugi >= 0 ? 'Laba Bersih' : 'Rugi Bersih'}
                            </span>
                            {statistik && statistik.labaRugi >= 0
                                ? <ArrowUpRight className="h-4 w-4 text-foreground" />
                                : <ArrowDownRight className="h-4 w-4 text-muted-foreground" />
                            }
                        </div>
                        <div className="text-2xl font-bold tabular-nums">
                            {statistik ? formatCurrency(statistik.labaRugi) : 'Rp 0'}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {new Date(selectedMonth + '-01').toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })}
                        </p>
                    </div>

                    <div className="border rounded-lg p-4 bg-card">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Margin Rata-rata</span>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-2xl font-bold tabular-nums">
                            {statistik ? statistik.marginRataRata.toFixed(2) : '0.00'}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Profit Margin</p>
                    </div>
                </div>

                {/* Charts Row */}
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-base">
                                <BarChart3 className="h-4 w-4 mr-2 text-muted-foreground" />
                                Pendapatan vs Beban
                            </CardTitle>
                            <CardDescription>Perbandingan bulanan</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={dataHarian}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                    <XAxis dataKey="tanggal" tick={{ fontSize: 11 }} />
                                    <YAxis tickFormatter={(value) => formatCurrency(value)} tick={{ fontSize: 10 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Bar dataKey="pendapatan" name="Pendapatan" fill="var(--color-chart-1)" radius={[2,2,0,0]} />
                                    <Bar dataKey="beban" name="Beban" fill="var(--color-chart-3)" radius={[2,2,0,0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-base">
                                <TrendingUp className="h-4 w-4 mr-2 text-muted-foreground" />
                                Tren Margin
                            </CardTitle>
                            <CardDescription>Persentase margin keuntungan</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={280}>
                                <AreaChart data={dataHarian}>
                                    <defs>
                                        <linearGradient id="colorMargin" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                    <XAxis dataKey="tanggal" tick={{ fontSize: 11 }} />
                                    <YAxis tickFormatter={(value) => `${value}%`} tick={{ fontSize: 11 }} />
                                    <Tooltip formatter={(value: any) => `${value}%`} />
                                    <Area type="monotone" dataKey="margin" stroke="var(--color-chart-1)" strokeWidth={2} fillOpacity={1} fill="url(#colorMargin)" name="Margin %" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Bottom Section */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-sm font-medium">
                                <Wallet className="h-4 w-4 mr-2 text-muted-foreground" />
                                Kas & Bank
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold tabular-nums mb-3">
                                {formatCurrency(kasBank.total)}
                            </div>
                            <div className="space-y-1.5">
                                {kasBank.detail.slice(0, 5).map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground truncate">{item.nama}</span>
                                        <span className="font-mono font-medium tabular-nums">{formatCurrency(item.saldo)}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-sm font-medium">
                                <TrendingUp className="h-4 w-4 mr-2 text-muted-foreground" />
                                Top 5 Pendapatan
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2.5">
                                {topPendapatan.map((item, idx) => (
                                    <div key={idx}>
                                        <div className="flex justify-between items-center text-xs mb-1">
                                            <span className="text-foreground truncate flex-1">{item.nama}</span>
                                            <span className="font-mono font-medium tabular-nums ml-2">
                                                {formatCurrency(item.total)}
                                            </span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-1">
                                            <div
                                                className="h-1 rounded-full bg-foreground"
                                                style={{ width: safeWidth(item.total, topPendapatanMax) }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-sm font-medium">
                                <TrendingDown className="h-4 w-4 mr-2 text-muted-foreground" />
                                Top 5 Beban
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2.5">
                                {topBeban.map((item, idx) => (
                                    <div key={idx}>
                                        <div className="flex justify-between items-center text-xs mb-1">
                                            <span className="text-foreground truncate flex-1">{item.nama}</span>
                                            <span className="font-mono font-medium tabular-nums ml-2">
                                                {formatCurrency(item.total)}
                                            </span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-1">
                                            <div
                                                className="h-1 rounded-full bg-muted-foreground"
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
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-sm font-medium">
                                <PieChart className="h-4 w-4 mr-2 text-muted-foreground" />
                                Posisi Keuangan
                            </CardTitle>
                            <CardDescription>Balance Sheet Overview</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center p-2.5 bg-muted/40 rounded-md">
                                    <span className="text-sm">Total Aset</span>
                                    <span className="font-mono font-semibold text-sm tabular-nums">
                                        {formatCurrency(posisiKeuangan.aset)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-2.5 bg-muted/40 rounded-md">
                                    <span className="text-sm">Total Kewajiban</span>
                                    <span className="font-mono font-semibold text-sm tabular-nums">
                                        {formatCurrency(posisiKeuangan.kewajiban)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-2.5 bg-muted/40 rounded-md">
                                    <span className="text-sm">Total Ekuitas</span>
                                    <span className="font-mono font-semibold text-sm tabular-nums">
                                        {formatCurrency(posisiKeuangan.ekuitas)}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-sm font-medium">
                                <Activity className="h-4 w-4 mr-2 text-muted-foreground" />
                                Rasio Likuiditas
                            </CardTitle>
                            <CardDescription>Current Ratio</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center mb-4">
                                <div className="text-4xl font-bold tabular-nums mb-2">
                                    {rasioLikuiditas.current_ratio.toFixed(2)}
                                </div>
                                <Badge variant={rasioLikuiditas.current_ratio >= 2 ? 'default' : rasioLikuiditas.current_ratio >= 1 ? 'secondary' : 'outline'}>
                                    {rasioLikuiditas.current_ratio >= 2 ? 'Sangat Baik' : rasioLikuiditas.current_ratio >= 1 ? 'Baik' : 'Perlu Perhatian'}
                                </Badge>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Aset Lancar</span>
                                    <span className="font-mono font-medium tabular-nums">{formatCurrency(rasioLikuiditas.aset_lancar)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Kewajiban Lancar</span>
                                    <span className="font-mono font-medium tabular-nums">{formatCurrency(rasioLikuiditas.kewajiban_lancar)}</span>
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
