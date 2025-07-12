import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    {
        title: 'Stock Count',
        href: '/inventory/stock-count',
    },
];

interface Location {
    id: number;
    name: string;
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
    items_count: number;
    total_variance: number;
}

interface Props extends PageProps {
    stockCounts: {
        data: StockCount[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    locations: Location[];
    filters: {
        search?: string;
        location?: string;
        status?: string;
    };
}

export default function StockCountIndex({ auth, stockCounts, locations, filters }: Props) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [locationFilter, setLocationFilter] = useState(filters.location || 'all');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');

    const handleSearch = () => {
        router.get('/inventory/stock-count', {
            search: searchTerm,
            location: locationFilter !== 'all' ? locationFilter : undefined,
            status: statusFilter !== 'all' ? statusFilter : undefined,
        }, {
            preserveState: true,
            replace: true
        });
    };

    const handlePageChange = (page: number) => {
        router.get('/inventory/stock-count', {
            ...filters,
            page
        }, {
            preserveState: true,
            replace: true
        });
    };

    const handleApprove = (stockCountId: number) => {
        if (confirm('Are you sure you want to approve this stock count? This will apply all variances to the inventory.')) {
            router.post(`/inventory/stock-count/${stockCountId}/approve`);
        }
    };

    const handleReject = (stockCountId: number) => {
        if (confirm('Are you sure you want to reject this stock count?')) {
            router.post(`/inventory/stock-count/${stockCountId}/reject`);
        }
    };

    const handleDelete = (stockCountId: number) => {
        if (confirm('Are you sure you want to delete this stock count?')) {
            router.delete(`/inventory/stock-count/${stockCountId}`);
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Stock Count" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                {/* Header Section */}
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Stock Count
                    </h2>
                    <Button onClick={() => router.visit('/inventory/stock-count/create')}>
                        ➕ New Stock Count
                    </Button>
                </div>

                {/* Search and Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1">
                                <Input
                                    placeholder="🔍 Search by reference number or notes..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                            <Select value={locationFilter} onValueChange={setLocationFilter}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="Filter by location" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Locations</SelectItem>
                                    {locations.map((location) => (
                                        <SelectItem key={location.id} value={location.id.toString()}>
                                            {location.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button onClick={handleSearch}>
                                🔍 Search
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Stock Counts List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Stock Counts ({stockCounts.total})</CardTitle>
                        <CardDescription>Manage your stock count operations</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {stockCounts.data.map((stockCount) => (
                                <div key={stockCount.id} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-medium">{stockCount.reference_number}</h3>
                                                    <Badge className={getStatusColor(stockCount.status)}>
                                                        {stockCount.status.charAt(0).toUpperCase() + stockCount.status.slice(1)}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    Location: {stockCount.location.name} • 
                                                    Date: {new Date(stockCount.count_date).toLocaleDateString('id-ID')} • 
                                                    Items: {stockCount.items_count}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    Counted by: {stockCount.counted_by.name}
                                                    {stockCount.approved_by && (
                                                        <> • Approved by: {stockCount.approved_by.name}</>
                                                    )}
                                                </p>
                                                {stockCount.notes && (
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        Notes: {stockCount.notes}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-sm font-medium">
                                                Variance: 
                                                <span className={`ml-1 ${getVarianceColor(stockCount.total_variance)}`}>
                                                    {stockCount.total_variance > 0 ? '+' : ''}{stockCount.total_variance}
                                                </span>
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {new Date(stockCount.count_date).toLocaleDateString('id-ID')}
                                            </p>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Button 
                                                size="sm" 
                                                variant="outline"
                                                onClick={() => router.visit(`/inventory/stock-count/${stockCount.id}`)}
                                            >
                                                👁️ View
                                            </Button>
                                            {stockCount.status === 'draft' && (
                                                <>
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline"
                                                        onClick={() => handleApprove(stockCount.id)}
                                                        className="text-green-600 border-green-600 hover:bg-green-50"
                                                    >
                                                        ✅ Approve
                                                    </Button>
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline"
                                                        onClick={() => handleReject(stockCount.id)}
                                                        className="text-red-600 border-red-600 hover:bg-red-50"
                                                    >
                                                        ❌ Reject
                                                    </Button>
                                                </>
                                            )}
                                            {stockCount.status !== 'approved' && (
                                                <Button 
                                                    size="sm" 
                                                    variant="outline"
                                                    onClick={() => handleDelete(stockCount.id)}
                                                    className="text-red-600 border-red-600 hover:bg-red-50"
                                                >
                                                    🗑️ Delete
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            {stockCounts.data.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    {searchTerm || locationFilter !== 'all' || statusFilter !== 'all' 
                                        ? 'No stock counts found matching your filters.' 
                                        : 'No stock counts created yet.'}
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {stockCounts.last_page > 1 && (
                            <div className="flex justify-center gap-2 mt-6">
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    disabled={stockCounts.current_page === 1}
                                    onClick={() => handlePageChange(stockCounts.current_page - 1)}
                                >
                                    ← Previous
                                </Button>
                                
                                {Array.from({ length: Math.min(5, stockCounts.last_page) }, (_, i) => {
                                    const page = i + 1;
                                    return (
                                        <Button
                                            key={page}
                                            variant={stockCounts.current_page === page ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => handlePageChange(page)}
                                        >
                                            {page}
                                        </Button>
                                    );
                                })}
                                
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    disabled={stockCounts.current_page === stockCounts.last_page}
                                    onClick={() => handlePageChange(stockCounts.current_page + 1)}
                                >
                                    Next →
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
