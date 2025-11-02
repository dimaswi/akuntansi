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
    FileText,
    ChevronDown,
    ChevronRight
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
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

    const toggleRow = (id: number) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

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

    const getJenisColor = (jenis: string) => {
        const colors: Record<string, { bg: string; text: string; border: string }> = {
            'aset': { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-700' },
            'kewajiban': { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300', border: 'border-red-200 dark:border-red-700' },
            'ekuitas': { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-700' },
            'pendapatan': { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-700' },
            'beban': { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-700' },
        };
        return colors[jenis.toLowerCase()] || { bg: 'bg-gray-50 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-600' };
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
                        {/* Header - Compact Monochrome */}
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center space-x-4">
                                <div className="p-2.5 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg border border-gray-300 dark:border-gray-600">
                                    <FileText className="h-5 w-5 text-gray-700 dark:text-gray-300" strokeWidth={2} />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Buku Besar</h1>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        Saldo & mutasi akun periode {formatDate(periodeDari)} - {formatDate(periodeSampai)}
                                    </p>
                                </div>
                            </div>
                            <Button onClick={handleExport} variant="outline" size="sm" className="border-gray-300 dark:border-gray-600">
                                <Download className="h-3.5 w-3.5 mr-1.5" />
                                <span className="text-xs font-medium">Export</span>
                            </Button>
                        </div>

                        {/* Filters - Compact Monochrome */}
                        <Card className="mb-4 border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    <Filter className="h-4 w-4 mr-2 text-gray-600 dark:text-gray-400" />
                                    Filter
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                                    <div>
                                        <Label htmlFor="search" className="text-xs font-medium text-gray-700 dark:text-gray-300">Cari</Label>
                                        <div className="relative mt-1">
                                            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
                                            <Input
                                                id="search"
                                                type="text"
                                                placeholder="Kode/nama akun..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-8 h-8 text-xs border-gray-300 dark:border-gray-600"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="akun" className="text-xs font-medium text-gray-700 dark:text-gray-300">Akun</Label>
                                        <div className="mt-1">
                                            <SearchableAccountSelect
                                                accounts={semuaAkun}
                                                value={selectedAkun === 'all' ? '' : selectedAkun}
                                                onValueChange={(value) => setSelectedAkun(value || 'all')}
                                                placeholder="Semua"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="jenis" className="text-xs font-medium text-gray-700 dark:text-gray-300">Jenis</Label>
                                        <Select value={selectedJenis} onValueChange={setSelectedJenis}>
                                            <SelectTrigger className="h-8 text-xs mt-1 border-gray-300 dark:border-gray-600">
                                                <SelectValue placeholder="Semua" />
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
                                        <Label htmlFor="periode_dari" className="text-xs font-medium text-gray-700 dark:text-gray-300">Dari</Label>
                                        <Input
                                            id="periode_dari"
                                            type="date"
                                            value={periodeDari}
                                            onChange={(e) => setPeriodeDari(e.target.value)}
                                            className="h-8 text-xs mt-1 border-gray-300 dark:border-gray-600"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="periode_sampai" className="text-xs font-medium text-gray-700 dark:text-gray-300">Sampai</Label>
                                        <Input
                                            id="periode_sampai"
                                            type="date"
                                            value={periodeSampai}
                                            onChange={(e) => setPeriodeSampai(e.target.value)}
                                            className="h-8 text-xs mt-1 border-gray-300 dark:border-gray-600"
                                        />
                                    </div>
                                </div>

                                <div className="mt-3 flex justify-end">
                                    <Button onClick={handleFilter} size="sm" className="h-7 text-xs bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 dark:from-gray-600 dark:to-gray-700">
                                        <Filter className="h-3 w-3 mr-1.5" />
                                        Terapkan
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Summary Cards - Compact Monochrome */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg blur opacity-50 group-hover:opacity-75 transition"></div>
                                <Card className="relative border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                                                    Saldo Awal
                                                </p>
                                                <p className="text-lg font-bold text-gray-900 dark:text-gray-100 font-mono">{formatCurrency(totalSaldoAwal)}</p>
                                            </div>
                                            <div className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-md">
                                                <Calculator className="h-4 w-4 text-gray-600 dark:text-gray-400" strokeWidth={2} />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg blur opacity-50 group-hover:opacity-75 transition"></div>
                                <Card className="relative border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                                                    Mutasi Debet
                                                </p>
                                                <p className="text-lg font-bold text-gray-700 dark:text-gray-300 font-mono">{formatCurrency(totalMutasiDebet)}</p>
                                            </div>
                                            <div className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-md">
                                                <TrendingUp className="h-4 w-4 text-gray-600 dark:text-gray-400" strokeWidth={2} />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg blur opacity-50 group-hover:opacity-75 transition"></div>
                                <Card className="relative border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                                                    Mutasi Kredit
                                                </p>
                                                <p className="text-lg font-bold text-gray-700 dark:text-gray-300 font-mono">{formatCurrency(totalMutasiKredit)}</p>
                                            </div>
                                            <div className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-md">
                                                <TrendingDown className="h-4 w-4 text-gray-600 dark:text-gray-400" strokeWidth={2} />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg blur opacity-50 group-hover:opacity-75 transition"></div>
                                <Card className="relative border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                                                    Saldo Akhir
                                                </p>
                                                <p className="text-lg font-bold text-gray-900 dark:text-gray-100 font-mono">{formatCurrency(totalSaldoAkhir)}</p>
                                            </div>
                                            <div className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-md">
                                                <FileText className="h-4 w-4 text-gray-600 dark:text-gray-400" strokeWidth={2} />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Table - Compact Monochrome */}
                        <Card className="border-gray-200 dark:border-gray-700 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
                            <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                        Ringkasan {filteredBukuBesar.length} Akun
                                    </CardTitle>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                                        {formatDate(periodeDari)} - {formatDate(periodeSampai)}
                                    </p>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                                <TableHead className="w-[30px] text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider py-2"></TableHead>
                                                <TableHead className="w-[100px] text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider py-2">Kode</TableHead>
                                                <TableHead className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider py-2">Akun</TableHead>
                                                <TableHead className="w-[80px] text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider py-2">Jenis</TableHead>
                                                <TableHead className="text-right w-[110px] text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider py-2">Saldo Awal</TableHead>
                                                <TableHead className="text-right w-[110px] text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider py-2">Debet</TableHead>
                                                <TableHead className="text-right w-[110px] text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider py-2">Kredit</TableHead>
                                                <TableHead className="text-right w-[110px] text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider py-2">Saldo Akhir</TableHead>
                                                <TableHead className="w-[60px] text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider py-2"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredBukuBesar.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={8} className="text-center py-12">
                                                        <div className="flex flex-col items-center">
                                                            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg mb-3">
                                                                <FileText className="h-8 w-8 text-gray-400" strokeWidth={1.5} />
                                                            </div>
                                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tidak ada data</p>
                                                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Coba sesuaikan filter periode</p>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                filteredBukuBesar.map((item, index) => {
                                                    const isExpanded = expandedRows.has(item.akun.id);
                                                    const jenisColor = getJenisColor(item.akun.jenis_akun);
                                                    
                                                    return (
                                                        <React.Fragment key={item.akun.id}>
                                                            <TableRow 
                                                                className={`border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition cursor-pointer ${
                                                                    index % 2 === 0 ? 'bg-white dark:bg-gray-900/20' : 'bg-gray-50/50 dark:bg-gray-800/20'
                                                                }`}
                                                                onClick={() => item.transaksi.length > 0 && toggleRow(item.akun.id)}
                                                            >
                                                                <TableCell className="py-2.5">
                                                                    {item.transaksi.length > 0 && (
                                                                        isExpanded ? (
                                                                            <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                                                        ) : (
                                                                            <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                                                        )
                                                                    )}
                                                                </TableCell>
                                                                <TableCell className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300 py-2.5">
                                                                    {item.akun.kode_akun}
                                                                </TableCell>
                                                                <TableCell className="py-2.5">
                                                                    <div>
                                                                        <div className="text-xs font-medium text-gray-900 dark:text-gray-100">{item.akun.nama_akun}</div>
                                                                        {item.transaksi && item.transaksi.length > 0 && (
                                                                            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 flex items-center">
                                                                                <div className="h-1 w-1 rounded-full bg-gray-400 dark:bg-gray-500 mr-1.5"></div>
                                                                                {item.transaksi.length} transaksi
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="py-2.5">
                                                                    <Badge 
                                                                        className={`text-[10px] px-1.5 py-0 h-5 font-medium ${jenisColor.bg} ${jenisColor.text} border ${jenisColor.border}`}
                                                                    >
                                                                        {item.akun.jenis_akun?.charAt(0).toUpperCase() + item.akun.jenis_akun?.slice(1, 3)}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="text-right font-mono text-xs text-gray-700 dark:text-gray-300 py-2.5">
                                                                    {formatCurrency(item.saldo_awal)}
                                                                </TableCell>
                                                                <TableCell className="text-right font-mono text-xs text-gray-600 dark:text-gray-400 py-2.5">
                                                                    {formatCurrency(item.mutasi_debet)}
                                                                </TableCell>
                                                                <TableCell className="text-right font-mono text-xs text-gray-600 dark:text-gray-400 py-2.5">
                                                                    {formatCurrency(item.mutasi_kredit)}
                                                                </TableCell>
                                                                <TableCell className="text-right font-mono text-xs font-semibold text-gray-900 dark:text-gray-100 py-2.5">
                                                                    {formatCurrency(item.saldo_akhir)}
                                                                </TableCell>
                                                                <TableCell className="py-2.5">
                                                                    <Button
                                                                        asChild
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
                                                                    >
                                                                        <Link href={route('akuntansi.buku-besar.show', item.akun.id)}>
                                                                            <Eye className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                                                                        </Link>
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>

                                                            {/* Expandable Row - Detail Transaksi */}
                                                            {isExpanded && item.transaksi.length > 0 && (
                                                                <TableRow>
                                                                    <TableCell colSpan={9} className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-0 border-l-4 border-gray-400 dark:border-gray-600">
                                                                        <div className="px-4 py-3">
                                                                            <div className="mb-2 flex items-center justify-between">
                                                                                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Detail Transaksi</span>
                                                                                <Badge variant="outline" className="text-xs">
                                                                                    {item.transaksi.length} transaksi
                                                                                </Badge>
                                                                            </div>
                                                                            <div className="overflow-x-auto">
                                                                                <table className="w-full text-xs">
                                                                                    <thead>
                                                                                        <tr className="border-b border-gray-300 dark:border-gray-700">
                                                                                            <th className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">Tanggal</th>
                                                                                            <th className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">Keterangan</th>
                                                                                            <th className="text-right py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">Debit</th>
                                                                                            <th className="text-right py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">Kredit</th>
                                                                                            <th className="text-right py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">Saldo</th>
                                                                                        </tr>
                                                                                    </thead>
                                                                                    <tbody>
                                                                                        {item.transaksi.map((trx: any, trxIndex: number) => (
                                                                                            <tr 
                                                                                                key={trxIndex}
                                                                                                className={`border-b border-gray-200 dark:border-gray-700/50 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors ${
                                                                                                    trxIndex % 2 === 0 ? 'bg-white/30 dark:bg-black/10' : ''
                                                                                                }`}
                                                                                            >
                                                                                                <td className="py-2 px-2 text-gray-700 dark:text-gray-300">{formatDate(trx.tanggal)}</td>
                                                                                                <td className="py-2 px-2 text-gray-700 dark:text-gray-300 max-w-xs truncate" title={trx.keterangan}>{trx.keterangan}</td>
                                                                                                <td className={`py-2 px-2 text-right font-mono ${
                                                                                                    trx.debet > 0 ? 'text-gray-900 dark:text-gray-100 font-semibold' : 'text-gray-400 dark:text-gray-600'
                                                                                                }`}>
                                                                                                    {trx.debet > 0 ? formatCurrency(trx.debet) : '-'}
                                                                                                </td>
                                                                                                <td className={`py-2 px-2 text-right font-mono ${
                                                                                                    trx.kredit > 0 ? 'text-gray-900 dark:text-gray-100 font-semibold' : 'text-gray-400 dark:text-gray-600'
                                                                                                }`}>
                                                                                                    {trx.kredit > 0 ? formatCurrency(trx.kredit) : '-'}
                                                                                                </td>
                                                                                                <td className="py-2 px-2 text-right font-mono font-bold text-gray-900 dark:text-gray-100">
                                                                                                    {formatCurrency(trx.saldo)}
                                                                                                </td>
                                                                                            </tr>
                                                                                        ))}
                                                                                    </tbody>
                                                                                </table>
                                                                            </div>
                                                                        </div>
                                                                    </TableCell>
                                                                </TableRow>
                                                            )}
                                                        </React.Fragment>
                                                    );
                                                })
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
