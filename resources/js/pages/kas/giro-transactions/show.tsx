import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, Calendar, CheckCircle, Clock, Edit3, FileText, Hash, Receipt, User } from 'lucide-react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

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

interface GiroTransaction {
    id: number;
    nomor_giro: string;
    tanggal_giro: string;
    tanggal_jatuh_tempo: string;
    jenis_giro: string;
    jumlah: number;
    penerbit?: string;
    penerima?: string;
    keterangan: string;
    status_giro: string;
    is_posted: boolean;
    bank_account: BankAccount;
    daftar_akun?: DaftarAkun;
    user?: User;
    created_at: string;
    updated_at: string;
}

interface Props {
    giro_transaction: GiroTransaction;
    [key: string]: any;
}

export default function ShowGiroTransaction() {
    const { giro_transaction } = usePage<Props>().props;

    const breadcrumbs = [
        { title: <Receipt className="h-4 w-4" />, href: route('kas.index') },
        { title: 'Transaksi Giro', href: route('kas.giro-transactions.index') },
        { title: giro_transaction.nomor_giro, href: '#' },
    ];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
        }).format(amount);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDateOnly = (date: string) => {
        return new Date(date).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const handlePost = () => {
        router.visit(route('kas.giro-transactions.show-post-to-journal', { id: giro_transaction.id }));
    };

    const handleCair = () => {
        router.post(
            route('kas.giro-transactions.cair', giro_transaction.id),
            {},
            {
                onSuccess: () => {
                    toast.success('Giro berhasil dicairkan');
                },
                onError: (error) => {
                    console.error('Cair error:', error);
                    toast.error('Gagal mencairkan giro');
                },
            },
        );
    };

    const handleTolak = () => {
        router.post(
            route('kas.giro-transactions.tolak', giro_transaction.id),
            {},
            {
                onSuccess: () => {
                    toast.success('Giro berhasil ditolak');
                },
                onError: (error) => {
                    console.error('Tolak error:', error);
                    toast.error('Gagal menolak giro');
                },
            },
        );
    };

    const getStatusGiroBadge = (status: string) => {
        const statusConfig = {
            pending: { variant: 'secondary' as const, label: 'Pending' },
            cair: { variant: 'default' as const, label: 'Cair' },
            tolak: { variant: 'destructive' as const, label: 'Tolak' },
            jatuh_tempo: { variant: 'outline' as const, label: 'Jatuh Tempo' },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const getJenisGiroBadge = (jenis: string) => {
        const jenisConfig = {
            masuk: { variant: 'default' as const, label: 'Giro Masuk', color: 'text-green-700 bg-green-50' },
            keluar: { variant: 'secondary' as const, label: 'Giro Keluar', color: 'text-red-700 bg-red-50' },
        };

        const config = jenisConfig[jenis as keyof typeof jenisConfig] || jenisConfig.masuk;
        return (
            <Badge variant={config.variant} className={config.color}>
                {config.label}
            </Badge>
        );
    };

    const isJatuhTempo = (tanggalJatuhTempo: string) => {
        const today = new Date();
        const jatuhTempo = new Date(tanggalJatuhTempo);
        return jatuhTempo <= today;
    };

    const getDaysToMaturity = (tanggalJatuhTempo: string) => {
        const today = new Date();
        const jatuhTempo = new Date(tanggalJatuhTempo);
        const diffTime = jatuhTempo.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Transaksi Giro - ${giro_transaction.nomor_giro}`} />

            <div className="p-4">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Main Information */}
                    <div className="space-y-6 lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div>
                                            <Button type="button" variant="outline" onClick={() => window.history.back()} className="gap-2">
                                                <ArrowLeft className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div>
                                            <CardTitle className="flex items-center space-x-2">
                                                <Receipt className="h-5 w-5" />
                                                <span>Informasi Giro</span>
                                            </CardTitle>
                                            <CardDescription>Detail informasi transaksi giro</CardDescription>
                                        </div>
                                    </div>
                                    <div>
                                        {!giro_transaction.is_posted && (
                                            <>
                                                <Button variant="outline" onClick={handlePost}>
                                                    <CheckCircle className="mr-2 h-4 w-4" />
                                                    Post Transaksi
                                                </Button>
                                                <Button onClick={() => router.visit(route('kas.giro-transactions.edit', giro_transaction.id))}>
                                                    <Edit3 className="mr-2 h-4 w-4" />
                                                    Edit
                                                </Button>
                                            </>
                                        )}
                                        {giro_transaction.status_giro === 'pending' && (
                                            <>
                                                <Button variant="default" onClick={handleCair}>
                                                    ✓ Cairkan
                                                </Button>
                                                <Button variant="destructive" onClick={handleTolak}>
                                                    ✗ Tolak
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <div className="flex items-center text-sm font-medium text-muted-foreground">
                                            <Hash className="mr-2 h-4 w-4" />
                                            Nomor Giro
                                        </div>
                                        <p className="text-lg font-semibold">{giro_transaction.nomor_giro}</p>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center text-sm font-medium text-muted-foreground">
                                            <Calendar className="mr-2 h-4 w-4" />
                                            Tanggal Giro
                                        </div>
                                        <p className="text-lg">{formatDateOnly(giro_transaction.tanggal_giro)}</p>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center text-sm font-medium text-muted-foreground">
                                            <Clock className="mr-2 h-4 w-4" />
                                            Tanggal Jatuh Tempo
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <p className="text-lg">{formatDateOnly(giro_transaction.tanggal_jatuh_tempo)}</p>
                                            {isJatuhTempo(giro_transaction.tanggal_jatuh_tempo) && giro_transaction.status_giro === 'pending' && (
                                                <Badge variant="destructive" className="text-xs">
                                                    <AlertCircle className="mr-1 h-3 w-3" />
                                                    Overdue
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center text-sm font-medium text-muted-foreground">Jenis Giro</div>
                                        <div>{getJenisGiroBadge(giro_transaction.jenis_giro)}</div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center text-sm font-medium text-muted-foreground">Jumlah</div>
                                        <p
                                            className={`text-2xl font-bold ${
                                                giro_transaction.jenis_giro === 'masuk' ? 'text-green-600' : 'text-red-600'
                                            }`}
                                        >
                                            {formatCurrency(giro_transaction.jumlah)}
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center text-sm font-medium text-muted-foreground">Status Giro</div>
                                        <div>{getStatusGiroBadge(giro_transaction.status_giro)}</div>
                                    </div>

                                    {giro_transaction.penerbit && (
                                        <div className="space-y-2">
                                            <div className="flex items-center text-sm font-medium text-muted-foreground">
                                                <User className="mr-2 h-4 w-4" />
                                                Penerbit
                                            </div>
                                            <p className="text-lg">{giro_transaction.penerbit}</p>
                                        </div>
                                    )}

                                    {giro_transaction.penerima && (
                                        <div className="space-y-2">
                                            <div className="flex items-center text-sm font-medium text-muted-foreground">
                                                <User className="mr-2 h-4 w-4" />
                                                Penerima
                                            </div>
                                            <p className="text-lg">{giro_transaction.penerima}</p>
                                        </div>
                                    )}
                                </div>

                                <Separator />

                                <div className="space-y-2">
                                    <div className="flex items-center text-sm font-medium text-muted-foreground">
                                        <FileText className="mr-2 h-4 w-4" />
                                        Keterangan
                                    </div>
                                    <p className="leading-relaxed text-gray-700">{giro_transaction.keterangan}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Bank Account Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Bank Account</CardTitle>
                                <CardDescription>Informasi rekening bank yang terkait</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                                    <div className="space-y-1">
                                        <p className="text-lg font-semibold">{giro_transaction.bank_account.nama_bank}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {giro_transaction.bank_account.kode_rekening} • {giro_transaction.bank_account.nama_rekening}
                                        </p>
                                        <p className="text-sm font-medium">Saldo: {formatCurrency(giro_transaction.bank_account.saldo_berjalan)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Account Mapping */}
                        {giro_transaction.daftar_akun && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Akun Terkait</CardTitle>
                                    <CardDescription>Pemetaan ke akun dalam chart of accounts</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                                        <div>
                                            <p className="font-semibold">
                                                {giro_transaction.daftar_akun.kode_akun} - {giro_transaction.daftar_akun.nama_akun}
                                            </p>
                                            <p className="text-sm text-muted-foreground">{giro_transaction.daftar_akun.jenis_akun}</p>
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
                                    <span className="text-sm font-medium">Status Giro</span>
                                    {getStatusGiroBadge(giro_transaction.status_giro)}
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Posting</span>
                                    {giro_transaction.is_posted ? (
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
                                    <p className="ml-6 text-sm">{formatDate(giro_transaction.created_at)}</p>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center space-x-2 text-sm">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">Diperbarui:</span>
                                    </div>
                                    <p className="ml-6 text-sm">{formatDate(giro_transaction.updated_at)}</p>
                                </div>

                                {giro_transaction.user && (
                                    <div className="space-y-3">
                                        <div className="flex items-center space-x-2 text-sm">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-muted-foreground">Dibuat oleh:</span>
                                        </div>
                                        <p className="ml-6 text-sm">{giro_transaction.user.name}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Maturity Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Info Jatuh Tempo</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span>Hari sampai jatuh tempo:</span>
                                        <span
                                            className={
                                                getDaysToMaturity(giro_transaction.tanggal_jatuh_tempo) < 0
                                                    ? 'font-semibold text-red-600'
                                                    : 'text-gray-600'
                                            }
                                        >
                                            {getDaysToMaturity(giro_transaction.tanggal_jatuh_tempo)} hari
                                        </span>
                                    </div>
                                    {isJatuhTempo(giro_transaction.tanggal_jatuh_tempo) && giro_transaction.status_giro === 'pending' && (
                                        <div className="text-xs font-medium text-red-600">⚠️ Giro sudah jatuh tempo!</div>
                                    )}
                                </div>
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
                                        <span className={giro_transaction.jenis_giro === 'masuk' ? 'text-green-600' : 'text-red-600'}>
                                            {giro_transaction.jenis_giro === 'masuk' ? '+' : '-'}
                                            {formatCurrency(giro_transaction.jumlah)}
                                        </span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {giro_transaction.is_posted
                                            ? 'Saldo akan terupdate saat giro dicairkan'
                                            : 'Saldo akan terupdate setelah posting dan pencairan'}
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
