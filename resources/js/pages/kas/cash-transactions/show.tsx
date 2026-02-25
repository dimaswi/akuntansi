import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem, SharedData } from "@/types";
import { Head, router } from "@inertiajs/react";
import { ArrowLeft, Edit3, Wallet, CheckCircle, BookOpen, Trash } from "lucide-react";
import { toast } from "sonner";

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

interface DetailJurnal {
    id: number;
    daftar_akun_id: number;
    jumlah_debit: number;
    jumlah_kredit: number;
    keterangan: string;
    daftar_akun: DaftarAkun;
}

interface Jurnal {
    id: number;
    nomor_jurnal: string;
    tanggal_transaksi: string;
    keterangan: string;
    total_debit: number;
    total_kredit: number;
    status: string;
    details: DetailJurnal[];
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
    status: 'draft' | 'posted';
    daftar_akun_kas?: DaftarAkun;
    daftar_akun_lawan?: DaftarAkun;
    jurnal?: Jurnal;
    user?: User;
    posted_by?: User;
    posted_at?: string;
    created_at: string;
    updated_at: string;
}

interface Props extends SharedData {
    cashTransaction: CashTransaction;
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
        title: 'Detail Transaksi',
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

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'posted':
            return <Badge className="bg-green-100 text-green-800">Posted</Badge>;
        case 'draft':
            return <Badge variant="outline">Draft</Badge>;
        default:
            return <Badge variant="secondary">{status}</Badge>;
    }
};

const getJenisTransaksiBadge = (jenis: string) => {
    const colors: Record<string, string> = {
        'penerimaan': 'bg-green-100 text-green-800',
        'pengeluaran': 'bg-red-100 text-red-800',
        'uang_muka_penerimaan': 'bg-blue-100 text-blue-800',
        'uang_muka_pengeluaran': 'bg-orange-100 text-orange-800',
        'transfer_masuk': 'bg-purple-100 text-purple-800',
        'transfer_keluar': 'bg-indigo-100 text-indigo-800',
    };

    return (
        <Badge className={colors[jenis] || 'bg-gray-100 text-gray-800'}>
            {jenis.replace(/_/g, ' ').toUpperCase()}
        </Badge>
    );
};

