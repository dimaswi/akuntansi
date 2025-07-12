import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Combobox } from '@/components/ui/combobox';
import { Plus, Search, Filter, FileText, Clock, CheckCircle, XCircle, Package, Edit } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { PageProps, BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Permintaan Departemen',
        href: '/department-requests',
    },
];

interface DepartmentRequest {
    id: number;
    request_number: string;
    department: {
        id: number;
        name: string;
        code: string;
    };
    target_department?: {
        id: number;
        name: string;
        code: string;
    };
    request_type: 'procurement' | 'transfer';
    requested_by: {
        id: number;
        name: string;
        nip: string;
    };
    approved_by?: {
        id: number;
        name: string;
        nip: string;
    };
    purpose: string;
    status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'fulfilled';
    priority: 'low' | 'medium' | 'high';
    total_estimated_cost: number;
    total_approved_cost?: number;
    items_count: number;
    request_date: string;
    submitted_at?: string;
    approved_at?: string;
    fulfilled_at?: string;
    created_at: string;
}

interface Department {
    id: number;
    name: string;
    code: string;
}

interface IndexProps extends PageProps {
    requests: {
        data: DepartmentRequest[];
        links: any[];
        meta: any;
    };
    departments: Department[];
    filters: {
        search?: string;
        department?: string;
        status?: string;
        priority?: string;
        date_from?: string;
        date_to?: string;
    };
    canCreateRequest: boolean;
    can_view_all_departments?: boolean;
    user_department?: Department;
}

