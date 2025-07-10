import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem, SharedData } from "@/types";
import { Head, Link, usePage } from "@inertiajs/react";
import { 
    Wallet, 
    Building2, 
    Landmark, 
    Receipt, 
    TrendingUp, 
    TrendingDown, 
    PlusCircle,
    Eye,
    AlertCircle
} from "lucide-react";
import { usePermission } from "@/hooks/use-permission";

interface KasDashboardStats {
    total_cash_balance: number;
    total_bank_balance: number;
    pending_giro_count: number;
    today_transactions_count: number;
    monthly_cash_in: number;
    monthly_cash_out: number;
    monthly_bank_in: number;
    monthly_bank_out: number;
}

interface Props extends SharedData {
    stats: KasDashboardStats;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: <Wallet className="h-4 w-4" />,
        href: '/kas',
    },
];

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
};

export default function KasDashboard() {
    const { stats } = usePage<Props>().props;
    const { hasPermission } = usePermission();

    return (
        <AppLayout>
            <Head title="Kas & Bank Dashboard" />
            
            <div className="flex h-full flex-1 flex-col space-y-8 p-8">
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Kas & Bank Dashboard</h2>
                        <p className="text-muted-foreground">
                            Kelola transaksi kas, bank, dan giro dengan mudah
                        </p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {hasPermission('kas.cash-management.daily-entry') && (
                        <Card className="hover:shadow-md transition-shadow cursor-pointer">
                            <Link href="/kas/cash-transactions/create">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        Transaksi Kas Baru
                                    </CardTitle>
                                    <Wallet className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-600">+</div>
                                    <p className="text-xs text-muted-foreground">
                                        Tambah penerimaan/pengeluaran kas
                                    </p>
                                </CardContent>
                            </Link>
                        </Card>
                    )}

                    {hasPermission('kas.cash-management.daily-entry') && (
                        <Card className="hover:shadow-md transition-shadow cursor-pointer">
                            <Link href="/kas/bank-transactions/create">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        Transaksi Bank Baru
                                    </CardTitle>
                                    <Landmark className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-blue-600">+</div>
                                    <p className="text-xs text-muted-foreground">
                                        Tambah transaksi bank
                                    </p>
                                </CardContent>
                            </Link>
                        </Card>
                    )}

                    {hasPermission('kas.giro-transaction.create') && (
                        <Card className="hover:shadow-md transition-shadow cursor-pointer">
                            <Link href="/kas/giro-transactions/create">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        Giro Baru
                                    </CardTitle>
                                    <Receipt className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-purple-600">+</div>
                                    <p className="text-xs text-muted-foreground">
                                        Tambah giro masuk/keluar
                                    </p>
                                </CardContent>
                            </Link>
                        </Card>
                    )}

                    {hasPermission('kas.bank-account.create') && (
                        <Card className="hover:shadow-md transition-shadow cursor-pointer">
                            <Link href="/kas/bank-accounts/create">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        Bank Account Baru
                                    </CardTitle>
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-orange-600">+</div>
                                    <p className="text-xs text-muted-foreground">
                                        Tambah rekening bank
                                    </p>
                                </CardContent>
                            </Link>
                        </Card>
                    )}
                </div>

                {/* Balance Overview */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Saldo Kas
                            </CardTitle>
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(stats.total_cash_balance)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Saldo kas saat ini
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Saldo Bank
                            </CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(stats.total_bank_balance)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Total saldo semua rekening
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Giro Pending
                            </CardTitle>
                            <Receipt className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.pending_giro_count}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Giro menunggu pencairan
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Transaksi Hari Ini
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.today_transactions_count}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Total transaksi hari ini
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Monthly Flow */}
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Wallet className="h-5 w-5" />
                                Arus Kas Bulan Ini
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-green-500" />
                                    <span className="text-sm font-medium">Kas Masuk</span>
                                </div>
                                <span className="text-lg font-bold text-green-600">
                                    {formatCurrency(stats.monthly_cash_in)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <TrendingDown className="h-4 w-4 text-red-500" />
                                    <span className="text-sm font-medium">Kas Keluar</span>
                                </div>
                                <span className="text-lg font-bold text-red-600">
                                    {formatCurrency(stats.monthly_cash_out)}
                                </span>
                            </div>
                            <div className="pt-2 border-t">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Net Flow</span>
                                    <span className={`text-lg font-bold ${
                                        (stats.monthly_cash_in - stats.monthly_cash_out) >= 0 
                                            ? 'text-green-600' 
                                            : 'text-red-600'
                                    }`}>
                                        {formatCurrency(stats.monthly_cash_in - stats.monthly_cash_out)}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                Arus Bank Bulan Ini
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-green-500" />
                                    <span className="text-sm font-medium">Bank Masuk</span>
                                </div>
                                <span className="text-lg font-bold text-green-600">
                                    {formatCurrency(stats.monthly_bank_in)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <TrendingDown className="h-4 w-4 text-red-500" />
                                    <span className="text-sm font-medium">Bank Keluar</span>
                                </div>
                                <span className="text-lg font-bold text-red-600">
                                    {formatCurrency(stats.monthly_bank_out)}
                                </span>
                            </div>
                            <div className="pt-2 border-t">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Net Flow</span>
                                    <span className={`text-lg font-bold ${
                                        (stats.monthly_bank_in - stats.monthly_bank_out) >= 0 
                                            ? 'text-green-600' 
                                            : 'text-red-600'
                                    }`}>
                                        {formatCurrency(stats.monthly_bank_in - stats.monthly_bank_out)}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Access to Modules */}
                <Card>
                    <CardHeader>
                        <CardTitle>Akses Cepat</CardTitle>
                        <CardDescription>
                            Navigasi ke modul Kas & Bank
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {hasPermission('kas.cash-management.view') && (
                                <Button variant="outline" asChild className="h-20 flex-col">
                                    <Link href="/kas/cash-transactions">
                                        <Wallet className="h-6 w-6 mb-2" />
                                        <span>Transaksi Kas</span>
                                    </Link>
                                </Button>
                            )}

                            {hasPermission('kas.bank-account.view') && (
                                <Button variant="outline" asChild className="h-20 flex-col">
                                    <Link href="/kas/bank-accounts">
                                        <Building2 className="h-6 w-6 mb-2" />
                                        <span>Bank Accounts</span>
                                    </Link>
                                </Button>
                            )}

                            {hasPermission('kas.cash-management.view') && (
                                <Button variant="outline" asChild className="h-20 flex-col">
                                    <Link href="/kas/bank-transactions">
                                        <Landmark className="h-6 w-6 mb-2" />
                                        <span>Transaksi Bank</span>
                                    </Link>
                                </Button>
                            )}

                            {hasPermission('kas.giro-transaction.view') && (
                                <Button variant="outline" asChild className="h-20 flex-col">
                                    <Link href="/kas/giro-transactions">
                                        <Receipt className="h-6 w-6 mb-2" />
                                        <span>Transaksi Giro</span>
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
