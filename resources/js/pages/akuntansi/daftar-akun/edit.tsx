import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableAccountSelect } from "@/components/ui/searchable-account-select";
import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem, SharedData } from "@/types";
import { Head, router, useForm } from "@inertiajs/react";
import { ArrowLeft, Calculator, Save } from "lucide-react";
import { toast } from "sonner";

interface DaftarAkun {
    id: number;
    kode_akun: string;
    nama_akun: string;
    jenis_akun: string;
    sub_jenis: string;
    saldo_normal: string;
    induk_akun_id: number | null;
    level: number;
    is_aktif: boolean;
    keterangan: string;
}

interface IndukAkun {
    id: number;
    kode_akun: string;
    nama_akun: string;
    jenis_akun: string;
}

interface Props extends SharedData {
    daftarAkun: DaftarAkun;
    indukAkun: IndukAkun[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: <Calculator className="h-4 w-4" />,
        href: '/akuntansi',
    },
    {
        title: 'Daftar Akun',
        href: '/akuntansi/daftar-akun',
    },
    {
        title: 'Edit',
        href: '#',
    },
];

const jenisAkunOptions = [
    { value: 'aset', label: 'Aset' },
    { value: 'kewajiban', label: 'Kewajiban' },
    { value: 'modal', label: 'Modal' },
    { value: 'pendapatan', label: 'Pendapatan' },
    { value: 'beban', label: 'Beban' },
];

const subJenisOptions = {
    aset: [
        { value: 'aset_lancar', label: 'Aset Lancar' },
        { value: 'aset_tetap', label: 'Aset Tetap' },
        { value: 'aset_lainnya', label: 'Aset Lainnya' },
    ],
    kewajiban: [
        { value: 'kewajiban_lancar', label: 'Kewajiban Lancar' },
        { value: 'kewajiban_jangka_panjang', label: 'Kewajiban Jangka Panjang' },
    ],
    modal: [
        { value: 'modal_saham', label: 'Modal Saham' },
        { value: 'laba_ditahan', label: 'Laba Ditahan' },
    ],
    pendapatan: [
        { value: 'pendapatan_usaha', label: 'Pendapatan Usaha' },
        { value: 'pendapatan_lainnya', label: 'Pendapatan Lainnya' },
    ],
    beban: [
        { value: 'harga_pokok_penjualan', label: 'Harga Pokok Penjualan' },
        { value: 'beban_usaha', label: 'Beban Usaha' },
        { value: 'beban_lainnya', label: 'Beban Lainnya' },
    ],
};

