import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Calendar, DollarSign, Download, FileText, Filter, TrendingUp, X } from 'lucide-react';
import { useState } from 'react';

interface SalaryBatch {
    id: number;
    batch_number: string;
    period_display: string;
    period_month: number;
    period_year: number;
    status: string;
}

interface SalarySlip {
    id: number;
    salary_batch_id: number;
    user_id: number;
    nip: string;
    nama_pegawai: string;
    nomor_whatsapp: string;
    // Pendapatan
    gaji_pokok: number;
    tunjangan_sia: number;
    tunjangan_transportasi: number;
    tunjangan_jabatan: number;
    uang_jaga_utama: number;
    uang_jaga_pratama: number;
    jasa_pelayanan_pratama: number;
    jasa_pelayanan_rawat_inap: number;
    jasa_pelayanan_rawat_jalan: number;
    tugas_tambahan: number;
    total_pendapatan: number;
    // Potongan
    pph_21: number;
    infaq: number;
    bpjs_kesehatan: number;
    bpjs_ketenagakerjaan: number;
    denda_absen: number;
    arisan_keluarga: number;
    denda_ngaji: number;
    kasbon: number;
    total_potongan: number;
    // Total
    gaji_bersih: number;
    created_at: string;
    salary_batch: SalaryBatch;
}

interface Summary {
    total_slips: number;
    total_gaji_bersih: number;
    latest_period: string | null;
}

interface Props extends SharedData {
    salarySlips: SalarySlip[];
    filters: {
        period_year: string;
        period_month: string;
    };
    summary: Summary;
    userName: string;
    userNip: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Slip Gaji Saya',
        href: '#',
    },
];

