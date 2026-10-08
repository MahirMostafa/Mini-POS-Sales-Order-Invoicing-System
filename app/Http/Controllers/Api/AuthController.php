<?php

namespace App\Http\Controllers\Api;

use App\Contracts\Repositories\UserRepositoryInterface;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function __construct(
        protected ?UserRepositoryInterface $userRepo = null
    ) {
    }

    public function me(): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json([
                'user' => null,
                'role' => null,
                'permissions' => [],
            ]);
        }

        $user->load('roles');

        return response()->json([
            'user' => $user,
            'role' => $user->roles->pluck('name')->first() ?? 'Admin',
            'permissions' => $user->getAllPermissions()->pluck('name'),
        ]);
    }

    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (Auth::attempt($credentials, $request->boolean('remember'))) {
            if ($request->hasSession()) {
                $request->session()->regenerate();
            }
            $user = Auth::user()->load('roles');

            return response()->json([
                'success' => true,
                'message' => "Welcome back, {$user->name}!",
                'user' => $user,
                'role' => $user->roles->pluck('name')->first() ?? 'Admin',
                'permissions' => $user->getAllPermissions()->pluck('name'),
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Invalid email or password.',
        ], 422);
    }

    public function quickLogin(int $userId): JsonResponse
    {
        $user = $this->userRepo ? $this->userRepo->findById($userId) : null;
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'User not found.'], 404);
        }

        Auth::login($user);
        if (request()->hasSession()) {
            request()->session()->regenerate();
        }

        return response()->json([
            'success' => true,
            'message' => "Logged in as {$user->name} ({$user->roles->pluck('name')->first()})",
            'user' => $user,
            'role' => $user->roles->pluck('name')->first() ?? 'Admin',
            'permissions' => $user->getAllPermissions()->pluck('name'),
        ]);
    }

    public function getDemoUsers(): JsonResponse
    {
        $users = $this->userRepo ? $this->userRepo->all() : collect([]);

        return response()->json([
            'success' => true,
            'users' => $users,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::logout();
        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully.',
        ]);
    }
}
