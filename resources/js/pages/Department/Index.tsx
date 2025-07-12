import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Filter, Building, Users, DollarSign, FileText } from 'lucide-react';
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
];

interface Department {
    id: number;
    code: string;
    name: string;
    parent_id?: number;
    parent?: Department;
    manager_id?: number;
    manager?: {
        id: number;
        name: string;
        nip: string;
    };
    monthly_budget_limit?: number;
    can_request_items: boolean;
    is_active: boolean;
    children_count: number;
    current_month_requests: number;
    current_month_spending: number;
    created_at: string;
}

interface IndexProps extends PageProps {
    departments: {
        data: Department[];
        links: any[];
        meta: any;
    };
    filters: {
        search?: string;
        status?: string;
        can_request?: string;
    };
    stats: {
        total_departments: number;
        active_departments: number;
        departments_with_budget: number;
        departments_can_request: number;
        total_monthly_budget: number;
        total_monthly_spending: number;
    };
}

export default function DepartmentIndex({ departments, filters, stats }: IndexProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [canRequestFilter, setCanRequestFilter] = useState(filters.can_request || 'all');

    const handleSearch = () => {
        router.get('/departments', {
            search: searchTerm,
            status: statusFilter,
            can_request: canRequestFilter,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setCanRequestFilter('all');
        router.get('/departments');
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getBudgetUsagePercentage = (spending: number, budget: number) => {
        if (!budget) return 0;
        return Math.round((spending / budget) * 100);
    };

    const getBudgetUsageBadge = (percentage: number) => {
        if (percentage >= 90) return <Badge variant="destructive">{percentage}%</Badge>;
        if (percentage >= 75) return <Badge variant="secondary">{percentage}%</Badge>;
        if (percentage >= 50) return <Badge variant="outline">{percentage}%</Badge>;
        return <Badge variant="default">{percentage}%</Badge>;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Departemen" />
            
            <div className="p-4">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Departemen</CardTitle>
                            <Building className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_departments}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.active_departments} aktif
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Dapat Request</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.departments_can_request}</div>
                            <p className="text-xs text-muted-foreground">
                                departemen
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Budget Bulanan</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stats.total_monthly_budget)}</div>
                            <p className="text-xs text-muted-foreground">
                                total budget
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Spending Bulan Ini</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stats.total_monthly_spending)}</div>
                            <p className="text-xs text-muted-foreground">
                                {Math.round((stats.total_monthly_spending / stats.total_monthly_budget) * 100)}% dari budget
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card className='mt-6'>
                    <CardHeader>
                        <CardTitle>Filter Departemen</CardTitle>
                        <CardDescription>
                            Cari dan filter departemen berdasarkan kriteria tertentu
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <Input
                                    placeholder="Cari nama departemen, kode, atau manager..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full md:w-[180px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Status</SelectItem>
                                    <SelectItem value="active">Aktif</SelectItem>
                                    <SelectItem value="inactive">Tidak Aktif</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={canRequestFilter} onValueChange={setCanRequestFilter}>
                                <SelectTrigger className="w-full md:w-[180px]">
                                    <SelectValue placeholder="Dapat Request" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua</SelectItem>
                                    <SelectItem value="yes">Dapat Request</SelectItem>
                                    <SelectItem value="no">Tidak Dapat Request</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="flex gap-2">
                                <Button onClick={handleSearch}>
                                    <Search className="h-4 w-4 mr-2" />
                                    Cari
                                </Button>
                                <Button variant="outline" onClick={handleReset}>
                                    Reset
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Departments Table */}
                <Card className='mt-6'>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Daftar Departemen</CardTitle>
                            <CardDescription>
                                Kelola departemen dan pengaturan budget
                            </CardDescription>
                        </div>
                        <Button asChild>
                            <Link href="/departments/create">
                                <Plus className="h-4 w-4 mr-2" />
                                Tambah Departemen
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Kode</TableHead>
                                    <TableHead>Nama Departemen</TableHead>
                                    <TableHead>Parent</TableHead>
                                    <TableHead>Manager</TableHead>
                                    <TableHead>Budget Bulanan</TableHead>
                                    <TableHead>Usage</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {departments.data.map((department) => (
                                    <TableRow key={department.id}>
                                        <TableCell className="font-medium">
                                            {department.code}
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{department.name}</div>
                                                {department.children_count > 0 && (
                                                    <div className="text-sm text-muted-foreground">
                                                        {department.children_count} sub-departemen
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {department.parent ? department.parent.name : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {department.manager ? (
                                                <div>
                                                    <div className="font-medium">{department.manager.name}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {department.manager.nip}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">Belum ditentukan</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {department.monthly_budget_limit ? (
                                                formatCurrency(department.monthly_budget_limit)
                                            ) : (
                                                <span className="text-muted-foreground">Tidak ada limit</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {department.monthly_budget_limit ? (
                                                <div className="space-y-1">
                                                    <div>{formatCurrency(department.current_month_spending)}</div>
                                                    {getBudgetUsageBadge(
                                                        getBudgetUsagePercentage(
                                                            department.current_month_spending,
                                                            department.monthly_budget_limit
                                                        )
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <Badge variant={department.is_active ? 'default' : 'secondary'}>
                                                    {department.is_active ? 'Aktif' : 'Tidak Aktif'}
                                                </Badge>
                                                {department.can_request_items && (
                                                    <Badge variant="outline" className="block w-fit">
                                                        Dapat Request
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button asChild size="sm" variant="outline">
                                                    <Link href={`/departments/${department.id}`}>
                                                        Detail
                                                    </Link>
                                                </Button>
                                                <Button asChild size="sm" variant="outline">
                                                    <Link href={`/departments/${department.id}/edit`}>
                                                        Edit
                                                    </Link>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {departments.data.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                Tidak ada departemen yang ditemukan
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
