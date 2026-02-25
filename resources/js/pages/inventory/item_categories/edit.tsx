import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { toast } from '@/lib/toast';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Loader2, Package, Save } from 'lucide-react';
import { useEffect } from 'react';
import { route } from 'ziggy-js';

interface ItemCategory {
    id: number;
    code: string;
    name: string;
    category_type: string;
    parent_id: number | null;
    is_active: boolean;
    requires_batch_tracking: boolean;
    requires_expiry_tracking: boolean;
}

interface Props extends SharedData {
    item_category: ItemCategory;
    parents: ItemCategory[];
}

type ItemCategoryForm = {
    code: string;
    name: string;
    category_type: string;
    parent_id: string;
    is_active: boolean;
    requires_batch_tracking: boolean;
    requires_expiry_tracking: boolean;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: <Package className="h-4 w-4" />, href: '#' },
    {
        title: 'Item Categories',
        href: '/item-categories',
    },
    {
        title: 'Edit Kategori',
        href: '#',
    },
];

export default function ItemCategoryEdit() {
    const { item_category, parents = [] } = usePage<Props>().props;

    const { data, setData, put, processing, errors, wasSuccessful } = useForm<ItemCategoryForm>({
        code: item_category.code || '',
        name: item_category.name || '',
        category_type: item_category.category_type || '',
        parent_id: item_category.parent_id ? String(item_category.parent_id) : '',
        is_active: !!item_category.is_active,
        requires_batch_tracking: !!item_category.requires_batch_tracking,
        requires_expiry_tracking: !!item_category.requires_expiry_tracking,
    });

    useEffect(() => {
        if (wasSuccessful) {
            toast.success('Kategori berhasil diperbarui');
            router.visit(route('item_categories.index'));
        }
    }, [wasSuccessful]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        put(route('item_categories.update', item_category.id), {
            onError: (errors) => {
                toast.error(errors?.message || 'Gagal memperbarui kategori');
            },
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Kategori Barang" />

            <div className="p-4">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div>
                                <Button type='button' variant="outline" size="sm" onClick={() => router.visit('/item-categories')} className="gap-2">
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                            </div>
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="h-5 w-5" />
                                    Edit Kategori Barang
                                </CardTitle>
                                <CardDescription>Perbarui informasi kategori "{item_category.name}"</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="code">
                                        Kode Kategori <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="code"
                                        value={data.code}
                                        onChange={(e) => setData('code', e.target.value)}
                                        placeholder="Masukkan kode kategori"
                                        required
                                        autoFocus
                                    />
                                    {errors.code && <div className="text-sm text-red-600">{errors.code}</div>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="name">
                                        Nama Kategori <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Masukkan nama kategori"
                                        required
                                    />
                                    {errors.name && <div className="text-sm text-red-600">{errors.name}</div>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="category_type">
                                        Tipe Kategori <span className="text-red-500">*</span>
                                    </Label>
                                    <Select value={data.category_type} onValueChange={(value) => setData('category_type', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih tipe kategori" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pharmacy">
                                                <div className="flex items-center gap-2">
                                                    <Badge className="bg-blue-100 text-blue-800">Farmasi</Badge>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="general">
                                                <div className="flex items-center gap-2">
                                                    <Badge className="bg-green-100 text-green-800">Umum</Badge>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="medical">
                                                <div className="flex items-center gap-2">
                                                    <Badge className="bg-purple-100 text-purple-800">Alat Kesehatan</Badge>
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.category_type && <div className="text-sm text-red-600">{errors.category_type}</div>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="parent_id">Kategori Induk</Label>
                                    <div className="relative">
                                        <Select
                                            value={data.parent_id || '0'}
                                            onValueChange={(value) => setData('parent_id', value === '0' ? '' : value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih kategori induk (opsional)" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="0">Tanpa Induk</SelectItem>
                                                {parents
                                                    .filter((p) => p.id !== item_category.id)
                                                    .map((parent) => (
                                                        <SelectItem key={parent.id} value={String(parent.id)}>
                                                            {parent.name} ({parent.code})
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                        {data.parent_id && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setData('parent_id', '')}
                                                className="absolute top-1/2 right-8 h-6 w-6 -translate-y-1/2 transform p-0 hover:bg-gray-100"
                                                title="Hapus kategori induk"
                                            >
                                                ✕
                                            </Button>
                                        )}
                                    </div>
                                    {errors.parent_id && <div className="text-sm text-red-600">{errors.parent_id}</div>}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label>Pengaturan Kategori</Label>
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="is_active"
                                            checked={data.is_active}
                                            onCheckedChange={(checked) => setData('is_active', !!checked)}
                                        />
                                        <Label htmlFor="is_active" className="text-sm font-normal">
                                            Kategori aktif
                                        </Label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="requires_batch_tracking"
                                            checked={data.requires_batch_tracking}
                                            onCheckedChange={(checked) => setData('requires_batch_tracking', !!checked)}
                                        />
                                        <Label htmlFor="requires_batch_tracking" className="text-sm font-normal">
                                            Memerlukan tracking batch/lot
                                        </Label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="requires_expiry_tracking"
                                            checked={data.requires_expiry_tracking}
                                            onCheckedChange={(checked) => setData('requires_expiry_tracking', !!checked)}
                                        />
                                        <Label htmlFor="requires_expiry_tracking" className="text-sm font-normal">
                                            Memerlukan tracking tanggal kadaluarsa
                                        </Label>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 pt-4">
                                <Button type="submit" disabled={processing} className="gap-2">
                                    {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </Button>
                                <Button type="button" variant="outline" onClick={() => router.visit('/item-categories')} disabled={processing}>
                                    Batal
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
