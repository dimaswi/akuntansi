<?php

namespace App\Repositories\Inventory;

use App\Models\Inventory\Supplier;
use App\Repositories\Inventory\SupplierRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class SupplierRepository implements SupplierRepositoryInterface
{
    protected Supplier $model;

    public function __construct(Supplier $model)
    {
        $this->model = $model;
    }

    /**
     * Get all suppliers
     */
    public function all(): Collection
    {
        return $this->model->orderBy('name')->get();
    }

    /**
     * Get active suppliers
     */
    public function active(): Collection
    {
        return $this->model->active()->orderBy('name')->get();
    }

    /**
     * Get paginated suppliers with filters
     */
    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->model->newQuery();

        // Apply search filter
        if (!empty($filters['search'])) {
            $query->search($filters['search']);
        }

        // Apply status filter
        if (isset($filters['is_active']) && $filters['is_active'] !== null) {
            $query->where('is_active', $filters['is_active']);
        }

        // With items count
        $query->withCount('items');

        return $query->orderBy('name')->paginate($perPage);
    }

    /**
     * Find supplier by ID
     */
    public function find(int $id): ?Supplier
    {
        return $this->model->with(['items' => function ($query) {
            $query->select('id', 'supplier_id', 'name', 'code');
        }])->find($id);
    }

    /**
     * Create new supplier
     */
    public function create(array $data): Supplier
    {
        return $this->model->create($data);
    }

    /**
     * Update supplier
     */
    public function update(int $id, array $data): Supplier
    {
        $supplier = $this->model->findOrFail($id);
        $supplier->update($data);
        return $supplier->fresh();
    }

    /**
     * Delete supplier
     */
    public function delete(int $id): bool
    {
        $supplier = $this->model->findOrFail($id);
        
        // Check if supplier has items
        if ($supplier->items()->count() > 0) {
            throw new \Exception('Cannot delete supplier that has associated items. Please remove or reassign items first.');
        }

        return $supplier->delete();
    }

    /**
     * Search suppliers
     */
    public function search(string $term, int $limit = 10): Collection
    {
        $suppliers = $this->model->where('is_active', true);
        
        if (!empty($term)) {
            $suppliers->where(function ($q) use ($term) {
                $q->where('name', 'LIKE', "%{$term}%")
                  ->orWhere('email', 'LIKE', "%{$term}%")
                  ->orWhere('phone', 'LIKE', "%{$term}%");
            });
        }
        
        return $suppliers->orderBy('name')->limit($limit)->get();
    }

    /**
     * Get suppliers with items count
     */
    public function withItemsCount(): Collection
    {
        return $this->model->withCount('items')->orderBy('name')->get();
    }

    /**
     * Toggle supplier status
     */
    public function toggleStatus(int $id): Supplier
    {
        $supplier = $this->model->findOrFail($id);
        $supplier->update(['is_active' => !$supplier->is_active]);
        return $supplier->fresh();
    }

    /**
     * Get suppliers for dropdown
     */
    public function forDropdown(): Collection
    {
        return $this->model->active()
            ->select('id', 'name', 'email', 'phone', 'is_active')
            ->orderBy('name')
            ->limit(50) // Limit initial load
            ->get();
    }
}
