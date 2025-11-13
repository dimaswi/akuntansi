import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePermission } from '@/hooks/use-permission';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Banknote, Edit3, Eye, FileSpreadsheet, Filter, PlusCircle, Search, Send, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

interface User {
    id: number;
    name: string;
}

interface Journal {
    id: number;
    journal_number: string;
}

interface SalaryBatch {
    id: number;
    batch_number: string;
    period_month: number;
    period_year: number;
    period_display: string;
    description?: string;
    total_employees: number;
    total_pendapatan: number;
    total_potongan: number;
    total_gaji_bersih: number;
    status: 'draft' | 'posted';
    journal_id?: number;
    journal?: Journal;
    creator?: User;
    posted_by?: number;
    posted_at?: string;
    created_at: string;
    can_edit: boolean;
    can_post: boolean;
}

interface Props extends SharedData {
    batches: SalaryBatch[];
    filters: {
        search: string;
        status: string;
        period_year: string;
        period_month: string;
    };
    summary: {
        total_draft: number;
        total_posted: number;
        total_employees_all: number;
        total_gaji_bersih_posted: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: <Banknote className="h-4 w-4" />,
        href: '/penggajian',
    },
    {
        title: 'Penggajian',
        href: '/penggajian',
    },
];

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
};

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'draft':
            return (
                <Badge variant="outline" className="border-gray-300 text-gray-600">
                    Draft
                </Badge>
            );
        case 'posted':
            return (
                <Badge variant="outline" className="border-green-300 bg-green-50 text-green-600">
                    Posted
                </Badge>
            );
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
};

