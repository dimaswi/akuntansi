<?php

namespace App\Providers;

use App\Models\Permission;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Repository bindings
        $this->app->bind(
            \App\Repositories\Inventory\ItemCategoryRepositoryInterface::class,
            \App\Repositories\Inventory\ItemCategoryRepository::class
        );
        
        $this->app->bind(
            \App\Repositories\Inventory\DepartmentRepositoryInterface::class,
            \App\Repositories\Inventory\DepartmentRepository::class
        );
        
        $this->app->bind(
            \App\Repositories\Inventory\ItemRepositoryInterface::class,
            \App\Repositories\Inventory\ItemRepository::class
        );
        
        $this->app->bind(
            \App\Repositories\Inventory\SupplierRepositoryInterface::class,
            \App\Repositories\Inventory\SupplierRepository::class
        );
        
        $this->app->bind(
            \App\Repositories\Inventory\PurchaseRepositoryInterface::class,
            \App\Repositories\Inventory\PurchaseRepository::class
        );
        
        $this->app->bind(
            \App\Repositories\Inventory\RequisitionRepositoryInterface::class,
            \App\Repositories\Inventory\RequisitionRepository::class
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register gates for all permissions
        $this->registerGates();
    }

    /**
     * Register gates for all permissions from database
     */
    private function registerGates(): void
    {
        try {
            // Define gates for all permissions in database
            $permissions = Permission::all();
            
            foreach ($permissions as $permission) {
                Gate::define($permission->name, function ($user) use ($permission) {
                    return $user->hasPermission($permission->name);
                });
            }
        } catch (\Exception $e) {
            // Handle case where database is not yet migrated
            // This prevents errors during migration
        }
    }
}
