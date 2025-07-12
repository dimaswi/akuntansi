import React from 'react';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { PageProps, BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Inventori',
        href: '/inventory',
    },
    {
        title: 'Laporan',
        href: '/inventory/reports',
    },
];

interface Props extends PageProps {
}

export default function ReportsIndex({ }: Props) {
    const reports = [
        {
            id: 'stock-level',
            title: 'Laporan Level Stok',
            description: 'Lihat level stok saat ini untuk semua item di berbagai lokasi',
            icon: '📊',
            color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
            iconColor: 'text-blue-600',
            href: '/inventory/reports/stock-level'
        },
        {
            id: 'movement-history',
            title: 'Riwayat Perpindahan Stok',
            description: 'Laporan lengkap perpindahan dan pergerakan stok inventori',
            icon: '📈',
            color: 'bg-green-50 border-green-200 hover:bg-green-100',
            iconColor: 'text-green-600',
            href: '/inventory/reports/movement-history'
        },
        {
            id: 'stock-valuation',
            title: 'Valuasi Stok',
            description: 'Laporan nilai stok berdasarkan biaya rata-rata per item',
            icon: '💰',
            color: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
            iconColor: 'text-yellow-600',
            href: '/inventory/reports/stock-valuation'
        }
    ];

    const handleReportClick = (report: any) => {
        router.visit(report.href);
    };

    const Layout = ({ children }: { children: React.ReactNode }) => (
        <AppLayout breadcrumbs={breadcrumbs}>
            {children}
        </AppLayout>
    );

    return (
        <Layout>
            <Head title="Laporan Inventori" />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                {/* Header Section */}
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="font-semibold text-2xl text-gray-800 leading-tight">
                            Laporan Inventori
                        </h2>
                        <p className="text-gray-600 mt-1">
                            Akses berbagai laporan dan analisis inventori untuk membantu pengambilan keputusan bisnis
                        </p>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100">Total Laporan</p>
                                    <p className="text-2xl font-bold">{reports.length}</p>
                                </div>
                                <div className="text-3xl">📋</div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-100">Tersedia</p>
                                    <p className="text-2xl font-bold">{reports.length}</p>
                                </div>
                                <div className="text-3xl">✅</div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-100">Kategori</p>
                                    <p className="text-2xl font-bold">3</p>
                                </div>
                                <div className="text-3xl">📊</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Available Reports */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Laporan Tersedia</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {reports.map((report) => (
                            <Card 
                                key={report.id} 
                                className={`cursor-pointer transition-all duration-200 ${report.color} hover:shadow-lg`}
                                onClick={() => handleReportClick(report)}
                            >
                                <CardContent className="p-6">
                                    <div className="flex items-start space-x-4">
                                        <div className={`text-4xl ${report.iconColor}`}>
                                            {report.icon}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-800 mb-2">
                                                {report.title}
                                            </h4>
                                            <p className="text-sm text-gray-600 mb-4">
                                                {report.description}
                                            </p>
                                            <Button size="sm" variant="outline" className="w-full">
                                                Buka Laporan →
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Help Section */}
                <Card className="bg-gray-50">
                    <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                            <div className="text-4xl">💡</div>
                            <div>
                                <h4 className="font-semibold text-gray-800 mb-2">
                                    Bantuan & Tips
                                </h4>
                                <ul className="text-sm text-gray-600 space-y-1">
                                    <li>• Gunakan laporan Level Stok untuk memantau ketersediaan barang</li>
                                    <li>• Riwayat Perpindahan membantu audit dan pelacakan pergerakan stok</li>
                                    <li>• Valuasi Stok berguna untuk laporan keuangan dan pajak</li>
                                    <li>• Semua laporan dapat diekspor ke format Excel atau PDF</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
