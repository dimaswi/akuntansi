import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Edit3, Landmark } from 'lucide-react';
import { route } from 'ziggy-js';

interface Category { id: number; code: string; name: string }
interface Department { id: number; name: string }
interface Supplier { id: number; name: string }
interface Creator { id: number; name: string }

interface Depreciation {
    id: number;
    period_date: string;
    period_number: number;
    depreciation_amount: number;
    accumulated_depreciation: number;
    book_value: number;
    method: string;
}

interface Maintenance {
    id: number;
    maintenance_number: string;
    type: string;
    scheduled_date: string;
    status: string;
    cost: number;
}

interface Transfer {
    id: number;
    transfer_number: string;
    transfer_date: string;
    status: string;
    from_department: Department;
    to_department: Department;
}

interface Disposal {
    id: number;
    disposal_number: string;
    disposal_date: string;
    disposal_method: string;
    status: string;
    disposal_price: number;
    gain_loss: number;
}

interface Asset {
    id: number;
    code: string;
    name: string;
    description?: string;
    location?: string;
    brand?: string;
    model?: string;
    serial_number?: string;
    plate_number?: string;
    acquisition_date: string;
    acquisition_type: string;
    acquisition_cost: number;
    useful_life_months: number;
    salvage_value: number;
    depreciation_method: string;
    estimated_service_hours?: number;
    estimated_total_production?: number;
    current_book_value: number;
    accumulated_depreciation: number;
    depreciation_start_date: string;
    status: string;
    condition: string;
    warranty_expiry_date?: string;
    notes?: string;
    category?: Category;
    department?: Department;
    supplier?: Supplier;
    creator?: Creator;
    depreciations: Depreciation[];
    maintenances: Maintenance[];
    transfers: Transfer[];
    disposals: Disposal[];
}

interface Props extends SharedData {
    asset: Asset;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: <Landmark className="h-4 w-4" />, href: route('aset.dashboard') },
    { title: 'Daftar Aset', href: route('aset.assets.index') },
    { title: 'Detail', href: '#' },
];

const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    active: { label: 'Aktif', variant: 'default' },
    maintenance: { label: 'Maintenance', variant: 'outline' },
    disposed: { label: 'Disposed', variant: 'destructive' },
    inactive: { label: 'Nonaktif', variant: 'secondary' },
};

const conditionMap: Record<string, string> = { excellent: 'Sangat Baik', good: 'Baik', fair: 'Cukup', poor: 'Kurang', damaged: 'Rusak' };
const methodMap: Record<string, string> = { straight_line: 'Garis Lurus', declining_balance: 'Saldo Menurun', double_declining: 'Saldo Menurun Ganda', sum_of_years_digits: 'Jumlah Angka Tahun', service_hours: 'Satuan Jam Kerja', productive_output: 'Satuan Hasil Produksi' };
const acquisitionMap: Record<string, string> = { purchase: 'Pembelian', donation: 'Donasi', transfer_in: 'Transfer Masuk', leasing: 'Leasing', self_built: 'Bangun Sendiri' };

