<?php

use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\ClosingPeriodController;
use App\Http\Controllers\Settings\RevisionApprovalController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\Akuntansi\ClosingPeriodSetting;

Route::middleware('auth')->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/password', [PasswordController::class, 'edit'])->name('password.edit');
    Route::put('settings/password', [PasswordController::class, 'update'])->name('password.update');

    Route::get('settings/appearance', function () {
        return Inertia::render('settings/appearance');
    })->name('appearance');
    
    // ===== CLOSING PERIOD SETTINGS =====
    Route::get('settings/closing-periods', function () {
        // Get settings dari database
        $settings = DB::table('closing_period_settings')
            ->orderBy('group')
            ->orderBy('key')
            ->get();
        
        return Inertia::render('settings/closing-settings', [
            'settings' => $settings
        ]);
    })
        ->name('settings.closing-periods.index')
        ->middleware('permission:closing-period.manage-settings');
    
    Route::put('settings/closing-periods', function (\Illuminate\Http\Request $request) {
        // Update settings
        foreach ($request->all() as $key => $value) {
            DB::table('closing_period_settings')
                ->where('key', $key)
                ->update([
                    'value' => is_bool($value) ? ($value ? 'true' : 'false') : $value,
                    'updated_at' => now()
                ]);
        }
        
        // Clear cache after update
        ClosingPeriodSetting::clearCache();
        
        return back()->with('message', 'Settings berhasil diupdate');
    })
        ->name('settings.closing-periods.update')
        ->middleware('permission:closing-period.manage-settings');
    
    // ===== CLOSING PERIOD MANAGEMENT =====
    Route::prefix('settings/closing-periods')->name('settings.closing-periods.')->group(function () {
        Route::get('/list', [ClosingPeriodController::class, 'index'])
            ->name('list')
            ->middleware('permission:closing-period.view');
            
        Route::get('/create', [ClosingPeriodController::class, 'create'])
            ->name('create')
            ->middleware('permission:closing-period.create');
            
        Route::post('/store', [ClosingPeriodController::class, 'store'])
            ->name('store')
            ->middleware('permission:closing-period.create');
            
        Route::get('/{closingPeriod}', [ClosingPeriodController::class, 'show'])
            ->name('show')
            ->middleware('permission:closing-period.view');
            
        Route::get('/{closingPeriod}/edit', [ClosingPeriodController::class, 'edit'])
            ->name('edit')
            ->middleware('permission:closing-period.edit');
            
        Route::put('/{closingPeriod}', [ClosingPeriodController::class, 'update'])
            ->name('update')
            ->middleware('permission:closing-period.edit');
            
        Route::post('/{closingPeriod}/soft-close', [ClosingPeriodController::class, 'softClose'])
            ->name('soft-close')
            ->middleware('permission:closing-period.soft-close');
            
        Route::post('/{closingPeriod}/hard-close', [ClosingPeriodController::class, 'hardClose'])
            ->name('hard-close')
            ->middleware('permission:closing-period.hard-close');
            
        Route::post('/{closingPeriod}/reopen', [ClosingPeriodController::class, 'reopen'])
            ->name('reopen')
            ->middleware('permission:closing-period.reopen');
    });
    
    // ===== REVISION APPROVAL =====
    Route::prefix('settings/revision-approvals')->name('settings.revision-approvals.')->group(function () {
        Route::get('/', [RevisionApprovalController::class, 'index'])
            ->name('index')
            ->middleware('permission:closing-period.approve-revision');
            
        Route::get('/{revisionLog}', [RevisionApprovalController::class, 'show'])
            ->name('show')
            ->middleware('permission:closing-period.approve-revision');
            
        Route::post('/{revisionLog}/approve', [RevisionApprovalController::class, 'approve'])
            ->name('approve')
            ->middleware('permission:closing-period.approve-revision');
            
        Route::post('/{revisionLog}/reject', [RevisionApprovalController::class, 'reject'])
            ->name('reject')
            ->middleware('permission:closing-period.approve-revision');
            
        Route::post('/bulk-approve', [RevisionApprovalController::class, 'bulkApprove'])
            ->name('bulk-approve')
            ->middleware('permission:closing-period.approve-revision');
            
        Route::get('/statistics', [RevisionApprovalController::class, 'statistics'])
            ->name('statistics')
            ->middleware('permission:closing-period.approve-revision');
    });
});
