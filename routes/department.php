<?php

use App\Http\Controllers\Department\DepartmentController;
use App\Http\Controllers\Department\DepartmentRequestController;
use App\Http\Controllers\Department\DepartmentRequestReportController;
use App\Http\Controllers\Department\DepartmentStockController;
use Illuminate\Support\Facades\Route;

// Stock routes for current user's department
Route::middleware('auth')->group(function () {
    Route::get('/departments/stock', [DepartmentStockController::class, 'myDepartmentStock'])
        ->middleware('permission:department.stock.view')
        ->name('departments.my-stock');
    
    Route::get('/departments/stock/opname', [DepartmentStockController::class, 'myDepartmentOpname'])
        ->middleware('permission:department.stock.opname')
        ->name('departments.my-stock.opname');
});

// Department routes
Route::prefix('departments')->name('departments.')->middleware('auth')->group(function () {
    Route::get('/', [DepartmentController::class, 'index'])->name('index');
    Route::get('/create', [DepartmentController::class, 'create'])->name('create');
    Route::post('/', [DepartmentController::class, 'store'])->name('store');
    Route::get('/{department}', [DepartmentController::class, 'show'])->name('show');
    Route::get('/{department}/edit', [DepartmentController::class, 'edit'])->name('edit');
    Route::put('/{department}', [DepartmentController::class, 'update'])->name('update');
    Route::delete('/{department}', [DepartmentController::class, 'destroy'])->name('destroy');
    
    // Stock management routes untuk setiap department
    Route::prefix('/{department}/stock')->name('stock.')->group(function () {
        Route::get('/', [DepartmentStockController::class, 'index'])->name('index')
            ->middleware('permission:department.stock.view');
        
        Route::get('/create', [DepartmentStockController::class, 'create'])->name('create')
            ->middleware('permission:department.stock.create');
        
        Route::post('/', [DepartmentStockController::class, 'store'])->name('store')
            ->middleware('permission:department.stock.create');
        
        Route::get('/opname', [DepartmentStockController::class, 'opnameIndex'])->name('opname')
            ->middleware('permission:department.stock.opname');
        
        Route::post('/opname', [DepartmentStockController::class, 'processStockOpname'])->name('opname.store')
            ->middleware('permission:department.stock.opname');
    });
    
    // API routes for statistics
    Route::get('/api/budget-status', [DepartmentController::class, 'getBudgetStatus'])->name('budget-status');
    Route::get('/api/hierarchy', [DepartmentController::class, 'getHierarchy'])->name('hierarchy');
});

// Department Request routes
Route::prefix('department-requests')->name('department-requests.')->middleware('auth')->group(function () {
    Route::get('/', [DepartmentRequestController::class, 'index'])
        ->middleware('permission:department-requests.index')
        ->name('index');
    Route::get('/create', [DepartmentRequestController::class, 'create'])
        ->middleware('permission:department-requests.create')
        ->name('create');
    Route::post('/', [DepartmentRequestController::class, 'store'])
        ->middleware('permission:department-requests.create')
        ->name('store');
    
    // API route for getting items by department
    Route::get('/api/items-by-department', [DepartmentRequestController::class, 'getItemsByDepartment'])
        ->name('api.items-by-department');
    
    // Reports routes - harus ditempatkan SEBELUM route dengan parameter
    Route::get('/reports', [DepartmentRequestReportController::class, 'index'])
        ->middleware('permission:department-requests.reports')
        ->name('reports');
    Route::get('/reports/export', [DepartmentRequestReportController::class, 'export'])
        ->middleware('permission:department-requests.export')
        ->name('reports.export');
    
    Route::get('/{departmentRequest}', [DepartmentRequestController::class, 'show'])
        ->middleware('permission:department-requests.show')
        ->name('show');
    Route::get('/{departmentRequest}/edit', [DepartmentRequestController::class, 'edit'])
        ->middleware('permission:department-requests.edit')
        ->name('edit');
    Route::put('/{departmentRequest}', [DepartmentRequestController::class, 'update'])
        ->middleware('permission:department-requests.edit')
        ->name('update');
    Route::delete('/{departmentRequest}', [DepartmentRequestController::class, 'destroy'])
        ->middleware('permission:department-requests.delete')
        ->name('destroy');
    
    // Workflow actions
    Route::post('/{departmentRequest}/submit', [DepartmentRequestController::class, 'submit'])
        ->middleware('permission:department-requests.submit')
        ->name('submit');
    Route::post('/{departmentRequest}/approve', [DepartmentRequestController::class, 'approve'])
        ->middleware('permission:department-requests.approve')
        ->name('approve');
    Route::post('/{departmentRequest}/reject', [DepartmentRequestController::class, 'reject'])
        ->middleware('permission:department-requests.reject')
        ->name('reject');
    Route::post('/{departmentRequest}/fulfill', [DepartmentRequestController::class, 'fulfill'])
        ->middleware('permission:department-requests.fulfill')
        ->name('fulfill');
});
