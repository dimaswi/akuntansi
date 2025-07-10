import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem, SharedData } from "@/types";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import { Save, ArrowLeft, Wallet, AlertCircle } from "lucide-react";
import { FormEventHandler } from "react";
import { toast } from "sonner";

interface DaftarAkunKas {
    id: number;
    kode_akun: string;
    nama_akun: string;
    jenis_akun: string;
}

interface Props extends SharedData {
    daftarAkunKas: DaftarAkunKas[];
    jenisTransaksi: Record<string, string>;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: <Wallet className="h-4 w-4" />,
        href: '/kas',
    },
    {
        title: 'Transaksi Kas',
        href: '/kas/cash-transactions',
    },
    {
        title: 'Tambah Transaksi',
        href: '#',
    },
];

export default function CashTransactionCreate() {
    const { daftarAkunKas, jenisTransaksi } = usePage<Props>().props;
    
    const { data, setData, post, processing, errors } = useForm({
        nomor_transaksi: '',
        tanggal_transaksi: new Date().toISOString().split('T')[0],
        jenis_transaksi: '',
        kategori_transaksi: '',
        jumlah: '',
        keterangan: '',
        pihak_terkait: '',
        referensi: '',
        daftar_akun_kas_id: '',
    });

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        
        post('/kas/cash-transactions', {
            onSuccess: () => {
                toast.success('Transaksi kas berhasil dibuat');
                // Reset form untuk membuat transaksi baru
                setData({
                    nomor_transaksi: '',
                    tanggal_transaksi: new Date().toISOString().split('T')[0],
                    jenis_transaksi: '',
                    kategori_transaksi: '',
                    jumlah: '',
                    keterangan: '',
                    pihak_terkait: '',
                    referensi: '',
                    daftar_akun_kas_id: '',
                });
            },
            onError: () => {
                toast.error('Gagal membuat transaksi kas');
            },
        });
    };

    const handleSubmitAndGoBack: FormEventHandler = (e) => {
        e.preventDefault();
        
        post('/kas/cash-transactions', {
            onSuccess: () => {
                toast.success('Transaksi kas berhasil dibuat');
                router.visit('/kas/cash-transactions');
            },
            onError: () => {
                toast.error('Gagal membuat transaksi kas');
            },
        });
    };

    const formatCurrency = (value: string) => {
        // Remove non-numeric characters except decimal point
        const numericValue = value.replace(/[^\d]/g, '');
        if (numericValue === '') return '';
        
        // Format as currency
        const number = parseInt(numericValue);
        return new Intl.NumberFormat('id-ID').format(number);
    };

    const handleJumlahChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        const formattedValue = formatCurrency(inputValue);
        const numericValue = inputValue.replace(/[^\d]/g, '');
        
        // Display formatted value
        e.target.value = formattedValue;
        // Store numeric value for form submission
        setData('jumlah', numericValue);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Transaksi Kas" />
            <div className="p-4">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Wallet className="h-5 w-5" />
                                    Tambah Transaksi Kas
                                </CardTitle>
                                <CardDescription>
                                    Buat transaksi penerimaan atau pengeluaran kas baru
                                </CardDescription>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => router.visit('/kas/cash-transactions')}
                                className="gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Kembali
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Nomor Transaksi */}
                                <div className="space-y-2">
                                    <Label htmlFor="nomor_transaksi">Nomor Transaksi</Label>
                                    <Input
                                        id="nomor_transaksi"
                                        type="text"
                                        value={data.nomor_transaksi}
                                        onChange={(e) => setData('nomor_transaksi', e.target.value)}
                                        placeholder="Kosongkan untuk auto generate"
                                        className={errors.nomor_transaksi ? 'border-red-500' : ''}
                                    />
                                    {errors.nomor_transaksi && (
                                        <p className="text-sm text-red-500">{errors.nomor_transaksi}</p>
                                    )}
                                </div>

                                {/* Tanggal Transaksi */}
                                <div className="space-y-2">
                                    <Label htmlFor="tanggal_transaksi">Tanggal Transaksi *</Label>
                                    <Input
                                        id="tanggal_transaksi"
                                        type="date"
                                        value={data.tanggal_transaksi}
                                        onChange={(e) => setData('tanggal_transaksi', e.target.value)}
                                        className={errors.tanggal_transaksi ? 'border-red-500' : ''}
                                        required
                                    />
                                    {errors.tanggal_transaksi && (
                                        <p className="text-sm text-red-500">{errors.tanggal_transaksi}</p>
                                    )}
                                </div>

                                {/* Jenis Transaksi */}
                                <div className="space-y-2">
                                    <Label htmlFor="jenis_transaksi">Jenis Transaksi *</Label>
                                    <Select
                                        value={data.jenis_transaksi || undefined}
                                        onValueChange={(value) => setData('jenis_transaksi', value)}
                                        required
                                    >
                                        <SelectTrigger className={errors.jenis_transaksi ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Pilih jenis transaksi" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="penerimaan">Penerimaan Kas</SelectItem>
                                            <SelectItem value="pengeluaran">Pengeluaran Kas</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.jenis_transaksi && (
                                        <p className="text-sm text-red-500">{errors.jenis_transaksi}</p>
                                    )}
                                </div>

                                {/* Kategori Transaksi */}
                                <div className="space-y-2">
                                    <Label htmlFor="kategori_transaksi">Kategori Transaksi *</Label>
                                    <Select
                                        value={data.kategori_transaksi || undefined}
                                        onValueChange={(value) => setData('kategori_transaksi', value)}
                                        required
                                    >
                                        <SelectTrigger className={errors.kategori_transaksi ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Pilih kategori transaksi" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {data.jenis_transaksi === 'penerimaan' ? (
                                                <>
                                                    <SelectItem value="penjualan">Penjualan</SelectItem>
                                                    <SelectItem value="piutang">Pelunasan Piutang</SelectItem>
                                                    <SelectItem value="investasi">Investasi/Modal</SelectItem>
                                                    <SelectItem value="bunga">Bunga Bank</SelectItem>
                                                    <SelectItem value="lain_lain">Lain-lain</SelectItem>
                                                </>
                                            ) : data.jenis_transaksi === 'pengeluaran' ? (
                                                <>
                                                    <SelectItem value="pembelian">Pembelian</SelectItem>
                                                    <SelectItem value="gaji">Gaji/Upah</SelectItem>
                                                    <SelectItem value="operasional">Biaya Operasional</SelectItem>
                                                    <SelectItem value="pinjaman">Pembayaran Pinjaman</SelectItem>
                                                    <SelectItem value="lain_lain">Lain-lain</SelectItem>
                                                </>
                                            ) : (
                                                <SelectItem value="none" disabled>Pilih jenis transaksi terlebih dahulu</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {errors.kategori_transaksi && (
                                        <p className="text-sm text-red-500">{errors.kategori_transaksi}</p>
                                    )}
                                </div>

                                {/* Jumlah */}
                                <div className="space-y-2">
                                    <Label htmlFor="jumlah">Jumlah *</Label>
                                    <Input
                                        id="jumlah"
                                        type="text"
                                        placeholder="0"
                                        onChange={handleJumlahChange}
                                        className={errors.jumlah ? 'border-red-500' : ''}
                                        required
                                    />
                                    {errors.jumlah && (
                                        <p className="text-sm text-red-500">{errors.jumlah}</p>
                                    )}
                                </div>

                                {/* Akun Kas */}
                                <div className="space-y-2">
                                    <Label htmlFor="daftar_akun_kas_id">Akun Kas *</Label>
                                    <Select
                                        value={data.daftar_akun_kas_id || undefined}
                                        onValueChange={(value) => setData('daftar_akun_kas_id', value)}
                                        required
                                    >
                                        <SelectTrigger className={errors.daftar_akun_kas_id ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Pilih akun kas" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {daftarAkunKas.map((akun) => (
                                                <SelectItem key={akun.id} value={akun.id.toString()}>
                                                    {akun.kode_akun} - {akun.nama_akun}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.daftar_akun_kas_id && (
                                        <p className="text-sm text-red-500">{errors.daftar_akun_kas_id}</p>
                                    )}
                                </div>

                                {/* Pihak Terkait */}
                                <div className="space-y-2">
                                    <Label htmlFor="pihak_terkait">Pihak Terkait</Label>
                                    <Input
                                        id="pihak_terkait"
                                        type="text"
                                        value={data.pihak_terkait}
                                        onChange={(e) => setData('pihak_terkait', e.target.value)}
                                        placeholder="Nama pihak terkait"
                                        className={errors.pihak_terkait ? 'border-red-500' : ''}
                                    />
                                    {errors.pihak_terkait && (
                                        <p className="text-sm text-red-500">{errors.pihak_terkait}</p>
                                    )}
                                </div>

                                {/* Referensi */}
                                <div className="space-y-2">
                                    <Label htmlFor="referensi">Referensi</Label>
                                    <Input
                                        id="referensi"
                                        type="text"
                                        value={data.referensi}
                                        onChange={(e) => setData('referensi', e.target.value)}
                                        placeholder="Nomor referensi"
                                        className={errors.referensi ? 'border-red-500' : ''}
                                    />
                                    {errors.referensi && (
                                        <p className="text-sm text-red-500">{errors.referensi}</p>
                                    )}
                                </div>
                            </div>

                            {/* Keterangan */}
                            <div className="space-y-2">
                                <Label htmlFor="keterangan">Keterangan *</Label>
                                <Textarea
                                    id="keterangan"
                                    value={data.keterangan}
                                    onChange={(e) => setData('keterangan', e.target.value)}
                                    placeholder="Keterangan transaksi"
                                    className={errors.keterangan ? 'border-red-500' : ''}
                                    rows={3}
                                    required
                                />
                                {errors.keterangan && (
                                    <p className="text-sm text-red-500">{errors.keterangan}</p>
                                )}
                            </div>

                            {/* Info */}
                            <Alert className="border-blue-200 bg-blue-50">
                                <AlertCircle className="h-4 w-4 text-blue-600" />
                                <AlertDescription className="text-blue-800">
                                    <strong>Info Workflow Baru:</strong> Transaksi kas akan disimpan dengan status draft 
                                    dan tidak langsung membuat jurnal. Akuntan akan melakukan posting ke jurnal secara batch 
                                    dengan memilih akun lawan yang sesuai.
                                </AlertDescription>
                            </Alert>

                            {/* Submit Button */}
                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.visit('/kas/cash-transactions')}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="gap-2"
                                >
                                    {processing ? (
                                        <>
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            Simpan & Buat Lagi
                                        </>
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={handleSubmitAndGoBack}
                                    disabled={processing}
                                    className="gap-2"
                                >
                                    {processing ? (
                                        <>
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            Simpan & Kembali
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
