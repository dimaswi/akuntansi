<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule low stock check - run daily at 9:00 AM
Schedule::command('inventory:check-low-stock')
    ->dailyAt('09:00')
    ->timezone('Asia/Jakarta')
    ->onSuccess(function () {
        Log::info('Low stock check completed successfully');
    })
    ->onFailure(function () {
        Log::error('Low stock check failed');
    });

// Schedule stock opname reminders - run daily at 8:00 AM
Schedule::command('opname:send-reminders')
    ->dailyAt('08:00')
    ->timezone('Asia/Jakarta')
    ->onSuccess(function () {
        Log::info('Stock opname reminders sent successfully');
    })
    ->onFailure(function () {
        Log::error('Stock opname reminders failed');
    });
