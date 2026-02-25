import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Check, ChevronsUpDown, DollarSign, Save } from 'lucide-react';
import { useState } from 'react';
import { route } from 'ziggy-js';

interface BankAccount {
    kode_akun: string;
    nama_akun: string;
    saldo: number;
}

interface Purchase {
    purchase_number: string;
    supplier: {
        name: string;
    };
    total_amount: number;
    ap_outstanding: number;
}

interface PurchasePayment {
    id: number;
    payment_number: string;
    payment_date: string;
    payment_method: string;
    kode_akun_bank: string | null;
    amount: number;
    discount_amount: number;
    notes?: string;
    purchase: Purchase;
}

interface Props extends SharedData {
    payment: PurchasePayment;
    bankAccounts: BankAccount[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: <DollarSign className="h-4 w-4" />, href: '#' },
    { title: 'Purchase Payments', href: route('purchase-payments.index') },
    { title: 'Edit', href: '#' },
];

export default function EditPurchasePayment({ payment, bankAccounts }: Props) {
    const [openBankSelect, setOpenBankSelect] = useState(false);

    const { data, setData, put, processing, errors } = useForm({
        payment_date: payment.payment_date,
        payment_method: payment.payment_method,
        kode_akun_bank: payment.kode_akun_bank || '',
        amount: payment.amount.toString(),
        discount_amount: payment.discount_amount.toString(),
        notes: payment.notes || '',
    });

    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const netAmount = parseFloat(data.amount || '0') - parseFloat(data.discount_amount || '0');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('purchase-payments.update', payment.id), {
            preserveState: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Payment" />

            <div className="p-4">
                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.visit(route('purchase-payments.show', payment.id))}
                                        className="gap-2"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                </div>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5" />
                                    Edit Payment - {payment.payment_number}
                                </CardTitle>
                                <CardDescription>Perbarui detail pembayaran untuk PO ini</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* PO Info (Read-only) */}
                            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="font-medium">PO: {payment.purchase.purchase_number}</div>
                                        <div className="text-sm text-gray-600">Supplier: {payment.purchase.supplier.name}</div>
                                        <div className="mt-1 text-sm">Total PO: {formatCurrency(payment.purchase.total_amount)}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-gray-500">Outstanding</div>
                                        <div className="text-lg font-bold text-blue-600">{formatCurrency(payment.purchase.ap_outstanding)}</div>
                                    </div>
                                </div>
                            </div>

                            <hr />

                            {/* Payment Details */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="payment_date">
                                        Tanggal Payment <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="payment_date"
                                        type="date"
                                        value={data.payment_date}
                                        onChange={(e) => setData('payment_date', e.target.value)}
                                        required
                                    />
                                    {errors.payment_date && <p className="text-sm text-red-500">{errors.payment_date}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="payment_method">
                                        Metode Pembayaran <span className="text-red-500">*</span>
                                    </Label>
                                    <Select value={data.payment_method} onValueChange={(value) => setData('payment_method', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih Metode" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="cash">Cash</SelectItem>
                                            <SelectItem value="bank_transfer">Transfer Bank</SelectItem>
                                            <SelectItem value="giro">Giro</SelectItem>
                                            <SelectItem value="credit_card">Kartu Kredit</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.payment_method && <p className="text-sm text-red-500">{errors.payment_method}</p>}
                                </div>
                            </div>

                            {/* Bank Account (only for non-cash) */}
                            {data.payment_method !== 'cash' && (
                                <div className="space-y-2">
                                    <Label htmlFor="kode_akun_bank">
                                        Akun Bank (COA) <span className="text-red-500">*</span>
                                    </Label>
                                    <Popover open={openBankSelect} onOpenChange={setOpenBankSelect}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={openBankSelect}
                                                className="h-auto w-full justify-between py-2"
                                            >
                                                {data.kode_akun_bank ? (
                                                    <div className="flex w-full items-center justify-between">
                                                        <span className="truncate text-left">
                                                            {bankAccounts.find((acc) => acc.kode_akun === data.kode_akun_bank)?.kode_akun} -{' '}
                                                            {bankAccounts.find((acc) => acc.kode_akun === data.kode_akun_bank)?.nama_akun}
                                                        </span>
                                                        <span
                                                            className={cn(
                                                                'ml-2 shrink-0 font-semibold',
                                                                (bankAccounts.find((acc) => acc.kode_akun === data.kode_akun_bank)?.saldo || 0) >= 0
                                                                    ? 'text-green-600'
                                                                    : 'text-red-600',
                                                            )}
                                                        >
                                                            {formatCurrency(
                                                                bankAccounts.find((acc) => acc.kode_akun === data.kode_akun_bank)?.saldo || 0,
                                                            )}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    'Pilih Akun Bank...'
                                                )}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-full p-0" align="start" style={{ width: 'var(--radix-popover-trigger-width)' }}>
                                            <Command>
                                                <CommandInput placeholder="Cari akun bank..." />
                                                <CommandEmpty>Akun tidak ditemukan</CommandEmpty>
                                                <CommandGroup className="max-h-[300px] overflow-auto">
                                                    {bankAccounts.map((account) => (
                                                        <CommandItem
                                                            key={account.kode_akun}
                                                            value={`${account.kode_akun} ${account.nama_akun}`}
                                                            onSelect={() => {
                                                                setData('kode_akun_bank', account.kode_akun);
                                                                setOpenBankSelect(false);
                                                            }}
                                                            className="cursor-pointer"
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    'mr-2 h-4 w-4',
                                                                    data.kode_akun_bank === account.kode_akun ? 'opacity-100' : 'opacity-0',
                                                                )}
                                                            />
                                                            <div className="flex w-full items-center justify-between">
                                                                <div className="flex-1">
                                                                    <div className="font-medium">
                                                                        {account.kode_akun} - {account.nama_akun}
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    className={cn(
                                                                        'ml-4 font-semibold',
                                                                        account.saldo >= 0 ? 'text-green-600' : 'text-red-600',
                                                                    )}
                                                                >
                                                                    {formatCurrency(account.saldo)}
                                                                </div>
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    {errors.kode_akun_bank && <p className="text-sm text-red-500">{errors.kode_akun_bank}</p>}
                                </div>
                            )}

                            {/* Amount Details */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="amount">
                                        Jumlah Bayar <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        step="0.01"
                                        value={data.amount}
                                        onChange={(e) => setData('amount', e.target.value)}
                                        required
                                        max={payment.purchase.ap_outstanding + payment.amount} // Allow current amount
                                    />
                                    {errors.amount && <p className="text-sm text-red-500">{errors.amount}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="discount_amount">Diskon (jika ada)</Label>
                                    <Input
                                        id="discount_amount"
                                        type="number"
                                        step="0.01"
                                        value={data.discount_amount}
                                        onChange={(e) => setData('discount_amount', e.target.value)}
                                    />
                                    {errors.discount_amount && <p className="text-sm text-red-500">{errors.discount_amount}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label>Net Amount</Label>
                                    <div className="rounded-lg border bg-gray-50 px-3 py-2 font-bold text-blue-600">
                                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(
                                            netAmount,
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                                <Label htmlFor="notes">Catatan</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Catatan tambahan (opsional)"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows={3}
                                />
                                {errors.notes && <p className="text-sm text-red-500">{errors.notes}</p>}
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end gap-2 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.visit(route('purchase-payments.show', payment.id))}
                                    disabled={processing}
                                >
                                    Batal
                                </Button>
                                <Button type="submit" disabled={processing} className="gap-2">
                                    <Save className="h-4 w-4" />
                                    {processing ? 'Menyimpan...' : 'Update Payment'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
