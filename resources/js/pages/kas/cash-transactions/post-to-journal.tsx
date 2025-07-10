import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchableAccountSelect } from "@/components/ui/searchable-account-select";
import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem, SharedData } from "@/types";
import { Head, router, usePage } from "@inertiajs/react";
import { ArrowLeft, BookOpen, AlertCircle, Wallet } from "lucide-react";
import { FormEventHandler, useState } from "react";
import { toast } from "sonner";

interface CashTransaction {
    id: number;
    nomor_transaksi: string;
    tanggal_transaksi: string;
    jenis_transaksi: string;
    kategori_transaksi: string;
    jumlah: number;
    keterangan: string;
    pihak_terkait: string;
    daftar_akun_kas: {
        id: number;
        kode_akun: string;
        nama_akun: string;
    };
    user: {
        name: string;
    };
}

interface DaftarAkun {
    id: number;
    kode_akun: string;
    nama_akun: string;
    jenis_akun: string;
}

interface Props extends SharedData {
    cashTransactions: CashTransaction[];
    daftarAkun: DaftarAkun[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: <Wallet className="h-4 w-4" />,
        href: '/kas',
    },
    {
        title: 'Transaksi Kas',
        href: '/kas/cash-transactions',
    },
    {
        title: 'Posting ke Jurnal',
        href: '#',
    },
];

