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

interface BankTransaction {
    id: number;
    nomor_transaksi: string;
    tanggal_transaksi: string;
    bank_account_id: number;
    jenis_transaksi: string;
    jumlah: number;
    daftar_akun_id: number;
    keterangan: string;
    pihak_terkait?: string;
    referensi?: string;
    status: string;
}

interface Props {
    bank_transaction: BankTransaction;
    bank_accounts: BankAccount[];
    daftar_akun: DaftarAkun[];
    [key: string]: any;
}

export default function EditBankTransaction() {
    const { bank_transaction, bank_accounts, daftar_akun } = usePage<Props>().props;

    const breadcrumbs = [
        { title: <Landmark className="h-4 w-4" />, href: route("kas.index") },
        { title: "Transaksi Bank", href: route("kas.bank-transactions.index") },
        { title: bank_transaction.nomor_transaksi, href: route("kas.bank-transactions.show", bank_transaction.id) },
        { title: "Edit", href: "#" },
    ];

    const { data, setData, put, processing, errors, reset } = useForm({
        nomor_transaksi: bank_transaction.nomor_transaksi || "",
        tanggal_transaksi: bank_transaction.tanggal_transaksi || "",
        bank_account_id: bank_transaction.bank_account_id?.toString() || "",
        jenis_transaksi: bank_transaction.jenis_transaksi || "",
        jumlah: bank_transaction.jumlah?.toString() || "",
        daftar_akun_id: bank_transaction.daftar_akun_id?.toString() || "",
        keterangan: bank_transaction.keterangan || "",
        pihak_terkait: bank_transaction.pihak_terkait || "",
        referensi: bank_transaction.referensi || "",
        status: bank_transaction.status || "draft",
    });

    const selectedBankAccount = bank_accounts.find(account => account.id.toString() === data.bank_account_id);

    function submit(e: React.FormEvent) {
        e.preventDefault();

        put(route("kas.bank-transactions.update", bank_transaction.id), {
            onSuccess: () => {
                toast.success("Transaksi bank berhasil diperbarui");
                router.visit(route("kas.bank-transactions.show", bank_transaction.id));
            },
            onError: (errors) => {
                console.error("Form errors:", errors);
                toast.error("Terjadi kesalahan saat memperbarui data");
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
            <Head title={`Edit Transaksi Bank - ${bank_transaction.nomor_transaksi}`} />

            <div className="p-4">
                <div className="flex items-center justify-between pb-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg">
                            <Landmark className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Edit Transaksi Bank</h1>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => router.visit(route("kas.bank-transactions.show", bank_transaction.id))}
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
                                        Perbarui informasi transaksi bank
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
                                            <Label htmlFor="daftar_akun_id">
                                                Akun Terkait <span className="text-red-500">*</span>
                                            </Label>
                                            <Select
                                                value={data.daftar_akun_id}
                                                onValueChange={(value) => setData("daftar_akun_id", value)}
                                            >
                                                <SelectTrigger className={errors.daftar_akun_id ? "border-red-500" : ""}>
                                                    <SelectValue placeholder="Pilih akun" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {(daftar_akun || []).map((akun) => (
                                                        <SelectItem key={akun.id} value={akun.id.toString()}>
                                                            {akun.kode_akun} - {akun.nama_akun}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.daftar_akun_id && (
                                                <p className="text-sm text-red-500">{errors.daftar_akun_id}</p>
                                            )}
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
                                            <Label htmlFor="referensi">Referensi</Label>
                                            <Input
                                                id="referensi"
                                                type="text"
                                                value={data.referensi}
                                                onChange={(e) => setData("referensi", e.target.value)}
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
                                        <li>• Transaksi hanya bisa diedit jika belum diposting</li>
                                        <li>• Perubahan akan tersimpan sebagai draft</li>
                                        <li>• Posting ulang diperlukan setelah edit</li>
                                        <li>• Saldo bank akan terupdate saat posting</li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit(route("kas.bank-transactions.show", bank_transaction.id))}
                        >
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing && <Save className="mr-2 h-4 w-4 animate-spin" />}
                            {!processing && <Save className="mr-2 h-4 w-4" />}
                            Perbarui
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
