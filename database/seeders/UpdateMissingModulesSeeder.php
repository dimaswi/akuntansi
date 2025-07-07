<?php

namespace Database\Seeders;

use App\Models\Permission;
use Illuminate\Database\Seeder;

class UpdateMissingModulesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Update permissions that don't have modules
        $permissionsWithoutModule = Permission::whereNull('module')->get();
        
        foreach ($permissionsWithoutModule as $permission) {
            $module = $this->getModuleFromPermissionName($permission->name);
            $permission->update(['module' => $module]);
        }
        
        echo "Updated " . $permissionsWithoutModule->count() . " permissions with modules\n";
    }
    
    private function getModuleFromPermissionName($name)
    {
        if (str_starts_with($name, 'user.')) {
            return 'users';
        }
        
        if (str_starts_with($name, 'role.')) {
            return 'roles';
        }
        
        if (str_starts_with($name, 'permission.')) {
            return 'permissions';
        }
        
        if (str_starts_with($name, 'dashboard.')) {
            return 'dashboard';
        }
        
        if (str_starts_with($name, 'settings.')) {
            return 'settings';
        }
        
        if (str_starts_with($name, 'akuntansi.')) {
            return 'akuntansi';
        }
        
        if (str_starts_with($name, 'kas.')) {
            return 'kas';
        }
        
        // Default module for unknown permissions
        return 'general';
    }
}
