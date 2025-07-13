<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Repositories\Inventory\DepartmentRepository;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserDepartmentController extends Controller
{
    protected DepartmentRepository $departmentRepository;

    public function __construct(DepartmentRepository $departmentRepository)
    {
        $this->departmentRepository = $departmentRepository;
    }

    /**
     * Display a listing of users with their departments
     */
    public function index(Request $request): Response
    {
        $search = $request->get('search', '');
        $departmentId = $request->get('department_id');
        
        $users = User::with('department')
            ->when($search, function ($query) use ($search) {
                $query->where('name', 'like', '%' . $search . '%')
                      ->orWhere('email', 'like', '%' . $search . '%');
            })
            ->when($departmentId, function ($query) use ($departmentId) {
                $query->where('department_id', $departmentId);
            })
            ->orderBy('name')
            ->paginate(15);

        return Inertia::render('users/departments/index', [
            'users' => $users,
            'departments' => $this->departmentRepository->forDropdown(),
            'filters' => [
                'search' => $search,
                'department_id' => $departmentId,
            ],
        ]);
    }

    /**
     * Show the form for editing user department assignment
     */
    public function edit(User $user): Response
    {
        return Inertia::render('users/departments/edit', [
            'user' => $user->load('department'),
            'departments' => $this->departmentRepository->forDropdown(),
        ]);
    }

    /**
     * Update user department assignment
     */
    public function update(Request $request, User $user): RedirectResponse
    {
        $request->validate([
            'department_id' => 'nullable|exists:departments,id',
        ]);

        $user->update([
            'department_id' => $request->department_id,
        ]);

        return redirect()
            ->route('users.departments.index')
            ->with('success', 'User department assignment updated successfully.');
    }

    /**
     * Bulk update user department assignments
     */
    public function bulkUpdate(Request $request): RedirectResponse
    {
        $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
            'department_id' => 'nullable|exists:departments,id',
        ]);

        User::whereIn('id', $request->user_ids)
            ->update(['department_id' => $request->department_id]);

        $count = count($request->user_ids);
        $department = $request->department_id 
            ? $this->departmentRepository->find($request->department_id) 
            : null;
        
        $message = $department 
            ? "Successfully assigned {$count} users to {$department->name} department."
            : "Successfully removed department assignment from {$count} users.";

        return redirect()
            ->route('users.departments.index')
            ->with('success', $message);
    }
}
