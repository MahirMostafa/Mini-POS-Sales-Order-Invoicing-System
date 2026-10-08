<?php

namespace App\Http\Controllers\Api;

use App\Contracts\Repositories\RolePermissionRepositoryInterface;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RolePermissionController extends Controller
{
    public function __construct(
        protected RolePermissionRepositoryInterface $rolePermissionRepo
    ) {
    }

    public function index(): JsonResponse
    {
        $roles = $this->rolePermissionRepo->getAllRoles();
        $permissions = $this->rolePermissionRepo->getAllPermissions();

        return response()->json([
            'success' => true,
            'roles' => $roles,
            'permissions' => $permissions,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:roles,name|max:50',
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,name',
        ]);

        $role = $this->rolePermissionRepo->createRole($validated['name'], $validated['permissions'] ?? []);

        return response()->json([
            'success' => true,
            'message' => "Role '{$role->name}' created successfully.",
            'role' => $role,
        ], 201);
    }

    public function updatePermissions(Request $request, int $roleId): JsonResponse
    {
        $role = $this->rolePermissionRepo->findRoleById($roleId);
        if (!$role) {
            return response()->json(['success' => false, 'message' => 'Role not found.'], 404);
        }

        $validated = $request->validate([
            'permissions' => 'required|array',
            'permissions.*' => 'exists:permissions,name',
        ]);

        $this->rolePermissionRepo->updateRolePermissions($role, $validated['permissions']);

        return response()->json([
            'success' => true,
            'message' => "Permissions for role '{$role->name}' updated successfully.",
            'role' => $role->fresh(['permissions']),
        ]);
    }
}
