import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import { Plus, Search, Filter, Eye, Edit, Trash, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function Index({ auth, requisitions, filters, departments, can }) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [departmentFilter, setDepartmentFilter] = useState(filters.department_id || 'all');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('requisitions.index'), {
            search: searchTerm,
            status: statusFilter === 'all' ? undefined : statusFilter,
            department_id: departmentFilter === 'all' ? undefined : departmentFilter,
        }, {
            preserveState: true,
            replace: true
        });
    };

    const resetFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setDepartmentFilter('all');
        router.get(route('requisitions.index'));
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            'draft': { variant: 'secondary', icon: FileText, text: 'Draft' },
            'submitted': { variant: 'warning', icon: Clock, text: 'Submitted' },
            'approved': { variant: 'success', icon: CheckCircle, text: 'Approved' },
            'rejected': { variant: 'destructive', icon: XCircle, text: 'Rejected' },
            'cancelled': { variant: 'secondary', icon: XCircle, text: 'Cancelled' },
        };

        const config = statusConfig[status] || statusConfig.draft;
        const Icon = config.icon;

        return (
            <Badge variant={config.variant} className="flex items-center gap-1">
                <Icon className="h-3 w-3" />
                {config.text}
            </Badge>
        );
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Permintaan Barang
                    </h2>
                    {can.create && (
                        <Link href={route('requisitions.create')}>
                            <Button className="flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                Buat Permintaan
                            </Button>
                        </Link>
                    )}
                </div>
            }
        >
            <Head title="Permintaan Barang" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Filter Section */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Filter className="h-5 w-5" />
                                Filter & Pencarian
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSearch} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div>
                                        <Input
                                            type="text"
                                            placeholder="Cari nomor permintaan..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full"
                                        />
                                    </div>
                                    
                                    <div>
                                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Semua Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Semua Status</SelectItem>
                                                <SelectItem value="draft">Draft</SelectItem>
                                                <SelectItem value="submitted">Submitted</SelectItem>
                                                <SelectItem value="approved">Approved</SelectItem>
                                                <SelectItem value="rejected">Rejected</SelectItem>
                                                <SelectItem value="cancelled">Cancelled</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Semua Departemen" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Semua Departemen</SelectItem>
                                                {departments.map((department) => (
                                                    <SelectItem key={department.id} value={department.id.toString()}>
                                                        {department.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button type="submit" className="flex items-center gap-2">
                                            <Search className="h-4 w-4" />
                                            Cari
                                        </Button>
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            onClick={resetFilters}
                                        >
                                            Reset
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Requisitions Table */}
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>No. Permintaan</TableHead>
                                        <TableHead>Departemen</TableHead>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead>Total Estimasi</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Dibuat Oleh</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {requisitions.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                                Tidak ada data permintaan
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        requisitions.data.map((requisition) => (
                                            <TableRow key={requisition.id}>
                                                <TableCell className="font-medium">
                                                    {requisition.requisition_number}
                                                </TableCell>
                                                <TableCell>{requisition.department?.name}</TableCell>
                                                <TableCell>{formatDate(requisition.requisition_date)}</TableCell>
                                                <TableCell>{formatCurrency(requisition.total_estimated_cost)}</TableCell>
                                                <TableCell>{getStatusBadge(requisition.status)}</TableCell>
                                                <TableCell>{requisition.created_by?.name}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {can.view && (
                                                            <Link href={route('requisitions.show', requisition.id)}>
                                                                <Button variant="outline" size="sm">
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                        )}
                                                        {can.edit && requisition.status === 'draft' && (
                                                            <Link href={route('requisitions.edit', requisition.id)}>
                                                                <Button variant="outline" size="sm">
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                        )}
                                                        {can.delete && requisition.status === 'draft' && (
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm"
                                                                onClick={() => {
                                                                    if (confirm('Yakin ingin menghapus permintaan ini?')) {
                                                                        router.delete(route('requisitions.destroy', requisition.id));
                                                                    }
                                                                }}
                                                            >
                                                                <Trash className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Pagination */}
                    {requisitions.links && (
                        <div className="mt-6 flex justify-center">
                            {/* You can implement pagination component here */}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
