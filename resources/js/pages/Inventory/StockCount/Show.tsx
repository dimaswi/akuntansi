import React from 'react';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { PageProps, BreadcrumbItem } from '@/types';

interface Location {
    id: number;
    name: string;
}

interface Item {
    id: number;
    name: string;
    code: string;
    unit: string;
}

interface StockCountItem {
    id: number;
    item: Item;
    system_quantity: number;
    counted_quantity: number;
    variance: number;
    notes?: string;
}

interface StockCount {
    id: number;
    reference_number: string;
    location: Location;
    count_date: string;
    status: 'draft' | 'approved' | 'rejected';
    counted_by: {
        name: string;
    };
    approved_by?: {
        name: string;
    };
    approved_at?: string;
    notes?: string;
    items: StockCountItem[];
    total_variance: number;
    created_at: string;
    updated_at: string;
}

interface Props extends PageProps {
    stockCount: StockCount;
}

export default function StockCountShow({ auth, stockCount }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Inventory',
            href: '/inventory',
        },
        {
            title: 'Stock Count',
            href: '/inventory/stock-count',
        },
        {
            title: stockCount.reference_number,
            href: `/inventory/stock-count/${stockCount.id}`,
        },
    ];

    const handleApprove = () => {
        if (confirm('Are you sure you want to approve this stock count? This will apply all variances to the inventory.')) {
            router.post(`/inventory/stock-count/${stockCount.id}/approve`);
        }
    };

    const handleReject = () => {
        if (confirm('Are you sure you want to reject this stock count?')) {
            router.post(`/inventory/stock-count/${stockCount.id}/reject`);
        }
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this stock count?')) {
            router.delete(`/inventory/stock-count/${stockCount.id}`, {
                onSuccess: () => {
                    router.visit('/inventory/stock-count');
                },
            });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft': return 'bg-yellow-100 text-yellow-800';
            case 'approved': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getVarianceColor = (variance: number) => {
        if (variance > 0) return 'text-green-600';
        if (variance < 0) return 'text-red-600';
        return 'text-gray-600';
    };

    const getVarianceIcon = (variance: number) => {
        if (variance > 0) return '📈';
        if (variance < 0) return '📉';
        return '➖';
    };

    const getVarianceLabel = (variance: number, unit: string) => {
        if (variance > 0) return `Surplus of ${variance} ${unit}`;
        if (variance < 0) return `Shortage of ${Math.abs(variance)} ${unit}`;
        return `No variance`;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Stock Count - ${stockCount.reference_number}`} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                {/* Header Section */}
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                            Stock Count Details
                        </h2>
                        <p className="text-muted-foreground">{stockCount.reference_number}</p>
                    </div>
                    <div className="flex gap-2">
                        {stockCount.status === 'draft' && (
                            <>
                                <Button 
                                    onClick={handleApprove}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    ✅ Approve
                                </Button>
                                <Button 
                                    variant="outline"
                                    onClick={handleReject}
                                    className="text-red-600 border-red-600 hover:bg-red-50"
                                >
                                    ❌ Reject
                                </Button>
                            </>
                        )}
                        {stockCount.status !== 'approved' && (
                            <Button 
                                variant="outline"
                                onClick={handleDelete}
                                className="text-red-600 border-red-600 hover:bg-red-50"
                            >
                                🗑️ Delete
                            </Button>
                        )}
                        <Button 
                            variant="outline" 
                            onClick={() => router.visit('/inventory/stock-count')}
                        >
                            ← Back to List
                        </Button>
                    </div>
                </div>

                {/* Stock Count Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            📋 Stock Count Information
                            <Badge className={getStatusColor(stockCount.status)}>
                                {stockCount.status.charAt(0).toUpperCase() + stockCount.status.slice(1)}
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Reference Number</p>
                                    <p className="text-lg">{stockCount.reference_number}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Location</p>
                                    <p className="text-lg">{stockCount.location.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Count Date</p>
                                    <p className="text-lg">{new Date(stockCount.count_date).toLocaleDateString('id-ID')}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Counted By</p>
                                    <p className="text-lg">{stockCount.counted_by.name}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {stockCount.approved_by && (
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Approved By</p>
                                        <p className="text-lg">{stockCount.approved_by.name}</p>
                                    </div>
                                )}
                                {stockCount.approved_at && (
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Approved At</p>
                                        <p className="text-lg">{new Date(stockCount.approved_at).toLocaleDateString('id-ID')}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                                    <p className="text-lg">{stockCount.items.length}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Variance</p>
                                    <p className={`text-lg font-medium ${getVarianceColor(stockCount.total_variance)}`}>
                                        {getVarianceIcon(stockCount.total_variance)} {stockCount.total_variance > 0 ? '+' : ''}{stockCount.total_variance}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        {stockCount.notes && (
                            <>
                                <Separator className="my-4" />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-2">Notes</p>
                                    <p className="text-lg">{stockCount.notes}</p>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Stock Count Items */}
                <Card>
                    <CardHeader>
                        <CardTitle>📦 Counted Items</CardTitle>
                        <CardDescription>
                            Detailed breakdown of all items counted in this stock count
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stockCount.items.map((item) => (
                                <div key={item.id} className="p-4 border rounded-lg">
                                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                                        <div className="flex-1">
                                            <h3 className="font-medium">{item.item.name}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Code: {item.item.code} • Unit: {item.item.unit}
                                            </p>
                                        </div>
                                        
                                        <div className="grid grid-cols-3 gap-4 lg:w-auto">
                                            <div className="text-center">
                                                <p className="text-sm font-medium text-muted-foreground">System</p>
                                                <p className="text-lg">{item.system_quantity}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-medium text-muted-foreground">Counted</p>
                                                <p className="text-lg">{item.counted_quantity}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-medium text-muted-foreground">Variance</p>
                                                <p className={`text-lg font-medium ${getVarianceColor(item.variance)}`}>
                                                    {getVarianceIcon(item.variance)} {item.variance > 0 ? '+' : ''}{item.variance}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {item.variance !== 0 && (
                                        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded">
                                            <p className="text-sm text-amber-800">
                                                {getVarianceLabel(item.variance, item.item.unit)}
                                            </p>
                                        </div>
                                    )}
                                    
                                    {item.notes && (
                                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                                            <p className="text-sm font-medium text-blue-800 mb-1">Notes:</p>
                                            <p className="text-sm text-blue-700">{item.notes}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                            
                            {stockCount.items.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    No items in this stock count.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Summary */}
                {stockCount.items.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>📊 Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                    <p className="text-2xl font-bold text-blue-600">{stockCount.items.length}</p>
                                    <p className="text-sm text-blue-600">Total Items</p>
                                </div>
                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                    <p className="text-2xl font-bold text-green-600">
                                        {stockCount.items.filter(item => item.variance > 0).length}
                                    </p>
                                    <p className="text-sm text-green-600">Items with Surplus</p>
                                </div>
                                <div className="text-center p-4 bg-red-50 rounded-lg">
                                    <p className="text-2xl font-bold text-red-600">
                                        {stockCount.items.filter(item => item.variance < 0).length}
                                    </p>
                                    <p className="text-sm text-red-600">Items with Shortage</p>
                                </div>
                                <div className="text-center p-4 bg-gray-50 rounded-lg">
                                    <p className="text-2xl font-bold text-gray-600">
                                        {stockCount.items.filter(item => item.variance === 0).length}
                                    </p>
                                    <p className="text-sm text-gray-600">Items with No Variance</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Timestamps */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <p>Created: {new Date(stockCount.created_at).toLocaleString('id-ID')}</p>
                            <p>Last Updated: {new Date(stockCount.updated_at).toLocaleString('id-ID')}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
