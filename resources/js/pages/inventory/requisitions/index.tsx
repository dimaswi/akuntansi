import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { FileText, Plus, Edit, Trash2, Eye, Search, Filter, CheckCircle, Clock, XCircle, Send, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

interface Requisition {
    id: number;
    requisition_number: string;
    request_date: string;
    required_date: string;
    status: 'draft' | 'submitted' | 'approved' | 'partially_approved' | 'rejected' | 'cancelled';
    total_estimated_cost?: number;
    notes?: string;
    department: {
        id: number;
        name: string;
    };
    requester: {
        id: number;
        name: string;
    };
    approver?: {
        id: number;
        name: string;
    };
    approved_at?: string;
    rejected_at?: string;
    items_count?: number;
}

interface Department {
    id: number;
    name: string;
    is_active?: boolean;
}

interface Props extends PageProps {
    requisitions: {
        data: Requisition[];
        links: any;
        meta: any;
    };
    filters: {
        search?: string;
        status?: string;
        department_id?: number;
        date_from?: string;
        date_to?: string;
        perPage?: number;
    };
    departments: Department[];
    statusOptions: { value: string; label: string }[];
    isLogistics?: boolean;
}

const breadcrumbItems: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Inventory', href: '/inventory' },
    { title: 'Requisitions', href: '' }
];

