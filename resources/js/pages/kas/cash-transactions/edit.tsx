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
import { SearchableAccountSelect } from "@/components/ui/searchable-account-select";
import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem, SharedData } from "@/types";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import { Save, ArrowLeft, Wallet, AlertCircle } from "lucide-react";
import { FormEventHandler } from "react";
import { toast } from "sonner";

interface DaftarAkun {
    id: number;
    kode_akun: string;
    nama_akun: string;
    jenis_akun: string;
}

interface CashTransaction {
    id: number;
    nomor_transaksi: string;
    tanggal_transaksi: string;
    jenis_transaksi: string;
    jumlah: number;
    keterangan: string;
    pihak_terkait?: string;
    referensi?: string;
    daftar_akun_kas_id: number;
    daftar_akun_lawan_id: number;
    status: string;
}

interface Props extends SharedData {
    cashTransaction: CashTransaction;
    daftarAkunKas: DaftarAkun[];
    daftarAkun: DaftarAkun[];
    jenisTransaksi: Record<string, string>;
}

export default function CashTransactionEdit() {
    const { cashTransaction, daftarAkunKas, daftarAkun, jenisTransaksi } = usePage<Props>().props;

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
        title: 'Detail Transaksi',
        href: `/kas/cash-transactions/${cashTransaction.id}`,
    },
    {
        title: 'Edit Transaksi',
        href: '#',
    },
];
    
    const { data, setData, put, processing, errors } = useForm({
        tanggal_transaksi: cashTransaction.tanggal_transaksi,
        jenis_transaksi: cashTransaction.jenis_transaksi,
        jumlah: cashTransaction.jumlah.toString(),
        keterangan: cashTransaction.keterangan,
        pihak_terkait: cashTransaction.pihak_terkait || '',
        referensi: cashTransaction.referensi || '',
        daftar_akun_kas_id: cashTransaction.daftar_akun_kas_id.toString(),
        daftar_akun_lawan_id: cashTransaction.daftar_akun_lawan_id.toString(),
    });

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        
        put(`/kas/cash-transactions/${cashTransaction.id}`, {
            onSuccess: () => {
                toast.success('Transaksi kas berhasil diperbarui');
                router.visit(`/kas/cash-transactions/${cashTransaction.id}`);
            },
            onError: () => {
                toast.error('Gagal memperbarui transaksi kas');
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
            <Head title={`Edit Transaksi - ${cashTransaction.nomor_transaksi}`} />
            <div className="p-4">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Wallet className="h-5 w-5" />
                                    Edit Transaksi Kas
                                </CardTitle>
                                <CardDescription>
                                    {cashTransaction.nomor_transaksi}
                                </CardDescription>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => router.visit(`/kas/cash-transactions/${cashTransaction.id}`)}
                                className="gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Kembali
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {cashTransaction.status === 'posted' ? (
                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    Transaksi yang sudah diposting tidak dapat diedit.
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <>
                                {/* Info */}
                                <Alert className="border-blue-200 bg-blue-50 mb-6">
                                    <AlertCircle className="h-4 w-4 text-blue-600" />
                                    <AlertDescription className="text-blue-800">
                                        <strong>Panduan:</strong> Untuk penerimaan kas, pilih "Sumber Dana" dari mana uang diterima (misal: Pendapatan Penjualan). 
                                        Untuk pengeluaran kas, pilih "Tujuan Penggunaan Dana" kemana uang digunakan (misal: Biaya Operasional).
                                    </AlertDescription>
                                </Alert>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Nomor Transaksi (Read Only) */}
                                    <div className="space-y-2">
                                        <Label>Nomor Transaksi</Label>
                                        <Input
                                            value={cashTransaction.nomor_transaksi}
                                            disabled
                                            className="bg-muted"
                                        />
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
                                            value={data.jenis_transaksi}
                                            onValueChange={(value) => setData('jenis_transaksi', value)}
                                            required
                                        >
                                            <SelectTrigger className={errors.jenis_transaksi ? 'border-red-500' : ''}>
                                                <SelectValue placeholder="Pilih jenis transaksi" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(jenisTransaksi).map(([key, value]) => (
                                                    <SelectItem key={key} value={key}>
                                                        {value as string}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.jenis_transaksi && (
                                            <p className="text-sm text-red-500">{errors.jenis_transaksi}</p>
                                        )}
                                    </div>

                                    {/* Jumlah */}
                                    <div className="space-y-2">
                                        <Label htmlFor="jumlah">Jumlah *</Label>
                                        <Input
                                            id="jumlah"
                                            type="text"
                                            defaultValue={new Intl.NumberFormat('id-ID').format(cashTransaction.jumlah)}
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
                                        <SearchableAccountSelect
                                            accounts={daftarAkunKas || []}
                                            value={data.daftar_akun_kas_id}
                                            onValueChange={(value) => setData('daftar_akun_kas_id', value)}
                                            label="Akun Kas *"
                                            placeholder="Pilih akun kas"
                                            error={errors.daftar_akun_kas_id}
                                        />
                                    </div>

                                    {/* Sumber/Tujuan Dana */}
                                    <div className="space-y-2">
                                        <SearchableAccountSelect
                                            accounts={
                                                data.jenis_transaksi === 'penerimaan' || data.jenis_transaksi === 'uang_muka_penerimaan' || data.jenis_transaksi === 'transfer_masuk' 
                                                ? (daftarAkun || []).filter((akun: DaftarAkun) => 
                                                    akun.jenis_akun === 'pendapatan' || 
                                                    akun.jenis_akun === 'kewajiban' ||
                                                    akun.jenis_akun === 'modal' ||
                                                    akun.jenis_akun === 'aset'
                                                )
                                                : (daftarAkun || []).filter((akun: DaftarAkun) => 
                                                    akun.jenis_akun === 'biaya' || 
                                                    akun.jenis_akun === 'beban' ||
                                                    akun.jenis_akun === 'aset' ||
                                                    akun.jenis_akun === 'kewajiban'
                                                )
                                            }
                                            value={data.daftar_akun_lawan_id}
                                            onValueChange={(value) => setData('daftar_akun_lawan_id', value)}
                                            label={
                                                data.jenis_transaksi === 'penerimaan' || data.jenis_transaksi === 'uang_muka_penerimaan' || data.jenis_transaksi === 'transfer_masuk' ? 
                                                'Sumber Dana *' : 'Tujuan Penggunaan Dana *'
                                            }
                                            placeholder={
                                                data.jenis_transaksi === 'penerimaan' || data.jenis_transaksi === 'uang_muka_penerimaan' || data.jenis_transaksi === 'transfer_masuk' ? 
                                                'Pilih sumber dana' : 'Pilih tujuan penggunaan dana'
                                            }
                                            error={errors.daftar_akun_lawan_id}
                                        />
                                        <p className="text-xs text-gray-500">
                                            {data.jenis_transaksi === 'penerimaan' || data.jenis_transaksi === 'uang_muka_penerimaan' || data.jenis_transaksi === 'transfer_masuk' ? 
                                                'Pilih akun yang menjadi sumber dana yang diterima' : 
                                                'Pilih akun yang menjadi tujuan penggunaan dana'
                                            }
                                        </p>
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

                                {/* Submit Button */}
                                <div className="flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.visit(`/kas/cash-transactions/${cashTransaction.id}`)}
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
                                                Memperbarui...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4" />
                                                Perbarui
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}