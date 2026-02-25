import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { BarChart3, BookOpenCheck, Calculator, DollarSign, FileText, TrendingUp } from 'lucide-react';

interface Statistics {
    total_akun: number;
    jurnal_bulan_ini: number;
    total_transaksi: number;
    saldo_kas: number;
}

interface Props {
    statistics: Statistics;
}

const menuItems = [
    {
        title: 'Daftar Akun',
        description: 'Kelola chart of accounts dan struktur akun perusahaan',
        href: '/akuntansi/daftar-akun',
        icon: BookOpenCheck,
        color: 'bg-blue-500',
        permission: 'akuntansi.daftar-akun.view',
    },
    {
        title: 'Jurnal',
        description: 'Input dan kelola jurnal transaksi keuangan',
        href: '/akuntansi/jurnal',
        icon: FileText,
        color: 'bg-green-500',
        permission: 'akuntansi.jurnal.view',
    },
    {
        title: 'Laporan Keuangan',
        description: 'Lihat neraca, laba rugi, dan laporan keuangan lainnya',
        href: '/akuntansi/laporan',
        icon: BarChart3,
        color: 'bg-purple-500',
        permission: 'akuntansi.laporan.view',
        disabled: false,
    },
    {
        title: 'Buku Besar',
        description: 'Lihat buku besar dan saldo akun',
        href: '/akuntansi/buku-besar',
        icon: Calculator,
        color: 'bg-orange-500',
        permission: 'akuntansi.buku-besar.view',
        disabled: false,
    },
];

export default function AkuntansiIndex({ statistics }: Props) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };
    return (
        <AppLayout>
            <Head title="Akuntansi" />
            <div>
                <div className="p-6 text-gray-900 dark:text-gray-100">
                    <div className="mb-8">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Akun</p>
                                            <p className="text-2xl font-bold">{statistics.total_akun}</p>
                                        </div>
                                        <BookOpenCheck className="h-8 w-8 text-blue-500" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Jurnal Bulan Ini</p>
                                            <p className="text-2xl font-bold">{statistics.jurnal_bulan_ini}</p>
                                        </div>
                                        <FileText className="h-8 w-8 text-green-500" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Transaksi</p>
                                            <p className="text-2xl font-bold">{statistics.total_transaksi}</p>
                                        </div>
                                        <TrendingUp className="h-8 w-8 text-purple-500" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Saldo Kas</p>
                                            <p className="text-2xl font-bold">{formatCurrency(statistics.saldo_kas)}</p>
                                        </div>
                                        <DollarSign className="h-8 w-8 text-orange-500" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h2 className="mb-4 text-xl font-semibold">Menu Akuntansi</h2>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {menuItems.map((item) => {
                                const IconComponent = item.icon;
                                return (
                                    <Card key={item.title} className={`${item.disabled ? 'opacity-50' : ''}`}>
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center space-x-3">
                                                <div className={`rounded-lg p-2 ${item.color} text-white`}>
                                                    <IconComponent className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-lg">{item.title}</CardTitle>
                                                    {item.disabled && <span className="text-xs text-gray-500">Coming Soon</span>}
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                                            {item.disabled ? (
                                                <Button variant="outline" disabled className="w-full">
                                                    Segera Hadir
                                                </Button>
                                            ) : (
                                                <Button asChild className="w-full">
                                                    <Link href={item.href}>Buka {item.title}</Link>
                                                </Button>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
