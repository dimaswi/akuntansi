import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { toast } from '@/lib/toast';
import { BreadcrumbItem } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, Package, Save } from 'lucide-react';
import { route } from 'ziggy-js';

interface Supplier {
    id: number;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface SupplierFormData {
    name: string;
    address: string;
    phone: string;
    email: string;
    is_active: boolean;
    [key: string]: any;
}

interface Props {
    supplier: Supplier;
}

export default function SuppliersEdit() {
    const { supplier }: Props = usePage().props as any;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: <Package className="h-4 w-4" />, href: '#' },
        {
            title: 'Data Supplier',
            href: '/suppliers',
        },
        {
            title: supplier.name,
            href: route('suppliers.show', supplier.id),
        },
        {
            title: 'Edit Supplier',
            href: '#',
        },
    ];

    const { data, setData, put, processing, errors, reset } = useForm<SupplierFormData>({
        name: supplier.name || '',
        address: supplier.address || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        is_active: supplier.is_active,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        put(route('suppliers.update', supplier.id), {
            onSuccess: () => {
                router.visit(route('suppliers.index'));
            },
            onError: (errors) => {
                console.error('Validation errors:', errors);
                toast.error(errors?.message || 'Gagal memperbarui supplier. Periksa data yang diisi.');
            },
        });
    };

    const handleBack = () => {
        router.visit(route('suppliers.index'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Supplier - ${supplier.name}`} />
            <div className="p-4 sm:px-6 lg:px-8">
                {/* Form Card */}
                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div>
                                    <Button type="button" variant="outline" onClick={() => window.history.back()}>
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div>
                                    <CardTitle>Informasi Supplier</CardTitle>
                                    <CardDescription>Perbarui informasi supplier yang diperlukan</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Error Alert */}
                            {Object.keys(errors).length > 0 && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        Terdapat kesalahan dalam pengisian form. Silakan periksa kembali data yang diisi.
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Basic Information */}
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">
                                        Nama Supplier <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Masukkan nama supplier"
                                        className={errors.name ? 'border-red-500' : ''}
                                    />
                                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">Nomor Telepon</Label>
                                    <Input
                                        id="phone"
                                        type="text"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        placeholder="Contoh: 021-1234567"
                                        className={errors.phone ? 'border-red-500' : ''}
                                    />
                                    {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="Contoh: supplier@example.com"
                                    className={errors.email ? 'border-red-500' : ''}
                                />
                                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address">Alamat</Label>
                                <Textarea
                                    id="address"
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    placeholder="Masukkan alamat lengkap supplier"
                                    rows={3}
                                    className={errors.address ? 'border-red-500' : ''}
                                />
                                {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
                            </div>

                            {/* Status */}
                            <div className="space-y-4">
                                <div className="border-t pt-4">
                                    <h3 className="text-lg font-medium">Pengaturan Status</h3>
                                    <p className="text-sm text-gray-600">Tentukan status aktif untuk supplier ini</p>
                                </div>

                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="is_active">Status Aktif</Label>
                                        <p className="text-sm text-muted-foreground">Supplier yang aktif dapat digunakan dalam transaksi</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Input
                                            id="is_active"
                                            type="checkbox"
                                            checked={data.is_active}
                                            onChange={(e) => setData('is_active', e.target.checked)}
                                            className="h-4 w-4"
                                        />
                                        <Label htmlFor="is_active" className="text-sm">
                                            {data.is_active ? 'Aktif' : 'Nonaktif'}
                                        </Label>
                                    </div>
                                </div>
                            </div>

                            {/* Information Note */}
                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    <strong>Catatan:</strong> Field yang ditandai dengan tanda bintang (*) wajib diisi. Pastikan informasi yang
                                    dimasukkan akurat dan lengkap.
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="mt-6 flex items-center justify-end gap-4">
                        <Button type="button" variant="outline" onClick={handleBack} disabled={processing}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing} className="flex items-center gap-2">
                            <Save className="h-4 w-4" />
                            {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
