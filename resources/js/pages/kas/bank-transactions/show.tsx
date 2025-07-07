import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";
import { Head, router, usePage } from "@inertiajs/react";
import { ArrowLeft, Edit3, Landmark, Calendar, User, Hash, CreditCard, FileText, CheckCircle } from "lucide-react";
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

interface User {
    id: number;
    name: string;
}

interface BankTransaction {
    id: number;
    nomor_transaksi: string;
    tanggal_transaksi: string;
    jenis_transaksi: string;
    jumlah: number;
    keterangan: string;
    pihak_terkait?: string;
    referensi?: string;
    status: string;
    is_posted: boolean;
    bank_account: BankAccount;
    daftar_akun?: DaftarAkun;
    user?: User;
    created_at: string;
    updated_at: string;
}

interface Props {
    bank_transaction: BankTransaction;
    [key: string]: any;
}

export default function ShowBankTransaction() {
    const { bank_transaction } = usePage<Props>().props;

    const breadcrumbs = [
        { title: <Landmark className="h-4 w-4" />, href: route("kas.index") },
        { title: "Transaksi Bank", href: route("kas.bank-transactions.index") },
        { title: bank_transaction.nomor_transaksi, href: "#" },
    ];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
        }).format(amount);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("id-ID", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const handlePost = () => {
        router.post(route("kas.bank-transactions.post", bank_transaction.id), {}, {
            onSuccess: () => {
                toast.success("Transaksi bank berhasil diposting");
            },
            onError: (error) => {
                console.error("Post error:", error);
                toast.error("Gagal memposting transaksi bank");
            },
        });
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            draft: { variant: "secondary" as const, label: "Draft" },
            posted: { variant: "default" as const, label: "Posted" },
            cancelled: { variant: "destructive" as const, label: "Cancelled" },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const getJenisTransaksiBadge = (jenis: string) => {
        const jenisConfig = {
            penerimaan: { variant: "default" as const, label: "Penerimaan", color: "text-green-700 bg-green-50" },
            pengeluaran: { variant: "secondary" as const, label: "Pengeluaran", color: "text-red-700 bg-red-50" },
            transfer_masuk: { variant: "outline" as const, label: "Transfer Masuk", color: "text-blue-700 bg-blue-50" },
            transfer_keluar: { variant: "outline" as const, label: "Transfer Keluar", color: "text-orange-700 bg-orange-50" },
        };

        const config = jenisConfig[jenis as keyof typeof jenisConfig] || jenisConfig.penerimaan;
        return (
            <Badge variant={config.variant} className={config.color}>
                {config.label}
            </Badge>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Transaksi Bank - ${bank_transaction.nomor_transaksi}`} />

            <div className="p-4">
                <div className="flex items-center justify-between pb-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg">
                            <Landmark className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">
                                Detail Transaksi Bank
                            </h1>
                        </div>
                    </div>
                    <div className="flex space-x-2">
                        <Button
                            variant="outline"
                            onClick={() => router.visit(route("kas.bank-transactions.index"))}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Kembali
                        </Button>
                        {!bank_transaction.is_posted && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={handlePost}
                                >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Post Transaksi
                                </Button>
                                <Button
                                    onClick={() => router.visit(route("kas.bank-transactions.edit", bank_transaction.id))}
                                >
                                    <Edit3 className="mr-2 h-4 w-4" />
                                    Edit
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Information */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Landmark className="h-5 w-5" />
                                    <span>Informasi Transaksi</span>
                                </CardTitle>
                                <CardDescription>
                                    Detail informasi transaksi bank
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center text-sm font-medium text-muted-foreground">
                                            <Hash className="mr-2 h-4 w-4" />
                                            Nomor Transaksi
                                        </div>
                                        <p className="text-lg font-semibold">{bank_transaction.nomor_transaksi}</p>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center text-sm font-medium text-muted-foreground">
                                            <Calendar className="mr-2 h-4 w-4" />
                                            Tanggal Transaksi
                                        </div>
                                        <p className="text-lg">{new Date(bank_transaction.tanggal_transaksi).toLocaleDateString("id-ID")}</p>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center text-sm font-medium text-muted-foreground">
                                            <CreditCard className="mr-2 h-4 w-4" />
                                            Jenis Transaksi
                                        </div>
                                        <div>{getJenisTransaksiBadge(bank_transaction.jenis_transaksi)}</div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center text-sm font-medium text-muted-foreground">
                                            Jumlah
                                        </div>
                                        <p className={`text-2xl font-bold ${
                                            bank_transaction.jenis_transaksi === "penerimaan" ||
                                            bank_transaction.jenis_transaksi === "transfer_masuk"
                                                ? "text-green-600"
                                                : "text-red-600"
                                        }`}>
                                            {formatCurrency(bank_transaction.jumlah)}
                                        </p>
                                    </div>

                                    {bank_transaction.pihak_terkait && (
                                        <div className="space-y-2">
                                            <div className="flex items-center text-sm font-medium text-muted-foreground">
                                                <User className="mr-2 h-4 w-4" />
                                                Pihak Terkait
                                            </div>
                                            <p className="text-lg">{bank_transaction.pihak_terkait}</p>
                                        </div>
                                    )}

                                    {bank_transaction.referensi && (
                                        <div className="space-y-2">
                                            <div className="flex items-center text-sm font-medium text-muted-foreground">
                                                <Hash className="mr-2 h-4 w-4" />
                                                Referensi
                                            </div>
                                            <p className="text-lg font-mono">{bank_transaction.referensi}</p>
                                        </div>
                                    )}
                                </div>

                                <Separator />

                                <div className="space-y-2">
                                    <div className="flex items-center text-sm font-medium text-muted-foreground">
                                        <FileText className="mr-2 h-4 w-4" />
                                        Keterangan
                                    </div>
                                    <p className="text-gray-700 leading-relaxed">
                                        {bank_transaction.keterangan}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Bank Account Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Bank Account</CardTitle>
                                <CardDescription>
                                    Informasi rekening bank yang terkait
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div className="space-y-1">
                                        <p className="font-semibold text-lg">
                                            {bank_transaction.bank_account.nama_bank}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {bank_transaction.bank_account.kode_rekening} • {bank_transaction.bank_account.nama_rekening}
                                        </p>
                                        <p className="text-sm font-medium">
                                            Saldo: {formatCurrency(bank_transaction.bank_account.saldo_berjalan)}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Account Mapping */}
                        {bank_transaction.daftar_akun && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Akun Terkait</CardTitle>
                                    <CardDescription>
                                        Pemetaan ke akun dalam chart of accounts
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="font-semibold">
                                                {bank_transaction.daftar_akun.kode_akun} - {bank_transaction.daftar_akun.nama_akun}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {bank_transaction.daftar_akun.jenis_akun}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar Information */}
                    <div className="space-y-6">
                        {/* Status Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Status Transaksi</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Status</span>
                                    {getStatusBadge(bank_transaction.status)}
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Posting</span>
                                    {bank_transaction.is_posted ? (
                                        <Badge variant="default">
                                            <CheckCircle className="mr-1 h-3 w-3" />
                                            Posted
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary">Draft</Badge>
                                    )}
                                </div>
                                
                                <Separator />
                                
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-2 text-sm">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">Dibuat:</span>
                                    </div>
                                    <p className="text-sm ml-6">{formatDate(bank_transaction.created_at)}</p>
                                </div>
                                
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-2 text-sm">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">Diperbarui:</span>
                                    </div>
                                    <p className="text-sm ml-6">{formatDate(bank_transaction.updated_at)}</p>
                                </div>

                                {bank_transaction.user && (
                                    <div className="space-y-3">
                                        <div className="flex items-center space-x-2 text-sm">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-muted-foreground">Dibuat oleh:</span>
                                        </div>
                                        <p className="text-sm ml-6">{bank_transaction.user.name}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Impact Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Dampak Transaksi</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span>Saldo Bank:</span>
                                        <span className={
                                            bank_transaction.jenis_transaksi === "penerimaan" ||
                                            bank_transaction.jenis_transaksi === "transfer_masuk"
                                                ? "text-green-600"
                                                : "text-red-600"
                                        }>
                                            {bank_transaction.jenis_transaksi === "penerimaan" ||
                                             bank_transaction.jenis_transaksi === "transfer_masuk" ? "+" : "-"}
                                            {formatCurrency(bank_transaction.jumlah)}
                                        </span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {bank_transaction.is_posted 
                                            ? "Saldo telah terupdate" 
                                            : "Saldo akan terupdate setelah posting"}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
