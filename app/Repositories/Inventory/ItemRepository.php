<?php

namespace App\Repositories\Inventory;

use App\Models\Inventory\Item;
use App\Models\Inventory\PharmacyItemDetail;
use App\Models\Inventory\GeneralItemDetail;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class ItemRepository implements ItemRepositoryInterface
{
    /**
     * Get all items
     */
    public function all(): Collection
    {
        return Item::with(['category', 'department', 'supplier', 'pharmacyDetail', 'generalDetail'])
            ->orderBy('name')
            ->get();
    }

    /**
     * Find item by ID
     */
    public function find(int $id): ?Item
    {
        return Item::with(['category', 'department', 'supplier', 'pharmacyDetail', 'generalDetail'])
            ->find($id);
    }

    /**
     * Create a new item
     */
    public function create(array $data): Item
    {
        return Item::create($data);
    }

    /**
     * Update an item
     */
    public function update(int $id, array $data): bool
    {
        $item = Item::find($id);
        if (!$item) {
            return false;
        }

        return $item->update($data);
    }

    /**
     * Delete an item
     */
    public function delete(int $id): bool
    {
        $item = Item::find($id);
        if (!$item) {
            return false;
        }

        return $item->delete();
    }

    /**
     * Get paginated items with filters
     */
    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Item::with(['category', 'department', 'supplier', 'pharmacyDetail', 'generalDetail']);

        // ALWAYS load stocks (central for logistics, department for others)
        if (!empty($filters['is_logistics'])) {
            // Logistics: Load central warehouse stock only
            $query->with(['stocks' => function ($q) {
                $q->whereNull('department_id'); // Central warehouse stock
            }]);
        } else {
            // Non-logistics: Load their department stock
            if (!empty($filters['department_id'])) {
                $query->with(['stocks' => function ($q) use ($filters) {
                    $q->where('department_id', $filters['department_id']);
                }]);
                
                // Only show items that have stock in their department
                $query->whereHas('stocks', function (Builder $q) use ($filters) {
                    $q->where('department_id', $filters['department_id'])
                      ->where('quantity_on_hand', '>', 0);
                });
            }
        }

        // Apply other filters
        if (!empty($filters['search'])) {
            $query->where(function (Builder $q) use ($filters) {
                $q->where('code', 'like', '%' . $filters['search'] . '%')
                  ->orWhere('name', 'like', '%' . $filters['search'] . '%')
                  ->orWhere('description', 'like', '%' . $filters['search'] . '%');
            });
        }

        if (!empty($filters['inventory_type'])) {
            $query->where('inventory_type', $filters['inventory_type']);
        }

        if (!empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        if (!empty($filters['supplier_id'])) {
            $query->where('supplier_id', $filters['supplier_id']);
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', $filters['is_active']);
        }

        if (!empty($filters['requires_approval'])) {
            $query->where('requires_approval', $filters['requires_approval']);
        }

        if (!empty($filters['is_controlled_substance'])) {
            $query->where('is_controlled_substance', $filters['is_controlled_substance']);
        }

        // Filter by stock status
        if (!empty($filters['stock_status'])) {
            switch ($filters['stock_status']) {
                case 'out_of_stock':
                    $query->outOfStock();
                    break;
                case 'low_stock':
                    $query->lowStock();
                    break;
                case 'below_safety':
                    $query->whereColumn('available_quantity', '<=', 'safety_stock')
                          ->whereColumn('available_quantity', '>', 'reorder_level');
                    break;
            }
        }

        return $query->orderBy('name')->paginate($perPage);
    }

    /**
     * Get items by inventory type (pharmacy, general)
     */
    public function getByInventoryType(string $type): Collection
    {
        return Item::with(['category', 'department', 'supplier', 'pharmacyDetail', 'generalDetail'])
            ->where('inventory_type', $type)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();
    }

    /**
     * Get items by category
     */
    public function getByCategory(int $categoryId): Collection
    {
        return Item::with(['category', 'department', 'supplier', 'pharmacyDetail', 'generalDetail'])
            ->where('category_id', $categoryId)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();
    }

    /**
     * Get items by department
     */
    public function getByDepartment(int $departmentId): Collection
    {
        return Item::with(['category', 'department', 'supplier', 'pharmacyDetail', 'generalDetail'])
            ->where('department_id', $departmentId)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();
    }

    /**
     * Get active items
     */
    public function getActive(): Collection
    {
        return Item::with(['category', 'department', 'supplier', 'pharmacyDetail', 'generalDetail'])
            ->active()
            ->orderBy('name')
            ->get();
    }

    /**
     * Get items with low stock (below reorder level)
     */
    public function getLowStock(): Collection
    {
        // Get items that have stocks below reorder level
        return Item::with(['category', 'department', 'supplier', 'pharmacyDetail', 'generalDetail', 'stocks'])
            ->whereHas('stocks', function (Builder $q) {
                $q->whereRaw('quantity_on_hand <= (SELECT reorder_level FROM items WHERE items.id = item_stocks.item_id)');
            })
            ->where('is_active', true)
            ->orderBy('name')
            ->get();
    }

    /**
     * Search items by code or name
     */
    public function search(string $query, int $limit = 50, ?int $departmentId = null): Collection
    {
        $queryBuilder = Item::with(['category', 'department', 'supplier', 'pharmacyDetail', 'generalDetail'])
            ->where('is_active', true)
            ->orderBy('name');

        // Filter by department if specified
        if ($departmentId !== null) {
            $queryBuilder->whereHas('stocks', function (Builder $q) use ($departmentId) {
                $q->where('department_id', $departmentId);
            });
        }

        if (!empty($query)) {
            $queryBuilder->where(function (Builder $q) use ($query) {
                $q->where('code', 'like', '%' . $query . '%')
                  ->orWhere('name', 'like', '%' . $query . '%')
                  ->orWhere('description', 'like', '%' . $query . '%');
            });
        }

        return $queryBuilder->limit($limit)->get();
    }

    /**
     * Get items with their details (pharmacy or general)
     */
    public function getWithDetails(): Collection
    {
        return Item::with(['category', 'department', 'supplier', 'pharmacyDetail', 'generalDetail'])
            ->orderBy('name')
            ->get();
    }

    /**
     * Create item with details (pharmacy or general)
     */
    public function createWithDetails(array $itemData, array $detailData): Item
    {
        DB::beginTransaction();
        
        try {
            // Create the main item
            $item = Item::create($itemData);

            // Create type-specific details
            if ($item->inventory_type === 'pharmacy') {
                $detailData['item_id'] = $item->id;
                PharmacyItemDetail::create($detailData);
            } elseif ($item->inventory_type === 'general') {
                $detailData['item_id'] = $item->id;
                GeneralItemDetail::create($detailData);
            }

            DB::commit();

            // Return item with relationships loaded
            return $this->find($item->id);
        } catch (\Exception $e) {
            DB::rollback();
            throw $e;
        }
    }

    /**
     * Update item with details
     */
    public function updateWithDetails(int $id, array $itemData, array $detailData): bool
    {
        DB::beginTransaction();
        
        try {
            $item = Item::find($id);
            if (!$item) {
                return false;
            }

            // Update the main item
            $item->update($itemData);

            // Update type-specific details
            if ($item->inventory_type === 'pharmacy') {
                $detail = PharmacyItemDetail::where('item_id', $item->id)->first();
                if ($detail) {
                    $detail->update($detailData);
                } else {
                    $detailData['item_id'] = $item->id;
                    PharmacyItemDetail::create($detailData);
                }
            } elseif ($item->inventory_type === 'general') {
                $detail = GeneralItemDetail::where('item_id', $item->id)->first();
                if ($detail) {
                    $detail->update($detailData);
                } else {
                    $detailData['item_id'] = $item->id;
                    GeneralItemDetail::create($detailData);
                }
            }

            DB::commit();
            return true;
        } catch (\Exception $e) {
            DB::rollback();
            throw $e;
        }
    }
}
