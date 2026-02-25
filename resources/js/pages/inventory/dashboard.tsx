import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    Package, 
    AlertTriangle, 
    TrendingUp, 
    FileCheck, 
    ArrowUpRight,
    ArrowDownRight,
    CheckCircle,
    Clock,
    XCircle,
    FileBarChart,
    ArrowRightLeft,
    ShoppingCart,
    Activity,
    BarChart3
} from 'lucide-react';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line
} from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard Inventory',
        href: '/inventory/dashboard',
    },
];

interface LowStockItem {
    id: number;
    item_code: string;
    item_name: string;
    department: string;
    quantity: number;
    min_stock: number;
    unit: string;
    shortage: number;
}

interface Activity {
    type: string;
    title: string;
    description: string;
    status: string;
    date: string;
    user: string;
    url: string;
}

interface StockCategory {
    category: string;
    total_items: number;
    total_quantity: number;
    total_value: number;
}

interface StockMovement {
    month: string;
    requests: number;
    transfers: number;
    adjustments: number;
}

interface OpnameStatus {
    department: string;
    has_monthly_opname: boolean;
    last_opname_date: string | null;
    status: string;
    can_create?: boolean;
}

interface Props {
    stats: {
        total_items: number;
        total_stock_value: number;
        low_stock_count: number;
        pending_requests: number;
    };
    lowStockItems: LowStockItem[];
    recentActivities: Activity[];
    stockByCategory: StockCategory[];
    pendingApprovals: {
        stock_requests: number;
        stock_transfers: number;
        stock_opnames: number;
        purchases: number;
    };
    stockMovement: StockMovement[];
    opnameStatus: OpnameStatus[];
    canAccessAccountingDashboard?: boolean;
}

const STATUS_COLORS = {
    draft: 'var(--color-chart-5)',
    pending: 'var(--color-chart-4)',
    approved: 'var(--color-chart-2)',
    rejected: 'var(--color-chart-3)',
    completed: 'var(--color-chart-2)',
    submitted: 'var(--color-chart-1)',
};

const MONO_COLORS = [
    'var(--color-chart-1)',
    'var(--color-chart-2)',
    'var(--color-chart-3)',
    'var(--color-chart-4)',
    'var(--color-chart-5)',
];

