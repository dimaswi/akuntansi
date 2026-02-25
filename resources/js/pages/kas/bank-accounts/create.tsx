import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Arrow } from '@radix-ui/react-tooltip';
import { ArrowLeft, Building2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

interface DaftarAkun {
    id: number;
    kode_akun: string;
    nama_akun: string;
    jenis_akun: string;
}

interface Props {
    shared: SharedData;
    breadcrumbs: BreadcrumbItem[];
    daftarAkunBank: DaftarAkun[];
    [key: string]: any;
}

const breadcrumbs = [
    { title: <Building2 className="h-4 w-4" />, href: route('kas.index') },
    { title: 'Bank Account', href: route('kas.bank-accounts.index') },
    { title: 'Tambah Bank Account', href: '#' },
];

export default function CreateBankAccount() {
    const { shared, daftarAkunBank } = usePage<Props>().props;

    const { data, setData, post, processing, errors, reset } = useForm({
        kode_rekening: '',
        nama_bank: '',
        nama_rekening: '',
        nomor_rekening: '',
        cabang: '',
        saldo_awal: '',
        jenis_rekening: '',
        daftar_akun_id: '',
        keterangan: '',
        is_aktif: true as boolean,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();

        post(route('kas.bank-accounts.store'), {
            onSuccess: () => {
                toast.success('Bank Account berhasil ditambahkan');
                // Reset form untuk membuat bank account baru
                reset();
                setData({
                    kode_rekening: '',
                    nama_bank: '',
                    nama_rekening: '',
                    nomor_rekening: '',
                    cabang: '',
                    saldo_awal: '',
                    jenis_rekening: '',
                    daftar_akun_id: '',
                    keterangan: '',
                    is_aktif: true,
                });
            },
            onError: (errors) => {
                console.error('Form errors:', errors);
                toast.error('Terjadi kesalahan saat menyimpan data');
            },
        });
    }

    function submitAndGoBack(e: React.FormEvent) {
        e.preventDefault();

        post(route('kas.bank-accounts.store'), {
            onSuccess: () => {
                toast.success('Bank Account berhasil ditambahkan');
                router.visit(route('kas.bank-accounts.index'));
            },
            onError: (errors) => {
                console.error('Form errors:', errors);
                toast.error('Terjadi kesalahan saat menyimpan data');
            },
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Bank Account" />

            <div className="space-y-6 p-4">
                <form onSubmit={submit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className='flex items-center gap-2'>
                                <div>
                                    <Button type="button" variant="outline" onClick={() => window.history.back()} className="flex items-center gap-2">
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div>
                                    <CardTitle>Informasi Bank Account</CardTitle>
                                    <CardDescription>Isi informasi lengkap rekening bank yang akan ditambahkan</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="kode_rekening">
                                        Kode Rekening <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="kode_rekening"
                                        type="text"
                                        value={data.kode_rekening}
                                        onChange={(e) => setData('kode_rekening', e.target.value)}
                                        placeholder="Masukkan kode rekening"
                                        className={errors.kode_rekening ? 'border-red-500' : ''}
                                    />
                                    {errors.kode_rekening && <p className="text-sm text-red-500">{errors.kode_rekening}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="nama_bank">
                                        Nama Bank <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="nama_bank"
                                        type="text"
                                        value={data.nama_bank}
                                        onChange={(e) => setData('nama_bank', e.target.value)}
                                        placeholder="Masukkan nama bank"
                                        className={errors.nama_bank ? 'border-red-500' : ''}
                                    />
                                    {errors.nama_bank && <p className="text-sm text-red-500">{errors.nama_bank}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="nama_rekening">
                                        Nama Rekening <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="nama_rekening"
                                        type="text"
                                        value={data.nama_rekening}
                                        onChange={(e) => setData('nama_rekening', e.target.value)}
                                        placeholder="Masukkan nama pemilik rekening"
                                        className={errors.nama_rekening ? 'border-red-500' : ''}
                                    />
                                    {errors.nama_rekening && <p className="text-sm text-red-500">{errors.nama_rekening}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="nomor_rekening">
                                        Nomor Rekening <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="nomor_rekening"
                                        type="text"
                                        value={data.nomor_rekening}
                                        onChange={(e) => setData('nomor_rekening', e.target.value)}
                                        placeholder="Masukkan nomor rekening"
                                        className={errors.nomor_rekening ? 'border-red-500' : ''}
                                    />
                                    {errors.nomor_rekening && <p className="text-sm text-red-500">{errors.nomor_rekening}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="cabang">Cabang</Label>
                                    <Input
                                        id="cabang"
                                        type="text"
                                        value={data.cabang}
                                        onChange={(e) => setData('cabang', e.target.value)}
                                        placeholder="Masukkan nama cabang"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="jenis_rekening">
                                        Jenis Rekening <span className="text-red-500">*</span>
                                    </Label>
                                    <Select value={data.jenis_rekening} onValueChange={(value) => setData('jenis_rekening', value)}>
                                        <SelectTrigger className={errors.jenis_rekening ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Pilih jenis rekening" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="tabungan">Tabungan</SelectItem>
                                            <SelectItem value="giro">Giro</SelectItem>
                                            <SelectItem value="deposito">Deposito</SelectItem>
                                            <SelectItem value="kredit">Kredit</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.jenis_rekening && <p className="text-sm text-red-500">{errors.jenis_rekening}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="saldo_awal">
                                        Saldo Awal <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="saldo_awal"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={data.saldo_awal}
                                        onChange={(e) => setData('saldo_awal', e.target.value)}
                                        placeholder="0.00"
                                        className={errors.saldo_awal ? 'border-red-500' : ''}
                                    />
                                    {errors.saldo_awal && <p className="text-sm text-red-500">{errors.saldo_awal}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="daftar_akun_id">
                                        Akun Terkait <span className="text-red-500">*</span>
                                    </Label>
                                    <Select value={data.daftar_akun_id} onValueChange={(value) => setData('daftar_akun_id', value)}>
                                        <SelectTrigger className={errors.daftar_akun_id ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Pilih akun terkait" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(daftarAkunBank || []).map((akun) => (
                                                <SelectItem key={akun.id} value={akun.id.toString()}>
                                                    {akun.kode_akun} - {akun.nama_akun}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.daftar_akun_id && <p className="text-sm text-red-500">{errors.daftar_akun_id}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="keterangan">Keterangan</Label>
                                <Textarea
                                    id="keterangan"
                                    value={data.keterangan}
                                    onChange={(e) => setData('keterangan', e.target.value)}
                                    placeholder="Masukkan keterangan (opsional)"
                                    rows={3}
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="is_aktif"
                                    checked={data.is_aktif}
                                    onCheckedChange={(checked) => setData('is_aktif', checked as boolean)}
                                />
                                <Label htmlFor="is_aktif">Rekening Aktif</Label>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end space-x-4">
                        <Button type="button" variant="outline" onClick={() => router.visit(route('kas.bank-accounts.index'))}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing && <Save className="mr-2 h-4 w-4 animate-spin" />}
                            {!processing && <Save className="mr-2 h-4 w-4" />}
                            Simpan & Buat Lagi
                        </Button>
                        <Button type="button" variant="secondary" onClick={submitAndGoBack} disabled={processing}>
                            {processing && <Save className="mr-2 h-4 w-4 animate-spin" />}
                            {!processing && <Save className="mr-2 h-4 w-4" />}
                            Simpan & Kembali
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
