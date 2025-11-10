<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Inventory\ItemController;
use App\Http\Controllers\Inventory\DepartmentController;
use App\Http\Controllers\Inventory\ItemCategoryController;
use App\Http\Controllers\Inventory\SupplierController;
use App\Http\Controllers\Inventory\PurchaseController;
use App\Http\Controllers\Inventory\StockRequestController;
use App\Http\Controllers\Inventory\DepartmentStockController;
use App\Http\Controllers\Inventory\CentralWarehouseController;

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
        
        // Accounting integration routes - mengikuti pola kas (query param) - HARUS SEBELUM {id} routes
        Route::get('/post-to-journal', [PurchaseController::class, 'showPostToJournal'])->name('showPostToJournal')->middleware('permission:inventory.purchases.post-to-journal');
        Route::post('/post-to-journal', [PurchaseController::class, 'postToJournal'])->name('postToJournal')->middleware('permission:inventory.purchases.post-to-journal');
        
        // API endpoints - HARUS SEBELUM {id} routes
        Route::get('/api/search', [PurchaseController::class, 'search'])->name('search')->middleware('permission:inventory.purchases.view');
        
        // Routes dengan parameter {id} - HARUS PALING BAWAH
        Route::get('/{id}', [PurchaseController::class, 'show'])->name('show')->middleware('permission:inventory.purchases.view');
        Route::get('/{id}/edit', [PurchaseController::class, 'edit'])->name('edit')->middleware('permission:inventory.purchases.edit');
        Route::put('/{id}', [PurchaseController::class, 'update'])->name('update')->middleware('permission:inventory.purchases.edit');
        Route::delete('/{id}', [PurchaseController::class, 'destroy'])->name('destroy')->middleware('permission:inventory.purchases.delete');
        
        // Workflow actions
        Route::post('/{id}/submit', [PurchaseController::class, 'submit'])->name('submit')->middleware('permission:inventory.purchases.submit');
        Route::post('/{id}/approve', [PurchaseController::class, 'approve'])->name('approve')->middleware('permission:inventory.purchases.approve');
        Route::post('/{id}/mark-as-ordered', [PurchaseController::class, 'markAsOrdered'])->name('markAsOrdered')->middleware('permission:inventory.purchases.edit');
        Route::post('/{id}/cancel', [PurchaseController::class, 'cancel'])->name('cancel')->middleware('permission:inventory.purchases.cancel');
        
        // Receiving actions
        Route::get('/{id}/receive', [PurchaseController::class, 'receive'])->name('receive')->middleware('permission:inventory.purchases.receive');
        Route::post('/items/{purchaseItemId}/receive', [PurchaseController::class, 'receiveItem'])->name('receiveItem')->middleware('permission:inventory.purchases.receive');
    });

    // =============================================
    // Permintaan Stok ROUTES (NEW - Central Warehouse System)
    // =============================================
    Route::prefix('stock-requests')->name('stock-requests.')->group(function () {
        // Main CRUD routes
        Route::get('/', [StockRequestController::class, 'index'])->name('index')->middleware('permission:inventory.stock-requests.view');
        Route::get('/create', [StockRequestController::class, 'create'])->name('create')->middleware('permission:inventory.stock-requests.create');
        Route::post('/', [StockRequestController::class, 'store'])->name('store')->middleware('permission:inventory.stock-requests.create');
        
        // Detail & Edit routes
        Route::get('/{stockRequest}', [StockRequestController::class, 'show'])->name('show')->middleware('permission:inventory.stock-requests.view');
        Route::get('/{stockRequest}/edit', [StockRequestController::class, 'edit'])->name('edit')->middleware('permission:inventory.stock-requests.edit');
        Route::put('/{stockRequest}', [StockRequestController::class, 'update'])->name('update')->middleware('permission:inventory.stock-requests.edit');
        Route::delete('/{stockRequest}', [StockRequestController::class, 'destroy'])->name('destroy')->middleware('permission:inventory.stock-requests.delete');
        
        // Workflow actions
        Route::post('/{stockRequest}/submit', [StockRequestController::class, 'submit'])->name('submit')->middleware('permission:inventory.stock-requests.submit');
        
        // Approval routes
        Route::get('/{stockRequest}/approve', [StockRequestController::class, 'approvalForm'])->name('approve')->middleware('permission:inventory.stock-requests.approve');
        Route::post('/{stockRequest}/approve', [StockRequestController::class, 'approve'])->name('approve.store')->middleware('permission:inventory.stock-requests.approve');
        Route::post('/{stockRequest}/reject', [StockRequestController::class, 'reject'])->name('reject')->middleware('permission:inventory.stock-requests.approve');
        
        // Issue/Complete routes
        Route::post('/{stockRequest}/complete', [StockRequestController::class, 'complete'])->name('complete')->middleware('permission:inventory.stock-requests.complete');
        Route::post('/{stockRequest}/cancel', [StockRequestController::class, 'cancel'])->name('cancel')->middleware('permission:inventory.stock-requests.cancel');
    });

    // =============================================
    // DEPARTMENT STOCKS ROUTES
    // =============================================
    Route::prefix('department-stocks')->name('department-stocks.')->group(function () {
        Route::get('/', [DepartmentStockController::class, 'index'])->name('index')->middleware('permission:inventory.items.view');
        Route::get('/{department}', [DepartmentStockController::class, 'show'])->name('show')->middleware('permission:inventory.items.view');
    });

    // =============================================
    // CENTRAL WAREHOUSE ROUTES
    // =============================================
    Route::prefix('central-warehouse')->name('central-warehouse.')->group(function () {
        Route::get('/', [CentralWarehouseController::class, 'index'])->name('index')->middleware('permission:inventory.items.view');
    });
});
