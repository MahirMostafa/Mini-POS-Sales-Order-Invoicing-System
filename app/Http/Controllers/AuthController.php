<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\UserRepositoryInterface;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

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

    public function generateCaptcha(): JsonResponse
    {
        $num1 = random_int(4, 18);
        $num2 = random_int(2, 9);
        $ops = ['+', '-', '×'];
        $op = $ops[array_rand($ops)];

        if ($op === '+') {
            $question = "{$num1} + {$num2}";
            $answer = (string) ($num1 + $num2);
        } elseif ($op === '-') {
            if ($num1 < $num2) {
                [$num1, $num2] = [$num2, $num1];
            }
            $question = "{$num1} - {$num2}";
            $answer = (string) ($num1 - $num2);
        } else {
            $n1 = random_int(2, 9);
            $n2 = random_int(2, 9);
            $question = "{$n1} × {$n2}";
            $answer = (string) ($n1 * $n2);
        }

        $captchaKey = (string) Str::uuid();

        // Cache the captcha answer for 5 minutes
        Cache::put("login_captcha:{$captchaKey}", $answer, now()->addMinutes(5));

        $svg = $this->renderCaptchaSvg($question);

        return response()->json([
            'success' => true,
            'captcha_key' => $captchaKey,
            'question' => "{$question} = ?",
            'svg' => $svg,
        ]);
    }

    protected function renderCaptchaSvg(string $text): string
    {
        $display = "{$text} = ?";
        $lines = '';
        for ($i = 0; $i < 3; $i++) {
            $x1 = random_int(0, 140);
            $y1 = random_int(0, 40);
            $x2 = random_int(0, 140);
            $y2 = random_int(0, 40);
            $lines .= "<line x1='{$x1}' y1='{$y1}' x2='{$x2}' y2='{$y2}' stroke='rgba(99, 102, 241, 0.25)' stroke-width='1.5' stroke-dasharray='3,3'/>";
        }

        return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 140 40' class='w-full h-full select-none rounded-xl'>
            <defs>
                <linearGradient id='cg' x1='0%' y1='0%' x2='100%' y2='100%'>
                    <stop offset='0%' stop-color='#f8fafc'/>
                    <stop offset='100%' stop-color='#eef2ff'/>
                </linearGradient>
            </defs>
            <rect width='100%' height='100%' fill='url(#cg)' rx='10' stroke='#e2e8f0' stroke-width='1'/>
            {$lines}
            <text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-family='monospace' font-size='18' font-weight='900' fill='#4338ca' letter-spacing='2'>
                {$display}
            </text>
        </svg>";
    }

    public function login(Request $request): JsonResponse
    {
        $throttleKey = Str::transliterate(Str::lower($request->input('email', '')) . '|' . $request->ip());
        $maxAttempts = 5;
        $decaySeconds = 60;

        // 1. Check Rate Limiter
        if (RateLimiter::tooManyAttempts($throttleKey, $maxAttempts)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return response()->json([
                'success' => false,
                'rate_limited' => true,
                'retry_after' => $seconds,
                'message' => "Too many failed login attempts. Please wait {$seconds} second(s) before trying again.",
            ], 429);
        }

        // 2. Validate Credentials & Captcha input
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
            'captcha_key' => 'required|string',
            'captcha_answer' => 'required|string',
        ]);

        // 3. Verify Captcha
        $expectedAnswer = Cache::pull("login_captcha:{$request->captcha_key}");
        if (!$expectedAnswer || trim((string) $request->captcha_answer) !== (string) $expectedAnswer) {
            RateLimiter::hit($throttleKey, $decaySeconds);
            $retriesLeft = RateLimiter::retriesLeft($throttleKey, $maxAttempts);

            return response()->json([
                'success' => false,
                'captcha_error' => true,
                'attempts_left' => $retriesLeft,
                'message' => 'Security CAPTCHA verification failed. Please solve the new challenge.',
            ], 422);
        }

        // 4. Attempt Authentication
        $credentials = $request->only('email', 'password');
        if (Auth::attempt($credentials, $request->boolean('remember'))) {
            RateLimiter::clear($throttleKey);

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

        // 5. Increment Rate Limiter on Failed Credentials
        RateLimiter::hit($throttleKey, $decaySeconds);
        $retriesLeft = RateLimiter::retriesLeft($throttleKey, $maxAttempts);

        return response()->json([
            'success' => false,
            'attempts_left' => $retriesLeft,
            'message' => $retriesLeft > 0 
                ? "Invalid email or password. ({$retriesLeft} attempt(s) remaining)"
                : 'Invalid credentials. You have exceeded maximum login attempts.',
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
        $demoEmails = [
            'admin@pos.com',
            'accountant1@pos.com',
            'counter1@pos.com',
        ];

        $users = \App\Models\User::with('roles')
            ->whereIn('email', $demoEmails)
            ->get()
            ->sortBy(function ($user) use ($demoEmails) {
                return array_search($user->email, $demoEmails);
            })
            ->values();

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