export default function DaftarAkunEdit({ daftarAkun, indukAkun }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        kode_akun: daftarAkun.kode_akun,
        nama_akun: daftarAkun.nama_akun,
        jenis_akun: daftarAkun.jenis_akun,
        sub_jenis: daftarAkun.sub_jenis,
        saldo_normal: daftarAkun.saldo_normal as 'debit' | 'kredit',
        induk_akun_id: daftarAkun.induk_akun_id?.toString() || '',
        level: daftarAkun.level,
        is_aktif: daftarAkun.is_aktif,
        keterangan: daftarAkun.keterangan || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        put(`/akuntansi/daftar-akun/${daftarAkun.id}`, {
            onSuccess: () => {
                toast.success('Akun berhasil diperbarui');
                router.visit('/akuntansi/daftar-akun');
            },
            onError: () => {
                toast.error('Gagal memperbarui akun');
            },
        });
    };

    const handleJenisAkunChange = (value: string) => {
        setData({
            ...data,
            jenis_akun: value,
            sub_jenis: '',
            saldo_normal: ['aset', 'beban'].includes(value) ? 'debit' : 'kredit',
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Akun - ${daftarAkun.nama_akun}`} />
            <div className="p-4">
                <div className="mb-4">
                    <Button
                        variant="outline"
                        onClick={() => router.visit('/akuntansi/daftar-akun')}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Kembali
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Edit Daftar Akun</CardTitle>
                        <CardDescription>
                            Perbarui informasi akun {daftarAkun.kode_akun} - {daftarAkun.nama_akun}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Kode Akun */}
                                <div className="space-y-2">
                                    <Label htmlFor="kode_akun">Kode Akun *</Label>
                                    <Input
                                        id="kode_akun"
                                        type="text"
                                        value={data.kode_akun}
                                        onChange={(e) => setData('kode_akun', e.target.value)}
                                        placeholder="Contoh: 1100"
                                        className={errors.kode_akun ? 'border-red-500' : ''}
                                    />
                                    {errors.kode_akun && (
                                        <p className="text-sm text-red-500">{errors.kode_akun}</p>
                                    )}
                                </div>

                                {/* Nama Akun */}
                                <div className="space-y-2">
                                    <Label htmlFor="nama_akun">Nama Akun *</Label>
                                    <Input
                                        id="nama_akun"
                                        type="text"
                                        value={data.nama_akun}
                                        onChange={(e) => setData('nama_akun', e.target.value)}
                                        placeholder="Contoh: Kas dan Bank"
                                        className={errors.nama_akun ? 'border-red-500' : ''}
                                    />
                                    {errors.nama_akun && (
                                        <p className="text-sm text-red-500">{errors.nama_akun}</p>
                                    )}
                                </div>

                                {/* Jenis Akun */}
                                <div className="space-y-2">
                                    <Label htmlFor="jenis_akun">Jenis Akun *</Label>
                                    <Select
                                        value={data.jenis_akun}
                                        onValueChange={handleJenisAkunChange}
                                    >
                                        <SelectTrigger className={errors.jenis_akun ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Pilih jenis akun" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {jenisAkunOptions.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.jenis_akun && (
                                        <p className="text-sm text-red-500">{errors.jenis_akun}</p>
                                    )}
                                </div>

                                {/* Sub Jenis */}
                                <div className="space-y-2">
                                    <Label htmlFor="sub_jenis">Sub Jenis *</Label>
                                    <Select
                                        value={data.sub_jenis}
                                        onValueChange={(value) => setData('sub_jenis', value)}
                                        disabled={!data.jenis_akun}
                                    >
                                        <SelectTrigger className={errors.sub_jenis ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Pilih sub jenis" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {data.jenis_akun && subJenisOptions[data.jenis_akun as keyof typeof subJenisOptions]?.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.sub_jenis && (
                                        <p className="text-sm text-red-500">{errors.sub_jenis}</p>
                                    )}
                                </div>

                                {/* Saldo Normal */}
                                <div className="space-y-2">
                                    <Label htmlFor="saldo_normal">Saldo Normal *</Label>
                                    <Select
                                        value={data.saldo_normal}
                                        onValueChange={(value: 'debit' | 'kredit') => setData('saldo_normal', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="debit">Debit</SelectItem>
                                            <SelectItem value="kredit">Kredit</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Induk Akun */}
                                <div className="space-y-2">
                                    <SearchableAccountSelect
                                        accounts={indukAkun}
                                        value={data.induk_akun_id}
                                        onValueChange={(value) => setData('induk_akun_id', value)}
                                        label="Induk Akun"
                                        placeholder="Pilih induk akun (opsional)"
                                        error={errors.induk_akun_id}
                                    />
                                </div>

                                {/* Level */}
                                <div className="space-y-2">
                                    <Label htmlFor="level">Level</Label>
                                    <Input
                                        id="level"
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={data.level}
                                        onChange={(e) => setData('level', parseInt(e.target.value))}
                                    />
                                </div>

                                {/* Status Aktif */}
                                <div className="space-y-2">
                                    <Label htmlFor="is_aktif">Status</Label>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="is_aktif"
                                            checked={data.is_aktif}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData('is_aktif', e.target.checked)}
                                            className="h-4 w-4"
                                        />
                                        <Label htmlFor="is_aktif">
                                            {data.is_aktif ? 'Aktif' : 'Tidak Aktif'}
                                        </Label>
                                    </div>
                                </div>
                            </div>

                            {/* Keterangan */}
                            <div className="space-y-2">
                                <Label htmlFor="keterangan">Keterangan</Label>
                                <textarea
                                    id="keterangan"
                                    value={data.keterangan}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('keterangan', e.target.value)}
                                    placeholder="Keterangan tambahan (opsional)"
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <Button type="submit" disabled={processing}>
                                    {processing ? (
                                        <>
                                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Perbarui
                                        </>
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.visit('/akuntansi/daftar-akun')}
                                >
                                    Batal
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
