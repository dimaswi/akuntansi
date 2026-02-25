<?php

namespace App\Http\Controllers\Aset;

use App\Http\Controllers\Controller;
use App\Models\Aset\Asset;
use App\Models\Aset\AssetMaintenance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AssetMaintenanceController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->only(['search', 'status', 'type', 'perPage']);
        $perPage = $filters['perPage'] ?? 10;

        $maintenances = AssetMaintenance::query()
            ->with(['asset:id,code,name', 'creator:id,name'])
            ->when($filters['search'] ?? null, function ($q, $s) {
                $q->where('maintenance_number', 'like', "%{$s}%")
                    ->orWhereHas('asset', fn ($query) => $query->where('name', 'like', "%{$s}%")->orWhere('code', 'like', "%{$s}%"));
            })
            ->when($filters['status'] ?? null, fn ($q, $v) => $q->where('status', $v))
            ->when($filters['type'] ?? null, fn ($q, $v) => $q->where('type', $v))
            ->orderByDesc('scheduled_date')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('aset/maintenances/index', [
            'maintenances' => $maintenances,
            'filters' => $filters,
        ]);
    }

    public function create()
    {
        return Inertia::render('aset/maintenances/create', [
            'assets' => Asset::active()->orderBy('name')->get(['id', 'code', 'name']),
            'generatedNumber' => AssetMaintenance::generateNumber(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'maintenance_number' => 'required|string|max:30|unique:asset_maintenances,maintenance_number',
            'asset_id' => 'required|exists:assets,id',
            'type' => 'required|in:preventive,corrective,emergency',
            'description' => 'required|string',
            'scheduled_date' => 'required|date',
            'cost' => 'nullable|numeric|min:0',
            'vendor' => 'nullable|string|max:255',
            'vendor_contact' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $validated['status'] = 'scheduled';
        $validated['created_by'] = Auth::id();

        AssetMaintenance::create($validated);

        return redirect()->route('aset.maintenances.index')
            ->with('success', 'Jadwal maintenance berhasil ditambahkan.');
    }

    public function show(AssetMaintenance $maintenance)
    {
        $maintenance->load(['asset:id,code,name,brand,model,location,department_id', 'asset.department:id,name', 'creator:id,name']);

        return Inertia::render('aset/maintenances/show', [
            'maintenance' => $maintenance,
        ]);
    }

    public function edit(AssetMaintenance $maintenance)
    {
        $maintenance->load('asset');

        return Inertia::render('aset/maintenances/edit', [
            'maintenance' => $maintenance,
            'assets' => Asset::active()->orderBy('name')->get(['id', 'code', 'name']),
        ]);
    }

    public function update(Request $request, AssetMaintenance $maintenance)
    {
        $validated = $request->validate([
            'asset_id' => 'required|exists:assets,id',
            'type' => 'required|in:preventive,corrective,emergency',
            'description' => 'required|string',
            'scheduled_date' => 'required|date',
            'completed_date' => 'nullable|date',
            'cost' => 'nullable|numeric|min:0',
            'vendor' => 'nullable|string|max:255',
            'vendor_contact' => 'nullable|string|max:255',
            'status' => 'required|in:scheduled,in_progress,completed,cancelled',
            'notes' => 'nullable|string',
            'result' => 'nullable|string',
        ]);

        // If marking completed, set completed_date if not provided
        if ($validated['status'] === 'completed' && empty($validated['completed_date'])) {
            $validated['completed_date'] = now()->toDateString();
        }

        // If marking maintenance, update asset status
        $maintenance->update($validated);

        $asset = Asset::find($validated['asset_id']);
        if ($validated['status'] === 'in_progress' && $asset) {
            $asset->update(['status' => 'maintenance']);
        } elseif (in_array($validated['status'], ['completed', 'cancelled']) && $asset && $asset->status === 'maintenance') {
            $asset->update(['status' => 'active']);
        }

        return redirect()->route('aset.maintenances.show', $maintenance)
            ->with('success', 'Maintenance berhasil diperbarui.');
    }

    public function destroy(AssetMaintenance $maintenance)
    {
        if ($maintenance->status === 'completed') {
            return back()->with('error', 'Maintenance yang sudah selesai tidak bisa dihapus.');
        }

        $maintenance->delete();

        return redirect()->route('aset.maintenances.index')
            ->with('success', 'Maintenance berhasil dihapus.');
    }
}
