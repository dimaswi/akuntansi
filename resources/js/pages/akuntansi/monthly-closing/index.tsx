import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
    Calendar, 
    Clock, 
    CheckCircle, 
    AlertTriangle,
    Plus,
    RefreshCw,
    Lock,
    Unlock,
    Eye,
    TrendingUp,
    FileText
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';

interface MonthlyClosing {
    id: number;
    periode_tahun: number;
    periode_bulan: number;
    periode: string;
    tanggal_cut_off: string;
    status: 'draft' | 'pending_approval' | 'approved' | 'closed' | 'reopened';
    initiated_by: {
        id: number;
        name: string;
    };
    approved_by?: {
        id: number;
        name: string;
    };
    closed_at?: string;
    reopened_at?: string;
    created_at: string;
}

interface MonthlyClosingIndexProps {
    closings: {
        data: MonthlyClosing[];
        links: any[];
        meta: {
            total: number;
            current_page: number;
            last_page: number;
        };
    };
    summary: {
        current_year: number;
        total_closings: number;
        closed_months: number;
        pending_approvals: number;
        last_closed_month?: number;
    };
    currentMonthClosing?: MonthlyClosing;
    canInitiateClosing: boolean;
    filters: {
        year: number;
        status: string;
    };
}

const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function MonthlyClosingIndex({ 
    closings, 
    summary, 
    currentMonthClosing, 
    canInitiateClosing = false,
    filters 
}: MonthlyClosingIndexProps) {
    
    const [selectedYear, setSelectedYear] = useState(filters.year.toString());
    const [selectedStatus, setSelectedStatus] = useState(filters.status);

    const breadcrumbItems: BreadcrumbItem[] = [
        {
            title: <Calendar className="h-4 w-4" />,
            href: '/akuntansi',
        },
        {
            title: 'Akuntansi',
            href: '/akuntansi',
        },
        {
            title: 'Monthly Closing',
            href: '#',
        },
    ];

    const applyFilters = () => {
        const params = new URLSearchParams();
        if (selectedYear !== filters.year.toString()) params.append('year', selectedYear);
        if (selectedStatus !== 'all') params.append('status', selectedStatus);
        
        router.get('/monthly-closing?' + params.toString());
    };

    const clearFilters = () => {
        setSelectedYear(new Date().getFullYear().toString());
        setSelectedStatus('all');
        router.get('/monthly-closing');
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'draft':
                return <Badge variant="outline" className="text-gray-600 border-gray-300"><FileText className="w-3 h-3 mr-1" /> Draft</Badge>;
            case 'pending_approval':
                return <Badge variant="outline" className="text-yellow-600 border-yellow-300"><Clock className="w-3 h-3 mr-1" /> Pending Approval</Badge>;
            case 'approved':
                return <Badge variant="outline" className="text-blue-600 border-blue-300"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
            case 'closed':
                return <Badge variant="outline" className="text-green-600 border-green-300"><Lock className="w-3 h-3 mr-1" /> Closed</Badge>;
            case 'reopened':
                return <Badge variant="outline" className="text-orange-600 border-orange-300"><Unlock className="w-3 h-3 mr-1" /> Reopened</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    return (
        <AppLayout breadcrumbs={breadcrumbItems}>
            <Head title="Monthly Closing" />

            <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Closings {summary.current_year}</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.total_closings}</div>
                            <p className="text-xs text-muted-foreground">
                                dari 12 bulan
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Closed Months</CardTitle>
                            <Lock className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{summary.closed_months}</div>
                            <p className="text-xs text-muted-foreground">
                                periode ditutup
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                            <Clock className="h-4 w-4 text-yellow-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{summary.pending_approvals}</div>
                            <p className="text-xs text-muted-foreground">
                                menunggu approval
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Last Closed</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {summary.last_closed_month ? monthNames[summary.last_closed_month - 1] : 'None'}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                periode terakhir
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Current Month Status */}
                {filters.year === currentYear && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Status Bulan Ini - {monthNames[currentMonth - 1]} {currentYear}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {currentMonthClosing ? (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div>
                                            {getStatusBadge(currentMonthClosing.status)}
                                        </div>
                                        <div>
                                            <p className="font-medium">Monthly closing sudah dibuat</p>
                                            <p className="text-sm text-gray-600">
                                                Cut-off: {formatDate(currentMonthClosing.tanggal_cut_off)}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => router.get(`/monthly-closing/${currentMonthClosing.id}`)}
                                        variant="outline"
                                    >
                                        <Eye className="h-4 w-4 mr-2" />
                                        View Details
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Belum ada monthly closing untuk bulan ini</p>
                                        <p className="text-sm text-gray-600">
                                            {canInitiateClosing 
                                                ? 'Anda dapat memulai proses monthly closing'
                                                : 'Belum dapat memulai monthly closing'
                                            }
                                        </p>
                                    </div>
                                    {canInitiateClosing && (
                                        <Button
                                            onClick={() => router.get(`/monthly-closing/create?year=${currentYear}&month=${currentMonth}`)}
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Initiate Closing
                                        </Button>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle>Filters</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Select value={selectedYear} onValueChange={setSelectedYear}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Tahun" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map(year => (
                                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="pending_approval">Pending Approval</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="closed">Closed</SelectItem>
                                    <SelectItem value="reopened">Reopened</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="flex gap-2">
                                <Button onClick={applyFilters} className="flex-1">
                                    Apply Filters
                                </Button>
                                <Button onClick={clearFilters} variant="outline" className="flex-1">
                                    Clear
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Monthly Closings Table */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Monthly Closings ({closings?.meta?.total || 0})</h3>
                        <Button
                            onClick={() => router.reload()}
                            variant="outline"
                            size="sm"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                    </div>

                    {closings?.data?.length === 0 ? (
                        <Card>
                            <CardContent className="text-center py-12">
                                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No monthly closings found</h3>
                                <p className="text-gray-500">
                                    Belum ada monthly closing untuk periode yang dipilih.
                                </p>
                                {canInitiateClosing && (
                                    <Button
                                        onClick={() => router.get('/monthly-closing/create')}
                                        className="mt-4"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Initiate Monthly Closing
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Periode</TableHead>
                                        <TableHead>Cut-off Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Initiated By</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {closings?.data?.map((closing) => (
                                        <TableRow key={closing.id}>
                                            <TableCell>
                                                <div className="font-medium">{closing.periode}</div>
                                                <div className="text-sm text-gray-500">
                                                    {closing.periode_tahun} - {monthNames[closing.periode_bulan - 1]}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4 text-gray-500" />
                                                    <span className="text-sm">{formatDate(closing.tanggal_cut_off)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(closing.status)}
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-medium">{closing.initiated_by.name}</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm">{formatDate(closing.created_at)}</span>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => router.get(`/monthly-closing/${closing.id}`)}
                                                >
                                                    <Eye className="w-3 h-3 mr-1" />
                                                    View
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Card>
                    )}

                    {/* Pagination */}
                    {closings?.meta?.last_page > 1 && (
                        <div className="flex justify-center space-x-2 mt-6">
                            {closings?.links?.map((link, index) => (
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
