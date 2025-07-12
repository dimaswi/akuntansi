import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Combobox } from '@/components/ui/combobox';
import { ArrowLeft, Save } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { PageProps, BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Departemen',
        href: '/departments',
    },
    {
        title: 'Tambah Departemen',
        href: '/departments/create',
    },
];

interface Department {
    id: number;
    name: string;
    code: string;
}

interface User {
    id: number;
    name: string;
    nip: string;
}

interface CreateProps extends PageProps {
    parentDepartments: Department[];
    managers: User[];
    users: User[];
}

export default function DepartmentCreate({ parentDepartments, managers, users }: CreateProps) {
    const { data, setData, post, processing, errors } = useForm<{
        code: string;
        name: string;
        description: string;
        parent_id: string;
        manager_id: string;
        location: string;
        monthly_budget_limit: number;
        is_active: boolean;
        can_request_items: boolean;
        user_ids: number[];
    }>({
        code: '',
        name: '',
        description: '',
        parent_id: '',
        manager_id: '',
        location: '',
        monthly_budget_limit: 0,
        is_active: true,
        can_request_items: true,
        user_ids: [],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/departments');
    };

    // Prepare options for comboboxes
    const parentDepartmentOptions = parentDepartments.map(dept => ({
        value: dept.id.toString(),
        label: dept.name,
        description: dept.code
    }));

    const managerOptions = managers.map(manager => ({
        value: manager.id.toString(),
        label: manager.name,
        description: manager.nip
    }));

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Departemen" />
            
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Tambah Departemen</h1>
                        <p className="text-muted-foreground">
                            Buat departemen baru dengan pengaturan budget dan manager
                        </p>
                    </div>
                    <Button asChild variant="outline">
                        <Link href="/departments">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Kembali
                        </Link>
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informasi Dasar</CardTitle>
                            <CardDescription>
                                Masukkan informasi dasar departemen
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="code">Kode Departemen *</Label>
                                    <Input
                                        id="code"
                                        type="text"
                                        value={data.code}
                                        onChange={(e) => setData('code', e.target.value)}
                                        placeholder="Contoh: FIN, HR, IT"
                                        className={errors.code ? 'border-red-500' : ''}
                                    />
                                    {errors.code && (
                                        <p className="text-sm text-red-500">{errors.code}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="name">Nama Departemen *</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Contoh: Finance, Human Resources"
                                        className={errors.name ? 'border-red-500' : ''}
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-red-500">{errors.name}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Deskripsi</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Deskripsi departemen (opsional)"
                                    className={errors.description ? 'border-red-500' : ''}
                                />
                                {errors.description && (
                                    <p className="text-sm text-red-500">{errors.description}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="location">Lokasi</Label>
                                <Input
                                    id="location"
                                    type="text"
                                    value={data.location}
                                    onChange={(e) => setData('location', e.target.value)}
                                    placeholder="Contoh: Lantai 2, Gedung A"
                                    className={errors.location ? 'border-red-500' : ''}
                                />
                                {errors.location && (
                                    <p className="text-sm text-red-500">{errors.location}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className='mt-6'>
                        <CardHeader>
                            <CardTitle>Struktur & Management</CardTitle>
                            <CardDescription>
                                Atur hierarchy dan manager departemen
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="parent_id">Parent Departemen</Label>
                                    <Combobox
                                        options={parentDepartmentOptions}
                                        value={data.parent_id || ''}
                                        onValueChange={(value) => setData('parent_id', value || '')}
                                        placeholder="Pilih parent departemen (opsional)..."
                                        searchPlaceholder="Cari departemen..."
                                        emptyText="Departemen tidak ditemukan"
                                        className="w-full"
                                    />
                                    {errors.parent_id && (
                                        <p className="text-sm text-red-500">{errors.parent_id}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="manager_id">Manager</Label>
                                    <Combobox
                                        options={managerOptions}
                                        value={data.manager_id || ''}
                                        onValueChange={(value) => setData('manager_id', value || '')}
                                        placeholder="Pilih manager (opsional)..."
                                        searchPlaceholder="Cari manager..."
                                        emptyText="Manager tidak ditemukan"
                                        className="w-full"
                                    />
                                    {errors.manager_id && (
                                        <p className="text-sm text-red-500">{errors.manager_id}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* User Assignment */}
                    <Card className='mt-6'>
                        <CardHeader>
                            <CardTitle>Assign Karyawan</CardTitle>
                            <CardDescription>
                                Pilih karyawan yang akan ditugaskan ke departemen ini
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Karyawan</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto border rounded-md p-4">
                                    {users.map((user) => (
                                        <div key={user.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`user-${user.id}`}
                                                checked={data.user_ids.includes(user.id)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setData('user_ids', [...data.user_ids, user.id]);
                                                    } else {
                                                        setData('user_ids', data.user_ids.filter(id => id !== user.id));
                                                    }
                                                }}
                                            />
                                            <Label htmlFor={`user-${user.id}`} className="text-sm">
                                                {user.name} ({user.nip})
                                            </Label>
                                        </div>
                                    ))}
                                    {users.length === 0 && (
                                        <p className="text-sm text-muted-foreground col-span-full text-center py-4">
                                            Tidak ada karyawan yang tersedia untuk ditugaskan
                                        </p>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Dipilih: {data.user_ids.length} karyawan
                                </p>
                                {errors.user_ids && (
                                    <p className="text-sm text-red-500">{errors.user_ids}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className='mt-6'>
                        <CardHeader>
                            <CardTitle>Budget & Permissions</CardTitle>
                            <CardDescription>
                                Atur budget bulanan dan izin permintaan barang
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="monthly_budget_limit">Budget Bulanan *</Label>
                                <div className="relative">
                                    <Input
                                        id="monthly_budget_limit"
                                        type="number"
                                        min="0"
                                        step="1000"
                                        value={data.monthly_budget_limit}
                                        onChange={(e) => setData('monthly_budget_limit', parseFloat(e.target.value) || 0)}
                                        placeholder="0"
                                        className={errors.monthly_budget_limit ? 'border-red-500' : ''}
                                    />
                                    {data.monthly_budget_limit > 0 && (
                                        <div className="mt-1 text-sm text-muted-foreground">
                                            {formatCurrency(data.monthly_budget_limit)}
                                        </div>
                                    )}
                                </div>
                                {errors.monthly_budget_limit && (
                                    <p className="text-sm text-red-500">{errors.monthly_budget_limit}</p>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="is_active"
                                        checked={data.is_active}
                                        onCheckedChange={(checked) => setData('is_active', !!checked)}
                                    />
                                    <Label htmlFor="is_active">Departemen Aktif</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="can_request_items"
                                        checked={data.can_request_items}
                                        onCheckedChange={(checked) => setData('can_request_items', !!checked)}
                                    />
                                    <Label htmlFor="can_request_items">Dapat Membuat Permintaan Barang</Label>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" asChild>
                            <Link href="/departments">Batal</Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            <Save className="h-4 w-4 mr-2" />
                            {processing ? 'Menyimpan...' : 'Simpan Departemen'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
