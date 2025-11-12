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
    sub_jenis?: string;
    saldo_normal: string;
    is_aktif: boolean;
    induk_akun_id?: number;
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

interface Stats {
    total_transaksi_bank: number;
    total_transaksi_giro: number;
    total_setoran: number;
    total_penarikan: number;
    total_giro_pending: number;
    total_giro_cair: number;
}

interface Props {
    bank_account: BankAccount;
    saldo_coa?: number;
    stats?: Stats;
    [key: string]: any;
}

export default function ShowBankAccount() {
    const { bank_account, saldo_coa, stats } = usePage<Props>().props;

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

            <div className="p-4">
                <div className="flex items-center justify-between pb-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg">
                            <Building2 className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">
                                Detail Bank Account
                            </h1>
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
                                    <CardTitle>Detail Akun COA</CardTitle>
                                    <CardDescription>
                                        Pemetaan ke akun dalam Chart of Accounts (COA)
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                                        <div className="col-span-2">
                                            <p className="text-sm font-medium text-muted-foreground mb-1">Kode & Nama Akun</p>
                                            <p className="text-lg font-bold text-blue-900">
                                                {bank_account.daftar_akun.kode_akun}
                                            </p>
                                            <p className="text-base font-semibold text-blue-800">
                                                {bank_account.daftar_akun.nama_akun}
                                            </p>
                                        </div>
                                        
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground mb-1">Jenis Akun</p>
                                            <Badge variant="secondary" className="capitalize">
                                                {bank_account.daftar_akun.jenis_akun}
                                            </Badge>
                                        </div>
                                        
                                        {bank_account.daftar_akun.sub_jenis && (
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground mb-1">Sub Jenis</p>
                                                <Badge variant="outline" className="capitalize">
                                                    {bank_account.daftar_akun.sub_jenis.replace(/_/g, ' ')}
                                                </Badge>
                                            </div>
                                        )}
                                        
                                        <div className="col-span-2 pt-2 border-t border-blue-200">
                                            <p className="text-sm font-medium text-muted-foreground mb-1">Saldo Normal</p>
                                            <Badge variant={bank_account.daftar_akun.saldo_normal === 'debit' ? 'default' : 'secondary'}>
                                                {bank_account.daftar_akun.saldo_normal.toUpperCase()}
                                            </Badge>
                                        </div>
                                        
                                        <div className="col-span-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-muted-foreground">Status Akun</span>
                                                <Badge variant={bank_account.daftar_akun.is_aktif ? "default" : "secondary"}>
                                                    {bank_account.daftar_akun.is_aktif ? "Aktif" : "Tidak Aktif"}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    {saldo_coa !== null && saldo_coa !== undefined && (
                                        <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                                            <p className="text-sm font-medium text-green-900 mb-2">
                                                💰 Saldo dari COA (Chart of Accounts)
                                            </p>
                                            <p className={`text-2xl font-bold ${
                                                saldo_coa >= 0 ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                                {formatCurrency(saldo_coa)}
                                            </p>
                                            <p className="text-xs text-green-700 mt-1">
                                                Saldo ini dihitung dari detail jurnal yang telah di-posting
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Transaction Statistics */}
                        {stats && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Statistik Transaksi</CardTitle>
                                    <CardDescription>
                                        Ringkasan aktivitas transaksi bank dan giro
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 bg-blue-50 rounded-lg">
                                            <p className="text-xs font-medium text-muted-foreground mb-1">Total Transaksi Bank</p>
                                            <p className="text-2xl font-bold text-blue-600">{stats.total_transaksi_bank}</p>
                                        </div>
                                        
                                        <div className="p-3 bg-purple-50 rounded-lg">
                                            <p className="text-xs font-medium text-muted-foreground mb-1">Total Transaksi Giro</p>
                                            <p className="text-2xl font-bold text-purple-600">{stats.total_transaksi_giro}</p>
                                        </div>
                                    </div>
                                    
                                    <Separator />
                                    
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                            <span className="text-sm font-medium text-green-900">Total Setoran</span>
                                            <span className="text-lg font-bold text-green-600">
                                                {formatCurrency(stats.total_setoran)}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                                            <span className="text-sm font-medium text-red-900">Total Penarikan</span>
                                            <span className="text-lg font-bold text-red-600">
                                                {formatCurrency(stats.total_penarikan)}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                                            <span className="text-sm font-medium text-yellow-900">Giro Pending</span>
                                            <span className="text-lg font-bold text-yellow-600">
                                                {formatCurrency(stats.total_giro_pending)}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                                            <span className="text-sm font-medium text-emerald-900">Giro Cair</span>
                                            <span className="text-lg font-bold text-emerald-600">
                                                {formatCurrency(stats.total_giro_cair)}
                                            </span>
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
                                <CardDescription>
                                    Perbandingan saldo bank dengan saldo akun COA
                                </CardDescription>
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
                                    <p className="text-sm font-medium text-muted-foreground">Saldo Berjalan (Transaksi Bank)</p>
                                    <p className={`text-2xl font-bold ${
                                        bank_account.saldo_berjalan >= 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {formatCurrency(bank_account.saldo_berjalan)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Dihitung dari transaksi bank yang telah diposting
                                    </p>
                                </div>
                                
                                {saldo_coa !== null && saldo_coa !== undefined && (
                                    <>
                                        <Separator />
                                        <div className="space-y-2 p-3 bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg border border-emerald-200">
                                            <p className="text-sm font-medium text-emerald-900">💰 Saldo Akun COA</p>
                                            <p className={`text-2xl font-bold ${
                                                saldo_coa >= 0 ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                                {formatCurrency(saldo_coa)}
                                            </p>
                                            <p className="text-xs text-emerald-700">
                                                Dihitung dari jurnal yang telah diposting
                                            </p>
                                        </div>
                                    </>
                                )}
                                
                                <Separator />
                                
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-muted-foreground">Mutasi</p>
                                    <p className={`text-lg font-semibold ${
                                        (bank_account.saldo_berjalan - bank_account.saldo_awal) >= 0 
                                            ? 'text-green-600' 
                                            : 'text-red-600'
                                    }`}>
                                        {formatCurrency(bank_account.saldo_berjalan - bank_account.saldo_awal)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Selisih saldo berjalan dengan saldo awal
                                    </p>
                                </div>

                                {saldo_coa !== null && saldo_coa !== undefined && (
                                    <>
                                        <Separator />
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium text-muted-foreground">Selisih Saldo</p>
                                            <p className={`text-lg font-semibold ${
                                                Math.abs(bank_account.saldo_berjalan - saldo_coa) < 0.01
                                                    ? 'text-green-600' 
                                                    : 'text-amber-600'
                                            }`}>
                                                {formatCurrency(bank_account.saldo_berjalan - saldo_coa)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Selisih antara saldo bank dengan saldo COA
                                            </p>
                                            {Math.abs(bank_account.saldo_berjalan - saldo_coa) < 0.01 ? (
                                                <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                                                    <span>✓</span>
                                                    <span>Saldo sudah sesuai</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-xs text-amber-600 mt-1">
                                                    <span>⚠</span>
                                                    <span>Ada selisih, perlu rekonsiliasi</span>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
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
