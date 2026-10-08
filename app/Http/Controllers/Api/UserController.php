<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $users = User::with('roles')->latest('id')->paginate(15);
        $roles = Role::all();

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

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'email_verified_at' => now(),
        ]);

        $user->assignRole($validated['role']);

        return response()->json([
            'success' => true,
            'message' => "User '{$user->name}' created successfully with role {$validated['role']}.",
            'user' => $user->load('roles'),
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => "required|email|unique:users,email,{$id}",
            'password' => 'nullable|string|min:6',
            'role' => 'required|exists:roles,name',
        ]);

        $updateData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
        ];

        if (!empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $user->update($updateData);
        $user->syncRoles([$validated['role']]);

        return response()->json([
            'success' => true,
            'message' => "User '{$user->name}' updated successfully.",
            'user' => $user->load('roles'),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        if ($user->id === auth()->id()) {
            return response()->json(['success' => false, 'message' => 'You cannot delete your own account.'], 422);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => "User deleted successfully.",
        ]);
    }
}
