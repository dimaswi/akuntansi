import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableAccountSelectTable } from "@/components/ui/searchable-account-select-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { ArrowLeft, BookOpen, Calculator, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

interface DaftarAkun {
    id: number;
    kode_akun: string;
    nama_akun: string;
    jenis_akun: string;
    sub_jenis: string;
}

interface JurnalDetail {
    id?: number;
    daftar_akun_id: number;
    jumlah_debit: number;
    jumlah_kredit: number;
    keterangan: string;
    daftar_akun?: DaftarAkun;
}

interface User {
    id: number;
    name: string;
}

interface Jurnal {
    id: number;
    nomor_jurnal: string;
    tanggal_transaksi: string;
    jenis_referensi: string;
    nomor_referensi: string;
    keterangan: string;
    total_debit: number;
    total_kredit: number;
    status: string;
    created_at: string;
    updated_at: string;
    dibuat_oleh?: User;
    details: JurnalDetail[];
}

interface Props extends SharedData {
    jurnal: Jurnal;
    daftar_akun: DaftarAkun[];
}

interface Errors {
    [key: string]: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: <Calculator className="h-4 w-4" />,
        href: '/akuntansi',
    },
    {
        title: 'Jurnal',
        href: '/akuntansi/jurnal',
    },
    {
        title: 'Edit Jurnal',
        href: '#',
    },
];

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
};

