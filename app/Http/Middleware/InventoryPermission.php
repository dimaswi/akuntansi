<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class InventoryPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $permission, ?string $inventoryType = null): Response
    {
        $user = $request->user();
        
        if (!$user) {
            abort(401, 'Unauthorized');
        }

        // Check basic permission
        if (!$user->hasPermissionTo($permission)) {
            abort(403, 'Insufficient permissions');
        }

        // If inventory type is specified, check specific pharmacy permissions
        if ($inventoryType === 'pharmacy') {
            $item = $request->route('item');
            
            // If we have an item, check if it's pharmacy type
            if ($item && isset($item->inventory_type) && $item->inventory_type === 'pharmacy') {
                // Check if user has pharmacy management permissions for controlled substances
                if ($item->is_controlled_substance && !$user->hasPermissionTo('pharmacy.controlled_substance.manage')) {
                    abort(403, 'Insufficient permissions for controlled substances');
                }
                
                // Check prescription requirements
                if ($item->requires_prescription && !$user->hasPermissionTo('pharmacy.prescription.manage')) {
                    abort(403, 'Insufficient permissions for prescription items');
                }
            }
            
            // For creating pharmacy items, check from request data
            if ($request->isMethod('post') && $request->input('inventory_type') === 'pharmacy') {
                if ($request->input('is_controlled_substance') && !$user->hasPermissionTo('pharmacy.controlled_substance.manage')) {
                    abort(403, 'Insufficient permissions for controlled substances');
                }
                
                if ($request->input('requires_prescription') && !$user->hasPermissionTo('pharmacy.prescription.manage')) {
                    abort(403, 'Insufficient permissions for prescription items');
                }
            }
        }

        return $next($request);
    }
}
