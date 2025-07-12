import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/                                <Select value={fromDepartment} onValueChange={setFromDepartment}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Semua Departemen" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Departemen</SelectItem>
                                        {departments.map((dept: any) => (
                                            <SelectItem key={dept.id} value={dept.id.toString()}>
                                                {dept.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>ort { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Eye, FileX, Plus, Search } from 'lucide-react';
import { PageProps as InertiaPageProps } from '@inertiajs/core';

interface DepartmentInventoryTransfer {
    id: number;
    transfer_number: string;
    from_department: {
        id: number;
        name: string;
    };
    to_department: {
        id: number;
        name: string;
    };
    status: 'pending' | 'approved' | 'transferred' | 'received' | 'cancelled';
    total_items: number;
    total_cost: number;
    requested_by: {
        id: number;
        name: string;
    };
    approved_by?: {
        id: number;
        name: string;
    };
    approved_at?: string;
    transferred_at?: string;
    received_at?: string;
    created_at: string;
    notes?: string;
}

interface PageProps extends InertiaPageProps {
    transfers: {
        data: DepartmentInventoryTransfer[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    departments: Array<{
        id: number;
        name: string;
    }>;
    filters: {
        search?: string;
        status?: string;
        from_department?: string;
        to_department?: string;
    };
}

const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    transferred: 'bg-purple-100 text-purple-800',
    received: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
};

const statusLabels = {
    pending: 'Menunggu Persetujuan',
    approved: 'Disetujui',
    transferred: 'Ditransfer',
    received: 'Diterima',
    cancelled: 'Dibatalkan',
};

export default function Index() {
    const { transfers, departments, filters } = usePage<PageProps>().props;
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [fromDepartment, setFromDepartment] = useState(filters.from_department || 'all');
    const [toDepartment, setToDepartment] = useState(filters.to_department || 'all');

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (status && status !== 'all') params.append('status', status);
        if (fromDepartment && fromDepartment !== 'all') params.append('from_department', fromDepartment);
        if (toDepartment && toDepartment !== 'all') params.append('to_department', toDepartment);
        
        window.location.href = `/department-inventory-transfers?${params.toString()}`;
    };

    const handleReset = () => {
        setSearch('');
        setStatus('all');
        setFromDepartment('all');
        setToDepartment('all');
        window.location.href = '/department-inventory-transfers';
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Transfer Inventori Antar Departemen" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Transfer Inventori Antar Departemen</CardTitle>
                                    <CardDescription>
                                        Kelola transfer barang antar departemen
                                    </CardDescription>
                                </div>
                                <Button asChild>
                                    <Link href="/department-requests">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Pilih dari Permintaan
                                    </Link>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* Filters */}
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                                <div className="relative">
                                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <Input
                                        placeholder="Cari nomor transfer..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-10"
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    />
                                </div>
                                
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Semua Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Status</SelectItem>
                                        <SelectItem value="pending">Menunggu Persetujuan</SelectItem>
                                        <SelectItem value="approved">Disetujui</SelectItem>
                                        <SelectItem value="transferred">Ditransfer</SelectItem>
                                        <SelectItem value="received">Diterima</SelectItem>
                                        <SelectItem value="cancelled">Dibatalkan</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={fromDepartment} onValueChange={setFromDepartment}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Dari Departemen" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Departemen</SelectItem>
                                        {departments.map((dept) => (
                                            <SelectItem key={dept.id} value={dept.id.toString()}>
                                                {dept.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={toDepartment} onValueChange={setToDepartment}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Ke Departemen" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Departemen</SelectItem>
                                        {departments.map((dept) => (
                                            <SelectItem key={dept.id} value={dept.id.toString()}>
                                                {dept.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <div className="flex gap-2">
                                    <Button onClick={handleSearch} className="flex-1">
                                        <Search className="h-4 w-4 mr-2" />
                                        Cari
                                    </Button>
                                    <Button variant="outline" onClick={handleReset}>
                                        <FileX className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>No. Transfer</TableHead>
                                            <TableHead>Dari Departemen</TableHead>
                                            <TableHead>Ke Departemen</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Total Item</TableHead>
                                            <TableHead>Total Biaya</TableHead>
                                            <TableHead>Diminta oleh</TableHead>
                                            <TableHead>Tanggal</TableHead>
                                            <TableHead className="text-right">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {transfers.data.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={9} className="text-center py-8">
                                                    <div className="text-gray-500">
                                                        <div className="text-lg font-medium">Belum ada transfer</div>
                                                        <div className="text-sm">
                                                            Transfer inventori akan muncul di sini setelah dibuat
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            transfers.data.map((transfer) => (
                                                <TableRow key={transfer.id}>
                                                    <TableCell className="font-mono">
                                                        {transfer.transfer_number}
                                                    </TableCell>
                                                    <TableCell>{transfer.from_department.name}</TableCell>
                                                    <TableCell>{transfer.to_department.name}</TableCell>
                                                    <TableCell>
                                                        <Badge className={statusColors[transfer.status]}>
                                                            {statusLabels[transfer.status]}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{transfer.total_items} item</TableCell>
                                                    <TableCell>{formatCurrency(transfer.total_cost)}</TableCell>
                                                    <TableCell>{transfer.requested_by.name}</TableCell>
                                                    <TableCell>{formatDate(transfer.created_at)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button variant="outline" size="sm" asChild>
                                                                <Link href={`/department-inventory-transfers/${transfer.id}`}>
                                                                    <Eye className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            {transfers.last_page > 1 && (
                                <div className="flex items-center justify-between mt-6">
                                    <div className="text-sm text-gray-700">
                                        Menampilkan {((transfers.current_page - 1) * transfers.per_page) + 1} hingga{' '}
                                        {Math.min(transfers.current_page * transfers.per_page, transfers.total)} dari{' '}
                                        {transfers.total} transfer
                                    </div>
                                    <div className="flex gap-2">
                                        {transfers.current_page > 1 && (
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/department-inventory-transfers?page=${transfers.current_page - 1}`}>
                                                    Sebelumnya
                                                </Link>
                                            </Button>
                                        )}
                                        {transfers.current_page < transfers.last_page && (
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/department-inventory-transfers?page=${transfers.current_page + 1}`}>
                                                    Selanjutnya
                                                </Link>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
