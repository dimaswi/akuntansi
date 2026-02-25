import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { toast } from '@/lib/toast';
import { BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, Calendar, Edit, Mail, MapPin, Package, Phone, Power, PowerOff, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { route } from 'ziggy-js';

interface Supplier {
    id: number;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    is_active: boolean;
    items_count?: number;
    items?: Array<{
        id: number;
        name: string;
        code: string;
    }>;
    created_at: string;
    updated_at: string;
}

interface Props {
    supplier: Supplier;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: <Package className="h-4 w-4" />, href: '#' },
    {
        title: 'Suppliers',
        href: route('suppliers.index'),
    },
    {
        title: 'Detail Supplier',
        href: '',
    },
];

export default function SuppliersShow() {
    const { supplier }: Props = usePage().props as any;
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [toggleDialogOpen, setToggleDialogOpen] = useState(false);

    const handleBack = () => {
        router.visit(route('suppliers.index'));
    };

    const handleEdit = () => {
        router.visit(route('suppliers.edit', supplier.id));
    };

    const handleDelete = async () => {
        try {
            router.delete(route('suppliers.destroy', supplier.id), {
                onSuccess: () => {
                    setDeleteDialogOpen(false);
                    router.visit(route('suppliers.index'));
                },
                onError: (errors) => {
                    console.error('Delete errors:', errors);
                    toast.error(errors?.message || 'Gagal menghapus supplier');
                },
            });
        } catch (error) {
            toast.error('Gagal menghapus supplier');
        }
    };

    const handleToggleStatus = async () => {
        const action = supplier.is_active ? 'dinonaktifkan' : 'diaktifkan';
        try {
            router.post(
                route('suppliers.toggle-status', supplier.id),
                {},
                {
                    onSuccess: () => {
                        setToggleDialogOpen(false);
                    },
                    onError: (errors) => {
                        console.error('Toggle status errors:', errors);
                        toast.error(errors?.message || `Gagal ${action === 'diaktifkan' ? 'mengaktifkan' : 'menonaktifkan'} supplier`);
                    },
                },
            );
        } catch (error) {
            toast.error(`Gagal ${action === 'diaktifkan' ? 'mengaktifkan' : 'menonaktifkan'} supplier`);
        }
    };

    const getStatusBadge = (isActive: boolean) => {
        return isActive ? (
            <Badge variant="default" className="bg-green-100 text-green-800">
                <Power className="mr-1 h-3 w-3" />
                Aktif
            </Badge>
        ) : (
            <Badge variant="destructive" className="bg-red-100 text-red-800">
                <PowerOff className="mr-1 h-3 w-3" />
                Nonaktif
            </Badge>
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detail Supplier - ${supplier.name}`} />
            <div className="p-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Basic Information */}
                    <div className="space-y-6 lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <div>
                                        <Button type="button" variant="outline" onClick={() => window.history.back()}>
                                            <ArrowLeft className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                {supplier.name}
                                                {getStatusBadge(supplier.is_active)}
                                            </CardTitle>
                                            <CardDescription>ID Supplier: {supplier.id}</CardDescription>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Contact Information */}
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-medium text-gray-700">Kontak</h4>

                                        {supplier.phone ? (
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">{supplier.phone}</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm text-muted-foreground">Tidak ada telepon</span>
                                            </div>
                                        )}

                                        {supplier.email ? (
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">{supplier.email}</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm text-muted-foreground">Tidak ada email</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        <h4 className="text-sm font-medium text-gray-700">Alamat</h4>
                                        {supplier.address ? (
                                            <div className="flex items-start gap-2">
                                                <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">{supplier.address}</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm text-muted-foreground">Tidak ada alamat</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Statistics */}
                                <div className="border-t pt-4">
                                    <h4 className="mb-3 text-sm font-medium text-gray-700">Statistik</h4>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                        <div className="flex items-center gap-2">
                                            <Package className="h-4 w-4 text-blue-600" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Total Items</p>
                                                <p className="font-medium">{supplier.items_count || 0}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-green-600" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Dibuat</p>
                                                <p className="text-sm font-medium">{formatDate(supplier.created_at)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-orange-600" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Diperbarui</p>
                                                <p className="text-sm font-medium">{formatDate(supplier.updated_at)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Associated Items */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="h-5 w-5" />
                                    Items Terkait
                                </CardTitle>
                                <CardDescription>Daftar item yang disuplai oleh supplier ini</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {!supplier.items || supplier.items.length === 0 ? (
                                    <div className="py-8 text-center">
                                        <Package className="mx-auto h-12 w-12 text-gray-400" />
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">Belum ada items</h3>
                                        <p className="mt-1 text-sm text-gray-500">Supplier ini belum memiliki item yang terkait.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {supplier.items.map((item) => (
                                            <div key={item.id} className="flex items-center justify-between rounded-lg border p-3">
                                                <div>
                                                    <p className="font-medium">{item.name}</p>
                                                    <p className="text-sm text-muted-foreground">Kode: {item.code}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar Information */}
                    <div className="space-y-6">
                        {/* Status Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Status Supplier</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Status Aktif</span>
                                    {getStatusBadge(supplier.is_active)}
                                </div>

                                {!supplier.is_active && (
                                    <Alert className="border-orange-200 bg-orange-50">
                                        <AlertCircle className="h-4 w-4 text-orange-600" />
                                        <AlertDescription className="text-orange-800">
                                            Supplier ini dalam status nonaktif dan tidak dapat digunakan dalam transaksi baru.
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>

                        {/* Quick Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Aksi Cepat</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Button variant="outline" className="w-full justify-start" onClick={handleEdit}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Supplier
                                </Button>

                                <Button variant="outline" className="w-full justify-start" onClick={() => setToggleDialogOpen(true)}>
                                    {supplier.is_active ? (
                                        <>
                                            <PowerOff className="mr-2 h-4 w-4" />
                                            Nonaktifkan
                                        </>
                                    ) : (
                                        <>
                                            <Power className="mr-2 h-4 w-4" />
                                            Aktifkan
                                        </>
                                    )}
                                </Button>

                                <Button variant="destructive" className="w-full justify-start" onClick={() => setDeleteDialogOpen(true)}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Hapus Supplier
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Supplier?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus supplier ini? Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data terkait.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Toggle Status Confirmation Dialog */}
            <AlertDialog open={toggleDialogOpen} onOpenChange={setToggleDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{supplier.is_active ? 'Nonaktifkan' : 'Aktifkan'} Supplier?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin {supplier.is_active ? 'menonaktifkan' : 'mengaktifkan'} supplier ini?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleToggleStatus}>{supplier.is_active ? 'Nonaktifkan' : 'Aktifkan'}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
