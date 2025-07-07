import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";
import { Head, router, usePage } from "@inertiajs/react";
import { ArrowLeft, Edit3, Building2, Calendar, User, Hash, CreditCard, MapPin, FileText } from "lucide-react";
import { route } from "ziggy-js";

interface DaftarAkun {
    id: number;
    kode_akun: string;
    nama_akun: string;
    jenis_akun: string;
}

interface BankAccount {
    id: number;
    kode_rekening: string;
    nama_bank: string;
    nama_rekening: string;
    nomor_rekening: string;
    cabang?: string;
    saldo_awal: number;
    saldo_berjalan: number;
    jenis_rekening: string;
    keterangan?: string;
    is_aktif: boolean;
    daftar_akun?: DaftarAkun;
    created_at: string;
    updated_at: string;
}

interface Props {
    bank_account: BankAccount;
    [key: string]: any;
}

export default function ShowBankAccount() {
    const { bank_account } = usePage<Props>().props;

    const breadcrumbs = [
        { title: <Building2 className="h-4 w-4" />, href: route("kas.index") },
        { title: "Bank Account", href: route("kas.bank-accounts.index") },
        { title: bank_account.kode_rekening, href: "#" },
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Bank Account - ${bank_account.kode_rekening}`} />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Building2 className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">
                                Detail Bank Account
                            </h1>
                            <p className="text-muted-foreground">
                                Informasi lengkap rekening bank {bank_account.kode_rekening}
                            </p>
                        </div>
                    </div>
                    <div className="flex space-x-2">
                        <Button
                            variant="outline"
                            onClick={() => router.visit(route("kas.bank-accounts.index"))}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Kembali
                        </Button>
                        <Button
                            onClick={() => router.visit(route("kas.bank-accounts.edit", bank_account.id))}
                        >
                            <Edit3 className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Information */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Building2 className="h-5 w-5" />
                                    <span>Informasi Bank</span>
                                </CardTitle>
                                <CardDescription>
                                    Detail informasi rekening bank
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center text-sm font-medium text-muted-foreground">
                                            <Hash className="mr-2 h-4 w-4" />
                                            Kode Rekening
                                        </div>
                                        <p className="text-lg font-semibold">{bank_account.kode_rekening}</p>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center text-sm font-medium text-muted-foreground">
                                            <Building2 className="mr-2 h-4 w-4" />
                                            Nama Bank
                                        </div>
                                        <p className="text-lg font-semibold">{bank_account.nama_bank}</p>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center text-sm font-medium text-muted-foreground">
                                            <User className="mr-2 h-4 w-4" />
                                            Nama Rekening
                                        </div>
                                        <p className="text-lg">{bank_account.nama_rekening}</p>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center text-sm font-medium text-muted-foreground">
                                            <CreditCard className="mr-2 h-4 w-4" />
                                            Nomor Rekening
                                        </div>
                                        <p className="text-lg font-mono">{bank_account.nomor_rekening}</p>
                                    </div>

                                    {bank_account.cabang && (
                                        <div className="space-y-2">
                                            <div className="flex items-center text-sm font-medium text-muted-foreground">
                                                <MapPin className="mr-2 h-4 w-4" />
                                                Cabang
                                            </div>
                                            <p className="text-lg">{bank_account.cabang}</p>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <div className="flex items-center text-sm font-medium text-muted-foreground">
                                            <CreditCard className="mr-2 h-4 w-4" />
                                            Jenis Rekening
                                        </div>
                                        <Badge variant="secondary" className="capitalize">
                                            {bank_account.jenis_rekening}
                                        </Badge>
                                    </div>
                                </div>

                                {bank_account.keterangan && (
                                    <>
                                        <Separator />
                                        <div className="space-y-2">
                                            <div className="flex items-center text-sm font-medium text-muted-foreground">
                                                <FileText className="mr-2 h-4 w-4" />
                                                Keterangan
                                            </div>
                                            <p className="text-gray-700 leading-relaxed">
                                                {bank_account.keterangan}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Account Mapping */}
                        {bank_account.daftar_akun && (
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
                                                {bank_account.daftar_akun.kode_akun} - {bank_account.daftar_akun.nama_akun}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {bank_account.daftar_akun.jenis_akun}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar Information */}
                    <div className="space-y-6">
                        {/* Balance Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Informasi Saldo</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-muted-foreground">Saldo Awal</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {formatCurrency(bank_account.saldo_awal)}
                                    </p>
                                </div>
                                
                                <Separator />
                                
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-muted-foreground">Saldo Berjalan</p>
                                    <p className={`text-2xl font-bold ${
                                        bank_account.saldo_berjalan >= 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {formatCurrency(bank_account.saldo_berjalan)}
                                    </p>
                                </div>
                                
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-muted-foreground">Mutasi</p>
                                    <p className={`text-lg font-semibold ${
                                        (bank_account.saldo_berjalan - bank_account.saldo_awal) >= 0 
                                            ? 'text-green-600' 
                                            : 'text-red-600'
                                    }`}>
                                        {formatCurrency(bank_account.saldo_berjalan - bank_account.saldo_awal)}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Status Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Status & Informasi</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Status</span>
                                    <Badge variant={bank_account.is_aktif ? "default" : "secondary"}>
                                        {bank_account.is_aktif ? "Aktif" : "Tidak Aktif"}
                                    </Badge>
                                </div>
                                
                                <Separator />
                                
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-2 text-sm">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">Dibuat:</span>
                                    </div>
                                    <p className="text-sm ml-6">{formatDate(bank_account.created_at)}</p>
                                </div>
                                
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-2 text-sm">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">Diperbarui:</span>
                                    </div>
                                    <p className="text-sm ml-6">{formatDate(bank_account.updated_at)}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
