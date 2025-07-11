<?php

use App\Http\Controllers\Kas\BankAccountController;
use App\Http\Controllers\Kas\CashTransactionController;
use App\Http\Controllers\Kas\BankTransactionController;
use App\Http\Controllers\Kas\GiroTransactionController;
use App\Http\Controllers\Kas\KasDashboardController;
use App\Http\Controllers\Kas\CashFlowReportController;
use App\Http\Controllers\Kas\GiroReportController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    
    // Kas Dashboard
    Route::get('kas', [KasDashboardController::class, 'index'])
        ->name('kas.index')
        ->middleware('permission:kas.cash-management.view');
    
    // Bank Accounts
    Route::get('kas/bank-accounts', [BankAccountController::class, 'index'])
        ->name('kas.bank-accounts.index')
        ->middleware('permission:kas.bank-account.view');
        
    Route::get('kas/bank-accounts/create', [BankAccountController::class, 'create'])
        ->name('kas.bank-accounts.create')
        ->middleware('permission:kas.bank-account.create');
        
    Route::post('kas/bank-accounts', [BankAccountController::class, 'store'])
        ->name('kas.bank-accounts.store')
        ->middleware('permission:kas.bank-account.create');
        
    Route::get('kas/bank-accounts/{bankAccount}', [BankAccountController::class, 'show'])
        ->name('kas.bank-accounts.show')
        ->middleware('permission:kas.bank-account.view');
        
    Route::get('kas/bank-accounts/{bankAccount}/edit', [BankAccountController::class, 'edit'])
        ->name('kas.bank-accounts.edit')
        ->middleware('permission:kas.bank-account.edit');
        
    Route::put('kas/bank-accounts/{bankAccount}', [BankAccountController::class, 'update'])
        ->name('kas.bank-accounts.update')
        ->middleware('permission:kas.bank-account.edit');
        
    Route::delete('kas/bank-accounts/{bankAccount}', [BankAccountController::class, 'destroy'])
        ->name('kas.bank-accounts.destroy')
        ->middleware('permission:kas.bank-account.delete');

    // Cash Transactions
    Route::get('kas/cash-transactions', [CashTransactionController::class, 'index'])
        ->name('kas.cash-transactions.index')
        ->middleware('permission:kas.cash-management.view');
        
    Route::get('kas/cash-transactions/create', [CashTransactionController::class, 'create'])
        ->name('kas.cash-transactions.create')
        ->middleware('permission:kas.cash-management.daily-entry');
        
    // Cash Transactions - Batch Posting Routes (must be before {cashTransaction} routes)
    Route::get('kas/cash-transactions/post-to-journal', [CashTransactionController::class, 'showPostToJournal'])
        ->name('kas.cash-transactions.show-post-to-journal')
        ->middleware('permission:akuntansi.journal-posting.view');
        
    Route::post('kas/cash-transactions/post-to-journal', [CashTransactionController::class, 'postToJournal'])
        ->name('kas.cash-transactions.post-to-journal')
        ->middleware('permission:akuntansi.journal-posting.post');
        
    Route::post('kas/cash-transactions', [CashTransactionController::class, 'store'])
        ->name('kas.cash-transactions.store')
        ->middleware('permission:kas.cash-management.daily-entry');
        
    Route::get('kas/cash-transactions/{cashTransaction}', [CashTransactionController::class, 'show'])
        ->name('kas.cash-transactions.show')
        ->middleware('permission:kas.cash-management.view');
        
    Route::get('kas/cash-transactions/{cashTransaction}/edit', [CashTransactionController::class, 'edit'])
        ->name('kas.cash-transactions.edit')
        ->middleware('permission:kas.cash-management.daily-entry');
        
    Route::put('kas/cash-transactions/{cashTransaction}', [CashTransactionController::class, 'update'])
        ->name('kas.cash-transactions.update')
        ->middleware('permission:kas.cash-management.daily-entry');
        
    Route::delete('kas/cash-transactions/{cashTransaction}', [CashTransactionController::class, 'destroy'])
        ->name('kas.cash-transactions.destroy')
        ->middleware('permission:kas.cash-transaction.delete');
        
    // Individual Cash Transaction Posting
    Route::post('kas/cash-transactions/{cashTransaction}/post', [CashTransactionController::class, 'postIndividual'])
        ->name('kas.cash-transactions.post-individual')
        ->middleware('permission:kas.cash-transaction.post');

    // Bank Transactions
    Route::get('kas/bank-transactions', [BankTransactionController::class, 'index'])
        ->name('kas.bank-transactions.index')
        ->middleware('permission:kas.cash-management.view');
        
    Route::get('kas/bank-transactions/create', [BankTransactionController::class, 'create'])
        ->name('kas.bank-transactions.create')
        ->middleware('permission:kas.cash-management.daily-entry');
        
    // Bank Transactions - Batch Posting Routes (must be before {bankTransaction} routes)
    Route::get('kas/bank-transactions/post-to-journal', [BankTransactionController::class, 'showPostToJournal'])
        ->name('kas.bank-transactions.show-post-to-journal')
        ->middleware('permission:akuntansi.journal-posting.view');
        
    Route::post('kas/bank-transactions/post-to-journal', [BankTransactionController::class, 'postToJournal'])
        ->name('kas.bank-transactions.post-to-journal')
        ->middleware('permission:akuntansi.journal-posting.post');
        
    Route::post('kas/bank-transactions', [BankTransactionController::class, 'store'])
        ->name('kas.bank-transactions.store')
        ->middleware('permission:kas.cash-management.daily-entry');
        
    Route::get('kas/bank-transactions/{bankTransaction}', [BankTransactionController::class, 'show'])
        ->name('kas.bank-transactions.show')
        ->middleware('permission:kas.cash-management.view');
        
    Route::get('kas/bank-transactions/{bankTransaction}/edit', [BankTransactionController::class, 'edit'])
        ->name('kas.bank-transactions.edit')
        ->middleware('permission:kas.cash-management.daily-entry');
        
    Route::put('kas/bank-transactions/{bankTransaction}', [BankTransactionController::class, 'update'])
        ->name('kas.bank-transactions.update')
        ->middleware('permission:kas.cash-management.daily-entry');
        
    Route::delete('kas/bank-transactions/{bankTransaction}', [BankTransactionController::class, 'destroy'])
        ->name('kas.bank-transactions.destroy')
        ->middleware('permission:kas.bank-transaction.delete');
        
    // Individual Bank Transaction Posting
    Route::post('kas/bank-transactions/{bankTransaction}/post', [BankTransactionController::class, 'postIndividual'])
        ->name('kas.bank-transactions.post-individual')
        ->middleware('permission:kas.bank-transaction.post');
        
    Route::post('kas/bank-transactions/{bankTransaction}/reconcile', [BankTransactionController::class, 'reconcile'])
        ->name('kas.bank-transactions.reconcile')
        ->middleware('permission:kas.cash-management.reconcile');

    // Giro Transactions
    Route::get('kas/giro-transactions', [GiroTransactionController::class, 'index'])
        ->name('kas.giro-transactions.index')
        ->middleware('permission:kas.giro-transaction.view');
        
    Route::get('kas/giro-transactions/create', [GiroTransactionController::class, 'create'])
        ->name('kas.giro-transactions.create')
        ->middleware('permission:kas.giro-transaction.create');
        
    // Giro Transactions - Batch Posting Routes (must be before {giroTransaction} routes)
    Route::get('kas/giro-transactions/post-to-journal', [GiroTransactionController::class, 'showPostToJournal'])
        ->name('kas.giro-transactions.show-post-to-journal')
        ->middleware('permission:akuntansi.journal-posting.view');
        
    Route::post('kas/giro-transactions/post-to-journal', [GiroTransactionController::class, 'postToJournal'])
        ->name('kas.giro-transactions.post-to-journal')
        ->middleware('permission:akuntansi.journal-posting.post');
        
    Route::post('kas/giro-transactions', [GiroTransactionController::class, 'store'])
        ->name('kas.giro-transactions.store')
        ->middleware('permission:kas.giro-transaction.create');
        
    Route::get('kas/giro-transactions/{giroTransaction}', [GiroTransactionController::class, 'show'])
        ->name('kas.giro-transactions.show')
        ->middleware('permission:kas.giro-transaction.view');
        
    Route::get('kas/giro-transactions/{giroTransaction}/edit', [GiroTransactionController::class, 'edit'])
        ->name('kas.giro-transactions.edit')
        ->middleware('permission:kas.giro-transaction.edit');
        
    Route::put('kas/giro-transactions/{giroTransaction}', [GiroTransactionController::class, 'update'])
        ->name('kas.giro-transactions.update')
        ->middleware('permission:kas.giro-transaction.edit');
        
    Route::delete('kas/giro-transactions/{giroTransaction}', [GiroTransactionController::class, 'destroy'])
        ->name('kas.giro-transactions.destroy')
        ->middleware('permission:kas.giro-transaction.delete');
        
    // Individual Giro Transaction Posting
    Route::post('kas/giro-transactions/{giroTransaction}/post', [GiroTransactionController::class, 'postIndividual'])
        ->name('kas.giro-transactions.post-individual')
        ->middleware('permission:kas.giro-transaction.post');
        
    Route::post('kas/giro-transactions/{giroTransaction}/submit-to-bank', [GiroTransactionController::class, 'submitToBank'])
        ->name('kas.giro-transactions.submit-to-bank')
        ->middleware('permission:kas.giro-transaction.post');
        
    Route::post('kas/giro-transactions/{giroTransaction}/cash', [GiroTransactionController::class, 'cash'])
        ->name('kas.giro-transactions.cash')
        ->middleware('permission:kas.giro-transaction.clear');
        
    Route::post('kas/giro-transactions/{giroTransaction}/bounce', [GiroTransactionController::class, 'bounce'])
        ->name('kas.giro-transactions.bounce')
        ->middleware('permission:kas.giro-transaction.reject');

    // Cash Flow Reports
    Route::get('kas/reports/cash-flow', [CashFlowReportController::class, 'index'])
        ->name('kas.reports.cash-flow')
        ->middleware('permission:laporan.cash-flow.view');

    // Giro Reports
    Route::get('kas/reports/giro', [GiroReportController::class, 'index'])
        ->name('kas.reports.giro')
        ->middleware('permission:laporan.giro-report.view');

});
