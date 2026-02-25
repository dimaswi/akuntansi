import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowRightLeft, Landmark, Save } from 'lucide-react';
import { toast } from '@/lib/toast';
import { useState } from 'react';
import { route } from 'ziggy-js';

interface UnrealizedItem {
    id: number;
    item_name: string;
    description?: string;
    category?: { id: number; name: string };
    department?: { id: number; name: string };
    category_id?: number;
    department_id?: number;
    original_quantity: number;
    realized_quantity: number;
    remaining_quantity: number;
    estimated_unit_cost: number;
    priority: string;
    notes?: string;
    selected: boolean;
}

interface SourceBudget {
    id: number;
    code: string;
    fiscal_year: number;
    title: string;
}

interface Props extends SharedData {
    sourceBudget: SourceBudget;
    unrealizedItems: UnrealizedItem[];
    nextYear: number;
    generatedCode: string;
}

interface RolloverItem {
    source_item_id: number | null;
    category_id: string;
    department_id: string;
    item_name: string;
    description: string;
    quantity: number;
    estimated_unit_cost: number;
    priority: string;
    notes: string;
    selected: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: <Landmark className="h-4 w-4" />, href: route('aset.dashboard') },
    { title: 'RAB Aset', href: route('aset.budgets.index') },
    { title: 'Rollover', href: '#' },
];

const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const priorityLabel: Record<string, string> = { high: 'Tinggi', medium: 'Sedang', low: 'Rendah' };

export default function RolloverBudget() {
    const { sourceBudget, unrealizedItems, nextYear, generatedCode } = usePage<Props>().props;

    const initialItems: RolloverItem[] = unrealizedItems.map((item) => ({
        source_item_id: item.id,
        category_id: item.category_id?.toString() ?? '',
        department_id: item.department_id?.toString() ?? '',
        item_name: item.item_name,
        description: item.description ?? '',
        quantity: item.remaining_quantity,
        estimated_unit_cost: item.estimated_unit_cost,
        priority: item.priority,
        notes: item.notes ?? '',
        selected: true,
    }));

    const [items, setItems] = useState<RolloverItem[]>(initialItems);

    const { data, setData, post, processing, errors } = useForm<{
        code: string;
        fiscal_year: number;
        title: string;
        description: string;
        items: any[];
    }>({
        code: generatedCode,
        fiscal_year: nextYear,
        title: `RAB Aset Tahun ${nextYear}`,
        description: `Rollover dari ${sourceBudget.code} (${sourceBudget.fiscal_year})`,
        items: initialItems.filter((i) => i.selected),
    });

    const toggleItem = (index: number) => {
        const updated = [...items];
        updated[index] = { ...updated[index], selected: !updated[index].selected };
        setItems(updated);
        setData('items', updated.filter((i) => i.selected));
    };

    const toggleAll = (checked: boolean) => {
        const updated = items.map((i) => ({ ...i, selected: checked }));
        setItems(updated);
        setData('items', updated.filter((i) => i.selected));
    };

    const updateItemQty = (index: number, qty: number) => {
        const updated = [...items];
        updated[index] = { ...updated[index], quantity: qty };
        setItems(updated);
        setData('items', updated.filter((i) => i.selected));
    };

    const selectedItems = items.filter((i) => i.selected);
    const totalBudget = selectedItems.reduce((sum, item) => sum + item.quantity * item.estimated_unit_cost, 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedItems.length === 0) {
            toast.error('Pilih minimal 1 item untuk rollover');
            return;
        }
        post(route('aset.budgets.rollover.store', sourceBudget.id), {
            onError: () => toast.error('Gagal melakukan rollover'),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Rollover RAB" />
            <div className="space-y-6 p-4">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Source Info */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Button type="button" variant="outline" onClick={() => window.history.back()}>
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <ArrowRightLeft className="h-5 w-5" />
                                        Rollover RAB ke Tahun Baru
                                    </CardTitle>
                                    <CardDescription>
                                        Memindahkan item yang belum terealisasi dari {sourceBudget.code} ({sourceBudget.fiscal_year}) ke RAB tahun {nextYear}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label>Kode RAB Baru</Label>
                                    <Input value={data.code} readOnly className="bg-muted" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tahun Anggaran Baru</Label>
                                    <Input
                                        type="number"
                                        value={data.fiscal_year}
                                        onChange={(e) => {
                                            const y = parseInt(e.target.value);
                                            setData((prev) => ({ ...prev, fiscal_year: y, title: `RAB Aset Tahun ${y}` }));
                                        }}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Judul</Label>
                                    <Input value={data.title} onChange={(e) => setData('title', e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Deskripsi</Label>
                                <Textarea value={data.description} onChange={(e) => setData('description', e.target.value)} rows={2} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Items to Rollover */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Item Belum Terealisasi</CardTitle>
                                    <CardDescription>Pilih item yang akan dipindahkan ke RAB baru</CardDescription>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">Total Rollover ({selectedItems.length} item)</p>
                                    <p className="text-xl font-bold text-blue-600">{fmtCurrency(totalBudget)}</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-10">
                                            <Checkbox
                                                checked={items.every((i) => i.selected)}
                                                onCheckedChange={(v) => toggleAll(!!v)}
                                            />
                                        </TableHead>
                                        <TableHead>Nama Barang</TableHead>
                                        <TableHead>Kategori</TableHead>
                                        <TableHead>Departemen</TableHead>
                                        <TableHead className="text-center">Qty Asal</TableHead>
                                        <TableHead className="text-center">Realisasi</TableHead>
                                        <TableHead className="text-center">Qty Rollover</TableHead>
                                        <TableHead className="text-right">Harga Satuan</TableHead>
                                        <TableHead className="text-right">Subtotal</TableHead>
                                        <TableHead className="text-center">Prioritas</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((item, idx) => {
                                        const orig = unrealizedItems[idx];
                                        return (
                                            <TableRow key={idx} className={!item.selected ? 'opacity-40' : ''}>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={item.selected}
                                                        onCheckedChange={() => toggleItem(idx)}
                                                    />
                                                </TableCell>
                                                <TableCell className="font-medium">{item.item_name}</TableCell>
                                                <TableCell>{orig.category?.name ?? '-'}</TableCell>
                                                <TableCell>{orig.department?.name ?? '-'}</TableCell>
                                                <TableCell className="text-center">{orig.original_quantity}</TableCell>
                                                <TableCell className="text-center">{orig.realized_quantity}</TableCell>
                                                <TableCell className="text-center">
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        max={orig.remaining_quantity}
                                                        value={item.quantity}
                                                        onChange={(e) => updateItemQty(idx, parseInt(e.target.value) || 1)}
                                                        className="w-20 mx-auto text-center"
                                                        disabled={!item.selected}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right">{fmtCurrency(item.estimated_unit_cost)}</TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {fmtCurrency(item.quantity * item.estimated_unit_cost)}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="outline">{priorityLabel[item.priority]}</Badge>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {items.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={10} className="py-8 text-center text-muted-foreground">
                                                Tidak ada item yang bisa di-rollover
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            {errors.items && <p className="mt-2 text-sm text-red-500">{errors.items}</p>}
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex justify-end space-x-4">
                        <Button type="button" variant="outline" onClick={() => window.history.back()}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing || selectedItems.length === 0}>
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Memproses...' : `Rollover ${selectedItems.length} Item`}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
