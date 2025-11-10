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
import { DepartmentSearchableDropdown } from '@/components/ui/department-searchable-dropdown';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router, usePage, useForm } from '@inertiajs/react';
import { Building2, Save, ArrowLeft, X, Package } from 'lucide-react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

interface Department {
    id: number;
    code: string;
    name: string;
    level: number;
    parent_id?: number;
    is_active: boolean;
}

interface Props {
    department: Department;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: <Package className="h-4 w-4" />, href: '#' },
    {
        title: "Departments",
        href: '/departments',
    },
    {
        title: 'Edit Departemen',
        href: '#',
    },
];

export default function EditDepartment() {
    const { department }: Props = usePage().props as any;

    const { data, setData, put, processing, errors } = useForm<{
        code: string;
        name: string;
        level: number;
        parent_id: number | null;
        is_active: boolean;
    }>({
        code: department.code,
        name: department.name,
        level: department.level,
        parent_id: department.parent_id || null,
        is_active: department.is_active,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const payload = {
            ...data,
            parent_id: data.parent_id,
            level: Number(data.level),
        };

        put(route('departments.update', department.id), {
            onSuccess: () => {
                toast.success('Departemen berhasil diupdate');
            },
            onError: () => {
                toast.error('Gagal mengupdate departemen. Periksa data yang dimasukkan.');
            },
        });
    };

    const handleClearParent = () => {
        setData('parent_id', null);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Departemen" />
            <div className="max-w-7xl p-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Building2 className="h-6 w-6 text-blue-600" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Edit Departemen</h1>
                                <p className="text-sm text-gray-600">Ubah detail departemen dalam sistem</p>
                            </div>
                        </div>
                        <Button 
                            variant="outline" 
                            onClick={() => router.visit(route('departments.index'))}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Kembali
                        </Button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informasi Departemen</CardTitle>
                            <CardDescription>
                                Ubah detail departemen yang akan diupdate
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="code">
                                        Kode Departemen <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="code"
                                        value={data.code}
                                        onChange={(e) => setData('code', e.target.value)}
                                        placeholder="Masukkan kode departemen"
                                        className={errors.code ? 'border-red-500' : ''}
                                    />
                                    {errors.code && (
                                        <Alert variant="destructive">
                                            <AlertDescription>{errors.code}</AlertDescription>
                                        </Alert>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="name">
                                        Nama Departemen <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Masukkan nama departemen"
                                        className={errors.name ? 'border-red-500' : ''}
                                    />
                                    {errors.name && (
                                        <Alert variant="destructive">
                                            <AlertDescription>{errors.name}</AlertDescription>
                                        </Alert>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="level">
                                        Level <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="level"
                                        type="number"
                                        min={1}
                                        value={data.level}
                                        onChange={(e) => setData('level', Number(e.target.value))}
                                        placeholder="Masukkan level departemen"
                                        className={errors.level ? 'border-red-500' : ''}
                                    />
                                    {errors.level && (
                                        <Alert variant="destructive">
                                            <AlertDescription>{errors.level}</AlertDescription>
                                        </Alert>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select value={data.is_active ? '1' : '0'} onValueChange={(value) => setData('is_active', value === '1')}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">Aktif</SelectItem>
                                            <SelectItem value="0">Nonaktif</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Parent Departemen</Label>
                                <div className="space-y-2">
                                    <DepartmentSearchableDropdown
                                        value={data.parent_id}
                                        onValueChange={(value) => setData('parent_id', value)}
                                        placeholder="Pilih parent departemen"
                                        excludeId={department.id}
                                    />
                                    {data.parent_id && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-muted-foreground">
                                                Parent departemen dipilih
                                            </span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleClearParent}
                                                className="h-6 w-6 p-0"
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                {errors.parent_id && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{errors.parent_id}</AlertDescription>
                                    </Alert>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-3">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => router.visit(route('departments.index'))}
                        >
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing && <Save className="mr-2 h-4 w-4 animate-spin" />}
                            Simpan Perubahan
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
