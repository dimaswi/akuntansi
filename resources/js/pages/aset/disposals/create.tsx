import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { toast } from '@/lib/toast';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { route } from 'ziggy-js';

interface Asset {
    id: number; code: string; name: string;
    current_book_value: number; acquisition_cost: number;
    department?: { id: number; name: string };
}
interface Props extends SharedData { assets: Asset[]; generatedNumber: string }

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Aset', href: route('aset.dashboard') },
    { title: 'Disposal', href: route('aset.disposals.index') },
    { title: 'Buat Baru', href: '#' },
];

const methodLabels: Record<string, string> = {
    sale: 'Penjualan', scrap: 'Penghapusan (Scrap)', donation: 'Donasi',
    trade_in: 'Tukar Tambah', write_off: 'Write Off',
};

const fmt = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

export default function CreateDisposal() {
    const { assets, generatedNumber } = usePage<Props>().props;
    const { data, setData, post, processing, errors } = useForm({
        disposal_number: generatedNumber,
        asset_id: '',
        disposal_date: new Date().toISOString().split('T')[0],
        disposal_method: '',
        disposal_price: '0',
        reason: '',
        buyer_info: '',
        notes: '',
    });

    const selectedAsset = assets.find((a) => a.id.toString() === data.asset_id);
    const gainLoss = selectedAsset ? parseFloat(data.disposal_price || '0') - selectedAsset.current_book_value : 0;

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(route('aset.disposals.store'), {
            onError: () => toast.error('Gagal menyimpan data.'),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Buat Disposal Aset" />

            <div className="space-y-6 p-4">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div>
                                    <Button type="button" variant="outline" onClick={() => router.visit(route('aset.disposals.index'))} className="flex items-center gap-2">
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div>
                                    <CardTitle>Buat Disposal Aset</CardTitle>
                                    <CardDescription>Buat pengajuan penghapusan/pelepasan aset.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="disposal_number">Nomor Disposal <span className="text-red-500">*</span></Label>
                                    <Input id="disposal_number" value={data.disposal_number} onChange={(e) => setData('disposal_number', e.target.value)} />
                                    {errors.disposal_number && <p className="text-sm text-red-500">{errors.disposal_number}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="disposal_date">Tanggal Disposal <span className="text-red-500">*</span></Label>
                                    <Input id="disposal_date" type="date" value={data.disposal_date} onChange={(e) => setData('disposal_date', e.target.value)} />
                                    {errors.disposal_date && <p className="text-sm text-red-500">{errors.disposal_date}</p>}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Aset <span className="text-red-500">*</span></Label>
                                    <Select value={data.asset_id} onValueChange={(v) => setData('asset_id', v)}>
                                        <SelectTrigger><SelectValue placeholder="Pilih aset..." /></SelectTrigger>
                                        <SelectContent>
                                            {assets.map((a) => (
                                                <SelectItem key={a.id} value={a.id.toString()}>{a.code} - {a.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.asset_id && <p className="text-sm text-red-500">{errors.asset_id}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>Metode Disposal <span className="text-red-500">*</span></Label>
                                    <Select value={data.disposal_method} onValueChange={(v) => setData('disposal_method', v)}>
                                        <SelectTrigger><SelectValue placeholder="Pilih metode..." /></SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(methodLabels).map(([k, v]) => (
                                                <SelectItem key={k} value={k}>{v}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.disposal_method && <p className="text-sm text-red-500">{errors.disposal_method}</p>}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="disposal_price">Harga Disposal <span className="text-red-500">*</span></Label>
                                    <Input id="disposal_price" type="number" min="0" value={data.disposal_price} onChange={(e) => setData('disposal_price', e.target.value)} />
                                    {errors.disposal_price && <p className="text-sm text-red-500">{errors.disposal_price}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="buyer_info">Info Pembeli</Label>
                                    <Input id="buyer_info" value={data.buyer_info} onChange={(e) => setData('buyer_info', e.target.value)} placeholder="Opsional" />
                                    {errors.buyer_info && <p className="text-sm text-red-500">{errors.buyer_info}</p>}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="reason">Alasan <span className="text-red-500">*</span></Label>
                                <Textarea id="reason" value={data.reason} onChange={(e) => setData('reason', e.target.value)} rows={3} />
                                {errors.reason && <p className="text-sm text-red-500">{errors.reason}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="notes">Catatan</Label>
                                <Textarea id="notes" value={data.notes} onChange={(e) => setData('notes', e.target.value)} rows={3} placeholder="Opsional" />
                                {errors.notes && <p className="text-sm text-red-500">{errors.notes}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {selectedAsset && (
                        <Card>
                            <CardHeader><CardTitle className="text-base">Estimasi Keuangan</CardTitle></CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Harga Perolehan</p>
                                        <p className="text-sm font-semibold">{fmt(selectedAsset.acquisition_cost)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Nilai Buku Saat Ini</p>
                                        <p className="text-sm font-semibold">{fmt(selectedAsset.current_book_value)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Estimasi Laba/Rugi</p>
                                        <p className={`text-sm font-semibold ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {fmt(gainLoss)}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <div className="flex justify-end space-x-4">
                        <Button type="button" variant="outline" onClick={() => router.visit(route('aset.disposals.index'))}>Batal</Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {processing ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
