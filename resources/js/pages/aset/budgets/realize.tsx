import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Landmark, Save, ShoppingCart } from 'lucide-react';
import { toast } from '@/lib/toast';
import { route } from 'ziggy-js';

interface Category {
    id: number;
    code: string;
    name: string;
    default_useful_life_years: number;
    default_depreciation_method: string;
    default_salvage_percentage: number;
}
interface Dept { id: number; name: string }
interface Supplier { id: number; name: string }

interface BudgetItem {
    id: number;
    item_name: string;
    description?: string;
    quantity: number;
    estimated_unit_cost: number;
    estimated_total_cost: number;
    realized_quantity: number;
    realized_amount: number;
    priority: string;
    status: string;
    category_id?: number;
    department_id?: number;
    category?: { id: number; name: string };
    department?: { id: number; name: string };
    budget?: { id: number; code: string; fiscal_year: number; title: string };
}

interface Props extends SharedData {
    budgetItem: BudgetItem;
    remainingQty: number;
    categories: Category[];
    departments: Dept[];
    suppliers: Supplier[];
    generatedAssetCode: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: <Landmark className="h-4 w-4" />, href: route('aset.dashboard') },
    { title: 'RAB Aset', href: route('aset.budgets.index') },
    { title: 'Realisasi', href: '#' },
];

const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

