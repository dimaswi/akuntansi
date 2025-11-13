import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { AlertCircle, AlertTriangle, Database, Loader2, Save, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { route } from 'ziggy-js';
import { toast } from 'sonner';

interface User {
    id: number;
    name: string;
    nip: string;
}

interface SalaryBatch {
    id: number;
    batch_number: string;
    period_display: string;
    status: string;
}

interface SalaryDetail {
    id?: number;
    user_id?: number;
    nip: string;
    nama_pegawai: string;
    nomor_whatsapp: string;
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
    pph_21: number;
    infaq: number;
    bpjs_kesehatan: number;
    bpjs_ketenagakerjaan: number;
    denda_absen: number;
    arisan_keluarga: number;
    denda_ngaji: number;
    kasbon: number;
    total_pendapatan: number;
    total_potongan: number;
    gaji_bersih: number;
}

interface Props extends SharedData {
    batch: SalaryBatch;
    users: User[];
    details: SalaryDetail[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Penggajian',
        href: '/penggajian',
    },
    {
        title: 'Input Gaji',
        href: '#',
    },
];

export default function InputGaji({ batch, users, details }: Props) {
    const cacheKey = `salary_input_${batch.id}`;

    const initializeRows = (): SalaryDetail[] => {
        // Cek cache terlebih dahulu
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                const parsedCache = JSON.parse(cached);
                // Validasi bahwa cache masih sesuai dengan jumlah users
                if (parsedCache.length === (details?.length || users.length)) {
                    console.log('✅ Data loaded from cache');
                    return parsedCache;
                }
            } catch (e) {
                console.warn('Failed to parse cache, using fresh data');
            }
        }

        if (details && details.length > 0) {
            return details.map(d => ({
                ...d,
                gaji_pokok: d.gaji_pokok || 0,
                tunjangan_sia: d.tunjangan_sia || 0,
                tunjangan_transportasi: d.tunjangan_transportasi || 0,
                tunjangan_jabatan: d.tunjangan_jabatan || 0,
                uang_jaga_utama: d.uang_jaga_utama || 0,
                uang_jaga_pratama: d.uang_jaga_pratama || 0,
                jasa_pelayanan_pratama: d.jasa_pelayanan_pratama || 0,
                jasa_pelayanan_rawat_inap: d.jasa_pelayanan_rawat_inap || 0,
                jasa_pelayanan_rawat_jalan: d.jasa_pelayanan_rawat_jalan || 0,
                tugas_tambahan: d.tugas_tambahan || 0,
                pph_21: d.pph_21 || 0,
                infaq: d.infaq || 0,
                bpjs_kesehatan: d.bpjs_kesehatan || 0,
                bpjs_ketenagakerjaan: d.bpjs_ketenagakerjaan || 0,
                denda_absen: d.denda_absen || 0,
                arisan_keluarga: d.arisan_keluarga || 0,
                denda_ngaji: d.denda_ngaji || 0,
                kasbon: d.kasbon || 0,
                total_pendapatan: d.total_pendapatan || 0,
                total_potongan: d.total_potongan || 0,
                gaji_bersih: d.gaji_bersih || 0,
            }));
        }
        
        return users.map(user => ({
            user_id: user.id,
            nip: user.nip,
            nama_pegawai: user.name,
            nomor_whatsapp: '',
            gaji_pokok: 0,
            tunjangan_sia: 0,
            tunjangan_transportasi: 0,
            tunjangan_jabatan: 0,
            uang_jaga_utama: 0,
            uang_jaga_pratama: 0,
            jasa_pelayanan_pratama: 0,
            jasa_pelayanan_rawat_inap: 0,
            jasa_pelayanan_rawat_jalan: 0,
            tugas_tambahan: 0,
            pph_21: 0,
            infaq: 0,
            bpjs_kesehatan: 0,
            bpjs_ketenagakerjaan: 0,
            denda_absen: 0,
            arisan_keluarga: 0,
            denda_ngaji: 0,
            kasbon: 0,
            total_pendapatan: 0,
            total_potongan: 0,
            gaji_bersih: 0,
        }));
    };

    const [rows, setRows] = useState<SalaryDetail[]>(initializeRows);
    const [isCacheLoaded, setIsCacheLoaded] = useState(false);
    const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
    const [isPasting, setIsPasting] = useState(false);
    const { data, setData, post, processing } = useForm<{ details: any[] }>({
        details: rows as any,
    });

    // Check if cache was loaded on mount
    useEffect(() => {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            setIsCacheLoaded(true);
            const metadata = localStorage.getItem(`${cacheKey}_metadata`);
            if (metadata) {
                try {
                    const { timestamp } = JSON.parse(metadata);
                    setLastSavedTime(new Date(timestamp));
                } catch (e) {
                    console.warn('Failed to parse cache metadata');
                }
            }
            
            toast.info('Data Dimuat dari Cache', {
                description: 'Data input gaji sebelumnya berhasil dipulihkan dari browser cache.',
                duration: 5000,
                icon: <Database className="h-4 w-4" />,
            });
        }
    }, []);

    const calculateRowTotals = (row: SalaryDetail): SalaryDetail => {
        const pendapatan = 
            (parseFloat(row.gaji_pokok?.toString() || '0')) +
            (parseFloat(row.tunjangan_sia?.toString() || '0')) +
            (parseFloat(row.tunjangan_transportasi?.toString() || '0')) +
            (parseFloat(row.tunjangan_jabatan?.toString() || '0')) +
            (parseFloat(row.uang_jaga_utama?.toString() || '0')) +
            (parseFloat(row.uang_jaga_pratama?.toString() || '0')) +
            (parseFloat(row.jasa_pelayanan_pratama?.toString() || '0')) +
            (parseFloat(row.jasa_pelayanan_rawat_inap?.toString() || '0')) +
            (parseFloat(row.jasa_pelayanan_rawat_jalan?.toString() || '0')) +
            (parseFloat(row.tugas_tambahan?.toString() || '0'));

        const potongan =
            (parseFloat(row.pph_21?.toString() || '0')) +
            (parseFloat(row.infaq?.toString() || '0')) +
            (parseFloat(row.bpjs_kesehatan?.toString() || '0')) +
            (parseFloat(row.bpjs_ketenagakerjaan?.toString() || '0')) +
            (parseFloat(row.denda_absen?.toString() || '0')) +
            (parseFloat(row.arisan_keluarga?.toString() || '0')) +
            (parseFloat(row.denda_ngaji?.toString() || '0')) +
            (parseFloat(row.kasbon?.toString() || '0'));

        return {
            ...row,
            total_pendapatan: pendapatan,
            total_potongan: potongan,
            gaji_bersih: pendapatan - potongan,
        };
    };

    const handleCellChange = (index: number, field: keyof SalaryDetail, value: any) => {
        const updatedRows = [...rows];
        updatedRows[index] = {
            ...updatedRows[index],
            [field]: value,
        };
        updatedRows[index] = calculateRowTotals(updatedRows[index]);
        setRows(updatedRows);
        
        // Auto-save to cache with metadata
        try {
            localStorage.setItem(cacheKey, JSON.stringify(updatedRows));
            localStorage.setItem(`${cacheKey}_metadata`, JSON.stringify({
                timestamp: new Date().toISOString(),
                rowCount: updatedRows.length,
                batchId: batch.id,
            }));
            setLastSavedTime(new Date());
            setIsCacheLoaded(true);
        } catch (error) {
            console.error('Failed to save to cache:', error);
            toast.error('Gagal Menyimpan ke Cache', {
                description: 'Browser storage penuh atau diblokir. Data mungkin hilang saat reload.',
                duration: 5000,
            });
        }
    };

    // Handle paste from Excel (Horizontal only - single row)
    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, startRowIndex: number, startFieldIndex: number) => {
        e.preventDefault();
        setIsPasting(true);

        const editableFields = [
            'gaji_pokok', 'tunjangan_sia', 'tunjangan_transportasi', 'tunjangan_jabatan',
            'uang_jaga_utama', 'uang_jaga_pratama', 'jasa_pelayanan_pratama',
            'jasa_pelayanan_rawat_inap', 'jasa_pelayanan_rawat_jalan', 'tugas_tambahan',
            'pph_21', 'infaq', 'bpjs_kesehatan', 'bpjs_ketenagakerjaan',
            'denda_absen', 'arisan_keluarga', 'denda_ngaji', 'kasbon'
        ];

        try {
            const clipboardData = e.clipboardData.getData('text').trim();
            
            if (!clipboardData) {
                toast.warning('Data Kosong', {
                    description: 'Clipboard tidak mengandung data yang valid.',
                    duration: 3000,
                });
                setIsPasting(false);
                return;
            }

            // Hanya ambil baris pertama (horizontal paste only)
            const firstLine = clipboardData.split('\n')[0];
            
            // Split by tab (Excel format) atau spasi sebagai fallback
            let values = firstLine.split('\t').map(v => v.trim());
            
            // Jika hanya 1 value, coba split by spasi (multiple spaces) atau koma
            if (values.length === 1) {
                // Try split by multiple spaces or comma
                values = firstLine.split(/\s+|,/).map(v => v.trim()).filter(v => v !== '');
            }

            // Skip kolom pertama jika ada 19+ kolom (user copy termasuk kolom Nama)
            if (values.length >= 19) {
                console.log('⚠️ Detected 19+ columns, skipping first column (Nama)');
                values = values.slice(1);
                toast.info('Kolom Nama Diskip', {
                    description: 'Terdeteksi paste dari Excel dengan kolom Nama. Kolom pertama otomatis diskip.',
                    duration: 2000,
                });
            }

            const updatedRows = [...rows];
            let cellsUpdated = 0;

            // Paste horizontal (hanya 1 row, multiple columns)
            values.forEach((value, colOffset) => {
                const targetFieldIndex = startFieldIndex + colOffset;
                
                // Stop jika melebihi jumlah fields
                if (targetFieldIndex >= editableFields.length) return;

                const fieldName = editableFields[targetFieldIndex] as keyof SalaryDetail;
                
                // Parse numeric value, strip semua non-numeric kecuali titik dan minus
                const cleanValue = value.replace(/[^\d.-]/g, '');
                const numericValue = parseFloat(cleanValue) || 0;

                updatedRows[startRowIndex] = {
                    ...updatedRows[startRowIndex],
                    [fieldName]: numericValue,
                };

                cellsUpdated++;
            });

            // Recalculate totals untuk row yang ter-update
            updatedRows[startRowIndex] = calculateRowTotals(updatedRows[startRowIndex]);

            setRows(updatedRows);

            // Save to cache
            try {
                localStorage.setItem(cacheKey, JSON.stringify(updatedRows));
                localStorage.setItem(`${cacheKey}_metadata`, JSON.stringify({
                    timestamp: new Date().toISOString(),
                    rowCount: updatedRows.length,
                    batchId: batch.id,
                }));
                setLastSavedTime(new Date());
                setIsCacheLoaded(true);
            } catch (error) {
                console.error('Failed to save to cache:', error);
            }

            toast.success('Paste Berhasil', {
                description: `${cellsUpdated} cell berhasil di-paste untuk ${updatedRows[startRowIndex].nama_pegawai}.`,
                duration: 3000,
            });

            // Auto-focus ke row berikutnya, field awal
            setTimeout(() => {
                const nextRowIndex = startRowIndex + 1;
                if (nextRowIndex < rows.length) {
                    const nextInput = document.querySelector(
                        `input[data-row="${nextRowIndex}"][data-field="0"]`
                    ) as HTMLInputElement;
                    if (nextInput) {
                        nextInput.focus();
                        nextInput.select();
                    }
                }
            }, 100);

            console.log(`✅ Pasted ${cellsUpdated} cells horizontally for row ${startRowIndex}`);
        } catch (error) {
            console.error('Paste error:', error);
            toast.error('Paste Gagal', {
                description: 'Terjadi kesalahan saat memproses data dari clipboard.',
                duration: 4000,
            });
        } finally {
            setIsPasting(false);
        }
    };

    // Arrow key navigation with smart scroll handling
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, fieldIndex: number) => {
        const editableFields = [
            'gaji_pokok', 'tunjangan_sia', 'tunjangan_transportasi', 'tunjangan_jabatan',
            'uang_jaga_utama', 'uang_jaga_pratama', 'jasa_pelayanan_pratama',
            'jasa_pelayanan_rawat_inap', 'jasa_pelayanan_rawat_jalan', 'tugas_tambahan',
            'pph_21', 'infaq', 'bpjs_kesehatan', 'bpjs_ketenagakerjaan',
            'denda_absen', 'arisan_keluarga', 'denda_ngaji', 'kasbon'
        ];

        let newRowIndex = rowIndex;
        let newFieldIndex = fieldIndex;

        switch(e.key) {
            case 'ArrowUp':
                e.preventDefault();
                newRowIndex = Math.max(0, rowIndex - 1);
                break;
            case 'ArrowDown':
                e.preventDefault();
                newRowIndex = Math.min(rows.length - 1, rowIndex + 1);
                break;
            case 'ArrowLeft':
                e.preventDefault();
                newFieldIndex = Math.max(0, fieldIndex - 1);
                break;
            case 'ArrowRight':
                e.preventDefault();
                newFieldIndex = Math.min(editableFields.length - 1, fieldIndex + 1);
                break;
            case 'Enter':
                e.preventDefault();
                newRowIndex = Math.min(rows.length - 1, rowIndex + 1);
                break;
            default:
                return;
        }

        // Focus next input
        const nextInput = document.querySelector(
            `input[data-row="${newRowIndex}"][data-field="${newFieldIndex}"]`
        ) as HTMLInputElement;
        
        if (nextInput) {
            nextInput.focus();
            nextInput.select();
            
            // Smart scroll handling untuk menghindari sticky columns
            const container = nextInput.closest('.overflow-auto');
            const cell = nextInput.closest('td');
            
            if (container && cell) {
                const containerRect = container.getBoundingClientRect();
                const cellRect = cell.getBoundingClientRect();
                
                // Konstanta untuk sticky columns
                const STICKY_LEFT_WIDTH = 250; // Nama pegawai
                const STICKY_RIGHT_WIDTH = 400; // Total Pendapatan (130) + Total Potongan (130) + Gaji Bersih (140)
                const PADDING = 20; // Extra padding untuk visibility
                
                // Scroll horizontal jika perlu
                if (cellRect.left < containerRect.left + STICKY_LEFT_WIDTH + PADDING) {
                    // Field tertutup sticky left column
                    const scrollLeft = container.scrollLeft - (containerRect.left + STICKY_LEFT_WIDTH + PADDING - cellRect.left);
                    container.scrollTo({
                        left: Math.max(0, scrollLeft),
                        behavior: 'smooth'
                    });
                } else if (cellRect.right > containerRect.right - STICKY_RIGHT_WIDTH - PADDING) {
                    // Field tertutup sticky right columns
                    const scrollLeft = container.scrollLeft + (cellRect.right - (containerRect.right - STICKY_RIGHT_WIDTH - PADDING));
                    container.scrollTo({
                        left: scrollLeft,
                        behavior: 'smooth'
                    });
                }
                
                // Scroll vertical jika perlu
                const headerHeight = 40; // Approximate header height
                if (cellRect.top < containerRect.top + headerHeight) {
                    const scrollTop = container.scrollTop - (containerRect.top + headerHeight - cellRect.top);
                    container.scrollTo({
                        top: Math.max(0, scrollTop),
                        behavior: 'smooth'
                    });
                } else if (cellRect.bottom > containerRect.bottom) {
                    const scrollTop = container.scrollTop + (cellRect.bottom - containerRect.bottom);
                    container.scrollTo({
                        top: scrollTop,
                        behavior: 'smooth'
                    });
                }
            }
        }
    };

    useEffect(() => {
        setData('details', rows as any);
    }, [rows]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Warning jika tidak ada data yang diinput
        const hasData = rows.some(row => 
            row.gaji_pokok > 0 || 
            row.tunjangan_sia > 0 || 
            row.tunjangan_transportasi > 0 ||
            row.pph_21 > 0 ||
            row.infaq > 0
        );
        
        if (!hasData) {
            toast.warning('Data Kosong', {
                description: 'Tidak ada data gaji yang diinput. Pastikan Anda sudah mengisi data dengan benar.',
                duration: 5000,
            });
            return;
        }
        
        post(route('penggajian.store-gaji', batch.id), {
            onSuccess: () => {
                // Hapus cache setelah berhasil disimpan
                localStorage.removeItem(cacheKey);
                localStorage.removeItem(`${cacheKey}_metadata`);
                setIsCacheLoaded(false);
                setLastSavedTime(null);
                console.log('✅ Data saved successfully, cache cleared');
                
                toast.success('Data Berhasil Disimpan', {
                    description: 'Data gaji telah tersimpan ke database. Cache browser telah dibersihkan.',
                    duration: 5000,
                });
            },
            onError: (errors) => {
                console.error('Save error:', errors);
                toast.error('Gagal Menyimpan Data', {
                    description: 'Terjadi kesalahan saat menyimpan data. Silakan coba lagi.',
                    duration: 5000,
                });
            }
        });
    };

    const handleClearCache = () => {
        if (!confirm('⚠️ PERINGATAN!\n\nApakah Anda yakin ingin menghapus semua data yang belum disimpan?\n\nSemua perubahan yang belum disimpan ke database akan HILANG PERMANEN.\n\nKlik OK untuk melanjutkan atau Cancel untuk membatalkan.')) {
            return;
        }
        
        localStorage.removeItem(cacheKey);
        localStorage.removeItem(`${cacheKey}_metadata`);
        setIsCacheLoaded(false);
        setLastSavedTime(null);
        
        const freshRows = details && details.length > 0 
                ? details.map(d => ({
                    ...d,
                    gaji_pokok: d.gaji_pokok || 0,
                    tunjangan_sia: d.tunjangan_sia || 0,
                    tunjangan_transportasi: d.tunjangan_transportasi || 0,
                    tunjangan_jabatan: d.tunjangan_jabatan || 0,
                    uang_jaga_utama: d.uang_jaga_utama || 0,
                    uang_jaga_pratama: d.uang_jaga_pratama || 0,
                    jasa_pelayanan_pratama: d.jasa_pelayanan_pratama || 0,
                    jasa_pelayanan_rawat_inap: d.jasa_pelayanan_rawat_inap || 0,
                    jasa_pelayanan_rawat_jalan: d.jasa_pelayanan_rawat_jalan || 0,
                    tugas_tambahan: d.tugas_tambahan || 0,
                    pph_21: d.pph_21 || 0,
                    infaq: d.infaq || 0,
                    bpjs_kesehatan: d.bpjs_kesehatan || 0,
                    bpjs_ketenagakerjaan: d.bpjs_ketenagakerjaan || 0,
                    denda_absen: d.denda_absen || 0,
                    arisan_keluarga: d.arisan_keluarga || 0,
                    denda_ngaji: d.denda_ngaji || 0,
                    kasbon: d.kasbon || 0,
                    total_pendapatan: d.total_pendapatan || 0,
                    total_potongan: d.total_potongan || 0,
                    gaji_bersih: d.gaji_bersih || 0,
                }))
                : users.map(user => ({
                    user_id: user.id,
                    nip: user.nip,
                    nama_pegawai: user.name,
                    nomor_whatsapp: '',
                    gaji_pokok: 0,
                    tunjangan_sia: 0,
                    tunjangan_transportasi: 0,
                    tunjangan_jabatan: 0,
                    uang_jaga_utama: 0,
                    uang_jaga_pratama: 0,
                    jasa_pelayanan_pratama: 0,
                    jasa_pelayanan_rawat_inap: 0,
                    jasa_pelayanan_rawat_jalan: 0,
                    tugas_tambahan: 0,
                    pph_21: 0,
                    infaq: 0,
                    bpjs_kesehatan: 0,
                    bpjs_ketenagakerjaan: 0,
                    denda_absen: 0,
                    arisan_keluarga: 0,
                    denda_ngaji: 0,
                    kasbon: 0,
                    total_pendapatan: 0,
                    total_potongan: 0,
                    gaji_bersih: 0,
                }));
        setRows(freshRows);
        console.log('🗑️ Cache cleared');
        
        toast.success('Cache Dihapus', {
            description: 'Semua data cache telah dihapus. Form direset ke data awal.',
            duration: 5000,
            icon: <Trash2 className="h-4 w-4" />,
        });
    };

    // Warning sebelum leave page jika ada unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isCacheLoaded) {
                e.preventDefault();
                e.returnValue = 'Anda memiliki perubahan yang belum disimpan ke database. Yakin ingin meninggalkan halaman?';
                return e.returnValue;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isCacheLoaded]);

    const formatRupiah = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            minimumFractionDigits: 0,
        }).format(amount);
    };

    // Helper to render input cell
    const renderInputCell = (row: SalaryDetail, idx: number, fieldName: keyof SalaryDetail, fieldIndex: number, bgColor: string = 'bg-green-50/30') => {
        return (
            <td className={`${bgColor} px-1 py-1 border-r border-gray-200`} key={`${idx}-${fieldIndex}`}>
                <input
                    type="number"
                    data-row={idx}
                    data-field={fieldIndex.toString()}
                    className="w-full px-2 py-1.5 text-xs text-right border-0 focus:outline-none rounded bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={row[fieldName] as number || ''}
                    onChange={(e) => handleCellChange(idx, fieldName, parseFloat(e.target.value) || 0)}
                    onKeyDown={(e) => handleKeyDown(e, idx, fieldIndex)}
                    onPaste={(e) => handlePaste(e, idx, fieldIndex)}
                    disabled={isPasting}
                />
            </td>
        );
    };

    const grandTotalPendapatan = rows.reduce((sum, r) => sum + (r.total_pendapatan || 0), 0);
    const grandTotalPotongan = rows.reduce((sum, r) => sum + (r.total_potongan || 0), 0);
    const grandTotalBersih = rows.reduce((sum, r) => sum + (r.gaji_bersih || 0), 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Input Gaji - ${batch.batch_number}`} />

            <div className="h-screen flex flex-col bg-white">
                {/* Cache Warning Banner */}
                {isCacheLoaded && (
                    <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <h3 className="text-sm font-semibold text-yellow-800">
                                    ⚠️ Data Dimuat dari Cache Browser
                                </h3>
                                <p className="text-xs text-yellow-700 mt-1">
                                    Data ini belum tersimpan ke database. Pastikan untuk klik tombol <strong>"Simpan Data Gaji"</strong> untuk menyimpan secara permanen.
                                    {lastSavedTime && (
                                        <span className="ml-1">
                                            Terakhir diubah: <strong>{lastSavedTime.toLocaleString('id-ID')}</strong>
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Browser Storage Warning */}
                <div className="bg-blue-50 border-b border-blue-200 px-6 py-2.5">
                    <div className="flex items-start gap-2.5">
                        <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-xs text-blue-700">
                                <strong>Informasi:</strong> Data otomatis tersimpan ke cache browser setiap kali Anda menginput. 
                                Namun, cache bersifat <strong>SEMENTARA</strong> dan dapat hilang jika:
                                <span className="ml-1 font-medium">
                                    (1) Browser cache dihapus, (2) Menggunakan mode Incognito/Private, (3) Storage browser penuh
                                </span>
                                . Jangan lupa simpan ke database!
                            </p>
                            <p className="text-xs text-purple-700 mt-1 font-semibold">
                                📋 <strong>Fitur Paste dari Excel:</strong> Copy 1 baris data dari Excel (Ctrl+C), lalu klik di cell pertama pegawai dan Paste (Ctrl+V). 
                                Data akan otomatis ter-fill horizontal ke kanan, lalu auto-focus ke pegawai berikutnya.
                                <span className="text-blue-700 ml-1">• Boleh copy dengan/tanpa kolom Nama (otomatis diskip jika ada).</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Header */}
                <div className="border-b bg-white px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold">Input Data Gaji Karyawan</h1>
                        <p className="text-sm text-gray-600">
                            Batch: <span className="font-semibold">{batch.batch_number}</span> - {batch.period_display}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit(route('penggajian.index'))}
                            disabled={processing}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClearCache}
                            disabled={processing || !isCacheLoaded}
                            className="text-red-600 hover:text-red-700"
                            title={!isCacheLoaded ? 'Tidak ada cache untuk dihapus' : 'Hapus semua data cache'}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Reset Cache
                        </Button>
                        <Button 
                            type="button"
                            disabled={processing}
                            onClick={handleSubmit}
                        >
                            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Save className="mr-2 h-4 w-4" />
                            Simpan Data Gaji
                        </Button>
                    </div>
                </div>

                {/* Table Container */}
                <div className="flex-1 overflow-auto">
                    <style>{`
                        .sticky-shadow-right {
                            box-shadow: 2px 0 5px -2px rgba(0, 0, 0, 0.1);
                        }
                    `}</style>
                    <table className="border-collapse text-xs" style={{ minWidth: '100%', width: 'max-content' }}>
                        <thead className="sticky top-0 bg-gray-50 z-30">
                            <tr className="border-b border-gray-200">
                                <th className="sticky left-0 bg-gray-50 z-40 px-3 py-2 text-left font-semibold border-r border-gray-200 w-[250px] sticky-shadow-right">Nama</th>
                                <th className="px-3 py-2 text-center font-semibold bg-green-50 border-r border-gray-200 w-[110px]">Gaji Pokok</th>
                                <th className="px-3 py-2 text-center font-semibold bg-green-50 border-r border-gray-200 w-[110px]">Tunj. SIA</th>
                                <th className="px-3 py-2 text-center font-semibold bg-green-50 border-r border-gray-200 w-[110px]">Tunj. Transport</th>
                                <th className="px-3 py-2 text-center font-semibold bg-green-50 border-r border-gray-200 w-[110px]">Tunj. Jabatan</th>
                                <th className="px-3 py-2 text-center font-semibold bg-green-50 border-r border-gray-200 w-[120px]">Uang Jaga Utama</th>
                                <th className="px-3 py-2 text-center font-semibold bg-green-50 border-r border-gray-200 w-[130px]">Uang Jaga Pratama</th>
                                <th className="px-3 py-2 text-center font-semibold bg-green-50 border-r border-gray-200 w-[110px]">Jaspel Pratama</th>
                                <th className="px-3 py-2 text-center font-semibold bg-green-50 border-r border-gray-200 w-[110px]">Jaspel Ranap</th>
                                <th className="px-3 py-2 text-center font-semibold bg-green-50 border-r border-gray-200 w-[110px]">Jaspel Rajal</th>
                                <th className="px-3 py-2 text-center font-semibold bg-green-50 border-r border-gray-200 w-[120px]">Tugas Tambahan</th>
                                <th className="px-3 py-2 text-center font-semibold bg-red-50 border-r border-gray-200 w-[100px]">PPh 21</th>
                                <th className="px-3 py-2 text-center font-semibold bg-red-50 border-r border-gray-200 w-[100px]">Infaq</th>
                                <th className="px-3 py-2 text-center font-semibold bg-red-50 border-r border-gray-200 w-[100px]">BPJS Kes</th>
                                <th className="px-3 py-2 text-center font-semibold bg-red-50 border-r border-gray-200 w-[100px]">BPJS TK</th>
                                <th className="px-3 py-2 text-center font-semibold bg-red-50 border-r border-gray-200 w-[110px]">Denda Absen</th>
                                <th className="px-3 py-2 text-center font-semibold bg-red-50 border-r border-gray-200 w-[110px]">Arisan Kel</th>
                                <th className="px-3 py-2 text-center font-semibold bg-red-50 border-r border-gray-200 w-[110px]">Denda Ngaji</th>
                                <th className="px-3 py-2 text-center font-semibold bg-red-50 border-r border-gray-200 w-[100px]">Kasbon</th>
                                <th className="sticky right-[270px] bg-blue-100 z-40 px-3 py-2 text-center font-bold border-r border-gray-200 w-[130px] shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">Total Pendapatan</th>
                                <th className="sticky right-[140px] bg-red-100 z-40 px-3 py-2 text-center font-bold border-r border-gray-200 w-[130px] shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">Total Potongan</th>
                                <th className="sticky right-0 bg-yellow-200 z-40 px-3 py-2 text-center font-bold w-[140px] shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">Gaji Bersih</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, idx) => (
                                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="sticky left-0 bg-white z-10 px-3 py-1.5 border-r border-gray-200 font-medium sticky-shadow-right">
                                        {row.nama_pegawai}
                                    </td>
                                    {renderInputCell(row, idx, 'gaji_pokok', 0)}
                                    {renderInputCell(row, idx, 'tunjangan_sia', 1)}
                                    {renderInputCell(row, idx, 'tunjangan_transportasi', 2)}
                                    {renderInputCell(row, idx, 'tunjangan_jabatan', 3)}
                                    {renderInputCell(row, idx, 'uang_jaga_utama', 4)}
                                    {renderInputCell(row, idx, 'uang_jaga_pratama', 5)}
                                    {renderInputCell(row, idx, 'jasa_pelayanan_pratama', 6)}
                                    {renderInputCell(row, idx, 'jasa_pelayanan_rawat_inap', 7)}
                                    {renderInputCell(row, idx, 'jasa_pelayanan_rawat_jalan', 8)}
                                    {renderInputCell(row, idx, 'tugas_tambahan', 9)}
                                    {renderInputCell(row, idx, 'pph_21', 10, 'bg-red-50/30')}
                                    {renderInputCell(row, idx, 'infaq', 11, 'bg-red-50/30')}
                                    {renderInputCell(row, idx, 'bpjs_kesehatan', 12, 'bg-red-50/30')}
                                    {renderInputCell(row, idx, 'bpjs_ketenagakerjaan', 13, 'bg-red-50/30')}
                                    {renderInputCell(row, idx, 'denda_absen', 14, 'bg-red-50/30')}
                                    {renderInputCell(row, idx, 'arisan_keluarga', 15, 'bg-red-50/30')}
                                    {renderInputCell(row, idx, 'denda_ngaji', 16, 'bg-red-50/30')}
                                    {renderInputCell(row, idx, 'kasbon', 17, 'bg-red-50/30')}
                                    <td className="sticky right-[270px] text-right bg-blue-100 font-semibold px-3 py-1 border-r border-gray-200 z-10 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                        {formatRupiah(row.total_pendapatan)}
                                    </td>
                                    <td className="sticky right-[140px] text-right bg-red-100 font-semibold px-3 py-1 border-r border-gray-200 z-10 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                        {formatRupiah(row.total_potongan)}
                                    </td>
                                    <td className="sticky right-0 text-right bg-yellow-200 font-bold px-3 py-1 z-10 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                        {formatRupiah(row.gaji_bersih)}
                                    </td>
                                </tr>
                            ))}
                            {/* Grand Total Row */}
                            <tr className="font-bold bg-gray-100 border-t-2 border-gray-300">
                                <td colSpan={19} className="text-right px-3 py-2 sticky left-0 bg-gray-100 border-r border-gray-200 z-10 sticky-shadow-right">
                                    GRAND TOTAL:
                                </td>
                                <td className="sticky right-[270px] text-right bg-blue-100 px-3 py-2 border-r border-gray-200 z-10 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                    {formatRupiah(grandTotalPendapatan)}
                                </td>
                                <td className="sticky right-[140px] text-right bg-red-100 px-3 py-2 border-r border-gray-200 z-10 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                    {formatRupiah(grandTotalPotongan)}
                                </td>
                                <td className="sticky right-0 text-right bg-yellow-200 px-3 py-2 z-10 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                    {formatRupiah(grandTotalBersih)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="border-t bg-gray-50 px-6 py-3 flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                        <p>Total Karyawan: <span className="font-semibold">{rows.length}</span> orang</p>
                        <p className="text-xs mt-1">💡 Tips: Gunakan ↑ ↓ ← → (Arrow Keys) atau Enter untuk navigasi antar field</p>
                        <p className="text-xs mt-0.5 text-purple-600 font-medium">📋 Paste dari Excel: Copy 1 row (dengan/tanpa kolom Nama) → Click cell pertama → Ctrl+V → Auto-fill & pindah ke pegawai berikutnya</p>
                        <div className="flex items-center gap-1 mt-0.5">
                            <Database className="h-3 w-3 text-green-600" />
                            <p className="text-xs text-green-600">
                                {isCacheLoaded ? (
                                    <>Cache Aktif • {lastSavedTime ? `Terakhir disimpan: ${lastSavedTime.toLocaleTimeString('id-ID')}` : 'Data tersimpan di browser'}</>
                                ) : (
                                    'Data otomatis tersimpan ke cache browser'
                                )}
                            </p>
                        </div>
                        {isCacheLoaded && (
                            <p className="text-xs mt-0.5 text-orange-600 font-medium">
                                ⚠️ Jangan lupa simpan ke database sebelum menutup browser!
                            </p>
                        )}
                    </div>
                    <div className="text-sm text-right">
                        <p>Grand Total Gaji Bersih: <span className="text-lg font-bold text-green-600">{formatRupiah(grandTotalBersih)}</span></p>
                        {isCacheLoaded && (
                            <p className="text-xs text-orange-600 mt-1 flex items-center justify-end gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Data belum tersimpan ke database
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
