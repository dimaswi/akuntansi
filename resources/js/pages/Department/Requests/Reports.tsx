import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Download, Filter, Calendar, TrendingUp, Package, Users, DollarSign } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { PageProps, BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Departemen',
        href: '/departments',
    },
    {
        title: 'Permintaan Departemen',
        href: '/department-requests',
    },
    {
        title: 'Laporan',
        href: '/department-requests/reports',
    },
];

interface Department {
    id: number;
    name: string;
    code: string;
}

interface User {
    id: number;
    name: string;
    nip: string;
}

interface DepartmentRequest {
    id: number;
    request_number: string;
    department: Department;
    requested_by: User;
    approved_by?: User;
    purpose: string;
    status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'fulfilled';
    priority: 'low' | 'normal' | 'high' | 'urgent';
    total_estimated_cost: number;
    approved_budget?: number;
    items_count: number;
    request_date: string;
    submitted_at?: string;
    approved_at?: string;
    fulfilled_at?: string;
}

interface ReportSummary {
    total_requests: number;
    total_estimated_cost: number;
    total_approved_cost: number;
    total_fulfilled: number;
    average_approval_time: number;
    status_breakdown: {
        draft: number;
        submitted: number;
        approved: number;
        rejected: number;
        fulfilled: number;
    };
    department_breakdown: Array<{
        department: string;
        total_requests: number;
        total_cost: number;
    }>;
    monthly_trend: Array<{
        month: string;
        requests: number;
        cost: number;
    }>;
}

interface Props extends PageProps {
    requests: {
        data: DepartmentRequest[];
        links: any[];
        meta: any;
    };
    departments: Department[];
    users: User[];
    summary: ReportSummary;
    filters: {
        search?: string;
        department?: string;
        status?: string;
        priority?: string;
        requested_by?: string;
        date_from?: string;
        date_to?: string;
        report_type?: string;
    };
}

