import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableAccountSelect } from "@/components/ui/searchable-account-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
    Search, 
    Filter, 
    Download, 
    Eye, 
    Calculator,
    TrendingUp,
    TrendingDown,
    FileText
} from 'lucide-react';
import { Link } from '@inertiajs/react';

interface Akun {
    id: number;
    kode_akun: string;
    nama_akun: string;
    jenis_akun: string;
}

interface BukuBesarData {
    akun: Akun;
    saldo_awal: number;
    saldo_akhir: number;
    mutasi_debet: number;
    mutasi_kredit: number;
    transaksi: any[];
}

interface Props {
    bukuBesar: BukuBesarData[];
    semuaAkun: Akun[];
    filters: {
        daftar_akun_id?: number;
        periode_dari: string;
        periode_sampai: string;
        jenis_akun?: string;
    };
    jenisAkun: Record<string, string>;
}

export default function BukuBesarIndex({ bukuBesar, semuaAkun, filters, jenisAkun }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAkun, setSelectedAkun] = useState(filters.daftar_akun_id?.toString() || 'all');
    const [selectedJenis, setSelectedJenis] = useState(filters.jenis_akun || 'all');
    const [periodeDari, setPeriodeDari] = useState(filters.periode_dari);
    const [periodeSampai, setPeriodeSampai] = useState(filters.periode_sampai);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getJenisAkunBadge = (jenisAkun: string) => {
        const variants: Record<string, any> = {
            'aset': 'default',
            'kewajiban': 'destructive',
            'ekuitas': 'secondary',
            'pendapatan': 'success',
            'beban': 'warning'
        };
        
        return (
            <Badge variant={variants[jenisAkun] || 'outline'}>
                {jenisAkun?.charAt(0).toUpperCase() + jenisAkun?.slice(1)}
            </Badge>
        );
    };

    const filteredBukuBesar = bukuBesar.filter(item => {
        const matchSearch = searchTerm === '' || 
            item.akun.nama_akun.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.akun.kode_akun.toLowerCase().includes(searchTerm.toLowerCase());
        
        return matchSearch;
    });

    const handleFilter = () => {
        const params: any = {
            periode_dari: periodeDari,
            periode_sampai: periodeSampai,
        };

        if (selectedAkun !== 'all') {
            params.daftar_akun_id = selectedAkun;
        }

        if (selectedJenis !== 'all') {
            params.jenis_akun = selectedJenis;
        }

        router.get(route('akuntansi.buku-besar.index'), params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleExport = () => {
        // TODO: Implement export functionality
        console.log('Export buku besar');
    };

    const totalSaldoAwal = filteredBukuBesar.reduce((sum, item) => sum + item.saldo_awal, 0);
    const totalSaldoAkhir = filteredBukuBesar.reduce((sum, item) => sum + item.saldo_akhir, 0);
    const totalMutasiDebet = filteredBukuBesar.reduce((sum, item) => sum + item.mutasi_debet, 0);
    const totalMutasiKredit = filteredBukuBesar.reduce((sum, item) => sum + item.mutasi_kredit, 0);

    return (
        <AppLayout>
            <Head title="Buku Besar" />
            
            <div className="max-w-7xl p-4 sm:px-6 lg:px-8">
                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                    <div className="p-6 text-gray-900 dark:text-gray-100">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                            <div>
                                <h1 className="text-3xl font-bold mb-2">Buku Besar</h1>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Kelola dan lihat saldo serta mutasi akun
                                </p>
                            </div>
                            <div className="flex space-x-2 mt-4 sm:mt-0">
                                <Button onClick={handleExport} variant="outline">
                                    <Download className="h-4 w-4 mr-2" />
                                    Export
                                </Button>
                            </div>
                        </div>

                        {/* Filters */}
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Filter className="h-5 w-5 mr-2" />
                                    Filter & Pencarian
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                    <div>
                                        <Label htmlFor="search">Cari Akun</Label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                            <Input
                                                id="search"
                                                type="text"
                                                placeholder="Nama atau kode akun..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="akun">Akun Spesifik</Label>
                                        <SearchableAccountSelect
                                            accounts={semuaAkun}
                                            value={selectedAkun === 'all' ? '' : selectedAkun}
                                            onValueChange={(value) => setSelectedAkun(value || 'all')}
                                            placeholder="Semua Akun"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="jenis">Jenis Akun</Label>
                                        <Select value={selectedJenis} onValueChange={setSelectedJenis}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih jenis" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Semua Jenis</SelectItem>
                                                {Object.entries(jenisAkun).map(([key, value]) => (
                                                    <SelectItem key={key} value={key}>
                                                        {value}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label htmlFor="periode_dari">Periode Dari</Label>
                                        <Input
                                            id="periode_dari"
                                            type="date"
                                            value={periodeDari}
                                            onChange={(e) => setPeriodeDari(e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="periode_sampai">Periode Sampai</Label>
                                        <Input
                                            id="periode_sampai"
                                            type="date"
                                            value={periodeSampai}
                                            onChange={(e) => setPeriodeSampai(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 flex justify-end">
                                    <Button onClick={handleFilter}>
                                        <Filter className="h-4 w-4 mr-2" />
                                        Terapkan Filter
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                Total Saldo Awal
                                            </p>
                                            <p className="text-2xl font-bold">{formatCurrency(totalSaldoAwal)}</p>
                                        </div>
                                        <Calculator className="h-8 w-8 text-blue-500" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                Total Mutasi Debet
                                            </p>
                                            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalMutasiDebet)}</p>
                                        </div>
                                        <TrendingUp className="h-8 w-8 text-green-500" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                Total Mutasi Kredit
                                            </p>
                                            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalMutasiKredit)}</p>
                                        </div>
                                        <TrendingDown className="h-8 w-8 text-red-500" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                Total Saldo Akhir
                                            </p>
                                            <p className="text-2xl font-bold">{formatCurrency(totalSaldoAkhir)}</p>
                                        </div>
                                        <FileText className="h-8 w-8 text-purple-500" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Table */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Ringkasan Buku Besar</CardTitle>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Periode: {formatDate(periodeDari)} - {formatDate(periodeSampai)}
                                </p>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[120px]">Kode Akun</TableHead>
                                                <TableHead>Nama Akun</TableHead>
                                                <TableHead className="w-[100px]">Jenis</TableHead>
                                                <TableHead className="text-right w-[120px]">Saldo Awal</TableHead>
                                                <TableHead className="text-right w-[120px]">Mutasi Debet</TableHead>
                                                <TableHead className="text-right w-[120px]">Mutasi Kredit</TableHead>
                                                <TableHead className="text-right w-[120px]">Saldo Akhir</TableHead>
                                                <TableHead className="w-[80px]">Aksi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredBukuBesar.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={8} className="text-center py-8">
                                                        <div className="flex flex-col items-center">
                                                            <FileText className="h-12 w-12 text-gray-400 mb-2" />
                                                            <p className="text-gray-500">Tidak ada data buku besar</p>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                filteredBukuBesar.map((item) => (
                                                    <TableRow key={item.akun.id}>
                                                        <TableCell className="font-mono font-medium">
                                                            {item.akun.kode_akun}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div>
                                                                <div className="font-medium">{item.akun.nama_akun}</div>
                                                                <div className="text-sm text-gray-500">
                                                                    {item.transaksi.length} transaksi
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {getJenisAkunBadge(item.akun.jenis_akun)}
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono">
                                                            {formatCurrency(item.saldo_awal)}
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono text-green-600">
                                                            {formatCurrency(item.mutasi_debet)}
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono text-red-600">
                                                            {formatCurrency(item.mutasi_kredit)}
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono font-medium">
                                                            {formatCurrency(item.saldo_akhir)}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button
                                                                asChild
                                                                variant="ghost"
                                                                size="sm"
                                                            >
                                                                <Link href={route('akuntansi.buku-besar.show', item.akun.id)}>
                                                                    <Eye className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
