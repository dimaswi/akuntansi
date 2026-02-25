import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableAccountSelect } from '@/components/ui/searchable-account-select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Landmark, Save } from 'lucide-react';
import { toast } from '@/lib/toast';
import { route } from 'ziggy-js';

interface Account {
    id: number;
    kode_akun: string;
    nama_akun: string;
}

interface Props extends SharedData {
    accounts: Account[];
    generatedCode: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: <Landmark className="h-4 w-4" />, href: route('aset.dashboard') },
    { title: 'Kategori Aset', href: route('aset.categories.index') },
    { title: 'Tambah Kategori', href: '#' },
];

export default function CreateCategory() {
    const { accounts, generatedCode } = usePage<Props>().props;

    const { data, setData, post, processing, errors } = useForm({
        code: generatedCode,
        name: '',
        description: '',
        default_useful_life_years: 5,
        default_depreciation_method: 'straight_line' as string,
        default_salvage_percentage: 0,
        account_asset_id: '' as string,
        account_depreciation_id: '' as string,
        account_expense_id: '' as string,
        is_active: true as boolean,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('aset.categories.store'), {
            onError: () => toast.error('Gagal menambahkan kategori aset'),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Kategori Aset" />

            <div className="space-y-6 p-4">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div>
                                    <Button type="button" variant="outline" onClick={() => window.history.back()} className="flex items-center gap-2">
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div>
                                    <CardTitle>Informasi Kategori Aset</CardTitle>
                                    <CardDescription>Isi informasi lengkap kategori aset yang akan ditambahkan</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="code">
                                        Kode <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="code"
                                        value={data.code}
                                        onChange={(e) => setData('code', e.target.value)}
                                        placeholder="KAT-001"
                                        className={errors.code ? 'border-red-500' : ''}
                                    />
                                    {errors.code && <p className="text-sm text-red-500">{errors.code}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="name">
                                        Nama Kategori <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Kendaraan"
                                        className={errors.name ? 'border-red-500' : ''}
                                    />
                                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Deskripsi</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Deskripsi kategori (opsional)"
                                    rows={2}
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="default_useful_life_years">
                                        Masa Manfaat (Tahun) <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="default_useful_life_years"
                                        type="number"
                                        min={1}
                                        max={100}
                                        value={data.default_useful_life_years}
                                        onChange={(e) => setData('default_useful_life_years', parseInt(e.target.value) || 5)}
                                        className={errors.default_useful_life_years ? 'border-red-500' : ''}
                                    />
                                    {errors.default_useful_life_years && <p className="text-sm text-red-500">{errors.default_useful_life_years}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="default_depreciation_method">
                                        Metode Penyusutan <span className="text-red-500">*</span>
                                    </Label>
                                    <Select value={data.default_depreciation_method} onValueChange={(v) => setData('default_depreciation_method', v)}>
                                        <SelectTrigger className={errors.default_depreciation_method ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Pilih metode" />
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
                                    {errors.default_depreciation_method && <p className="text-sm text-red-500">{errors.default_depreciation_method}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="default_salvage_percentage">Nilai Residu (%)</Label>
                                    <Input
                                        id="default_salvage_percentage"
                                        type="number"
                                        min={0}
                                        max={100}
                                        step={0.01}
                                        value={data.default_salvage_percentage}
                                        onChange={(e) => setData('default_salvage_percentage', parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div>
                                <CardTitle>Pengaturan Akun</CardTitle>
                                <CardDescription>Tentukan akun-akun yang terkait dengan kategori ini</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label>Akun Aset Tetap</Label>
                                    <SearchableAccountSelect
                                        accounts={accounts}
                                        value={data.account_asset_id}
                                        onValueChange={(value) => setData('account_asset_id', value)}
                                        placeholder="Pilih akun aset..."
                                        error={errors.account_asset_id}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Akun Akumulasi Penyusutan</Label>
                                    <SearchableAccountSelect
                                        accounts={accounts}
                                        value={data.account_depreciation_id}
                                        onValueChange={(value) => setData('account_depreciation_id', value)}
                                        placeholder="Pilih akun akumulasi..."
                                        error={errors.account_depreciation_id}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Akun Beban Penyusutan</Label>
                                    <SearchableAccountSelect
                                        accounts={accounts}
                                        value={data.account_expense_id}
                                        onValueChange={(value) => setData('account_expense_id', value)}
                                        placeholder="Pilih akun beban..."
                                        error={errors.account_expense_id}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="is_active"
                                    checked={data.is_active}
                                    onCheckedChange={(checked) => setData('is_active', checked as boolean)}
                                />
                                <Label htmlFor="is_active">Kategori Aktif</Label>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end space-x-4">
                        <Button type="button" variant="outline" onClick={() => router.visit(route('aset.categories.index'))}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
