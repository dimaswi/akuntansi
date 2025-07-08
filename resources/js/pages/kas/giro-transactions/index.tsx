import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";
import { Head, router, usePage } from "@inertiajs/react";
import { 
    Edit3, 
    PlusCircle, 
    Search, 
    Trash, 
    X, 
    Loader2, 
    Receipt, 
    Eye, 
    CheckCircle, 
    Filter,
    ArrowUpDown,
    Calendar,
    Clock
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { route } from "ziggy-js";

interface BankAccount {
    id: number;
    kode_rekening: string;
    nama_bank: string;
    nama_rekening: string;
}

interface DaftarAkun {
    id: number;
    kode_akun: string;
    nama_akun: string;
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
    giroTransactions?: {
        data?: GiroTransaction[];
        current_page?: number;
        last_page?: number;
        per_page?: number;
        total?: number;
    };
    filters?: {
        search?: string;
        jenis_giro?: string;
        status_giro?: string;
        is_posted?: string;
        bank_account_id?: string;
        tanggal_dari?: string;
        tanggal_sampai?: string;
    };
    bankAccounts?: BankAccount[];
    [key: string]: any;
}

const breadcrumbs = [
    { title: <Receipt className="h-4 w-4" />, href: route("kas.index") },
    { title: "Transaksi Giro", href: "#" },
];

export default function GiroTransactionIndex() {
    const { giroTransactions, filters, bankAccounts } = usePage<Props>().props;
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Filter states
    const [search, setSearch] = useState(filters?.search || "");
    const [jenisGiro, setJenisGiro] = useState(filters?.jenis_giro || "all");
    const [statusGiro, setStatusGiro] = useState(filters?.status_giro || "all");
    const [isPosted, setIsPosted] = useState(filters?.is_posted || "all");
    const [bankAccountId, setBankAccountId] = useState(filters?.bank_account_id || "all");
    const [tanggalDari, setTanggalDari] = useState(filters?.tanggal_dari || "");
    const [tanggalSampai, setTanggalSampai] = useState(filters?.tanggal_sampai || "");

    const handleSearch = () => {
        router.get(route("kas.giro-transactions.index"), {
            search: search,
            jenis_giro: jenisGiro === "all" ? "" : jenisGiro,
            status_giro: statusGiro === "all" ? "" : statusGiro,
            is_posted: isPosted === "all" ? "" : isPosted,
            bank_account_id: bankAccountId === "all" ? "" : bankAccountId,
            tanggal_dari: tanggalDari,
            tanggal_sampai: tanggalSampai,
        }, {
            preserveState: true,
        });
    };

    const handleReset = () => {
        setSearch("");
        setJenisGiro("all");
        setStatusGiro("all");
        setIsPosted("all");
        setBankAccountId("all");
        setTanggalDari("");
        setTanggalSampai("");
        router.get(route("kas.giro-transactions.index"));
    };

    const handleDelete = async () => {
        if (!deleteId) return;

        setIsDeleting(true);
        try {
            router.delete(route("kas.giro-transactions.destroy", deleteId), {
                onSuccess: () => {
                    toast.success("Transaksi giro berhasil dihapus");
                    setShowDeleteDialog(false);
                    setDeleteId(null);
                },
                onError: (error) => {
                    console.error("Delete error:", error);
                    toast.error("Gagal menghapus transaksi giro");
                },
                onFinish: () => {
                    setIsDeleting(false);
                },
            });
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Terjadi kesalahan saat menghapus transaksi");
            setIsDeleting(false);
        }
    };

    const handlePost = (id: number) => {
        router.post(route("kas.giro-transactions.post", id), {}, {
            onSuccess: () => {
                toast.success("Transaksi giro berhasil diposting");
            },
            onError: (error) => {
                console.error("Post error:", error);
                toast.error("Gagal memposting transaksi giro");
            },
        });
    };

    const handleCair = (id: number) => {
        router.post(route("kas.giro-transactions.cair", id), {}, {
            onSuccess: () => {
                toast.success("Giro berhasil dicairkan");
            },
            onError: (error) => {
                console.error("Cair error:", error);
                toast.error("Gagal mencairkan giro");
            },
        });
    };

    const handleTolak = (id: number) => {
        router.post(route("kas.giro-transactions.tolak", id), {}, {
            onSuccess: () => {
                toast.success("Giro berhasil ditolak");
            },
            onError: (error) => {
                console.error("Tolak error:", error);
                toast.error("Gagal menolak giro");
            },
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
        }).format(amount);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("id-ID", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const getStatusGiroBadge = (status: string) => {
        const statusConfig = {
            pending: { variant: "secondary" as const, label: "Pending" },
            cair: { variant: "default" as const, label: "Cair" },
            tolak: { variant: "destructive" as const, label: "Tolak" },
            jatuh_tempo: { variant: "outline" as const, label: "Jatuh Tempo" },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const getJenisGiroBadge = (jenis: string) => {
        const jenisConfig = {
            masuk: { variant: "default" as const, label: "Giro Masuk", color: "text-green-700 bg-green-50" },
            keluar: { variant: "secondary" as const, label: "Giro Keluar", color: "text-red-700 bg-red-50" },
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Transaksi Giro" />

            <div className="p-4">
                <div className="flex items-center justify-between pb-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg">
                            <Receipt className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Transaksi Giro</h1>
                        </div>
                    </div>
                    <Button onClick={() => router.visit(route("kas.giro-transactions.create"))}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Tambah Giro
                    </Button>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Filter className="h-5 w-5" />
                            <span>Filter & Pencarian</span>
                        </CardTitle>
                        <CardDescription>
                            Filter transaksi giro berdasarkan kriteria tertentu
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="search">Pencarian</Label>
                                <Input
                                    id="search"
                                    placeholder="Nomor giro, penerbit..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bank_account">Bank Account</Label>
                                <Select value={bankAccountId} onValueChange={setBankAccountId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Semua Bank Account" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Bank Account</SelectItem>
                                        {(bankAccounts || []).map((account) => (
                                            <SelectItem key={account.id} value={account.id.toString()}>
                                                {account.kode_rekening} - {account.nama_bank}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="jenis_giro">Jenis Giro</Label>
                                <Select value={jenisGiro} onValueChange={setJenisGiro}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Semua Jenis" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Jenis</SelectItem>
                                        <SelectItem value="masuk">Giro Masuk</SelectItem>
                                        <SelectItem value="keluar">Giro Keluar</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status_giro">Status Giro</Label>
                                <Select value={statusGiro} onValueChange={setStatusGiro}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Semua Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Status</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="cair">Cair</SelectItem>
                                        <SelectItem value="tolak">Tolak</SelectItem>
                                        <SelectItem value="jatuh_tempo">Jatuh Tempo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="tanggal_dari">Tanggal Dari</Label>
                                <Input
                                    id="tanggal_dari"
                                    type="date"
                                    value={tanggalDari}
                                    onChange={(e) => setTanggalDari(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="tanggal_sampai">Tanggal Sampai</Label>
                                <Input
                                    id="tanggal_sampai"
                                    type="date"
                                    value={tanggalSampai}
                                    onChange={(e) => setTanggalSampai(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="is_posted">Status Posting</Label>
                                <Select value={isPosted} onValueChange={setIsPosted}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Semua" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua</SelectItem>
                                        <SelectItem value="1">Sudah Diposting</SelectItem>
                                        <SelectItem value="0">Belum Diposting</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex space-x-2">
                            <Button onClick={handleSearch}>
                                <Search className="mr-2 h-4 w-4" />
                                Cari
                            </Button>
                            <Button variant="outline" onClick={handleReset}>
                                <X className="mr-2 h-4 w-4" />
                                Reset
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Data Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Daftar Transaksi Giro</CardTitle>
                        <CardDescription>
                            {giroTransactions?.total || 0} transaksi ditemukan
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[120px]">
                                            <Button variant="ghost" size="sm">
                                                No. Giro
                                                <ArrowUpDown className="ml-2 h-4 w-4" />
                                            </Button>
                                        </TableHead>
                                        <TableHead>
                                            <Button variant="ghost" size="sm">
                                                Tanggal
                                                <Calendar className="ml-2 h-4 w-4" />
                                            </Button>
                                        </TableHead>
                                        <TableHead>
                                            <Button variant="ghost" size="sm">
                                                Jatuh Tempo
                                                <Clock className="ml-2 h-4 w-4" />
                                            </Button>
                                        </TableHead>
                                        <TableHead>Bank Account</TableHead>
                                        <TableHead>Jenis</TableHead>
                                        <TableHead className="text-right">Jumlah</TableHead>
                                        <TableHead>Penerbit/Penerima</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Posted</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {!giroTransactions?.data?.length ? (
                                        <TableRow>
                                            <TableCell colSpan={10} className="text-center text-muted-foreground">
                                                Tidak ada transaksi giro ditemukan
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        (giroTransactions.data || []).map((transaction) => (
                                            <TableRow key={transaction.id}>
                                                <TableCell className="font-medium">
                                                    {transaction.nomor_giro}
                                                </TableCell>
                                                <TableCell>
                                                    {formatDate(transaction.tanggal_giro)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        <span>{formatDate(transaction.tanggal_jatuh_tempo)}</span>
                                                        {isJatuhTempo(transaction.tanggal_jatuh_tempo) && transaction.status_giro === 'pending' && (
                                                            <Badge variant="destructive" className="text-xs">
                                                                Overdue
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{transaction.bank_account.nama_bank}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {transaction.bank_account.kode_rekening}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getJenisGiroBadge(transaction.jenis_giro)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono">
                                                    <span
                                                        className={
                                                            transaction.jenis_giro === "masuk"
                                                                ? "text-green-600"
                                                                : "text-red-600"
                                                        }
                                                    >
                                                        {formatCurrency(transaction.jumlah)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    {transaction.jenis_giro === "masuk" 
                                                        ? transaction.penerbit || "-"
                                                        : transaction.penerima || "-"}
                                                </TableCell>
                                                <TableCell>{getStatusGiroBadge(transaction.status_giro)}</TableCell>
                                                <TableCell>
                                                    {transaction.is_posted ? (
                                                        <Badge variant="default">
                                                            <CheckCircle className="mr-1 h-3 w-3" />
                                                            Posted
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary">Draft</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                router.visit(
                                                                    route("kas.giro-transactions.show", transaction.id)
                                                                )
                                                            }
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        {!transaction.is_posted && (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        router.visit(
                                                                            route("kas.giro-transactions.edit", transaction.id)
                                                                        )
                                                                    }
                                                                >
                                                                    <Edit3 className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handlePost(transaction.id)}
                                                                >
                                                                    <CheckCircle className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setDeleteId(transaction.id);
                                                                        setShowDeleteDialog(true);
                                                                    }}
                                                                >
                                                                    <Trash className="h-4 w-4" />
                                                                </Button>
                                                            </>
                                                        )}
                                                        {transaction.status_giro === 'pending' && (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleCair(transaction.id)}
                                                                    title="Cairkan Giro"
                                                                >
                                                                    ✓
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleTolak(transaction.id)}
                                                                    title="Tolak Giro"
                                                                >
                                                                    ✗
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {(giroTransactions?.last_page || 0) > 1 && (
                            <div className="flex items-center justify-between mt-4">
                                <div className="text-sm text-muted-foreground">
                                    Menampilkan {((giroTransactions?.current_page || 1) - 1) * (giroTransactions?.per_page || 10) + 1} -{" "}
                                    {Math.min((giroTransactions?.current_page || 1) * (giroTransactions?.per_page || 10), giroTransactions?.total || 0)}{" "}
                                    dari {giroTransactions?.total || 0} transaksi
                                </div>
                                <div className="flex space-x-2">
                                    {(giroTransactions?.current_page || 1) > 1 && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                router.get(route("kas.giro-transactions.index"), {
                                                    ...(filters || {}),
                                                    page: (giroTransactions?.current_page || 1) - 1,
                                                })
                                            }
                                        >
                                            Sebelumnya
                                        </Button>
                                    )}
                                    {(giroTransactions?.current_page || 1) < (giroTransactions?.last_page || 1) && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                router.get(route("kas.giro-transactions.index"), {
                                                    ...(filters || {}),
                                                    page: (giroTransactions?.current_page || 1) + 1,
                                                })
                                            }
                                        >
                                            Selanjutnya
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Hapus</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus transaksi giro ini? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
