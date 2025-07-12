<?php

use App\Http\Controllers\Inventory\InventoryCategoryController;
use App\Http\Controllers\Inventory\InventoryItemController;
use App\Http\Controllers\Inventory\InventoryLocationController;
use App\Http\Controllers\Inventory\InventoryDashboardController;
use App\Http\Controllers\Inventory\InventoryStockCountController;
use App\Http\Controllers\Inventory\InventoryMovementController;
use App\Http\Controllers\Inventory\StockMovementController;
use App\Http\Controllers\Inventory\InventoryReportController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    
    // Inventory Dashboard
    Route::get('inventory', [InventoryDashboardController::class, 'index'])->name('inventory.dashboard');
    Route::get('inventory/low-stock-alert', [InventoryDashboardController::class, 'getLowStockAlert'])->name('inventory.low-stock-alert');
    Route::get('inventory/stock-summary', [InventoryDashboardController::class, 'getStockSummary'])->name('inventory.stock-summary');
    
    // Inventory Categories
    Route::prefix('inventory')->name('inventory.')->group(function () {
        
        // Categories
        Route::resource('categories', InventoryCategoryController::class);
        Route::get('categories/{category}/subcategories', [InventoryCategoryController::class, 'getSubcategories'])
            ->name('categories.subcategories');
        
        // Items
        Route::resource('items', InventoryItemController::class)
            ->middleware([
                'index' => 'permission:inventory.item.view',
                'create' => 'permission:inventory.item.create',
                'store' => 'permission:inventory.item.create',
                'show' => 'permission:inventory.item.view',
                'edit' => 'permission:inventory.item.edit',
                'update' => 'permission:inventory.item.edit',
                'destroy' => 'permission:inventory.item.delete'
            ]);
        Route::get('items/search', [InventoryItemController::class, 'search'])
            ->name('items.search')
            ->middleware('permission:inventory.item.view');
        Route::get('low-stock-items', [InventoryItemController::class, 'getLowStockItems'])
            ->name('items.low-stock')
            ->middleware('permission:inventory.item.view');

        // Locations
        Route::resource('locations', InventoryLocationController::class)
            ->middleware([
                'index' => 'permission:inventory.location.view',
                'create' => 'permission:inventory.location.create',
                'store' => 'permission:inventory.location.create',
                'show' => 'permission:inventory.location.view',
                'edit' => 'permission:inventory.location.edit',
                'update' => 'permission:inventory.location.edit',
                'destroy' => 'permission:inventory.location.delete'
            ]);
        
        // Stock Count
        Route::resource('stock-count', InventoryStockCountController::class, ['names' => 'stock-count']);
        Route::post('stock-count/{stockCount}/approve', [InventoryStockCountController::class, 'approve'])
            ->name('stock-count.approve');
        Route::post('stock-count/{stockCount}/reject', [InventoryStockCountController::class, 'reject'])
            ->name('stock-count.reject');
        Route::get('stock-count/items/{location}', [InventoryStockCountController::class, 'getItemsForLocation'])
            ->name('stock-count.items');
        
        // Stock Movement
        Route::resource('movements', InventoryMovementController::class);
        Route::post('movements/{movement}/approve', [InventoryMovementController::class, 'approve'])
            ->name('movements.approve');
        Route::post('movements/{movement}/reject', [InventoryMovementController::class, 'reject'])
            ->name('movements.reject');
        
        // Stock Movement (New Implementation)
        Route::resource('stock-movements', StockMovementController::class)
            ->middleware([
                'index' => 'permission:inventory.movement.view',
                'create' => 'permission:inventory.movement.create',
                'store' => 'permission:inventory.movement.create',
                'show' => 'permission:inventory.movement.view',
                'edit' => 'permission:inventory.movement.edit',
                'update' => 'permission:inventory.movement.edit',
                'destroy' => 'permission:inventory.movement.delete'
            ]);
        Route::get('stock-movements/{movement}/print', [StockMovementController::class, 'print'])
            ->name('stock-movements.print')
            ->middleware('permission:inventory.movement.view');

        // Inventory Reports
        Route::get('reports', [InventoryReportController::class, 'index'])
            ->name('reports.index')
            ->middleware('permission:inventory.report.view');
        Route::get('reports/stock-level', [InventoryReportController::class, 'stockLevel'])
            ->name('reports.stock-level')
            ->middleware('permission:inventory.report.view');
        Route::get('reports/stock-level-data', [InventoryReportController::class, 'stockLevelData'])
            ->name('reports.stock-level-data')
            ->middleware('permission:inventory.report.view');
        Route::get('reports/movement-history', [InventoryReportController::class, 'movementHistory'])
            ->name('reports.movement-history')
            ->middleware('permission:inventory.report.view');
        Route::get('reports/movement-history-data', [InventoryReportController::class, 'movementHistoryData'])
            ->name('reports.movement-history-data')
            ->middleware('permission:inventory.report.view');
        Route::get('reports/stock-valuation', [InventoryReportController::class, 'stockValuation'])
            ->name('reports.stock-valuation')
            ->middleware('permission:inventory.report.view');
        Route::get('reports/stock-valuation-data', [InventoryReportController::class, 'stockValuationData'])
            ->name('reports.stock-valuation-data')
            ->middleware('permission:inventory.report.view');
        
        // Export Routes
        Route::get('reports/export/stock-level', [InventoryReportController::class, 'exportStockLevel'])
            ->name('reports.export.stock-level')
            ->middleware('permission:inventory.report.export');
        Route::get('reports/export/movement-history', [InventoryReportController::class, 'exportMovementHistory'])
            ->name('reports.export.movement-history')
            ->middleware('permission:inventory.report.export');
        Route::get('reports/export/stock-valuation', [InventoryReportController::class, 'exportStockValuation'])
            ->name('reports.export.stock-valuation')
            ->middleware('permission:inventory.report.export');
        
        // API Routes for AJAX calls
        Route::prefix('api')->name('api.')->group(function () {
            Route::get('/items/search', [InventoryItemController::class, 'search']);
            Route::get('/categories/{category}/subcategories', [InventoryCategoryController::class, 'getSubcategories']);
        });
    });
});
