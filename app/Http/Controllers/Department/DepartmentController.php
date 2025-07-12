<?php

namespace App\Http\Controllers\Department;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class DepartmentController extends Controller
{
    public function index(Request $request)
    {
        $query = Department::with(['parent', 'manager'])
            ->withCount(['children', 'requests']);

        // Add monthly spending calculation
        $query->withSum(['requests as current_month_spending' => function ($q) {
            $q->where('status', 'approved')
              ->whereYear('approved_at', now()->year)
              ->whereMonth('approved_at', now()->month);
        }], 'total_estimated_cost');

        // Add current month requests count
        $query->withCount(['requests as current_month_requests' => function ($q) {
            $q->whereYear('created_at', now()->year)
              ->whereMonth('created_at', now()->month);
        }]);

        // Apply filters
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhereHas('manager', function ($mq) use ($search) {
                      $mq->where('name', 'like', "%{$search}%")
                         ->orWhere('nip', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('is_active', $request->status === 'active');
        }

        if ($request->filled('can_request') && $request->can_request !== 'all') {
            $query->where('can_request_items', $request->can_request === 'yes');
        }

        $departments = $query->orderBy('name')->paginate(15);

        // Calculate statistics
        $stats = [
            'total_departments' => Department::count(),
            'active_departments' => Department::where('is_active', true)->count(),
            'departments_with_budget' => Department::whereNotNull('monthly_budget_limit')->where('monthly_budget_limit', '>', 0)->count(),
            'departments_can_request' => Department::where('can_request_items', true)->count(),
            'total_monthly_budget' => Department::whereNotNull('monthly_budget_limit')->sum('monthly_budget_limit') ?? 0,
            'total_monthly_spending' => DB::table('department_requests')
                ->where('status', 'approved')
                ->whereYear('approved_at', now()->year)
                ->whereMonth('approved_at', now()->month)
                ->sum('total_estimated_cost') ?? 0
        ];

        return Inertia::render('Department/Index', [
            'departments' => $departments,
            'filters' => $request->only(['search', 'status', 'can_request']),
            'stats' => $stats
        ]);
    }

    public function create()
    {
        $parentDepartments = Department::active()
            ->orderBy('name')
            ->get(['id', 'name', 'code']);
            
        $managers = User::orderBy('name')
            ->get(['id', 'name', 'nip']);
            
        $users = User::whereNull('department_id')
            ->orWhere('department_id', '')
            ->orderBy('name')
            ->get(['id', 'name', 'nip']);

        return Inertia::render('Department/Create', [
            'parentDepartments' => $parentDepartments,
            'managers' => $managers,
            'users' => $users
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'code' => 'required|string|max:20|unique:departments,code',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'parent_id' => 'nullable|exists:departments,id',
            'manager_id' => 'nullable|exists:users,id',
            'location' => 'nullable|string|max:255',
            'monthly_budget_limit' => 'required|numeric|min:0',
            'is_active' => 'boolean',
            'can_request_items' => 'boolean',
            'user_ids' => 'nullable|array',
            'user_ids.*' => 'exists:users,id'
        ]);

        // Convert empty strings to null for nullable fields
        $data = $request->all();
        $data['parent_id'] = $data['parent_id'] ?: null;
        $data['manager_id'] = $data['manager_id'] ?: null;
        $data['description'] = $data['description'] ?: null;
        $data['location'] = $data['location'] ?: null;

        DB::transaction(function () use ($data) {
            $department = Department::create(collect($data)->except('user_ids')->toArray());
            
            // Assign users to department
            if (!empty($data['user_ids'])) {
                User::whereIn('id', $data['user_ids'])
                    ->update(['department_id' => $department->id]);
            }
        });

        return redirect()->route('departments.index')
            ->with('success', 'Departemen berhasil dibuat.');
    }

    public function show(Department $department)
    {
        $department->load([
            'parent',
            'children.manager',
            'manager',
            'requests' => function ($query) {
                $query->with(['requestedBy', 'items'])
                      ->orderBy('created_at', 'desc')
                      ->limit(10);
            },
            'users'
        ]);

        // Calculate current month usage
        $currentMonthUsage = $department->requests()
            ->where('status', 'approved')
            ->whereYear('approved_at', now()->year)
            ->whereMonth('approved_at', now()->month)
            ->sum('total_estimated_cost');

        // Add current month usage to department data
        $department->current_month_usage = $currentMonthUsage ?? 0;

        // Get statistics
        $stats = [
            'total_requests' => $department->requests()->count(),
            'pending_requests' => $department->requests()->where('status', 'submitted')->count(),
            'approved_requests' => $department->requests()->where('status', 'approved')->count(),
            'this_month_cost' => $currentMonthUsage ?? 0,
            'remaining_budget' => $department->monthly_budget_limit - ($currentMonthUsage ?? 0),
            'total_users' => $department->users()->count()
        ];

        return Inertia::render('Department/Show', [
            'department' => $department,
            'stats' => $stats,
            'canEdit' => true // You can add proper permission check here
        ]);
    }

    public function edit(Department $department)
    {
        $department->load('users');
        
        $parentDepartments = Department::active()
            ->where('id', '!=', $department->id)
            ->orderBy('name')
            ->get(['id', 'name', 'code']);
            
        $managers = User::orderBy('name')
            ->get(['id', 'name', 'nip']);

        $users = User::where(function($q) use ($department) {
                $q->whereNull('department_id')
                  ->orWhere('department_id', '')
                  ->orWhere('department_id', $department->id);
            })
            ->orderBy('name')
            ->get(['id', 'name', 'nip', 'department_id']);

        return Inertia::render('Department/Edit', [
            'department' => $department,
            'parentDepartments' => $parentDepartments,
            'managers' => $managers,
            'users' => $users
        ]);
    }

    public function update(Request $request, Department $department)
    {
        $request->validate([
            'code' => 'required|string|max:20|unique:departments,code,' . $department->id,
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'parent_id' => 'nullable|exists:departments,id',
            'manager_id' => 'nullable|exists:users,id',
            'location' => 'nullable|string|max:255',
            'monthly_budget_limit' => 'required|numeric|min:0',
            'is_active' => 'boolean',
            'can_request_items' => 'boolean',
            'user_ids' => 'nullable|array',
            'user_ids.*' => 'exists:users,id'
        ]);

        // Prevent circular parent relationship
        if ($request->parent_id == $department->id) {
            return back()->withErrors(['parent_id' => 'Departemen tidak dapat menjadi parent dari dirinya sendiri.']);
        }

        // Convert empty strings to null for nullable fields
        $data = $request->all();
        $data['parent_id'] = $data['parent_id'] ?: null;
        $data['manager_id'] = $data['manager_id'] ?: null;
        $data['description'] = $data['description'] ?: null;
        $data['location'] = $data['location'] ?: null;

        DB::transaction(function () use ($data, $department) {
            $department->update(collect($data)->except('user_ids')->toArray());
            
            // First, remove all current users from this department
            User::where('department_id', $department->id)
                ->update(['department_id' => null]);
            
            // Then assign new users to department
            if (!empty($data['user_ids'])) {
                User::whereIn('id', $data['user_ids'])
                    ->update(['department_id' => $department->id]);
            }
        });

        return redirect()->route('departments.show', $department)
            ->with('success', 'Departemen berhasil diperbarui.');
    }

    public function destroy(Department $department)
    {
        // Check if department has requests
        if ($department->requests()->count() > 0) {
            return back()->withErrors(['error' => 'Tidak dapat menghapus departemen yang memiliki permintaan.']);
        }

        // Check if department has users
        if ($department->users()->count() > 0) {
            return back()->withErrors(['error' => 'Tidak dapat menghapus departemen yang memiliki pengguna.']);
        }

        // Check if department has children
        if ($department->children()->count() > 0) {
            return back()->withErrors(['error' => 'Tidak dapat menghapus departemen yang memiliki sub-departemen.']);
        }

        DB::transaction(function () use ($department) {
            $department->delete();
        });

        return redirect()->route('departments.index')
            ->with('success', 'Departemen berhasil dihapus.');
    }

    public function getBudgetStatus(Department $department, Request $request)
    {
        $year = $request->get('year', now()->year);
        $month = $request->get('month', now()->month);

        $totalSpent = $department->getMonthlyRequestsTotal($year, $month);
        $remaining = $department->getRemainingBudget($year, $month);
        $percentage = $department->monthly_budget_limit > 0 
            ? ($totalSpent / $department->monthly_budget_limit) * 100 
            : 0;

        return response()->json([
            'budget_limit' => $department->monthly_budget_limit,
            'total_spent' => $totalSpent,
            'remaining_budget' => $remaining,
            'usage_percentage' => round($percentage, 2)
        ]);
    }
}
