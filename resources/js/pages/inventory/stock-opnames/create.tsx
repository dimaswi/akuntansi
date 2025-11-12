import { Head, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { SharedData } from '@/types';
import { FileBarChart, Save, X } from 'lucide-react';
import { toast } from 'sonner';

interface Department {
    id: number;
    name: string;
}

interface Props extends SharedData {
    departments: Department[];
    isLogistics: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: <FileBarChart className="h-4 w-4" />, href: '/stock-opnames' },
    { title: "Stock Opname", href: '/stock-opnames' },
    { title: "Buat Baru", href: '#' },
];

export default function StockOpnameCreate() {
    const { departments, isLogistics } = usePage<Props>().props;

    const { data, setData, post, processing, errors } = useForm({
        department_id: departments.length === 1 ? departments[0].id.toString() : '',
        opname_date: new Date().toISOString().split('T')[0],
        notes: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        post(route('stock-opnames.store'), {
            onSuccess: () => {
                toast.success('Stock Opname berhasil dibuat');
            },
            onError: (errors) => {
                if (errors.message) {
                    toast.error(errors.message);
                } else {
                    toast.error('Gagal membuat Stock Opname');
                }
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Buat Stock Opname" />

            <Card className="mt-4">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileBarChart className="h-5 w-5" />
                        Buat Stock Opname Baru
                    </CardTitle>
                    <CardDescription>
                        Stock Opname akan memuat semua item yang ada di department stock untuk dihitung fisiknya
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Department */}
                            <div className="space-y-2">
                                <Label htmlFor="department_id">
                                    Department <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={data.department_id}
                                    onValueChange={(value) => setData('department_id', value)}
                                    disabled={!isLogistics}
                                >
                                    <SelectTrigger id="department_id">
                                        <SelectValue placeholder="Pilih Department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {departments.map((dept) => (
                                            <SelectItem key={dept.id} value={dept.id.toString()}>
                                                {dept.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.department_id && (
                                    <p className="text-sm text-red-500">{errors.department_id}</p>
                                )}
                                {!isLogistics && (
                                    <p className="text-xs text-muted-foreground">
                                        Department Anda: {departments[0]?.name}
                                    </p>
                                )}
                            </div>

                            {/* Opname Date */}
                            <div className="space-y-2">
                                <Label htmlFor="opname_date">
                                    Tanggal Opname <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="opname_date"
                                    type="date"
                                    value={data.opname_date}
                                    onChange={(e) => setData('opname_date', e.target.value)}
                                />
                                {errors.opname_date && (
                                    <p className="text-sm text-red-500">{errors.opname_date}</p>
                                )}
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label htmlFor="notes">Catatan</Label>
                            <Textarea
                                id="notes"
                                placeholder="Catatan untuk stock opname ini..."
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                rows={4}
                            />
                            {errors.notes && (
                                <p className="text-sm text-red-500">{errors.notes}</p>
                            )}
                        </div>

                        {/* Info Alert */}
                        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                            <div className="flex gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                    <FileBarChart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                                        Informasi Stock Opname
                                    </h3>
                                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                                        <li>Sistem akan memuat semua item yang ada di department stock</li>
                                        <li>Anda perlu mengisi <strong>physical count</strong> untuk setiap item</li>
                                        <li>Sistem akan otomatis menghitung <strong>variance</strong> (selisih)</li>
                                        <li>Setelah approved, adjustment akan dibuat untuk variance</li>
                                        <li>Stock Opname <strong>wajib</strong> setiap bulan sebelum bisa request/transfer</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.visit(route('stock-opnames.index'))}
                            >
                                <X className="h-4 w-4 mr-2" />
                                Batal
                            </Button>
                            <Button type="submit" disabled={processing}>
                                <Save className="h-4 w-4 mr-2" />
                                {processing ? 'Menyimpan...' : 'Buat Stock Opname'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
