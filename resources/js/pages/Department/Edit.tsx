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

interface Department {
    id: number;
    name: string;
    code: string;
    description?: string;
    parent_id?: number;
    manager_id?: number;
    location?: string;
    monthly_budget_limit: number;
    is_active: boolean;
    can_request_items: boolean;
}

interface User {
    id: number;
    name: string;
    nip: string;
    department_id?: number;
}

interface EditProps extends PageProps {
    department: Department;
    parentDepartments: Department[];
    managers: User[];
    users: User[];
}

export default function DepartmentEdit({ department, parentDepartments, managers, users }: EditProps) {
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
            title: department.name,
            href: `/departments/${department.id}`,
        },
        {
            title: 'Edit',
            href: `/departments/${department.id}/edit`,
        },
    ];

    const { data, setData, put, processing, errors } = useForm<{
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
        code: department.code || '',
        name: department.name || '',
        description: department.description || '',
        parent_id: department.parent_id?.toString() || '',
        manager_id: department.manager_id?.toString() || '',
        location: department.location || '',
        monthly_budget_limit: department.monthly_budget_limit || 0,
        is_active: department.is_active,
        can_request_items: department.can_request_items,
        user_ids: users.filter(user => user.department_id === department.id).map(user => user.id),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/departments/${department.id}`);
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
            <Head title={`Edit ${department.name}`} />
            
            <div className="p-4">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Informasi Dasar</CardTitle>
                            <CardDescription>
                                Informasi dasar departemen
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="code">Kode Departemen</Label>
                                    <Input
                                        id="code"
                                        type="text"
                                        value={data.code}
                                        onChange={(e) => setData('code', e.target.value)}
                                        placeholder="Masukkan kode departemen"
                                        required
                                    />
                                    {errors.code && (
                                        <p className="text-sm text-red-600 mt-1">{errors.code}</p>
                                    )}
                                </div>
                                
                                <div>
                                    <Label htmlFor="name">Nama Departemen</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Masukkan nama departemen"
                                        required
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-red-600 mt-1">{errors.name}</p>
                                    )}
                                </div>
                            </div>
                            
                            <div>
                                <Label htmlFor="description">Deskripsi</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Deskripsi departemen"
                                    rows={3}
                                />
                                {errors.description && (
                                    <p className="text-sm text-red-600 mt-1">{errors.description}</p>
                                )}
                            </div>
                            
                            <div>
                                <Label htmlFor="location">Lokasi</Label>
                                <Input
                                    id="location"
                                    type="text"
                                    value={data.location}
                                    onChange={(e) => setData('location', e.target.value)}
                                    placeholder="Lokasi departemen"
                                />
                                {errors.location && (
                                    <p className="text-sm text-red-600 mt-1">{errors.location}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Hierarchy & Management */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Hierarki & Manajemen</CardTitle>
                            <CardDescription>
                                Pengaturan hierarki dan pengelolaan departemen
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="parent_id">Departemen Induk</Label>
                                    <Combobox
                                        options={[
                                            { value: '', label: 'Tidak ada', description: 'Tidak memiliki departemen induk' },
                                            ...parentDepartmentOptions
                                        ]}
                                        value={data.parent_id}
                                        onValueChange={(value) => setData('parent_id', value)}
                                        placeholder="Pilih departemen induk..."
                                        searchPlaceholder="Cari departemen..."
                                        emptyText="Departemen tidak ditemukan"
                                        className="w-full"
                                    />
                                    {errors.parent_id && (
                                        <p className="text-sm text-red-600 mt-1">{errors.parent_id}</p>
                                    )}
                                </div>
                                
                                <div>
                                    <Label htmlFor="manager_id">Manager</Label>
                                    <Combobox
                                        options={[
                                            { value: '', label: 'Tidak ada', description: 'Tidak memiliki manager' },
                                            ...managerOptions
                                        ]}
                                        value={data.manager_id}
                                        onValueChange={(value) => setData('manager_id', value)}
                                        placeholder="Pilih manager..."
                                        searchPlaceholder="Cari manager..."
                                        emptyText="Manager tidak ditemukan"
                                        className="w-full"
                                    />
                                    {errors.manager_id && (
                                        <p className="text-sm text-red-600 mt-1">{errors.manager_id}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* User Assignment */}
                    <Card>
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
                                                {user.department_id === department.id && (
                                                    <span className="text-green-600 ml-1">✓</span>
                                                )}
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
                                    <p className="text-sm text-red-600 mt-1">{errors.user_ids}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Budget & Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Budget & Pengaturan</CardTitle>
                            <CardDescription>
                                Pengaturan budget dan permissions departemen
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="monthly_budget_limit">Limit Budget Bulanan (IDR)</Label>
                                <Input
                                    id="monthly_budget_limit"
                                    type="number"
                                    min="0"
                                    value={data.monthly_budget_limit}
                                    onChange={(e) => setData('monthly_budget_limit', parseInt(e.target.value) || 0)}
                                    placeholder="0"
                                    required
                                />
                                <p className="text-sm text-muted-foreground mt-1">
                                    Current: {formatCurrency(data.monthly_budget_limit)}
                                </p>
                                {errors.monthly_budget_limit && (
                                    <p className="text-sm text-red-600 mt-1">{errors.monthly_budget_limit}</p>
                                )}
                            </div>
                            
                            <div className="space-y-3">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="is_active"
                                        checked={data.is_active}
                                        onCheckedChange={(checked) => setData('is_active', !!checked)}
                                    />
                                    <Label htmlFor="is_active" className="text-sm font-medium">
                                        Departemen Aktif
                                    </Label>
                                </div>
                                <p className="text-sm text-muted-foreground ml-6">
                                    Departemen yang tidak aktif tidak akan muncul dalam daftar pilihan
                                </p>
                                
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="can_request_items"
                                        checked={data.can_request_items}
                                        onCheckedChange={(checked) => setData('can_request_items', !!checked)}
                                    />
                                    <Label htmlFor="can_request_items" className="text-sm font-medium">
                                        Dapat Mengajukan Permintaan Barang
                                    </Label>
                                </div>
                                <p className="text-sm text-muted-foreground ml-6">
                                    Hanya departemen dengan permission ini yang dapat membuat permintaan barang
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Submit Actions */}
                    <div className="flex gap-4">
                        <Button type="submit" disabled={processing}>
                            <Save className="h-4 w-4 mr-2" />
                            {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </Button>
                        
                        <Button type="button" variant="outline" asChild>
                            <Link href={`/departments/${department.id}`}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Kembali
                            </Link>
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
