import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft, ClipboardList, Save } from 'lucide-react';
import { route } from 'ziggy-js';

interface Item {
    id: number;
    kode_barang: string;
    nama_barang: string;
    harga_beli: number;
    stok_pusat: number;
}

interface StockAdjustment {
    id: number;
    nomor_adjustment: string;
    tanggal_adjustment: string;
    tipe_adjustment: 'shortage' | 'overage';
    quantity: number;
    unit_price: number;
    total_amount: number;
    keterangan?: string;
    status: 'draft' | 'approved';
    item: Item;
}

interface Props extends SharedData {
    adjustment: StockAdjustment;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: <ClipboardList className="h-4 w-4" />, href: '#' },
    { title: 'Stock Adjustments', href: route('stock-adjustments.index') },
    { title: 'Edit', href: '#' },
];

export default function EditStockAdjustment({ adjustment }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        item_id: adjustment.item.id.toString(),
        tanggal_adjustment: adjustment.tanggal_adjustment,
        tipe_adjustment: adjustment.tipe_adjustment,
        quantity: adjustment.quantity.toString(),
        keterangan: adjustment.keterangan || '',
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const estimatedValue = adjustment.item && data.quantity
        ? adjustment.item.harga_beli * parseFloat(data.quantity)
        : 0;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('stock-adjustments.update', adjustment.id), {
            preserveState: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${adjustment.nomor_adjustment}`} />

            <div className="mt-4 space-y-4">
                {/* Back Button */}
                <Button
                    variant="outline"
                    onClick={() => router.visit(route('stock-adjustments.show', adjustment.id))}
                    className="gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Kembali ke Detail
                </Button>

                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ClipboardList className="h-5 w-5" />
                                Edit Stock Adjustment
                            </CardTitle>
                            <CardDescription>
                                Edit adjustment {adjustment.nomor_adjustment}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Item Info (Read-only) */}
                            <Card className="bg-gray-50">
                                <CardContent className="pt-6">
                                    <div className="space-y-2">
                                        <h4 className="font-semibold">Item (tidak bisa diubah):</h4>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-muted-foreground">Nama:</p>
                                                <p className="font-medium">{adjustment.item.nama_barang}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Kode:</p>
                                                <p className="font-medium">{adjustment.item.kode_barang}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Stok Pusat:</p>
                                                <p className="font-medium">{adjustment.item.stok_pusat}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Harga Beli:</p>
                                                <p className="font-medium">
                                                    {formatCurrency(adjustment.item.harga_beli)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                {/* Tanggal Adjustment */}
                                <div className="space-y-2">
                                    <Label htmlFor="tanggal_adjustment">
                                        Tanggal Adjustment <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="tanggal_adjustment"
                                        type="date"
                                        value={data.tanggal_adjustment}
                                        onChange={(e) => setData('tanggal_adjustment', e.target.value)}
                                        required
                                    />
                                    {errors.tanggal_adjustment && (
                                        <p className="text-sm text-red-500">{errors.tanggal_adjustment}</p>
                                    )}
                                </div>

                                {/* Tipe Adjustment */}
                                <div className="space-y-2">
                                    <Label htmlFor="tipe_adjustment">
                                        Tipe Adjustment <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={data.tipe_adjustment}
                                        onValueChange={(value) =>
                                            setData('tipe_adjustment', value as 'shortage' | 'overage')
                                        }
                                    >
                                        <SelectTrigger id="tipe_adjustment">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="shortage">
                                                Shortage (Kekurangan)
                                            </SelectItem>
                                            <SelectItem value="overage">Overage (Kelebihan)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.tipe_adjustment && (
                                        <p className="text-sm text-red-500">{errors.tipe_adjustment}</p>
                                    )}
                                </div>

                                {/* Quantity */}
                                <div className="space-y-2">
                                    <Label htmlFor="quantity">
                                        Quantity <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="quantity"
                                        type="number"
                                        min="1"
                                        value={data.quantity}
                                        onChange={(e) => setData('quantity', e.target.value)}
                                        placeholder="Jumlah selisih"
                                        required
                                    />
                                    {errors.quantity && (
                                        <p className="text-sm text-red-500">{errors.quantity}</p>
                                    )}
                                </div>

                                {/* Estimated Value */}
                                <div className="space-y-2">
                                    <Label>Estimasi Nilai</Label>
                                    <div className="flex h-10 w-full rounded-md border border-input bg-gray-50 px-3 py-2 text-sm">
                                        {formatCurrency(estimatedValue)}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Dihitung dari quantity × harga beli item
                                    </p>
                                </div>
                            </div>

                            {/* Keterangan */}
                            <div className="space-y-2">
                                <Label htmlFor="keterangan">Keterangan</Label>
                                <Textarea
                                    id="keterangan"
                                    value={data.keterangan}
                                    onChange={(e) => setData('keterangan', e.target.value)}
                                    placeholder="Catatan atau alasan adjustment (opsional)"
                                    rows={3}
                                />
                                {errors.keterangan && (
                                    <p className="text-sm text-red-500">{errors.keterangan}</p>
                                )}
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex justify-end gap-4 border-t pt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        router.visit(route('stock-adjustments.show', adjustment.id))
                                    }
                                    disabled={processing}
                                >
                                    Batal
                                </Button>
                                <Button type="submit" disabled={processing} className="gap-2">
                                    <Save className="h-4 w-4" />
                                    {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
