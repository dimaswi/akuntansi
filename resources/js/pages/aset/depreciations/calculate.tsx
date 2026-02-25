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
import { AlertTriangle, ArrowLeft, Calculator, Landmark } from 'lucide-react';
import { toast } from '@/lib/toast';
import { useState } from 'react';
import { route } from 'ziggy-js';

interface EligibleAsset {
    id: number;
    code: string;
    name: string;
    category?: string;
    acquisition_cost: number;
    current_book_value: number;
    salvage_value: number;
    depreciation_method: string;
    monthly_depreciation: number;
    remaining_life_months: number;
    depreciation_percentage: number;
    is_fully_depreciated: boolean;
    is_usage_based: boolean;
    estimated_service_hours?: number;
    estimated_total_production?: number;
    missed_months: number;
    last_depreciation_date?: string;
}

interface Props extends SharedData {
    eligibleAssets: EligibleAsset[];
    defaultPeriod: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: <Landmark className="h-4 w-4" />, href: route('aset.dashboard') },
    { title: 'Penyusutan', href: route('aset.depreciations.index') },
    { title: 'Hitung Penyusutan', href: '#' },
];

const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
const methodMap: Record<string, string> = { straight_line: 'Garis Lurus', declining_balance: 'Saldo Menurun', double_declining: 'Saldo Menurun Ganda', sum_of_years_digits: 'Jumlah Angka Tahun', service_hours: 'Satuan Jam Kerja', productive_output: 'Satuan Hasil Produksi' };

