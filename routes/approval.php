<?php

use App\Http\Controllers\ApprovalController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    
    // Approval Management Routes
    Route::get('approvals', [ApprovalController::class, 'index'])
        ->name('approvals.index')
        ->middleware(['permission:approval.cash-transactions.approve,approval.journal-posting.approve,approval.monthly-closing.approve']);
    
    Route::get('approvals/{approval}', [ApprovalController::class, 'show'])
        ->name('approvals.show')
        ->middleware(['permission:approval.cash-transactions.approve,approval.journal-posting.approve,approval.monthly-closing.approve']);
    
    Route::post('approvals/{approval}/approve', [ApprovalController::class, 'approve'])
        ->name('approvals.approve')
        ->middleware(['permission:approval.cash-transactions.approve,approval.journal-posting.approve,approval.monthly-closing.approve']);
    
    Route::post('approvals/{approval}/reject', [ApprovalController::class, 'reject'])
        ->name('approvals.reject')
        ->middleware(['permission:approval.cash-transactions.approve,approval.journal-posting.approve,approval.monthly-closing.approve']);
    
    // API Routes for Notifications
    Route::get('api/approvals/notifications', [ApprovalController::class, 'notifications'])
        ->name('api.approvals.notifications')
        ->middleware(['permission:approval.cash-transactions.approve,approval.journal-posting.approve,approval.monthly-closing.approve']);
});
