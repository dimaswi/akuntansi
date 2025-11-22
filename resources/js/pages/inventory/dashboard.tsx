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
    draft: '#6b7280',
    pending: '#f59e0b',
    approved: '#10b981',
    rejected: '#ef4444',
    completed: '#10b981',
    submitted: '#3b82f6',
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

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
                return <FileCheck className="h-4 w-4 text-blue-600" />;
            case 'stock_transfer':
                return <ArrowRightLeft className="h-4 w-4 text-purple-600" />;
            case 'stock_opname':
                return <FileBarChart className="h-4 w-4 text-green-600" />;
            default:
                return <Activity className="h-4 w-4 text-gray-600" />;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard Inventory" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                {/* Tabs - Only show if user has access to accounting dashboard */}
                {canAccessAccountingDashboard && (
                    <div className="flex space-x-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-full max-w-md">
                        <button
                            onClick={() => router.visit(route('dashboard.accounting'))}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                        >
                            <BarChart3 className="h-4 w-4" />
                            Akuntansi
                        </button>
                        <button
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                        >
                            <Package className="h-4 w-4" />
                            Inventory
                        </button>
                    </div>
                )}

                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard Inventory</h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Overview dan monitoring sistem inventory
                        </p>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid auto-rows-min gap-4 md:grid-cols-4">
                    {/* Total Items */}
                    <Card className="border-l-4 border-l-blue-500">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center justify-between">
                                Total Items
                                <Package className="h-4 w-4 text-blue-600" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {stats.total_items.toLocaleString()}
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                Item dalam inventory
                            </p>
                        </CardContent>
                    </Card>

                    {/* Total Stock Value */}
                    <Card className="border-l-4 border-l-green-500">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center justify-between">
                                Total Stock Value
                                <TrendingUp className="h-4 w-4 text-green-600" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {formatCurrency(stats.total_stock_value)}
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                Nilai total persediaan
                            </p>
                        </CardContent>
                    </Card>

                    {/* Low Stock */}
                    <Card className="border-l-4 border-l-orange-500">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center justify-between">
                                Low Stock Items
                                <AlertTriangle className="h-4 w-4 text-orange-600" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                {stats.low_stock_count}
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                Perlu diperhatikan
                            </p>
                        </CardContent>
                    </Card>

                    {/* Pending Requests */}
                    <Card className="border-l-4 border-l-purple-500">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center justify-between">
                                Pending Requests
                                <Clock className="h-4 w-4 text-purple-600" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                {stats.pending_requests}
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                Menunggu proses
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Row */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Stock by Category */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-base">
                                <Package className="h-5 w-5 mr-2 text-blue-600" />
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
                                        fill="#8884d8"
                                        dataKey="total_items"
                                    >
                                        {stockByCategory.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                            <CardTitle className="flex items-center text-base">
                                <Activity className="h-5 w-5 mr-2 text-purple-600" />
                                Stock Movement (6 Months)
                            </CardTitle>
                            <CardDescription>Pergerakan stock 6 bulan terakhir</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={stockMovement}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="requests" stroke="#3b82f6" name="Requests" />
                                    <Line type="monotone" dataKey="transfers" stroke="#8b5cf6" name="Transfers" />
                                    <Line type="monotone" dataKey="adjustments" stroke="#10b981" name="Adjustments" />
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
                            <CardTitle className="flex items-center text-base">
                                <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
                                Low Stock Alert
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 max-h-80 overflow-y-auto">
                                {lowStockItems.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                                        <p>Semua stock dalam kondisi baik</p>
                                    </div>
                                ) : (
                                    lowStockItems.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-orange-200 dark:border-orange-900">
                                            <div className="flex-1">
                                                <div className="font-semibold text-sm">{item.item_name}</div>
                                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                                    {item.item_code} • {item.department}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-orange-600">
                                                    {item.quantity} {item.unit}
                                                </div>
                                                <div className="text-xs text-gray-600">
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
                            <CardTitle className="flex items-center text-base">
                                <Clock className="h-5 w-5 mr-2 text-blue-600" />
                                Pending Approvals
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <span className="text-sm font-medium">Stock Requests</span>
                                    <Badge variant="default">{pendingApprovals.stock_requests}</Badge>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                    <span className="text-sm font-medium">Stock Transfers</span>
                                    <Badge variant="default">{pendingApprovals.stock_transfers}</Badge>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    <span className="text-sm font-medium">Stock Opnames</span>
                                    <Badge variant="default">{pendingApprovals.stock_opnames}</Badge>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                    <span className="text-sm font-medium">Purchases</span>
                                    <Badge variant="default">{pendingApprovals.purchases}</Badge>
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
                            <CardTitle className="flex items-center text-base">
                                <Activity className="h-5 w-5 mr-2 text-gray-600" />
                                Recent Activities
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {recentActivities.map((activity, idx) => (
                                    <div key={idx} className="flex items-start space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer" onClick={() => router.visit(activity.url)}>
                                        <div className="mt-1">{getActivityIcon(activity.type)}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-semibold truncate">{activity.title}</p>
                                                {getStatusBadge(activity.status)}
                                            </div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{activity.description}</p>
                                            <p className="text-xs text-gray-500 mt-1">
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
                            <CardTitle className="flex items-center text-base">
                                <FileBarChart className="h-5 w-5 mr-2 text-green-600" />
                                Stock Opname Status
                            </CardTitle>
                            <CardDescription>Status opname bulan ini</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {opnameStatus.map((status, idx) => (
                                    <div key={idx} className={`p-3 rounded-lg border ${status.has_monthly_opname ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900' : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-900'}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-semibold text-sm">{status.department}</span>
                                            {status.has_monthly_opname ? (
                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                            ) : (
                                                <XCircle className="h-4 w-4 text-orange-600" />
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400">
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
