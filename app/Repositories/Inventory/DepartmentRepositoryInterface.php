<?php

namespace App\Repositories\Inventory;

interface DepartmentRepositoryInterface
{
    public function all();
    public function find($id);
    public function create(array $data);
    public function update($id, array $data);
    public function delete($id);
    public function getParents($excludeId = null);
    public function paginate(array $filters = []);
    public function search($query, $limit = 10);
    public function forDropdown();
}
