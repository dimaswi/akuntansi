import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { SharedData } from '@/types';
import { PlusCircle, Search, X, Eye, CheckCircle, XCircle, FileBarChart, Filter } from 'lucide-react';
import { toast } from 'sonner';

interface StockOpname {
    id: number;
    opname_number: string;
    opname_date: string;
    status: 'draft' | 'submitted' | 'approved' | 'rejected';
    total_items_counted: number;
    total_variance_value: number;
    notes?: string;
    rejection_reason?: string;
    department: {
        id: number;
        name: string;
    };
    creator: {
        id: number;
        name: string;
    };
    approver?: {
        id: number;
        name: string;
    };
    approved_at?: string;
    created_at: string;
}

interface Department {
    id: number;
    name: string;
}

interface PaginatedOpnames {
    data: StockOpname[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Props extends SharedData {
    opnames: PaginatedOpnames;
    filters: {
        search: string;
        status?: string;
        department_id?: string;
        perPage: number;
    };
    departments: Department[];
    isLogistics: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: <FileBarChart className="h-4 w-4" />, href: '#' },
    { title: "Stock Opname", href: '#' },
];

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
};

const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

export default function StockOpnameIndex() {
    const { opnames, filters, departments, isLogistics } = usePage<Props>().props;
    const [search, setSearch] = useState(filters.search || '');
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);

    const handleSearch = (searchValue: string) => {
        router.get(
            '/stock-opnames',
            {
                search: searchValue,
                status: filters.status || '',
                department_id: filters.department_id || '',
                perPage: filters.perPage,
                page: 1,
            },
            {
                preserveState: true,
                replace: true,
            }
        );
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSearch(search);
    };

    const handleClearSearch = () => {
        setSearch('');
        handleSearch('');
    };

    const handleStatusChange = (status: string) => {
        router.get(
            '/stock-opnames',
            {
                search: filters.search || '',
                status: status === 'all' ? '' : status,
                department_id: filters.department_id || '',
                perPage: filters.perPage,
                page: 1,
            },
            {
                preserveState: true,
                replace: true,
            }
        );
    };

    const handleDepartmentChange = (departmentId: string) => {
        router.get(
            '/stock-opnames',
            {
                search: filters.search || '',
                status: filters.status || '',
                department_id: departmentId === 'all' ? '' : departmentId,
                perPage: filters.perPage,
                page: 1,
            },
            {
                preserveState: true,
                replace: true,
            }
        );
    };

    const handleResetFilters = () => {
        setSearch('');
        router.get('/stock-opnames', {
            search: '',
            status: '',
            department_id: '',
            perPage: filters.perPage,
            page: 1,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const hasActiveFilters = (filters.status && filters.status !== '') ||
                            (filters.department_id && filters.department_id !== '') ||
                            (filters.search && filters.search !== '');

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            draft: { label: 'Draft', className: 'bg-gray-100 text-gray-800' },
            submitted: { label: 'Submitted', className: 'bg-blue-100 text-blue-800' },
            approved: { label: 'Approved', className: 'bg-green-100 text-green-800' },
            rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800' },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
        
        return (
            <Badge className={config.className}>
                {config.label}
            </Badge>
        );
    };

    const getVarianceBadge = (value: number) => {
        if (value === 0) {
            return <Badge className="bg-green-100 text-green-800">Match</Badge>;
        } else if (value > 0) {
            return <Badge className="bg-blue-100 text-blue-800">+{formatCurrency(value)}</Badge>;
        } else {
            return <Badge className="bg-red-100 text-red-800">{formatCurrency(value)}</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Stock Opname" />

            <Card className="mt-4">
                <CardHeader>
                    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <FileBarChart className="h-5 w-5" />
                                Stock Opname
                            </CardTitle>
                            <CardDescription>
                                Physical stock count & variance adjustment untuk inventory department
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                                className="gap-2"
                            >
                                <Filter className="h-4 w-4" />
                                {isFilterExpanded ? 'Tutup Filter' : 'Filter'}
                            </Button>
                            <Button onClick={() => router.visit(route('stock-opnames.create'))} className="gap-2">
                                <PlusCircle className="h-4 w-4" />
                                Buat Stock Opname
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Search */}
                    <div className="flex-1">
                        <Label htmlFor="search">Cari</Label>
                        <form onSubmit={handleSearchSubmit} className="flex gap-2">
                            <Input
                                id="search"
                                placeholder="Cari nomor opname atau department..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="flex-1"
                            />
                            <Button type="submit" variant="outline" size="icon">
                                <Search className="h-4 w-4" />
                            </Button>
                            {search && (
                                <Button type="button" variant="outline" size="icon" onClick={handleClearSearch}>
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </form>
                    </div>

                    {/* Filters */}
                    {isFilterExpanded && (
                        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-end flex-wrap">
                                <div className="grid gap-2">
                                    <Label className="text-sm font-medium">Status</Label>
                                    <Select value={filters.status || 'all'} onValueChange={handleStatusChange}>
                                        <SelectTrigger className="w-48">
                                            <SelectValue placeholder="Pilih Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Status</SelectItem>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="submitted">Submitted</SelectItem>
                                            <SelectItem value="approved">Approved</SelectItem>
                                            <SelectItem value="rejected">Rejected</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {isLogistics && (
                                    <div className="grid gap-2">
                                        <Label className="text-sm font-medium">Department</Label>
                                        <Select
                                            value={filters.department_id || 'all'}
                                            onValueChange={handleDepartmentChange}
                                        >
                                            <SelectTrigger className="w-48">
                                                <SelectValue placeholder="Pilih Department" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Semua Department</SelectItem>
                                                {departments.map((dept) => (
                                                    <SelectItem key={dept.id} value={dept.id.toString()}>
                                                        {dept.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                {hasActiveFilters && (
                                    <Button variant="outline" onClick={handleResetFilters} className="flex items-center gap-2">
                                        <X className="h-4 w-4" />
                                        Reset Filter
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Table */}
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[60px]">No</TableHead>
                                    <TableHead>Nomor Opname</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Items</TableHead>
                                    <TableHead>Variance</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Dibuat Oleh</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {opnames.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                            Tidak ada data stock opname
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    opnames.data.map((opname, index) => (
                                        <TableRow key={opname.id}>
                                            <TableCell>
                                                {opnames.from + index}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {opname.opname_number}
                                            </TableCell>
                                            <TableCell>{opname.department.name}</TableCell>
                                            <TableCell>{formatDate(opname.opname_date)}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {opname.total_items_counted} items
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {getVarianceBadge(opname.total_variance_value)}
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(opname.status)}
                                            </TableCell>
                                            <TableCell>{opname.creator.name}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => router.visit(route('stock-opnames.show', opname.id))}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {opnames.last_page > 1 && (
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                                Menampilkan {opnames.from} - {opnames.to} dari {opnames.total} data
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.visit(route('stock-opnames.index', {
                                        ...filters,
                                        page: opnames.current_page - 1,
                                    }))}
                                    disabled={opnames.current_page === 1}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.visit(route('stock-opnames.index', {
                                        ...filters,
                                        page: opnames.current_page + 1,
                                    }))}
                                    disabled={opnames.current_page === opnames.last_page}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </AppLayout>
    );
}
