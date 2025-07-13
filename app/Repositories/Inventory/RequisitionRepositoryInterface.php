<?php

namespace App\Repositories\Inventory;

use App\Models\Inventory\Requisition;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface RequisitionRepositoryInterface
{
    /**
     * Get all requisitions
     */
    public function all(): Collection;

    /**
     * Find requisition by ID
     */
    public function find(int $id): ?Requisition;

    /**
     * Create a new requisition
     */
    public function create(array $data): Requisition;

    /**
     * Update a requisition
     */
    public function update(int $id, array $data): bool;

    /**
     * Delete a requisition
     */
    public function delete(int $id): bool;

    /**
     * Get paginated requisitions with filters
     */
    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator;

    /**
     * Get requisitions by department
     */
    public function getByDepartment(int $departmentId): Collection;

    /**
     * Get requisitions by status
     */
    public function getByStatus(string $status): Collection;

    /**
     * Get pending requisitions for approval
     */
    public function getPendingApprovals(): Collection;

    /**
     * Search requisitions by number or purpose
     */
    public function search(string $query, int $limit = 50): Collection;

    /**
     * Submit requisition for approval
     */
    public function submit(int $id): bool;

    /**
     * Approve requisition
     */
    public function approve(int $id, int $approvedBy, array $itemApprovals = []): bool;

    /**
     * Reject requisition
     */
    public function reject(int $id, int $rejectedBy, string $reason): bool;

    /**
     * Cancel requisition
     */
    public function cancel(int $id): bool;

    /**
     * Get requisition statistics
     */
    public function getStatistics(array $filters = []): array;

    /**
     * Generate requisition number
     */
    public function generateRequisitionNumber(): string;

    /**
     * Create requisition with items
     */
    public function createWithItems(array $requisitionData, array $items): Requisition;

    /**
     * Update requisition with items
     */
    public function updateWithItems(int $id, array $requisitionData, array $items): bool;

    /**
     * Get requisitions for dropdown
     */
    public function forDropdown(array $filters = []): Collection;
}
