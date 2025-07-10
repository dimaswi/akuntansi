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
    Landmark, 
    Eye, 
    CheckCircle, 
    Filter,
    ArrowUpDown,
    Calendar
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { route } from "ziggy-js";
import { usePermission } from "@/hooks/use-permission";

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
    bank_transactions: {
        data: BankTransaction[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string;
        jenis_transaksi?: string;
        status?: string;
        is_posted?: string;
        bank_account_id?: string;
        tanggal_dari?: string;
        tanggal_sampai?: string;
    };
    bank_accounts: BankAccount[];
    [key: string]: any;
}

const breadcrumbs = [
    { title: <Landmark className="h-4 w-4" />, href: route("kas.index") },
    { title: "Transaksi Bank", href: "#" },
];

export default function BankTransactionIndex() {
    const { bank_transactions, filters, bank_accounts } = usePage<Props>().props;
    const { hasPermission } = usePermission();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Filter states
    const [search, setSearch] = useState(filters.search || "");
    const [jenisTransaksi, setJenisTransaksi] = useState(filters.jenis_transaksi || "all");
    const [status, setStatus] = useState(filters.status || "all");
    const [isPosted, setIsPosted] = useState(filters.is_posted || "all");
    const [bankAccountId, setBankAccountId] = useState(filters.bank_account_id || "all");
    const [tanggalDari, setTanggalDari] = useState(filters.tanggal_dari || "");
    const [tanggalSampai, setTanggalSampai] = useState(filters.tanggal_sampai || "");

    const handleSearch = () => {
        router.get(route("kas.bank-transactions.index"), {
            search: search,
            jenis_transaksi: jenisTransaksi === "all" ? "" : jenisTransaksi,
            status: status === "all" ? "" : status,
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
        setJenisTransaksi("all");
        setStatus("all");
        setIsPosted("all");
        setBankAccountId("all");
        setTanggalDari("");
        setTanggalSampai("");
        router.get(route("kas.bank-transactions.index"));
    };

    const handleDelete = async () => {
        if (!deleteId) return;

        setIsDeleting(true);
        try {
            router.delete(route("kas.bank-transactions.destroy", deleteId), {
                onSuccess: () => {
                    toast.success("Transaksi bank berhasil dihapus");
                    setShowDeleteDialog(false);
                    setDeleteId(null);
                },
                onError: (error) => {
                    console.error("Delete error:", error);
                    toast.error("Gagal menghapus transaksi bank");
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
        // Redirect to batch posting page with single transaction
        router.visit(`/kas/bank-transactions/post-to-journal?ids[]=${id}`);
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
            <Head title="Transaksi Bank" />

            <div className="p-4">
                <div className="flex items-center justify-between pb-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg">
                            <Landmark className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Transaksi Bank</h1>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {hasPermission('akuntansi.journal-posting.view') && (
                            <Button 
                                variant="outline"
                                onClick={() => router.visit(route("kas.bank-transactions.show-post-to-journal"))}
                            >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Posting ke Jurnal
                            </Button>
                        )}
                        {hasPermission('kas.cash-management.daily-entry') && (
                            <Button onClick={() => router.visit(route("kas.bank-transactions.create"))}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Tambah Transaksi
                            </Button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Filter className="h-5 w-5" />
                            <span>Filter & Pencarian</span>
                        </CardTitle>
                        <CardDescription>
                            Filter transaksi bank berdasarkan kriteria tertentu
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="search">Pencarian</Label>
                                <Input
                                    id="search"
                                    placeholder="Nomor transaksi, keterangan..."
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
                                        {(bank_accounts || []).map((account) => (
                                            <SelectItem key={account.id} value={account.id.toString()}>
                                                {account.kode_rekening} - {account.nama_bank}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="jenis_transaksi">Jenis Transaksi</Label>
                                <Select value={jenisTransaksi} onValueChange={setJenisTransaksi}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Semua Jenis" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Jenis</SelectItem>
                                        <SelectItem value="penerimaan">Penerimaan</SelectItem>
                                        <SelectItem value="pengeluaran">Pengeluaran</SelectItem>
                                        <SelectItem value="transfer_masuk">Transfer Masuk</SelectItem>
                                        <SelectItem value="transfer_keluar">Transfer Keluar</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Semua Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Status</SelectItem>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="posted">Posted</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
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
                        <CardTitle>Daftar Transaksi Bank</CardTitle>
                        <CardDescription>
                            {bank_transactions.total} transaksi ditemukan
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[120px]">
                                            <Button variant="ghost" size="sm">
                                                No. Transaksi
                                                <ArrowUpDown className="ml-2 h-4 w-4" />
                                            </Button>
                                        </TableHead>
                                        <TableHead>
                                            <Button variant="ghost" size="sm">
                                                Tanggal
                                                <Calendar className="ml-2 h-4 w-4" />
                                            </Button>
                                        </TableHead>
                                        <TableHead>Bank Account</TableHead>
                                        <TableHead>Jenis</TableHead>
                                        <TableHead className="text-right">Jumlah</TableHead>
                                        <TableHead>Keterangan</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Posted</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {bank_transactions.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={9} className="text-center text-muted-foreground">
                                                Tidak ada transaksi bank ditemukan
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        bank_transactions.data.map((transaction) => (
                                            <TableRow key={transaction.id}>
                                                <TableCell className="font-medium">
                                                    {transaction.nomor_transaksi}
                                                </TableCell>
                                                <TableCell>
                                                    {formatDate(transaction.tanggal_transaksi)}
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
                                                    {getJenisTransaksiBadge(transaction.jenis_transaksi)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono">
                                                    <span
                                                        className={
                                                            transaction.jenis_transaksi === "penerimaan" ||
                                                            transaction.jenis_transaksi === "transfer_masuk"
                                                                ? "text-green-600"
                                                                : "text-red-600"
                                                        }
                                                    >
                                                        {formatCurrency(transaction.jumlah)}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="max-w-[200px] truncate">
                                                    {transaction.keterangan}
                                                </TableCell>
                                                <TableCell>{getStatusBadge(transaction.status)}</TableCell>
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
                                                        {hasPermission('kas.cash-management.view') && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() =>
                                                                    router.visit(
                                                                        route("kas.bank-transactions.show", transaction.id)
                                                                    )
                                                                }
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {!transaction.is_posted && (
                                                            <>
                                                                {hasPermission('kas.cash-management.daily-entry') && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            router.visit(
                                                                                route("kas.bank-transactions.edit", transaction.id)
                                                                            )
                                                                        }
                                                                    >
                                                                        <Edit3 className="h-4 w-4" />
                                                                    </Button>
                                                                )}
                                                                {hasPermission('akuntansi.journal-posting.post') && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handlePost(transaction.id)}
                                                                    >
                                                                        <CheckCircle className="h-4 w-4" />
                                                                    </Button>
                                                                )}
                                                                {hasPermission('kas.bank-transaction.delete') && (
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
                                                                )}
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
                        {bank_transactions.last_page > 1 && (
                            <div className="flex items-center justify-between mt-4">
                                <div className="text-sm text-muted-foreground">
                                    Menampilkan {(bank_transactions.current_page - 1) * bank_transactions.per_page + 1} -{" "}
                                    {Math.min(bank_transactions.current_page * bank_transactions.per_page, bank_transactions.total)}{" "}
                                    dari {bank_transactions.total} transaksi
                                </div>
                                <div className="flex space-x-2">
                                    {bank_transactions.current_page > 1 && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                router.get(route("kas.bank-transactions.index"), {
                                                    ...filters,
                                                    page: bank_transactions.current_page - 1,
                                                })
                                            }
                                        >
                                            Sebelumnya
                                        </Button>
                                    )}
                                    {bank_transactions.current_page < bank_transactions.last_page && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                router.get(route("kas.bank-transactions.index"), {
                                                    ...filters,
                                                    page: bank_transactions.current_page + 1,
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
                            Apakah Anda yakin ingin menghapus transaksi bank ini? Tindakan ini tidak dapat dibatalkan.
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