export default function CalculateDepreciation() {
    const { eligibleAssets, defaultPeriod } = usePage<Props>().props;
    const [selectedIds, setSelectedIds] = useState<number[]>(eligibleAssets.filter((a) => !a.is_fully_depreciated).map((a) => a.id));
    const [usageData, setUsageData] = useState<Record<number, number>>({});

    const { data, setData, post, processing } = useForm({
        period_date: defaultPeriod,
        asset_ids: selectedIds,
        usage_data: {} as Record<number, number>,
        notes: '',
    });

    const updateUsage = (assetId: number, value: string) => {
        const num = parseFloat(value) || 0;
        const next = { ...usageData, [assetId]: num };
        setUsageData(next);
        setData('usage_data', next);
    };

    const toggleAll = (checked: boolean) => {
        const ids = checked ? eligibleAssets.filter((a) => !a.is_fully_depreciated).map((a) => a.id) : [];
        setSelectedIds(ids);
        setData('asset_ids', ids);
    };

    const toggleOne = (id: number, checked: boolean) => {
        const next = checked ? [...selectedIds, id] : selectedIds.filter((i) => i !== id);
        setSelectedIds(next);
        setData('asset_ids', next);
    };

    const totalDepreciation = eligibleAssets
        .filter((a) => selectedIds.includes(a.id))
        .reduce((sum, a) => sum + a.monthly_depreciation * Math.max(a.missed_months, 1), 0);

    const assetsWithMissedMonths = eligibleAssets.filter((a) => selectedIds.includes(a.id) && a.missed_months > 1);
    const totalMissedPeriods = assetsWithMissedMonths.reduce((sum, a) => sum + a.missed_months, 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedIds.length === 0) {
            toast.error('Pilih minimal 1 aset');
            return;
        }
        post(route('aset.depreciations.run'), {
            onError: () => toast.error('Gagal menghitung penyusutan'),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Hitung Penyusutan" />

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
                                    <CardTitle>Hitung Penyusutan Bulanan</CardTitle>
                                    <CardDescription>Pilih aset yang akan dihitung penyusutannya dan tentukan periode</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="period_date">
                                        Periode Penyusutan <span className="text-red-500">*</span>
                                    </Label>
                                    <Input id="period_date" type="date" value={data.period_date} onChange={(e) => setData('period_date', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="notes">Catatan</Label>
                                    <Textarea id="notes" value={data.notes} onChange={(e) => setData('notes', e.target.value)} rows={1} placeholder="Catatan opsional" />
                                </div>
                            </div>

                            <div className="rounded-lg border bg-orange-50 p-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm">Aset terpilih: <strong>{selectedIds.length}</strong> dari {eligibleAssets.length}</p>
                                    <p className="text-lg font-bold text-orange-600">Estimasi: {fmtCurrency(totalDepreciation)}</p>
                                </div>
                            </div>

                            {assetsWithMissedMonths.length > 0 && (
                                <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                                        <div className="text-sm">
                                            <p className="font-medium text-amber-800">
                                                {assetsWithMissedMonths.length} aset memiliki bulan penyusutan tertinggal ({totalMissedPeriods} periode total)
                                            </p>
                                            <p className="mt-1 text-amber-700">
                                                Sistem akan otomatis menghitung penyusutan untuk semua bulan yang terlewat hingga periode yang dipilih (catch-up).
                                                Setiap bulan dihitung secara urut dengan nilai yang benar sesuai metode penyusutan.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Daftar Aset</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-10">
                                            <Checkbox
                                                checked={selectedIds.length === eligibleAssets.filter((a) => !a.is_fully_depreciated).length}
                                                onCheckedChange={(v) => toggleAll(!!v)}
                                            />
                                        </TableHead>
                                        <TableHead>Kode</TableHead>
                                        <TableHead>Nama</TableHead>
                                        <TableHead>Kategori</TableHead>
                                        <TableHead>Metode</TableHead>
                                        <TableHead className="text-right">Nilai Perolehan</TableHead>
                                        <TableHead className="text-right">Nilai Buku</TableHead>
                                        <TableHead className="text-right">Penyusutan/bln</TableHead>
                                        <TableHead className="text-right">Pemakaian</TableHead>
                                        <TableHead className="text-center">Tertinggal</TableHead>
                                        <TableHead className="text-right">Sisa (bln)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {eligibleAssets.map((asset) => (
                                        <TableRow key={asset.id} className={asset.is_fully_depreciated ? 'opacity-50' : ''}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedIds.includes(asset.id)}
                                                    onCheckedChange={(v) => toggleOne(asset.id, !!v)}
                                                    disabled={asset.is_fully_depreciated}
                                                />
                                            </TableCell>
                                            <TableCell className="font-mono text-sm">{asset.code}</TableCell>
                                            <TableCell>{asset.name}</TableCell>
                                            <TableCell>{asset.category ?? '-'}</TableCell>
                                            <TableCell><Badge variant="outline" className="text-xs">{methodMap[asset.depreciation_method] ?? asset.depreciation_method}</Badge></TableCell>
                                            <TableCell className="text-right">{fmtCurrency(asset.acquisition_cost)}</TableCell>
                                            <TableCell className="text-right">{fmtCurrency(asset.current_book_value)}</TableCell>
                                            <TableCell className="text-right font-medium text-orange-600">{fmtCurrency(asset.monthly_depreciation)}</TableCell>
                                            <TableCell className="text-right">
                                                {asset.is_usage_based ? (
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        className="w-28 ml-auto text-right"
                                                        placeholder={asset.depreciation_method === 'service_hours' ? 'Jam' : 'Unit'}
                                                        value={usageData[asset.id] ?? ''}
                                                        onChange={(e) => updateUsage(asset.id, e.target.value)}
                                                    />
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {asset.missed_months > 1 ? (
                                                    <Badge variant="destructive" className="text-xs">
                                                        {asset.missed_months} bln
                                                    </Badge>
                                                ) : asset.missed_months === 1 ? (
                                                    <span className="text-muted-foreground text-xs">1 bln</span>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">{asset.remaining_life_months}</TableCell>
                                        </TableRow>
                                    ))}
                                    {eligibleAssets.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">Tidak ada aset yang eligible untuk penyusutan</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end space-x-4">
                        <Button type="button" variant="outline" onClick={() => router.visit(route('aset.depreciations.index'))}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing || selectedIds.length === 0}>
                            <Calculator className="mr-2 h-4 w-4" />
                            {processing ? 'Memproses...' : 'Jalankan Penyusutan'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
