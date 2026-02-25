import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Landmark, Save } from 'lucide-react';
import { toast } from '@/lib/toast';
import { route } from 'ziggy-js';

interface Maintenance {
    id: number; maintenance_number: string; asset_id: number; type: string;
    description: string; status: string; scheduled_date: string; start_date: string | null;
    completion_date: string | null; cost: number; vendor: string | null; vendor_contact: string | null;
    notes: string | null; asset: { id: number; code: string; name: string };
}
interface Props extends SharedData { maintenance: Maintenance }

const breadcrumbs: BreadcrumbItem[] = [
    { title: <Landmark className="h-4 w-4" />, href: route('aset.dashboard') },
    { title: 'Maintenance', href: route('aset.maintenances.index') },
    { title: 'Edit', href: '#' },
];

export default function EditMaintenance() {
    const { maintenance: m } = usePage<Props>().props;

    const { data, setData, put, processing, errors } = useForm({
        type: m.type,
        description: m.description,
        status: m.status,
        scheduled_date: m.scheduled_date,
        start_date: m.start_date ?? '',
        completion_date: m.completion_date ?? '',
        cost: m.cost,
        vendor: m.vendor ?? '',
        vendor_contact: m.vendor_contact ?? '',
        notes: m.notes ?? '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('aset.maintenances.update', m.id), {
            onError: () => toast.error('Gagal memperbarui maintenance'),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${m.maintenance_number}`} />

            <div className="space-y-6 p-4">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div>
                                    <Button type="button" variant="outline" onClick={() => window.history.back()} className="flex items-center gap-2">
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div>
                                    <CardTitle>Edit Maintenance  {m.maintenance_number}</CardTitle>
                                    <CardDescription>Aset: {m.asset.code} - {m.asset.name}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="type">Tipe</Label>
                                    <Select value={data.type} onValueChange={(v) => setData('type', v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="preventive">Preventif</SelectItem>
                                            <SelectItem value="corrective">Korektif</SelectItem>
                                            <SelectItem value="emergency">Darurat</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select value={data.status} onValueChange={(v) => setData('status', v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="scheduled">Dijadwalkan</SelectItem>
                                            <SelectItem value="in_progress">Dalam Proses</SelectItem>
                                            <SelectItem value="completed">Selesai</SelectItem>
                                            <SelectItem value="cancelled">Dibatalkan</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Deskripsi</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                    className={errors.description ? 'border-red-500' : ''}
                                />
                                {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="scheduled_date">Tanggal Jadwal</Label>
                                    <Input id="scheduled_date" type="date" value={data.scheduled_date} onChange={(e) => setData('scheduled_date', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="start_date">Tanggal Mulai</Label>
                                    <Input id="start_date" type="date" value={data.start_date} onChange={(e) => setData('start_date', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="completion_date">Tanggal Selesai</Label>
                                    <Input id="completion_date" type="date" value={data.completion_date} onChange={(e) => setData('completion_date', e.target.value)} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="cost">Biaya</Label>
                                    <Input id="cost" type="number" min={0} value={data.cost} onChange={(e) => setData('cost', parseFloat(e.target.value) || 0)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="vendor">Vendor</Label>
                                    <Input id="vendor" value={data.vendor} onChange={(e) => setData('vendor', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="vendor_contact">Kontak Vendor</Label>
                                    <Input id="vendor_contact" value={data.vendor_contact} onChange={(e) => setData('vendor_contact', e.target.value)} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Catatan</Label>
                                <Textarea id="notes" value={data.notes} onChange={(e) => setData('notes', e.target.value)} rows={2} />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end space-x-4">
                        <Button type="button" variant="outline" onClick={() => router.visit(route('aset.maintenances.show', m.id))}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
