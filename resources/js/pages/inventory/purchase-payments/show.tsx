import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { usePermission } from '@/hooks/use-permission';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { useState } from 'react';
import { 
    ArrowLeft, 
    CheckCircle, 
    DollarSign, 
    Edit, 
    FileText, 
    Send, 
    Trash2,
    XCircle,
    Building2,
    Calendar,
    CreditCard,
    Hash,
    StickyNote,
    User
} from 'lucide-react';
import { route } from 'ziggy-js';

interface Purchase {
    id: number;
    purchase_number: string;
    supplier: {
        name: string;
    };
    total_amount: number;
    ap_outstanding: number;
}

interface BankAccount {
    account_name: string;
    bank_name: string;
    account_number: string;
}

interface Jurnal {
    id: number;
    nomor_jurnal: string;
    tanggal_jurnal: string;
    details: JurnalDetail[];
}

interface JurnalDetail {
    akun: {
        kode_akun: string;
        nama_akun: string;
    };
    debit: number;
    kredit: number;
    description: string;
}

interface PurchasePayment {
    id: number;
    payment_number: string;
    payment_date: string;
    payment_method: string;
    amount: number;
    discount_amount: number;
    net_amount: number;
    notes?: string;
    jurnal_posted: boolean;
    purchase: Purchase;
    bank_account?: BankAccount;
    jurnal?: Jurnal;
    created_by: {
        name: string;
    };
    created_at: string;
}

interface Props extends SharedData {
    payment: PurchasePayment;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: <DollarSign className="h-4 w-4" />, href: '#' },
    { title: 'Purchase Payments', href: route('purchase-payments.index') },
    { title: 'Detail', href: '#' },
];

const paymentMethodLabels: Record<string, string> = {
    cash: 'Cash',
    bank_transfer: 'Transfer Bank',
    giro: 'Giro',
    credit_card: 'Kartu Kredit',
};

const paymentMethodColors: Record<string, string> = {
    cash: 'bg-green-100 text-green-800',
    bank_transfer: 'bg-blue-100 text-blue-800',
    giro: 'bg-purple-100 text-purple-800',
    credit_card: 'bg-orange-100 text-orange-800',
};

