import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft, DollarSign, Package, Save, Search, Check, ChevronsUpDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { route } from 'ziggy-js';
import { cn } from '@/lib/utils';

interface Purchase {
    id: number;
    purchase_number: string;
    supplier_name: string;
    total_amount: number;
    ap_outstanding: number;
}

interface BankAccount {
    kode_akun: string;
    nama_akun: string;
    saldo: number;
}

interface Props extends SharedData {
    bankAccounts: BankAccount[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: <Package className="h-4 w-4" />, href: '#' },
    { title: 'Purchase Payments', href: route('purchase-payments.index') },
    { title: 'Buat Payment Baru', href: '#' },
];

export default function CreatePurchasePayment({ bankAccounts }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        purchase_id: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'bank_transfer',
        kode_akun_bank: '',
        amount: '',
        discount_amount: '0',
        notes: '',
    });

    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [openBankSelect, setOpenBankSelect] = useState(false);
    const [openPOSelect, setOpenPOSelect] = useState(false);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    // Search Purchase Orders with outstanding AP
    useEffect(() => {
        const fetchPurchases = async () => {
            setIsSearching(true);
            try {
                const response = await fetch(
                    route('purchases.index') + `?has_outstanding=1&per_page=100`,
                    {
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                    }
                );
                const result = await response.json();
                setPurchases(result.data || []);
            } catch (error) {
                console.error('Error fetching PO:', error);
            } finally {
                setIsSearching(false);
            }
        };

        fetchPurchases();
    }, []);

    const handleSelectPurchase = (purchase: Purchase) => {
        setSelectedPurchase(purchase);
        setData('purchase_id', purchase.id.toString());
        setData('amount', purchase.ap_outstanding.toString());
        setOpenPOSelect(false);
    };

    const netAmount = parseFloat(data.amount || '0') - parseFloat(data.discount_amount || '0');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('purchase-payments.store'), {
            preserveState: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Buat Payment Baru" />

            <div className="p-4">
                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div>
                                    <Button type="button" variant="outline" onClick={() => router.visit(route('purchase-payments.index'))} className="gap-2">
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <DollarSign className="h-5 w-5" />
                                        Buat Payment Baru
                                    </CardTitle>
                                    <CardDescription>Catat pembayaran untuk purchase order yang sudah ada</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Search Purchase Order */}
                            <div className="space-y-2">
                                <Label htmlFor="purchase_id">
                                    Cari Purchase Order <span className="text-red-500">*</span>
                                </Label>
                                <Popover open={openPOSelect} onOpenChange={setOpenPOSelect}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openPOSelect}
                                            className="w-full justify-between h-auto py-2"
                                            type="button"
                                        >
                                            {selectedPurchase ? (
                                                <div className="flex items-center justify-between w-full">
                                                    <div className="text-left">
                                                        <div className="font-medium">{selectedPurchase.purchase_number}</div>
                                                        <div className="text-sm text-muted-foreground">{selectedPurchase.supplier_name}</div>
                                                    </div>
                                                    <span className="ml-2 font-semibold text-blue-600 shrink-0">
                                                        {formatCurrency(selectedPurchase.ap_outstanding)}
                                                    </span>
                                                </div>
                                            ) : (
                                                "Pilih Purchase Order..."
                                            )}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0" align="start" style={{ width: 'var(--radix-popover-trigger-width)' }}>
                                        <Command>
                                            <CommandInput placeholder="Cari nomor PO atau supplier..." />
                                            <CommandEmpty>
                                                {isSearching ? 'Mencari...' : 'PO tidak ditemukan atau tidak ada outstanding'}
                                            </CommandEmpty>
                                            <CommandGroup className="max-h-[300px] overflow-auto">
                                                {purchases.map((purchase) => (
                                                    <CommandItem
                                                        key={purchase.id}
                                                        value={`${purchase.purchase_number} ${purchase.supplier_name}`}
                                                        onSelect={() => handleSelectPurchase(purchase)}
                                                        className="cursor-pointer"
                                                    >
                                                        <Check
                                                            className={cn(
                                                                'mr-2 h-4 w-4',
                                                                selectedPurchase?.id === purchase.id
                                                                    ? 'opacity-100'
                                                                    : 'opacity-0'
                                                            )}
                                                        />
                                                        <div className="flex items-center justify-between w-full">
                                                            <div className="flex-1">
                                                                <div className="font-medium">{purchase.purchase_number}</div>
                                                                <div className="text-sm text-muted-foreground">{purchase.supplier_name}</div>
                                                            </div>
                                                            <div className="ml-4 font-semibold text-blue-600 shrink-0">
                                                                {formatCurrency(purchase.ap_outstanding)}
                                                            </div>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                {errors.purchase_id && <p className="text-sm text-red-500">{errors.purchase_id}</p>}

                                {/* Selected Purchase Info */}
                                {selectedPurchase && (
                                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="font-medium">PO: {selectedPurchase.purchase_number}</div>
                                                <div className="text-sm text-gray-600">Supplier: {selectedPurchase.supplier_name}</div>
                                                <div className="mt-1 text-sm">
                                                    Total PO: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(selectedPurchase.total_amount)}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-gray-500">Outstanding</div>
                                                <div className="text-lg font-bold text-blue-600">
                                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(selectedPurchase.ap_outstanding)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <hr />

                            {/* Payment Details */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="payment_date">
                                        Tanggal Payment <span className="text-red-500">*</span>
                                    </Label>
                                    <Input id="payment_date" type="date" value={data.payment_date} onChange={(e) => setData('payment_date', e.target.value)} required />
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
                                                className="w-full justify-between h-auto py-2"
                                            >
                                                {data.kode_akun_bank ? (
                                                    <div className="flex items-center justify-between w-full">
                                                        <span className="truncate text-left">
                                                            {bankAccounts.find((acc) => acc.kode_akun === data.kode_akun_bank)?.kode_akun} - {bankAccounts.find((acc) => acc.kode_akun === data.kode_akun_bank)?.nama_akun}
                                                        </span>
                                                        <span className={cn(
                                                            "ml-2 font-semibold shrink-0",
                                                            (bankAccounts.find((acc) => acc.kode_akun === data.kode_akun_bank)?.saldo || 0) >= 0 
                                                                ? "text-green-600" 
                                                                : "text-red-600"
                                                        )}>
                                                            {formatCurrency(bankAccounts.find((acc) => acc.kode_akun === data.kode_akun_bank)?.saldo || 0)}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    "Pilih Akun Bank..."
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
                                                                    data.kode_akun_bank === account.kode_akun
                                                                        ? 'opacity-100'
                                                                        : 'opacity-0'
                                                                )}
                                                            />
                                                            <div className="flex items-center justify-between w-full">
                                                                <div className="flex-1">
                                                                    <div className="font-medium">{account.kode_akun} - {account.nama_akun}</div>
                                                                </div>
                                                                <div className={cn(
                                                                    "ml-4 font-semibold",
                                                                    account.saldo >= 0 ? "text-green-600" : "text-red-600"
                                                                )}>
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
                                        max={selectedPurchase?.ap_outstanding}
                                    />
                                    {errors.amount && <p className="text-sm text-red-500">{errors.amount}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="discount_amount">Diskon (jika ada)</Label>
                                    <Input id="discount_amount" type="number" step="0.01" value={data.discount_amount} onChange={(e) => setData('discount_amount', e.target.value)} />
                                    {errors.discount_amount && <p className="text-sm text-red-500">{errors.discount_amount}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label>Net Amount</Label>
                                    <div className="rounded-lg border bg-gray-50 px-3 py-2 font-bold text-blue-600">
                                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(netAmount)}
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                                <Label htmlFor="notes">Catatan</Label>
                                <Textarea id="notes" placeholder="Catatan tambahan (opsional)" value={data.notes} onChange={(e) => setData('notes', e.target.value)} rows={3} />
                                {errors.notes && <p className="text-sm text-red-500">{errors.notes}</p>}
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => router.visit(route('purchase-payments.index'))} disabled={processing}>
                                    Batal
                                </Button>
                                <Button type="submit" disabled={processing} className="gap-2">
                                    <Save className="h-4 w-4" />
                                    {processing ? 'Menyimpan...' : 'Simpan Payment'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
