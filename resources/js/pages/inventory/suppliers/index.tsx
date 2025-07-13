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
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { 
    Truck, Plus, Edit, Trash2, Eye, Search, Filter, Phone, Mail, MapPin, 
    Power, PowerOff 
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

interface Supplier {
    id: number;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    is_active: boolean;
    items_count?: number;
    created_at: string;
    updated_at: string;
}

interface Props {
    suppliers?: {
        data?: Supplier[];
        links?: any[];
        meta?: {
            current_page?: number;
            last_page?: number;
            per_page?: number;
            total?: number;
        };
    };
    filters?: {
        search?: string;
        is_active?: string;
        perPage?: number;
    };
    isLogistics?: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Inventory", href: "#" },
    { title: "Suppliers", href: "/suppliers" },
];

export default function SuppliersIndex() {
    const { suppliers, filters, isLogistics = false }: Props = usePage().props as any;
    const [searchValue, setSearchValue] = useState(filters?.search || '');

    const handleSearch = (value: string) => {
        router.get('/suppliers', {
            search: value || '',
            is_active: (filters?.is_active === 'all' ? '' : filters?.is_active) || '',
            perPage: filters?.perPage,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleStatusChange = (value: string) => {
        router.get('/suppliers', {
            search: filters?.search || '',
            is_active: value === 'all' ? '' : value,
            perPage: filters?.perPage,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handlePerPageChange = (value: string) => {
        router.get('/suppliers', {
            search: filters?.search || '',
            is_active: (filters?.is_active === 'all' ? '' : filters?.is_active) || '',
            perPage: parseInt(value),
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handlePageChange = (page: number) => {
        router.get('/suppliers', {
            search: filters?.search || '',
            is_active: (filters?.is_active === 'all' ? '' : filters?.is_active) || '',
            perPage: filters?.perPage,
            page,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Apakah Anda yakin ingin menghapus supplier ini?')) {
            return;
        }

        try {
            router.delete(route('suppliers.destroy', id), {
                onSuccess: () => {
                    toast.success('Supplier berhasil dihapus');
                },
                onError: (errors) => {
                    console.error('Delete errors:', errors);
                    toast.error('Gagal menghapus supplier');
                },
            });
        } catch (error) {
            toast.error('Gagal menghapus supplier');
        }
    };

    const handleToggleStatus = async (id: number, currentStatus: boolean) => {
        const action = currentStatus ? 'menonaktifkan' : 'mengaktifkan';
        if (!confirm(`Apakah Anda yakin ingin ${action} supplier ini?`)) {
            return;
        }

        try {
            router.post(route('suppliers.toggle-status', id), {}, {
                onSuccess: () => {
                    toast.success(`Supplier berhasil ${action}`);
                },
                onError: (errors) => {
                    console.error('Toggle status errors:', errors);
                    toast.error(`Gagal ${action} supplier`);
                },
            });
        } catch (error) {
            toast.error(`Gagal ${action} supplier`);
        }
    };

    const getStatusBadge = (isActive: boolean) => {
        return isActive ? (
            <Badge variant="default" className="bg-green-100 text-green-800">
                Aktif
            </Badge>
        ) : (
            <Badge variant="destructive" className="bg-red-100 text-red-800">
                Nonaktif
            </Badge>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Suppliers" />
            <div className="max-w-7xl p-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Truck className="h-6 w-6 text-blue-600" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Manajemen Suppliers</h1>
                                <p className="text-sm text-gray-600">Kelola data supplier untuk inventory</p>
                            </div>
                        </div>
                        {isLogistics && (
                            <Button 
                                onClick={() => router.visit(route('suppliers.create'))}
                                className="flex items-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Tambah Supplier
                            </Button>
                        )}
                    </div>
                </div>

                {/* Filters Card */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filter & Pencarian
                        </CardTitle>
                        <CardDescription>
                            Filter dan cari suppliers berdasarkan kriteria tertentu
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="search">Pencarian</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="search"
                                        placeholder="Cari nama, email, telepon..."
                                        value={searchValue}
                                        onChange={(e) => setSearchValue(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleSearch(searchValue);
                                            }
                                        }}
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={filters?.is_active || 'all'} onValueChange={handleStatusChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Status</SelectItem>
                                        <SelectItem value="1">Aktif</SelectItem>
                                        <SelectItem value="0">Nonaktif</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Label htmlFor="perPage">Suppliers per halaman:</Label>
                                <Select value={filters?.perPage?.toString() || '15'} onValueChange={handlePerPageChange}>
                                    <SelectTrigger className="w-20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="15">15</SelectItem>
                                        <SelectItem value="25">25</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button 
                                variant="outline" 
                                onClick={() => handleSearch(searchValue)}
                                className="flex items-center gap-2"
                            >
                                <Search className="h-4 w-4" />
                                Cari
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Data Table Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Data Suppliers</CardTitle>
                        <CardDescription>
                            Total {suppliers?.meta?.total || 0} suppliers ditemukan
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!suppliers?.data || suppliers.data.length === 0 ? (
                            <div className="text-center py-8">
                                <Truck className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada suppliers</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    {isLogistics 
                                        ? 'Belum ada suppliers yang tersedia. Tambahkan supplier pertama Anda.'
                                        : 'Belum ada suppliers yang tersedia. Hubungi logistics untuk menambahkan supplier.'
                                    }
                                </p>
                                {isLogistics && (
                                    <div className="mt-6">
                                        <Button onClick={() => router.visit(route('suppliers.create'))}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Tambah Supplier
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Nama Supplier</TableHead>
                                                <TableHead>Kontak</TableHead>
                                                <TableHead>Alamat</TableHead>
                                                <TableHead>Items</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Aksi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {suppliers?.data?.map((supplier) => (
                                                <TableRow key={supplier.id}>
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium">{supplier.name}</div>
                                                            <div className="text-sm text-muted-foreground">
                                                                ID: {supplier.id}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="space-y-1">
                                                            {supplier.phone && (
                                                                <div className="flex items-center gap-1 text-sm">
                                                                    <Phone className="h-3 w-3 text-muted-foreground" />
                                                                    {supplier.phone}
                                                                </div>
                                                            )}
                                                            {supplier.email && (
                                                                <div className="flex items-center gap-1 text-sm">
                                                                    <Mail className="h-3 w-3 text-muted-foreground" />
                                                                    {supplier.email}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {supplier.address ? (
                                                            <div className="flex items-start gap-1 text-sm">
                                                                <MapPin className="h-3 w-3 text-muted-foreground mt-0.5" />
                                                                <span className="line-clamp-2">{supplier.address}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground text-sm">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">
                                                            {supplier.items_count || 0} items
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{getStatusBadge(supplier.is_active)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => router.visit(route('suppliers.show', supplier.id))}
                                                                title="Lihat Detail"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => router.visit(route('suppliers.edit', supplier.id))}
                                                                title="Edit Supplier"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleToggleStatus(supplier.id, supplier.is_active)}
                                                                className={supplier.is_active ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50" : "text-green-600 hover:text-green-700 hover:bg-green-50"}
                                                                title={supplier.is_active ? "Nonaktifkan" : "Aktifkan"}
                                                            >
                                                                {supplier.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDelete(supplier.id)}
                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                title="Hapus Supplier"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination */}
                                {suppliers?.meta?.last_page && suppliers.meta.last_page > 1 && (
                                    <div className="flex items-center justify-between space-x-2 py-4">
                                        <div className="text-sm text-muted-foreground">
                                            Menampilkan {((suppliers?.meta?.current_page || 1) - 1) * (suppliers?.meta?.per_page || 15) + 1} sampai{' '}
                                            {Math.min((suppliers?.meta?.current_page || 1) * (suppliers?.meta?.per_page || 15), suppliers?.meta?.total || 0)} dari{' '}
                                            {suppliers?.meta?.total || 0} suppliers
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handlePageChange((suppliers?.meta?.current_page || 1) - 1)}
                                                disabled={(suppliers?.meta?.current_page || 1) <= 1}
                                            >
                                                Sebelumnya
                                            </Button>
                                            <div className="flex items-center space-x-1">
                                                {Array.from({ length: Math.min(5, suppliers?.meta?.last_page || 1) }, (_, i) => {
                                                    const page = i + Math.max(1, (suppliers?.meta?.current_page || 1) - 2);
                                                    if (page > (suppliers?.meta?.last_page || 1)) return null;
                                                    return (
                                                        <Button
                                                            key={page}
                                                            variant={page === (suppliers?.meta?.current_page || 1) ? "default" : "outline"}
                                                            size="sm"
                                                            onClick={() => handlePageChange(page)}
                                                        >
                                                            {page}
                                                        </Button>
                                                    );
                                                })}
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handlePageChange((suppliers?.meta?.current_page || 1) + 1)}
                                                disabled={(suppliers?.meta?.current_page || 1) >= (suppliers?.meta?.last_page || 1)}
                                            >
                                                Selanjutnya
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
