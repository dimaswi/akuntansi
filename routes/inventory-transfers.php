<?php

use App\Http\Controllers\Department\DepartmentInventoryTransferController;
use Illuminate\Support\Facades\Route;

// Department Inventory Transfer Routes
Route::middleware(['auth'])->prefix('department-inventory-transfers')->name('department-inventory-transfers.')->group(function () {
    Route::get('/', [DepartmentInventoryTransferController::class, 'index'])->name('index')
        ->middleware('permission:view_inventory_transfers');
    
    Route::get('/{transfer}', [DepartmentInventoryTransferController::class, 'show'])->name('show')
        ->middleware('permission:view_inventory_transfers');
    
    Route::get('/create-from-request/{departmentRequest}', [DepartmentInventoryTransferController::class, 'createFromRequest'])->name('create-from-request')
        ->middleware('permission:create_inventory_transfers');
    
    Route::post('/', [DepartmentInventoryTransferController::class, 'store'])->name('store')
        ->middleware('permission:create_inventory_transfers');
    
    Route::put('/{transfer}/approve', [DepartmentInventoryTransferController::class, 'approve'])->name('approve')
        ->middleware('permission:approve_inventory_transfers');
    
    Route::put('/{transfer}/transfer', [DepartmentInventoryTransferController::class, 'transfer'])->name('transfer')
        ->middleware('permission:execute_inventory_transfers');
    
    Route::put('/{transfer}/receive', [DepartmentInventoryTransferController::class, 'receive'])->name('receive')
        ->middleware('permission:receive_inventory_transfers');
    
    Route::put('/{transfer}/cancel', [DepartmentInventoryTransferController::class, 'cancel'])->name('cancel')
        ->middleware('permission:cancel_inventory_transfers');
});
