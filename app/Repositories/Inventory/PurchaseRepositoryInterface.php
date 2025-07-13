<?php

namespace App\Repositories\Inventory;

interface PurchaseRepositoryInterface
{
    public function all();
    public function find($id);
    public function create(array $data);
    public function update($id, array $data);
    public function delete($id);
    public function paginate(array $filters = []);
    public function search($query, $limit = 10);
    
    // Purchase specific methods
    public function findByNumber($number);
    public function getByStatus($status);
    public function getByDepartment($departmentId);
    public function getBySupplier($supplierId);
    public function getPendingApprovals();
    public function getReadyToReceive();
    public function addItem($purchaseId, array $itemData);
    public function removeItem($purchaseId, $itemId);
    public function updateItemQuantity($purchaseId, $itemId, $quantity);
    public function approve($purchaseId, $approverId);
    public function receiveItem($purchaseItemId, $receivedQuantity, array $additionalData = []);
    public function calculateTotals($purchaseId);
}
