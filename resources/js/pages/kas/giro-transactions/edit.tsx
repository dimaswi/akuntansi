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
import { ArrowLeft, Save, Receipt } from "lucide-react";
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

interface GiroTransaction {
    id: number;
    nomor_giro: string;
    tanggal_giro: string;
    tanggal_jatuh_tempo: string;
    bank_account_id: number;
    jenis_giro: string;
    jumlah: number;
    daftar_akun_id: number;
    penerbit?: string;
    penerima?: string;
    keterangan: string;
    status_giro: string;
}

interface Props {
    giro_transaction: GiroTransaction;
    bank_accounts: BankAccount[];
    daftar_akun_giro: DaftarAkun[];
    daftar_akun: DaftarAkun[];
    [key: string]: any;
}

export default function EditGiroTransaction() {
    const { giro_transaction, bank_accounts, daftar_akun_giro, daftar_akun } = usePage<Props>().props;

    const breadcrumbs = [
        { title: "Dashboard", href: route("dashboard") },
        { title: "Kas & Bank", href: route("kas.giro-transactions.index") },
        { title: "Transaksi Giro", href: route("kas.giro-transactions.index") },
        { title: giro_transaction.nomor_giro, href: route("kas.giro-transactions.show", giro_transaction.id) },
        { title: "Edit", href: "#" },
    ];

    const { data, setData, put, processing, errors, reset } = useForm({
        nomor_giro: giro_transaction.nomor_giro || "",
        tanggal_giro: giro_transaction.tanggal_giro || "",
        tanggal_jatuh_tempo: giro_transaction.tanggal_jatuh_tempo || "",
        bank_account_id: giro_transaction.bank_account_id?.toString() || "",
        jenis_giro: giro_transaction.jenis_giro || "",
        jumlah: giro_transaction.jumlah?.toString() || "",
        daftar_akun_id: giro_transaction.daftar_akun_id?.toString() || "",
        penerbit: giro_transaction.penerbit || "",
        penerima: giro_transaction.penerima || "",
        keterangan: giro_transaction.keterangan || "",
        status_giro: giro_transaction.status_giro || "pending",
    });

    const selectedBankAccount = bank_accounts.find(account => account.id.toString() === data.bank_account_id);

    function submit(e: React.FormEvent) {
        e.preventDefault();

        put(route("kas.giro-transactions.update", giro_transaction.id), {
            onSuccess: () => {
                toast.success("Transaksi giro berhasil diperbarui");
                router.visit(route("kas.giro-transactions.show", giro_transaction.id));
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
            <Head title={`Edit Transaksi Giro - ${giro_transaction.nomor_giro}`} />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Receipt className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Edit Transaksi Giro</h1>
                            <p className="text-muted-foreground">
                                Perbarui transaksi giro {giro_transaction.nomor_giro}
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => router.visit(route("kas.giro-transactions.show", giro_transaction.id))}
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
                                    <CardTitle>Informasi Giro</CardTitle>
                                    <CardDescription>
                                        Perbarui informasi transaksi giro
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="nomor_giro">
                                                Nomor Giro <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="nomor_giro"
                                                type="text"
                                                value={data.nomor_giro}
                                                onChange={(e) => setData("nomor_giro", e.target.value)}
                                                placeholder="Masukkan nomor giro"
                                                className={errors.nomor_giro ? "border-red-500" : ""}
                                            />
                                            {errors.nomor_giro && (
                                                <p className="text-sm text-red-500">{errors.nomor_giro}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="jenis_giro">
                                                Jenis Giro <span className="text-red-500">*</span>
                                            </Label>
                                            <Select
                                                value={data.jenis_giro}
                                                onValueChange={(value) => setData("jenis_giro", value)}
                                            >
                                                <SelectTrigger className={errors.jenis_giro ? "border-red-500" : ""}>
                                                    <SelectValue placeholder="Pilih jenis giro" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="masuk">Giro Masuk</SelectItem>
                                                    <SelectItem value="keluar">Giro Keluar</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.jenis_giro && (
                                                <p className="text-sm text-red-500">{errors.jenis_giro}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="tanggal_giro">
                                                Tanggal Giro <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="tanggal_giro"
                                                type="date"
                                                value={data.tanggal_giro}
                                                onChange={(e) => setData("tanggal_giro", e.target.value)}
                                                className={errors.tanggal_giro ? "border-red-500" : ""}
                                            />
                                            {errors.tanggal_giro && (
                                                <p className="text-sm text-red-500">{errors.tanggal_giro}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="tanggal_jatuh_tempo">
                                                Tanggal Jatuh Tempo <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="tanggal_jatuh_tempo"
                                                type="date"
                                                value={data.tanggal_jatuh_tempo}
                                                onChange={(e) => setData("tanggal_jatuh_tempo", e.target.value)}
                                                className={errors.tanggal_jatuh_tempo ? "border-red-500" : ""}
                                            />
                                            {errors.tanggal_jatuh_tempo && (
                                                <p className="text-sm text-red-500">{errors.tanggal_jatuh_tempo}</p>
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

                                        {data.jenis_giro === "masuk" ? (
                                            <div className="space-y-2">
                                                <Label htmlFor="penerbit">Penerbit Giro</Label>
                                                <Input
                                                    id="penerbit"
                                                    type="text"
                                                    value={data.penerbit}
                                                    onChange={(e) => setData("penerbit", e.target.value)}
                                                    placeholder="Nama penerbit giro"
                                                />
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <Label htmlFor="penerima">Penerima Giro</Label>
                                                <Input
                                                    id="penerima"
                                                    type="text"
                                                    value={data.penerima}
                                                    onChange={(e) => setData("penerima", e.target.value)}
                                                    placeholder="Nama penerima giro"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="keterangan">
                                            Keterangan <span className="text-red-500">*</span>
                                        </Label>
                                        <Textarea
                                            id="keterangan"
                                            value={data.keterangan}
                                            onChange={(e) => setData("keterangan", e.target.value)}
                                            placeholder="Deskripsi giro"
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
                                        <li>• Giro hanya bisa diedit jika belum diposting</li>
                                        <li>• Perubahan akan tersimpan sebagai draft</li>
                                        <li>• Posting ulang diperlukan setelah edit</li>
                                        <li>• Perhatikan tanggal jatuh tempo</li>
                                        <li>• Status giro akan berubah saat dikelola</li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit(route("kas.giro-transactions.show", giro_transaction.id))}
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
