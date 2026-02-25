import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Landmark, Pencil } from 'lucide-react';
import { route } from 'ziggy-js';

interface Maintenance {
    id: number; maintenance_number: string; type: string; description: string;
    status: string; scheduled_date: string; start_date: string | null; completion_date: string | null;
    cost: number; vendor: string | null; vendor_contact: string | null; notes: string | null;
    asset: { id: number; code: string; name: string; department?: { name: string } };
    user: { name: string } | null;
}
interface Props extends SharedData { maintenance: Maintenance }

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    scheduled: { label: 'Dijadwalkan', variant: 'secondary' },
    in_progress: { label: 'Dalam Proses', variant: 'default' },
    completed: { label: 'Selesai', variant: 'outline' },
    cancelled: { label: 'Dibatalkan', variant: 'destructive' },
};
const typeMap: Record<string, string> = { preventive: 'Preventif', corrective: 'Korektif', emergency: 'Darurat' };

const breadcrumbs: BreadcrumbItem[] = [
    { title: <Landmark className="h-4 w-4" />, href: route('aset.dashboard') },
    { title: 'Maintenance', href: route('aset.maintenances.index') },
    { title: 'Detail', href: '#' },
];

const fmt = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
const fmtDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

export default function ShowMaintenance() {
    const { maintenance: m } = usePage<Props>().props;
    const s = statusMap[m.status] ?? { label: m.status, variant: 'outline' as const };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Maintenance ${m.maintenance_number}`} />

            <div className="p-4 sm:px-6 lg:px-8">
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div>
                                <Button type="button" variant="outline" onClick={() => router.visit(route('aset.maintenances.index'))} className="flex items-center gap-2">
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>{m.maintenance_number}</CardTitle>
                                        <CardDescription>Aset: {m.asset.code} - {m.asset.name}</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={s.variant}>{s.label}</Badge>
                                        {m.status !== 'completed' && m.status !== 'cancelled' && (
                                            <Button variant="outline" onClick={() => router.visit(route('aset.maintenances.edit', m.id))}>
                                                <Pencil className="mr-2 h-4 w-4" />Edit
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Informasi Maintenance</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Tipe</p>
                                <p className="text-sm">{typeMap[m.type] ?? m.type}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Departemen</p>
                                <p className="text-sm">{m.asset.department?.name ?? '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Biaya</p>
                                <p className="text-sm">{fmt(m.cost)}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Vendor</p>
                                <p className="text-sm">{m.vendor ?? '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Kontak Vendor</p>
                                <p className="text-sm">{m.vendor_contact ?? '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Dibuat Oleh</p>
                                <p className="text-sm">{m.user?.name ?? '-'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Jadwal</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Tanggal Jadwal</p>
                                <p className="text-sm">{fmtDate(m.scheduled_date)}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Tanggal Mulai</p>
                                <p className="text-sm">{m.start_date ? fmtDate(m.start_date) : '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Tanggal Selesai</p>
                                <p className="text-sm">{m.completion_date ? fmtDate(m.completion_date) : '-'}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {(m.description || m.notes) && (
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle className="text-base">Detail Lainnya</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {m.description && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Deskripsi</p>
                                    <p className="text-sm whitespace-pre-wrap">{m.description}</p>
                                </div>
                            )}
                            {m.notes && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Catatan</p>
                                    <p className="text-sm whitespace-pre-wrap">{m.notes}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