export default function CashTransactionShow({ cashTransaction }: Props) {
    const handlePost = () => {
        router.post(`/kas/cash-transactions/${cashTransaction.id}/post`, {}, {
            onSuccess: () => {
                toast.success(`Transaksi ${cashTransaction.nomor_transaksi} berhasil diposting`);
            },
            onError: () => {
                toast.error('Gagal memposting transaksi');
            }
        });
    };

    const handleDelete = () => {
        if (confirm(`Apakah Anda yakin ingin menghapus transaksi ${cashTransaction.nomor_transaksi}?`)) {
            router.delete(`/kas/cash-transactions/${cashTransaction.id}`, {
                onSuccess: () => {
                    toast.success('Transaksi berhasil dihapus');
                    router.visit('/kas/cash-transactions');
                },
                onError: () => {
                    toast.error('Gagal menghapus transaksi');
                }
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detail Transaksi - ${cashTransaction.nomor_transaksi}`} />
            <div className="p-4 space-y-4">
                {/* Header */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div>
                                    <Button type="button" variant="outline" onClick={() => router.visit('/kas/cash-transactions')} className="gap-2">
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                    <Wallet className="h-5 w-5" />
                                    Detail Transaksi Kas
                                </CardTitle>
                                <CardDescription>
                                    {cashTransaction.nomor_transaksi}
                                </CardDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {cashTransaction.status === 'draft' && (
                                    <>
                                        <Button
                                            variant="outline"
                                            onClick={() => router.visit(`/kas/cash-transactions/${cashTransaction.id}/edit`)}
                                            className="gap-2"
                                        >
                                            <Edit3 className="h-4 w-4" />
                                            Edit
                                        </Button>
                                        <Button
                                            onClick={() => router.visit(`/kas/cash-transactions/post-to-journal?id=${cashTransaction.id}`)}
                                            className="gap-2 bg-green-600 hover:bg-green-700"
                                        >
                                            <CheckCircle className="h-4 w-4" />
                                            Post ke Jurnal
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            onClick={handleDelete}
                                            className="gap-2"
                                        >
                                            <Trash className="h-4 w-4" />
                                            Hapus
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Transaction Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-semibold text-sm text-muted-foreground">INFORMASI TRANSAKSI</h3>
                                    <Separator className="mt-2" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Nomor Transaksi</p>
                                        <p className="font-medium">{cashTransaction.nomor_transaksi}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Tanggal</p>
                                        <p className="font-medium">{formatDate(cashTransaction.tanggal_transaksi)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Jenis Transaksi</p>
                                        <div className="mt-1">
                                            {getJenisTransaksiBadge(cashTransaction.jenis_transaksi)}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Status</p>
                                        <div className="mt-1">
                                            {getStatusBadge(cashTransaction.status)}
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-sm text-muted-foreground">Jumlah</p>
                                        <p className="text-2xl font-bold text-primary">{formatCurrency(cashTransaction.jumlah)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-semibold text-sm text-muted-foreground">INFORMASI TAMBAHAN</h3>
                                    <Separator className="mt-2" />
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Keterangan</p>
                                        <p className="font-medium">{cashTransaction.keterangan}</p>
                                    </div>
                                    {cashTransaction.pihak_terkait && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">Pihak Terkait</p>
                                            <p className="font-medium">{cashTransaction.pihak_terkait}</p>
                                        </div>
                                    )}
                                    {cashTransaction.referensi && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">Referensi</p>
                                            <p className="font-medium">{cashTransaction.referensi}</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm text-muted-foreground">Dibuat Oleh</p>
                                        <p className="font-medium">{cashTransaction.user?.name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Dibuat Pada</p>
                                        <p className="font-medium">{formatDateTime(cashTransaction.created_at)}</p>
                                    </div>
                                    {cashTransaction.posted_at && (
                                        <>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Diposting Oleh</p>
                                                <p className="font-medium">{cashTransaction.posted_by?.name || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Diposting Pada</p>
                                                <p className="font-medium">{formatDateTime(cashTransaction.posted_at)}</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Account Information */}
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold text-sm text-muted-foreground">INFORMASI AKUN</h3>
                                <Separator className="mt-2" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="border rounded-lg p-4">
                                    <p className="text-sm text-muted-foreground mb-2">Akun Kas</p>
                                    <p className="font-medium">
                                        {cashTransaction.daftar_akun_kas?.kode_akun} - {cashTransaction.daftar_akun_kas?.nama_akun}
                                    </p>
                                </div>
                                <div className="border rounded-lg p-4">
                                    <p className="text-sm text-muted-foreground mb-2">Akun Lawan</p>
                                    <p className="font-medium">
                                        {cashTransaction.daftar_akun_lawan?.kode_akun} - {cashTransaction.daftar_akun_lawan?.nama_akun}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Journal Entry */}
                {cashTransaction.jurnal && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5" />
                                Jurnal Otomatis
                            </CardTitle>
                            <CardDescription>
                                Jurnal yang dibuat otomatis saat transaksi diposting
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Nomor Jurnal</p>
                                        <p className="font-medium">{cashTransaction.jurnal.nomor_jurnal}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Tanggal Jurnal</p>
                                        <p className="font-medium">{formatDate(cashTransaction.jurnal.tanggal_transaksi)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Status</p>
                                        <Badge className="bg-green-100 text-green-800">{cashTransaction.jurnal.status}</Badge>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground mb-2">Keterangan Jurnal</p>
                                    <p className="font-medium">{cashTransaction.jurnal.keterangan}</p>
                                </div>

                                <div className="border rounded-md">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Akun</TableHead>
                                                <TableHead className="text-right">Debit</TableHead>
                                                <TableHead className="text-right">Kredit</TableHead>
                                                <TableHead>Keterangan</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {cashTransaction.jurnal.details.map((detail) => (
                                                <TableRow key={detail.id}>
                                                    <TableCell className="font-medium">
                                                        {detail.daftar_akun.kode_akun} - {detail.daftar_akun.nama_akun}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono">
                                                        {detail.jumlah_debit > 0 ? formatCurrency(detail.jumlah_debit) : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono">
                                                        {detail.jumlah_kredit > 0 ? formatCurrency(detail.jumlah_kredit) : '-'}
                                                    </TableCell>
                                                    <TableCell>{detail.keterangan}</TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow className="font-semibold bg-muted/50">
                                                <TableCell>Total</TableCell>
                                                <TableCell className="text-right">
                                                    {formatCurrency(cashTransaction.jurnal.total_debit)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {formatCurrency(cashTransaction.jurnal.total_kredit)}
                                                </TableCell>
                                                <TableCell></TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
