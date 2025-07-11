<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/debug/permissions', function (Request $request) {
        $user = $request->user();
        $user->load(['role.permissions']);
        
        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'nip' => $user->nip,
                'role' => $user->role ? [
                    'name' => $user->role->name,
                    'display_name' => $user->role->display_name,
                ] : null,
            ],
            'permissions' => $user->getAllPermissions(),
            'approval_permissions_check' => [
                'approval.cash-transactions.approve' => in_array('approval.cash-transactions.approve', $user->getAllPermissions()),
                'approval.journal-posting.approve' => in_array('approval.journal-posting.approve', $user->getAllPermissions()),
                'approval.monthly-closing.approve' => in_array('approval.monthly-closing.approve', $user->getAllPermissions()),
            ],
            'has_any_approval' => !empty(array_intersect([
                'approval.cash-transactions.approve',
                'approval.journal-posting.approve', 
                'approval.monthly-closing.approve'
            ], $user->getAllPermissions())),
        ]);
    });
});