export default function DepartmentRequestIndex({ 
    requests, 
    departments, 
    filters, 
    canCreateRequest,
    can_view_all_departments,
    user_department
}: IndexProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [departmentFilter, setDepartmentFilter] = useState(filters.department || 'all');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [priorityFilter, setPriorityFilter] = useState(filters.priority || 'all');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    // Debounced search function
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchTerm !== (filters.search || '')) {
                handleSearch();
            }
        }, 500); // 500ms delay

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const handleSearch = () => {
        router.get('/department-requests', {
            search: searchTerm || undefined,
            department: departmentFilter !== 'all' ? departmentFilter : undefined,
            status: statusFilter !== 'all' ? statusFilter : undefined,
            priority: priorityFilter !== 'all' ? priorityFilter : undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
        }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            only: ['requests'] // Only reload requests data
        });
    };

    const handleReset = () => {
        setSearchTerm('');
        setDepartmentFilter('all');
        setStatusFilter('all');
        setPriorityFilter('all');
        setDateFrom('');
        setDateTo('');
        router.get('/department-requests', {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            only: ['requests']
        });
    };

    const handleFilterChange = () => {
        router.get('/department-requests', {
            search: searchTerm || undefined,
            department: departmentFilter !== 'all' ? departmentFilter : undefined,
            status: statusFilter !== 'all' ? statusFilter : undefined,
            priority: priorityFilter !== 'all' ? priorityFilter : undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
        }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            only: ['requests']
        });
    };

    // Prepare department options for combobox
    const departmentOptions = [
        { value: 'all', label: 'Semua Departemen', description: 'Tampilkan semua departemen' },
        ...departments.map(dept => ({
            value: dept.id.toString(),
            label: dept.name,
            description: dept.code
        }))
    ];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            draft: <Badge variant="secondary">Draft</Badge>,
            submitted: <Badge variant="outline">Disubmit</Badge>,
            approved: <Badge variant="default">Disetujui</Badge>,
            rejected: <Badge variant="destructive">Ditolak</Badge>,
            fulfilled: <Badge variant="default" className="bg-green-600">Terpenuhi</Badge>
        };
        return badges[status as keyof typeof badges] || <Badge variant="secondary">{status}</Badge>;
    };

    const getPriorityBadge = (priority: string) => {
        const badges = {
            low: <Badge variant="outline" className="text-blue-600">Rendah</Badge>,
            medium: <Badge variant="outline" className="text-yellow-600">Sedang</Badge>,
            high: <Badge variant="outline" className="text-red-600">Tinggi</Badge>
        };
        return badges[priority as keyof typeof badges] || <Badge variant="outline">{priority}</Badge>;
    };

    const getStatusIcon = (status: string) => {
        const icons = {
            draft: <FileText className="h-4 w-4" />,
            submitted: <Clock className="h-4 w-4" />,
            approved: <CheckCircle className="h-4 w-4" />,
            rejected: <XCircle className="h-4 w-4" />,
            fulfilled: <Package className="h-4 w-4" />
        };
        return icons[status as keyof typeof icons] || <FileText className="h-4 w-4" />;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Permintaan Departemen" />
            
            <div className="p-4">
                {/* Status Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {['draft', 'submitted', 'approved', 'rejected', 'fulfilled'].map((status) => {
                        const count = requests.data.filter(req => req.status === status).length;
                        return (
                            <Card key={status}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium capitalize">
                                        {status === 'draft' && 'Draft'}
                                        {status === 'submitted' && 'Disubmit'}
                                        {status === 'approved' && 'Disetujui'}
                                        {status === 'rejected' && 'Ditolak'}
                                        {status === 'fulfilled' && 'Terpenuhi'}
                                    </CardTitle>
                                    {getStatusIcon(status)}
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{count}</div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Filters */}
                <Card className='mt-6'>
                    <CardHeader>
                        <CardTitle>Filter Permintaan</CardTitle>
                        <CardDescription>
                            Cari dan filter permintaan berdasarkan kriteria tertentu
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                            <div className="col-span-1 md:col-span-2 lg:col-span-1">
                                <Input
                                    placeholder="Cari nomor permintaan, tujuan..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Combobox
                                options={departmentOptions}
                                value={departmentFilter}
                                onValueChange={(value) => {
                                    setDepartmentFilter(value);
                                    setTimeout(handleFilterChange, 100);
                                }}
                                placeholder="Pilih departemen..."
                                searchPlaceholder="Cari departemen..."
                                emptyText="Departemen tidak ditemukan"
                            />
                            <Select value={statusFilter} onValueChange={(value) => {
                                setStatusFilter(value);
                                setTimeout(handleFilterChange, 100);
                            }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Status</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="submitted">Disubmit</SelectItem>
                                    <SelectItem value="approved">Disetujui</SelectItem>
                                    <SelectItem value="rejected">Ditolak</SelectItem>
                                    <SelectItem value="fulfilled">Terpenuhi</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Select value={priorityFilter} onValueChange={(value) => {
                                setPriorityFilter(value);
                                setTimeout(handleFilterChange, 100);
                            }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Prioritas" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Prioritas</SelectItem>
                                    <SelectItem value="low">Rendah</SelectItem>
                                    <SelectItem value="medium">Sedang</SelectItem>
                                    <SelectItem value="high">Tinggi</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input
                                type="date"
                                placeholder="Tanggal Dari"
                                value={dateFrom}
                                onChange={(e) => {
                                    setDateFrom(e.target.value);
                                    setTimeout(handleFilterChange, 100);
                                }}
                            />
                            <Input
                                type="date"
                                placeholder="Tanggal Sampai"
                                value={dateTo}
                                onChange={(e) => {
                                    setDateTo(e.target.value);
                                    setTimeout(handleFilterChange, 100);
                                }}
                            />
                        </div>
                        <div className="flex gap-2 mt-4">
                            <Button onClick={handleSearch}>
                                <Search className="h-4 w-4 mr-2" />
                                Cari
                            </Button>
                            <Button variant="outline" onClick={handleReset}>
                                Reset
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Requests Table */}
                <Card className='mt-6'>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                Daftar Permintaan
                                {!can_view_all_departments && user_department && (
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                        {user_department.name} ({user_department.code})
                                    </Badge>
                                )}
                            </CardTitle>
                            <CardDescription>
                                {can_view_all_departments ? (
                                    'Kelola permintaan barang dari semua departemen'
                                ) : (
                                    `Kelola permintaan barang departemen ${user_department?.name || 'Anda'}`
                                )}
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button asChild variant="outline">
                                <Link href="/department-requests/reports">
                                    <FileText className="h-4 w-4 mr-2" />
                                    Laporan
                                </Link>
                            </Button>
                            {canCreateRequest && (
                                <Button asChild>
                                    <Link href="/department-requests/create">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Buat Permintaan
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>No. Permintaan</TableHead>
                                    <TableHead>Jenis</TableHead>
                                    <TableHead>Departemen</TableHead>
                                    <TableHead>Target</TableHead>
                                    <TableHead>Pemohon</TableHead>
                                    <TableHead>Tujuan</TableHead>
                                    <TableHead>Prioritas</TableHead>
                                    <TableHead>Total Item</TableHead>
                                    <TableHead>Estimasi Biaya</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.data.map((request) => (
                                    <TableRow key={request.id}>
                                        <TableCell className="font-medium">
                                            {request.request_number}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={request.request_type === 'transfer' ? 'default' : 'secondary'}>
                                                {request.request_type === 'transfer' ? 'Transfer' : 'Pengadaan'}
                                            </Badge>
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
                                            {request.request_type === 'transfer' && request.target_department ? (
                                                <div>
                                                    <div className="font-medium">{request.target_department.name}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {request.target_department.code}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
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
                                            {getPriorityBadge(request.priority)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {request.items_count}
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <div>{formatCurrency(request.total_estimated_cost)}</div>
                                                {request.total_approved_cost && request.total_approved_cost !== request.total_estimated_cost && (
                                                    <div className="text-sm text-muted-foreground">
                                                        Disetujui: {formatCurrency(request.total_approved_cost)}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(request.status)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                <div>{formatDate(request.request_date)}</div>
                                                {request.approved_at && (
                                                    <div className="text-muted-foreground">
                                                        Approved: {formatDate(request.approved_at)}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button asChild size="sm" variant="outline">
                                                    <Link href={`/department-requests/${request.id}`}>
                                                        Detail
                                                    </Link>
                                                </Button>
                                                {(request.status === 'draft' || request.status === 'submitted') && (
                                                    <Button asChild size="sm" variant="secondary">
                                                        <Link href={`/department-requests/${request.id}/edit`}>
                                                            <Edit className="h-4 w-4 mr-1" />
                                                            Edit
                                                        </Link>
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {requests.data.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                Tidak ada permintaan yang ditemukan
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
