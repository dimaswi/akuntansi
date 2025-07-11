import { Alert, AlertDescription } from "@/components/ui/alert";
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
import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem, SharedData } from "@/types";
import { Head, router, usePage } from "@inertiajs/react";
import { 
    BarChart3, 
    Download, 
    FileText, 
    Wallet,
    Landmark,
    DollarSign,
    Eye,
    AlertCircle
} from "lucide-react";
import { useState } from "react";

interface CashTransaction {
    id: number;
    nomor_transaksi: string;
    tanggal_transaksi: string;
    jenis_transaksi: string;
    jumlah: number;
    keterangan: string;
    status: 'draft' | 'pending_approval' | 'posted';
    daftar_akun_kas: {
        kode_akun: string;
        nama_akun: string;
    };
    daftar_akun_lawan?: {
        kode_akun: string;
        nama_akun: string;
    };
    user: {
        name: string;
    };
}

interface BankTransaction {
    id: number;
    nomor_transaksi: string;
    tanggal_transaksi: string;
    jenis_transaksi: string;
    jumlah: number;
    keterangan: string;
    status: 'draft' | 'pending_approval' | 'posted';
    bank_account: {
        nama_bank: string;
        nomor_rekening: string;
    };
    daftar_akun_lawan?: {
        kode_akun: string;
        nama_akun: string;
    };
    user: {
        name: string;
    };
}

interface StatusSummary {
    draft: {
        penerimaan?: number;
        pengeluaran?: number;
        setoran?: number;
        penarikan?: number;
        saldo: number;
        count: number;
    };
    pending_approval: {
        penerimaan?: number;
        pengeluaran?: number;
        setoran?: number;
        penarikan?: number;
        saldo: number;
        count: number;
    };
    posted: {
        penerimaan?: number;
        pengeluaran?: number;
        setoran?: number;
        penarikan?: number;
        saldo: number;
        count: number;
    };
    total: {
        penerimaan?: number;
        pengeluaran?: number;
        setoran?: number;
        penarikan?: number;
        saldo: number;
        count: number;
    };
}

interface CombinedSummary {
    draft: {
        total_masuk: number;
        total_keluar: number;
        saldo_bersih: number;
        count: number;
    };
    pending_approval: {
        total_masuk: number;
        total_keluar: number;
        saldo_bersih: number;
        count: number;
    };
    posted: {
        total_masuk: number;
        total_keluar: number;
        saldo_bersih: number;
        count: number;
    };
    total: {
        total_masuk: number;
        total_keluar: number;
        saldo_bersih: number;
        count: number;
    };
}

interface DailyBreakdown {
    tanggal: string;
    cash?: {
        penerimaan: number;
        pengeluaran: number;
    };
    bank?: {
        setoran: number;
        penarikan: number;
    };
}

interface Props extends SharedData {
    cashTransactions: CashTransaction[];
    bankTransactions: BankTransaction[];
    cashSummary: StatusSummary;
    bankSummary: StatusSummary;
    combinedSummary: CombinedSummary;
    dailyBreakdown: DailyBreakdown[];
    filters: {
        tanggal_dari: string;
        tanggal_sampai: string;
        status: string;
        jenis_laporan: string;
        tipe_laporan: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: <Wallet className="h-4 w-4" />,
        href: '/kas',
    },
    {
        title: 'Laporan',
        href: '#',
    },
    {
        title: 'Arus Kas & Bank',
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
        month: 'short',
        day: 'numeric',
    });
};

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'posted':
            return <Badge className="bg-green-100 text-green-800">Diposting</Badge>;
        case 'pending_approval':
            return <Badge className="bg-yellow-100 text-yellow-800">Menunggu Approval</Badge>;
        case 'draft':
            return <Badge variant="outline">Draft</Badge>;
        default:
            return <Badge variant="secondary">{status}</Badge>;
    }
};

