<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Akuntansi\MonthlyClosingController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::prefix('monthly-closing')->name('monthly-closing.')->group(function () {
        Route::get('/', [MonthlyClosingController::class, 'index'])
            ->name('index')
            ->middleware('permission:monthly-closing.view');
        Route::get('/create', [MonthlyClosingController::class, 'create'])
            ->name('create')
            ->middleware('permission:monthly-closing.create');
        Route::post('/', [MonthlyClosingController::class, 'store'])
            ->name('store')
            ->middleware('permission:monthly-closing.create');
        Route::get('/{monthlyClosing}', [MonthlyClosingController::class, 'show'])
            ->name('show')
            ->middleware('permission:monthly-closing.view');
        Route::patch('/{monthlyClosing}/approve', [MonthlyClosingController::class, 'approve'])
            ->name('approve')
            ->middleware('permission:monthly-closing.approve');
        Route::patch('/{monthlyClosing}/close', [MonthlyClosingController::class, 'close'])
            ->name('close')
            ->middleware('permission:monthly-closing.close');
        Route::patch('/{monthlyClosing}/reopen', [MonthlyClosingController::class, 'reopen'])
            ->name('reopen')
            ->middleware('permission:monthly-closing.reopen');
    });
});
