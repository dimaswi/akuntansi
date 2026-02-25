import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { toast } from '@/lib/toast';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Ban, Check, CheckCircle } from 'lucide-react';
import { route } from 'ziggy-js';

interface Transfer {
    id: number; transfer_number: string; transfer_date: string; status: string;
    reason: string | null; notes: string | null; approved_at: string | null;
    asset: {
        id: number; code: string; name: string; brand: string | null; model: string | null;
        serial_number: string | null; acquisition_cost: number; current_book_value: number;
    };
    from_department: { id: number; name: string };
    to_department: { id: number; name: string };
    creator: { id: number; name: string } | null;
    approver: { id: number; name: string } | null;
}
interface Props extends SharedData { transfer: Transfer }

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending: { label: 'Menunggu', variant: 'secondary' },
    approved: { label: 'Disetujui', variant: 'default' },
    completed: { label: 'Selesai', variant: 'outline' },
    cancelled: { label: 'Dibatalkan', variant: 'destructive' },
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Aset', href: route('aset.dashboard') },
    { title: 'Transfer', href: route('aset.transfers.index') },
    { title: 'Detail', href: '#' },
];

const fmt = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
const fmtDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

export default function ShowTransfer() {
    const { transfer: t } = usePage<Props>().props;
    const s = statusMap[t.status] ?? { label: t.status, variant: 'outline' as const };

    function handleAction(action: 'approve' | 'complete' | 'cancel') {
        const msgs: Record<string, { confirm: string; success: string }> = {
            approve: { confirm: 'Setujui transfer ini?', success: 'Transfer berhasil disetujui.' },
            complete: { confirm: 'Selesaikan transfer ini? Departemen aset akan diperbarui.', success: 'Transfer berhasil diselesaikan.' },
            cancel: { confirm: 'Batalkan transfer ini?', success: 'Transfer berhasil dibatalkan.' },
        };
        if (!confirm(msgs[action].confirm)) return;
        router.post(route(`aset.transfers.${action}`, t.id), {}, {
            onError: () => toast.error('Gagal memproses.'),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Transfer ${t.transfer_number}`} />

            <div className="p-4 sm:px-6 lg:px-8">
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div>
                                <Button type="button" variant="outline" onClick={() => router.visit(route('aset.transfers.index'))} className="flex items-center gap-2">
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>{t.transfer_number}</CardTitle>
                                        <CardDescription>Aset: {t.asset.code} - {t.asset.name}</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={s.variant}>{s.label}</Badge>
                                        {t.status === 'pending' && (
                                            <>
                                                <Button size="sm" onClick={() => handleAction('approve')}>
                                                    <Check className="mr-2 h-4 w-4" />Setujui
                                                </Button>
                                                <Button size="sm" variant="destructive" onClick={() => handleAction('cancel')}>
                                                    <Ban className="mr-2 h-4 w-4" />Batalkan
                                                </Button>
                                            </>
                                        )}
                                        {t.status === 'approved' && (
                                            <>
                                                <Button size="sm" onClick={() => handleAction('complete')}>
                                                    <CheckCircle className="mr-2 h-4 w-4" />Selesaikan
                                                </Button>
                                                <Button size="sm" variant="destructive" onClick={() => handleAction('cancel')}>
                                                    <Ban className="mr-2 h-4 w-4" />Batalkan
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {/* Transfer direction visualization */}
                <Card className="mb-6">
                    <CardContent className="py-6">
                        <div className="flex items-center justify-center gap-6">
                            <div className="text-center">
                                <p className="text-sm font-medium text-gray-500">Dari</p>
                                <p className="text-lg font-semibold">{t.from_department.name}</p>
                            </div>
                            <ArrowRight className="h-8 w-8 text-primary" />
                            <div className="text-center">
                                <p className="text-sm font-medium text-gray-500">Ke</p>
                                <p className="text-lg font-semibold">{t.to_department.name}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader><CardTitle className="text-base">Info Transfer</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Tanggal Transfer</p>
                                <p className="text-sm">{fmtDate(t.transfer_date)}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Alasan</p>
                                <p className="text-sm whitespace-pre-wrap">{t.reason ?? '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Dibuat Oleh</p>
                                <p className="text-sm">{t.creator?.name ?? '-'}</p>
                            </div>
                            {t.approver && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Disetujui Oleh</p>
                                    <p className="text-sm">{t.approver.name}  {t.approved_at ? fmtDate(t.approved_at) : ''}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="text-base">Info Aset</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Kode</p>
                                <p className="text-sm">{t.asset.code}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Nama</p>
                                <p className="text-sm">{t.asset.name}</p>
                            </div>
                            {t.asset.brand && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Merek / Model</p>
                                    <p className="text-sm">{t.asset.brand} {t.asset.model ? `/ ${t.asset.model}` : ''}</p>
                                </div>
                            )}
                            {t.asset.serial_number && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Serial Number</p>
                                    <p className="text-sm">{t.asset.serial_number}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-sm font-medium text-gray-500">Harga Perolehan</p>
                                <p className="text-sm">{fmt(t.asset.acquisition_cost)}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Nilai Buku</p>
                                <p className="text-sm">{fmt(t.asset.current_book_value)}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {t.notes && (
                    <Card className="mt-6">
                        <CardHeader><CardTitle className="text-base">Catatan</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-sm whitespace-pre-wrap">{t.notes}</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