export default function ShowAsset() {
    const { asset } = usePage<Props>().props;
    const st = statusMap[asset.status];
    const depPercent = asset.acquisition_cost > 0 ? (asset.accumulated_depreciation / asset.acquisition_cost) * 100 : 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Aset ${asset.code}`} />

            <div className="p-4 sm:px-6 lg:px-8">
                {/* Header Info Card */}
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div>
                                <Button type="button" variant="outline" onClick={() => router.visit(route('aset.assets.index'))} className="flex items-center gap-2">
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-xl">{asset.code}  {asset.name}</CardTitle>
                                        <CardDescription>{asset.category?.name}  {asset.brand} {asset.model}</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={st?.variant}>{st?.label}</Badge>
                                        <Button variant="outline" onClick={() => router.visit(route('aset.assets.edit', asset.id))}>
                                            <Edit3 className="mr-2 h-4 w-4" />Edit
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Nilai Perolehan</p>
                                <p className="text-lg font-bold">{fmtCurrency(asset.acquisition_cost)}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Nilai Buku</p>
                                <p className="text-lg font-bold text-blue-600">{fmtCurrency(asset.current_book_value)}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Akum. Penyusutan</p>
                                <p className="text-lg font-bold text-orange-600">{fmtCurrency(asset.accumulated_depreciation)}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Penyusutan</p>
                                <Progress value={depPercent} className="mt-2" />
                                <p className="text-xs text-muted-foreground mt-1">{depPercent.toFixed(1)}%</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Detail Aset */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Detail Aset</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Departemen</p>
                                <p className="text-sm">{asset.department?.name ?? '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Lokasi</p>
                                <p className="text-sm">{asset.location ?? '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Kondisi</p>
                                <p className="text-sm">{conditionMap[asset.condition]}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Nomor Seri</p>
                                <p className="text-sm">{asset.serial_number ?? '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Nomor Plat</p>
                                <p className="text-sm">{asset.plate_number ?? '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Supplier</p>
                                <p className="text-sm">{asset.supplier?.name ?? '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Garansi s/d</p>
                                <p className="text-sm">{asset.warranty_expiry_date ? fmtDate(asset.warranty_expiry_date) : '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Dibuat Oleh</p>
                                <p className="text-sm">{asset.creator?.name ?? '-'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Informasi Penyusutan */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Informasi Penyusutan</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Tgl Perolehan</p>
                                <p className="text-sm">{fmtDate(asset.acquisition_date)}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Jenis Perolehan</p>
                                <p className="text-sm">{acquisitionMap[asset.acquisition_type]}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Metode</p>
                                <p className="text-sm">{methodMap[asset.depreciation_method]}</p>
                            </div>
                            {asset.estimated_service_hours && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Est. Total Jam Kerja</p>
                                    <p className="text-sm">{asset.estimated_service_hours.toLocaleString('id-ID')} jam</p>
                                </div>
                            )}
                            {asset.estimated_total_production && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Est. Total Hasil Produksi</p>
                                    <p className="text-sm">{asset.estimated_total_production.toLocaleString('id-ID')} unit</p>
                                </div>
                            )}
                            <div>
                                <p className="text-sm font-medium text-gray-500">Masa Manfaat</p>
                                <p className="text-sm">{Math.floor(asset.useful_life_months / 12)} tahun {asset.useful_life_months % 12} bulan</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Nilai Residu</p>
                                <p className="text-sm">{fmtCurrency(asset.salvage_value)}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Mulai Penyusutan</p>
                                <p className="text-sm">{fmtDate(asset.depreciation_start_date)}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {asset.notes && (
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle className="text-base">Catatan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm whitespace-pre-wrap">{asset.notes}</p>
                        </CardContent>
                    </Card>
                )}

                {/* Depreciation History */}
                {asset.depreciations.length > 0 && (
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle className="text-base">Riwayat Penyusutan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">#</TableHead>
                                        <TableHead>Periode</TableHead>
                                        <TableHead className="text-right">Penyusutan</TableHead>
                                        <TableHead className="text-right">Akumulasi</TableHead>
                                        <TableHead className="text-right">Nilai Buku</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {asset.depreciations.map((d) => (
                                        <TableRow key={d.id}>
                                            <TableCell>{d.period_number}</TableCell>
                                            <TableCell>{fmtDate(d.period_date)}</TableCell>
                                            <TableCell className="text-right">{fmtCurrency(d.depreciation_amount)}</TableCell>
                                            <TableCell className="text-right">{fmtCurrency(d.accumulated_depreciation)}</TableCell>
                                            <TableCell className="text-right">{fmtCurrency(d.book_value)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}

                {/* Maintenance History */}
                {asset.maintenances.length > 0 && (
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle className="text-base">Riwayat Maintenance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nomor</TableHead>
                                        <TableHead>Tipe</TableHead>
                                        <TableHead>Tgl Jadwal</TableHead>
                                        <TableHead>Biaya</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {asset.maintenances.map((m) => (
                                        <TableRow key={m.id}>
                                            <TableCell className="font-mono text-sm">{m.maintenance_number}</TableCell>
                                            <TableCell className="capitalize">{m.type}</TableCell>
                                            <TableCell>{fmtDate(m.scheduled_date)}</TableCell>
                                            <TableCell>{fmtCurrency(m.cost)}</TableCell>
                                            <TableCell><Badge variant="secondary" className="capitalize">{m.status.replace('_', ' ')}</Badge></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}

                {/* Transfer History */}
                {asset.transfers.length > 0 && (
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle className="text-base">Riwayat Transfer</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nomor</TableHead>
                                        <TableHead>Dari</TableHead>
                                        <TableHead>Ke</TableHead>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {asset.transfers.map((t) => (
                                        <TableRow key={t.id}>
                                            <TableCell className="font-mono text-sm">{t.transfer_number}</TableCell>
                                            <TableCell>{t.from_department?.name}</TableCell>
                                            <TableCell>{t.to_department?.name}</TableCell>
                                            <TableCell>{fmtDate(t.transfer_date)}</TableCell>
                                            <TableCell><Badge variant="secondary" className="capitalize">{t.status}</Badge></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
