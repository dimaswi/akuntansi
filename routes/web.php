<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Inventory\ItemController;

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


require __DIR__.'/inventory.php';
require __DIR__.'/settings.php';
require __DIR__.'/master.php';
require __DIR__.'/akuntansi.php';
require __DIR__.'/kas.php';
require __DIR__.'/auth.php';
