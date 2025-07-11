import React, { useState } from 'react';
import { Head, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
    Bell, 
    Clock, 
    CheckCircle, 
    AlertTriangle,
    Filter,
    RefreshCw,
    XCircle,
    User,
    DollarSign,
    Calendar,
    TrendingUp
} from "lucide-react";
import { BreadcrumbItem, SharedData } from "@/types";

// Utility functions
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

interface ApprovalIndexProps {
    approvals: {
        data: any[];
        links: any[];
        meta: {
            total: number;
            last_page: number;
            current_page: number;
            per_page: number;
        };
    };
    summary: {
        pending_count: number;
        expired_count: number;
        my_approvals_today: number;
    };
    filters: {
        approval_type?: string;
        amount_min?: string;
        amount_max?: string;
    };
}

export default function ApprovalIndex({ 
    approvals = { data: [], links: [], meta: { total: 0, last_page: 1, current_page: 1, per_page: 20 } }, 
    summary = { pending_count: 0, expired_count: 0, my_approvals_today: 0 }, 
    filters = {} 
}: ApprovalIndexProps) {
    const [localFilters, setLocalFilters] = React.useState(filters);

    const breadcrumbItems: BreadcrumbItem[] = [
        { title: "Dashboard", href: "/" },
        { title: "Approvals", href: "/approvals" },
    ];

    const handleFilterChange = (key: string, value: string) => {
        setLocalFilters(prev => ({ ...prev, [key]: value }));
    };

    const applyFilters = () => {
        router.get('/approvals', localFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const clearFilters = () => {
        const clearedFilters = { approval_type: "all" };
        setLocalFilters(clearedFilters);
        router.get('/approvals', clearedFilters);
    };

    const handleApprove = (id: number, notes?: string) => {
        router.post(`/approvals/${id}/approve`, { 
            approval_notes: notes 
        });
    };

    const handleReject = (id: number, reason: string) => {
        router.post(`/approvals/${id}/reject`, { 
            rejection_reason: reason 
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge variant="outline" className="text-yellow-600 border-yellow-300"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
            case 'approved':
                return <Badge variant="outline" className="text-green-600 border-green-300"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
            case 'rejected':
                return <Badge variant="outline" className="text-red-600 border-red-300"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
            case 'escalated':
                return <Badge variant="outline" className="text-orange-600 border-orange-300"><AlertTriangle className="w-3 h-3 mr-1" /> Escalated</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getApprovalTypeLabel = (type: string) => {
        switch (type) {
            case 'transaction':
                return 'Transaction';
            case 'journal_posting':
                return 'Journal Posting';
            case 'monthly_closing':
                return 'Monthly Closing';
            default:
                return type.replace('_', ' ');
        }
    };

    return (
        <AppLayout
            breadcrumbs={breadcrumbItems}
        >
            <Head title="Approval Queue" />

            <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                            <Clock className="h-4 w-4 text-yellow-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{summary.pending_count}</div>
                            <p className="text-xs text-muted-foreground">
                                Awaiting your approval
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Expired Requests</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{summary.expired_count}</div>
                            <p className="text-xs text-muted-foreground">
                                Past deadline
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">My Approvals Today</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{summary.my_approvals_today}</div>
                            <p className="text-xs text-muted-foreground">
                                Approved by you today
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Queue</CardTitle>
                            <Bell className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{approvals?.meta?.total || 0}</div>
                            <p className="text-xs text-muted-foreground">
                                All approval requests
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="approval_type">Approval Type</Label>
                                <Select
                                    value={localFilters.approval_type || "all"}
                                    onValueChange={(value) => handleFilterChange('approval_type', value === "all" ? "" : value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All types" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All types</SelectItem>
                                        <SelectItem value="transaction">Transaction</SelectItem>
                                        <SelectItem value="journal_posting">Journal Posting</SelectItem>
                                        <SelectItem value="monthly_closing">Monthly Closing</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="amount_min">Min Amount</Label>
                                <Input
                                    id="amount_min"
                                    type="number"
                                    placeholder="0"
                                    value={localFilters.amount_min || ""}
                                    onChange={(e) => handleFilterChange('amount_min', e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="amount_max">Max Amount</Label>
                                <Input
                                    id="amount_max"
                                    type="number"
                                    placeholder="Unlimited"
                                    value={localFilters.amount_max || ""}
                                    onChange={(e) => handleFilterChange('amount_max', e.target.value)}
                                />
                            </div>

                            <div className="space-y-2 flex items-end">
                                <div className="space-x-2 w-full">
                                    <Button onClick={applyFilters} className="flex-1">
                                        Apply Filters
                                    </Button>
                                    <Button onClick={clearFilters} variant="outline" className="flex-1">
                                        Clear
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Approval List */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Approval Requests</h2>
                        <Button
                            onClick={() => router.reload()}
                            variant="outline"
                            size="sm"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                    </div>

                    {approvals?.data?.length === 0 ? (
                        <Card>
                            <CardContent className="text-center py-12">
                                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No approvals found</h3>
                                <p className="text-gray-500">
                                    There are no approval requests matching your criteria.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Request By</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Requested At</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {approvals?.data?.map((approval) => (
                                        <TableRow key={approval.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4 text-gray-500" />
                                                    <span className="font-medium">{approval.requested_by?.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{getApprovalTypeLabel(approval.approval_type)}</div>
                                                    <div className="text-sm text-gray-500">
                                                        {approval.approvable?.display_name || `${approval.approvable?.type} #${approval.approvable?.id}`}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {approval.amount && (
                                                    <div className="flex items-center gap-1">
                                                        <DollarSign className="w-4 h-4 text-green-600" />
                                                        <span className="font-medium">{formatCurrency(approval.amount)}</span>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(approval.status)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4 text-gray-500" />
                                                    <span className="text-sm">{formatDate(approval.created_at)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {approval.status === 'pending' && (
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleApprove(approval.id)}
                                                            className="h-8"
                                                        >
                                                            <CheckCircle className="w-3 h-3 mr-1" />
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => handleReject(approval.id, 'Rejected')}
                                                            className="h-8"
                                                        >
                                                            <XCircle className="w-3 h-3 mr-1" />
                                                            Reject
                                                        </Button>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Card>
                    )}

                    {/* Pagination */}
                    {approvals?.meta?.last_page > 1 && (
                        <div className="flex justify-center space-x-2 mt-6">
                            {approvals?.links?.map((link, index) => (
                                <Button
                                    key={index}
                                    variant={link.active ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => link.url && router.get(link.url)}
                                    disabled={!link.url}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