export default function RealizeBudgetItem() {
    const { budgetItem, remainingQty, categories, departments, suppliers, generatedAssetCode } = usePage<Props>().props;

    const initialCat = budgetItem.category_id
        ? categories.find((c) => c.id === budgetItem.category_id)
        : undefined;
    const initialCost = parseFloat(String(budgetItem.estimated_unit_cost));

    const { data, setData, post, processing, errors } = useForm<{
        quantity: number;
        actual_cost: number;
        realization_date: string;
        notes: string;
        create_asset: boolean;
        asset_code: string;
        asset_name: string;
        asset_category_id: string;
        asset_department_id: string;
        asset_supplier_id: string;
        asset_location: string;
        asset_brand: string;
        asset_model: string;
        asset_serial_number: string;
        asset_useful_life_months: number;
        asset_salvage_value: number;
        asset_depreciation_method: string;
        asset_condition: string;
    }>({
        quantity: 1,
        actual_cost: initialCost,
        realization_date: new Date().toISOString().split('T')[0],
        notes: '',
        create_asset: true,
        asset_code: generatedAssetCode,
        asset_name: budgetItem.item_name,
        asset_category_id: budgetItem.category_id?.toString() ?? '',
        asset_department_id: budgetItem.department_id?.toString() ?? '',
        asset_supplier_id: '',
        asset_location: '',
        asset_brand: '',
        asset_model: '',
        asset_serial_number: '',
        asset_useful_life_months: initialCat ? initialCat.default_useful_life_years * 12 : 60,
        asset_salvage_value: initialCat && initialCost ? Math.round(initialCost * initialCat.default_salvage_percentage / 100) : 0,
        asset_depreciation_method: initialCat?.default_depreciation_method ?? 'straight_line',
        asset_condition: 'good',
    });

    const handleCategoryChange = (catId: string) => {
        const cat = categories.find((c) => c.id === parseInt(catId));
        setData((prev) => ({
            ...prev,
            asset_category_id: catId,
            asset_useful_life_months: cat ? cat.default_useful_life_years * 12 : prev.asset_useful_life_months,
            asset_depreciation_method: cat?.default_depreciation_method ?? prev.asset_depreciation_method,
            asset_salvage_value: cat && prev.actual_cost ? Math.round(prev.actual_cost * cat.default_salvage_percentage / 100) : prev.asset_salvage_value,
        }));
    };

    const handleActualCostChange = (cost: number) => {
        setData((prev) => {
            const cat = categories.find((c) => c.id === parseInt(prev.asset_category_id));
            return {
                ...prev,
                actual_cost: cost,
                asset_salvage_value: cat ? Math.round(cost * cat.default_salvage_percentage / 100) : prev.asset_salvage_value,
            };
        });
    };

    const selectedCategory = categories.find((c) => c.id === parseInt(data.asset_category_id));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('aset.budgets.realize.store', budgetItem.id), {
            onError: () => toast.error('Gagal melakukan realisasi'),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Realisasi RAB" />
            <div className="space-y-6 p-4">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Info Item RAB */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Button type="button" variant="outline" onClick={() => window.history.back()}>
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <ShoppingCart className="h-5 w-5" />
                                        Realisasi Item RAB
                                    </CardTitle>
                                    <CardDescription>
                                        {budgetItem.budget?.code} — {budgetItem.budget?.title}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-lg border bg-blue-50 p-4">
                                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Nama Barang</p>
                                        <p className="font-semibold">{budgetItem.item_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Qty Dibutuhkan</p>
                                        <p className="font-semibold">{budgetItem.quantity} unit</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Sudah Terealisasi</p>
                                        <p className="font-semibold">{budgetItem.realized_quantity} unit</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Sisa</p>
                                        <p className="font-semibold text-orange-600">{remainingQty} unit</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Estimasi Harga Satuan</p>
                                        <p className="font-semibold">{fmtCurrency(budgetItem.estimated_unit_cost)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Kategori</p>
                                        <p className="font-semibold">{budgetItem.category?.name ?? '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Departemen</p>
                                        <p className="font-semibold">{budgetItem.department?.name ?? '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Prioritas</p>
                                        <Badge variant="outline">{budgetItem.priority === 'high' ? 'Tinggi' : budgetItem.priority === 'medium' ? 'Sedang' : 'Rendah'}</Badge>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Realization Data */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Data Realisasi</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label>Jumlah Realisasi <span className="text-red-500">*</span></Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={remainingQty}
                                        value={data.quantity}
                                        onChange={(e) => setData('quantity', parseInt(e.target.value) || 1)}
                                        className={errors.quantity ? 'border-red-500' : ''}
                                    />
                                    <p className="text-xs text-muted-foreground">Maks: {remainingQty} unit</p>
                                    {errors.quantity && <p className="text-sm text-red-500">{errors.quantity}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>Biaya Aktual <span className="text-red-500">*</span></Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={data.actual_cost}
                                        onChange={(e) => handleActualCostChange(parseFloat(e.target.value) || 0)}
                                        className={errors.actual_cost ? 'border-red-500' : ''}
                                    />
                                    {errors.actual_cost && <p className="text-sm text-red-500">{errors.actual_cost}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>Tanggal Realisasi <span className="text-red-500">*</span></Label>
                                    <Input
                                        type="date"
                                        value={data.realization_date}
                                        onChange={(e) => setData('realization_date', e.target.value)}
                                        className={errors.realization_date ? 'border-red-500' : ''}
                                    />
                                    {errors.realization_date && <p className="text-sm text-red-500">{errors.realization_date}</p>}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Catatan Realisasi</Label>
                                <Textarea
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows={2}
                                    placeholder="Catatan opsional..."
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Create Asset Toggle */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Buat Aset Baru</CardTitle>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        checked={data.create_asset}
                                        onCheckedChange={(v) => setData('create_asset', !!v)}
                                    />
                                    <Label className="cursor-pointer" onClick={() => setData('create_asset', !data.create_asset)}>
                                        Otomatis buat aset dari realisasi ini
                                    </Label>
                                </div>
                            </div>
                        </CardHeader>
                        {data.create_asset && (
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label>Kode Aset <span className="text-red-500">*</span></Label>
                                        <Input
                                            value={data.asset_code}
                                            onChange={(e) => setData('asset_code', e.target.value)}
                                            className={errors.asset_code ? 'border-red-500' : ''}
                                        />
                                        {errors.asset_code && <p className="text-sm text-red-500">{errors.asset_code}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Nama Aset <span className="text-red-500">*</span></Label>
                                        <Input
                                            value={data.asset_name}
                                            onChange={(e) => setData('asset_name', e.target.value)}
                                            className={errors.asset_name ? 'border-red-500' : ''}
                                        />
                                        {errors.asset_name && <p className="text-sm text-red-500">{errors.asset_name}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Kategori Aset <span className="text-red-500">*</span></Label>
                                        <Select value={data.asset_category_id} onValueChange={handleCategoryChange}>
                                            <SelectTrigger className={errors.asset_category_id ? 'border-red-500' : ''}>
                                                <SelectValue placeholder="Pilih kategori" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.map((c) => (
                                                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.asset_category_id && <p className="text-sm text-red-500">{errors.asset_category_id}</p>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label>Departemen</Label>
                                        <Select value={data.asset_department_id} onValueChange={(v) => setData('asset_department_id', v)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih departemen" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {departments.map((d) => (
                                                    <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Supplier</Label>
                                        <Select value={data.asset_supplier_id} onValueChange={(v) => setData('asset_supplier_id', v)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih supplier" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {suppliers.map((s) => (
                                                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Lokasi</Label>
                                        <Input
                                            value={data.asset_location}
                                            onChange={(e) => setData('asset_location', e.target.value)}
                                            placeholder="Lokasi aset"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                                    <div className="space-y-2">
                                        <Label>Merk</Label>
                                        <Input
                                            value={data.asset_brand}
                                            onChange={(e) => setData('asset_brand', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Model</Label>
                                        <Input
                                            value={data.asset_model}
                                            onChange={(e) => setData('asset_model', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Nomor Seri</Label>
                                        <Input
                                            value={data.asset_serial_number}
                                            onChange={(e) => setData('asset_serial_number', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Kondisi</Label>
                                        <Select value={data.asset_condition} onValueChange={(v) => setData('asset_condition', v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="excellent">Sangat Baik</SelectItem>
                                                <SelectItem value="good">Baik</SelectItem>
                                                <SelectItem value="fair">Cukup</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label>Masa Manfaat (bulan) <span className="text-red-500">*</span></Label>
                                        <Input
                                            type="number"
                                            min={1}
                                            value={data.asset_useful_life_months}
                                            onChange={(e) => setData('asset_useful_life_months', parseInt(e.target.value) || 60)}
                                            className={errors.asset_useful_life_months ? 'border-red-500' : ''}
                                        />
                                        <p className="text-xs text-muted-foreground">{Math.floor(data.asset_useful_life_months / 12)} tahun {data.asset_useful_life_months % 12} bulan</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Nilai Residu <span className="text-red-500">*</span></Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={data.asset_salvage_value}
                                            onChange={(e) => setData('asset_salvage_value', parseFloat(e.target.value) || 0)}
                                            className={errors.asset_salvage_value ? 'border-red-500' : ''}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Metode Penyusutan <span className="text-red-500">*</span></Label>
                                        <Select value={data.asset_depreciation_method} onValueChange={(v) => setData('asset_depreciation_method', v)}>
                                            <SelectTrigger className={errors.asset_depreciation_method ? 'border-red-500' : ''}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="straight_line">Garis Lurus</SelectItem>
                                                <SelectItem value="declining_balance">Saldo Menurun</SelectItem>
                                                <SelectItem value="double_declining">Saldo Menurun Ganda</SelectItem>
                                                <SelectItem value="sum_of_years_digits">Jumlah Angka Tahun</SelectItem>
                                                <SelectItem value="service_hours">Satuan Jam Kerja</SelectItem>
                                                <SelectItem value="productive_output">Satuan Hasil Produksi</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        )}
                    </Card>

                    {/* Actions */}
                    <div className="flex justify-end space-x-4">
                        <Button type="button" variant="outline" onClick={() => window.history.back()}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Memproses...' : 'Simpan Realisasi'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
