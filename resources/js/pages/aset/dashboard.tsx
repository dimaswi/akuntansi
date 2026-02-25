import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Landmark, Package, TrendingDown, Wrench, ArrowRightLeft, AlertTriangle, Shield, ClipboardList } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface Statistics {
    total_assets: number;
    active_assets: number;
    maintenance_assets: number;
    disposed_assets: number;
    total_acquisition_cost: number;
    total_book_value: number;
    total_depreciation: number;
}

interface CategoryData {
    id: number;
    name: string;
    count: number;
    book_value: number;
}

interface DepartmentData {
    department: string;
    count: number;
    book_value: number;
}

interface MaintenanceData {
    id: number;
    maintenance_number: string;
    scheduled_date: string;
    type: string;
    status: string;
    asset: { id: number; code: string; name: string };
}

interface AssetData {
    id: number;
    code: string;
    name: string;
    acquisition_cost: number;
    current_book_value: number;
    warranty_expiry_date?: string;
    category?: { id: number; name: string };
}

interface BudgetSummary {
    id: number;
    code: string;
    fiscal_year: number;
    total_budget: number;
    total_realized: number;
    status: string;
    total_items: number;
    realized_items: number;
    pending_items: number;
}

interface Props extends SharedData {
    statistics: Statistics;
    assetsByCategory: CategoryData[];
    assetsByDepartment: DepartmentData[];
    assetsByCondition: Record<string, number>;
    upcomingMaintenances: MaintenanceData[];
    nearFullyDepreciated: AssetData[];
    warrantyExpiringSoon: AssetData[];
    budgetSummary: BudgetSummary | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: <Landmark className="h-4 w-4" />, href: '#' },
    { title: 'Dashboard Aset', href: '#' },
];

const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const conditionLabels: Record<string, string> = {
    excellent: 'Sangat Baik',
    good: 'Baik',
    fair: 'Cukup',
    poor: 'Kurang',
    damaged: 'Rusak',
};

const conditionColors: Record<string, string> = {
    excellent: 'bg-green-500',
    good: 'bg-blue-500',
    fair: 'bg-yellow-500',
    poor: 'bg-orange-500',
    damaged: 'bg-red-500',
};

