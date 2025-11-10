import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DepartmentSearchableDropdown } from '@/components/ui/department-searchable-dropdown';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, PageProps } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Package, Plus, Edit, Eye, Search, Filter, CheckCircle, Clock, XCircle, Home, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { route } from 'ziggy-js';

interface StockRequest {
    id: number;
    request_number: string;
    request_date: string;
    department: {
        id: number;
        name: string;
    };
    requested_by: {
        id: number;
        name: string;
    };
    status: 'draft' | 'submitted' | 'approved' | 'completed' | 'rejected' | 'cancelled';
    priority: 'low' | 'normal' | 'high' | 'urgent';
    total_items: number;
    total_quantity_requested: number;
    total_quantity_approved?: number;
    can_edit: boolean;
    can_submit: boolean;
    can_approve: boolean;
    can_complete: boolean;
}

interface Department {
    id: number;
    name: string;
    is_active?: boolean;
}

interface SharedData {
    from: number;
    to: number;
    total: number;
    current_page: number;
    last_page: number;
}

interface Props extends PageProps {
    stockRequests: {
        data: StockRequest[];
        links: any;
        meta?: SharedData;
    };
    statistics: {
        draft: number;
        submitted: number;
        approved: number;
        completed: number;
        rejected: number;
        cancelled: number;
    };
    departments: Department[];
    filters: {
        search?: string;
        status?: string;
        department_id?: number;
        priority?: string;
    };
}

const breadcrumbItems: BreadcrumbItem[] = [
    { title: <Package className="h-4 w-4" />, href: '#' },
    { title: 'Permintaan Stok', href: '' },
];