export default function MySalary({ salarySlips, filters, summary, userName, userNip }: Props) {
    const [selectedSlip, setSelectedSlip] = useState<SalarySlip | null>(null);
    const [selectedYear, setSelectedYear] = useState<string>(filters.period_year || '');
    const [selectedMonth, setSelectedMonth] = useState<string>(filters.period_month || '');
    const [openSlipId, setOpenSlipId] = useState<number | null>(null);

    const formatRupiah = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const handlePrint = (slip: SalarySlip) => {
        setSelectedSlip(slip);
        setTimeout(() => {
            window.print();
        }, 100);
    };

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

    // Generate years (5 tahun terakhir dari tahun ini)
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => ({
        value: (currentYear - i).toString(),
        label: (currentYear - i).toString(),
    }));

    const handleFilterChange = (year: string, month: string) => {
        router.get(
            route('penggajian.index'),
            {
                period_year: year,
                period_month: month,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleYearChange = (year: string | undefined) => {
        const newYear = year || '';
        setSelectedYear(newYear);
        handleFilterChange(newYear, selectedMonth);
    };

    const handleMonthChange = (month: string | undefined) => {
        const newMonth = month || '';
        setSelectedMonth(newMonth);
        handleFilterChange(selectedYear, newMonth);
    };

    const handleClearFilter = () => {
        setSelectedYear('');
        setSelectedMonth('');
        router.get(
            route('penggajian.index'),
            {},
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const hasActiveFilter = selectedYear || selectedMonth;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Slip Gaji Saya" />

            <div className="mt-4 space-y-4 sm:mt-6 sm:space-y-5">
                {/* Header - Compact */}
                <div className="slip-header border-b pb-4 sm:pb-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <div>
                            <h1 className="slip-title text-2xl font-bold text-gray-900 sm:text-3xl">Slip Gaji</h1>
                            <p className="slip-subtitle mt-2 text-sm text-gray-600 sm:text-base">
                                {userName} <span className="mx-2">•</span> {userNip}
                            </p>
                        </div>
                        <div className="text-left sm:text-right">
                            <p className="text-xs text-gray-500 sm:text-sm">Total Slip</p>
                            <p className="text-xl font-semibold text-gray-900 sm:text-2xl">{summary.total_slips}</p>
                        </div>
                    </div>
                </div>

                {/* Filter Section - Compact */}
                <div className="filter-section rounded-lg border bg-gray-50 p-4 sm:p-5">
                    <div className="mb-3 flex items-center justify-between sm:mb-4">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-gray-500 sm:h-5 sm:w-5" />
                            <span className="text-sm font-medium text-gray-700 sm:text-base">Filter</span>
                        </div>
                        {hasActiveFilter && (
                            <Button variant="ghost" size="sm" onClick={handleClearFilter} className="h-7 px-2 text-xs">
                                <X className="mr-1 h-3 w-3" />
                                Reset
                            </Button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:gap-3 md:grid-cols-2">
                        <div className="space-y-1">
                            <label className="text-xs text-gray-600">Tahun</label>
                            <Select value={selectedYear || undefined} onValueChange={handleYearChange}>
                                <SelectTrigger className="h-9 text-sm">
                                    <SelectValue placeholder="Semua Tahun" />
                                </SelectTrigger>
                                <SelectContent>
                                    {years.map((year) => (
                                        <SelectItem key={year.value} value={year.value}>
                                            {year.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-gray-600">Bulan</label>
                            <Select value={selectedMonth || undefined} onValueChange={handleMonthChange}>
                                <SelectTrigger className="h-9 text-sm">
                                    <SelectValue placeholder="Semua Bulan" />
                                </SelectTrigger>
                                <SelectContent>
                                    {months.map((month) => (
                                        <SelectItem key={month.value} value={month.value}>
                                            {month.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Summary Cards - Compact Monochrome */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
                    <div className="summary-card rounded-lg border bg-white p-2.5 sm:p-3">
                        <div className="mb-0.5 flex items-center justify-between sm:mb-1">
                            <span className="text-xs font-medium text-gray-500">Slip Tersedia</span>
                            <FileText className="summary-icon h-3.5 w-3.5 text-gray-400 sm:h-4 sm:w-4" />
                        </div>
                        <p className="summary-value text-lg font-bold text-gray-900 sm:text-2xl">{summary.total_slips}</p>
                    </div>

                    <div className="summary-card rounded-lg border bg-white p-2.5 sm:p-3">
                        <div className="mb-0.5 flex items-center justify-between sm:mb-1">
                            <span className="text-xs font-medium text-gray-500">Total Diterima</span>
                            <DollarSign className="summary-icon h-3.5 w-3.5 text-gray-400 sm:h-4 sm:w-4" />
                        </div>
                        <p className="text-sm font-bold break-words text-gray-900 sm:text-lg">{formatRupiah(summary.total_gaji_bersih)}</p>
                    </div>

                    <div className="summary-card rounded-lg border bg-white p-2.5 sm:p-3">
                        <div className="mb-0.5 flex items-center justify-between sm:mb-1">
                            <span className="text-xs font-medium text-gray-500">Periode Terbaru</span>
                            <Calendar className="summary-icon h-3.5 w-3.5 text-gray-400 sm:h-4 sm:w-4" />
                        </div>
                        <p className="summary-value text-sm font-bold text-gray-900 sm:text-lg">{summary.latest_period || '-'}</p>
                    </div>
                </div>

                {/* Slip List - Compact */}
                <div>
                    <div className="mb-2 flex items-center justify-between sm:mb-3">
                        <h2 className="text-xs font-semibold text-gray-900 sm:text-sm">{hasActiveFilter ? 'Hasil Filter' : 'Riwayat Slip Gaji'}</h2>
                        <span className="text-xs text-gray-500">{salarySlips.length} slip</span>
                    </div>

                    {salarySlips.length === 0 ? (
                        <div className="rounded-lg border border-dashed p-8 text-center sm:p-12">
                            <FileText className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                            <h3 className="mb-1 text-sm font-semibold text-gray-900">{hasActiveFilter ? 'Tidak Ada Data' : 'Belum Ada Slip Gaji'}</h3>
                            <p className="mx-auto max-w-sm text-xs text-gray-500">
                                {hasActiveFilter
                                    ? 'Tidak ada slip sesuai filter. Coba ubah filter atau reset.'
                                    : 'Slip gaji akan muncul setelah admin posting.'}
                            </p>
                            {hasActiveFilter && (
                                <Button variant="outline" size="sm" onClick={handleClearFilter} className="mt-3 h-8 text-xs">
                                    <X className="mr-1 h-3 w-3" />
                                    Reset
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2 sm:space-y-3">
                            {salarySlips.map((slip) => {
                                const isAllMonths = !selectedMonth; // when showing all months, make rows collapsible
                                const isExpanded = !isAllMonths || openSlipId === slip.id;

                                return (
                                    <div key={slip.id} className="rounded-lg border bg-white">
                                        {/* Header - clickable when collapsible */}
                                        <div
                                            className="slip-card-header cursor-pointer border-b bg-gray-50 px-3 py-2.5 sm:px-4 sm:py-3"
                                            onClick={() => {
                                                if (isAllMonths) {
                                                    setOpenSlipId(isExpanded ? null : slip.id);
                                                }
                                            }}
                                            role={isAllMonths ? 'button' : undefined}
                                        >
                                            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-3.5 w-3.5 shrink-0 text-gray-400 sm:h-4 sm:w-4" />
                                                    <div className="min-w-0">
                                                        <h3 className="text-xs font-semibold text-gray-900 sm:text-sm">
                                                            {slip.salary_batch?.period_display || '-'}
                                                        </h3>
                                                        <p className="truncate text-[10px] text-gray-500 sm:text-xs">
                                                            {slip.salary_batch?.batch_number || '-'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex-shrink-0 text-left sm:text-right">
                                                    <p className="text-[10px] text-gray-500 sm:text-xs">Gaji Bersih</p>
                                                    <p className="text-sm font-bold text-gray-900 sm:text-base">{formatRupiah(slip.gaji_bersih)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Collapsible content */}
                                        {isExpanded ? (
                                            <div className="slip-card-content p-2.5 sm:p-4">
                                                <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
                                                    {/* Left: Pendapatan */}
                                                    <div className="pendapatan-section">
                                                        <div className="mb-1.5 flex items-center gap-1.5 sm:mb-2 sm:gap-2">
                                                            <TrendingUp className="h-3 w-3 text-green-600 sm:h-3.5 sm:w-3.5" />
                                                            <h4 className="section-title text-[11px] font-semibold text-green-700 sm:text-xs">
                                                                Pendapatan
                                                            </h4>
                                                        </div>
                                                        <div className="space-y-0.5 text-[11px] sm:space-y-1 sm:text-xs">
                                                            {slip.gaji_pokok > 0 && (
                                                                <div className="item-row flex justify-between border-b border-gray-100 py-1 sm:py-1.5">
                                                                    <span className="text-gray-600">Gaji Pokok</span>
                                                                    <span className="item-amount font-medium text-green-600">
                                                                        {formatRupiah(slip.gaji_pokok)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {slip.tunjangan_sia > 0 && (
                                                                <div className="item-row flex justify-between border-b border-gray-100 py-1 sm:py-1.5">
                                                                    <span className="text-gray-600">Tunj. SIA</span>
                                                                    <span className="item-amount font-medium text-green-600">
                                                                        {formatRupiah(slip.tunjangan_sia)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {slip.tunjangan_transportasi > 0 && (
                                                                <div className="item-row flex justify-between border-b border-gray-100 py-1 sm:py-1.5">
                                                                    <span className="text-gray-600">Tunj. Transport</span>
                                                                    <span className="item-amount font-medium text-green-600">
                                                                        {formatRupiah(slip.tunjangan_transportasi)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {slip.tunjangan_jabatan > 0 && (
                                                                <div className="item-row flex justify-between border-b border-gray-100 py-1 sm:py-1.5">
                                                                    <span className="text-gray-600">Tunj. Jabatan</span>
                                                                    <span className="item-amount font-medium text-green-600">
                                                                        {formatRupiah(slip.tunjangan_jabatan)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {slip.uang_jaga_utama > 0 && (
                                                                <div className="item-row flex justify-between border-b border-gray-100 py-1 sm:py-1.5">
                                                                    <span className="text-gray-600">Uang Jaga Utama</span>
                                                                    <span className="item-amount font-medium text-green-600">
                                                                        {formatRupiah(slip.uang_jaga_utama)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {slip.uang_jaga_pratama > 0 && (
                                                                <div className="item-row flex justify-between border-b border-gray-100 py-1 sm:py-1.5">
                                                                    <span className="text-gray-600">Uang Jaga Pratama</span>
                                                                    <span className="item-amount font-medium text-green-600">
                                                                        {formatRupiah(slip.uang_jaga_pratama)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {slip.jasa_pelayanan_pratama > 0 && (
                                                                <div className="item-row flex justify-between border-b border-gray-100 py-1 sm:py-1.5">
                                                                    <span className="text-gray-600">Jaspel Pratama</span>
                                                                    <span className="item-amount font-medium text-green-600">
                                                                        {formatRupiah(slip.jasa_pelayanan_pratama)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {slip.jasa_pelayanan_rawat_inap > 0 && (
                                                                <div className="item-row flex justify-between border-b border-gray-100 py-1 sm:py-1.5">
                                                                    <span className="text-gray-600">Jaspel Ranap</span>
                                                                    <span className="item-amount font-medium text-green-600">
                                                                        {formatRupiah(slip.jasa_pelayanan_rawat_inap)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {slip.jasa_pelayanan_rawat_jalan > 0 && (
                                                                <div className="item-row flex justify-between border-b border-gray-100 py-1 sm:py-1.5">
                                                                    <span className="text-gray-600">Jaspel Rajal</span>
                                                                    <span className="item-amount font-medium text-green-600">
                                                                        {formatRupiah(slip.jasa_pelayanan_rawat_jalan)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {slip.tugas_tambahan > 0 && (
                                                                <div className="item-row flex justify-between border-b border-gray-100 py-1 sm:py-1.5">
                                                                    <span className="text-gray-600">Tugas Tambahan</span>
                                                                    <span className="item-amount font-medium text-green-600">
                                                                        {formatRupiah(slip.tugas_tambahan)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Right: Potongan */}
                                                    <div className="potongan-section">
                                                        <div className="mb-1.5 flex items-center gap-1.5 sm:mb-2 sm:gap-2">
                                                            <DollarSign className="h-3 w-3 text-gray-500 sm:h-3.5 sm:w-3.5" />
                                                            <h4 className="section-title text-[11px] font-semibold text-gray-700 sm:text-xs">
                                                                Potongan
                                                            </h4>
                                                        </div>
                                                        <div className="space-y-0.5 text-[11px] sm:space-y-1 sm:text-xs">
                                                            {slip.pph_21 > 0 && (
                                                                <div className="item-row flex justify-between border-b border-gray-100 py-1 sm:py-1.5">
                                                                    <span className="text-gray-600">PPh 21</span>
                                                                    <span className="item-amount font-medium text-red-600">
                                                                        -{formatRupiah(slip.pph_21)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {slip.infaq > 0 && (
                                                                <div className="item-row flex justify-between border-b border-gray-100 py-1 sm:py-1.5">
                                                                    <span className="text-gray-600">Infaq</span>
                                                                    <span className="item-amount font-medium text-red-600">
                                                                        -{formatRupiah(slip.infaq)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {slip.bpjs_kesehatan > 0 && (
                                                                <div className="item-row flex justify-between border-b border-gray-100 py-1 sm:py-1.5">
                                                                    <span className="text-gray-600">BPJS Kesehatan</span>
                                                                    <span className="item-amount font-medium text-red-600">
                                                                        -{formatRupiah(slip.bpjs_kesehatan)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {slip.bpjs_ketenagakerjaan > 0 && (
                                                                <div className="item-row flex justify-between border-b border-gray-100 py-1 sm:py-1.5">
                                                                    <span className="text-gray-600">BPJS TK</span>
                                                                    <span className="item-amount font-medium text-red-600">
                                                                        -{formatRupiah(slip.bpjs_ketenagakerjaan)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {slip.denda_absen > 0 && (
                                                                <div className="item-row flex justify-between border-b border-gray-100 py-1 sm:py-1.5">
                                                                    <span className="text-gray-600">Denda Absen</span>
                                                                    <span className="item-amount font-medium text-red-600">
                                                                        -{formatRupiah(slip.denda_absen)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {slip.arisan_keluarga > 0 && (
                                                                <div className="item-row flex justify-between border-b border-gray-100 py-1 sm:py-1.5">
                                                                    <span className="text-gray-600">Arisan Keluarga</span>
                                                                    <span className="item-amount font-medium text-red-600">
                                                                        -{formatRupiah(slip.arisan_keluarga)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {slip.denda_ngaji > 0 && (
                                                                <div className="item-row flex justify-between border-b border-gray-100 py-1 sm:py-1.5">
                                                                    <span className="text-gray-600">Denda Ngaji</span>
                                                                    <span className="item-amount font-medium text-red-600">
                                                                        -{formatRupiah(slip.denda_ngaji)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {slip.kasbon > 0 && (
                                                                <div className="item-row flex justify-between border-b border-gray-100 py-1 sm:py-1.5">
                                                                    <span className="text-gray-600">Kasbon</span>
                                                                    <span className="item-amount font-medium text-red-600">
                                                                        -{formatRupiah(slip.kasbon)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Totals (POS-like) */}
                                                <div className="mt-3 border-t pt-3 sm:mt-4 sm:pt-4">
                                                    <div className="totals-box rounded-md border bg-white p-3 sm:p-4">
                                                        <div className="totals-row flex justify-between py-1.5 text-xs text-gray-600 sm:py-2 sm:text-sm">
                                                            <span>Total Pendapatan</span>
                                                            <span className="text-right font-medium text-green-600">
                                                                {formatRupiah(slip.total_pendapatan)}
                                                            </span>
                                                        </div>
                                                        <div className="totals-row flex justify-between py-1.5 text-xs text-gray-600 sm:py-2 sm:text-sm">
                                                            <span>Total Potongan</span>
                                                            <span className="text-right font-medium text-red-600">
                                                                -{formatRupiah(slip.total_potongan)}
                                                            </span>
                                                        </div>
                                                        <div className="take-home mt-2 flex justify-between border-t pt-2 text-sm font-bold sm:pt-3 sm:text-base">
                                                            <span className="text-gray-900">Take Home Pay</span>
                                                            <span className="take-home-amount text-right text-lg text-green-600 sm:text-xl">
                                                                {formatRupiah(slip.gaji_bersih)}
                                                            </span>
                                                        </div>
                                                        <div className="mt-3 text-right sm:mt-4">
                                                            <Button
                                                                onClick={() => handlePrint(slip)}
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 w-full bg-white text-xs text-gray-900 hover:bg-gray-100 sm:h-9 sm:w-auto sm:text-sm"
                                                            >
                                                                <Download className="mr-1 h-3 w-3 sm:mr-1.5 sm:h-3.5 sm:w-3.5" />
                                                                Print
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-3">
                                                <div className="flex items-center justify-between text-sm text-gray-600">
                                                    <div>
                                                        <div className="font-medium text-gray-900">{slip.salary_batch?.period_display || '-'}</div>
                                                        <div className="text-xs">{slip.salary_batch?.batch_number || '-'}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm font-semibold">{formatRupiah(slip.gaji_bersih)}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Styles */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print-area, .print-area * {
                        visibility: visible;
                    }
                    .print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                }
                
                /* Mobile-only styles */
                @media (max-width: 640px) {
                    /* Add horizontal padding to main container */
                    .space-y-4 {
                        padding-left: 1rem !important;
                        padding-right: 1rem !important;
                        padding-bottom : 1rem !important;
                    }
                    
                    .slip-header {
                        padding: 1.25rem 0 !important;
                        gap: 1rem !important;
                    }
                    
                    .slip-title {
                        font-size: 1.5rem !important;
                        line-height: 2rem !important;
                    }
                    
                    .slip-subtitle {
                        font-size: 0.9375rem !important;
                        margin-top: 0.375rem !important;
                    }
                    
                    .summary-card {
                        padding: 1.125rem !important;
                    }
                    
                    .summary-icon {
                        width: 1.125rem !important;
                        height: 1.125rem !important;
                    }
                    
                    .summary-value {
                        font-size: 1.5rem !important;
                        margin-top: 0.25rem !important;
                    }
                    
                    .filter-section {
                        padding: 1.25rem !important;
                    }
                    
                    .filter-section label {
                        font-size: 0.8125rem !important;
                        margin-bottom: 0.375rem !important;
                        display: block !important;
                    }
                    
                    .slip-card-header {
                        padding: 1rem !important;
                    }
                    
                    .slip-card-content {
                        padding: 1.125rem !important;
                    }
                    
                    .section-title {
                        font-size: 0.9375rem !important;
                        margin-bottom: 0.5rem !important;
                        font-weight: 600 !important;
                    }
                    
                    .item-row {
                        padding: 0.5rem 0.5rem !important;
                        font-size: 0.875rem !important;
                        line-height: 0.5 !important;
                    }
                    
                    .item-row span {
                        padding: 0 0.25rem !important;
                    }
                    
                    .totals-box {
                        padding: 1.125rem !important;
                        margin-top: 1.125rem !important;
                    }
                    
                    .totals-row {
                        padding: 0.625rem 0.5rem !important;
                        font-size: 0.9375rem !important;
                    }
                    
                    .totals-row span {
                        padding: 0 0.25rem !important;
                    }
                    
                    .take-home {
                        padding: 0.875rem 0.5rem 0 !important;
                        font-size: 1.0625rem !important;
                    }
                    
                    .take-home span {
                        padding: 0 0.25rem !important;
                    }
                    
                    .take-home-amount {
                        font-size: 1.375rem !important;
                        font-weight: 700 !important;
                    }
                    
                    /* Color coding for mobile */
                    .pendapatan-section .section-title {
                        color: rgb(22, 163, 74) !important;
                    }
                    
                    .pendapatan-section .item-amount {
                        color: rgb(22, 163, 74) !important;
                    }
                    
                    .potongan-section .section-title {
                        color: rgb(220, 38, 38) !important;
                    }
                    
                    .potongan-section .item-amount {
                        color: rgb(220, 38, 38) !important;
                    }
                }
            `}</style>

            {/* Print Area (Hidden, only for printing) */}
            {selectedSlip && (
                <div className="print-area hidden print:block">
                    <div className="mx-auto max-w-4xl">
                        {/* Kop Header dengan Logo */}
                        <div className="mb-8 border-b-4 border-green-700 pb-6">
                            <div className="flex items-start gap-6">
                                {/* Logo Kiri */}
                                <div className="flex-shrink-0">
                                    <img src="/1.png" alt="Logo Muhammadiyah Kedungadem" width="100" height="100" className="object-contain" />
                                </div>
                                
                                {/* Nama Klinik - Left Aligned */}
                                <div className="flex-grow">
                                    <h1 className=" text-3xl font-bold text-gray-900 leading-tight">
                                        KLINIK RAWAT INAP UTAMA
                                    </h1>
                                    <h2 className="text-2xl font-bold text-green-700">
                                        MUHAMMADIYAH KEDUNGADEM
                                    </h2>
                                    <div className="text-sm text-gray-700 leading-relaxed ">
                                        <p>Jl. Raya Kedungadem - Bojonegoro, Jawa Timur</p>
                                        <p>Telp: (0353) 881-XXX | Email: klinik.muhammadiyah@kedungadem.or.id</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Employee Info */}
                        <div className="mb-4 rounded-lg bg-gray-50 p-3">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-semibold text-gray-700">Nama:</span>
                                    <span className="ml-2 text-gray-900">{selectedSlip.nama_pegawai}</span>
                                </div>
                                <div>
                                    <span className="font-semibold text-gray-700">NIP:</span>
                                    <span className="ml-2 text-gray-900">{selectedSlip.nip}</span>
                                </div>
                            </div>
                        </div>

                        {/* Salary Details - 2 Columns */}
                        <div className="mb-4 grid grid-cols-2 gap-4">
                            {/* Left Column: Pendapatan */}
                            <div className="border border-gray-400">
                                <div className="bg-green-100 p-2 font-bold text-green-800">PENDAPATAN</div>
                                <div className="divide-y divide-gray-200">
                                    {selectedSlip.gaji_pokok > 0 && (
                                        <div className="flex justify-between p-2 text-sm">
                                            <span className="text-gray-700">Gaji Pokok</span>
                                            <span className="font-semibold text-green-700">{formatRupiah(selectedSlip.gaji_pokok)}</span>
                                        </div>
                                    )}
                                    {selectedSlip.tunjangan_sia > 0 && (
                                        <div className="flex justify-between p-2 text-sm">
                                            <span className="text-gray-700">Tunjangan SIA</span>
                                            <span className="font-semibold text-green-700">{formatRupiah(selectedSlip.tunjangan_sia)}</span>
                                        </div>
                                    )}
                                    {selectedSlip.tunjangan_transportasi > 0 && (
                                        <div className="flex justify-between p-2 text-sm">
                                            <span className="text-gray-700">Tunj. Transportasi</span>
                                            <span className="font-semibold text-green-700">{formatRupiah(selectedSlip.tunjangan_transportasi)}</span>
                                        </div>
                                    )}
                                    {selectedSlip.tunjangan_jabatan > 0 && (
                                        <div className="flex justify-between p-2 text-sm">
                                            <span className="text-gray-700">Tunj. Jabatan</span>
                                            <span className="font-semibold text-green-700">{formatRupiah(selectedSlip.tunjangan_jabatan)}</span>
                                        </div>
                                    )}
                                    {selectedSlip.uang_jaga_utama > 0 && (
                                        <div className="flex justify-between p-2 text-sm">
                                            <span className="text-gray-700">Uang Jaga Utama</span>
                                            <span className="font-semibold text-green-700">{formatRupiah(selectedSlip.uang_jaga_utama)}</span>
                                        </div>
                                    )}
                                    {selectedSlip.uang_jaga_pratama > 0 && (
                                        <div className="flex justify-between p-2 text-sm">
                                            <span className="text-gray-700">Uang Jaga Pratama</span>
                                            <span className="font-semibold text-green-700">{formatRupiah(selectedSlip.uang_jaga_pratama)}</span>
                                        </div>
                                    )}
                                    {selectedSlip.jasa_pelayanan_pratama > 0 && (
                                        <div className="flex justify-between p-2 text-sm">
                                            <span className="text-gray-700">Jaspel Pratama</span>
                                            <span className="font-semibold text-green-700">{formatRupiah(selectedSlip.jasa_pelayanan_pratama)}</span>
                                        </div>
                                    )}
                                    {selectedSlip.jasa_pelayanan_rawat_inap > 0 && (
                                        <div className="flex justify-between p-2 text-sm">
                                            <span className="text-gray-700">Jaspel Ranap</span>
                                            <span className="font-semibold text-green-700">{formatRupiah(selectedSlip.jasa_pelayanan_rawat_inap)}</span>
                                        </div>
                                    )}
                                    {selectedSlip.jasa_pelayanan_rawat_jalan > 0 && (
                                        <div className="flex justify-between p-2 text-sm">
                                            <span className="text-gray-700">Jaspel Rajal</span>
                                            <span className="font-semibold text-green-700">{formatRupiah(selectedSlip.jasa_pelayanan_rawat_jalan)}</span>
                                        </div>
                                    )}
                                    {selectedSlip.tugas_tambahan > 0 && (
                                        <div className="flex justify-between p-2 text-sm">
                                            <span className="text-gray-700">Tugas Tambahan</span>
                                            <span className="font-semibold text-green-700">{formatRupiah(selectedSlip.tugas_tambahan)}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-between bg-green-200 p-2 font-bold">
                                    <span className="text-green-900">Total Pendapatan</span>
                                    <span className="text-green-900">{formatRupiah(selectedSlip.total_pendapatan)}</span>
                                </div>
                            </div>

                            {/* Right Column: Potongan */}
                            <div className="border border-gray-400">
                                <div className="bg-red-100 p-2 font-bold text-red-800">POTONGAN</div>
                                <div className="divide-y divide-gray-200">
                                    {selectedSlip.pph_21 > 0 && (
                                        <div className="flex justify-between p-2 text-sm">
                                            <span className="text-gray-700">PPh 21</span>
                                            <span className="font-semibold text-red-700">-{formatRupiah(selectedSlip.pph_21)}</span>
                                        </div>
                                    )}
                                    {selectedSlip.infaq > 0 && (
                                        <div className="flex justify-between p-2 text-sm">
                                            <span className="text-gray-700">Infaq</span>
                                            <span className="font-semibold text-red-700">-{formatRupiah(selectedSlip.infaq)}</span>
                                        </div>
                                    )}
                                    {selectedSlip.bpjs_kesehatan > 0 && (
                                        <div className="flex justify-between p-2 text-sm">
                                            <span className="text-gray-700">BPJS Kesehatan</span>
                                            <span className="font-semibold text-red-700">-{formatRupiah(selectedSlip.bpjs_kesehatan)}</span>
                                        </div>
                                    )}
                                    {selectedSlip.bpjs_ketenagakerjaan > 0 && (
                                        <div className="flex justify-between p-2 text-sm">
                                            <span className="text-gray-700">BPJS TK</span>
                                            <span className="font-semibold text-red-700">-{formatRupiah(selectedSlip.bpjs_ketenagakerjaan)}</span>
                                        </div>
                                    )}
                                    {selectedSlip.denda_absen > 0 && (
                                        <div className="flex justify-between p-2 text-sm">
                                            <span className="text-gray-700">Denda Absen</span>
                                            <span className="font-semibold text-red-700">-{formatRupiah(selectedSlip.denda_absen)}</span>
                                        </div>
                                    )}
                                    {selectedSlip.arisan_keluarga > 0 && (
                                        <div className="flex justify-between p-2 text-sm">
                                            <span className="text-gray-700">Arisan Keluarga</span>
                                            <span className="font-semibold text-red-700">-{formatRupiah(selectedSlip.arisan_keluarga)}</span>
                                        </div>
                                    )}
                                    {selectedSlip.denda_ngaji > 0 && (
                                        <div className="flex justify-between p-2 text-sm">
                                            <span className="text-gray-700">Denda Ngaji</span>
                                            <span className="font-semibold text-red-700">-{formatRupiah(selectedSlip.denda_ngaji)}</span>
                                        </div>
                                    )}
                                    {selectedSlip.kasbon > 0 && (
                                        <div className="flex justify-between p-2 text-sm">
                                            <span className="text-gray-700">Kasbon</span>
                                            <span className="font-semibold text-red-700">-{formatRupiah(selectedSlip.kasbon)}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-between bg-red-200 p-2 font-bold">
                                    <span className="text-red-900">Total Potongan</span>
                                    <span className="text-red-900">-{formatRupiah(selectedSlip.total_potongan)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Take Home Pay */}
                        <div className="mb-4 border-2 border-green-700 bg-green-100 p-3">
                            <div className="flex items-center justify-between">
                                <span className="text-lg font-bold text-green-900">TAKE HOME PAY</span>
                                <span className="text-2xl font-bold text-green-900">{formatRupiah(selectedSlip.gaji_bersih)}</span>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-6 border-t border-gray-300 pt-4">
                            <div className="flex items-end justify-between">
                                <div className="text-xs text-gray-600">
                                    <p className="font-semibold">Dicetak:</p>
                                    <p>
                                        {new Date().toLocaleDateString('id-ID', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="mb-12 text-xs text-gray-600">Penerima,</p>
                                    <p className="border-t border-gray-800 px-6 pt-1 text-sm font-semibold">{selectedSlip.nama_pegawai}</p>
                                </div>
                            </div>
                            <p className="mt-3 text-center text-xs italic text-gray-500">Dokumen ini dicetak otomatis dan tidak memerlukan tanda tangan</p>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
