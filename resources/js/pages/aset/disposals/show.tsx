import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { toast } from '@/lib/toast';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Ban, Check, CheckCircle } from 'lucide-react';
import { route } from 'ziggy-js';

interface Disposal {
    id: number; disposal_number: string; disposal_date: string; disposal_method: string;
    disposal_price: number; book_value_at_disposal: number; gain_loss: number;
    reason: string; buyer_info: string | null; notes: string | null; status: string;
    approved_at: string | null;
    asset: {
        id: number; code: string; name: string; acquisition_cost: number;
        current_book_value: number; accumulated_depreciation: number;
        category?: { id: number; name: string }; department?: { id: number; name: string };
    };
    creator: { id: number; name: string } | null;
    approver: { id: number; name: string } | null;
}
interface Props extends SharedData { disposal: Disposal }

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending: { label: 'Menunggu', variant: 'secondary' },
    approved: { label: 'Disetujui', variant: 'default' },
    completed: { label: 'Selesai', variant: 'outline' },
    cancelled: { label: 'Dibatalkan', variant: 'destructive' },
};
const methodLabels: Record<string, string> = {
    sale: 'Penjualan', scrap: 'Penghapusan (Scrap)', donation: 'Donasi',
    trade_in: 'Tukar Tambah', write_off: 'Write Off',
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Aset', href: route('aset.dashboard') },
    { title: 'Disposal', href: route('aset.disposals.index') },
    { title: 'Detail', href: '#' },
];

const fmt = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
const fmtDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

export default function ShowDisposal() {
    const { disposal: d } = usePage<Props>().props;
    const s = statusMap[d.status] ?? { label: d.status, variant: 'outline' as const };

    function handleAction(action: 'approve' | 'complete' | 'cancel') {
        const msgs: Record<string, { confirm: string; success: string }> = {
            approve: { confirm: 'Setujui disposal ini?', success: 'Disposal berhasil disetujui.' },
            complete: { confirm: 'Selesaikan disposal ini? Aset akan dihapusbukukan.', success: 'Disposal berhasil diselesaikan.' },
            cancel: { confirm: 'Batalkan disposal ini?', success: 'Disposal berhasil dibatalkan.' },
        };
        if (!confirm(msgs[action].confirm)) return;
        router.post(route(`aset.disposals.${action}`, d.id), {}, {
            onError: () => toast.error('Gagal memproses.'),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Disposal ${d.disposal_number}`} />

            <div className="p-4 sm:px-6 lg:px-8">
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div>
                                <Button type="button" variant="outline" onClick={() => router.visit(route('aset.disposals.index'))} className="flex items-center gap-2">
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>{d.disposal_number}</CardTitle>
                                        <CardDescription>Aset: {d.asset.code} - {d.asset.name}</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={s.variant}>{s.label}</Badge>
                                        {d.status === 'pending' && (
                                            <>
                                                <Button size="sm" onClick={() => handleAction('approve')}>
                                                    <Check className="mr-2 h-4 w-4" />Setujui
                                                </Button>
                                                <Button size="sm" variant="destructive" onClick={() => handleAction('cancel')}>
                                                    <Ban className="mr-2 h-4 w-4" />Batalkan
                                                </Button>
                                            </>
                                        )}
                                        {d.status === 'approved' && (
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

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader><CardTitle className="text-base">Info Disposal</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Tanggal Disposal</p>
                                <p className="text-sm">{fmtDate(d.disposal_date)}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Metode</p>
                                <p className="text-sm">{methodLabels[d.disposal_method] ?? d.disposal_method}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Alasan</p>
                                <p className="text-sm whitespace-pre-wrap">{d.reason}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Info Pembeli</p>
                                <p className="text-sm">{d.buyer_info ?? '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Dibuat Oleh</p>
                                <p className="text-sm">{d.creator?.name ?? '-'}</p>
                            </div>
                            {d.approver && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Disetujui Oleh</p>
                                    <p className="text-sm">{d.approver.name}  {d.approved_at ? fmtDate(d.approved_at) : ''}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="text-base">Info Keuangan</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Harga Perolehan</p>
                                <p className="text-sm">{fmt(d.asset.acquisition_cost)}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Akumulasi Penyusutan</p>
                                <p className="text-sm">{fmt(d.asset.accumulated_depreciation)}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Nilai Buku saat Disposal</p>
                                <p className="text-sm">{fmt(d.book_value_at_disposal)}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Harga Disposal</p>
                                <p className="text-sm">{fmt(d.disposal_price)}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Laba / Rugi</p>
                                <p className={`text-sm font-semibold ${d.gain_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {fmt(d.gain_loss)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="mt-6">
                    <CardHeader><CardTitle className="text-base">Info Aset</CardTitle></CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Kode Aset</p>
                                <p className="text-sm">{d.asset.code}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Nama Aset</p>
                                <p className="text-sm">{d.asset.name}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Kategori</p>
                                <p className="text-sm">{d.asset.category?.name ?? '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Departemen</p>
                                <p className="text-sm">{d.asset.department?.name ?? '-'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {d.notes && (
                    <Card className="mt-6">
                        <CardHeader><CardTitle className="text-base">Catatan</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-sm whitespace-pre-wrap">{d.notes}</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
