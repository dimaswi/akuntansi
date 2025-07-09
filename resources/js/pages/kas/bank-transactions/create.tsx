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
import { BreadcrumbItem } from "@/types";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import { ArrowLeft, Save, Landmark } from "lucide-react";
import { toast } from "sonner";
import { route } from "ziggy-js";

interface BankAccount {
    id: number;
    kode_rekening: string;
    nama_bank: string;
    nama_rekening: string;
    saldo_berjalan: number;
}

interface DaftarAkun {
    id: number;
    kode_akun: string;
    nama_akun: string;
    jenis_akun: string;
}

interface Props {
    bank_accounts: BankAccount[];
    daftar_akun: DaftarAkun[];
    [key: string]: any;
}

const breadcrumbs = [
    { title: <Landmark className="h-4 w-4" />, href: route("kas.index") },
    { title: "Transaksi Bank", href: route("kas.bank-transactions.index") },
    { title: "Tambah Transaksi", href: "#" },
];

export default function CreateBankTransaction() {
    const { bank_accounts, daftar_akun } = usePage<Props>().props;

    const { data, setData, post, processing, errors, reset } = useForm({
        nomor_transaksi: "",
        tanggal_transaksi: new Date().toISOString().split('T')[0],
        tanggal_efektif: "",
        bank_account_id: "",
        jenis_transaksi: "",
        jumlah: "",
        daftar_akun_lawan_id: "",
        keterangan: "",
        pihak_terkait: "",
        nomor_referensi: "",
        status: "draft",
    });

    const selectedBankAccount = bank_accounts.find(account => account.id.toString() === data.bank_account_id);

    function submit(e: React.FormEvent) {
        e.preventDefault();

        post(route("kas.bank-transactions.store"), {
            onSuccess: () => {
                toast.success("Transaksi bank berhasil ditambahkan");
                router.visit(route("kas.bank-transactions.index"));
            },
            onError: (errors) => {
                console.error("Form errors:", errors);
                toast.error("Terjadi kesalahan saat menyimpan data");
            },
        });
    }

    function submitAndCreateAnother(e: React.FormEvent) {
        e.preventDefault();

        post(route("kas.bank-transactions.store"), {
            onSuccess: () => {
                toast.success("Transaksi bank berhasil ditambahkan");
                // Reset form untuk membuat transaksi baru
                reset();
                setData({
                    nomor_transaksi: "",
                    tanggal_transaksi: new Date().toISOString().split('T')[0],
                    tanggal_efektif: "",
                    bank_account_id: "",
                    jenis_transaksi: "",
                    jumlah: "",
                    daftar_akun_lawan_id: "",
                    keterangan: "",
                    pihak_terkait: "",
                    nomor_referensi: "",
                    status: "draft",
                });
            },
            onError: (errors) => {
                console.error("Form errors:", errors);
                toast.error("Terjadi kesalahan saat menyimpan data");
            },
        });
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
        }).format(amount);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Transaksi Bank" />

            <div className="p-4">
                <div className="flex items-center justify-between pb-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg">
                            <Landmark className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Tambah Transaksi Bank</h1>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => router.visit(route("kas.bank-transactions.index"))}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Kembali
                    </Button>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Form */}
                        <div className="lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Informasi Transaksi</CardTitle>
                                    <CardDescription>
                                        Isi informasi lengkap transaksi bank
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="nomor_transaksi">
                                                Nomor Transaksi <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="nomor_transaksi"
                                                type="text"
                                                value={data.nomor_transaksi}
                                                onChange={(e) => setData("nomor_transaksi", e.target.value)}
                                                placeholder="Masukkan nomor transaksi"
                                                className={errors.nomor_transaksi ? "border-red-500" : ""}
                                            />
                                            {errors.nomor_transaksi && (
                                                <p className="text-sm text-red-500">{errors.nomor_transaksi}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="tanggal_transaksi">
                                                Tanggal Transaksi <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="tanggal_transaksi"
                                                type="date"
                                                value={data.tanggal_transaksi}
                                                onChange={(e) => setData("tanggal_transaksi", e.target.value)}
                                                className={errors.tanggal_transaksi ? "border-red-500" : ""}
                                            />
                                            {errors.tanggal_transaksi && (
                                                <p className="text-sm text-red-500">{errors.tanggal_transaksi}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="tanggal_efektif">Tanggal Efektif</Label>
                                            <Input
                                                id="tanggal_efektif"
                                                type="date"
                                                value={data.tanggal_efektif}
                                                onChange={(e) => setData("tanggal_efektif", e.target.value)}
                                                className={errors.tanggal_efektif ? "border-red-500" : ""}
                                                placeholder="Kosongkan jika sama dengan tanggal transaksi"
                                            />
                                            {errors.tanggal_efektif && (
                                                <p className="text-sm text-red-500">{errors.tanggal_efektif}</p>
                                            )}
                                            <p className="text-xs text-gray-500">
                                                Kosongkan jika sama dengan tanggal transaksi
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="bank_account_id">
                                                Bank Account <span className="text-red-500">*</span>
                                            </Label>
                                            <Select
                                                value={data.bank_account_id}
                                                onValueChange={(value) => setData("bank_account_id", value)}
                                            >
                                                <SelectTrigger className={errors.bank_account_id ? "border-red-500" : ""}>
                                                    <SelectValue placeholder="Pilih bank account" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {(bank_accounts || []).map((account) => (
                                                        <SelectItem key={account.id} value={account.id.toString()}>
                                                            {account.kode_rekening} - {account.nama_bank}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.bank_account_id && (
                                                <p className="text-sm text-red-500">{errors.bank_account_id}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="jenis_transaksi">
                                                Jenis Transaksi <span className="text-red-500">*</span>
                                            </Label>
                                            <Select
                                                value={data.jenis_transaksi}
                                                onValueChange={(value) => setData("jenis_transaksi", value)}
                                            >
                                                <SelectTrigger className={errors.jenis_transaksi ? "border-red-500" : ""}>
                                                    <SelectValue placeholder="Pilih jenis transaksi" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="penerimaan">Penerimaan</SelectItem>
                                                    <SelectItem value="pengeluaran">Pengeluaran</SelectItem>
                                                    <SelectItem value="transfer_masuk">Transfer Masuk</SelectItem>
                                                    <SelectItem value="transfer_keluar">Transfer Keluar</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.jenis_transaksi && (
                                                <p className="text-sm text-red-500">{errors.jenis_transaksi}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="jumlah">
                                                Jumlah <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="jumlah"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={data.jumlah}
                                                onChange={(e) => setData("jumlah", e.target.value)}
                                                placeholder="0.00"
                                                className={errors.jumlah ? "border-red-500" : ""}
                                            />
                                            {errors.jumlah && (
                                                <p className="text-sm text-red-500">{errors.jumlah}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <SearchableAccountSelect
                                                accounts={daftar_akun || []}
                                                value={data.daftar_akun_lawan_id}
                                                onValueChange={(value) => setData("daftar_akun_lawan_id", value)}
                                                label={
                                                    (data.jenis_transaksi === 'setoran' || data.jenis_transaksi === 'transfer_masuk' || data.jenis_transaksi === 'kliring_masuk' || data.jenis_transaksi === 'bunga_bank' 
                                                        ? 'Sumber Dana' 
                                                        : 'Tujuan Penggunaan Dana') + ' *'
                                                }
                                                placeholder="Pilih akun"
                                                error={errors.daftar_akun_lawan_id}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="pihak_terkait">Pihak Terkait</Label>
                                            <Input
                                                id="pihak_terkait"
                                                type="text"
                                                value={data.pihak_terkait}
                                                onChange={(e) => setData("pihak_terkait", e.target.value)}
                                                placeholder="Nama pihak terkait"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="nomor_referensi">Referensi</Label>
                                            <Input
                                                id="nomor_referensi"
                                                type="text"
                                                value={data.nomor_referensi}
                                                onChange={(e) => setData("nomor_referensi", e.target.value)}
                                                placeholder="No. referensi/dokumen"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="keterangan">
                                            Keterangan <span className="text-red-500">*</span>
                                        </Label>
                                        <Textarea
                                            id="keterangan"
                                            value={data.keterangan}
                                            onChange={(e) => setData("keterangan", e.target.value)}
                                            placeholder="Deskripsi transaksi"
                                            rows={3}
                                            className={errors.keterangan ? "border-red-500" : ""}
                                        />
                                        {errors.keterangan && (
                                            <p className="text-sm text-red-500">{errors.keterangan}</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar Info */}
                        <div className="space-y-6">
                            {selectedBankAccount && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Bank Account Info</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Kode Rekening</p>
                                            <p className="font-semibold">{selectedBankAccount.kode_rekening}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Nama Bank</p>
                                            <p className="font-semibold">{selectedBankAccount.nama_bank}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Nama Rekening</p>
                                            <p className="font-semibold">{selectedBankAccount.nama_rekening}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Saldo Berjalan</p>
                                            <p className="text-lg font-bold text-blue-600">
                                                {formatCurrency(selectedBankAccount.saldo_berjalan)}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            <Card>
                                <CardHeader>
                                    <CardTitle>Catatan</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="text-sm text-muted-foreground space-y-2">
                                        <li>• Transaksi akan tersimpan sebagai draft</li>
                                        <li>• Posting dilakukan setelah transaksi dibuat</li>
                                        <li>• Jurnal otomatis akan dibuat saat posting</li>
                                        <li>• Saldo bank akan terupdate otomatis</li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit(route("kas.bank-transactions.index"))}
                        >
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing && <Save className="mr-2 h-4 w-4 animate-spin" />}
                            {!processing && <Save className="mr-2 h-4 w-4" />}
                            Simpan
                        </Button>
                        <Button 
                            type="button" 
                            variant="secondary" 
                            onClick={submitAndCreateAnother}
                            disabled={processing}
                        >
                            {processing && <Save className="mr-2 h-4 w-4 animate-spin" />}
                            {!processing && <Save className="mr-2 h-4 w-4" />}
                            Simpan & Buat Lagi
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