const getStatusBadge = (status: string) => {
    const statusConfig = {
        draft: { variant: 'secondary' as const, icon: Edit, label: 'Draft' },
        submitted: { variant: 'default' as const, icon: Send, label: 'Submitted' },
        approved: { variant: 'default' as const, icon: CheckCircle, label: 'Approved' },
        partially_approved: { variant: 'default' as const, icon: AlertTriangle, label: 'Partially Approved' },
        rejected: { variant: 'destructive' as const, icon: XCircle, label: 'Rejected' },
        cancelled: { variant: 'destructive' as const, icon: XCircle, label: 'Cancelled' },
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

export default function RequisitionIndex() {
    const { requisitions, filters, departments, statusOptions, isLogistics = false } = usePage<Props>().props;
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');
    const [selectedDepartment, setSelectedDepartment] = useState<number | null>(
        filters.department_id ? parseInt(filters.department_id.toString()) : null
    );
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [showFilters, setShowFilters] = useState(false);

    const handleSearch = () => {
        router.get(route('requisitions.index'), {
            search: searchTerm,
            status: selectedStatus,
            department_id: selectedDepartment,
            date_from: dateFrom,
            date_to: dateTo,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedStatus('all');
        setSelectedDepartment(null);
        setDateFrom('');
        setDateTo('');
        router.get(route('requisitions.index'), {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleDelete = (id: number, requisitionNumber: string) => {
        if (confirm(`Are you sure you want to delete requisition ${requisitionNumber}?`)) {
            router.delete(route('requisitions.destroy', id), {
                onSuccess: () => {
                    toast.success('Requisition deleted successfully');
                },
                onError: () => {
                    toast.error('Failed to delete requisition');
                }
            });
        }
    };

    const handleSubmit = (id: number, requisitionNumber: string) => {
        if (confirm(`Are you sure you want to submit requisition ${requisitionNumber} for approval?`)) {
            router.put(route('requisitions.submit', id), {}, {
                onSuccess: () => {
                    toast.success('Requisition submitted for approval');
                },
                onError: () => {
                    toast.error('Failed to submit requisition');
                }
            });
        }
    };

    const handleApprove = (id: number, requisitionNumber: string) => {
        if (confirm(`Are you sure you want to approve requisition ${requisitionNumber}?`)) {
            router.put(route('requisitions.approve', id), {}, {
                onSuccess: () => {
                    toast.success('Requisition approved successfully');
                },
                onError: () => {
                    toast.error('Failed to approve requisition');
                }
            });
        }
    };

    const handleReject = (id: number, requisitionNumber: string) => {
        const reason = prompt(`Please provide a reason for rejecting requisition ${requisitionNumber}:`);
        if (reason) {
            router.put(route('requisitions.reject', id), { rejection_reason: reason }, {
                onSuccess: () => {
                    toast.success('Requisition rejected');
                },
                onError: () => {
                    toast.error('Failed to reject requisition');
                }
            });
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbItems}>
            <Head title="Requisitions" />
            
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Requisitions Management
                            </CardTitle>
                            <CardDescription>
                                Manage and track inventory requisitions
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setShowFilters(!showFilters)}
                                className="gap-2"
                            >
                                <Filter className="h-4 w-4" />
                                Filters
                            </Button>
                            <Button
                                onClick={() => router.get(route('requisitions.create'))}
                                className="gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                New Requisition
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
                                placeholder="Search by requisition number, requester, or notes..."
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
                        {(searchTerm || selectedStatus !== 'all' || selectedDepartment || dateFrom || dateTo) && (
                            <Button variant="outline" onClick={handleClearFilters}>
                                Clear
                            </Button>
                        )}
                    </div>

                    {/* Filters */}
                    {showFilters && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Filter Options</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                                            value={selectedDepartment}
                                            onValueChange={setSelectedDepartment}
                                            placeholder="Select department"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Date From</Label>
                                        <Input
                                            type="date"
                                            value={dateFrom}
                                            onChange={(e) => setDateFrom(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Date To</Label>
                                        <Input
                                            type="date"
                                            value={dateTo}
                                            onChange={(e) => setDateTo(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-4">
                                    <Button onClick={handleSearch} className="gap-2">
                                        <Search className="h-4 w-4" />
                                        Apply Filters
                                    </Button>
                                    <Button variant="outline" onClick={handleClearFilters}>
                                        Clear All
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Results Info */}
                    {requisitions.meta && (
                        <div className="text-sm text-muted-foreground">
                            Showing {requisitions.meta.from || 0} to {requisitions.meta.to || 0} of {requisitions.meta.total || 0} requisitions
                        </div>
                    )}

                    {/* Table */}
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Requisition Number</TableHead>
                                    <TableHead>Request Date</TableHead>
                                    <TableHead>Required Date</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Requester</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Items</TableHead>
                                    <TableHead>Estimated Cost</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requisitions.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center py-8">
                                            <div className="flex flex-col items-center gap-2">
                                                <FileText className="h-8 w-8 text-muted-foreground" />
                                                <p className="text-muted-foreground">No requisitions found</p>
                                                <Button
                                                    onClick={() => router.get(route('requisitions.create'))}
                                                    className="mt-2"
                                                >
                                                    Create First Requisition
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    requisitions.data.map((requisition) => (
                                        <TableRow key={requisition.id}>
                                            <TableCell className="font-medium">
                                                {requisition.requisition_number}
                                            </TableCell>
                                            <TableCell>
                                                {formatDate(requisition.request_date)}
                                            </TableCell>
                                            <TableCell>
                                                {formatDate(requisition.required_date)}
                                            </TableCell>
                                            <TableCell>
                                                {requisition.department.name}
                                            </TableCell>
                                            <TableCell>
                                                {requisition.requester.name}
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(requisition.status)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {requisition.items_count || 0} items
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {requisition.total_estimated_cost ? 
                                                    formatCurrency(requisition.total_estimated_cost) : 
                                                    '-'
                                                }
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => router.get(route('requisitions.show', requisition.id))}
                                                        title="View details"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    
                                                    {requisition.status === 'draft' && (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => router.get(route('requisitions.edit', requisition.id))}
                                                                title="Edit requisition"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleSubmit(requisition.id, requisition.requisition_number)}
                                                                title="Submit for approval"
                                                            >
                                                                <Send className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDelete(requisition.id, requisition.requisition_number)}
                                                                className="text-destructive hover:text-destructive"
                                                                title="Delete requisition"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}

                                                    {requisition.status === 'submitted' && (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleApprove(requisition.id, requisition.requisition_number)}
                                                                title="Approve requisition"
                                                                className="text-green-600 hover:text-green-700"
                                                            >
                                                                <CheckCircle className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleReject(requisition.id, requisition.requisition_number)}
                                                                title="Reject requisition"
                                                                className="text-destructive hover:text-destructive"
                                                            >
                                                                <XCircle className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {requisitions.links && requisitions.links.length > 3 && (
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                                Showing {requisitions.meta.from} to {requisitions.meta.to} of {requisitions.meta.total} results
                            </div>
                            <div className="flex gap-1">
                                {requisitions.links.map((link: any, index: number) => (
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
                        </div>
                    )}
                </CardContent>
            </Card>
        </AppLayout>
    );
}
