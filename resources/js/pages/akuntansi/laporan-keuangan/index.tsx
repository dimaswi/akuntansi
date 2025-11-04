import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, DollarSign, Activity, FileText, Calendar, Download, PieChart, FileEdit } from 'lucide-react';
import { Link } from '@inertiajs/react';

interface LaporanType {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
}

interface Props {
    laporanTypes: LaporanType[];
}

export default function LaporanKeuanganIndex({ laporanTypes }: Props) {
    const getIcon = (iconName: string) => {
        const icons: Record<string, React.ComponentType<any>> = {
            BarChart3,
            TrendingUp,
            DollarSign,
            Activity,
            FileText,
            Calendar,
            Download,
            PieChart,
            FileEdit
        };
        return icons[iconName] || FileText;
    };

    return (
        <AppLayout>
            <Head title="Laporan Keuangan" />
            
            <div className="max-w-7xl p-4 sm:px-6 lg:px-8">
                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                    <div className="p-6 text-gray-900 dark:text-gray-100">
                        {/* Header */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                                        Laporan Keuangan
                                    </h1>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        Generate dan analisis berbagai laporan keuangan
                                    </p>
                                </div>
                                <span className="text-sm text-gray-500">
                                    {laporanTypes.length} Laporan
                                </span>
                            </div>
                        </div>

                        {/* Laporan List */}
                        <div className="space-y-4">
                            {laporanTypes.map((laporan, index) => {
                                const IconComponent = getIcon(laporan.icon);
                                return (
                                    <div key={laporan.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                <div className="p-2 rounded-md bg-gray-100 dark:bg-gray-700">
                                                    <IconComponent className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                                        {laporan.name}
                                                    </h3>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        {laporan.description}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Button asChild variant="outline" size="sm">
                                                    <Link href={route(`akuntansi.laporan.${laporan.id}`)}>
                                                        Lihat Laporan
                                                    </Link>
                                                </Button>
                                                <Button variant="ghost" size="sm">
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Info Section */}
                        <div className="mt-12 border-t border-gray-200 dark:border-gray-700 pt-8">
                            <div className="mb-6">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                    Informasi Laporan
                                </h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Penjelasan singkat mengenai setiap jenis laporan keuangan
                                </p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="font-medium mb-2 text-gray-900 dark:text-gray-100">Neraca</h3>
                                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                            <li>• Posisi keuangan pada tanggal tertentu</li>
                                            <li>• Aset, Kewajiban, dan Modal</li>
                                            <li>• Aset = Kewajiban + Modal</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h3 className="font-medium mb-2 text-gray-900 dark:text-gray-100">Laba Rugi</h3>
                                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                            <li>• Kinerja dalam periode tertentu</li>
                                            <li>• Pendapatan dan Beban</li>
                                            <li>• Laba/Rugi = Pendapatan - Beban</li>
                                        </ul>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="font-medium mb-2 text-gray-900 dark:text-gray-100">Arus Kas</h3>
                                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                            <li>• Pergerakan kas dalam periode</li>
                                            <li>• Kas masuk dan kas keluar</li>
                                            <li>• Net cash flow</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h3 className="font-medium mb-2 text-gray-900 dark:text-gray-100">Perubahan Modal</h3>
                                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                            <li>• Perubahan modal pemilik</li>
                                            <li>• Modal awal + Laba - Prive</li>
                                            <li>• Investasi dan penarikan</li>
                                        </ul>
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