export default function AssetDashboard() {
    const {
        statistics,
        assetsByCategory,
        assetsByDepartment,
        assetsByCondition,
        upcomingMaintenances,
        nearFullyDepreciated,
        warrantyExpiringSoon,
        budgetSummary,
    } = usePage<Props>().props;

    const depreciationPercentage = statistics.total_acquisition_cost > 0
        ? (statistics.total_depreciation / statistics.total_acquisition_cost) * 100
        : 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard Aset" />
            <div className="space-y-6 p-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Aset</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.total_assets}</div>
                            <p className="text-xs text-muted-foreground">
                                {statistics.active_assets} aktif, {statistics.maintenance_assets} maintenance
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Nilai Perolehan</CardTitle>
                            <Landmark className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{fmtCurrency(statistics.total_acquisition_cost)}</div>
                            <p className="text-xs text-muted-foreground">Total harga perolehan semua aset</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Nilai Buku</CardTitle>
                            <TrendingDown className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{fmtCurrency(statistics.total_book_value)}</div>
                            <Progress value={100 - depreciationPercentage} className="mt-2" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Akumulasi Penyusutan</CardTitle>
                            <TrendingDown className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{fmtCurrency(statistics.total_depreciation)}</div>
                            <p className="text-xs text-muted-foreground">{depreciationPercentage.toFixed(1)}% dari nilai perolehan</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Assets by Category */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Aset per Kategori</CardTitle>
                            <CardDescription>Distribusi aset berdasarkan kategori</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {assetsByCategory.map((cat) => (
                                    <div key={cat.id} className="flex items-center justify-between rounded-lg border p-3">
                                        <div>
                                            <p className="font-medium">{cat.name}</p>
                                            <p className="text-sm text-muted-foreground">{cat.count} aset</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">{fmtCurrency(cat.book_value)}</p>
                                        </div>
                                    </div>
                                ))}
                                {assetsByCategory.length === 0 && <p className="text-sm text-muted-foreground">Belum ada data</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Assets by Condition */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Kondisi Aset</CardTitle>
                            <CardDescription>Distribusi aset berdasarkan kondisi</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {Object.entries(assetsByCondition).map(([condition, count]) => (
                                    <div key={condition} className="flex items-center gap-3">
                                        <div className={`h-3 w-3 rounded-full ${conditionColors[condition] ?? 'bg-gray-400'}`} />
                                        <span className="flex-1">{conditionLabels[condition] ?? condition}</span>
                                        <Badge variant="secondary">{count}</Badge>
                                    </div>
                                ))}
                                {Object.keys(assetsByCondition).length === 0 && <p className="text-sm text-muted-foreground">Belum ada data</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Upcoming Maintenance */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Wrench className="h-5 w-5" />
                                Maintenance Mendatang
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {upcomingMaintenances.map((m) => (
                                    <div key={m.id} className="flex items-center justify-between rounded-lg border p-3">
                                        <div>
                                            <p className="font-medium">{m.asset.code} - {m.asset.name}</p>
                                            <p className="text-sm text-muted-foreground">{m.maintenance_number}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm">{new Date(m.scheduled_date).toLocaleDateString('id-ID')}</p>
                                            <Badge variant={m.status === 'in_progress' ? 'default' : 'secondary'}>
                                                {m.status === 'scheduled' ? 'Terjadwal' : 'Dalam Proses'}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                                {upcomingMaintenances.length === 0 && <p className="text-sm text-muted-foreground">Tidak ada jadwal</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Warranty Expiring Soon */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Garansi Segera Berakhir
                            </CardTitle>
                            <CardDescription>Dalam 90 hari ke depan</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {warrantyExpiringSoon.map((a) => (
                                    <div key={a.id} className="flex items-center justify-between rounded-lg border p-3">
                                        <div>
                                            <p className="font-medium">{a.code}</p>
                                            <p className="text-sm text-muted-foreground">{a.name}</p>
                                        </div>
                                        <Badge variant="destructive">
                                            {a.warranty_expiry_date ? new Date(a.warranty_expiry_date).toLocaleDateString('id-ID') : '-'}
                                        </Badge>
                                    </div>
                                ))}
                                {warrantyExpiringSoon.length === 0 && <p className="text-sm text-muted-foreground">Tidak ada aset</p>}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* RAB Tahun Ini */}
                {budgetSummary && (
                    <Card className="cursor-pointer hover:border-blue-300 transition-colors" onClick={() => router.visit(route('aset.budgets.show', budgetSummary.id))}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ClipboardList className="h-5 w-5 text-blue-500" />
                                RAB Tahun {budgetSummary.fiscal_year}
                            </CardTitle>
                            <CardDescription>{budgetSummary.code}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-4 mb-3">
                                <div>
                                    <p className="text-sm text-gray-500">Anggaran</p>
                                    <p className="text-lg font-bold">{fmtCurrency(budgetSummary.total_budget)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Terealisasi</p>
                                    <p className="text-lg font-bold text-green-600">{fmtCurrency(budgetSummary.total_realized)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Sisa</p>
                                    <p className="text-lg font-bold text-orange-600">{fmtCurrency(budgetSummary.total_budget - budgetSummary.total_realized)}</p>
                                </div>
                            </div>
                            <div className="mb-2">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm text-muted-foreground">Progress Realisasi</span>
                                    <span className="text-sm font-medium">
                                        {budgetSummary.total_budget > 0 ? ((budgetSummary.total_realized / budgetSummary.total_budget) * 100).toFixed(1) : 0}%
                                    </span>
                                </div>
                                <Progress value={budgetSummary.total_budget > 0 ? (budgetSummary.total_realized / budgetSummary.total_budget) * 100 : 0} className="h-2" />
                            </div>
                            <div className="flex gap-4 text-sm text-muted-foreground">
                                <span>{budgetSummary.realized_items}/{budgetSummary.total_items} item terpenuhi</span>
                                <span>{budgetSummary.pending_items} item pending</span>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Near Fully Depreciated */}
                {nearFullyDepreciated.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-amber-500" />
                                Aset Mendekati Fully Depreciated
                            </CardTitle>
                            <CardDescription>Nilai buku kurang dari 10% nilai perolehan</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                {nearFullyDepreciated.map((a) => (
                                    <div key={a.id} className="flex items-center justify-between rounded-lg border p-3">
                                        <div>
                                            <p className="font-medium">{a.code}</p>
                                            <p className="text-sm text-muted-foreground">{a.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-amber-600">{fmtCurrency(a.current_book_value)}</p>
                                            <p className="text-xs text-muted-foreground">dari {fmtCurrency(a.acquisition_cost)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
