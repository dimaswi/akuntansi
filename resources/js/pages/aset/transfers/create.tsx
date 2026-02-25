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

interface Asset { id: number; code: string; name: string; department_id: number | null; department?: { id: number; name: string } }
interface Department { id: number; name: string }
interface Props extends SharedData { assets: Asset[]; departments: Department[]; generatedNumber: string }

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Aset', href: route('aset.dashboard') },
    { title: 'Transfer', href: route('aset.transfers.index') },
    { title: 'Buat Baru', href: '#' },
];

export default function CreateTransfer() {
    const { assets, departments, generatedNumber } = usePage<Props>().props;
    const { data, setData, post, processing, errors } = useForm({
        transfer_number: generatedNumber,
        asset_id: '',
        from_department_id: '',
        to_department_id: '',
        transfer_date: new Date().toISOString().split('T')[0],
        reason: '',
        notes: '',
    });

    function handleAssetChange(value: string) {
        setData((prev) => {
            const asset = assets.find((a) => a.id.toString() === value);
            return { ...prev, asset_id: value, from_department_id: asset?.department_id?.toString() ?? '' };
        });
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(route('aset.transfers.store'), {
            onError: () => toast.error('Gagal menyimpan data.'),
        });
    }

    const fromDept = departments.find((d) => d.id.toString() === data.from_department_id);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Buat Transfer Aset" />

            <div className="space-y-6 p-4">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div>
                                    <Button type="button" variant="outline" onClick={() => router.visit(route('aset.transfers.index'))} className="flex items-center gap-2">
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div>
                                    <CardTitle>Buat Transfer Aset</CardTitle>
                                    <CardDescription>Buat pengajuan transfer/mutasi aset antar departemen.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="transfer_number">Nomor Transfer <span className="text-red-500">*</span></Label>
                                    <Input id="transfer_number" value={data.transfer_number} onChange={(e) => setData('transfer_number', e.target.value)} />
                                    {errors.transfer_number && <p className="text-sm text-red-500">{errors.transfer_number}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="transfer_date">Tanggal Transfer <span className="text-red-500">*</span></Label>
                                    <Input id="transfer_date" type="date" value={data.transfer_date} onChange={(e) => setData('transfer_date', e.target.value)} />
                                    {errors.transfer_date && <p className="text-sm text-red-500">{errors.transfer_date}</p>}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Aset <span className="text-red-500">*</span></Label>
                                <Select value={data.asset_id} onValueChange={handleAssetChange}>
                                    <SelectTrigger><SelectValue placeholder="Pilih aset..." /></SelectTrigger>
                                    <SelectContent>
                                        {assets.map((a) => (
                                            <SelectItem key={a.id} value={a.id.toString()}>
                                                {a.code} - {a.name} ({a.department?.name ?? '-'})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.asset_id && <p className="text-sm text-red-500">{errors.asset_id}</p>}
                            </div>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Dari Departemen</Label>
                                    <Input value={fromDept?.name ?? '-'} disabled />
                                    {errors.from_department_id && <p className="text-sm text-red-500">{errors.from_department_id}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>Ke Departemen <span className="text-red-500">*</span></Label>
                                    <Select value={data.to_department_id} onValueChange={(v) => setData('to_department_id', v)}>
                                        <SelectTrigger><SelectValue placeholder="Pilih departemen tujuan..." /></SelectTrigger>
                                        <SelectContent>
                                            {departments
                                                .filter((d) => d.id.toString() !== data.from_department_id)
                                                .map((d) => (
                                                    <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.to_department_id && <p className="text-sm text-red-500">{errors.to_department_id}</p>}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="reason">Alasan</Label>
                                <Textarea id="reason" value={data.reason} onChange={(e) => setData('reason', e.target.value)} rows={3} placeholder="Opsional" />
                                {errors.reason && <p className="text-sm text-red-500">{errors.reason}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="notes">Catatan</Label>
                                <Textarea id="notes" value={data.notes} onChange={(e) => setData('notes', e.target.value)} rows={3} placeholder="Opsional" />
                                {errors.notes && <p className="text-sm text-red-500">{errors.notes}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end space-x-4">
                        <Button type="button" variant="outline" onClick={() => router.visit(route('aset.transfers.index'))}>Batal</Button>
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
