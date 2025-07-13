<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Repositories\Inventory\RequisitionRepositoryInterface;
use App\Repositories\Inventory\DepartmentRepositoryInterface;
use App\Repositories\Inventory\ItemRepositoryInterface;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class RequisitionController extends Controller
{
    protected RequisitionRepositoryInterface $requisitionRepository;
    protected DepartmentRepositoryInterface $departmentRepository;
    protected ItemRepositoryInterface $itemRepository;

    public function __construct(
        RequisitionRepositoryInterface $requisitionRepository,
        DepartmentRepositoryInterface $departmentRepository,
        ItemRepositoryInterface $itemRepository
    ) {
        $this->requisitionRepository = $requisitionRepository;
        $this->departmentRepository = $departmentRepository;
        $this->itemRepository = $itemRepository;
    }

    /**
     * Display a listing of requisitions
     */
    public function index(Request $request)
    {
        $user = $request->user()->load(['department', 'role']);
        $isLogistics = $user->isLogistics();
        
        $filters = [
            'search' => $request->get('search'),
            'department_id' => $isLogistics ? $request->get('department_id') : $user->department_id,
            'status' => $request->get('status'),
            'priority' => $request->get('priority'),
            'requested_by' => $request->get('requested_by'),
            'date_from' => $request->get('date_from'),
            'date_to' => $request->get('date_to'),
            'perPage' => $request->get('perPage', 15),
            'is_logistics' => $isLogistics,
        ];

        $requisitions = $this->requisitionRepository->paginate($filters, $filters['perPage']);
        $statistics = $this->requisitionRepository->getStatistics($filters);

        return Inertia::render('inventory/requisitions/index', [
            'requisitions' => $requisitions,
            'filters' => $filters,
            'statistics' => $statistics,
            'departments' => $this->departmentRepository->forDropdown(),
            'isLogistics' => $isLogistics,
        ]);
    }

    /**
     * Show the form for creating a new requisition
     */
    public function create()
    {
        $user = request()->user()->load(['department', 'role']);
        $isLogistics = $user->isLogistics();
        $departmentFilter = $isLogistics ? [] : ['department_id' => $user->department_id];
        
        return Inertia::render('inventory/requisitions/create', [
            'departments' => $this->departmentRepository->forDropdown(),
            'items' => $this->itemRepository->paginate($departmentFilter)->items(),
            'isLogistics' => $isLogistics,
        ]);
    }

    /**
     * Store a newly created requisition
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'department_id' => 'required|exists:departments,id',
            'requisition_date' => 'required|date',
            'needed_date' => 'required|date|after_or_equal:requisition_date',
            'priority' => 'required|in:low,medium,high,urgent',
            'purpose' => 'required|string|max:1000',
            'notes' => 'nullable|string|max:2000',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:items,id',
            'items.*.quantity_requested' => 'required|numeric|min:0.01',
            'items.*.estimated_unit_cost' => 'nullable|numeric|min:0',
            'items.*.purpose' => 'nullable|string|max:500',
            'items.*.notes' => 'nullable|string|max:500',
        ]);

        try {
            $requisitionData = [
                'department_id' => $request->department_id,
                'requested_by' => Auth::id(),
                'requisition_date' => $request->requisition_date,
                'needed_date' => $request->needed_date,
                'priority' => $request->priority,
                'purpose' => $request->purpose,
                'notes' => $request->notes,
                'status' => 'draft',
            ];

            $items = $request->items;

            $requisition = $this->requisitionRepository->createWithItems($requisitionData, $items);

            return redirect()->route('requisitions.show', $requisition->id)
                ->with('success', 'Requisition created successfully.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to create requisition: ' . $e->getMessage()]);
        }
    }

    /**
     * Display the specified requisition
     */
    public function show(int $id)
    {
        $requisition = $this->requisitionRepository->find($id);

        if (!$requisition) {
            return redirect()->route('requisitions.index')
                ->with('error', 'Requisition not found.');
        }

        $canEdit = $requisition->canEdit() && Auth::id() == $requisition->requested_by;
        $canSubmit = $requisition->canSubmit() && Auth::id() == $requisition->requested_by;
        $canApprove = $requisition->canApprove(); // Add permission check here
        $canReject = $requisition->canReject(); // Add permission check here
        $canCancel = $requisition->canCancel() && Auth::id() == $requisition->requested_by;

        return Inertia::render('inventory/requisitions/show', [
            'requisition' => $requisition,
            'canEdit' => $canEdit,
            'canSubmit' => $canSubmit,
            'canApprove' => $canApprove,
            'canReject' => $canReject,
            'canCancel' => $canCancel,
        ]);
    }

    /**
     * Show the form for editing the specified requisition
     */
    public function edit(int $id)
    {
        $requisition = $this->requisitionRepository->find($id);

        if (!$requisition) {
            return redirect()->route('requisitions.index')
                ->with('error', 'Requisition not found.');
        }

        if (!$requisition->isEditable() || Auth::id() != $requisition->requested_by) {
            return redirect()->route('requisitions.show', $id)
                ->with('error', 'This requisition cannot be edited.');
        }

        $user = request()->user();
        
        return Inertia::render('inventory/requisitions/edit', [
            'requisition' => $requisition,
            'departments' => $this->departmentRepository->forDropdown(),
            'items' => $this->itemRepository->paginate($user->department_id ? ['department_id' => $user->department_id] : [])->items(),
        ]);
    }

    /**
     * Update the specified requisition
     */
    public function update(Request $request, int $id): RedirectResponse
    {
        $request->validate([
            'department_id' => 'required|exists:departments,id',
            'requisition_date' => 'required|date',
            'needed_date' => 'required|date|after_or_equal:requisition_date',
            'priority' => 'required|in:low,medium,high,urgent',
            'purpose' => 'required|string|max:1000',
            'notes' => 'nullable|string|max:2000',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:items,id',
            'items.*.quantity_requested' => 'required|numeric|min:0.01',
            'items.*.estimated_unit_cost' => 'nullable|numeric|min:0',
            'items.*.purpose' => 'nullable|string|max:500',
            'items.*.notes' => 'nullable|string|max:500',
        ]);

        try {
            $requisitionData = [
                'department_id' => $request->department_id,
                'requisition_date' => $request->requisition_date,
                'needed_date' => $request->needed_date,
                'priority' => $request->priority,
                'purpose' => $request->purpose,
                'notes' => $request->notes,
            ];

            $items = $request->items;

            $updated = $this->requisitionRepository->updateWithItems($id, $requisitionData, $items);

            if (!$updated) {
                return back()->withErrors(['error' => 'Failed to update requisition or requisition is not editable.']);
            }

            return redirect()->route('requisitions.show', $id)
                ->with('success', 'Requisition updated successfully.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to update requisition: ' . $e->getMessage()]);
        }
    }

    /**
     * Remove the specified requisition
     */
    public function destroy(int $id): RedirectResponse
    {
        try {
            $deleted = $this->requisitionRepository->delete($id);

            if (!$deleted) {
                return back()->with('error', 'Requisition not found or cannot be deleted.');
            }

            return redirect()->route('requisitions.index')
                ->with('success', 'Requisition deleted successfully.');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to delete requisition: ' . $e->getMessage());
        }
    }

    /**
     * Submit requisition for approval
     */
    public function submit(int $id): RedirectResponse
    {
        try {
            $submitted = $this->requisitionRepository->submit($id);

            if (!$submitted) {
                return back()->with('error', 'Failed to submit requisition or requisition is not ready for submission.');
            }

            return back()->with('success', 'Requisition submitted for approval successfully.');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to submit requisition: ' . $e->getMessage());
        }
    }

    /**
     * Approve requisition
     */
    public function approve(Request $request, int $id): RedirectResponse
    {
        $request->validate([
            'item_approvals' => 'nullable|array',
            'item_approvals.*.item_id' => 'required|exists:items,id',
            'item_approvals.*.quantity_approved' => 'required|numeric|min:0',
            'item_approvals.*.approval_notes' => 'nullable|string|max:500',
        ]);

        try {
            $approved = $this->requisitionRepository->approve(
                $id,
                Auth::id(),
                $request->item_approvals ?? []
            );

            if (!$approved) {
                return back()->with('error', 'Failed to approve requisition.');
            }

            return back()->with('success', 'Requisition approved successfully.');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to approve requisition: ' . $e->getMessage());
        }
    }

    /**
     * Reject requisition
     */
    public function reject(Request $request, int $id): RedirectResponse
    {
        $request->validate([
            'rejection_reason' => 'required|string|max:1000',
        ]);

        try {
            $rejected = $this->requisitionRepository->reject($id, Auth::id(), $request->rejection_reason);

            if (!$rejected) {
                return back()->with('error', 'Failed to reject requisition.');
            }

            return back()->with('success', 'Requisition rejected successfully.');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to reject requisition: ' . $e->getMessage());
        }
    }

    /**
     * Cancel requisition
     */
    public function cancel(int $id): RedirectResponse
    {
        try {
            $cancelled = $this->requisitionRepository->cancel($id);

            if (!$cancelled) {
                return back()->with('error', 'Failed to cancel requisition.');
            }

            return back()->with('success', 'Requisition cancelled successfully.');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to cancel requisition: ' . $e->getMessage());
        }
    }

    /**
     * API endpoint for searchable dropdown
     */
    public function api(Request $request): JsonResponse
    {
        try {
            $search = $request->get('search', '');
            $limit = $request->get('limit', 50);

            $requisitions = $this->requisitionRepository->search($search, $limit);

            $formattedRequisitions = $requisitions->map(function ($requisition) {
                return [
                    'id' => $requisition->id,
                    'requisition_number' => $requisition->requisition_number,
                    'status' => $requisition->status,
                    'status_label' => $requisition->status_label,
                    'requisition_date' => $requisition->requisition_date,
                    'department' => $requisition->department,
                    'requested_by' => $requisition->requestedBy,
                ];
            });

            return response()->json($formattedRequisitions);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch requisitions: ' . $e->getMessage()], 500);
        }
    }
}