const getStatusBadge = (status: string) => {
    const statusConfig = {
        draft: { variant: 'secondary' as const, icon: Edit, label: 'Draft' },
        submitted: { variant: 'default' as const, icon: Clock, label: 'Submitted' },
        approved: { variant: 'default' as const, icon: CheckCircle, label: 'Approved' },
        completed: { variant: 'default' as const, icon: CheckCircle, label: 'Completed' },
        rejected: { variant: 'destructive' as const, icon: XCircle, label: 'Rejected' },
        cancelled: { variant: 'secondary' as const, icon: XCircle, label: 'Cancelled' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;

    return (
        <Badge variant={config.variant} className="inline-flex items-center gap-1">
            <Icon className="h-3 w-3" />
            {config.label}
        </Badge>
    );
};

const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
        low: { variant: 'secondary' as const, label: 'Low', icon: null },
        normal: { variant: 'default' as const, label: 'Normal', icon: null },
        high: { variant: 'default' as const, label: 'High', icon: null },
        urgent: { variant: 'destructive' as const, icon: AlertTriangle, label: 'Urgent' },
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.normal;
    const Icon = config.icon;

    return (
        <Badge variant={config.variant} className="inline-flex items-center gap-1">
            {Icon && <Icon className="h-3 w-3" />}
            {config.label}
        </Badge>
    );
};

export default function index() {
    const { stockRequests, statistics, departments, filters } = usePage<Props>().props;
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');
    const [selectedDepartment, setSelectedDepartment] = useState<number | null>(
        filters.department_id ? parseInt(filters.department_id.toString()) : null
    );
    const [selectedPriority, setSelectedPriority] = useState(filters.priority || 'all');
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);

    const statusOptions = [
        { value: 'draft', label: 'Draft' },
        { value: 'submitted', label: 'Submitted' },
        { value: 'approved', label: 'Approved' },
        { value: 'completed', label: 'Completed' },
        { value: 'rejected', label: 'Rejected' },
        { value: 'cancelled', label: 'Cancelled' },
    ];

    const priorityOptions = [
        { value: 'low', label: 'Low' },
        { value: 'normal', label: 'Normal' },
        { value: 'high', label: 'High' },
        { value: 'urgent', label: 'Urgent' },
    ];

    const handleSearch = () => {
        router.get(route('stock-requests.index'), {
            search: searchTerm,
            status: selectedStatus !== 'all' ? selectedStatus : undefined,
            department_id: selectedDepartment,
            priority: selectedPriority !== 'all' ? selectedPriority : undefined,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedStatus('all');
        setSelectedDepartment(null);
        setSelectedPriority('all');
        router.get(route('stock-requests.index'), {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbItems}>
            <Head title="Permintaan Stok" />

            <Card className='mt-6'>
                <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Permintaan Stok Management
                            </CardTitle>
                            <CardDescription>
                                Manage Permintaan Stok from departments to central warehouse
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                                className="gap-2"
                            >
                                <Filter className="h-4 w-4" />
                                {isFilterExpanded ? 'Hide Filters' : 'Show Filters'}
                            </Button>
                            <Button
                                onClick={() => router.get(route('stock-requests.create'))}
                                className="gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                New Request
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Search Bar */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by request number or notes..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <Button onClick={handleSearch} className="gap-2">
                            <Search className="h-4 w-4" />
                            Search
                        </Button>
                        {(searchTerm || selectedStatus !== 'all' || selectedDepartment || selectedPriority !== 'all') && (
                            <Button variant="outline" onClick={handleClearFilters}>
                                Clear
                            </Button>
                        )}
                    </div>

                    {/* Collapsible Filters */}
                    {isFilterExpanded && (
                        <div className="p-4 border rounded-lg bg-gray-50">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Status</SelectItem>
                                            {statusOptions.map((status) => (
                                                <SelectItem key={status.value} value={status.value}>
                                                    {status.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Department</Label>
                                    <DepartmentSearchableDropdown
                                        departments={departments.map((d: any) => ({ ...d, is_active: d.is_active ?? true }))}
                                        value={selectedDepartment}
                                        onValueChange={setSelectedDepartment}
                                        placeholder="Select department"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Priority</Label>
                                    <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select priority" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Priority</SelectItem>
                                            {priorityOptions.map((priority) => (
                                                <SelectItem key={priority.value} value={priority.value}>
                                                    {priority.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Table */}
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Request Number</TableHead>
                                    <TableHead>Request Date</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Requested By</TableHead>
                                    <TableHead>Priority</TableHead>
                                    <TableHead>Items</TableHead>
                                    <TableHead>Qty Requested</TableHead>
                                    <TableHead>Qty Approved</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stockRequests.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                                            No Permintaan Stok found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    stockRequests.data.map((request: any) => (
                                        <TableRow 
                                            key={request.id}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => router.visit(route('stock-requests.show', request.id))}
                                        >
                                            <TableCell className="font-medium">{request.request_number}</TableCell>
                                            <TableCell>{new Date(request.request_date).toLocaleDateString('id-ID')}</TableCell>
                                            <TableCell>{request.department.name}</TableCell>
                                            <TableCell>{request.requested_by.name}</TableCell>
                                            <TableCell>{getPriorityBadge(request.priority)}</TableCell>
                                            <TableCell>{request.total_items}</TableCell>
                                            <TableCell>{request.total_quantity_requested}</TableCell>
                                            <TableCell>{request.total_quantity_approved || '-'}</TableCell>
                                            <TableCell>{getStatusBadge(request.status)}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.visit(route('stock-requests.show', request.id));
                                                    }}
                                                    className="gap-2"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    View
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {stockRequests.links && stockRequests.links.length > 3 && (
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                                Showing {stockRequests.meta?.from || 0} to {stockRequests.meta?.to || 0} of {stockRequests.meta?.total || 0} entries
                            </div>
                            <div className="flex gap-1">
                                {stockRequests.links.map((link: any, index: number) => (
                                    <Button
                                        key={index}
                                        variant={link.active ? "default" : "outline"}
                                        size="sm"
                                        disabled={!link.url}
                                        onClick={() => link.url && router.visit(link.url)}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </AppLayout>
    );
}
