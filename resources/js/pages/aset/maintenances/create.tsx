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

interface AssetItem { id: number; code: string; name: string }
interface Props extends SharedData { assets: AssetItem[]; generatedNumber: string }

const breadcrumbs: BreadcrumbItem[] = [
    { title: <Landmark className="h-4 w-4" />, href: route('aset.dashboard') },
    { title: 'Maintenance', href: route('aset.maintenances.index') },
    { title: 'Tambah Maintenance', href: '#' },
];

export default function CreateMaintenance() {
    const { assets, generatedNumber } = usePage<Props>().props;

    const { data, setData, post, processing, errors } = useForm({
        maintenance_number: generatedNumber,
        asset_id: '' as string,
        type: 'preventive' as string,
        description: '',
        scheduled_date: new Date().toISOString().split('T')[0],
        cost: 0,
        vendor: '',
        vendor_contact: '',
        notes: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('aset.maintenances.store'), {
            onError: () => toast.error('Gagal menambahkan maintenance'),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Maintenance" />

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
                                    <CardTitle>Informasi Maintenance</CardTitle>
                                    <CardDescription>Isi informasi jadwal maintenance aset</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="maintenance_number">
                                        Nomor <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="maintenance_number"
                                        value={data.maintenance_number}
                                        onChange={(e) => setData('maintenance_number', e.target.value)}
                                        className={errors.maintenance_number ? 'border-red-500' : ''}
                                    />
                                    {errors.maintenance_number && <p className="text-sm text-red-500">{errors.maintenance_number}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="asset_id">
                                        Aset <span className="text-red-500">*</span>
                                    </Label>
                                    <Select value={data.asset_id} onValueChange={(v) => setData('asset_id', v)}>
                                        <SelectTrigger className={errors.asset_id ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Pilih aset" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {assets.map((a) => (
                                                <SelectItem key={a.id} value={a.id.toString()}>{a.code} - {a.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.asset_id && <p className="text-sm text-red-500">{errors.asset_id}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="type">
                                        Tipe Maintenance <span className="text-red-500">*</span>
                                    </Label>
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
                                    <Label htmlFor="scheduled_date">
                                        Tanggal Jadwal <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="scheduled_date"
                                        type="date"
                                        value={data.scheduled_date}
                                        onChange={(e) => setData('scheduled_date', e.target.value)}
                                        className={errors.scheduled_date ? 'border-red-500' : ''}
                                    />
                                    {errors.scheduled_date && <p className="text-sm text-red-500">{errors.scheduled_date}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">
                                    Deskripsi <span className="text-red-500">*</span>
                                </Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                    placeholder="Jelaskan detail maintenance..."
                                    className={errors.description ? 'border-red-500' : ''}
                                />
                                {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="cost">Estimasi Biaya</Label>
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
                        <Button type="button" variant="outline" onClick={() => router.visit(route('aset.maintenances.index'))}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
