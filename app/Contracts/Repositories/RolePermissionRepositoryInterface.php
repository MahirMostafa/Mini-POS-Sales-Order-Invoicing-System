<?php

namespace App\Contracts\Repositories;

use Illuminate\Database\Eloquent\Collection;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

interface RolePermissionRepositoryInterface
{
    public function getAllRoles(): Collection;
    public function getAllPermissions(): Collection;
    public function findRoleById(int $id): ?Role;
    public function createRole(string $name, array $permissions = []): Role;
    public function updateRolePermissions(Role $role, array $permissions): bool;
}
