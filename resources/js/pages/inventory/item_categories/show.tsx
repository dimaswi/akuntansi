import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { usePermission } from '@/hooks/use-permission';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Calendar, CheckCircle2, Edit3, Package, XCircle } from 'lucide-react';
import { route } from 'ziggy-js';

interface ItemCategory {
    id: number;
    code: string;
    name: string;
    category_type: 'pharmacy' | 'general' | 'medical';
    parent_id: number | null;
    is_active: boolean;
    requires_batch_tracking: boolean;
    requires_expiry_tracking: boolean;
    parent?: ItemCategory;
    created_at: string;
    updated_at: string;
}

interface Props extends SharedData {
    category: ItemCategory;
}

const categoryTypeLabels = {
    pharmacy: 'Farmasi',
    general: 'Umum',
    medical: 'Alat Kesehatan',
};

const categoryTypeColors = {
    pharmacy: 'bg-blue-100 text-blue-800',
    general: 'bg-green-100 text-green-800',
    medical: 'bg-purple-100 text-purple-800',
};

export default function ItemCategoryShow({ category }: Props) {
    const { hasPermission } = usePermission();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: <Package className="h-4 w-4" />, href: '#' },
        {
            title: 'Item Categories',
            href: route('item_categories.index'),
        },
        {
            title: category.name,
            href: '#',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detail Kategori - ${category.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <Card>
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="h-5 w-5" />
                                    Detail Kategori Barang
                                </CardTitle>
                                <CardDescription>Informasi lengkap kategori barang</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => router.visit(route('item_categories.index'))}>
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Kembali
                                </Button>
                                {hasPermission('inventory.categories.edit') && (
                                    <Button onClick={() => router.visit(route('item_categories.edit', category.id))}>
                                        <Edit3 className="mr-2 h-4 w-4" />
                                        Edit
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Left Column */}
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Kode Kategori</label>
                                    <p className="mt-1 text-lg font-semibold">{category.code}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Nama Kategori</label>
                                    <p className="mt-1 text-lg font-semibold">{category.name}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Tipe Kategori</label>
                                    <div className="mt-1">
                                        <Badge className={categoryTypeColors[category.category_type]}>
                                            {categoryTypeLabels[category.category_type]}
                                        </Badge>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Parent Kategori</label>
                                    <p className="mt-1 text-base">{category.parent?.name || '-'}</p>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                                    <div className="mt-1">
                                        <Badge variant={category.is_active ? 'default' : 'secondary'}>
                                            {category.is_active ? (
                                                <>
                                                    <CheckCircle2 className="mr-1 h-3 w-3" />
                                                    Aktif
                                                </>
                                            ) : (
                                                <>
                                                    <XCircle className="mr-1 h-3 w-3" />
                                                    Nonaktif
                                                </>
                                            )}
                                        </Badge>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Tracking Batch</label>
                                    <div className="mt-1">
                                        {category.requires_batch_tracking ? (
                                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                                Ya
                                            </Badge>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">Tidak</span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Tracking Expiry</label>
                                    <div className="mt-1">
                                        {category.requires_expiry_tracking ? (
                                            <Badge variant="outline" className="bg-orange-50 text-orange-700">
                                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                                Ya
                                            </Badge>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">Tidak</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Separator className="my-6" />

                        {/* Timestamps */}
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>
                                    Dibuat: {new Date(category.created_at).toLocaleDateString('id-ID', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>
                                    Diupdate: {new Date(category.updated_at).toLocaleDateString('id-ID', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
