import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import AppLayout from '@/layouts/app-layout';
import { PageProps, InventoryLocation } from '@/types';

interface EditLocationProps extends PageProps {
    location: InventoryLocation;
}

export default function Edit({ location }: EditLocationProps) {
    const breadcrumbs = [
        { title: 'Dashboard', href: route('dashboard') },
        { title: 'Lokasi Inventori', href: route('inventory.locations.index') },
        { title: 'Edit Lokasi', href: route('inventory.locations.edit', location.id) }
    ];

    const { data, setData, put, processing, errors } = useForm({
        name: location.name || '',
        code: location.code || '',
        type: location.type || '',
        address: location.address || '',
        description: location.description || '',
        capacity: location.capacity?.toString() || '',
        status: location.status || 'active',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('inventory.locations.update', location.id), {
            onSuccess: () => {
                toast.success('Lokasi berhasil diperbarui');
            },
            onError: () => {
                toast.error('Gagal memperbarui lokasi');
            }
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Lokasi - ${location.name}`} />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href={route('inventory.locations.index')}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Kembali
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Edit Lokasi Inventori</h1>
                        <p className="text-gray-600">Perbarui informasi lokasi penyimpanan inventori</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informasi Lokasi</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nama Lokasi *</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Masukkan nama lokasi"
                                        required
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-red-600">{errors.name}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="code">Kode Lokasi *</Label>
                                    <Input
                                        id="code"
                                        value={data.code}
                                        onChange={(e) => setData('code', e.target.value)}
                                        placeholder="Masukkan kode lokasi"
                                        required
                                    />
                                    {errors.code && (
                                        <p className="text-sm text-red-600">{errors.code}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="type">Tipe Lokasi *</Label>
                                    <Select value={data.type} onValueChange={(value: 'warehouse' | 'store' | 'clinic' | 'pharmacy') => setData('type', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih tipe lokasi" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="warehouse">Warehouse</SelectItem>
                                            <SelectItem value="store">Store</SelectItem>
                                            <SelectItem value="clinic">Clinic</SelectItem>
                                            <SelectItem value="pharmacy">Pharmacy</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.type && (
                                        <p className="text-sm text-red-600">{errors.type}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="status">Status *</Label>
                                    <Select value={data.status} onValueChange={(value: 'active' | 'inactive') => setData('status', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Aktif</SelectItem>
                                            <SelectItem value="inactive">Tidak Aktif</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.status && (
                                        <p className="text-sm text-red-600">{errors.status}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address">Alamat</Label>
                                <Textarea
                                    id="address"
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    placeholder="Masukkan alamat lokasi"
                                    rows={3}
                                />
                                {errors.address && (
                                    <p className="text-sm text-red-600">{errors.address}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Deskripsi</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Masukkan deskripsi lokasi"
                                    rows={3}
                                />
                                {errors.description && (
                                    <p className="text-sm text-red-600">{errors.description}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="capacity">Kapasitas</Label>
                                <Input
                                    id="capacity"
                                    type="number"
                                    value={data.capacity}
                                    onChange={(e) => setData('capacity', e.target.value)}
                                    placeholder="Masukkan kapasitas lokasi"
                                    min="0"
                                    step="0.01"
                                />
                                {errors.capacity && (
                                    <p className="text-sm text-red-600">{errors.capacity}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-4">
                        <Link href={route('inventory.locations.index')}>
                            <Button type="button" variant="outline">
                                Batal
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            <Save className="h-4 w-4 mr-2" />
                            {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
