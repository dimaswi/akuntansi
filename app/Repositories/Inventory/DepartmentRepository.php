<?php

namespace App\Repositories\Inventory;

use App\Models\Inventory\Department;

class DepartmentRepository implements DepartmentRepositoryInterface
{
    public function all()
    {
        return Department::with('parent')->orderBy('code')->get();
    }

    public function find($id)
    {
        return Department::findOrFail($id);
    }

    public function create(array $data)
    {
        return Department::create($data);
    }

    public function update($id, array $data)
    {
        $department = Department::findOrFail($id);
        $department->update($data);
        return $department;
    }

    public function delete($id)
    {
        $department = Department::findOrFail($id);
        return $department->delete();
    }

    public function getParents($excludeId = null)
    {
        $query = Department::query();
        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }
        return $query->orderBy('name')->get(['id', 'name']);
    }

    public function paginate(array $filters = [])
    {
        $query = Department::with('parent');

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('code', 'LIKE', "%{$search}%")
                  ->orWhere('name', 'LIKE', "%{$search}%");
            });
        }

        if (isset($filters['is_active']) && $filters['is_active'] !== '') {
            $query->where('is_active', (bool) $filters['is_active']);
        }

        $perPage = $filters['perPage'] ?? 15;
        
        return $query->orderBy('code')->paginate($perPage);
    }

    public function search($query, $limit = 10)
    {
        $departments = Department::where('is_active', true);
        
        if (!empty($query)) {
            $departments->where(function ($q) use ($query) {
                $q->where('code', 'LIKE', "%{$query}%")
                  ->orWhere('name', 'LIKE', "%{$query}%");
            });
        }
        
        return $departments->orderBy('name')->limit($limit)->get();
    }

    public function forDropdown()
    {
        return Department::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'code', 'name']);
    }
}
