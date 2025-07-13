import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { 
    Truck, 
    ArrowLeft, 
    Edit, 
    Trash2, 
    Phone, 
    Mail, 
    MapPin, 
    Calendar,
    Package,
    Power,
    PowerOff,
    AlertCircle
} from 'lucide-react';
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
    items?: Array<{
        id: number;
        name: string;
        code: string;
        stock: number;
    }>;
    created_at: string;
    updated_at: string;
}

interface Props {
    supplier: Supplier;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Inventory", href: "#" },
    { title: "Suppliers", href: "/suppliers" },
    { title: "Detail Supplier", href: "/suppliers/show" },
];

export default function SuppliersShow() {
    const { supplier }: Props = usePage().props as any;

    const handleBack = () => {
        router.visit(route('suppliers.index'));
    };

    const handleEdit = () => {
        router.visit(route('suppliers.edit', supplier.id));
    };

    const handleDelete = async () => {
        if (!confirm('Apakah Anda yakin ingin menghapus supplier ini?')) {
            return;
        }

        try {
            router.delete(route('suppliers.destroy', supplier.id), {
                onSuccess: () => {
                    toast.success('Supplier berhasil dihapus');
                    router.visit(route('suppliers.index'));
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

    const handleToggleStatus = async () => {
        const action = supplier.is_active ? 'menonaktifkan' : 'mengaktifkan';
        if (!confirm(`Apakah Anda yakin ingin ${action} supplier ini?`)) {
            return;
        }

        try {
            router.post(route('suppliers.toggle-status', supplier.id), {}, {
                onSuccess: () => {
                    toast.success(`Supplier berhasil ${supplier.is_active ? 'dinonaktifkan' : 'diaktifkan'}`);
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
                <Power className="h-3 w-3 mr-1" />
                Aktif
            </Badge>
        ) : (
            <Badge variant="destructive" className="bg-red-100 text-red-800">
                <PowerOff className="h-3 w-3 mr-1" />
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
            minute: '2-digit'
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detail Supplier - ${supplier.name}`} />
            <div className="max-w-7xl p-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Truck className="h-6 w-6 text-blue-600" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Detail Supplier</h1>
                                <p className="text-sm text-gray-600">Informasi lengkap supplier: {supplier.name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="outline"
                                onClick={handleBack}
                                className="flex items-center gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Kembali
                            </Button>
                            <Button 
                                variant="outline"
                                onClick={handleEdit}
                                className="flex items-center gap-2"
                            >
                                <Edit className="h-4 w-4" />
                                Edit
                            </Button>
                            <Button 
                                variant={supplier.is_active ? "outline" : "default"}
                                onClick={handleToggleStatus}
                                className="flex items-center gap-2"
                            >
                                {supplier.is_active ? (
                                    <>
                                        <PowerOff className="h-4 w-4" />
                                        Nonaktifkan
                                    </>
                                ) : (
                                    <>
                                        <Power className="h-4 w-4" />
                                        Aktifkan
                                    </>
                                )}
                            </Button>
                            <Button 
                                variant="destructive"
                                onClick={handleDelete}
                                className="flex items-center gap-2"
                            >
                                <Trash2 className="h-4 w-4" />
                                Hapus
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Basic Information */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            {supplier.name}
                                            {getStatusBadge(supplier.is_active)}
                                        </CardTitle>
                                        <CardDescription>
                                            ID Supplier: {supplier.id}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Contact Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <h4 className="font-medium text-sm text-gray-700">Kontak</h4>
                                        
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
                                        <h4 className="font-medium text-sm text-gray-700">Alamat</h4>
                                        {supplier.address ? (
                                            <div className="flex items-start gap-2">
                                                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
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
                                    <h4 className="font-medium text-sm text-gray-700 mb-3">Statistik</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                                <p className="font-medium text-sm">{formatDate(supplier.created_at)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-orange-600" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Diperbarui</p>
                                                <p className="font-medium text-sm">{formatDate(supplier.updated_at)}</p>
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
                                <CardDescription>
                                    Daftar item yang disuplai oleh supplier ini
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {!supplier.items || supplier.items.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Package className="mx-auto h-12 w-12 text-gray-400" />
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">Belum ada items</h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Supplier ini belum memiliki item yang terkait.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {supplier.items.map((item) => (
                                            <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div>
                                                    <p className="font-medium">{item.name}</p>
                                                    <p className="text-sm text-muted-foreground">Kode: {item.code}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium">Stok: {item.stock}</p>
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
                                <Button 
                                    variant="outline" 
                                    className="w-full justify-start"
                                    onClick={handleEdit}
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Supplier
                                </Button>
                                
                                <Button 
                                    variant="outline" 
                                    className="w-full justify-start"
                                    onClick={handleToggleStatus}
                                >
                                    {supplier.is_active ? (
                                        <>
                                            <PowerOff className="h-4 w-4 mr-2" />
                                            Nonaktifkan
                                        </>
                                    ) : (
                                        <>
                                            <Power className="h-4 w-4 mr-2" />
                                            Aktifkan
                                        </>
                                    )}
                                </Button>
                                
                                <Button 
                                    variant="destructive" 
                                    className="w-full justify-start"
                                    onClick={handleDelete}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Hapus Supplier
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
