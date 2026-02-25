import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { User, type BreadcrumbItem } from '@/types';
import { LayoutDashboard } from 'lucide-react';

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

            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center gap-3 pb-4 border-b">
                    <div className="p-2 rounded-lg bg-muted">
                        <LayoutDashboard className="h-5 w-5 text-foreground" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold">Selamat Datang, {auth.user.name}</h1>
                        <p className="text-sm text-muted-foreground">
                            Sistem Back-Office Klinik Rawat Inap Utama Muhammadiyah Kedungadem
                        </p>
                    </div>
                </div>

                <div className="text-sm text-muted-foreground">
                    Gunakan menu di sidebar untuk mengakses fitur sistem.
                </div>
            </div>
        </AppLayout>
    );
}