export default function CashFlowReport() {
    const { 
        cashTransactions, 
        bankTransactions, 
        cashSummary, 
        bankSummary, 
        combinedSummary,
        dailyBreakdown,
        filters 
    } = usePage<Props>().props;

    const [activeTab, setActiveTab] = useState<'summary' | 'cash' | 'bank' | 'daily'>('summary');

    const handleFilterChange = (key: string, value: string) => {
        router.get('/kas/reports/cash-flow', {
            ...filters,
            [key]: value,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Arus Kas & Bank" />
            <div className="p-4">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5" />
                                    Laporan Arus Kas & Bank
                                </CardTitle>
                                <CardDescription>
                                    Laporan transaksi kas dan bank dengan status draft dan posted
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" className="gap-2">
                                    <Download className="h-4 w-4" />
                                    Export
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Filters */}
                        <div className="flex flex-col gap-4 md:flex-row md:items-end">
                            <div className="grid grid-cols-2 gap-4 flex-1">
                                <div>
                                    <Label htmlFor="tanggal_dari">Tanggal Dari</Label>
                                    <Input
                                        id="tanggal_dari"
                                        type="date"
                                        value={filters.tanggal_dari}
                                        onChange={(e) => handleFilterChange('tanggal_dari', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="tanggal_sampai">Tanggal Sampai</Label>
                                    <Input
                                        id="tanggal_sampai"
                                        type="date"
                                        value={filters.tanggal_sampai}
                                        onChange={(e) => handleFilterChange('tanggal_sampai', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <div>
                                    <Label>Status</Label>
                                    <Select
                                        value={filters.status}
                                        onValueChange={(value) => handleFilterChange('status', value)}
                                    >
                                        <SelectTrigger className="w-32">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua</SelectItem>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="pending_approval">Menunggu Approval</SelectItem>
                                            <SelectItem value="posted">Posted</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Jenis Laporan</Label>
                                    <Select
                                        value={filters.jenis_laporan}
                                        onValueChange={(value) => handleFilterChange('jenis_laporan', value)}
                                    >
                                        <SelectTrigger className="w-32">
                                            <SelectValue placeholder="Jenis" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="summary">Ringkasan</SelectItem>
                                            <SelectItem value="detail">Detail</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Alert untuk workflow baru */}
                        <Alert className="border-blue-200 bg-blue-50">
                            <AlertCircle className="h-4 w-4 text-blue-600" />
                            <AlertDescription className="text-blue-800">
                                <strong>Workflow Baru:</strong> Laporan ini menampilkan transaksi dengan status "Draft" (belum masuk jurnal), 
                                "Menunggu Approval" (memerlukan persetujuan), dan "Posted" (sudah masuk jurnal). 
                                Transaksi draft dan pending approval tidak mempengaruhi laporan akuntansi/jurnal.
                            </AlertDescription>
                        </Alert>

                        {/* Tab Navigation */}
                        <div className="border-b">
                            <nav className="-mb-px flex space-x-8">
                                <button
                                    onClick={() => setActiveTab('summary')}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                        activeTab === 'summary'
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <DollarSign className="inline h-4 w-4 mr-1" />
                                    Ringkasan
                                </button>
                                <button
                                    onClick={() => setActiveTab('cash')}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                        activeTab === 'cash'
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <Wallet className="inline h-4 w-4 mr-1" />
                                    Transaksi Kas
                                </button>
                                <button
                                    onClick={() => setActiveTab('bank')}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                        activeTab === 'bank'
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <Landmark className="inline h-4 w-4 mr-1" />
                                    Transaksi Bank
                                </button>
                                {filters.jenis_laporan === 'detail' && (
                                    <button
                                        onClick={() => setActiveTab('daily')}
                                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                            activeTab === 'daily'
                                                ? 'border-blue-500 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        <FileText className="inline h-4 w-4 mr-1" />
                                        Laporan Harian
                                    </button>
                                )}
                            </nav>
                        </div>

                        {/* Tab Content */}
                        <div className="mt-6">
                            {activeTab === 'summary' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-medium">Draft (Belum Diposting)</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <span className="text-sm text-green-600">Total Masuk:</span>
                                                        <span className="font-mono text-sm">{formatCurrency(combinedSummary.draft.total_masuk)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm text-red-600">Total Keluar:</span>
                                                        <span className="font-mono text-sm">{formatCurrency(combinedSummary.draft.total_keluar)}</span>
                                                    </div>
                                                    <div className="flex justify-between border-t pt-2">
                                                        <span className="text-sm font-medium">Saldo Bersih:</span>
                                                        <span className={`font-mono text-sm font-bold ${
                                                            combinedSummary.draft.saldo_bersih >= 0 ? 'text-green-600' : 'text-red-600'
                                                        }`}>
                                                            {formatCurrency(combinedSummary.draft.saldo_bersih)}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {combinedSummary.draft.count} transaksi
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-medium">Menunggu Approval</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <span className="text-sm text-green-600">Total Masuk:</span>
                                                        <span className="font-mono text-sm">{formatCurrency(combinedSummary.pending_approval.total_masuk)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm text-red-600">Total Keluar:</span>
                                                        <span className="font-mono text-sm">{formatCurrency(combinedSummary.pending_approval.total_keluar)}</span>
                                                    </div>
                                                    <div className="flex justify-between border-t pt-2">
                                                        <span className="text-sm font-medium">Saldo Bersih:</span>
                                                        <span className={`font-mono text-sm font-bold ${
                                                            combinedSummary.pending_approval.saldo_bersih >= 0 ? 'text-green-600' : 'text-red-600'
                                                        }`}>
                                                            {formatCurrency(combinedSummary.pending_approval.saldo_bersih)}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {combinedSummary.pending_approval.count} transaksi
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-medium">Posted (Sudah Diposting)</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <span className="text-sm text-green-600">Total Masuk:</span>
                                                        <span className="font-mono text-sm">{formatCurrency(combinedSummary.posted.total_masuk)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm text-red-600">Total Keluar:</span>
                                                        <span className="font-mono text-sm">{formatCurrency(combinedSummary.posted.total_keluar)}</span>
                                                    </div>
                                                    <div className="flex justify-between border-t pt-2">
                                                        <span className="text-sm font-medium">Saldo Bersih:</span>
                                                        <span className={`font-mono text-sm font-bold ${
                                                            combinedSummary.posted.saldo_bersih >= 0 ? 'text-green-600' : 'text-red-600'
                                                        }`}>
                                                            {formatCurrency(combinedSummary.posted.saldo_bersih)}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {combinedSummary.posted.count} transaksi
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-medium">Total Keseluruhan</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <span className="text-sm text-green-600">Total Masuk:</span>
                                                        <span className="font-mono text-sm">{formatCurrency(combinedSummary.total.total_masuk)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm text-red-600">Total Keluar:</span>
                                                        <span className="font-mono text-sm">{formatCurrency(combinedSummary.total.total_keluar)}</span>
                                                    </div>
                                                    <div className="flex justify-between border-t pt-2">
                                                        <span className="text-sm font-medium">Saldo Bersih:</span>
                                                        <span className={`font-mono text-sm font-bold ${
                                                            combinedSummary.total.saldo_bersih >= 0 ? 'text-green-600' : 'text-red-600'
                                                        }`}>
                                                            {formatCurrency(combinedSummary.total.saldo_bersih)}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {combinedSummary.total.count} transaksi
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Detail per kategori */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-base flex items-center gap-2">
                                                    <Wallet className="h-4 w-4" />
                                                    Detail Kas
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-3">
                                                    <div>
                                                        <h4 className="text-sm font-medium mb-2">Draft</h4>
                                                        <div className="text-sm space-y-1">
                                                            <div className="flex justify-between">
                                                                <span>Penerimaan:</span>
                                                                <span className="font-mono">{formatCurrency(cashSummary.draft.penerimaan || 0)}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span>Pengeluaran:</span>
                                                                <span className="font-mono">{formatCurrency(cashSummary.draft.pengeluaran || 0)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-medium mb-2">Menunggu Approval</h4>
                                                        <div className="text-sm space-y-1">
                                                            <div className="flex justify-between">
                                                                <span>Penerimaan:</span>
                                                                <span className="font-mono">{formatCurrency(cashSummary.pending_approval.penerimaan || 0)}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span>Pengeluaran:</span>
                                                                <span className="font-mono">{formatCurrency(cashSummary.pending_approval.pengeluaran || 0)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-medium mb-2">Posted</h4>
                                                        <div className="text-sm space-y-1">
                                                            <div className="flex justify-between">
                                                                <span>Penerimaan:</span>
                                                                <span className="font-mono">{formatCurrency(cashSummary.posted.penerimaan || 0)}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span>Pengeluaran:</span>
                                                                <span className="font-mono">{formatCurrency(cashSummary.posted.pengeluaran || 0)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-base flex items-center gap-2">
                                                    <Landmark className="h-4 w-4" />
                                                    Detail Bank
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-3">
                                                    <div>
                                                        <h4 className="text-sm font-medium mb-2">Draft</h4>
                                                        <div className="text-sm space-y-1">
                                                            <div className="flex justify-between">
                                                                <span>Setoran:</span>
                                                                <span className="font-mono">{formatCurrency(bankSummary.draft.setoran || 0)}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span>Penarikan:</span>
                                                                <span className="font-mono">{formatCurrency(bankSummary.draft.penarikan || 0)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-medium mb-2">Menunggu Approval</h4>
                                                        <div className="text-sm space-y-1">
                                                            <div className="flex justify-between">
                                                                <span>Setoran:</span>
                                                                <span className="font-mono">{formatCurrency(bankSummary.pending_approval.setoran || 0)}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span>Penarikan:</span>
                                                                <span className="font-mono">{formatCurrency(bankSummary.pending_approval.penarikan || 0)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-medium mb-2">Posted</h4>
                                                        <div className="text-sm space-y-1">
                                                            <div className="flex justify-between">
                                                                <span>Setoran:</span>
                                                                <span className="font-mono">{formatCurrency(bankSummary.posted.setoran || 0)}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span>Penarikan:</span>
                                                                <span className="font-mono">{formatCurrency(bankSummary.posted.penarikan || 0)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'cash' && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Detail Transaksi Kas</CardTitle>
                                        <CardDescription>
                                            {filters.status === 'draft' && 'Transaksi kas yang belum diposting ke jurnal'}
                                            {filters.status === 'pending_approval' && 'Transaksi kas yang menunggu persetujuan'}
                                            {filters.status === 'posted' && 'Transaksi kas yang sudah diposting ke jurnal'}
                                            {filters.status === 'all' && 'Semua transaksi kas'}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="border rounded-md">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Nomor</TableHead>
                                                        <TableHead>Tanggal</TableHead>
                                                        <TableHead>Jenis</TableHead>
                                                        <TableHead>Akun Kas</TableHead>
                                                        <TableHead>Jumlah</TableHead>
                                                        <TableHead>Keterangan</TableHead>
                                                        <TableHead>Status</TableHead>
                                                        <TableHead>Aksi</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {cashTransactions.length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                                                Tidak ada transaksi kas
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        cashTransactions.map((transaction) => (
                                                            <TableRow key={transaction.id}>
                                                                <TableCell className="font-medium">
                                                                    {transaction.nomor_transaksi}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {formatDate(transaction.tanggal_transaksi)}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge variant="outline">
                                                                        {transaction.jenis_transaksi}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="text-sm">
                                                                        <div className="font-medium">{transaction.daftar_akun_kas.nama_akun}</div>
                                                                        <div className="text-gray-500">{transaction.daftar_akun_kas.kode_akun}</div>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="font-mono">
                                                                    {formatCurrency(transaction.jumlah)}
                                                                </TableCell>
                                                                <TableCell className="max-w-xs truncate">
                                                                    {transaction.keterangan}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {getStatusBadge(transaction.status)}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => router.visit(`/kas/cash-transactions/${transaction.id}`)}
                                                                    >
                                                                        <Eye className="h-4 w-4" />
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {activeTab === 'bank' && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Detail Transaksi Bank</CardTitle>
                                        <CardDescription>
                                            {filters.status === 'draft' && 'Transaksi bank yang belum diposting ke jurnal'}
                                            {filters.status === 'pending_approval' && 'Transaksi bank yang menunggu persetujuan'}
                                            {filters.status === 'posted' && 'Transaksi bank yang sudah diposting ke jurnal'}
                                            {filters.status === 'all' && 'Semua transaksi bank'}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="border rounded-md">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Nomor</TableHead>
                                                        <TableHead>Tanggal</TableHead>
                                                        <TableHead>Bank</TableHead>
                                                        <TableHead>Jenis</TableHead>
                                                        <TableHead>Jumlah</TableHead>
                                                        <TableHead>Keterangan</TableHead>
                                                        <TableHead>Status</TableHead>
                                                        <TableHead>Aksi</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {bankTransactions.length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                                                Tidak ada transaksi bank
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        bankTransactions.map((transaction) => (
                                                            <TableRow key={transaction.id}>
                                                                <TableCell className="font-medium">
                                                                    {transaction.nomor_transaksi}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {formatDate(transaction.tanggal_transaksi)}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="text-sm">
                                                                        <div className="font-medium">{transaction.bank_account.nama_bank}</div>
                                                                        <div className="text-gray-500">{transaction.bank_account.nomor_rekening}</div>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge variant="outline">
                                                                        {transaction.jenis_transaksi}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="font-mono">
                                                                    {formatCurrency(transaction.jumlah)}
                                                                </TableCell>
                                                                <TableCell className="max-w-xs truncate">
                                                                    {transaction.keterangan}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {getStatusBadge(transaction.status)}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => router.visit(`/kas/bank-transactions/${transaction.id}`)}
                                                                    >
                                                                        <Eye className="h-4 w-4" />
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {activeTab === 'daily' && filters.jenis_laporan === 'detail' && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Laporan Harian</CardTitle>
                                        <CardDescription>
                                            Breakdown transaksi per hari dalam periode yang dipilih
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {dailyBreakdown.length === 0 ? (
                                                <div className="text-center py-8 text-muted-foreground">
                                                    Tidak ada data untuk detail harian
                                                </div>
                                            ) : (
                                                dailyBreakdown.map((day, index) => (
                                                    <Card key={index}>
                                                        <CardHeader>
                                                            <CardTitle className="text-base">
                                                                {formatDate(day.tanggal)}
                                                            </CardTitle>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div>
                                                                    <h4 className="font-medium mb-2 flex items-center gap-2">
                                                                        <Wallet className="h-4 w-4" />
                                                                        Kas
                                                                    </h4>
                                                                    <div className="space-y-1 text-sm">
                                                                        <div className="flex justify-between">
                                                                            <span>Penerimaan:</span>
                                                                            <span className="font-mono">{formatCurrency(day.cash?.penerimaan || 0)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span>Pengeluaran:</span>
                                                                            <span className="font-mono">{formatCurrency(day.cash?.pengeluaran || 0)}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-medium mb-2 flex items-center gap-2">
                                                                        <Landmark className="h-4 w-4" />
                                                                        Bank
                                                                    </h4>
                                                                    <div className="space-y-1 text-sm">
                                                                        <div className="flex justify-between">
                                                                            <span>Setoran:</span>
                                                                            <span className="font-mono">{formatCurrency(day.bank?.setoran || 0)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span>Penarikan:</span>
                                                                            <span className="font-mono">{formatCurrency(day.bank?.penarikan || 0)}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
