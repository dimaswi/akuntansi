import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, DollarSign, Activity, FileText } from 'lucide-react';
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
            FileText
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
                            <h1 className="text-3xl font-bold mb-2">Laporan Keuangan</h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                Generate dan lihat berbagai laporan keuangan
                            </p>
                        </div>

                        {/* Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                            {laporanTypes.map((laporan) => {
                                const IconComponent = getIcon(laporan.icon);
                                return (
                                    <Card key={laporan.id} className="hover:shadow-lg transition-shadow">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center space-x-3">
                                                <div className={`p-3 rounded-lg ${laporan.color} text-white`}>
                                                    <IconComponent className="h-8 w-8" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-xl">{laporan.name}</CardTitle>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                                                {laporan.description}
                                            </p>
                                            
                                            <div className="flex space-x-2">
                                                <Button asChild className="flex-1">
                                                    <Link href={route(`akuntansi.laporan.${laporan.id}`)}>
                                                        Lihat Laporan
                                                    </Link>
                                                </Button>
                                                <Button variant="outline" size="sm">
                                                    Export
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>

                        {/* Info Section */}
                        <div className="mt-12">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <FileText className="h-5 w-5 mr-2" />
                                        Informasi Laporan Keuangan
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <h3 className="font-semibold mb-3">Neraca</h3>
                                            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                                <li>• Menampilkan posisi keuangan pada tanggal tertentu</li>
                                                <li>• Terdiri dari Aset, Kewajiban, dan Ekuitas</li>
                                                <li>• Harus selalu balance: Aset = Kewajiban + Ekuitas</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold mb-3">Laba Rugi</h3>
                                            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                                <li>• Menampilkan kinerja dalam periode tertentu</li>
                                                <li>• Terdiri dari Pendapatan dan Beban</li>
                                                <li>• Hasil: Laba/Rugi = Pendapatan - Beban</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold mb-3">Arus Kas</h3>
                                            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                                <li>• Menampilkan pergerakan kas dalam periode</li>
                                                <li>• Kas masuk dan kas keluar</li>
                                                <li>• Net cash flow untuk periode tersebut</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold mb-3">Perubahan Ekuitas</h3>
                                            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                                <li>• Menampilkan perubahan modal pemilik</li>
                                                <li>• Ekuitas awal + Laba - Prive = Ekuitas akhir</li>
                                                <li>• Melacak investasi dan penarikan modal</li>
                                            </ul>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
