import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, type BreadcrumbItem } from '@/types';

interface DashboardWelcomeProps {
    auth: {
        user: User;
    };
}

const breadcrumbItems: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
];

export default function DashboardWelcome({ auth }: DashboardWelcomeProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbItems}>
            <Head title="Dashboard" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl">Selamat Datang, {auth.user.name}!</CardTitle>
                            <CardDescription>
                                Sistem Back-Office Klinik Rawat Inap Utama Muhammadiyah Kedungadem
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
