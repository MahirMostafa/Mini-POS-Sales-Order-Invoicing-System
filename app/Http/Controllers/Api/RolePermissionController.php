<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolePermissionController extends Controller
{
    public function index(): JsonResponse
    {
        $roles = Role::with('permissions')->get();
        $permissions = Permission::all();

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

        $role = Role::create(['name' => $validated['name'], 'guard_name' => 'web']);
        if (!empty($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        return response()->json([
            'success' => true,
            'message' => "Role '{$role->name}' created successfully.",
            'role' => $role->load('permissions'),
        ], 201);
    }

    public function updatePermissions(Request $request, int $roleId): JsonResponse
    {
        $role = Role::findOrFail($roleId);

        $validated = $request->validate([
            'permissions' => 'required|array',
            'permissions.*' => 'exists:permissions,name',
        ]);

        $role->syncPermissions($validated['permissions']);

        return response()->json([
            'success' => true,
            'message' => "Permissions for role '{$role->name}' updated successfully.",
            'role' => $role->load('permissions'),
        ]);
    }
}
