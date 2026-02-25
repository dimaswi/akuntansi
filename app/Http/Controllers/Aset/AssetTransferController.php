<?php

namespace App\Http\Controllers\Aset;

use App\Http\Controllers\Controller;
use App\Models\Aset\Asset;
use App\Models\Aset\AssetTransfer;
use App\Models\Inventory\Department;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AssetTransferController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->only(['search', 'status', 'perPage']);
        $perPage = $filters['perPage'] ?? 10;

        $transfers = AssetTransfer::query()
            ->with([
                'asset:id,code,name',
                'fromDepartment:id,name',
                'toDepartment:id,name',
                'creator:id,name',
                'approver:id,name',
            ])
            ->when($filters['search'] ?? null, function ($q, $s) {
                $q->where('transfer_number', 'like', "%{$s}%")
                    ->orWhereHas('asset', fn ($query) => $query->where('name', 'like', "%{$s}%")->orWhere('code', 'like', "%{$s}%"));
            })
            ->when($filters['status'] ?? null, fn ($q, $v) => $q->where('status', $v))
            ->orderByDesc('created_at')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('aset/transfers/index', [
            'transfers' => $transfers,
            'filters' => $filters,
        ]);
    }

    public function create()
    {
        $assets = Asset::where('status', 'active')
            ->whereNotNull('department_id')
            ->with('department:id,name')
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'department_id']);

        return Inertia::render('aset/transfers/create', [
            'assets' => $assets,
            'departments' => Department::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'generatedNumber' => AssetTransfer::generateNumber(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'transfer_number' => 'required|string|max:30|unique:asset_transfers,transfer_number',
            'asset_id' => 'required|exists:assets,id',
            'from_department_id' => 'required|exists:departments,id',
            'to_department_id' => 'required|exists:departments,id|different:from_department_id',
            'transfer_date' => 'required|date',
            'reason' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $validated['status'] = 'pending';
        $validated['created_by'] = Auth::id();

        AssetTransfer::create($validated);

        return redirect()->route('aset.transfers.index')
            ->with('success', 'Pengajuan transfer aset berhasil dibuat.');
    }

    public function show(AssetTransfer $transfer)
    {
        $transfer->load([
            'asset:id,code,name,brand,model,serial_number,acquisition_cost,current_book_value',
            'fromDepartment:id,name',
            'toDepartment:id,name',
            'creator:id,name',
            'approver:id,name',
        ]);

        return Inertia::render('aset/transfers/show', [
            'transfer' => $transfer,
        ]);
    }

    /**
     * Approve transfer
     */
    public function approve(AssetTransfer $transfer)
    {
        if ($transfer->status !== 'pending') {
            return back()->with('error', 'Hanya transfer berstatus pending yang bisa diapprove.');
        }

        $transfer->update([
            'status' => 'approved',
            'approved_by' => Auth::id(),
            'approved_at' => now(),
        ]);

        return back()->with('success', 'Transfer berhasil diapprove.');
    }

    /**
     * Complete transfer - actually move the asset
     */
    public function complete(AssetTransfer $transfer)
    {
        if ($transfer->status !== 'approved') {
            return back()->with('error', 'Hanya transfer berstatus approved yang bisa diselesaikan.');
        }

        DB::transaction(function () use ($transfer) {
            $transfer->update(['status' => 'completed']);

            // Update asset's department
            $transfer->asset->update([
                'department_id' => $transfer->to_department_id,
            ]);
        });

        return back()->with('success', 'Transfer aset berhasil diselesaikan.');
    }

    /**
     * Cancel transfer
     */
    public function cancel(AssetTransfer $transfer)
    {
        if (in_array($transfer->status, ['completed', 'cancelled'])) {
            return back()->with('error', 'Transfer ini tidak bisa dibatalkan.');
        }

        $transfer->update(['status' => 'cancelled']);

        return back()->with('success', 'Transfer berhasil dibatalkan.');
    }
}
