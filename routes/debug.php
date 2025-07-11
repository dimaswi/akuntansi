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
                'approval.outgoing-transactions.approve' => in_array('approval.outgoing-transactions.approve', $user->getAllPermissions()),
            ],
            'has_any_approval' => !empty(array_intersect([
                'approval.outgoing-transactions.approve'
            ], $user->getAllPermissions())),
        ]);
    });
});
