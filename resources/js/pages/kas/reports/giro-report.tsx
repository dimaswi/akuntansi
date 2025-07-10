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
    FileBarChart,
    Download,
    FileText,
    Search,
    TrendingDown,
    TrendingUp,
    Receipt,
    Landmark,
    DollarSign,
    Eye,
    AlertCircle,
    Clock,
    CheckCircle2,
    XCircle,
    Calendar
} from "lucide-react";
import { useState } from "react";
import { usePermission } from "@/hooks/use-permission";

interface GiroTransaction {
    id: number;
    nomor_giro: string;
    tanggal_terima: string;
    tanggal_jatuh_tempo: string;
    tanggal_cair?: string;
    jenis_giro: string;
    status_giro: string;
    status: 'draft' | 'posted';
    jumlah: number;
    nama_penerbit: string;
    bank_penerbit: string;
    keterangan: string;
    nomor_referensi?: string;
    bank_account: {
        id: number;
        nama_bank: string;
        nomor_rekening: string;
    };
    daftar_akun_giro: {
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

interface BankAccount {
    id: number;
    nama_bank: string;
    nomor_rekening: string;
}

interface GiroSummary {
    draft: {
        masuk: { count: number; total: number };
        keluar: { count: number; total: number };
    };
    posted: {
        masuk: { count: number; total: number };
        keluar: { count: number; total: number };
    };
    by_status_giro: {
        diterima: { count: number; total: number };
        diserahkan_ke_bank: { count: number; total: number };
        cair: { count: number; total: number };
        tolak: { count: number; total: number };
        batal: { count: number; total: number };
    };
    outstanding: { count: number; total: number };
    matured: { count: number; total: number };
}

interface DailyBreakdown {
    tanggal: string;
    draft: {
        masuk: { count: number; total: number };
        keluar: { count: number; total: number };
    };
    posted: {
        masuk: { count: number; total: number };
        keluar: { count: number; total: number };
    };
    transactions: GiroTransaction[];
}

interface PageProps {
    giroTransactions: GiroTransaction[];
    giroSummary: GiroSummary;
    dailyBreakdown: DailyBreakdown[];
    bankAccounts: BankAccount[];
    filters: {
        tanggal_dari: string;
        tanggal_sampai: string;
        status: string;
        status_giro: string;
        jenis_giro: string;
        bank_account_id: string;
        jenis_laporan: string;
    };
}

function getStatusGiroBadge(status: string) {
    const badgeMap = {
        'diterima': { variant: 'secondary', icon: Receipt, text: 'Diterima' },
        'diserahkan_ke_bank': { variant: 'default', icon: Landmark, text: 'Diserahkan ke Bank' },
        'cair': { variant: 'success', icon: CheckCircle2, text: 'Cair' },
        'tolak': { variant: 'destructive', icon: XCircle, text: 'Tolak' },
        'batal': { variant: 'outline', icon: XCircle, text: 'Batal' },
    };

    const config = badgeMap[status as keyof typeof badgeMap] || {
        variant: 'secondary',
        icon: Receipt,
        text: status
    };

    const Icon = config.icon;

    return (
        <Badge variant={config.variant as any} className="flex items-center gap-1">
            <Icon className="h-3 w-3" />
            {config.text}
        </Badge>
    );
}

function getStatusBadge(status: string) {
    return status === 'posted' ? (
        <Badge variant="default" className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Posted
        </Badge>
    ) : (
        <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Draft
        </Badge>
    );
}

function getJenisBadge(jenis: string) {
    return jenis === 'masuk' ? (
        <Badge variant="default" className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Masuk
        </Badge>
    ) : (
        <Badge variant="destructive" className="flex items-center gap-1">
            <TrendingDown className="h-3 w-3" />
            Keluar
        </Badge>
    );
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function isOverdue(tanggalJatuhTempo: string): boolean {
    return new Date(tanggalJatuhTempo) < new Date();
}

export default function GiroReport() {
    const { giroTransactions, giroSummary, dailyBreakdown, bankAccounts, filters } = usePage<SharedData & PageProps>().props;
    const { hasPermission } = usePermission();

    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('summary');

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value };

        router.get('/kas/reports/giro', newFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const exportData = () => {
        const exportParams = new URLSearchParams(filters);
        exportParams.set('export', 'excel');
        window.open(`/kas/reports/giro?${exportParams.toString()}`, '_blank');
    };

    const filteredTransactions = giroTransactions.filter(transaction => {
        const searchString = searchTerm.toLowerCase();
        return (
            transaction.nomor_giro.toLowerCase().includes(searchString) ||
            transaction.nama_penerbit.toLowerCase().includes(searchString) ||
            transaction.bank_penerbit.toLowerCase().includes(searchString) ||
            transaction.keterangan.toLowerCase().includes(searchString)
        );
    });

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: <Receipt className="h-4 w-4" />,
            href: '/kas',
        },
        {
            title: 'Laporan',
            href: '#',
        },
        {
            title: 'Giro',
            href: '#',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Giro" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-end mt-4">
                    <div className="flex items-center gap-2">
                        {hasPermission('laporan.giro-report.view') && (
                            <Button onClick={exportData} variant="outline" className="flex items-center gap-2">
                                <Download className="h-4 w-4" />
                                Export
                            </Button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Search className="h-5 w-5" />
                            Filter Laporan
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="tanggal_dari">Tanggal Dari</Label>
                            <Input
                                id="tanggal_dari"
                                type="date"
                                value={filters.tanggal_dari}
                                onChange={(e) => handleFilterChange('tanggal_dari', e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tanggal_sampai">Tanggal Sampai</Label>
                            <Input
                                id="tanggal_sampai"
                                type="date"
                                value={filters.tanggal_sampai}
                                onChange={(e) => handleFilterChange('tanggal_sampai', e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Status Posting</Label>
                            <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Status</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="posted">Posted</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Status Giro</Label>
                            <Select value={filters.status_giro} onValueChange={(value) => handleFilterChange('status_giro', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih status giro" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Status</SelectItem>
                                    <SelectItem value="diterima">Diterima</SelectItem>
                                    <SelectItem value="diserahkan_ke_bank">Diserahkan ke Bank</SelectItem>
                                    <SelectItem value="cair">Cair</SelectItem>
                                    <SelectItem value="tolak">Tolak</SelectItem>
                                    <SelectItem value="batal">Batal</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Jenis Giro</Label>
                            <Select value={filters.jenis_giro} onValueChange={(value) => handleFilterChange('jenis_giro', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih jenis" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Jenis</SelectItem>
                                    <SelectItem value="masuk">Giro Masuk</SelectItem>
                                    <SelectItem value="keluar">Giro Keluar</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Bank</Label>
                            <Select value={filters.bank_account_id} onValueChange={(value) => handleFilterChange('bank_account_id', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih bank" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Bank</SelectItem>
                                    {bankAccounts.map((bank) => (
                                        <SelectItem key={bank.id} value={bank.id.toString()}>
                                            {bank.nama_bank}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Tab Navigation */}
                <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
                    <button
                        onClick={() => setActiveTab('summary')}
                        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'summary'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Ringkasan
                    </button>
                    <button
                        onClick={() => setActiveTab('detail')}
                        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'detail'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Detail Transaksi
                    </button>
                    <button
                        onClick={() => setActiveTab('daily')}
                        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'daily'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Breakdown Harian
                    </button>
                </div>

                {/* Content */}
                {activeTab === 'summary' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Summary Cards */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Draft Giro</CardTitle>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {giroSummary.draft.masuk.count + giroSummary.draft.keluar.count}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {formatCurrency(giroSummary.draft.masuk.total + giroSummary.draft.keluar.total)}
                                </p>
                                <div className="mt-2 space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span>Masuk: {giroSummary.draft.masuk.count}</span>
                                        <span>{formatCurrency(giroSummary.draft.masuk.total)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span>Keluar: {giroSummary.draft.keluar.count}</span>
                                        <span>{formatCurrency(giroSummary.draft.keluar.total)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Posted Giro</CardTitle>
                                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {giroSummary.posted.masuk.count + giroSummary.posted.keluar.count}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {formatCurrency(giroSummary.posted.masuk.total + giroSummary.posted.keluar.total)}
                                </p>
                                <div className="mt-2 space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span>Masuk: {giroSummary.posted.masuk.count}</span>
                                        <span>{formatCurrency(giroSummary.posted.masuk.total)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span>Keluar: {giroSummary.posted.keluar.count}</span>
                                        <span>{formatCurrency(giroSummary.posted.keluar.total)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Outstanding Giro</CardTitle>
                                <Landmark className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{giroSummary.outstanding.count}</div>
                                <p className="text-xs text-muted-foreground">
                                    {formatCurrency(giroSummary.outstanding.total)}
                                </p>
                                <p className="text-xs text-orange-600 mt-1">
                                    Belum dicairkan
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Giro Jatuh Tempo</CardTitle>
                                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600">{giroSummary.matured.count}</div>
                                <p className="text-xs text-muted-foreground">
                                    {formatCurrency(giroSummary.matured.total)}
                                </p>
                                <p className="text-xs text-red-600 mt-1">
                                    Perlu perhatian
                                </p>
                            </CardContent>
                        </Card>

                        {/* Status Breakdown */}
                        <Card className="md:col-span-2 lg:col-span-4">
                            <CardHeader>
                                <CardTitle>Breakdown Status Giro</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                    {Object.entries(giroSummary.by_status_giro).map(([status, data]) => (
                                        <div key={status} className="p-4 border rounded-lg">
                                            <div className="flex items-center justify-between mb-2">
                                                {getStatusGiroBadge(status)}
                                            </div>
                                            <div className="text-2xl font-bold">{data.count}</div>
                                            <p className="text-xs text-muted-foreground">
                                                {formatCurrency(data.total)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'detail' && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Detail Transaksi Giro</CardTitle>
                                <CardDescription>
                                    Total: {filteredTransactions.length} transaksi
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Cari transaksi..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-8 w-64"
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nomor Giro</TableHead>
                                        <TableHead>Tanggal Terima</TableHead>
                                        <TableHead>Jatuh Tempo</TableHead>
                                        <TableHead>Jenis</TableHead>
                                        <TableHead>Status Giro</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Penerbit</TableHead>
                                        <TableHead>Bank</TableHead>
                                        <TableHead className="text-right">Jumlah</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredTransactions.map((transaction) => (
                                        <TableRow key={transaction.id}>
                                            <TableCell className="font-medium">
                                                {transaction.nomor_giro}
                                            </TableCell>
                                            <TableCell>
                                                {formatDate(transaction.tanggal_terima)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    {formatDate(transaction.tanggal_jatuh_tempo)}
                                                    {isOverdue(transaction.tanggal_jatuh_tempo) &&
                                                        ['diterima', 'diserahkan_ke_bank'].includes(transaction.status_giro) && (
                                                            <AlertCircle className="h-4 w-4 text-red-500" />
                                                        )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {getJenisBadge(transaction.jenis_giro)}
                                            </TableCell>
                                            <TableCell>
                                                {getStatusGiroBadge(transaction.status_giro)}
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(transaction.status)}
                                            </TableCell>
                                            <TableCell>{transaction.nama_penerbit}</TableCell>
                                            <TableCell>
                                                {transaction.bank_account.nama_bank}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatCurrency(transaction.jumlah)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'daily' && (
                    <div className="space-y-4">
                        {dailyBreakdown.map((day) => (
                            <Card key={day.tanggal}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Calendar className="h-5 w-5" />
                                        {formatDate(day.tanggal)}
                                        <Badge variant="secondary">
                                            {day.transactions.length} transaksi
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                        <div className="text-center p-3 border rounded">
                                            <div className="text-sm text-muted-foreground">Draft Masuk</div>
                                            <div className="font-semibold">{day.draft.masuk.count}</div>
                                            <div className="text-xs">{formatCurrency(day.draft.masuk.total)}</div>
                                        </div>
                                        <div className="text-center p-3 border rounded">
                                            <div className="text-sm text-muted-foreground">Draft Keluar</div>
                                            <div className="font-semibold">{day.draft.keluar.count}</div>
                                            <div className="text-xs">{formatCurrency(day.draft.keluar.total)}</div>
                                        </div>
                                        <div className="text-center p-3 border rounded">
                                            <div className="text-sm text-muted-foreground">Posted Masuk</div>
                                            <div className="font-semibold">{day.posted.masuk.count}</div>
                                            <div className="text-xs">{formatCurrency(day.posted.masuk.total)}</div>
                                        </div>
                                        <div className="text-center p-3 border rounded">
                                            <div className="text-sm text-muted-foreground">Posted Keluar</div>
                                            <div className="font-semibold">{day.posted.keluar.count}</div>
                                            <div className="text-xs">{formatCurrency(day.posted.keluar.total)}</div>
                                        </div>
                                    </div>

                                    {day.transactions.length > 0 && (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Nomor Giro</TableHead>
                                                    <TableHead>Jenis</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Penerbit</TableHead>
                                                    <TableHead className="text-right">Jumlah</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {day.transactions.map((transaction) => (
                                                    <TableRow key={transaction.id}>
                                                        <TableCell className="font-medium">
                                                            {transaction.nomor_giro}
                                                        </TableCell>
                                                        <TableCell>
                                                            {getJenisBadge(transaction.jenis_giro)}
                                                        </TableCell>
                                                        <TableCell>
                                                            {getStatusBadge(transaction.status)}
                                                        </TableCell>
                                                        <TableCell>{transaction.nama_penerbit}</TableCell>
                                                        <TableCell className="text-right">
                                                            {formatCurrency(transaction.jumlah)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
