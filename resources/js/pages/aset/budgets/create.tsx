import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Landmark, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from '@/lib/toast';
import { route } from 'ziggy-js';

interface Category { id: number; name: string }
interface Dept { id: number; name: string }

interface Props extends SharedData {
    categories: Category[];
    departments: Dept[];
    generatedCode: string;
    defaultYear: number;
}

interface ItemRow {
    category_id: string;
    department_id: string;
    item_name: string;
    description: string;
    quantity: number;
    estimated_unit_cost: number;
    priority: string;
    notes: string;
}

const emptyItem = (): ItemRow => ({
    category_id: '',
    department_id: '',
    item_name: '',
    description: '',
    quantity: 1,
    estimated_unit_cost: 0,
    priority: 'medium',
    notes: '',
});

const breadcrumbs: BreadcrumbItem[] = [
    { title: <Landmark className="h-4 w-4" />, href: route('aset.dashboard') },
    { title: 'RAB Aset', href: route('aset.budgets.index') },
    { title: 'Buat RAB', href: '#' },
];

const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

export default function CreateBudget() {
    const { categories, departments, generatedCode, defaultYear } = usePage<Props>().props;

    const { data, setData, post, processing, errors } = useForm<{
        code: string;
        fiscal_year: number;
        title: string;
        description: string;
        items: any[];
    }>({
        code: generatedCode,
        fiscal_year: defaultYear,
        title: `RAB Aset Tahun ${defaultYear}`,
        description: '',
        items: [emptyItem()],
    });

    const items: ItemRow[] = data.items;

    const addItem = () => setData('items', [...data.items, emptyItem()]);

    const removeItem = (index: number) => {
        if (data.items.length === 1) return;
        setData('items', data.items.filter((_, i) => i !== index));
    };

    const updateItem = <K extends keyof ItemRow>(index: number, key: K, value: ItemRow[K]) => {
        const updated = [...data.items];
        updated[index] = { ...updated[index], [key]: value };
        setData('items', updated);
    };

    const totalBudget = data.items.reduce((sum, item) => sum + item.quantity * item.estimated_unit_cost, 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('aset.budgets.store'), {
            onError: () => toast.error('Gagal membuat RAB'),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Buat RAB Aset" />
            <div className="space-y-6 p-4">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Header */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Button type="button" variant="outline" onClick={() => window.history.back()}>
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                                <div>
                                    <CardTitle>Buat RAB Aset Baru</CardTitle>
                                    <CardDescription>Rencana Anggaran Belanja untuk pengadaan aset</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label>Kode RAB</Label>
                                    <Input value={data.code} readOnly className="bg-muted" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tahun Anggaran <span className="text-red-500">*</span></Label>
                                    <Input
                                        type="number"
                                        min={2020}
                                        max={2099}
                                        value={data.fiscal_year}
                                        onChange={(e) => {
                                            const y = parseInt(e.target.value);
                                            setData((prev) => ({ ...prev, fiscal_year: y, title: `RAB Aset Tahun ${y}` }));
                                        }}
                                        className={errors.fiscal_year ? 'border-red-500' : ''}
                                    />
                                    {errors.fiscal_year && <p className="text-sm text-red-500">{errors.fiscal_year}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>Judul <span className="text-red-500">*</span></Label>
                                    <Input
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        className={errors.title ? 'border-red-500' : ''}
                                    />
                                    {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Deskripsi</Label>
                                <Textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={2}
                                    placeholder="Keterangan RAB..."
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Items */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Daftar Item RAB</CardTitle>
                                    <CardDescription>Rincian barang/aset yang direncanakan</CardDescription>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">Total Anggaran</p>
                                    <p className="text-xl font-bold text-blue-600">{fmtCurrency(totalBudget)}</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-10">#</TableHead>
                                            <TableHead className="min-w-[200px]">Nama Barang *</TableHead>
                                            <TableHead className="min-w-[150px]">Kategori</TableHead>
                                            <TableHead className="min-w-[150px]">Departemen</TableHead>
                                            <TableHead className="w-20">Qty *</TableHead>
                                            <TableHead className="min-w-[150px]">Harga Satuan *</TableHead>
                                            <TableHead className="min-w-[120px]">Subtotal</TableHead>
                                            <TableHead className="w-28">Prioritas</TableHead>
                                            <TableHead className="w-10"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.items.map((item, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="text-center font-mono">{idx + 1}</TableCell>
                                                <TableCell>
                                                    <Input
                                                        value={item.item_name}
                                                        onChange={(e) => updateItem(idx, 'item_name', e.target.value)}
                                                        placeholder="Nama barang/aset"
                                                        className={(errors as any)[`items.${idx}.item_name`] ? 'border-red-500' : ''}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Select value={item.category_id} onValueChange={(v) => updateItem(idx, 'category_id', v)}>
                                                        <SelectTrigger><SelectValue placeholder="-" /></SelectTrigger>
                                                        <SelectContent>
                                                            {categories.map((c) => (
                                                                <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell>
                                                    <Select value={item.department_id} onValueChange={(v) => updateItem(idx, 'department_id', v)}>
                                                        <SelectTrigger><SelectValue placeholder="-" /></SelectTrigger>
                                                        <SelectContent>
                                                            {departments.map((d) => (
                                                                <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                                                        className="w-20"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        value={item.estimated_unit_cost}
                                                        onChange={(e) => updateItem(idx, 'estimated_unit_cost', parseFloat(e.target.value) || 0)}
                                                    />
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {fmtCurrency(item.quantity * item.estimated_unit_cost)}
                                                </TableCell>
                                                <TableCell>
                                                    <Select value={item.priority} onValueChange={(v) => updateItem(idx, 'priority', v)}>
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="high">Tinggi</SelectItem>
                                                            <SelectItem value="medium">Sedang</SelectItem>
                                                            <SelectItem value="low">Rendah</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeItem(idx)}
                                                        disabled={data.items.length === 1}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            <Button type="button" variant="outline" className="mt-4" onClick={addItem}>
                                <Plus className="mr-2 h-4 w-4" />
                                Tambah Item
                            </Button>
                            {errors.items && <p className="mt-2 text-sm text-red-500">{errors.items}</p>}
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex justify-end space-x-4">
                        <Button type="button" variant="outline" onClick={() => router.visit(route('aset.budgets.index'))}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Menyimpan...' : 'Simpan RAB'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
