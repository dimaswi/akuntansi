<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Inventory\Purchase;
use App\Models\Inventory\PurchasePayment;
use App\Models\Akuntansi\DaftarAkun;
use App\Services\Inventory\PurchasePaymentAccountingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PurchasePaymentController extends Controller
{
    protected $accountingService;

    public function __construct(PurchasePaymentAccountingService $accountingService)
    {
        $this->accountingService = $accountingService;
    }

    /**
     * Display a listing of purchase payments
     */
    public function index(Request $request)
    {
        $filters = [
            'search' => $request->get('search', ''),
            'payment_method' => $request->get('payment_method', ''),
            'date_from' => $request->get('date_from', ''),
            'date_to' => $request->get('date_to', ''),
            'posted_only' => $request->get('posted_only', ''),
            'perPage' => (int) $request->get('perPage', 15),
        ];

        $query = PurchasePayment::with(['purchase.supplier', 'bankAccount', 'createdBy'])
            ->orderBy('payment_date', 'desc')
            ->orderBy('id', 'desc');

        // Filter search
        if ($filters['search']) {
            $query->where(function ($q) use ($filters) {
                $q->where('payment_number', 'like', "%{$filters['search']}%")
                  ->orWhereHas('purchase', function ($q) use ($filters) {
                      $q->where('purchase_number', 'like', "%{$filters['search']}%");
                  });
            });
        }

        // Filter payment method
        if ($filters['payment_method']) {
            $query->where('payment_method', $filters['payment_method']);
        }

        // Filter date range
        if ($filters['date_from']) {
            $query->whereDate('payment_date', '>=', $filters['date_from']);
        }
        if ($filters['date_to']) {
            $query->whereDate('payment_date', '<=', $filters['date_to']);
        }

        // Filter posted only
        if ($filters['posted_only']) {
            $query->where('jurnal_posted', true);
        }

        $payments = $query->paginate($filters['perPage']);

        return Inertia::render('inventory/purchase-payments/index', [
            'payments' => $payments,
            'filters' => $filters,
        ]);
    }

    /**
     * Show the form for creating a new payment
     */
    public function create(Request $request)
    {
        $purchaseId = $request->get('purchase_id');
        
        $purchase = null;
        if ($purchaseId) {
            $purchase = Purchase::with(['supplier', 'payments'])->findOrFail($purchaseId);
            
            // Check if purchase can be paid
            if (!in_array($purchase->status, ['approved', 'ordered', 'partial', 'completed'])) {
                return back()->withErrors(['error' => 'Purchase Order belum bisa dibayar. Status harus Approved/Ordered/Completed.']);
            }
        }

        // Get bank accounts from COA (jenis_akun = aset, kas dan bank) with balance
        $bankAccountsRaw = DaftarAkun::where('jenis_akun', 'aset')
            ->where(function($query) {
                $query->where('nama_akun', 'like', '%bank%')
                      ->orWhere('nama_akun', 'like', '%kas%');
            })
            ->where('kode_akun', 'not like', '111')  // Exclude header account
            ->orderBy('kode_akun')
            ->get();

        // Add balance to each account
        $bankAccounts = $bankAccountsRaw->map(function($account) {
            return [
                'kode_akun' => $account->kode_akun,
                'nama_akun' => $account->nama_akun,
                'saldo' => $account->getBalance(),
            ];
        });

        return Inertia::render('inventory/purchase-payments/create', [
            'purchase' => $purchase,
            'bankAccounts' => $bankAccounts,
        ]);
    }

    /**
     * Store a newly created payment
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'purchase_id' => 'required|exists:purchases,id',
            'payment_date' => 'required|date',
            'payment_method' => 'required|in:cash,bank_transfer,giro,credit_card',
            'kode_akun_bank' => 'required_unless:payment_method,cash|exists:daftar_akun,kode_akun',
            'amount' => 'required|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        // Generate payment number
        $validated['payment_number'] = PurchasePayment::generatePaymentNumber();
        $validated['created_by'] = $request->user()->id;
        $validated['discount_amount'] = $validated['discount_amount'] ?? 0;

        // Validate amount not exceeding outstanding
        $purchase = Purchase::findOrFail($validated['purchase_id']);
        $outstanding = $purchase->total_amount - $purchase->payments()->sum('amount');
        
        if ($validated['amount'] > $outstanding) {
            return back()->withErrors(['amount' => "Jumlah pembayaran tidak boleh melebihi sisa hutang: Rp " . number_format($outstanding, 0, ',', '.')]);
        }

        $payment = PurchasePayment::create($validated);

        return redirect()->route('purchase-payments.show', $payment->id)
            ->with('success', 'Pembayaran berhasil dibuat');
    }

    /**
     * Display the specified payment
     */
    public function show($id)
    {
        $payment = PurchasePayment::with([
            'purchase.supplier',
            'jurnal.details',
            'createdBy',
            'approvedBy'
        ])->findOrFail($id);

        return Inertia::render('inventory/purchase-payments/show', [
            'payment' => $payment,
        ]);
    }

    /**
     * Show the form for editing
     */
    public function edit($id)
    {
        $payment = PurchasePayment::with('purchase.supplier')->findOrFail($id);

        if (!$payment->canBeEdited()) {
            return back()->withErrors(['error' => 'Pembayaran tidak dapat diedit (sudah diposting atau diapprove)']);
        }

        // Get bank accounts from COA (jenis_akun = aset, kas dan bank) with balance
        $bankAccountsRaw = DaftarAkun::where('jenis_akun', 'aset')
            ->where(function($query) {
                $query->where('nama_akun', 'like', '%bank%')
                      ->orWhere('nama_akun', 'like', '%kas%');
            })
            ->where('kode_akun', 'not like', '111')  // Exclude header account
            ->orderBy('kode_akun')
            ->get();

        // Add balance to each account
        $bankAccounts = $bankAccountsRaw->map(function($account) {
            return [
                'kode_akun' => $account->kode_akun,
                'nama_akun' => $account->nama_akun,
                'saldo' => $account->getBalance(),
            ];
        });

        return Inertia::render('inventory/purchase-payments/edit', [
            'payment' => $payment,
            'bankAccounts' => $bankAccounts,
        ]);
    }

    /**
     * Update the specified payment
     */
    public function update(Request $request, $id)
    {
        $payment = PurchasePayment::findOrFail($id);

        if (!$payment->canBeEdited()) {
            return back()->withErrors(['error' => 'Pembayaran tidak dapat diedit']);
        }

        $validated = $request->validate([
            'payment_date' => 'required|date',
            'payment_method' => 'required|in:cash,bank_transfer,giro,credit_card',
            'kode_akun_bank' => 'required_unless:payment_method,cash|exists:daftar_akun,kode_akun',
            'amount' => 'required|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $validated['discount_amount'] = $validated['discount_amount'] ?? 0;

        $payment->update($validated);

        return redirect()->route('purchase-payments.show', $payment->id)
            ->with('success', 'Pembayaran berhasil diupdate');
    }

    /**
     * Remove the specified payment
     */
    public function destroy($id)
    {
        $payment = PurchasePayment::findOrFail($id);

        if (!$payment->canBeDeleted()) {
            return back()->withErrors(['error' => 'Pembayaran tidak dapat dihapus (sudah diposting ke jurnal)']);
        }

        $payment->delete();

        return redirect()->route('purchase-payments.index')
            ->with('success', 'Pembayaran berhasil dihapus');
    }

    /**
     * Post payment to journal
     */
    public function postToJournal($id)
    {
        $payment = PurchasePayment::findOrFail($id);

        if ($payment->jurnal_posted) {
            return back()->withErrors(['error' => 'Pembayaran sudah diposting ke jurnal']);
        }

        try {
            $jurnal = $this->accountingService->createPaymentJournal($payment);

            return redirect()->route('purchase-payments.show', $payment->id)
                ->with('success', "Pembayaran berhasil diposting ke jurnal #{$jurnal->nomor_jurnal}");
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Gagal posting ke jurnal: ' . $e->getMessage()]);
        }
    }
}
