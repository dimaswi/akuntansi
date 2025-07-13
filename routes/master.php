<?php

use App\Http\Controllers\Master\RoleController;
use App\Http\Controllers\Master\UserController;
use App\Http\Controllers\Master\PermissionController;
use App\Http\Controllers\UserDepartmentController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    // User Management
    Route::get('master/users', [UserController::class, 'index'])->name('users.index')->middleware('permission:user.view');
    Route::get('master/users/create', [UserController::class, 'create'])->name('users.create')->middleware('permission:user.create');
    
    // User Department Assignment - HARUS SEBELUM {user} route
    Route::get('master/users/departments', [UserDepartmentController::class, 'index'])->name('users.departments.index')->middleware('permission:user.department.manage');
    Route::post('master/users/departments/bulk', [UserDepartmentController::class, 'bulkUpdate'])->name('users.departments.bulk')->middleware('permission:user.department.manage');
    Route::get('master/users/{user}/department', [UserDepartmentController::class, 'edit'])->name('users.departments.edit')->middleware('permission:user.department.manage');
    Route::put('master/users/{user}/department', [UserDepartmentController::class, 'update'])->name('users.departments.update')->middleware('permission:user.department.manage');
    
    // User CRUD - {user} route harus setelah route yang lebih spesifik
    Route::post('master/users', [UserController::class, 'store'])->name('users.store')->middleware('permission:user.create');
    Route::get('master/users/{user}', [UserController::class,'edit'])->name('users.edit')->middleware('permission:user.edit');
    Route::put('master/users/{user}', [UserController::class,'update'])->name('users.update')->middleware('permission:user.edit');
    Route::delete('master/users/{user}', [UserController::class,'destroy'])->name('users.destroy')->middleware('permission:user.delete');
    
    // Role Management
    Route::get('master/roles', [RoleController::class, 'index'])->name('roles.index')->middleware('permission:role.view');
    Route::get('master/roles/create', [RoleController::class, 'create'])->name('roles.create')->middleware('permission:role.create');
    Route::post('master/roles', [RoleController::class, 'store'])->name('roles.store')->middleware('permission:role.create');
    Route::get('master/roles/{role}', [RoleController::class, 'edit'])->name('roles.edit')->middleware('permission:role.edit');
    Route::put('master/roles/{role}', [RoleController::class, 'update'])->name('roles.update')->middleware('permission:role.edit');
    Route::delete('master/roles/{role}', [RoleController::class, 'destroy'])->name('roles.destroy')->middleware('permission:role.delete');

    // Permission Management
    Route::get('master/permissions', [PermissionController::class, 'index'])->name('permissions.index')->middleware('permission:permission.view');
    Route::get('master/permissions/create', [PermissionController::class, 'create'])->name('permissions.create')->middleware('permission:permission.create');
    Route::post('master/permissions', [PermissionController::class, 'store'])->name('permissions.store')->middleware('permission:permission.create');
    Route::get('master/permissions/{permission}', [PermissionController::class, 'edit'])->name('permissions.edit')->middleware('permission:permission.edit');
    Route::put('master/permissions/{permission}', [PermissionController::class, 'update'])->name('permissions.update')->middleware('permission:permission.edit');
    Route::delete('master/permissions/{permission}', [PermissionController::class, 'destroy'])->name('permissions.destroy')->middleware('permission:permission.delete');
});
