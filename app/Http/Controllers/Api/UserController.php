<?php

namespace App\Http\Controllers\Api;

use App\Contracts\Repositories\RolePermissionRepositoryInterface;
use App\Contracts\Repositories\UserRepositoryInterface;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function __construct(
        protected UserRepositoryInterface $userRepo,
        protected RolePermissionRepositoryInterface $roleRepo
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $users = $this->userRepo->paginate($request->integer('per_page', 15));
        $roles = $this->roleRepo->getAllRoles();

        return response()->json([
            'success' => true,
            'users' => $users,
            'roles' => $roles,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'required|exists:roles,name',
        ]);

        $user = $this->userRepo->create($validated, $validated['role']);

        return response()->json([
            'success' => true,
            'message' => "User '{$user->name}' created successfully with role {$validated['role']}.",
            'user' => $user,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $user = $this->userRepo->findById($id);
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'User not found.'], 404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => "required|email|unique:users,email,{$id}",
            'password' => 'nullable|string|min:6',
            'role' => 'required|exists:roles,name',
        ]);

        $this->userRepo->update($user, $validated, $validated['role']);

        return response()->json([
            'success' => true,
            'message' => "User '{$user->name}' updated successfully.",
            'user' => $user->fresh(['roles']),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $user = $this->userRepo->findById($id);
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'User not found.'], 404);
        }

        if ($user->id === auth()->id()) {
            return response()->json(['success' => false, 'message' => 'You cannot delete your own account.'], 422);
        }

        $this->userRepo->delete($user);

        return response()->json([
            'success' => true,
            'message' => "User deleted successfully.",
        ]);
    }
}
