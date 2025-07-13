<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Inventory\ItemController;
use App\Http\Controllers\Inventory\DepartmentController;
use App\Http\Controllers\Inventory\ItemCategoryController;
use App\Http\Controllers\Inventory\SupplierController;
use App\Http\Controllers\Inventory\PurchaseController;
use App\Http\Controllers\Inventory\RequisitionController;

Route::middleware(['auth'])->group(function () {
    
    // =============================================
    // INVENTORY ITEMS ROUTES
    // =============================================
    Route::prefix('items')->name('items.')->group(function () {
        Route::get('/', [ItemController::class, 'index'])->name('index')->middleware('permission:inventory.items.view');
        Route::get('/create', [ItemController::class, 'create'])->name('create')->middleware('permission:inventory.items.create');
        Route::post('/', [ItemController::class, 'store'])->name('store')->middleware('permission:inventory.items.create');
        Route::get('/{item}', [ItemController::class, 'show'])->name('show')->middleware('permission:inventory.items.view');
        Route::get('/{item}/edit', [ItemController::class, 'edit'])->name('edit')->middleware('permission:inventory.items.edit');
        Route::put('/{item}', [ItemController::class, 'update'])->name('update')->middleware('permission:inventory.items.edit');
        Route::delete('/{item}', [ItemController::class, 'destroy'])->name('destroy')->middleware('permission:inventory.items.delete');
        
        // API Routes
        Route::get('/api/search', [ItemController::class, 'api'])->name('api')->middleware('permission:inventory.items.view');
        Route::get('/api/search-with-stock', [ItemController::class, 'searchWithStock'])->name('searchWithStock')->middleware('permission:inventory.items.view');
    });

    // =============================================
    // DEPARTMENT ROUTES
    // =============================================
    Route::prefix('departments')->name('departments.')->group(function () {
        Route::get('/', [DepartmentController::class, 'index'])->name('index')->middleware('permission:inventory.departments.view');
        Route::get('/create', [DepartmentController::class, 'create'])->name('create')->middleware('permission:inventory.departments.create');
        Route::post('/', [DepartmentController::class, 'store'])->name('store')->middleware('permission:inventory.departments.create');
        Route::get('/{department}', [DepartmentController::class, 'show'])->name('show')->middleware('permission:inventory.departments.view');
        Route::get('/{department}/edit', [DepartmentController::class, 'edit'])->name('edit')->middleware('permission:inventory.departments.edit');
        Route::put('/{department}', [DepartmentController::class, 'update'])->name('update')->middleware('permission:inventory.departments.edit');
        Route::delete('/{department}', [DepartmentController::class, 'destroy'])->name('destroy')->middleware('permission:inventory.departments.delete');
        
        // API Routes
        Route::get('/api/search', [DepartmentController::class, 'api'])->name('api')->middleware('permission:inventory.departments.view');
    });

    // =============================================
    // ITEM CATEGORIES ROUTES
    // =============================================
    Route::prefix('item-categories')->name('item_categories.')->group(function () {
        Route::get('/', [ItemCategoryController::class, 'index'])->name('index')->middleware('permission:inventory.categories.view');
        Route::get('/create', [ItemCategoryController::class, 'create'])->name('create')->middleware('permission:inventory.categories.create');
        Route::post('/', [ItemCategoryController::class, 'store'])->name('store')->middleware('permission:inventory.categories.create');
        Route::get('/{category}', [ItemCategoryController::class, 'show'])->name('show')->middleware('permission:inventory.categories.view');
        Route::get('/{category}/edit', [ItemCategoryController::class, 'edit'])->name('edit')->middleware('permission:inventory.categories.edit');
        Route::put('/{category}', [ItemCategoryController::class, 'update'])->name('update')->middleware('permission:inventory.categories.edit');
        Route::delete('/{category}', [ItemCategoryController::class, 'destroy'])->name('destroy')->middleware('permission:inventory.categories.delete');
        
        // API Routes
        Route::get('/api/search', [ItemCategoryController::class, 'api'])->name('api')->middleware('permission:inventory.categories.view');
    });

    // =============================================
    // SUPPLIERS ROUTES
    // =============================================
    Route::prefix('suppliers')->name('suppliers.')->group(function () {
        Route::get('/', [SupplierController::class, 'index'])->name('index')->middleware('permission:inventory.suppliers.view');
        Route::get('/create', [SupplierController::class, 'create'])->name('create')->middleware('permission:inventory.suppliers.create');
        Route::post('/', [SupplierController::class, 'store'])->name('store')->middleware('permission:inventory.suppliers.create');
        Route::get('/{supplier}', [SupplierController::class, 'show'])->name('show')->middleware('permission:inventory.suppliers.view');
        Route::get('/{supplier}/edit', [SupplierController::class, 'edit'])->name('edit')->middleware('permission:inventory.suppliers.edit');
        Route::put('/{supplier}', [SupplierController::class, 'update'])->name('update')->middleware('permission:inventory.suppliers.edit');
        Route::delete('/{supplier}', [SupplierController::class, 'destroy'])->name('destroy')->middleware('permission:inventory.suppliers.delete');
        
        // API Routes
        Route::post('/{supplier}/toggle-status', [SupplierController::class, 'toggleStatus'])->name('toggle-status')->middleware('permission:inventory.suppliers.toggle-status');
        Route::get('/api/search', [SupplierController::class, 'api'])->name('api')->middleware('permission:inventory.suppliers.view');
    });

    // =============================================
    // PURCHASE ROUTES - Restricted to Logistics Department
    // =============================================
    Route::prefix('purchases')->name('purchases.')->group(function () {
        
        // Main CRUD routes
        Route::get('/', [PurchaseController::class, 'index'])->name('index')->middleware('permission:inventory.purchases.view');
        Route::get('/create', [PurchaseController::class, 'create'])->name('create')->middleware('permission:inventory.purchases.create');
        Route::post('/', [PurchaseController::class, 'store'])->name('store')->middleware('permission:inventory.purchases.create');
        Route::get('/{id}', [PurchaseController::class, 'show'])->name('show')->middleware('permission:inventory.purchases.view');
        Route::get('/{id}/edit', [PurchaseController::class, 'edit'])->name('edit')->middleware('permission:inventory.purchases.edit');
        Route::put('/{id}', [PurchaseController::class, 'update'])->name('update')->middleware('permission:inventory.purchases.edit');
        Route::delete('/{id}', [PurchaseController::class, 'destroy'])->name('destroy')->middleware('permission:inventory.purchases.delete');
        
        // Workflow actions
        Route::post('/{id}/submit', [PurchaseController::class, 'submit'])->name('submit')->middleware('permission:inventory.purchases.submit');
        Route::post('/{id}/approve', [PurchaseController::class, 'approve'])->name('approve')->middleware('permission:inventory.purchases.approve');
        Route::post('/{id}/cancel', [PurchaseController::class, 'cancel'])->name('cancel')->middleware('permission:inventory.purchases.cancel');
        
        // Receiving actions
        Route::get('/{id}/receive', [PurchaseController::class, 'receive'])->name('receive')->middleware('permission:inventory.purchases.receive');
        Route::post('/items/{purchaseItemId}/receive', [PurchaseController::class, 'receiveItem'])->name('receiveItem')->middleware('permission:inventory.purchases.receive');
        
        // Special views
        Route::get('/pending/approvals', [PurchaseController::class, 'pendingApprovals'])->name('pendingApprovals')->middleware('permission:inventory.purchases.approve');
        Route::get('/ready/receive', [PurchaseController::class, 'readyToReceive'])->name('readyToReceive')->middleware('permission:inventory.purchases.receive');
        
        // API endpoints
        Route::get('/api/search', [PurchaseController::class, 'search'])->name('search')->middleware('permission:inventory.purchases.view');
    });

    // Requisitions routes
    Route::prefix('requisitions')->group(function () {
        Route::get('/', [RequisitionController::class, 'index'])->name('requisitions.index')->middleware('permission:inventory.requisitions.view');
        Route::get('/create', [RequisitionController::class, 'create'])->name('requisitions.create')->middleware('permission:inventory.requisitions.create');
        Route::post('/', [RequisitionController::class, 'store'])->name('requisitions.store')->middleware('permission:inventory.requisitions.create');
        Route::get('/{requisition}', [RequisitionController::class, 'show'])->name('requisitions.show')->middleware('permission:inventory.requisitions.view');
        Route::get('/{requisition}/edit', [RequisitionController::class, 'edit'])->name('requisitions.edit')->middleware('permission:inventory.requisitions.edit');
        Route::put('/{requisition}', [RequisitionController::class, 'update'])->name('requisitions.update')->middleware('permission:inventory.requisitions.edit');
        Route::delete('/{requisition}', [RequisitionController::class, 'destroy'])->name('requisitions.destroy')->middleware('permission:inventory.requisitions.delete');
        
        // Workflow actions
        Route::put('/{requisition}/submit', [RequisitionController::class, 'submit'])->name('requisitions.submit')->middleware('permission:inventory.requisitions.create');
        Route::put('/{requisition}/approve', [RequisitionController::class, 'approve'])->name('requisitions.approve')->middleware('permission:inventory.requisitions.approve');
        Route::put('/{requisition}/reject', [RequisitionController::class, 'reject'])->name('requisitions.reject')->middleware('permission:inventory.requisitions.approve');
        Route::put('/{requisition}/cancel', [RequisitionController::class, 'cancel'])->name('requisitions.cancel')->middleware('permission:inventory.requisitions.cancel');
        
        // Special views for workflows
        Route::get('/pending/approvals', [RequisitionController::class, 'pendingApprovals'])->name('requisitions.pendingApprovals')->middleware('permission:inventory.requisitions.approve');
        Route::get('/my/requests', [RequisitionController::class, 'myRequests'])->name('requisitions.myRequests')->middleware('permission:inventory.requisitions.view');
        
        // API endpoints
        Route::get('/api/search', [RequisitionController::class, 'search'])->name('requisitions.search')->middleware('permission:inventory.requisitions.view');
    });
});
