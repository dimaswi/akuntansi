<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Repositories\Inventory\SupplierRepositoryInterface;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;

class SupplierController extends Controller
{
    protected SupplierRepositoryInterface $supplierRepository;

    public function __construct(SupplierRepositoryInterface $supplierRepository)
    {
        $this->supplierRepository = $supplierRepository;
    }

    /**
     * Display a listing of suppliers
     */
    public function index(Request $request)
    {
        $user = $request->user()->load('role');
        $isLogistics = $user->isLogistics();
        
        $filters = [
            'search' => $request->get('search'),
            'is_active' => $request->get('is_active') === '1' ? true : ($request->get('is_active') === '0' ? false : null),
            'perPage' => $request->get('perPage', 15),
        ];

        $suppliers = $this->supplierRepository->paginate($filters, $filters['perPage']);

        return Inertia::render('inventory/suppliers/index', [
            'suppliers' => $suppliers,
            'filters' => $filters,
            'isLogistics' => $isLogistics,
        ]);
    }

    /**
     * Show the form for creating a new supplier
     */
    public function create()
    {
        $user = request()->user()->load('role');
        $isLogistics = $user->isLogistics();
        
        // Only logistics can create suppliers
        if (!$isLogistics) {
            abort(403, 'Unauthorized access. Only logistics role can manage suppliers.');
        }
        
        return Inertia::render('inventory/suppliers/create', [
            'isLogistics' => $isLogistics,
        ]);
    }

    /**
     * Store a newly created supplier
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:100|unique:suppliers,email',
            'is_active' => 'required|boolean',
        ]);

        try {
            $this->supplierRepository->create($validated);
            return redirect()->route('suppliers.index')->with('success', 'Supplier berhasil ditambahkan.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Gagal menambahkan supplier: ' . $e->getMessage()]);
        }
    }

    /**
     * Display the specified supplier
     */
    public function show(int $id)
    {
        $supplier = $this->supplierRepository->find($id);
        
        if (!$supplier) {
            abort(404);
        }

        return Inertia::render('inventory/suppliers/show', [
            'supplier' => $supplier,
        ]);
    }

    /**
     * Show the form for editing the specified supplier
     */
    public function edit(int $id)
    {
        $supplier = $this->supplierRepository->find($id);
        
        if (!$supplier) {
            abort(404);
        }

        return Inertia::render('inventory/suppliers/edit', [
            'supplier' => $supplier,
        ]);
    }

    /**
     * Update the specified supplier
     */
    public function update(Request $request, int $id): RedirectResponse
    {
        $supplier = $this->supplierRepository->find($id);
        
        if (!$supplier) {
            abort(404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:100|unique:suppliers,email,' . $id,
            'is_active' => 'required|boolean',
        ]);

        try {
            $this->supplierRepository->update($id, $validated);
            return redirect()->route('suppliers.index')->with('success', 'Supplier berhasil diupdate.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Gagal mengupdate supplier: ' . $e->getMessage()]);
        }
    }

    /**
     * Remove the specified supplier
     */
    public function destroy(int $id): RedirectResponse
    {
        try {
            $this->supplierRepository->delete($id);
            return redirect()->route('suppliers.index')->with('success', 'Supplier berhasil dihapus.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Gagal menghapus supplier: ' . $e->getMessage()]);
        }
    }

    /**
     * Toggle supplier status
     */
    public function toggleStatus(int $id): RedirectResponse
    {
        try {
            $supplier = $this->supplierRepository->toggleStatus($id);
            $statusText = $supplier->is_active ? 'diaktifkan' : 'dinonaktifkan';
            return back()->with('success', "Supplier berhasil {$statusText}.");
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Gagal mengubah status supplier: ' . $e->getMessage()]);
        }
    }

    /**
     * Get suppliers for API/AJAX (for searchable dropdowns)
     */
    public function api(Request $request): JsonResponse
    {
        $search = $request->get('search', '');
        $limit = $request->get('limit', 10);
        
        if (!empty($search)) {
            $suppliers = $this->supplierRepository->search($search, (int) $limit);
        } else {
            $suppliers = $this->supplierRepository->forDropdown();
        }

        // Format for searchable dropdown
        $formattedSuppliers = $suppliers->map(function ($supplier) {
            return [
                'id' => $supplier->id,
                'name' => $supplier->name,
                'email' => $supplier->email,
                'phone' => $supplier->phone,
                'is_active' => $supplier->is_active,
            ];
        });

        return response()->json($formattedSuppliers);
    }
}