export default function DepartmentRequestReports({ 
    requests = { data: [], links: [], meta: { from: 0, to: 0, total: 0, last_page: 1 } }, 
    departments = [], 
    users = [],
    summary = {
        total_requests: 0,
        total_estimated_cost: 0,
        total_approved_cost: 0,
        total_fulfilled: 0,
        average_approval_time: 0,
        status_breakdown: {
            draft: 0,
            submitted: 0,
            approved: 0,
            rejected: 0,
            fulfilled: 0
        },
        department_breakdown: [],
        monthly_trend: []
    },
    filters = {}
}: Props) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [departmentFilter, setDepartmentFilter] = useState(filters.department || 'all');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [priorityFilter, setPriorityFilter] = useState(filters.priority || 'all');
    const [requestedByFilter, setRequestedByFilter] = useState(filters.requested_by || 'all');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [reportType, setReportType] = useState(filters.report_type || 'summary');
    const [showFilters, setShowFilters] = useState(false);

    // Form-based search
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        
        const params: Record<string, string> = {};
        
        if (searchTerm.trim()) params.search = searchTerm.trim();
        if (departmentFilter !== 'all') params.department = departmentFilter;
        if (statusFilter !== 'all') params.status = statusFilter;
        if (priorityFilter !== 'all') params.priority = priorityFilter;
        if (requestedByFilter !== 'all') params.requested_by = requestedByFilter;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
        if (reportType !== 'summary') params.report_type = reportType;

        router.get('/department-requests/reports', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setSearchTerm('');
        setDepartmentFilter('all');
        setStatusFilter('all');
        setPriorityFilter('all');
        setRequestedByFilter('all');
        setDateFrom('');
        setDateTo('');
        setReportType('summary');
        router.get('/department-requests/reports', {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleExportExcel = () => {
        const params = new URLSearchParams();
        if (searchTerm.trim()) params.append('search', searchTerm.trim());
        if (departmentFilter !== 'all') params.append('department', departmentFilter);
        if (statusFilter !== 'all') params.append('status', statusFilter);
        if (priorityFilter !== 'all') params.append('priority', priorityFilter);
        if (requestedByFilter !== 'all') params.append('requested_by', requestedByFilter);
        if (dateFrom) params.append('date_from', dateFrom);
        if (dateTo) params.append('date_to', dateTo);
        params.append('export', 'excel');

        window.open(`/department-requests/reports/export?${params.toString()}`, '_blank');
    };

    const handleExportPDF = () => {
        const params = new URLSearchParams();
        if (searchTerm.trim()) params.append('search', searchTerm.trim());
        if (departmentFilter !== 'all') params.append('department', departmentFilter);
        if (statusFilter !== 'all') params.append('status', statusFilter);
        if (priorityFilter !== 'all') params.append('priority', priorityFilter);
        if (requestedByFilter !== 'all') params.append('requested_by', requestedByFilter);
        if (dateFrom) params.append('date_from', dateFrom);
        if (dateTo) params.append('date_to', dateTo);
        params.append('export', 'pdf');

        window.open(`/department-requests/reports/export?${params.toString()}`, '_blank');
    };

    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusBadge = (status: string) => {
        const variants = {
            draft: 'secondary',
            submitted: 'default',
            approved: 'default',
            rejected: 'destructive',
            fulfilled: 'default'
        };
        
        const labels = {
            draft: 'Draft',
            submitted: 'Diajukan',
            approved: 'Disetujui',
            rejected: 'Ditolak',
            fulfilled: 'Terpenuhi'
        };

        return (
            <Badge variant={variants[status as keyof typeof variants] as any}>
                {labels[status as keyof typeof labels]}
            </Badge>
        );
    };

    const getPriorityBadge = (priority: string) => {
        const variants = {
            low: 'secondary',
            normal: 'outline',
            high: 'default',
            urgent: 'destructive'
        };
        
        const labels = {
            low: 'Rendah',
            normal: 'Normal',
            high: 'Tinggi',
            urgent: 'Mendesak'
        };

        return (
            <Badge variant={variants[priority as keyof typeof variants] as any}>
                {labels[priority as keyof typeof labels]}
            </Badge>
        );
    };

    // Convert data for combobox
    const departmentOptions = departments?.map(dept => ({
        value: dept.id.toString(),
        label: dept.name,
        description: `Kode: ${dept.code}`
    })) || [];

    const userOptions = users?.map(user => ({
        value: user.id.toString(),
        label: user.name,
        description: `NIP: ${user.nip}`
    })) || [];

    return (
        <AppLayout>
            <Head title="Laporan Permintaan Departemen" />
            
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Laporan Permintaan Departemen</h1>
                        <p className="text-muted-foreground">
                            Analisis dan laporan permintaan barang departemen
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            onClick={handleExportExcel}
                            variant="outline"
                            className="flex items-center gap-2"
                        >
                            <Download className="h-4 w-4" />
                            Export Excel
                        </Button>
                        <Button 
                            onClick={handleExportPDF}
                            variant="outline"
                            className="flex items-center gap-2"
                        >
                            <FileText className="h-4 w-4" />
                            Export PDF
                        </Button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Permintaan</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary?.total_requests || 0}</div>
                            <p className="text-xs text-muted-foreground">
                                {summary?.total_fulfilled || 0} terpenuhi
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Estimasi Biaya</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(summary?.total_estimated_cost || 0)}</div>
                            <p className="text-xs text-muted-foreground">
                                Disetujui: {formatCurrency(summary?.total_approved_cost || 0)}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Rata-rata Waktu Approval</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary?.average_approval_time || 0}</div>
                            <p className="text-xs text-muted-foreground">
                                hari kerja
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Status Breakdown</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span>Disetujui:</span>
                                    <span className="font-medium">{summary?.status_breakdown?.approved || 0}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Pending:</span>
                                    <span className="font-medium">{summary?.status_breakdown?.submitted || 0}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            <form onSubmit={handleSearch} className="flex flex-col gap-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">Pencarian</label>
                                        <Input
                                            placeholder="Nomor permintaan, tujuan..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">Tanggal Dari</label>
                                        <Input
                                            type="date"
                                            value={dateFrom}
                                            onChange={(e) => setDateFrom(e.target.value)}
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">Tanggal Sampai</label>
                                        <Input
                                            type="date"
                                            value={dateTo}
                                            onChange={(e) => setDateTo(e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium mb-2 block">Tipe Laporan</label>
                                        <Select value={reportType} onValueChange={setReportType}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih tipe laporan" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="summary">Ringkasan</SelectItem>
                                                <SelectItem value="detailed">Detail</SelectItem>
                                                <SelectItem value="department">Per Departemen</SelectItem>
                                                <SelectItem value="monthly">Bulanan</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <Button 
                                    type="button"
                                    variant="outline" 
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="w-fit"
                                >
                                    <Filter className="h-4 w-4 mr-2" />
                                    {showFilters ? 'Sembunyikan' : 'Tampilkan'} Filter Lanjutan
                                </Button>

                                {showFilters && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
                                        <div>
                                            <label className="text-sm font-medium mb-2 block">Departemen</label>
                                            <Combobox
                                                options={[
                                                    { value: 'all', label: 'Semua Departemen', description: 'Tampilkan semua departemen' },
                                                    ...departmentOptions
                                                ]}
                                                value={departmentFilter}
                                                onValueChange={setDepartmentFilter}
                                                placeholder="Pilih departemen..."
                                            />
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium mb-2 block">Status</label>
                                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Filter berdasarkan status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Semua Status</SelectItem>
                                                    <SelectItem value="draft">Draft</SelectItem>
                                                    <SelectItem value="submitted">Diajukan</SelectItem>
                                                    <SelectItem value="approved">Disetujui</SelectItem>
                                                    <SelectItem value="rejected">Ditolak</SelectItem>
                                                    <SelectItem value="fulfilled">Terpenuhi</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium mb-2 block">Prioritas</label>
                                            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Filter berdasarkan prioritas" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Semua Prioritas</SelectItem>
                                                    <SelectItem value="low">Rendah</SelectItem>
                                                    <SelectItem value="normal">Normal</SelectItem>
                                                    <SelectItem value="high">Tinggi</SelectItem>
                                                    <SelectItem value="urgent">Mendesak</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium mb-2 block">Diminta Oleh</label>
                                            <Combobox
                                                options={[
                                                    { value: 'all', label: 'Semua User', description: 'Tampilkan semua user' },
                                                    ...userOptions
                                                ]}
                                                value={requestedByFilter}
                                                onValueChange={setRequestedByFilter}
                                                placeholder="Pilih user..."
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <Button type="submit">
                                        🔍 Tampilkan Laporan
                                    </Button>
                                    <Button type="button" onClick={handleReset} variant="outline">
                                        🔄 Reset Filter
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </CardContent>
                </Card>

                {/* Report Content */}
                {reportType === 'summary' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Department Breakdown */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Breakdown per Departemen</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {summary?.department_breakdown?.map((dept, index) => (
                                        <div key={index} className="flex justify-between items-center">
                                            <div>
                                                <div className="font-medium">{dept.department}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {dept.total_requests} permintaan
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-medium">{formatCurrency(dept.total_cost)}</div>
                                            </div>
                                        </div>
                                    )) || []}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Monthly Trend */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Trend Bulanan</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {summary?.monthly_trend?.map((month, index) => (
                                        <div key={index} className="flex justify-between items-center">
                                            <div>
                                                <div className="font-medium">{month.month}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {month.requests} permintaan
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-medium">{formatCurrency(month.cost)}</div>
                                            </div>
                                        </div>
                                    )) || []}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Detailed Report Table */}
                {(reportType === 'detailed' || reportType === 'department' || reportType === 'monthly') && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Detail Permintaan</CardTitle>
                            <CardDescription>
                                {requests?.meta ? (
                                    <>Menampilkan {requests.meta.from}-{requests.meta.to} dari {requests.meta.total} permintaan</>
                                ) : (
                                    'Loading...'
                                )}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>No. Permintaan</TableHead>
                                        <TableHead>Departemen</TableHead>
                                        <TableHead>Diminta Oleh</TableHead>
                                        <TableHead>Tujuan</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Prioritas</TableHead>
                                        <TableHead>Jumlah Item</TableHead>
                                        <TableHead>Est. Biaya</TableHead>
                                        <TableHead>Tanggal</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {requests?.data?.map((request) => (
                                        <TableRow key={request.id}>
                                            <TableCell className="font-medium">
                                                {request.request_number}
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{request.department.name}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {request.department.code}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{request.requested_by.name}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {request.requested_by.nip}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-xs">
                                                <div className="truncate" title={request.purpose}>
                                                    {request.purpose}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(request.status)}
                                            </TableCell>
                                            <TableCell>
                                                {getPriorityBadge(request.priority)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {request.items_count}
                                            </TableCell>
                                            <TableCell>
                                                {formatCurrency(request.total_estimated_cost)}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(request.request_date).toLocaleDateString('id-ID')}
                                            </TableCell>
                                        </TableRow>
                                    )) || []}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            {requests?.meta?.last_page && requests.meta.last_page > 1 && (
                                <div className="flex justify-center gap-2 mt-6">
                                    {requests.links?.map((link, index) => (
                                        <Button
                                            key={index}
                                            variant={link.active ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => link.url && router.get(link.url)}
                                            disabled={!link.url}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