export default function CashTransactionPostToJournal() {
    const { cashTransactions, daftarAkun } = usePage<Props>().props;
    const [accountMappings, setAccountMappings] = useState<Record<number, string>>({});
    const [processing, setProcessing] = useState(false);

    const handleAccountChange = (transactionId: number, accountId: string) => {
        setAccountMappings(prev => ({
            ...prev,
            [transactionId]: accountId
        }));
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        
        // Validasi semua transaksi sudah dipilih akun lawannya
        const mappings = cashTransactions.map(transaction => ({
            cash_transaction_id: transaction.id,
            daftar_akun_lawan_id: accountMappings[transaction.id]
        }));

        const hasUnmappedTransaction = mappings.some(mapping => !mapping.daftar_akun_lawan_id);
        
        if (hasUnmappedTransaction) {
            toast.error('Semua transaksi harus dipilih akun lawannya');
            return;
        }

        setProcessing(true);
        router.post('/kas/cash-transactions/post-to-journal', {
            selected_transactions: cashTransactions.map(t => t.id),
            account_mappings: mappings
        }, {
            onSuccess: () => {
                toast.success('Transaksi berhasil diposting ke jurnal');
                setProcessing(false);
            },
            onError: () => {
                toast.error('Gagal memposting transaksi ke jurnal');
                setProcessing(false);
            }
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const getRecommendedAccounts = (transaction: CashTransaction) => {
        const kategori = transaction.kategori_transaksi;
        const jenis = transaction.jenis_transaksi;

        if (jenis === 'penerimaan') {
            switch (kategori) {
                case 'penjualan':
                    return daftarAkun.filter(akun => 
                        akun.jenis_akun === 'pendapatan' && 
                        akun.nama_akun.toLowerCase().includes('penjualan')
                    );
                case 'piutang':
                    return daftarAkun.filter(akun => 
                        akun.jenis_akun === 'aset' && 
                        akun.nama_akun.toLowerCase().includes('piutang')
                    );
                case 'investasi':
                    return daftarAkun.filter(akun => 
                        akun.jenis_akun === 'modal'
                    );
                case 'bunga':
                    return daftarAkun.filter(akun => 
                        akun.jenis_akun === 'pendapatan' && 
                        akun.nama_akun.toLowerCase().includes('bunga')
                    );
                default:
                    return daftarAkun.filter(akun => akun.jenis_akun === 'pendapatan');
            }
        } else {
            switch (kategori) {
                case 'pembelian':
                    return daftarAkun.filter(akun => 
                        akun.jenis_akun === 'biaya' && 
                        akun.nama_akun.toLowerCase().includes('pembelian')
                    );
                case 'gaji':
                    return daftarAkun.filter(akun => 
                        (akun.jenis_akun === 'biaya' || akun.jenis_akun === 'beban') && 
                        (akun.nama_akun.toLowerCase().includes('gaji') || akun.nama_akun.toLowerCase().includes('upah'))
                    );
                case 'operasional':
                    return daftarAkun.filter(akun => 
                        (akun.jenis_akun === 'biaya' || akun.jenis_akun === 'beban') && 
                        akun.nama_akun.toLowerCase().includes('operasional')
                    );
                case 'pinjaman':
                    return daftarAkun.filter(akun => 
                        akun.jenis_akun === 'kewajiban'
                    );
                default:
                    return daftarAkun.filter(akun => akun.jenis_akun === 'biaya' || akun.jenis_akun === 'beban');
            }
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Posting Transaksi Kas ke Jurnal" />
            <div className="p-4">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <BookOpen className="h-5 w-5" />
                                    Posting Transaksi Kas ke Jurnal
                                </CardTitle>
                                <CardDescription>
                                    Pilih akun lawan untuk setiap transaksi sebelum posting ke jurnal
                                </CardDescription>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => router.visit('/kas/cash-transactions')}
                                className="gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Kembali
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Alert className="mb-6">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                <strong>Petunjuk:</strong> Pilih akun lawan yang sesuai untuk setiap transaksi. 
                                Sistem memberikan rekomendasi berdasarkan kategori transaksi, namun Anda dapat memilih akun lain sesuai kebutuhan.
                            </AlertDescription>
                        </Alert>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                {cashTransactions.map((transaction, index) => {
                                    const recommendedAccounts = getRecommendedAccounts(transaction);
                                    const allAccounts = daftarAkun.filter(akun => 
                                        transaction.jenis_transaksi === 'penerimaan' 
                                            ? ['pendapatan', 'kewajiban', 'modal', 'aset'].includes(akun.jenis_akun)
                                            : ['biaya', 'beban', 'aset', 'kewajiban'].includes(akun.jenis_akun)
                                    );

                                    return (
                                        <Card key={transaction.id} className="p-4">
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <h4 className="font-medium text-sm text-gray-900">
                                                        {transaction.nomor_transaksi}
                                                    </h4>
                                                    <div className="text-sm space-y-1">
                                                        <p><span className="font-medium">Tanggal:</span> {new Date(transaction.tanggal_transaksi).toLocaleDateString('id-ID')}</p>
                                                        <p><span className="font-medium">Jenis:</span> {transaction.jenis_transaksi === 'penerimaan' ? 'Penerimaan' : 'Pengeluaran'}</p>
                                                        <p><span className="font-medium">Kategori:</span> {transaction.kategori_transaksi}</p>
                                                        <p><span className="font-medium">Jumlah:</span> {formatCurrency(transaction.jumlah)}</p>
                                                        <p><span className="font-medium">Keterangan:</span> {transaction.keterangan}</p>
                                                        <p><span className="font-medium">Akun Kas:</span> {transaction.daftar_akun_kas.kode_akun} - {transaction.daftar_akun_kas.nama_akun}</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="space-y-3">
                                                    <div>
                                                        <SearchableAccountSelect
                                                            accounts={allAccounts}
                                                            value={accountMappings[transaction.id]}
                                                            onValueChange={(value) => handleAccountChange(transaction.id, value)}
                                                            label="Akun Lawan *"
                                                            placeholder="Pilih akun lawan"
                                                            error=""
                                                        />
                                                        {recommendedAccounts.length > 0 && (
                                                            <div className="mt-2">
                                                                <p className="text-xs font-medium text-blue-600 mb-1">Rekomendasi:</p>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {recommendedAccounts.slice(0, 3).map((akun) => (
                                                                        <button
                                                                            key={`rec-${akun.id}`}
                                                                            type="button"
                                                                            onClick={() => handleAccountChange(transaction.id, akun.id.toString())}
                                                                            className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                                                                        >
                                                                            ★ {akun.kode_akun} - {akun.nama_akun}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="text-xs text-gray-500">
                                                        <p><strong>Jurnal yang akan dibuat:</strong></p>
                                                        {transaction.jenis_transaksi === 'penerimaan' ? (
                                                            <div className="mt-1 p-2 bg-green-50 rounded text-green-800">
                                                                <p>Dr. {transaction.daftar_akun_kas.nama_akun} = {formatCurrency(transaction.jumlah)}</p>
                                                                <p>Cr. [Akun Lawan] = {formatCurrency(transaction.jumlah)}</p>
                                                            </div>
                                                        ) : (
                                                            <div className="mt-1 p-2 bg-red-50 rounded text-red-800">
                                                                <p>Dr. [Akun Lawan] = {formatCurrency(transaction.jumlah)}</p>
                                                                <p>Cr. {transaction.daftar_akun_kas.nama_akun} = {formatCurrency(transaction.jumlah)}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.visit('/kas/cash-transactions')}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="gap-2"
                                >
                                    {processing ? (
                                        <>
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                            Memposting...
                                        </>
                                    ) : (
                                        <>
                                            <BookOpen className="h-4 w-4" />
                                            Posting ke Jurnal ({cashTransactions.length} transaksi)
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