export default function InventoryDashboard({ 
    stats,
    lowStockItems,
    recentActivities,
    stockByCategory,
    pendingApprovals,
    stockMovement,
    opnameStatus,
    canAccessAccountingDashboard = false
}: Props) {

    const formatCurrency = (amount: number) => {
        const absAmount = Math.abs(amount);
        if (absAmount >= 1000000000) {
            return (amount >= 0 ? '' : '-') + 'Rp ' + (absAmount / 1000000000).toFixed(1) + 'M';
        } else if (absAmount >= 1000000) {
            return (amount >= 0 ? '' : '-') + 'Rp ' + (absAmount / 1000000).toFixed(1) + 'Jt';
        } else if (absAmount >= 1000) {
            return (amount >= 0 ? '' : '-') + 'Rp ' + (absAmount / 1000).toFixed(1) + 'Rb';
        }
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, any> = {
            draft: 'secondary',
            pending: 'default',
            submitted: 'default',
            approved: 'default',
            rejected: 'destructive',
            completed: 'default',
        };
        return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'stock_request':
                return <FileCheck className="h-4 w-4 text-foreground" />;
            case 'stock_transfer':
                return <ArrowRightLeft className="h-4 w-4 text-foreground" />;
            case 'stock_opname':
                return <FileBarChart className="h-4 w-4 text-foreground" />;
            default:
                return <Activity className="h-4 w-4 text-muted-foreground" />;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard Inventory" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                {/* Tabs - Only show if user has access to accounting dashboard */}
                {canAccessAccountingDashboard && (
                    <div className="flex border-b mb-2 gap-0">
                        <button
                            onClick={() => router.visit(route('dashboard.accounting'))}
                            className="px-4 py-2 -mb-px border-b-2 text-sm font-medium transition-colors border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground flex items-center gap-2"
                        >
                            <BarChart3 className="h-4 w-4" />
                            Akuntansi
                        </button>
                        <button
                            className="px-4 py-2 -mb-px border-b-2 text-sm font-medium transition-colors border-foreground text-foreground flex items-center gap-2"
                        >
                            <Package className="h-4 w-4" />
                            Inventory
                        </button>
                    </div>
                )}

                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-semibold">Dashboard Inventory</h1>
                        <p className="text-sm text-muted-foreground">
                            Overview dan monitoring sistem inventory
                        </p>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid auto-rows-min gap-4 md:grid-cols-4">
                    <div className="border rounded-lg p-4 bg-card">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Items</span>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-2xl font-bold tabular-nums">{stats.total_items.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">Item dalam inventory</p>
                    </div>

                    <div className="border rounded-lg p-4 bg-card">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Stock Value</span>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-2xl font-bold tabular-nums">{formatCurrency(stats.total_stock_value)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Nilai total persediaan</p>
                    </div>

                    <div className="border rounded-lg p-4 bg-card">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Low Stock Items</span>
                            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-2xl font-bold tabular-nums">{stats.low_stock_count}</div>
                        <p className="text-xs text-muted-foreground mt-1">Perlu diperhatikan</p>
                    </div>

                    <div className="border rounded-lg p-4 bg-card">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pending Requests</span>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-2xl font-bold tabular-nums">{stats.pending_requests}</div>
                        <p className="text-xs text-muted-foreground mt-1">Menunggu proses</p>
                    </div>
                </div>

                {/* Charts Row */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Stock by Category */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-sm font-medium">
                                <Package className="h-4 w-4 mr-2 text-muted-foreground" />
                                Stock by Category
                            </CardTitle>
                            <CardDescription>Distribusi stock per kategori</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={stockByCategory as any}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={(entry: any) => entry.category}
                                        outerRadius={80}
                                        fill="var(--color-chart-1)"
                                        dataKey="total_items"
                                    >
                                        {stockByCategory.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={MONO_COLORS[index % MONO_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Stock Movement Trend */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-sm font-medium">
                                <Activity className="h-4 w-4 mr-2 text-muted-foreground" />
                                Stock Movement (6 Months)
                            </CardTitle>
                            <CardDescription>Pergerakan stock 6 bulan terakhir</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={stockMovement}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="requests" stroke="var(--color-chart-1)" strokeWidth={2} name="Requests" />
                                    <Line type="monotone" dataKey="transfers" stroke="var(--color-chart-3)" strokeWidth={2} name="Transfers" />
                                    <Line type="monotone" dataKey="adjustments" stroke="var(--color-chart-5)" strokeWidth={2} name="Adjustments" />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Middle Section */}
                <div className="grid gap-4 md:grid-cols-3">
                    {/* Low Stock Items */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center text-sm font-medium">
                                <AlertTriangle className="h-4 w-4 mr-2 text-muted-foreground" />
                                Low Stock Alert
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 max-h-80 overflow-y-auto">
                                {lowStockItems.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <CheckCircle className="h-10 w-10 mx-auto mb-2 opacity-40" />
                                        <p className="text-sm">Semua stock dalam kondisi baik</p>
                                    </div>
                                ) : (
                                    lowStockItems.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between p-2.5 bg-muted/40 rounded-md border">
                                            <div className="flex-1">
                                                <div className="font-medium text-sm">{item.item_name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {item.item_code} • {item.department}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-semibold tabular-nums">
                                                    {item.quantity} {item.unit}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    Min: {item.min_stock} (Short: {item.shortage})
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pending Approvals */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-sm font-medium">
                                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                Pending Approvals
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center p-2.5 bg-muted/40 rounded-md">
                                    <span className="text-sm">Stock Requests</span>
                                    <Badge variant="secondary">{pendingApprovals.stock_requests}</Badge>
                                </div>
                                <div className="flex justify-between items-center p-2.5 bg-muted/40 rounded-md">
                                    <span className="text-sm">Stock Transfers</span>
                                    <Badge variant="secondary">{pendingApprovals.stock_transfers}</Badge>
                                </div>
                                <div className="flex justify-between items-center p-2.5 bg-muted/40 rounded-md">
                                    <span className="text-sm">Stock Opnames</span>
                                    <Badge variant="secondary">{pendingApprovals.stock_opnames}</Badge>
                                </div>
                                <div className="flex justify-between items-center p-2.5 bg-muted/40 rounded-md">
                                    <span className="text-sm">Purchases</span>
                                    <Badge variant="secondary">{pendingApprovals.purchases}</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Bottom Section */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Recent Activities */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-sm font-medium">
                                <Activity className="h-4 w-4 mr-2 text-muted-foreground" />
                                Recent Activities
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-1.5 max-h-96 overflow-y-auto">
                                {recentActivities.map((activity, idx) => (
                                    <div key={idx} className="flex items-start space-x-3 p-2.5 hover:bg-muted/50 rounded-md transition-colors cursor-pointer" onClick={() => router.visit(activity.url)}>
                                        <div className="mt-0.5 shrink-0">{getActivityIcon(activity.type)}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-sm font-medium truncate">{activity.title}</p>
                                                {getStatusBadge(activity.status)}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-0.5">{activity.description}</p>
                                            <p className="text-xs text-muted-foreground/70 mt-0.5">
                                                {activity.user} • {new Date(activity.date).toLocaleDateString('id-ID')}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stock Opname Status */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-sm font-medium">
                                <FileBarChart className="h-4 w-4 mr-2 text-muted-foreground" />
                                Stock Opname Status
                            </CardTitle>
                            <CardDescription>Status opname bulan ini</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {opnameStatus.map((status, idx) => (
                                    <div key={idx} className="p-2.5 rounded-md border bg-muted/20">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-medium text-sm">{status.department}</span>
                                            {status.has_monthly_opname ? (
                                                <CheckCircle className="h-4 w-4 text-foreground" />
                                            ) : (
                                                <XCircle className="h-4 w-4 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {status.last_opname_date ? (
                                                <>Last opname: {new Date(status.last_opname_date).toLocaleDateString('id-ID')}</>
                                            ) : (
                                                'Belum ada opname'
                                            )}
                                        </div>
                                        {status.can_create !== undefined && !status.has_monthly_opname && status.can_create && (
                                            <Button
                                                size="sm"
                                                className="mt-2 w-full"
                                                variant="outline"
                                                onClick={() => router.visit(route('stock-opnames.create'))}
                                            >
                                                Create Opname
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
