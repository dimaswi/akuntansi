<?php

namespace App\Repositories\Inventory;

use App\Models\Inventory\Item;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface ItemRepositoryInterface
{
    /**
     * Get all items
     */
    public function all(): Collection;

    /**
     * Find item by ID
     */
    public function find(int $id): ?Item;

    /**
     * Create a new item
     */
    public function create(array $data): Item;

    /**
     * Update an item
     */
    public function update(int $id, array $data): bool;

    /**
     * Delete an item
     */
    public function delete(int $id): bool;

    /**
     * Get paginated items with filters
     */
    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator;

    /**
     * Get items by inventory type (pharmacy, general)
     */
    public function getByInventoryType(string $type): Collection;

    /**
     * Get items by category
     */
    public function getByCategory(int $categoryId): Collection;

    /**
     * Get items by department
     */
    public function getByDepartment(int $departmentId): Collection;

    /**
     * Get active items
     */
    public function getActive(): Collection;

    /**
     * Get items with low stock (below reorder level)
     */
    public function getLowStock(): Collection;

    /**
     * Search items by code or name
     */
    public function search(string $query, int $limit = 50): Collection;

    /**
     * Get items with their details (pharmacy or general)
     */
    public function getWithDetails(): Collection;

    /**
     * Create item with details (pharmacy or general)
     */
    public function createWithDetails(array $itemData, array $detailData): Item;

    /**
     * Update item with details
     */
    public function updateWithDetails(int $id, array $itemData, array $detailData): bool;
}
