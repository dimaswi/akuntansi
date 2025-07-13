<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Inventory\Department;
use App\Repositories\Inventory\DepartmentRepositoryInterface;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DepartmentController extends Controller
{
    protected $departmentRepository;

    public function __construct(DepartmentRepositoryInterface $departmentRepository)
    {
        $this->departmentRepository = $departmentRepository;
    }

    public function index(Request $request)
    {
        $user = $request->user()->load('role');
        $isLogistics = $user->isLogistics();
        
        $filters = [
            'search' => $request->input('search', ''),
            'perPage' => $request->input('perPage', 15),
            'is_active' => $request->input('is_active', ''),
        ];

        $departments = $this->departmentRepository->paginate($filters);

        return Inertia::render('inventory/departments/index', [
            'departments' => $departments,
            'filters' => $filters,
            'isLogistics' => $isLogistics,
        ]);
    }

    public function create()
    {
        $user = request()->user()->load('role');
        $isLogistics = $user->isLogistics();
        
        // Only logistics can create departments
        if (!$isLogistics) {
            abort(403, 'Unauthorized access. Only logistics role can manage departments.');
        }
        
        $departments = $this->departmentRepository->getParents();
        return Inertia::render('inventory/departments/create', [
            'departments' => $departments,
            'isLogistics' => $isLogistics,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:20|unique:departments,code',
            'name' => 'required|string|max:100',
            'level' => 'required|integer|min:1',
            'parent_id' => 'nullable|exists:departments,id',
            'is_active' => 'required|boolean',
        ]);

        // Handle empty parent_id
        if (empty($validated['parent_id'])) {
            $validated['parent_id'] = null;
        }

        $this->departmentRepository->create($validated);
        return redirect()->route('departments.index')->with('success', 'Departemen berhasil ditambahkan');
    }

    public function edit(Department $department)
    {
        $departments = $this->departmentRepository->getParents($department->id);
        return Inertia::render('inventory/departments/edit', [
            'department' => $department,
            'departments' => $departments
        ]);
    }

    public function update(Request $request, Department $department)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:20|unique:departments,code,' . $department->id,
            'name' => 'required|string|max:100',
            'level' => 'required|integer|min:1',
            'parent_id' => [
                'nullable',
                'exists:departments,id',
                function ($attribute, $value, $fail) use ($department) {
                    if ($value && $value == $department->id) {
                        $fail('Parent tidak boleh dirinya sendiri.');
                    }
                }
            ],
            'is_active' => 'required|boolean',
        ]);

        // Handle empty parent_id
        if (empty($validated['parent_id'])) {
            $validated['parent_id'] = null;
        }

        $this->departmentRepository->update($department->id, $validated);
        return redirect()->route('departments.index')->with('success', 'Departemen berhasil diupdate');
    }

    public function destroy(Department $department)
    {
        $this->departmentRepository->delete($department->id);
        return redirect()->route('departments.index')->with('success', 'Departemen berhasil dihapus');
    }

    /**
     * API endpoint for searching departments
     */
    public function api(Request $request)
    {
        $search = $request->get('search', '');
        $limit = $request->get('limit', 10);
        
        $departments = $this->departmentRepository->search($search, $limit);
        
        return response()->json([
            'data' => $departments->map(function ($department) {
                return [
                    'id' => $department->id,
                    'name' => $department->name,
                    'description' => $department->description ?? '',
                    'is_active' => $department->is_active,
                    'level' => $department->level,
                ];
            }),
            'total' => $departments->count(),
        ]);
    }
}
