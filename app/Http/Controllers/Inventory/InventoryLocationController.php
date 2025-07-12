<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Inventory\InventoryLocation;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class InventoryLocationController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = InventoryLocation::query();

        // Apply filters
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('address', 'like', "%{$search}%");
            });
        }

        if ($request->filled('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $locations = $query->orderBy('name')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Inventory/Locations/Index', [
            'locations' => $locations,
            'filters' => $request->only(['search', 'type', 'status']),
            'locationTypes' => ['warehouse', 'store', 'clinic', 'pharmacy'],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Inventory/Locations/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:inventory_locations,code',
            'type' => 'required|in:warehouse,store,clinic,pharmacy',
            'address' => 'nullable|string',
            'description' => 'nullable|string',
            'capacity' => 'nullable|numeric|min:0',
            'status' => 'required|in:active,inactive',
        ]);

        try {
            DB::beginTransaction();

            $location = InventoryLocation::create($validated);

            DB::commit();

            return redirect()->route('inventory.locations.index')
                ->with('success', 'Lokasi inventori berhasil ditambahkan.');
        } catch (\Exception $e) {
            DB::rollback();
            return back()->withErrors(['error' => 'Gagal menambahkan lokasi inventori: ' . $e->getMessage()]);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(InventoryLocation $location)
    {
        $location->load(['stocks.item']);

        return Inertia::render('Inventory/Locations/Show', [
            'location' => $location,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(InventoryLocation $location)
    {
        return Inertia::render('Inventory/Locations/Edit', [
            'location' => $location,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, InventoryLocation $location)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:inventory_locations,code,' . $location->id,
            'type' => 'required|in:warehouse,store,clinic,pharmacy',
            'address' => 'nullable|string',
            'description' => 'nullable|string',
            'capacity' => 'nullable|numeric|min:0',
            'status' => 'required|in:active,inactive',
        ]);

        try {
            DB::beginTransaction();

            $location->update($validated);

            DB::commit();

            return redirect()->route('inventory.locations.index')
                ->with('success', 'Lokasi inventori berhasil diperbarui.');
        } catch (\Exception $e) {
            DB::rollback();
            return back()->withErrors(['error' => 'Gagal memperbarui lokasi inventori: ' . $e->getMessage()]);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(InventoryLocation $location)
    {
        try {
            DB::beginTransaction();

            // Check if location has any stock
            if ($location->stocks()->exists()) {
                return back()->withErrors(['error' => 'Tidak dapat menghapus lokasi yang masih memiliki stok.']);
            }

            $location->delete();

            DB::commit();

            return redirect()->route('inventory.locations.index')
                ->with('success', 'Lokasi inventori berhasil dihapus.');
        } catch (\Exception $e) {
            DB::rollback();
            return back()->withErrors(['error' => 'Gagal menghapus lokasi inventori: ' . $e->getMessage()]);
        }
    }
}