export default function EditJurnal() {
    const { jurnal, daftar_akun } = usePage<Props>().props;
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Errors>({});

    const [formData, setFormData] = useState({
        nomor_jurnal: jurnal.nomor_jurnal,
        tanggal_transaksi: jurnal.tanggal_transaksi,
        jenis_referensi: jurnal.jenis_referensi || '',
        nomor_referensi: jurnal.nomor_referensi || '',
        keterangan: jurnal.keterangan,
    });

    const [details, setDetails] = useState<JurnalDetail[]>([]);

    useEffect(() => {
        // Initialize details from jurnal
        if (jurnal.details && jurnal.details.length > 0) {
            setDetails(
                jurnal.details.map((detail) => ({
                    id: detail.id,
                    daftar_akun_id: detail.daftar_akun_id,
                    jumlah_debit: Number(detail.jumlah_debit),
                    jumlah_kredit: Number(detail.jumlah_kredit),
                    keterangan: detail.keterangan,
                })),
            );
        } else {
            setDetails([
                { daftar_akun_id: 0, jumlah_debit: 0, jumlah_kredit: 0, keterangan: '' },
                { daftar_akun_id: 0, jumlah_debit: 0, jumlah_kredit: 0, keterangan: '' },
            ]);
        }
    }, [jurnal]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        // Validate details
        const validDetails = details.filter((detail) => detail.daftar_akun_id > 0 && (detail.jumlah_debit > 0 || detail.jumlah_kredit > 0));

        if (validDetails.length < 2) {
            toast.error('Minimal harus ada 2 baris jurnal yang valid');
            setProcessing(false);
            return;
        }

        const totalDebit = validDetails.reduce((sum, detail) => sum + detail.jumlah_debit, 0);
        const totalKredit = validDetails.reduce((sum, detail) => sum + detail.jumlah_kredit, 0);

        if (totalDebit !== totalKredit) {
            toast.error('Total debit dan kredit harus seimbang');
            setProcessing(false);
            return;
        }

        const submitData = {
            ...formData,
            details: validDetails,
        };

        router.put(route('akuntansi.jurnal.update', jurnal.id), submitData as any, {
            onSuccess: () => {
                toast.success('Jurnal berhasil diupdate');
                router.visit(route('akuntansi.jurnal.index'));
            },
            onError: (responseErrors) => {
                setErrors(responseErrors);
                toast.error('Gagal mengupdate jurnal. Periksa data yang dimasukkan.');
                setProcessing(false);
            },
            onFinish: () => {
                setProcessing(false);
            },
        });
    };

    const addDetail = () => {
        setDetails([...details, { daftar_akun_id: 0, jumlah_debit: 0, jumlah_kredit: 0, keterangan: '' }]);
    };

    const removeDetail = (index: number) => {
        if (details.length > 2) {
            const newDetails = details.filter((_, i) => i !== index);
            setDetails(newDetails);
        }
    };

    const updateDetail = (index: number, field: keyof JurnalDetail, value: any) => {
        const newDetails = [...details];
        newDetails[index] = { ...newDetails[index], [field]: value };

        // Ensure only one of debit or credit is filled
        if (field === 'jumlah_debit' && value > 0) {
            newDetails[index].jumlah_kredit = 0;
        } else if (field === 'jumlah_kredit' && value > 0) {
            newDetails[index].jumlah_debit = 0;
        }

        setDetails(newDetails);
    };

    const updateFormData = (field: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const totalDebit = details.reduce((sum, detail) => sum + (detail.jumlah_debit || 0), 0);
    const totalKredit = details.reduce((sum, detail) => sum + (detail.jumlah_kredit || 0), 0);
    const isBalanced = totalDebit === totalKredit && totalDebit > 0;

    if (jurnal.status !== 'draft') {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Edit Jurnal" />
                <div className="max-w-7xl p-4 sm:px-6 lg:px-8">
                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
                        <h2 className="mb-2 text-lg font-semibold text-yellow-800">Jurnal Tidak Dapat Diedit</h2>
                        <p className="text-yellow-700">
                            Jurnal dengan status <strong>{jurnal.status}</strong> tidak dapat diedit. Hanya jurnal dengan status draft yang dapat
                            diubah.
                        </p>
                        <div className="mt-4">
                            <Button
                                variant="outline"
                                onClick={() => router.visit(route('akuntansi.jurnal.index'))}
                                className="flex items-center gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Kembali ke Daftar Jurnal
                            </Button>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Jurnal" />
            <div className="max-w-7xl p-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <BookOpen className="h-6 w-6 text-blue-600" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{jurnal.nomor_jurnal}</h1>
                            </div>
                        </div>
                        <Button variant="outline" onClick={() => router.visit(route('akuntansi.jurnal.index'))} className="flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Kembali
                        </Button>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    {/* Header Information */}
                    <div className="rounded-lg border bg-white shadow-sm">
                        <div className="border-b border-gray-200 px-6 py-4">
                            <h2 className="text-lg font-semibold text-gray-900">Informasi Jurnal</h2>
                            <p className="text-sm text-gray-600">Edit detail header jurnal</p>
                        </div>
                        <div className="space-y-4 p-6">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="nomor_jurnal">Nomor Jurnal</Label>
                                    <Input
                                        id="nomor_jurnal"
                                        type="text"
                                        value={formData.nomor_jurnal}
                                        onChange={(e) => updateFormData('nomor_jurnal', e.target.value)}
                                        placeholder="Nomor jurnal"
                                        className={errors.nomor_jurnal ? 'border-red-500' : ''}
                                    />
                                    {errors.nomor_jurnal && (
                                        <Alert variant="destructive">
                                            <AlertDescription>{errors.nomor_jurnal}</AlertDescription>
                                        </Alert>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="tanggal_transaksi">Tanggal Transaksi</Label>
                                    <Input
                                        id="tanggal_transaksi"
                                        type="date"
                                        value={formData.tanggal_transaksi}
                                        onChange={(e) => updateFormData('tanggal_transaksi', e.target.value)}
                                        className={errors.tanggal_transaksi ? 'border-red-500' : ''}
                                    />
                                    {errors.tanggal_transaksi && (
                                        <Alert variant="destructive">
                                            <AlertDescription>{errors.tanggal_transaksi}</AlertDescription>
                                        </Alert>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="jenis_referensi">Jenis Referensi</Label>
                                    <Select value={formData.jenis_referensi} onValueChange={(value) => updateFormData('jenis_referensi', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih jenis referensi" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="manual">Manual</SelectItem>
                                            <SelectItem value="kas">Kas</SelectItem>
                                            <SelectItem value="bank">Bank</SelectItem>
                                            <SelectItem value="pembelian">Pembelian</SelectItem>
                                            <SelectItem value="penjualan">Penjualan</SelectItem>
                                            <SelectItem value="adjustment">Adjustment</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="nomor_referensi">Nomor Referensi</Label>
                                    <Input
                                        id="nomor_referensi"
                                        type="text"
                                        value={formData.nomor_referensi}
                                        onChange={(e) => updateFormData('nomor_referensi', e.target.value)}
                                        placeholder="Nomor referensi dokumen"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="keterangan">Keterangan</Label>
                                <textarea
                                    id="keterangan"
                                    value={formData.keterangan}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateFormData('keterangan', e.target.value)}
                                    placeholder="Keterangan jurnal"
                                    rows={3}
                                    className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${errors.keterangan ? 'border-red-500' : ''}`}
                                />
                                {errors.keterangan && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{errors.keterangan}</AlertDescription>
                                    </Alert>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Journal Details */}
                    <div className="rounded-lg border bg-white shadow-sm">
                        <div className="border-b border-gray-200 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Detail Jurnal</h2>
                                    <p className="text-sm text-gray-600">Edit detail debit dan kredit</p>
                                </div>
                                <Button type="button" onClick={addDetail} variant="outline" size="sm">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Tambah Baris
                                </Button>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-gray-50">
                                        <TableRow>
                                            <TableHead className="w-[40%]">Akun</TableHead>
                                            <TableHead className="w-[20%]">Debit</TableHead>
                                            <TableHead className="w-[20%]">Kredit</TableHead>
                                            <TableHead className="w-[15%]">Keterangan</TableHead>
                                            <TableHead className="w-[5%]">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {details.map((detail, index) => (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    <SearchableAccountSelectTable
                                                        accounts={daftar_akun}
                                                        value={detail.daftar_akun_id}
                                                        onValueChange={(value) => updateDetail(index, 'daftar_akun_id', value)}
                                                        placeholder="Pilih akun"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={detail.jumlah_debit || ''}
                                                        onChange={(e) => updateDetail(index, 'jumlah_debit', parseFloat(e.target.value) || 0)}
                                                        placeholder="0"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={detail.jumlah_kredit || ''}
                                                        onChange={(e) => updateDetail(index, 'jumlah_kredit', parseFloat(e.target.value) || 0)}
                                                        placeholder="0"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="text"
                                                        value={detail.keterangan}
                                                        onChange={(e) => updateDetail(index, 'keterangan', e.target.value)}
                                                        placeholder="Keterangan"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {details.length > 2 && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeDetail(index)}
                                                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow className="bg-gray-50 font-medium">
                                            <TableCell>Total</TableCell>
                                            <TableCell>{formatCurrency(totalDebit)}</TableCell>
                                            <TableCell>{formatCurrency(totalKredit)}</TableCell>
                                            <TableCell colSpan={2}>
                                                {isBalanced ? (
                                                    <span className="text-green-600">✓ Seimbang</span>
                                                ) : (
                                                    <span className="text-red-600">✗ Tidak seimbang</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => router.visit(route('akuntansi.jurnal.index'))}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing || !isBalanced}>
                            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Save className="mr-2 h-4 w-4" />
                            Update
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
