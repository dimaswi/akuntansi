import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Banknote, Loader2 } from 'lucide-react';
import { route } from 'ziggy-js';

interface DaftarAkun {
    id: number;
    kode_akun: string;
    nama_akun: string;
    jenis_akun: string;
}

interface Props extends SharedData {
    daftarAkun: DaftarAkun[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: <Banknote className="h-4 w-4" />,
        href: '/penggajian',
    },
    {
        title: 'Penggajian',
        href: '/penggajian',
    },
    {
        title: 'Buat Batch Baru',
        href: '/penggajian/create',
    },
];

const months = [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

export default function Create({ daftarAkun }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        period_month: new Date().getMonth() + 1,
        period_year: currentYear,
        description: '',
        payment_account_id: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('penggajian.store'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Buat Batch Gaji Baru" />

            <div className="py-6">
                <div className="px-4 sm:px-6 lg:px-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Buat Batch Gaji Baru</CardTitle>
                            <CardDescription>
                                Buat batch baru untuk input data gaji karyawan per periode
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Periode */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="period_month">Bulan</Label>
                                        <SearchableSelect
                                            value={data.period_month.toString()}
                                            onValueChange={(value) => setData('period_month', parseInt(value))}
                                            options={months.map((month) => ({
                                                value: month.value.toString(),
                                                label: month.label,
                                            }))}
                                            placeholder="Pilih bulan..."
                                            searchPlaceholder="Cari bulan..."
                                        />
                                        {errors.period_month && (
                                            <p className="text-sm text-red-600">{errors.period_month}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="period_year">Tahun</Label>
                                        <SearchableSelect
                                            value={data.period_year.toString()}
                                            onValueChange={(value) => setData('period_year', parseInt(value))}
                                            options={years.map((year) => ({
                                                value: year.toString(),
                                                label: year.toString(),
                                            }))}
                                            placeholder="Pilih tahun..."
                                            searchPlaceholder="Cari tahun..."
                                        />
                                        {errors.period_year && (
                                            <p className="text-sm text-red-600">{errors.period_year}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Akun Pembayaran Gaji */}
                                <div className="space-y-2">
                                    <Label htmlFor="payment_account_id">
                                        Akun Pembayaran Gaji <span className="text-red-500">*</span>
                                    </Label>
                                    <SearchableSelect
                                        value={data.payment_account_id}
                                        onValueChange={(value) => setData('payment_account_id', value)}
                                        options={daftarAkun.map((akun) => ({
                                            value: akun.id.toString(),
                                            label: `[${akun.kode_akun}] ${akun.nama_akun}`,
                                        }))}
                                        placeholder="Pilih akun (Kas/Bank/Hutang Gaji)..."
                                        searchPlaceholder="Cari akun..."
                                        emptyText="Tidak ada akun ditemukan"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Akun ini akan di-KREDIT saat posting jurnal (untuk pembayaran gaji bersih)
                                    </p>
                                    {errors.payment_account_id && (
                                        <p className="text-sm text-red-600">{errors.payment_account_id}</p>
                                    )}
                                </div>

                                {/* Keterangan */}
                                <div className="space-y-2">
                                    <Label htmlFor="description">Keterangan (Opsional)</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Catatan atau keterangan untuk batch ini..."
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        rows={3}
                                    />
                                    {errors.description && (
                                        <p className="text-sm text-red-600">{errors.description}</p>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => window.history.back()}
                                        disabled={processing}
                                    >
                                        Batal
                                    </Button>
                                    <Button type="submit" disabled={processing}>
                                        {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Buat Batch
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
