<?php

namespace App\Repositories\Inventory;

use App\Models\Inventory\Supplier;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface SupplierRepositoryInterface
{
    /**
     * Get all suppliers
     */
    public function all(): Collection;

    /**
     * Get active suppliers
     */
    public function active(): Collection;

    /**
     * Get paginated suppliers with filters
     */
    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator;

    /**
     * Find supplier by ID
     */
    public function find(int $id): ?Supplier;

    /**
     * Create new supplier
     */
    public function create(array $data): Supplier;

    /**
     * Update supplier
     */
    public function update(int $id, array $data): Supplier;

    /**
     * Delete supplier
     */
    public function delete(int $id): bool;

    /**
     * Search suppliers
     */
    public function search(string $term, int $limit = 10): Collection;

    /**
     * Get suppliers with items count
     */
    public function withItemsCount(): Collection;

    /**
     * Toggle supplier status
     */
    public function toggleStatus(int $id): Supplier;

    /**
     * Get suppliers for dropdown
     */
    public function forDropdown(): Collection;
}
