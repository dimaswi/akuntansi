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

    public function show(Department $department)
    {
        $user = request()->user()->load('role');
        
        // Load relationships
        $department->load(['parent', 'children']);
        
        // Get users in this department
        $users = \App\Models\User::where('department_id', $department->id)
            ->with('role')
            ->orderBy('name')
            ->get()
            ->map(function($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role_name' => $user->role->display_name ?? '-',
                ];
            });
        
        // Get stock items count
        $stockItemsCount = \App\Models\Inventory\ItemStock::where('department_id', $department->id)
            ->where('quantity_on_hand', '>', 0)
            ->count();
        
        // Get recent stock requests
        $recentRequests = \App\Models\Inventory\StockRequest::where('department_id', $department->id)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get(['id', 'request_number', 'status', 'created_at']);
        
        // Get recent stock opnames
        $recentOpnames = \App\Models\Inventory\StockOpname::where('department_id', $department->id)
            ->orderBy('opname_date', 'desc')
            ->limit(5)
            ->get(['id', 'opname_number', 'status', 'opname_date']);
        
        return Inertia::render('inventory/departments/show', [
            'department' => $department,
            'users' => $users,
            'stockItemsCount' => $stockItemsCount,
            'recentRequests' => $recentRequests,
            'recentOpnames' => $recentOpnames,
            'isLogistics' => $user->isLogistics(),
        ]);
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

    /**
     * Show users for a department
     */
    public function users(Department $department)
    {
        $user = request()->user()->load('role');
        $isLogistics = $user->isLogistics();
        
        // Only logistics can manage department users
        if (!$isLogistics) {
            abort(403, 'Unauthorized access. Only logistics role can manage department users.');
        }

        // Get all users in this department
        $departmentUsers = \App\Models\User::where('department_id', $department->id)
            ->with('role')
            ->orderBy('name')
            ->get()
            ->map(function($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role_name' => $user->role->display_name ?? '-',
                ];
            });

        // Get all users without department
        $availableUsers = \App\Models\User::whereNull('department_id')
            ->with('role')
            ->orderBy('name')
            ->get()
            ->map(function($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role_name' => $user->role->display_name ?? '-',
                ];
            });

        return Inertia::render('inventory/departments/users', [
            'department' => $department,
            'departmentUsers' => $departmentUsers,
            'availableUsers' => $availableUsers,
            'isLogistics' => $isLogistics,
        ]);
    }

    /**
     * Batch assign users to department
     */
    public function assignUsers(Request $request, Department $department)
    {
        $user = $request->user()->load('role');
        $isLogistics = $user->isLogistics();
        
        // Only logistics can manage department users
        if (!$isLogistics) {
            abort(403, 'Unauthorized access. Only logistics role can manage department users.');
        }

        $validated = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
        ]);

        // Update users department_id
        \App\Models\User::whereIn('id', $validated['user_ids'])
            ->update(['department_id' => $department->id]);

        return redirect()->back()
            ->with('success', count($validated['user_ids']) . ' user berhasil di-assign ke departemen ' . $department->name);
    }

    /**
     * Remove user from department
     */
    public function removeUser(Request $request, Department $department)
    {
        $user = $request->user()->load('role');
        $isLogistics = $user->isLogistics();
        
        // Only logistics can manage department users
        if (!$isLogistics) {
            abort(403, 'Unauthorized access. Only logistics role can manage department users.');
        }

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        // Remove user from department
        \App\Models\User::where('id', $validated['user_id'])
            ->update(['department_id' => null]);

        return redirect()->back()
            ->with('success', 'User berhasil dihapus dari departemen');
    }
}
