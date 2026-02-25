<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Aset\AssetDashboardController;
use App\Http\Controllers\Aset\AssetCategoryController;
use App\Http\Controllers\Aset\AssetController;
use App\Http\Controllers\Aset\AssetDepreciationController;
use App\Http\Controllers\Aset\AssetMaintenanceController;
use App\Http\Controllers\Aset\AssetDisposalController;
use App\Http\Controllers\Aset\AssetTransferController;
use App\Http\Controllers\Aset\AssetReportController;
use App\Http\Controllers\Aset\AssetBudgetController;

Route::middleware(['auth'])->prefix('aset')->name('aset.')->group(function () {

    // =============================================
    // ASSET DASHBOARD
    // =============================================
    Route::get('/', [AssetDashboardController::class, 'index'])
        ->name('dashboard')
        ->middleware('permission:aset.dashboard.view');

    // =============================================
    // ASSET CATEGORIES
    // =============================================
    Route::prefix('categories')->name('categories.')->group(function () {
        Route::get('/', [AssetCategoryController::class, 'index'])->name('index')->middleware('permission:aset.categories.view');
        Route::get('/create', [AssetCategoryController::class, 'create'])->name('create')->middleware('permission:aset.categories.create');
        Route::post('/', [AssetCategoryController::class, 'store'])->name('store')->middleware('permission:aset.categories.create');
        Route::get('/{category}/edit', [AssetCategoryController::class, 'edit'])->name('edit')->middleware('permission:aset.categories.edit');
        Route::put('/{category}', [AssetCategoryController::class, 'update'])->name('update')->middleware('permission:aset.categories.edit');
        Route::delete('/{category}', [AssetCategoryController::class, 'destroy'])->name('destroy')->middleware('permission:aset.categories.delete');
        Route::get('/api/search', [AssetCategoryController::class, 'api'])->name('api')->middleware('permission:aset.categories.view');
    });

    // =============================================
    // ASSETS (MASTER ASET)
    // =============================================
    Route::prefix('assets')->name('assets.')->group(function () {
        Route::get('/', [AssetController::class, 'index'])->name('index')->middleware('permission:aset.assets.view');
        Route::get('/create', [AssetController::class, 'create'])->name('create')->middleware('permission:aset.assets.create');
        Route::post('/', [AssetController::class, 'store'])->name('store')->middleware('permission:aset.assets.create');
        Route::get('/{asset}', [AssetController::class, 'show'])->name('show')->middleware('permission:aset.assets.view');
        Route::get('/{asset}/edit', [AssetController::class, 'edit'])->name('edit')->middleware('permission:aset.assets.edit');
        Route::put('/{asset}', [AssetController::class, 'update'])->name('update')->middleware('permission:aset.assets.edit');
        Route::delete('/{asset}', [AssetController::class, 'destroy'])->name('destroy')->middleware('permission:aset.assets.delete');
        Route::get('/api/search', [AssetController::class, 'api'])->name('api')->middleware('permission:aset.assets.view');
    });

    // =============================================
    // ASSET DEPRECIATIONS (PENYUSUTAN)
    // =============================================
    Route::prefix('depreciations')->name('depreciations.')->group(function () {
        Route::get('/', [AssetDepreciationController::class, 'index'])->name('index')->middleware('permission:aset.depreciations.view');
        Route::get('/calculate', [AssetDepreciationController::class, 'calculate'])->name('calculate')->middleware('permission:aset.depreciations.create');
        Route::post('/run', [AssetDepreciationController::class, 'runDepreciation'])->name('run')->middleware('permission:aset.depreciations.create');
    });

    // =============================================
    // ASSET MAINTENANCES (PEMELIHARAAN)
    // =============================================
    Route::prefix('maintenances')->name('maintenances.')->group(function () {
        Route::get('/', [AssetMaintenanceController::class, 'index'])->name('index')->middleware('permission:aset.maintenances.view');
        Route::get('/create', [AssetMaintenanceController::class, 'create'])->name('create')->middleware('permission:aset.maintenances.create');
        Route::post('/', [AssetMaintenanceController::class, 'store'])->name('store')->middleware('permission:aset.maintenances.create');
        Route::get('/{maintenance}', [AssetMaintenanceController::class, 'show'])->name('show')->middleware('permission:aset.maintenances.view');
        Route::get('/{maintenance}/edit', [AssetMaintenanceController::class, 'edit'])->name('edit')->middleware('permission:aset.maintenances.edit');
        Route::put('/{maintenance}', [AssetMaintenanceController::class, 'update'])->name('update')->middleware('permission:aset.maintenances.edit');
        Route::delete('/{maintenance}', [AssetMaintenanceController::class, 'destroy'])->name('destroy')->middleware('permission:aset.maintenances.delete');
    });

    // =============================================
    // ASSET DISPOSALS (PENGHAPUSAN/PELEPASAN)
    // =============================================
    Route::prefix('disposals')->name('disposals.')->group(function () {
        Route::get('/', [AssetDisposalController::class, 'index'])->name('index')->middleware('permission:aset.disposals.view');
        Route::get('/create', [AssetDisposalController::class, 'create'])->name('create')->middleware('permission:aset.disposals.create');
        Route::post('/', [AssetDisposalController::class, 'store'])->name('store')->middleware('permission:aset.disposals.create');
        Route::get('/{disposal}', [AssetDisposalController::class, 'show'])->name('show')->middleware('permission:aset.disposals.view');
        Route::post('/{disposal}/approve', [AssetDisposalController::class, 'approve'])->name('approve')->middleware('permission:aset.disposals.approve');
        Route::post('/{disposal}/complete', [AssetDisposalController::class, 'complete'])->name('complete')->middleware('permission:aset.disposals.approve');
        Route::post('/{disposal}/cancel', [AssetDisposalController::class, 'cancel'])->name('cancel')->middleware('permission:aset.disposals.approve');
    });

    // =============================================
    // ASSET TRANSFERS (TRANSFER ASET)
    // =============================================
    Route::prefix('transfers')->name('transfers.')->group(function () {
        Route::get('/', [AssetTransferController::class, 'index'])->name('index')->middleware('permission:aset.transfers.view');
        Route::get('/create', [AssetTransferController::class, 'create'])->name('create')->middleware('permission:aset.transfers.create');
        Route::post('/', [AssetTransferController::class, 'store'])->name('store')->middleware('permission:aset.transfers.create');
        Route::get('/{transfer}', [AssetTransferController::class, 'show'])->name('show')->middleware('permission:aset.transfers.view');
        Route::post('/{transfer}/approve', [AssetTransferController::class, 'approve'])->name('approve')->middleware('permission:aset.transfers.approve');
        Route::post('/{transfer}/complete', [AssetTransferController::class, 'complete'])->name('complete')->middleware('permission:aset.transfers.approve');
        Route::post('/{transfer}/cancel', [AssetTransferController::class, 'cancel'])->name('cancel')->middleware('permission:aset.transfers.approve');
    });

    // =============================================
    // ASSET REPORTS (LAPORAN)
    // =============================================
    Route::prefix('reports')->name('reports.')->group(function () {
        Route::get('/register', [AssetReportController::class, 'register'])->name('register')->middleware('permission:aset.reports.view');
        Route::get('/depreciation', [AssetReportController::class, 'depreciation'])->name('depreciation')->middleware('permission:aset.reports.view');
    });

    // =============================================
    // ASSET BUDGETS (RAB)
    // =============================================
    Route::prefix('budgets')->name('budgets.')->group(function () {
        Route::get('/', [AssetBudgetController::class, 'index'])->name('index')->middleware('permission:aset.budgets.view');
        Route::get('/create', [AssetBudgetController::class, 'create'])->name('create')->middleware('permission:aset.budgets.create');
        Route::post('/', [AssetBudgetController::class, 'store'])->name('store')->middleware('permission:aset.budgets.create');
        Route::get('/items/{item}/realize', [AssetBudgetController::class, 'realizeForm'])->name('realize')->middleware('permission:aset.budgets.realize');
        Route::post('/items/{item}/realize', [AssetBudgetController::class, 'realizeStore'])->name('realize.store')->middleware('permission:aset.budgets.realize');
        Route::get('/{budget}', [AssetBudgetController::class, 'show'])->name('show')->middleware('permission:aset.budgets.view');
        Route::get('/{budget}/edit', [AssetBudgetController::class, 'edit'])->name('edit')->middleware('permission:aset.budgets.edit');
        Route::put('/{budget}', [AssetBudgetController::class, 'update'])->name('update')->middleware('permission:aset.budgets.edit');
        Route::delete('/{budget}', [AssetBudgetController::class, 'destroy'])->name('destroy')->middleware('permission:aset.budgets.delete');
        Route::post('/{budget}/submit', [AssetBudgetController::class, 'submit'])->name('submit')->middleware('permission:aset.budgets.submit');
        Route::post('/{budget}/approve', [AssetBudgetController::class, 'approve'])->name('approve')->middleware('permission:aset.budgets.approve');
        Route::get('/{budget}/rollover', [AssetBudgetController::class, 'rolloverForm'])->name('rollover')->middleware('permission:aset.budgets.create');
        Route::post('/{budget}/rollover', [AssetBudgetController::class, 'rolloverStore'])->name('rollover.store')->middleware('permission:aset.budgets.create');
    });
});
