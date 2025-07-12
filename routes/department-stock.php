<?php

use App\Http\Controllers\Department\DepartmentStockController;
use Illuminate\Support\Facades\Route;

// Department Stock Management Routes
Route::middleware(['auth'])->prefix('department-stock')->name('department-stock.')->group(function () {
    Route::get('/', [DepartmentStockController::class, 'index'])->name('index')
        ->middleware('permission:inventory.view');
    
    Route::get('/create', [DepartmentStockController::class, 'create'])->name('create')
        ->middleware('permission:inventory.item.create');
    
    Route::post('/', [DepartmentStockController::class, 'store'])->name('store')
        ->middleware('permission:inventory.item.create');
    
    Route::get('/{location}', [DepartmentStockController::class, 'show'])->name('show')
        ->middleware('permission:inventory.view');
    
    Route::get('/{location}/edit', [DepartmentStockController::class, 'edit'])->name('edit')
        ->middleware('permission:inventory.item.edit');
    
    Route::put('/{location}', [DepartmentStockController::class, 'update'])->name('update')
        ->middleware('permission:inventory.item.edit');
    
    Route::post('/{location}/stock-opname', [DepartmentStockController::class, 'stockOpname'])->name('stock-opname')
        ->middleware('permission:inventory.movement.create');
    
    Route::get('/{location}/opname', [DepartmentStockController::class, 'opnameIndex'])->name('opname')
        ->middleware('permission:inventory.movement.create');
});
