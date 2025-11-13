<?php

use App\Http\Controllers\Penggajian\SalaryBatchController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->prefix('penggajian')->name('penggajian.')->group(function () {
    
    // Batch Management
    Route::get('/', [SalaryBatchController::class, 'index'])
        ->name('index')
        ->middleware('permission:penggajian.view');
    
    Route::get('/create', [SalaryBatchController::class, 'create'])
        ->name('create')
        ->middleware('permission:penggajian.create');
    
    Route::post('/', [SalaryBatchController::class, 'store'])
        ->name('store')
        ->middleware('permission:penggajian.create');
    
    Route::get('/{salaryBatch}/edit', [SalaryBatchController::class, 'edit'])
        ->name('edit')
        ->middleware('permission:penggajian.edit');
    
    Route::put('/{salaryBatch}', [SalaryBatchController::class, 'update'])
        ->name('update')
        ->middleware('permission:penggajian.edit');
    
    Route::delete('/{salaryBatch}', [SalaryBatchController::class, 'destroy'])
        ->name('destroy')
        ->middleware('permission:penggajian.delete');
    
    // Input Gaji (Excel-like table)
    Route::get('/{salaryBatch}/input-gaji', [SalaryBatchController::class, 'inputGaji'])
        ->name('input-gaji')
        ->middleware('permission:penggajian.input-gaji');
    
    Route::post('/{salaryBatch}/input-gaji', [SalaryBatchController::class, 'storeGaji'])
        ->name('store-gaji')
        ->middleware('permission:penggajian.input-gaji');
    
    // Post to Journal (pattern sama dengan kas)
    Route::get('/post-to-journal', [SalaryBatchController::class, 'showPostToJournal'])
        ->name('showPostToJournal')
        ->middleware('permission:penggajian.post-to-journal');
    
    Route::post('/post-to-journal', [SalaryBatchController::class, 'postToJournal'])
        ->name('postToJournal')
        ->middleware('permission:penggajian.post-to-journal');
});
