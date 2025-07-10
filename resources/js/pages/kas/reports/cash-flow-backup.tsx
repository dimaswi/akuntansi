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
    Search, 
    TrendingDown, 
    TrendingUp, 
    Wallet,
    Landmark,
    DollarSign,
    Eye,
    AlertCircle
} from "lucide-react";
import { useState } from "react";
import { usePermission } from "@/hooks/use-permission";

interface CashTransaction {
    id: number;
    nomor_transaksi: string;
    tanggal_transaksi: string;
    jenis_transaksi: string;
    jumlah: number;
    keterangan: string;
    status: 'draft' | 'posted';
    daftar_akun_kas: {
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
    status: 'draft' | 'posted';
    bank_account: {
        nama_bank: string;
        nomor_rekening: string;
    };
    user: {
        name: string;
    };
}

interface Summary {
    saldo_awal: number;
    total_penerimaan: number;
    total_pengeluaran: number;
    saldo_akhir: number;
    draft_penerimaan: number;
    draft_pengeluaran: number;
    posted_penerimaan: number;
    posted_pengeluaran: number;
}

interface BankSummary {
    total_setoran: number;
    total_penarikan: number;
    draft_setoran: number;
    draft_penarikan: number;
    posted_setoran: number;
    posted_penarikan: number;
}

interface DailyBreakdown {
    tanggal: string;
    cash: {
        penerimaan: number;
        pengeluaran: number;
        transactions: CashTransaction[];
    };
    bank: {
        setoran: number;
        penarikan: number;
        transactions: BankTransaction[];
    };
}

interface Props extends SharedData {
    cashTransactions: CashTransaction[];
    bankTransactions: BankTransaction[];
    cashSummary: Summary;
    bankSummary: BankSummary;
    dailyBreakdown: DailyBreakdown[];
    filters: {
        tanggal_dari: string;
        tanggal_sampai: string;
        status: string;
        jenis_laporan: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: <Wallet className="h-4 w-4" />,
        href: '/kas',
    },
    {
        title: 'Laporan Arus Kas',
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
            return <Badge className="bg-green-100 text-green-800">Posted</Badge>;
        case 'draft':
            return <Badge variant="outline">Draft</Badge>;
        default:
            return <Badge variant="secondary">{status}</Badge>;
    }
};

export default function CashFlowReport() {
    const { cashTransactions, bankTransactions, cashSummary, bankSummary, dailyBreakdown, filters } = usePage<Props>().props;
    const { hasPermission } = usePermission();
    const [searchFilters, setSearchFilters] = useState(filters);
    const [activeTab, setActiveTab] = useState<'summary' | 'cash' | 'bank' | 'daily'>('summary');

    const handleFilterChange = (key: string, value: string) => {
        setSearchFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/kas/reports/cash-flow', searchFilters, {
            preserveState: true,
            replace: true,
        });
    };

    const handleExport = (format: 'pdf' | 'excel') => {
        const params = new URLSearchParams(searchFilters);
        params.append('export', format);
        window.open(`/kas/reports/cash-flow/export?${params.toString()}`, '_blank');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Arus Kas" />
            <div className="p-4 space-y-6">
                {/* Header */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5" />
                                    Laporan Arus Kas
                                </CardTitle>
                                <CardDescription>
                                    Laporan transaksi kas dan bank berdasarkan status posting
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
                                {hasPermission('kas.cash-management.report-export') && (
                                    <>
                                        <Button
                                            variant="outline"
                                            onClick={() => handleExport('pdf')}
                                            className="gap-2"
                                        >
                                            <FileText className="h-4 w-4" />
                                            Export PDF
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => handleExport('excel')}
                                            className="gap-2"
                                        >
                                            <Download className="h-4 w-4" />
                                            Export Excel
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="tanggal_dari">Tanggal Dari</Label>
                                    <Input
                                        id="tanggal_dari"
                                        type="date"
                                        value={searchFilters.tanggal_dari}
                                        onChange={(e) => handleFilterChange('tanggal_dari', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tanggal_sampai">Tanggal Sampai</Label>
                                    <Input
                                        id="tanggal_sampai"
                                        type="date"
                                        value={searchFilters.tanggal_sampai}
                                        onChange={(e) => handleFilterChange('tanggal_sampai', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select
                                        value={searchFilters.status}
                                        onValueChange={(value) => handleFilterChange('status', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua</SelectItem>
                                            <SelectItem value="draft">Draft (Belum ke Jurnal)</SelectItem>
                                            <SelectItem value="posted">Posted (Sudah ke Jurnal)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Jenis Laporan</Label>
                                    <Select
                                        value={searchFilters.jenis_laporan}
                                        onValueChange={(value) => handleFilterChange('jenis_laporan', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih jenis" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="summary">Ringkasan</SelectItem>
                                            <SelectItem value="detail">Detail Harian</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-end">
                                    <Button type="submit" className="w-full gap-2">
                                        <Search className="h-4 w-4" />
                                        Filter
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Cash Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Wallet className="h-5 w-5" />
                                Ringkasan Kas
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4 text-green-600" />
                                        <span className="text-sm font-medium">Total Penerimaan</span>
                                    </div>
                                    <p className="text-2xl font-bold text-green-600">
                                        {formatCurrency(cashSummary.total_penerimaan)}
                                    </p>
                                    <div className="text-xs text-gray-500">
                                        <p>Draft: {formatCurrency(cashSummary.draft_penerimaan)}</p>
                                        <p>Posted: {formatCurrency(cashSummary.posted_penerimaan)}</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <TrendingDown className="h-4 w-4 text-red-600" />
                                        <span className="text-sm font-medium">Total Pengeluaran</span>
                                    </div>
                                    <p className="text-2xl font-bold text-red-600">
                                        {formatCurrency(cashSummary.total_pengeluaran)}
                                    </p>
                                    <div className="text-xs text-gray-500">
                                        <p>Draft: {formatCurrency(cashSummary.draft_pengeluaran)}</p>
                                        <p>Posted: {formatCurrency(cashSummary.posted_pengeluaran)}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-4 border-t">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">Saldo Akhir</span>
                                    <span className={`text-xl font-bold ${cashSummary.saldo_akhir >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatCurrency(cashSummary.saldo_akhir)}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Bank Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Ringkasan Bank
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4 text-blue-600" />
                                        <span className="text-sm font-medium">Total Setoran</span>
                                    </div>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {formatCurrency(bankSummary.total_setoran)}
                                    </p>
                                    <div className="text-xs text-gray-500">
                                        <p>Draft: {formatCurrency(bankSummary.draft_setoran)}</p>
                                        <p>Posted: {formatCurrency(bankSummary.posted_setoran)}</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <TrendingDown className="h-4 w-4 text-red-600" />
                                        <span className="text-sm font-medium">Total Penarikan</span>
                                    </div>
                                    <p className="text-2xl font-bold text-red-600">
                                        {formatCurrency(bankSummary.total_penarikan)}
                                    </p>
                                    <div className="text-xs text-gray-500">
                                        <p>Draft: {formatCurrency(bankSummary.draft_penarikan)}</p>
                                        <p>Posted: {formatCurrency(bankSummary.posted_penarikan)}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Detailed Reports with Tab Navigation */}
                <div className="space-y-4">
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
                            <div className="space-y-4">
                                <Alert className="border-blue-200 bg-blue-50">
                                    <AlertCircle className="h-4 w-4 text-blue-600" />
                                    <AlertDescription className="text-blue-800">
                                        <strong>Workflow Baru:</strong> Transaksi dengan status "Draft" belum masuk jurnal, 
                                        sedangkan "Posted" sudah masuk jurnal dan mempengaruhi laporan keuangan.
                                    </AlertDescription>
                                </Alert>
                                
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Ringkasan Status Transaksi</CardTitle>
                                        <CardDescription>
                                            Perbandingan transaksi yang sudah dan belum diposting ke jurnal
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <h4 className="font-medium mb-3">Transaksi Kas</h4>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span>Draft (belum posting):</span>
                                                        <span className="font-mono">{cashTransactions.filter(t => t.status === 'draft').length} transaksi</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span>Posted (sudah posting):</span>
                                                        <span className="font-mono">{cashTransactions.filter(t => t.status === 'posted').length} transaksi</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm font-medium border-t pt-2">
                                                        <span>Total:</span>
                                                        <span className="font-mono">{cashTransactions.length} transaksi</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="font-medium mb-3">Transaksi Bank</h4>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span>Draft (belum posting):</span>
                                                        <span className="font-mono">{bankTransactions.filter(t => t.status === 'draft').length} transaksi</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span>Posted (sudah posting):</span>
                                                        <span className="font-mono">{bankTransactions.filter(t => t.status === 'posted').length} transaksi</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm font-medium border-t pt-2">
                                                        <span>Total:</span>
                                                        <span className="font-mono">{bankTransactions.length} transaksi</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {activeTab === 'cash' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Detail Transaksi Kas</CardTitle>
                                <CardDescription>
                                    {filters.status === 'draft' && 'Transaksi kas yang belum diposting ke jurnal'}
                                    {filters.status === 'posted' && 'Transaksi kas yang sudah diposting ke jurnal'}
                                    {filters.status === 'all' && 'Semua transaksi kas'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>No. Transaksi</TableHead>
                                            <TableHead>Tanggal</TableHead>
                                            <TableHead>Jenis</TableHead>
                                            <TableHead>Jumlah</TableHead>
                                            <TableHead>Akun Kas</TableHead>
                                            <TableHead>Keterangan</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Input By</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {cashTransactions.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                                    Tidak ada data transaksi kas
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
                                                        <Badge variant={
                                                            ['penerimaan', 'uang_muka_penerimaan', 'transfer_masuk'].includes(transaction.jenis_transaksi) 
                                                                ? 'default' : 'secondary'
                                                        }>
                                                            {transaction.jenis_transaksi.replace(/_/g, ' ').toUpperCase()}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="font-mono">
                                                        {formatCurrency(transaction.jumlah)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {transaction.daftar_akun_kas.kode_akun} - {transaction.daftar_akun_kas.nama_akun}
                                                    </TableCell>
                                                    <TableCell className="max-w-xs truncate">
                                                        {transaction.keterangan}
                                                    </TableCell>
                                                    <TableCell>
                                                        {getStatusBadge(transaction.status)}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-gray-500">
                                                        {transaction.user.name}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Bank Transactions */}
                    <TabsContent value="bank">
                        <Card>
                            <CardHeader>
                                <CardTitle>Detail Transaksi Bank</CardTitle>
                                <CardDescription>
                                    {filters.status === 'draft' && 'Transaksi bank yang belum diposting ke jurnal'}
                                    {filters.status === 'posted' && 'Transaksi bank yang sudah diposting ke jurnal'}
                                    {filters.status === 'all' && 'Semua transaksi bank'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>No. Transaksi</TableHead>
                                            <TableHead>Tanggal</TableHead>
                                            <TableHead>Jenis</TableHead>
                                            <TableHead>Jumlah</TableHead>
                                            <TableHead>Bank</TableHead>
                                            <TableHead>Keterangan</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Input By</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {bankTransactions.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                                    Tidak ada data transaksi bank
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
                                                        <Badge variant={
                                                            ['setoran', 'transfer_masuk', 'kliring_masuk', 'bunga_bank'].includes(transaction.jenis_transaksi) 
                                                                ? 'default' : 'secondary'
                                                        }>
                                                            {transaction.jenis_transaksi.replace(/_/g, ' ').toUpperCase()}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="font-mono">
                                                        {formatCurrency(transaction.jumlah)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {transaction.bank_account.nama_bank} - {transaction.bank_account.nomor_rekening}
                                                    </TableCell>
                                                    <TableCell className="max-w-xs truncate">
                                                        {transaction.keterangan}
                                                    </TableCell>
                                                    <TableCell>
                                                        {getStatusBadge(transaction.status)}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-gray-500">
                                                        {transaction.user.name}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Daily Breakdown */}
                    {filters.jenis_laporan === 'detail' && (
                        <TabsContent value="daily">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Laporan Harian</CardTitle>
                                    <CardDescription>
                                        Breakdown transaksi kas dan bank per hari
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {dailyBreakdown.map((day) => (
                                        <Card key={day.tanggal} className="p-4">
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="font-semibold">
                                                    {formatDate(day.tanggal)}
                                                </h4>
                                                <div className="flex gap-4 text-sm">
                                                    <span className="text-green-600">
                                                        Kas +{formatCurrency(day.cash.penerimaan)} -{formatCurrency(day.cash.pengeluaran)}
                                                    </span>
                                                    <span className="text-blue-600">
                                                        Bank +{formatCurrency(day.bank.setoran)} -{formatCurrency(day.bank.penarikan)}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Cash transactions for this day */}
                                                <div>
                                                    <h5 className="font-medium text-sm mb-2">Transaksi Kas ({day.cash.transactions.length})</h5>
                                                    {day.cash.transactions.length === 0 ? (
                                                        <p className="text-sm text-gray-500">Tidak ada transaksi kas</p>
                                                    ) : (
                                                        <div className="space-y-1">
                                                            {day.cash.transactions.map((transaction) => (
                                                                <div key={transaction.id} className="text-sm border rounded p-2">
                                                                    <div className="flex justify-between">
                                                                        <span className="font-medium">{transaction.nomor_transaksi}</span>
                                                                        <span className={
                                                                            ['penerimaan', 'uang_muka_penerimaan', 'transfer_masuk'].includes(transaction.jenis_transaksi)
                                                                                ? 'text-green-600' : 'text-red-600'
                                                                        }>
                                                                            {formatCurrency(transaction.jumlah)}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-xs text-gray-500 truncate">{transaction.keterangan}</p>
                                                                    <div className="flex justify-between items-center mt-1">
                                                                        <span className="text-xs">{transaction.jenis_transaksi}</span>
                                                                        {getStatusBadge(transaction.status)}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Bank transactions for this day */}
                                                <div>
                                                    <h5 className="font-medium text-sm mb-2">Transaksi Bank ({day.bank.transactions.length})</h5>
                                                    {day.bank.transactions.length === 0 ? (
                                                        <p className="text-sm text-gray-500">Tidak ada transaksi bank</p>
                                                    ) : (
                                                        <div className="space-y-1">
                                                            {day.bank.transactions.map((transaction) => (
                                                                <div key={transaction.id} className="text-sm border rounded p-2">
                                                                    <div className="flex justify-between">
                                                                        <span className="font-medium">{transaction.nomor_transaksi}</span>
                                                                        <span className={
                                                                            ['setoran', 'transfer_masuk', 'kliring_masuk', 'bunga_bank'].includes(transaction.jenis_transaksi)
                                                                                ? 'text-blue-600' : 'text-red-600'
                                                                        }>
                                                                            {formatCurrency(transaction.jumlah)}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-xs text-gray-500 truncate">{transaction.keterangan}</p>
                                                                    <div className="flex justify-between items-center mt-1">
                                                                        <span className="text-xs">{transaction.jenis_transaksi}</span>
                                                                        {getStatusBadge(transaction.status)}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )}
                </Tabs>
            </div>
        </AppLayout>
    );
}