export default function ShowPurchasePayment({ payment }: Props) {
    const { hasPermission } = usePermission();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showPostDialog, setShowPostDialog] = useState(false);

    const handleDelete = () => {
        router.delete(route('purchase-payments.destroy', payment.id));
        setShowDeleteDialog(false);
    };

    const handlePostToJournal = () => {
        router.post(route('purchase-payments.post-to-journal', payment.id));
        setShowPostDialog(false);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Payment ${payment.payment_number}`} />

            <div className="mt-4 space-y-4">
                {/* Header Card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.visit(route('purchase-payments.index'))}
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <DollarSign className="h-5 w-5" />
                                        Detail Purchase Payment
                                    </CardTitle>
                                    <CardDescription>Payment #{payment.payment_number}</CardDescription>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {!payment.jurnal_posted && hasPermission('inventory.purchases.create-payment') && (
                                    <>
                                        <Button variant="outline" size="sm" onClick={() => router.visit(route('purchase-payments.edit', payment.id))} className="gap-2">
                                            <Edit className="h-4 w-4" />
                                            Edit
                                        </Button>
                                        {hasPermission('inventory.purchases.delete') && (
                                            <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)} className="gap-2">
                                                <Trash2 className="h-4 w-4" />
                                                Hapus
                                            </Button>
                                        )}
                                    </>
                                )}
                                {!payment.jurnal_posted && hasPermission('inventory.purchases.post-to-journal') && (
                                    <Button variant="default" size="sm" onClick={() => setShowPostDialog(true)} className="gap-2">
                                        <Send className="h-4 w-4" />
                                        Post to Jurnal
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Status Badge */}
                        <div>
                            {payment.jurnal_posted ? (
                                <Badge variant="default" className="gap-1 px-3 py-1">
                                    <CheckCircle className="h-4 w-4" />
                                    Posted to Jurnal
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="gap-1 px-3 py-1">
                                    <XCircle className="h-4 w-4" />
                                    Draft (Belum Diposting)
                                </Badge>
                            )}
                        </div>

                        {/* Payment Details */}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {/* Left Column */}
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Hash className="mt-1 h-5 w-5 text-gray-400" />
                                    <div className="flex-1">
                                        <div className="text-sm text-gray-500">Payment Number</div>
                                        <div className="font-medium">{payment.payment_number}</div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <FileText className="mt-1 h-5 w-5 text-gray-400" />
                                    <div className="flex-1">
                                        <div className="text-sm text-gray-500">Purchase Order</div>
                                        <div className="font-medium">{payment.purchase.purchase_number}</div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Building2 className="mt-1 h-5 w-5 text-gray-400" />
                                    <div className="flex-1">
                                        <div className="text-sm text-gray-500">Supplier</div>
                                        <div className="font-medium">{payment.purchase.supplier.name}</div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Calendar className="mt-1 h-5 w-5 text-gray-400" />
                                    <div className="flex-1">
                                        <div className="text-sm text-gray-500">Tanggal Payment</div>
                                        <div className="font-medium">{format(new Date(payment.payment_date), 'dd MMMM yyyy', { locale: idLocale })}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <CreditCard className="mt-1 h-5 w-5 text-gray-400" />
                                    <div className="flex-1">
                                        <div className="text-sm text-gray-500">Payment Method</div>
                                        <Badge className={paymentMethodColors[payment.payment_method]}>{paymentMethodLabels[payment.payment_method]}</Badge>
                                    </div>
                                </div>

                                {payment.bank_account && (
                                    <div className="flex items-start gap-3">
                                        <Building2 className="mt-1 h-5 w-5 text-gray-400" />
                                        <div className="flex-1">
                                            <div className="text-sm text-gray-500">Bank Account</div>
                                            <div className="font-medium">{payment.bank_account.account_name}</div>
                                            <div className="text-sm text-gray-600">
                                                {payment.bank_account.bank_name} - {payment.bank_account.account_number}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-start gap-3">
                                    <User className="mt-1 h-5 w-5 text-gray-400" />
                                    <div className="flex-1">
                                        <div className="text-sm text-gray-500">Dibuat Oleh</div>
                                        <div className="font-medium">{payment.created_by.name}</div>
                                        <div className="text-sm text-gray-500">{format(new Date(payment.created_at), 'dd MMM yyyy HH:mm', { locale: idLocale })}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        {payment.notes && (
                            <div className="flex items-start gap-3 rounded-lg border bg-gray-50 p-4">
                                <StickyNote className="mt-1 h-5 w-5 text-gray-400" />
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-500">Catatan</div>
                                    <div className="mt-1 text-gray-700">{payment.notes}</div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Amount Summary */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Ringkasan Pembayaran</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-600">Jumlah Bayar</span>
                                <span className="font-medium">{formatCurrency(payment.amount)}</span>
                            </div>
                            {payment.discount_amount > 0 && (
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-600">Diskon</span>
                                    <span className="font-medium text-green-600">-{formatCurrency(payment.discount_amount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between pt-2">
                                <span className="text-lg font-semibold">Net Amount</span>
                                <span className="text-lg font-bold text-blue-600">{formatCurrency(payment.net_amount)}</span>
                            </div>
                        </div>

                        {/* PO Outstanding Info */}
                        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm text-gray-600">Total PO</div>
                                    <div className="font-medium">{formatCurrency(payment.purchase.total_amount)}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-gray-600">Sisa Hutang</div>
                                    <div className="font-bold text-orange-600">{formatCurrency(payment.purchase.ap_outstanding)}</div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Jurnal Details (if posted) */}
                {payment.jurnal_posted && payment.jurnal && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Jurnal Entry
                            </CardTitle>
                            <CardDescription>Jurnal #{payment.jurnal.nomor_jurnal} - {format(new Date(payment.jurnal.tanggal_jurnal), 'dd MMMM yyyy', { locale: idLocale })}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Kode Akun</TableHead>
                                            <TableHead>Nama Akun</TableHead>
                                            <TableHead>Keterangan</TableHead>
                                            <TableHead className="text-right">Debit</TableHead>
                                            <TableHead className="text-right">Kredit</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {payment.jurnal.details.map((detail, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-mono">{detail.akun.kode_akun}</TableCell>
                                                <TableCell>{detail.akun.nama_akun}</TableCell>
                                                <TableCell>{detail.description}</TableCell>
                                                <TableCell className="text-right font-medium">{detail.debit > 0 ? formatCurrency(detail.debit) : '-'}</TableCell>
                                                <TableCell className="text-right font-medium">{detail.kredit > 0 ? formatCurrency(detail.kredit) : '-'}</TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow className="bg-gray-50 font-bold">
                                            <TableCell colSpan={3}>TOTAL</TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(payment.jurnal.details.reduce((sum, detail) => sum + detail.debit, 0))}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(payment.jurnal.details.reduce((sum, detail) => sum + detail.kredit, 0))}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Purchase Payment?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus payment {payment.payment_number}?
                            Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Post to Journal Confirmation Dialog */}
            <AlertDialog open={showPostDialog} onOpenChange={setShowPostDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Post ke Jurnal?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin posting payment ini ke jurnal? Data akan dicatat
                            ke sistem akuntansi. Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handlePostToJournal}>
                            Post to Jurnal
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
