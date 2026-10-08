<?php

namespace App\Repositories;

use App\Contracts\Repositories\RolePermissionRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class EloquentRolePermissionRepository implements RolePermissionRepositoryInterface
{
    public function getAllRoles(): Collection
    {
        return Role::with('permissions')->get();
    }

    public function getAllPermissions(): Collection
    {
        return Permission::all();
    }

    public function findRoleById(int $id): ?Role
    {
        return Role::with('permissions')->find($id);
    }

    public function createRole(string $name, array $permissions = []): Role
    {
        $role = Role::create(['name' => $name, 'guard_name' => 'web']);
        if (!empty($permissions)) {
            $role->syncPermissions($permissions);
        }

        return $role->load('permissions');
    }

    public function updateRolePermissions(Role $role, array $permissions): bool
    {
        $role->syncPermissions($permissions);
        return true;
    }
}
