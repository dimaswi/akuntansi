<?php

namespace App\Http\Controllers\Aset;

use App\Http\Controllers\Controller;
use App\Models\Aset\Asset;
use App\Models\Aset\AssetDisposal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AssetDisposalController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->only(['search', 'status', 'disposal_method', 'perPage']);
        $perPage = $filters['perPage'] ?? 10;

        $disposals = AssetDisposal::query()
            ->with(['asset:id,code,name', 'creator:id,name', 'approver:id,name'])
            ->when($filters['search'] ?? null, function ($q, $s) {
                $q->where('disposal_number', 'like', "%{$s}%")
                    ->orWhereHas('asset', fn ($query) => $query->where('name', 'like', "%{$s}%")->orWhere('code', 'like', "%{$s}%"));
            })
            ->when($filters['status'] ?? null, fn ($q, $v) => $q->where('status', $v))
            ->when($filters['disposal_method'] ?? null, fn ($q, $v) => $q->where('disposal_method', $v))
            ->orderByDesc('created_at')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('aset/disposals/index', [
            'disposals' => $disposals,
            'filters' => $filters,
        ]);
    }

    public function create()
    {
        $assets = Asset::where('status', 'active')
            ->with('department:id,name')
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'department_id', 'current_book_value', 'acquisition_cost']);

        return Inertia::render('aset/disposals/create', [
            'assets' => $assets,
            'generatedNumber' => AssetDisposal::generateNumber(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'disposal_number' => 'required|string|max:30|unique:asset_disposals,disposal_number',
            'asset_id' => 'required|exists:assets,id',
            'disposal_date' => 'required|date',
            'disposal_method' => 'required|in:sale,scrap,donation,trade_in,write_off',
            'disposal_price' => 'required|numeric|min:0',
            'reason' => 'required|string',
            'buyer_info' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $asset = Asset::findOrFail($validated['asset_id']);

        // Cegah double disposal untuk aset yang sama
        $existingDisposal = AssetDisposal::where('asset_id', $asset->id)
            ->whereIn('status', ['pending', 'approved'])
            ->exists();

        if ($existingDisposal) {
            return back()->with('error', 'Aset ini sudah memiliki disposal yang sedang diproses.');
        }

        if ($asset->status === 'disposed') {
            return back()->with('error', 'Aset ini sudah dihapusbukukan.');
        }

        $validated['book_value_at_disposal'] = $asset->current_book_value;
        $validated['gain_loss'] = $validated['disposal_price'] - $asset->current_book_value;
        $validated['status'] = 'pending';
        $validated['created_by'] = Auth::id();

        AssetDisposal::create($validated);

        return redirect()->route('aset.disposals.index')
            ->with('success', 'Pengajuan disposal aset berhasil dibuat.');
    }

    public function show(AssetDisposal $disposal)
    {
        $disposal->load([
            'asset:id,code,name,acquisition_cost,current_book_value,accumulated_depreciation,category_id,department_id',
            'asset.category:id,name',
            'asset.department:id,name',
            'creator:id,name',
            'approver:id,name',
        ]);

        return Inertia::render('aset/disposals/show', [
            'disposal' => $disposal,
        ]);
    }

    /**
     * Approve disposal
     */
    public function approve(AssetDisposal $disposal)
    {
        if ($disposal->status !== 'pending') {
            return back()->with('error', 'Hanya disposal berstatus pending yang bisa diapprove.');
        }

        DB::transaction(function () use ($disposal) {
            $disposal->update([
                'status' => 'approved',
                'approved_by' => Auth::id(),
                'approved_at' => now(),
            ]);
        });

        return back()->with('success', 'Disposal berhasil diapprove.');
    }

    /**
     * Complete disposal - actually dispose the asset
     */
    public function complete(AssetDisposal $disposal)
    {
        if ($disposal->status !== 'approved') {
            return back()->with('error', 'Hanya disposal berstatus approved yang bisa diselesaikan.');
        }

        DB::transaction(function () use ($disposal) {
            $disposal->update(['status' => 'completed']);

            // Update asset status to disposed
            $disposal->asset->update(['status' => 'disposed']);
        });

        return back()->with('success', 'Disposal berhasil diselesaikan. Aset telah dihapusbukukan.');
    }

    /**
     * Cancel disposal
     */
    public function cancel(AssetDisposal $disposal)
    {
        if (in_array($disposal->status, ['completed', 'cancelled'])) {
            return back()->with('error', 'Disposal ini tidak bisa dibatalkan.');
        }

        $disposal->update(['status' => 'cancelled']);

        return back()->with('success', 'Disposal berhasil dibatalkan.');
    }
}
