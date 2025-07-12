<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Route::get('/', function () {
//     return Inertia::render('welcome');
// })->name('home');

Route::get('/', function () {
    return redirect('/login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

require __DIR__.'/settings.php';
require __DIR__.'/master.php';
require __DIR__.'/akuntansi.php';
require __DIR__.'/kas.php';
require __DIR__.'/auth.php';
<<<<<<< Updated upstream
=======
require __DIR__.'/approval.php';
require __DIR__.'/monthly-closing.php';
require __DIR__.'/inventory.php';
require __DIR__.'/department.php';
require __DIR__.'/department-stock.php';
require __DIR__.'/inventory-transfers.php';
require __DIR__.'/debug.php';
>>>>>>> Stashed changes
