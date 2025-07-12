import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { PageProps, BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Inventory',
        href: '/inventory',
    },
];

interface StockSummary {
    total_items: number;
    total_categories: number;
    low_stock_count: number;
    out_of_stock_count: number;
    total_value: number;
    recent_movements: number;
}

interface LowStockItem {
    id: number;
    name: string;
    code: string;
    current_stock: number;
    minimum_stock: number;
    location: string;
    category: string;
    status: 'low_stock' | 'out_of_stock';
}

interface RecentMovement {
    id: number;
    item_name: string;
    type: 'in' | 'out' | 'transfer' | 'adjustment';
    quantity: number;
    location: string;
    created_at: string;
    reference: string;
}

interface Props extends PageProps {
    stockSummary: StockSummary;
    lowStockItems: LowStockItem[];
    recentMovements: RecentMovement[];
}

export default function InventoryDashboard({ auth, stockSummary, lowStockItems, recentMovements }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [locationFilter, setLocationFilter] = useState('all');

    const filteredLowStockItems = lowStockItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
        const matchesLocation = locationFilter === 'all' || item.location === locationFilter;
        
        return matchesSearch && matchesStatus && matchesLocation;
    });

    const getMovementIcon = (type: string) => {
        switch (type) {
            case 'in': return '↗️';
            case 'out': return '↙️';
            case 'transfer': return '↔️';
            default: return '📊';
        }
    };

    const getMovementColor = (type: string) => {
        switch (type) {
            case 'in': return 'bg-green-100 text-green-800';
            case 'out': return 'bg-red-100 text-red-800';
            case 'transfer': return 'bg-blue-100 text-blue-800';
            default: return 'bg-orange-100 text-orange-800';
        }
    };

    const getStockStatusColor = (status: string) => {
        switch (status) {
            case 'low_stock': return 'bg-yellow-100 text-yellow-800';
            case 'out_of_stock': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const Layout = ({ children }: { children: React.ReactNode }) => (
        <AppLayout breadcrumbs={breadcrumbs}>
            {children}
        </AppLayout>
    );

    return (
        <Layout>
            <Head title="Inventory Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                {/* Header Section */}
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Inventory Dashboard
                    </h2>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                            📥 Export
                        </Button>
                        <Button size="sm">
                            ➕ Add Item
                        </Button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                        <span className="text-2xl">📦</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stockSummary.total_items}</div>
                        <p className="text-xs text-muted-foreground">
                            Across {stockSummary.total_categories} categories
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Low Stock Alert</CardTitle>
                        <span className="text-2xl">⚠️</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">
                            {stockSummary.low_stock_count}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stockSummary.out_of_stock_count} out of stock
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                        <span className="text-2xl">💰</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            Rp {stockSummary.total_value.toLocaleString('id-ID')}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Current inventory value
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Recent Movements</CardTitle>
                        <span className="text-2xl">📈</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stockSummary.recent_movements}</div>
                        <p className="text-xs text-muted-foreground">
                            Last 7 days
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Low Stock Alert */}
            {stockSummary.low_stock_count > 0 && (
                <Card className="border-yellow-200 bg-yellow-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <span className="text-yellow-600">⚠️</span>
                            <p className="text-yellow-800">
                                You have {stockSummary.low_stock_count} items with low stock and {stockSummary.out_of_stock_count} items out of stock.
                                <Button variant="link" className="p-0 h-auto ml-1 text-yellow-600">
                                    Review now
                                </Button>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}                {/* Main Content Tabs */}
                <Tabs defaultValue="overview" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="low-stock">Low Stock Items</TabsTrigger>
                        <TabsTrigger value="movements">Recent Movements</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Quick Stats */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Inventory Status</CardTitle>
                                <CardDescription>Current stock level overview</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Normal Stock</span>
                                    <Badge variant="secondary">
                                        {stockSummary.total_items - stockSummary.low_stock_count} items
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Low Stock</span>
                                    <Badge className="bg-yellow-100 text-yellow-800">
                                        {stockSummary.low_stock_count - stockSummary.out_of_stock_count} items
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Out of Stock</span>
                                    <Badge variant="destructive">
                                        {stockSummary.out_of_stock_count} items
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                                <CardDescription>Common inventory operations</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Button className="w-full justify-start" variant="outline">
                                    ➕ Add New Item
                                </Button>
                                <Button className="w-full justify-start" variant="outline">
                                    📥 Stock In
                                </Button>
                                <Button className="w-full justify-start" variant="outline">
                                    📤 Stock Out
                                </Button>
                                <Button className="w-full justify-start" variant="outline">
                                    📊 Generate Report
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="low-stock" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Low Stock Items</CardTitle>
                            <CardDescription>Items requiring immediate attention</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                                <div className="relative flex-1">
                                    <Input
                                        placeholder="🔍 Search items..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-full sm:w-[180px]">
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="low_stock">Low Stock</SelectItem>
                                        <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={locationFilter} onValueChange={setLocationFilter}>
                                    <SelectTrigger className="w-full sm:w-[180px]">
                                        <SelectValue placeholder="Filter by location" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Locations</SelectItem>
                                        <SelectItem value="Pharmacy">Pharmacy</SelectItem>
                                        <SelectItem value="Warehouse">Warehouse</SelectItem>
                                        <SelectItem value="ICU">ICU</SelectItem>
                                        <SelectItem value="Emergency">Emergency</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Low Stock Items List */}
                            <div className="space-y-3">
                                {filteredLowStockItems.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <div>
                                                    <h3 className="font-medium">{item.name}</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        Code: {item.code} • {item.category}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-sm font-medium">
                                                    Stock: {item.current_stock} / {item.minimum_stock}
                                                </p>
                                                <p className="text-sm text-muted-foreground">{item.location}</p>
                                            </div>
                                            <Badge className={getStockStatusColor(item.status)}>
                                                {item.status === 'low_stock' ? 'Low Stock' : 'Out of Stock'}
                                            </Badge>
                                            <Button size="sm">
                                                Restock
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                
                                {filteredLowStockItems.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No items found matching your filters.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="movements" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Movements</CardTitle>
                            <CardDescription>Latest inventory transactions</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {recentMovements.map((movement) => (
                                    <div key={movement.id} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">{getMovementIcon(movement.type)}</span>
                                            <div>
                                                <h3 className="font-medium">{movement.item_name}</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {movement.reference} • {movement.location}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-sm font-medium">
                                                    {movement.type === 'out' ? '-' : '+'}{movement.quantity}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {new Date(movement.created_at).toLocaleDateString('id-ID')}
                                                </p>
                                            </div>
                                            <Badge className={getMovementColor(movement.type)}>
                                                {movement.type.charAt(0).toUpperCase() + movement.type.slice(1)}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                                
                                {recentMovements.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No recent movements found.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            </div>
        </Layout>
    );
}