export default function Index({ batches, filters, summary }: Props) {
    const { hasPermission } = usePermission();
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; batch: SalaryBatch | null }>({
        open: false,
        batch: null,
    });
    const [deleting, setDeleting] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [yearFilter, setYearFilter] = useState(filters.period_year || 'all');
    const [monthFilter, setMonthFilter] = useState(filters.period_month || 'all');

    const handleDelete = () => {
        if (!deleteDialog.batch) return;

        setDeleting(true);
        router.delete(route('penggajian.destroy', deleteDialog.batch.id), {
            onSuccess: () => {
                toast.success('Batch gaji berhasil dihapus');
                setDeleteDialog({ open: false, batch: null });
            },
            onError: (errors) => {
                toast.error(errors[0] || 'Gagal menghapus batch gaji');
            },
            onFinish: () => setDeleting(false),
        });
    };

    const handlePostToJournal = (batchIds: number[]) => {
        router.get(route('penggajian.showPostToJournal'), { batch_ids: batchIds });
    };

    // Filter handler
    const applyFilters = () => {
        router.get(
            route('penggajian.index'),
            {
                search: searchQuery,
                status: statusFilter === 'all' ? '' : statusFilter,
                period_year: yearFilter === 'all' ? '' : yearFilter,
                period_month: monthFilter === 'all' ? '' : monthFilter,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const resetFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setYearFilter('all');
        setMonthFilter('all');
        router.get(route('penggajian.index'));
    };

    // Apply filters on Enter key
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === 'Enter' && showFilters) {
                applyFilters();
            }
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [searchQuery, statusFilter, yearFilter, monthFilter, showFilters]);

    const months = [
        { value: '1', label: 'Januari' },
        { value: '2', label: 'Februari' },
        { value: '3', label: 'Maret' },
        { value: '4', label: 'April' },
        { value: '5', label: 'Mei' },
        { value: '6', label: 'Juni' },
        { value: '7', label: 'Juli' },
        { value: '8', label: 'Agustus' },
        { value: '9', label: 'September' },
        { value: '10', label: 'Oktober' },
        { value: '11', label: 'November' },
        { value: '12', label: 'Desember' },
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Penggajian" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    {/* Filter & Table Card */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Daftar Batch Gaji</CardTitle>
                                    <CardDescription>Daftar batch penggajian karyawan per periode</CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                                        <Filter className="mr-2 h-4 w-4" />
                                        {showFilters ? 'Sembunyikan Filter' : 'Tampilkan Filter'}
                                    </Button>
                                    {hasPermission('penggajian.create') && (
                                        <Button variant="outline" size="sm" className='bg-black text-white' onClick={() => router.visit(route('penggajian.create'))}>
                                            <PlusCircle className="mr-2 h-4 w-4" />
                                            Buat Batch Baru
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* Filter Section */}
                            {showFilters && (
                                <div className="mb-6 space-y-4 rounded-lg bg-muted/50 p-4">
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="search">Pencarian</Label>
                                            <div className="relative">
                                                <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="search"
                                                    placeholder="Cari batch number..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="pl-8"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="status">Status</Label>
                                            <SearchableSelect
                                                value={statusFilter}
                                                onValueChange={setStatusFilter}
                                                options={[
                                                    { value: 'all', label: 'Semua Status' },
                                                    { value: 'draft', label: 'Draft' },
                                                    { value: 'posted', label: 'Posted' },
                                                ]}
                                                placeholder="Semua Status"
                                                searchPlaceholder="Cari status..."
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="year">Tahun</Label>
                                            <SearchableSelect
                                                value={yearFilter}
                                                onValueChange={setYearFilter}
                                                options={[
                                                    { value: 'all', label: 'Semua Tahun' },
                                                    ...years.map((year) => ({ value: year, label: year })),
                                                ]}
                                                placeholder="Semua Tahun"
                                                searchPlaceholder="Cari tahun..."
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="month">Bulan</Label>
                                            <SearchableSelect
                                                value={monthFilter}
                                                onValueChange={setMonthFilter}
                                                options={[
                                                    { value: 'all', label: 'Semua Bulan' },
                                                    ...months,
                                                ]}
                                                placeholder="Semua Bulan"
                                                searchPlaceholder="Cari bulan..."
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button onClick={applyFilters} size="sm">
                                            <Search className="mr-2 h-4 w-4" />
                                            Cari
                                        </Button>
                                        <Button onClick={resetFilters} variant="outline" size="sm">
                                            <X className="mr-2 h-4 w-4" />
                                            Reset
                                        </Button>
                                    </div>
                                </div>
                            )}
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[140px]">Batch Number</TableHead>
                                            <TableHead className="w-[140px]">Periode</TableHead>
                                            <TableHead>Keterangan</TableHead>
                                            <TableHead className="w-[100px] text-center">Karyawan</TableHead>
                                            <TableHead className="w-[160px] text-right">Total Gaji Bersih</TableHead>
                                            <TableHead className="w-[100px] text-center">Status</TableHead>
                                            <TableHead className="w-[200px] text-center">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {batches.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="py-8 text-center text-gray-500">
                                                    Belum ada data batch gaji. Klik "Buat Batch Baru" untuk memulai.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            batches.map((batch) => (
                                                <TableRow key={batch.id} className="hover:bg-gray-50">
                                                    <TableCell className="font-mono text-sm">{batch.batch_number}</TableCell>
                                                    <TableCell className="font-medium">{batch.period_display}</TableCell>
                                                    <TableCell>
                                                        <div className="max-w-xs truncate text-sm text-gray-600">{batch.description || '-'}</div>
                                                    </TableCell>
                                                    <TableCell className="text-center">{batch.total_employees}</TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        {formatCurrency(batch.total_gaji_bersih)}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {getStatusBadge(batch.status)}
                                                        {batch.journal && (
                                                            <div className="mt-1 text-xs text-gray-500">{batch.journal.journal_number}</div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center justify-center gap-1">
                                                            {/* Isi Gaji Button */}
                                                            {batch.can_edit && hasPermission('penggajian.input-gaji') && (
                                                                <Link href={route('penggajian.input-gaji', batch.id)}>
                                                                    <Button variant="ghost" size="sm" title="Isi Gaji">
                                                                        <FileSpreadsheet className="h-4 w-4" />
                                                                    </Button>
                                                                </Link>
                                                            )}

                                                            {/* Post to Journal Button */}
                                                            {batch.can_post && hasPermission('penggajian.post-to-journal') && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handlePostToJournal([batch.id])}
                                                                    title="Post ke Jurnal"
                                                                >
                                                                    <Send className="h-4 w-4" />
                                                                </Button>
                                                            )}

                                                            {/* Edit Button */}
                                                            {batch.can_edit && hasPermission('penggajian.edit') && (
                                                                <Link href={route('penggajian.edit', batch.id)}>
                                                                    <Button variant="ghost" size="sm" title="Edit">
                                                                        <Edit3 className="h-4 w-4" />
                                                                    </Button>
                                                                </Link>
                                                            )}

                                                            {/* Delete Button */}
                                                            {batch.can_edit && hasPermission('penggajian.delete') && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => setDeleteDialog({ open: true, batch })}
                                                                    title="Hapus"
                                                                >
                                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                                </Button>
                                                            )}

                                                            {/* View Button (untuk yang sudah posted) */}
                                                            {!batch.can_edit && (
                                                                <Link href={route('penggajian.input-gaji', batch.id)}>
                                                                    <Button variant="ghost" size="sm" title="Lihat Detail">
                                                                        <Eye className="h-4 w-4" />
                                                                    </Button>
                                                                </Link>
                                                            )}
                                                        </div>
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

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialog.open} onOpenChange={(open) => !deleting && setDeleteDialog({ ...deleteDialog, open })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Hapus</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus batch <strong>{deleteDialog.batch?.batch_number}</strong>?
                            <br />
                            Data gaji karyawan di batch ini juga akan terhapus.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialog({ open: false, batch: null })} disabled={deleting}>
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                            {deleting ? 'Menghapus...' : 'Hapus'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
