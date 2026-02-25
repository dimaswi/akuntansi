<?php

namespace App\Repositories\Inventory;

use App\Models\Inventory\ItemCategory;

class ItemCategoryRepository implements ItemCategoryRepositoryInterface
{
    public function all()
    {
        return ItemCategory::with('parent')->orderBy('code')->get();
    }

    public function find($id)
    {
        return ItemCategory::findOrFail($id);
    }

    public function create(array $data)
    {
        return ItemCategory::create($data);
    }

    public function update($id, array $data)
    {
        $itemCategory = ItemCategory::findOrFail($id);
        $itemCategory->update($data);
        return $itemCategory;
    }

    public function delete($id)
    {
        $itemCategory = ItemCategory::findOrFail($id);
        return $itemCategory->delete();
    }

    public function getParents($excludeId = null)
    {
        $query = ItemCategory::whereNull('parent_id');
        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }
        return $query->orderBy('name')->get();
    }

    public function paginate(array $filters = [])
    {
        $query = ItemCategory::with('parent');

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('code', 'LIKE', "%{$search}%")
                  ->orWhere('name', 'LIKE', "%{$search}%");
            });
        }

        if (!empty($filters['category_type'])) {
            $query->where('category_type', $filters['category_type']);
        }

        if (isset($filters['is_active']) && $filters['is_active'] !== '') {
            $query->where('is_active', (bool) $filters['is_active']);
        }

        $perPage = $filters['perPage'] ?? 10;
        
        return $query->orderBy('code')->paginate($perPage);
    }

    public function search($query, $limit = 10)
    {
        $categories = ItemCategory::where('is_active', true);
        
        if (!empty($query)) {
            $categories->where(function ($q) use ($query) {
                $q->where('code', 'LIKE', "%{$query}%")
                  ->orWhere('name', 'LIKE', "%{$query}%");
            });
        }
        
        return $categories->orderBy('name')->limit($limit)->get();
    }
}
